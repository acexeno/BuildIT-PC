<?php
// Direct Hostinger database configuration
// This bypasses .env loading issues

function get_hostinger_db_connection() {
    $host = 'localhost';
    $db   = 'u709288172_builditpc_db';
    $user = 'u709288172_sims';
    $pass = 'Egiesims1@';
    $port = '3306';
    $charset = 'utf8mb4';

    $dsn = "mysql:host=$host;port=$port;dbname=$db;charset=$charset";
    
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, $user, $pass, $options);
        
        // Set timezone
        $pdo->exec("SET time_zone = '+08:00'");
        
        return $pdo;
    } catch (PDOException $e) {
        error_log('[DB] Hostinger connection failed: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit();
    }
}
?>
