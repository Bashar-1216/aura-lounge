<?php
/**
 * Category Model
 */
class Category {
    private $conn;
    private $table = 'categories';

    public function __construct($db) {
        $this->conn = $db;
    }

    /** Get all active categories ordered by sort_order */
    public function getAll($activeOnly = true) {
        $sql = "SELECT * FROM {$this->table}";
        if ($activeOnly) {
            $sql .= " WHERE is_active = 1";
        }
        $sql .= " ORDER BY sort_order ASC";
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /** Get single category by ID */
    public function getById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /** Create a new category */
    public function create($data) {
        $stmt = $this->conn->prepare(
            "INSERT INTO {$this->table} (name, icon, sort_order, is_active) VALUES (:name, :icon, :sort_order, :is_active)"
        );
        $stmt->execute([
            'name'       => $data['name'],
            'icon'       => $data['icon'] ?? '',
            'sort_order' => $data['sort_order'] ?? 0,
            'is_active'  => $data['is_active'] ?? 1
        ]);
        return $this->conn->lastInsertId();
    }

    /** Update a category */
    public function update($id, $data) {
        $fields = [];
        $params = ['id' => $id];

        foreach (['name', 'icon', 'sort_order', 'is_active'] as $field) {
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

    /** Delete a category */
    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }
}
