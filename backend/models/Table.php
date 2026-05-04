<?php
/**
 * Table Model
 */
class TableModel {
    private $conn;
    private $table = 'tables_info';

    public function __construct($db) {
        $this->conn = $db;
    }

    /** Get all tables */
    public function getAll() {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} ORDER BY table_number ASC");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /** Get single table */
    public function getById($id) {
        $stmt = $this->conn->prepare("SELECT * FROM {$this->table} WHERE id = :id");
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }

    /** Verify table exists */
    public function exists($id) {
        $stmt = $this->conn->prepare("SELECT COUNT(*) as cnt FROM {$this->table} WHERE id = :id");
        $stmt->execute(['id' => $id]);
        $row = $stmt->fetch();
        return $row['cnt'] > 0;
    }

    /** Update table status */
    public function updateStatus($id, $status) {
        $stmt = $this->conn->prepare("UPDATE {$this->table} SET status = :status WHERE id = :id");
        return $stmt->execute(['id' => $id, 'status' => $status]);
    }
}
