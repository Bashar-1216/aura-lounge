<?php
/**
 * User Model
 */
class User {
    private $conn;
    private $table = 'users';

    public function __construct($db) {
        $this->conn = $db;
    }

    /** Authenticate user by email and password */
    public function authenticate($email, $password) {
        $stmt = $this->conn->prepare(
            "SELECT * FROM {$this->table} WHERE email = :email"
        );
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            return null;
        }

        unset($user['password_hash']);
        return $user;
    }

    /** Get user by ID */
    public function getById($id) {
        $stmt = $this->conn->prepare(
            "SELECT id, name, email, role, created_at FROM {$this->table} WHERE id = :id"
        );
        $stmt->execute(['id' => $id]);
        return $stmt->fetch();
    }
}
