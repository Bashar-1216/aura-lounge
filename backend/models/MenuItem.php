<?php
/**
 * MenuItem Model
 */
class MenuItem {
    private $conn;
    private $table = 'menu_items';

    public function __construct($db) {
        $this->conn = $db;
    }

    /** Get all menu items, optionally filtered by category */
    public function getAll($categoryId = null, $availableOnly = true) {
        $sql = "SELECT m.*, c.name as category_name, c.icon as category_icon 
                FROM {$this->table} m 
                JOIN categories c ON m.category_id = c.id";
        $params = [];
        $conditions = [];

        if ($availableOnly) {
            $conditions[] = "m.is_available = 1";
            $conditions[] = "c.is_active = 1";
        }
        if ($categoryId) {
            $conditions[] = "m.category_id = :category_id";
            $params['category_id'] = $categoryId;
        }

        if (!empty($conditions)) {
            $sql .= " WHERE " . implode(' AND ', $conditions);
        }
        $sql .= " ORDER BY c.sort_order ASC, m.is_featured DESC, m.name ASC";

        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /** Get all items grouped by category */
    public function getAllGrouped($availableOnly = true) {
        $items = $this->getAll(null, $availableOnly);
        $grouped = [];

        foreach ($items as $item) {
            $catId = $item['category_id'];
            if (!isset($grouped[$catId])) {
                $grouped[$catId] = [
                    'id'    => $catId,
                    'name'  => $item['category_name'],
                    'icon'  => $item['category_icon'],
                    'items' => []
                ];
            }
            $grouped[$catId]['items'][] = $item;
        }

        return array_values($grouped);
    }

    /** Get single item by ID */
    public function getById($id) {
        $stmt = $this->conn->prepare(
            "SELECT m.*, c.name as category_name FROM {$this->table} m 
             JOIN categories c ON m.category_id = c.id WHERE m.id = :id"
        );
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /** Create a new menu item */
    public function create($data) {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table} 
             (category_id, name, description, price, image_url, is_available, is_featured, tags, prep_time_mins) 
             VALUES (:category_id, :name, :description, :price, :image_url, :is_available, :is_featured, :tags, :prep_time_mins)"
        );
        $stmt->execute([
            'category_id'    => $data['category_id'],
            'name'           => $data['name'],
            'description'    => $data['description'] ?? '',
            'price'          => $data['price'],
            'image_url'      => $data['image_url'] ?? '',
            'is_available'   => $data['is_available'] ?? 1,
            'is_featured'    => $data['is_featured'] ?? 0,
            'tags'           => $data['tags'] ?? '',
            'prep_time_mins' => $data['prep_time_mins'] ?? 15
        ]);
        return $this->conn->lastInsertId();
    }

    /** Update a menu item */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];
        $allowed = ['category_id', 'name', 'description', 'price', 'image_url', 'is_available', 'is_featured', 'tags', 'prep_time_mins'];

        foreach ($allowed as $field) {
            if (isset($data[$field])) {
                $fields[] = "{$field} = :{$field}";
                $params[$field] = $data[$field];
            }
        }

        if (empty($fields)) return false;

        $sql = "UPDATE {$this->table} SET " . implode(', ', $fields) . " WHERE id = :id";
        $stmt = $this->conn->prepare($sql);
        return $stmt->execute($params);
    }

    /** Delete a menu item */
    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    /** Toggle availability */
    public function toggleAvailability($id) {
        $stmt = $this->conn->prepare(
            "UPDATE {$this->table} SET is_available = NOT is_available WHERE id = :id"
        );
        return $stmt->execute(['id' => $id]);
    }
}
