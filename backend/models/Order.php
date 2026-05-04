<?php
/**
 * Order Model
 */
class Order {
    private $conn;
    private $table = 'orders';

    public function __construct($db) {
        $this->conn = $db;
    }

    /** Create a new order with items */
    public function create($data, $items) {
        $this->conn->beginTransaction();

        try {
            // Calculate total price
            $totalPrice = 0;
            $menuItemIds = array_column($items, 'menu_item_id');
            $placeholders = implode(',', array_fill(0, count($menuItemIds), '?'));

            $stmt = $this->conn->prepare(
                "SELECT id, price, is_available FROM menu_items WHERE id IN ({$placeholders})"
            );
            $stmt->execute($menuItemIds);
            $menuItems = $stmt->fetchAll();
            $priceMap = [];

            foreach ($menuItems as $mi) {
                if (!$mi['is_available']) {
                    $this->conn->rollBack();
                    return ['error' => "Item ID {$mi['id']} is currently unavailable"];
                }
                $priceMap[$mi['id']] = $mi['price'];
            }

            foreach ($items as $item) {
                if (!isset($priceMap[$item['menu_item_id']])) {
                    $this->conn->rollBack();
                    return ['error' => "Invalid menu item ID: {$item['menu_item_id']}"];
                }
                $totalPrice += $priceMap[$item['menu_item_id']] * $item['quantity'];
            }

            // Insert order
            $stmt = $this->conn->prepare(
                "INSERT INTO {$this->table} (table_id, customer_name, total_price, notes, status) 
                 VALUES (:table_id, :customer_name, :total_price, :notes, 'pending')"
            );
            $stmt->execute([
                'table_id'      => $data['table_id'],
                'customer_name' => $data['customer_name'] ?? 'Guest',
                'total_price'   => $totalPrice,
                'notes'         => $data['notes'] ?? ''
            ]);
            $orderId = $this->conn->lastInsertId();

            // Insert order items
            $stmt = $this->conn->prepare(
                "INSERT INTO order_items (order_id, menu_item_id, quantity, unit_price, customization) 
                 VALUES (:order_id, :menu_item_id, :quantity, :unit_price, :customization)"
            );
            foreach ($items as $item) {
                $stmt->execute([
                    'order_id'      => $orderId,
                    'menu_item_id'  => $item['menu_item_id'],
                    'quantity'      => $item['quantity'],
                    'unit_price'    => $priceMap[$item['menu_item_id']],
                    'customization' => $item['customization'] ?? ''
                ]);
            }

            // Update table status to occupied
            $stmt = $this->conn->prepare(
                "UPDATE tables_info SET status = 'occupied' WHERE id = :id"
            );
            $stmt->execute(['id' => $data['table_id']]);

            $this->conn->commit();
            return ['order_id' => $orderId, 'total_price' => $totalPrice, 'status' => 'pending'];

        } catch (Exception $e) {
            $this->conn->rollBack();
            return ['error' => 'Failed to create order: ' . $e->getMessage()];
        }
    }

    /** Get single order with items */
    public function getById($id) {
        $stmt = $this->conn->prepare(
            "SELECT o.*, t.table_number 
             FROM {$this->table} o 
             JOIN tables_info t ON o.table_id = t.id 
             WHERE o.id = :id"
        );
        $stmt->execute(['id' => $id]);
        $order = $stmt->fetch();

        if (!$order) return null;

        // Get order items
        $stmt = $this->conn->prepare(
            "SELECT oi.*, m.name as item_name, m.image_url 
             FROM order_items oi 
             JOIN menu_items m ON oi.menu_item_id = m.id 
             WHERE oi.order_id = :order_id"
        );
        $stmt->execute(['order_id' => $id]);
        $order['items'] = $stmt->fetchAll();

        return $order;
    }

