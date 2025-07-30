<?php
// Script to create a test user for login testing
require_once 'backend/config/database.php';

try {
    // Check if test user already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = 'testuser'");
    $stmt->execute();
    
    if ($stmt->fetch()) {
        echo "Test user already exists!\n";
        echo "Username: testuser\n";
        echo "Password: testpass123\n";
        exit;
    }
    
    // Create test user
    $passwordHash = password_hash('testpass123', PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, first_name, last_name, phone, country) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        'testuser',
        'test@example.com',
        $passwordHash,
        'Test',
        'User',
        '1234567890',
        'Philippines'
    ]);
    
    $userId = $pdo->lastInsertId();
    
    // Assign Client role
    $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = 'Client'");
    $stmt->execute();
    $role = $stmt->fetch();
    
    if ($role) {
        $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)");
        $stmt->execute([$userId, $role['id']]);
    }
    
    echo "Test user created successfully!\n";
    echo "Username: testuser\n";
    echo "Password: testpass123\n";
    echo "Email: test@example.com\n";
    
} catch (Exception $e) {
    echo "Error creating test user: " . $e->getMessage() . "\n";
}
?> 