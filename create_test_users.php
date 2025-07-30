<?php
echo "Starting test user creation script...\n";

require_once 'backend/config/database.php';
require_once 'backend/utils/jwt_helper.php';

echo "Required files loaded successfully.\n";

// Create test users with different roles
$testUsers = [
    [
        'username' => 'superadmin',
        'password' => 'superadmin123',
        'email' => 'superadmin@builditpc.com',
        'first_name' => 'Super',
        'last_name' => 'Admin',
        'roles' => ['Super Admin']
    ],
    [
        'username' => 'admin',
        'password' => 'admin123',
        'email' => 'admin@builditpc.com',
        'first_name' => 'Admin',
        'last_name' => 'User',
        'roles' => ['Admin']
    ],
    [
        'username' => 'employee',
        'password' => 'employee123',
        'email' => 'employee@builditpc.com',
        'first_name' => 'Employee',
        'last_name' => 'User',
        'roles' => ['Employee']
    ],
    [
        'username' => 'regularuser',
        'password' => 'user123',
        'email' => 'user@email.com',
        'first_name' => 'Regular',
        'last_name' => 'User',
        'roles' => ['User']
    ]
];

echo "Test users array created.\n";

try {
    echo "Attempting to connect to database...\n";
    $pdo = new PDO("mysql:host=$host;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Database connection successful.\n";

    foreach ($testUsers as $user) {
        echo "Processing user: {$user['username']}\n";
        
        // Check if user already exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$user['username'], $user['email']]);
        
        if ($stmt->rowCount() > 0) {
            echo "User {$user['username']} already exists. Skipping...\n";
            continue;
        }

        // Hash password
        $hashedPassword = password_hash($user['password'], PASSWORD_DEFAULT);
        
        // Insert user
        $stmt = $pdo->prepare("
            INSERT INTO users (username, password, email, first_name, last_name, roles, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $rolesJson = json_encode($user['roles']);
        $stmt->execute([
            $user['username'],
            $hashedPassword,
            $user['email'],
            $user['first_name'],
            $user['last_name'],
            $rolesJson
        ]);

        echo "Created user: {$user['username']} with roles: " . implode(', ', $user['roles']) . "\n";
        echo "Login credentials:\n";
        echo "  Username: {$user['username']}\n";
        echo "  Password: {$user['password']}\n";
        echo "  Email: {$user['email']}\n";
        echo "----------------------------------------\n";
    }

    echo "\nAll test users created successfully!\n";
    echo "\nYou can now test the different dashboards:\n";
    echo "1. Super Admin Dashboard: superadmin / superadmin123\n";
    echo "2. Admin Dashboard: admin / admin123\n";
    echo "3. Employee Dashboard: employee / employee123\n";
    echo "4. Regular User: regularuser / user123\n";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
} catch (Exception $e) {
    echo "General Error: " . $e->getMessage() . "\n";
}
?> 