    /** Get orders filtered by status */
    public function getFiltered($statuses = [], $limit = 50, $offset = 0) {
        $sql = "SELECT o.*, t.table_number 
                FROM {$this->table} o 
                JOIN tables_info t ON o.table_id = t.id";
        $params = [];

        if (!empty($statuses)) {
            $placeholders = [];
            foreach ($statuses as $i => $status) {
                $key = "status_{$i}";
                $placeholders[] = ":{$key}";
                $params[$key] = $status;
            }
            $sql .= " WHERE o.status IN (" . implode(',', $placeholders) . ")";
        }

        $sql .= " ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset";

        $stmt = $this->conn->prepare($sql);
        foreach ($params as $key => $val) {
            $stmt->bindValue($key, $val);
        }
        $stmt->bindValue('limit', (int)$limit, PDO::PARAM_INT);
        $stmt->bindValue('offset', (int)$offset, PDO::PARAM_INT);
        $stmt->execute();
        $orders = $stmt->fetchAll();

        // Fetch items for each order
        $itemStmt = $this->conn->prepare(
            "SELECT oi.*, m.name as item_name, m.image_url 
             FROM order_items oi 
             JOIN menu_items m ON oi.menu_item_id = m.id 
             WHERE oi.order_id = :order_id"
        );
        foreach ($orders as &$order) {
            $itemStmt->execute(['order_id' => $order['id']]);
            $order['items'] = $itemStmt->fetchAll();
        }

        return $orders;
    }

    /** Update order status */
    public function updateStatus($id, $status, $preparedBy = null) {
        $allowed = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
        if (!in_array($status, $allowed)) {
            return false;
        }

        $sql = "UPDATE {$this->table} SET status = :status";
        $params = ['id' => $id, 'status' => $status];
        
        if ($preparedBy !== null) {
            $sql .= ", prepared_by = :prepared_by";
            $params['prepared_by'] = $preparedBy;
        }
        
        $sql .= " WHERE id = :id";

        $stmt = $this->conn->prepare($sql);
        $result = $stmt->execute($params);

        // If delivered or cancelled, free the table
        if ($result && in_array($status, ['delivered', 'cancelled'])) {
            $order = $this->getById($id);
            if ($order) {
                // Check if table has other active orders
                $stmt = $this->conn->prepare(
                    "SELECT COUNT(*) as cnt FROM {$this->table} 
                     WHERE table_id = :table_id AND status NOT IN ('delivered', 'cancelled')"
                );
                $stmt->execute(['table_id' => $order['table_id']]);
                $row = $stmt->fetch();
                if ($row['cnt'] == 0) {
                    $stmt = $this->conn->prepare("UPDATE tables_info SET status = 'free' WHERE id = :id");
                    $stmt->execute(['id' => $order['table_id']]);
                }
            }
        }

        return $result;
    }

    /** Get daily statistics */
    public function getDailyStats() {
        $today = date('Y-m-d');

        // Total orders today
        $stmt = $this->conn->prepare(
            "SELECT COUNT(*) as total_orders, COALESCE(SUM(total_price), 0) as total_revenue 
             FROM {$this->table} WHERE DATE(created_at) = :today AND status != 'cancelled'"
        );
        $stmt->execute(['today' => $today]);
        $stats = $stmt->fetch();

        // Orders by status
        $stmt = $this->conn->prepare(
            "SELECT status, COUNT(*) as count FROM {$this->table} 
             WHERE DATE(created_at) = :today GROUP BY status"
        );
        $stmt->execute(['today' => $today]);
        $stats['by_status'] = $stmt->fetchAll();

        // Top items
        $stmt = $this->conn->prepare(
            "SELECT m.name, SUM(oi.quantity) as total_qty, SUM(oi.quantity * oi.unit_price) as total_sales
             FROM order_items oi 
             JOIN orders o ON oi.order_id = o.id 
             JOIN menu_items m ON oi.menu_item_id = m.id 
             WHERE DATE(o.created_at) = :today AND o.status != 'cancelled'
             GROUP BY m.id ORDER BY total_qty DESC LIMIT 5"
        );
        $stmt->execute(['today' => $today]);
        $stats['top_items'] = $stmt->fetchAll();

        // Hourly orders
        $stmt = $this->conn->prepare(
            "SELECT HOUR(created_at) as hour, COUNT(*) as count 
             FROM {$this->table} WHERE DATE(created_at) = :today 
             GROUP BY HOUR(created_at) ORDER BY hour"
        );
        $stmt->execute(['today' => $today]);
        $stats['hourly'] = $stmt->fetchAll();

        // Chef Leaderboard
        $stmt = $this->conn->prepare(
            "SELECT prepared_by, COUNT(*) as orders_count 
             FROM {$this->table} 
             WHERE DATE(created_at) = :today 
               AND prepared_by IS NOT NULL 
               AND status IN ('ready', 'delivered') 
             GROUP BY prepared_by 
             ORDER BY orders_count DESC"
        );
        $stmt->execute(['today' => $today]);
        $stats['leaderboard'] = $stmt->fetchAll();

        return $stats;
    }
}
