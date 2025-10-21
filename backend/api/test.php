<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => 'System is working properly!',
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => 'PHP ' . phpversion(),
    'security_status' => 'SECURED'
]);
?>
