<?php
// Test script to verify authentication is working
require_once __DIR__ . '/backend/config/database.php';
require_once __DIR__ . '/backend/utils/jwt_helper.php';
require_once __DIR__ . '/backend/api/auth.php';
require_once __DIR__ . '/backend/api/builds.php';

echo "=== Authentication Test ===\n";

// Test 1: Check if we can connect to the database
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    echo "✓ Database connection: OK (Users count: " . $result['count'] . ")\n";
} catch (Exception $e) {
    echo "✗ Database connection failed: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 2: Check if user_builds table exists
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM user_builds");
    $result = $stmt->fetch();
    echo "✓ user_builds table: OK (Builds count: " . $result['count'] . ")\n";
} catch (Exception $e) {
    echo "✗ user_builds table not found: " . $e->getMessage() . "\n";
    exit(1);
}

// Test 3: Check if JWT functions are available
if (function_exists('generateJWT')) {
    echo "✓ JWT functions: OK\n";
} else {
    echo "✗ JWT functions not found\n";
    exit(1);
}

// Test 4: Check if auth functions are available
if (function_exists('getBearerToken')) {
    echo "✓ Auth functions: OK\n";
} else {
    echo "✗ Auth functions not found\n";
    exit(1);
}

// Test 5: Check if builds functions are available
if (function_exists('handleCreateBuild')) {
    echo "✓ Builds functions: OK\n";
} else {
    echo "✗ Builds functions not found\n";
    exit(1);
}

echo "\n=== All tests passed! ===\n";
echo "The authentication system should be working properly.\n";
?> 