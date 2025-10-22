<?php
// Simple OTP test endpoint for local development
// Access via: http://localhost/capstone2/test_otp_endpoint.php

require_once __DIR__ . '/backend/config/env.php';
require_once __DIR__ . '/backend/config/database.php';
require_once __DIR__ . '/backend/api/otp.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    $pdo = get_db_connection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Show OTP system status
        $response = [
            'status' => 'OTP System is running',
            'environment' => env('APP_ENV', 'unknown'),
            'debug' => env('APP_DEBUG', '0'),
            'mail_fake' => env('MAIL_FAKE', '0'),
            'database_connected' => true,
            'timestamp' => date('Y-m-d H:i:s')
        ];
        
        // Check OTP table
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM otp_codes");
        $count = $stmt->fetch()['count'];
        $response['otp_records_count'] = $count;
        
        echo json_encode($response, JSON_PRETTY_PRINT);
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle OTP requests
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            $input = $_POST;
        }
        
        $action = $input['action'] ?? '';
        
        if ($action === 'request') {
            // OTP Request
            $_POST = [
                'email' => $input['email'] ?? '',
                'purpose' => $input['purpose'] ?? 'login'
            ];
            
            ob_start();
            handleOtpRequest($pdo);
            $output = ob_get_clean();
            echo $output;
            
        } elseif ($action === 'verify') {
            // OTP Verify
            $_POST = [
                'email' => $input['email'] ?? '',
                'purpose' => $input['purpose'] ?? 'login',
                'code' => $input['code'] ?? ''
            ];
            
            ob_start();
            handleOtpVerify($pdo);
            $output = ob_get_clean();
            echo $output;
            
        } else {
            echo json_encode(['error' => 'Invalid action. Use "request" or "verify"']);
        }
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
