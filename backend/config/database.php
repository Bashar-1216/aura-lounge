<?php
/**
 * Database Connection Class
 * Singleton PDO wrapper for MySQL
 */
class Database {
    private $host = 'sql201.infinityfree.com';
    private $db_name = 'if0_41828969_aura_lounge';
    private $username = 'if0_41828969';
    private $password = 'Xk0v3V3JlfKTa0K';
    private $conn = null;

    /**
     * Get database connection
     * @return PDO
     */
    public function getConnection() {
        if ($this->conn !== null) {
            return $this->conn;
        }

        try {
            $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE  => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES    => false,
            ];
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Database connection failed: ' . $e->getMessage()
            ]);
            exit;
        }

        return $this->conn;
    }
}
