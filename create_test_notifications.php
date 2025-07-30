<?php
// Script to create sample notifications for the test user
require_once 'backend/config/database.php';

try {
    // Get the test user ID
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = 'testuser'");
    $stmt->execute();
    $user = $stmt->fetch();
    
    if (!$user) {
        echo "Test user not found!\n";
        exit;
    }
    
    $userId = $user['id'];
    echo "Found test user with ID: $userId\n";
    
    // Check if notifications already exist for this user
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ?");
    $stmt->execute([$userId]);
    $result = $stmt->fetch();
    
    if ($result['count'] > 0) {
        echo "Notifications already exist for test user!\n";
        exit;
    }
    
    // Create sample notifications
    $notifications = [
        [
            'type' => 'system',
            'title' => 'Welcome to BUILD IT:PC!',
            'message' => 'Thank you for joining our platform. Start building your dream PC today!',
            'priority' => 'low',
            'read_status' => 1
        ],
        [
            'type' => 'order',
            'title' => 'Order #12345 Status Updated',
            'message' => 'Your order has been shipped and is on its way to you.',
            'priority' => 'high',
            'read_status' => 0
        ],
        [
            'type' => 'build',
            'title' => 'Build Compatibility Alert',
            'message' => 'Your saved build "Gaming PC 2024" has compatibility issues with the selected GPU.',
            'priority' => 'medium',
            'read_status' => 0
        ],
        [
            'type' => 'promo',
            'title' => 'Special Discount Available',
            'message' => 'Get 10% off on all gaming components this weekend!',
            'priority' => 'medium',
            'read_status' => 1
        ],
        [
            'type' => 'support',
            'title' => 'Support Ticket #789 Resolved',
            'message' => 'Your support ticket regarding component compatibility has been resolved.',
            'priority' => 'low',
            'read_status' => 1
        ]
    ];
    
    $stmt = $pdo->prepare("
        INSERT INTO notifications (user_id, type, title, message, priority, read_status) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    foreach ($notifications as $notification) {
        $stmt->execute([
            $userId,
            $notification['type'],
            $notification['title'],
            $notification['message'],
            $notification['priority'],
            $notification['read_status']
        ]);
    }
    
    echo "Sample notifications created successfully for test user!\n";
    echo "You should now see notifications when you visit the notifications page.\n";
    
} catch (Exception $e) {
    echo "Error creating notifications: " . $e->getMessage() . "\n";
}
?> 