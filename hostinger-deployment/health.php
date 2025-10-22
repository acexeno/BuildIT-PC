<?php
header('Content-Type: application/json');

$health = [
    'status' => 'ok',
    'timestamp' => date('Y-m-d H:i:s'),
    'environment' => 'production',
    'php_version' => PHP_VERSION,
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
];

// Test database connection
try {
    require_once __DIR__ . '/backend/config/database.php';
    $pdo = get_db_connection();
    $health['database'] = 'connected';
} catch (Exception $e) {
    $health['database'] = 'error: ' . $e->getMessage();
    $health['status'] = 'error';
}

echo json_encode($health, JSON_PRETTY_PRINT);
?>
