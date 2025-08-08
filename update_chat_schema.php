<?php
require_once __DIR__ . '/backend/config/database.php';

echo "🔧 Updating Chat Database Schema\n";
echo "================================\n\n";

try {
    $pdo = get_db_connection();
    
    // Check if tables exist
    $stmt = $pdo->query("SHOW TABLES LIKE 'chat_sessions'");
    if ($stmt->rowCount() === 0) {
        echo "❌ Chat tables don't exist. Please run the chat_schema.sql first.\n";
        exit(1);
    }
    
    echo "✅ Chat tables found. Updating schema...\n\n";
    
    // Add missing columns to chat_sessions
    echo "1. Updating chat_sessions table...\n";
    
    // Check if priority column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM chat_sessions LIKE 'priority'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec('ALTER TABLE chat_sessions ADD COLUMN priority ENUM("low", "normal", "high", "urgent") DEFAULT "normal" AFTER status');
        echo "   ✓ Added priority column\n";
    } else {
        echo "   ℹ️ Priority column already exists\n";
    }
    
    // Check if resolution_notes column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM chat_sessions LIKE 'resolution_notes'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec('ALTER TABLE chat_sessions ADD COLUMN resolution_notes TEXT DEFAULT NULL AFTER priority');
        echo "   ✓ Added resolution_notes column\n";
    } else {
        echo "   ℹ️ Resolution notes column already exists\n";
    }
    
    // Add missing columns to chat_messages
    echo "\n2. Updating chat_messages table...\n";
    
    // Check if message_type column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'message_type'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec('ALTER TABLE chat_messages ADD COLUMN message_type ENUM("text", "image", "file", "system") DEFAULT "text" AFTER message');
        echo "   ✓ Added message_type column\n";
    } else {
        echo "   ℹ️ Message type column already exists\n";
    }
    
    // Check if read_status column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM chat_messages LIKE 'read_status'");
    if ($stmt->rowCount() === 0) {
        $pdo->exec('ALTER TABLE chat_messages ADD COLUMN read_status ENUM("unread", "read") DEFAULT "unread" AFTER message_type');
        echo "   ✓ Added read_status column\n";
    } else {
        echo "   ℹ️ Read status column already exists\n";
    }
    
    // Add indexes
    echo "\n3. Adding indexes...\n";
    
    try {
        $pdo->exec('CREATE INDEX idx_status ON chat_sessions (status)');
        echo "   ✓ Added status index\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') === false) {
            echo "   ⚠ Status index error: " . $e->getMessage() . "\n";
        } else {
            echo "   ℹ️ Status index already exists\n";
        }
    }
    
    try {
        $pdo->exec('CREATE INDEX idx_priority ON chat_sessions (priority)');
        echo "   ✓ Added priority index\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') === false) {
            echo "   ⚠ Priority index error: " . $e->getMessage() . "\n";
        } else {
            echo "   ℹ️ Priority index already exists\n";
        }
    }
    
    try {
        $pdo->exec('CREATE INDEX idx_updated_at ON chat_sessions (updated_at)');
        echo "   ✓ Added updated_at index\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') === false) {
            echo "   ⚠ Updated_at index error: " . $e->getMessage() . "\n";
        } else {
            echo "   ℹ️ Updated_at index already exists\n";
        }
    }
    
    try {
        $pdo->exec('CREATE INDEX idx_session_sender ON chat_messages (session_id, sender)');
        echo "   ✓ Added session_sender index\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') === false) {
            echo "   ⚠ Session_sender index error: " . $e->getMessage() . "\n";
        } else {
            echo "   ℹ️ Session_sender index already exists\n";
        }
    }
    
    try {
        $pdo->exec('CREATE INDEX idx_read_status ON chat_messages (read_status)');
        echo "   ✓ Added read_status index\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') === false) {
            echo "   ⚠ Read_status index error: " . $e->getMessage() . "\n";
        } else {
            echo "   ℹ️ Read_status index already exists\n";
        }
    }
    
    try {
        $pdo->exec('CREATE INDEX idx_sent_at ON chat_messages (sent_at)');
        echo "   ✓ Added sent_at index\n";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate key name') === false) {
            echo "   ⚠ Sent_at index error: " . $e->getMessage() . "\n";
        } else {
            echo "   ℹ️ Sent_at index already exists\n";
        }
    }
    
    echo "\n✅ Chat database schema updated successfully!\n";
    echo "\n🎉 Your chat support system is now ready!\n";
    echo "\nFeatures available:\n";
    echo "• Real-time messaging between users and support staff\n";
    echo "• Priority levels (low, normal, high, urgent)\n";
    echo "• Message read status tracking\n";
    echo "• Chat session management (resolve/reopen)\n";
    echo "• Statistics dashboard for admins\n";
    echo "• Floating chat button for easy access\n";
    echo "• Auto-replies and notifications\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?> 