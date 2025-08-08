<?php
require_once __DIR__ . '/backend/config/database.php';

echo "=== Testing Public Builds Feature ===\n\n";

try {
    $pdo = get_db_connection();
    
    // Test 1: Check if is_public column exists
    echo "1. Checking if is_public column exists...\n";
    $stmt = $pdo->query("DESCRIBE user_builds");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    if (in_array('is_public', $columns)) {
        echo "   ✓ is_public column exists\n";
    } else {
        echo "   ✗ is_public column missing\n";
    }
    
    // Test 2: Check current builds
    echo "\n2. Checking current builds...\n";
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM user_builds");
    $total = $stmt->fetch()['total'];
    echo "   Total builds: $total\n";
    
    $stmt = $pdo->query("SELECT COUNT(*) as public FROM user_builds WHERE is_public = 1");
    $public = $stmt->fetch()['public'];
    echo "   Public builds: $public\n";
    
    // Test 3: Test public builds API endpoint
    echo "\n3. Testing public builds API endpoint...\n";
    $url = "http://localhost/capstone2/backend/api/index.php?endpoint=builds&public=1";
    $response = file_get_contents($url);
    if ($response !== false) {
        $data = json_decode($response, true);
        if ($data && isset($data['success']) && $data['success']) {
            echo "   ✓ API endpoint working correctly\n";
            echo "   Response: " . json_encode($data) . "\n";
        } else {
            echo "   ✗ API endpoint returned error\n";
            echo "   Response: $response\n";
        }
    } else {
        echo "   ✗ Could not access API endpoint\n";
    }
    
    // Test 4: Show sample build data structure
    echo "\n4. Sample build data structure...\n";
    $stmt = $pdo->query("SELECT * FROM user_builds LIMIT 1");
    $sample = $stmt->fetch();
    if ($sample) {
        echo "   Sample build fields: " . implode(', ', array_keys($sample)) . "\n";
        echo "   is_public value: " . ($sample['is_public'] ?? 'NULL') . "\n";
    } else {
        echo "   No builds found in database\n";
    }
    
    echo "\n=== Test Complete ===\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?> 