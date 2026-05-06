<?php
/**
 * Staff Profile Model
 */
class Staff {
    private $conn;
    private $table = "staff_profiles";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function getAll($onlyActive = false) {
        $sql = "SELECT * FROM {$this->table}";
        if ($onlyActive) $sql .= " WHERE is_active = 1";
        $sql .= " ORDER BY name ASC";
        
        $stmt = $this->conn->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll();
    }

    public function create($name) {
        $stmt = $this->conn->prepare("INSERT INTO {$this->table} (name) VALUES (:name)");
        return $stmt->execute(['name' => $name]);
    }

    public function delete($id) {
        $stmt = $this->conn->prepare("DELETE FROM {$this->table} WHERE id = :id");
        return $stmt->execute(['id' => $id]);
    }

    public function toggleActive($id, $status) {
        $stmt = $this->conn->prepare("UPDATE {$this->table} SET is_active = :status WHERE id = :id");
        return $stmt->execute(['id' => $id, 'status' => $status]);
    }
}
