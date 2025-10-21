<?php
require_once 'backend/config/database.php';

$users = [
    [
        'username' => 'superadmin',
        'email' => 'superadmin@builditpc.com',
        'password' => 'password',
        'first_name' => 'Super',
        'last_name' => 'Admin',
        'role' => 'Super Admin'
    ],
    [
        'username' => 'admin',
        'email' => 'admin@builditpc.com',
        'password' => 'password',
        'first_name' => 'Admin',
        'last_name' => 'User',
        'role' => 'Admin'
    ],
    [
        'username' => 'employee',
        'email' => 'employee@builditpc.com',
        'password' => 'password',
        'first_name' => 'Employee',
        'last_name' => 'User',
        'role' => 'Employee'
    ],
    [
        'username' => 'client',
        'email' => 'client@builditpc.com',
        'password' => 'password',
        'first_name' => 'Client',
        'last_name' => 'User',
        'role' => 'Client'
    ]
];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    foreach ($users as $user) {
        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$user['username'], $user['email']]);
        $existing = $stmt->fetch();
        if ($existing) {
            echo "User {$user['username']} already exists. Skipping...\n";
            continue;
        }

        // Hash password
        $passwordHash = password_hash($user['password'], PASSWORD_DEFAULT);

        // Insert user
        $stmt = $pdo->prepare("
            INSERT INTO users (username, email, password_hash, first_name, last_name, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, 1, NOW())
        ");
        $stmt->execute([
            $user['username'],
            $user['email'],
            $passwordHash,
            $user['first_name'],
            $user['last_name']
        ]);
        $userId = $pdo->lastInsertId();

        // Get role id
        $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = ?");
        $stmt->execute([$user['role']]);
        $role = $stmt->fetch();
        if (!$role) {
            // Insert role if not exists
            $stmt = $pdo->prepare("INSERT INTO roles (name) VALUES (?)");
            $stmt->execute([$user['role']]);
            $roleId = $pdo->lastInsertId();
        } else {
            $roleId = $role['id'];
        }

        // Assign role
        $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)");
        $stmt->execute([$userId, $roleId]);

        echo "Created user: {$user['username']} with role: {$user['role']}\n";
        echo "  Username: {$user['username']}\n";
        echo "  Password: {$user['password']}\n";
        echo "  Email: {$user['email']}\n";
        echo "----------------------------------------\n";
    }

    echo "\nAll real users created successfully!\n";
    echo "You can now log in with these accounts.\n";
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?> 