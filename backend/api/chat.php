<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';

$pdo = get_db_connection();
header('Content-Type: application/json');

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function getUnreadCount($userId) {
    global $pdo;
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM chat_sessions WHERE user_id = ? AND status = "open" AND updated_at > (SELECT COALESCE(MAX(last_seen_at), "1970-01-01") FROM last_seen_chat WHERE user_id = ?)');
    $stmt->execute([$userId, $userId]);
    return $stmt->fetchColumn();
}

$method = $_SERVER['REQUEST_METHOD'];

// Get chat statistics (admin)
if ($method === 'GET' && isset($_GET['stats'])) {
    try {
        $stats = [];
        
        // Total sessions
        $stmt = $pdo->query('SELECT COUNT(*) FROM chat_sessions');
        $stats['total_sessions'] = $stmt->fetchColumn();
        
        // Open sessions
        $stmt = $pdo->query('SELECT COUNT(*) FROM chat_sessions WHERE status = "open"');
        $stats['open_sessions'] = $stmt->fetchColumn();
        
        // Today's sessions
        $stmt = $pdo->query('SELECT COUNT(*) FROM chat_sessions WHERE DATE(created_at) = CURDATE()');
        $stats['today_sessions'] = $stmt->fetchColumn();
        
        // Average response time (in minutes)
        $stmt = $pdo->query('
            SELECT AVG(TIMESTAMPDIFF(MINUTE, cs.created_at, cm.sent_at)) as avg_response_time
            FROM chat_sessions cs
            JOIN chat_messages cm ON cs.id = cm.session_id
            WHERE cm.sender = "admin" AND cm.id = (
                SELECT MIN(id) FROM chat_messages 
                WHERE session_id = cs.id AND sender = "admin"
            )
        ');
        $avgTime = $stmt->fetchColumn();
        $stats['avg_response_time'] = round($avgTime ?: 0, 1);
        
        respond(['success' => true, 'stats' => $stats]);
    } catch (Exception $e) {
        respond(['error' => 'Failed to get statistics: ' . $e->getMessage()], 500);
    }
}

// List all chat sessions (admin) with enhanced data
if ($method === 'GET' && isset($_GET['sessions'])) {
    try {
        $stmt = $pdo->query('
            SELECT 
                cs.*, 
                u.username,
                u.email as user_email,
                (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id AND sender = "user" AND read_status = "unread") as unread_messages,
                (SELECT MAX(sent_at) FROM chat_messages WHERE session_id = cs.id) as last_message_time
            FROM chat_sessions cs 
            LEFT JOIN users u ON cs.user_id = u.id 
            ORDER BY 
                CASE WHEN cs.status = "open" THEN 0 ELSE 1 END,
                cs.updated_at DESC
        ');
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Add user roles for registered users
        foreach ($sessions as &$session) {
            if ($session['user_id']) {
                $roleStmt = $pdo->prepare('
                    SELECT r.name FROM roles r 
                    JOIN user_roles ur ON r.id = ur.role_id 
                    WHERE ur.user_id = ?
                ');
                $roleStmt->execute([$session['user_id']]);
                $session['user_roles'] = $roleStmt->fetchAll(PDO::FETCH_COLUMN);
            } else {
                $session['user_roles'] = [];
            }
        }
        
        respond(['success' => true, 'sessions' => $sessions]);
    } catch (Exception $e) {
        respond(['error' => 'Failed to load sessions: ' . $e->getMessage()], 500);
    }
}

// Get messages for a session with read status
if ($method === 'GET' && isset($_GET['messages']) && isset($_GET['session_id'])) {
    try {
        $session_id = intval($_GET['session_id']);
        $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
        
        // Get messages
        $stmt = $pdo->prepare('
            SELECT * FROM chat_messages 
            WHERE session_id = ? 
            ORDER BY sent_at ASC
        ');
        $stmt->execute([$session_id]);
        $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Mark messages as read if user is viewing them
        if ($user_id) {
            $stmt = $pdo->prepare('
                UPDATE chat_messages 
                SET read_status = "read" 
                WHERE session_id = ? AND sender = "admin" AND read_status = "unread"
            ');
            $stmt->execute([$session_id]);
            
            // Update last seen
            $stmt = $pdo->prepare('
                INSERT INTO last_seen_chat (user_id, session_id, last_seen_at) 
                VALUES (?, ?, NOW()) 
                ON DUPLICATE KEY UPDATE last_seen_at = NOW()
            ');
            $stmt->execute([$user_id, $session_id]);
        }
        
        respond(['success' => true, 'messages' => $messages]);
    } catch (Exception $e) {
        respond(['error' => 'Failed to load messages: ' . $e->getMessage()], 500);
    }
}

// Get user's chat sessions
if ($method === 'GET' && isset($_GET['user_sessions'])) {
    try {
        $user_id = intval($_GET['user_id']);
        $stmt = $pdo->prepare('
            SELECT 
                cs.*,
                (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id AND sender = "admin" AND read_status = "unread") as unread_messages
            FROM chat_sessions cs 
            WHERE cs.user_id = ? 
            ORDER BY cs.updated_at DESC
        ');
        $stmt->execute([$user_id]);
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        respond(['success' => true, 'sessions' => $sessions]);
    } catch (Exception $e) {
        respond(['error' => 'Failed to load user sessions: ' . $e->getMessage()], 500);
    }
}

// Send a message (enhanced with better validation and features)
if ($method === 'POST' && isset($_GET['send'])) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $session_id = isset($input['session_id']) ? intval($input['session_id']) : 0;
        $sender = $input['sender'] ?? '';
        $message = trim($input['message'] ?? '');
        $message_type = $input['message_type'] ?? 'text';
        $guest_name = $input['guest_name'] ?? null;
        $guest_email = $input['guest_email'] ?? null;
        $user_id = isset($input['user_id']) && $input['user_id'] !== '' ? intval($input['user_id']) : null;

        if (!$sender || !$message) {
            respond(['error' => 'Invalid input: sender and message required'], 400);
        }

        // Validate message type
        if (!in_array($message_type, ['text', 'image', 'file', 'system'])) {
            $message_type = 'text';
        }

        // If no session_id, create a new session
        if (!$session_id) {
            $stmt = $pdo->prepare('
                INSERT INTO chat_sessions (user_id, guest_name, guest_email, status, priority) 
                VALUES (?, ?, ?, "open", "normal")
            ');
            $stmt->execute([$user_id, $guest_name, $guest_email]);
            $session_id = $pdo->lastInsertId();
            
            // Insert user's first message
            $stmt = $pdo->prepare('
                INSERT INTO chat_messages (session_id, sender, message, message_type, read_status) 
                VALUES (?, ?, ?, ?, "unread")
            ');
            $stmt->execute([$session_id, $sender, $message, $message_type]);
            
            // Send auto-reply
            $autoReply = 'Thank you for contacting SIMS Support! 🖥️ Our team will respond within 5-10 minutes. In the meantime, feel free to browse our PC components or check out our prebuilt systems.';
            $stmt->execute([$session_id, 'admin', $autoReply, 'text', 'unread']);
            
            // Notify all Admin and Employee users
            $userStmt = $pdo->query("
                SELECT DISTINCT u.id FROM users u 
                JOIN user_roles ur ON u.id = ur.user_id 
                JOIN roles r ON ur.role_id = r.id 
                WHERE r.name IN ('Admin', 'Employee') AND u.is_active = 1
            ");
            $adminUsers = $userStmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($adminUsers as $adminUser) {
                $notifStmt = $pdo->prepare('
                    INSERT INTO notifications (user_id, type, title, message, priority) 
                    VALUES (?, "support", "New Chat Session", ?, "high")
                ');
                $notifStmt->execute([
                    $adminUser['id'],
                    "New customer chat session started" . ($guest_name ? " by $guest_name" : "")
                ]);
            }
            
            respond(['success' => true, 'session_id' => $session_id, 'message' => 'Chat session created successfully']);
        }

        // Insert the message
        $stmt = $pdo->prepare('
            INSERT INTO chat_messages (session_id, sender, message, message_type, read_status) 
            VALUES (?, ?, ?, ?, "unread")
        ');
        $stmt->execute([$session_id, $sender, $message, $message_type]);
        
        // Update session timestamp
        $pdo->prepare('UPDATE chat_sessions SET updated_at = NOW() WHERE id = ?')->execute([$session_id]);
        
        // Handle notifications based on sender
        if ($sender === 'admin') {
            // Notify user if they have an account
            $stmt = $pdo->prepare('SELECT user_id FROM chat_sessions WHERE id = ?');
            $stmt->execute([$session_id]);
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($session && $session['user_id']) {
                $notifStmt = $pdo->prepare('
                    INSERT INTO notifications (user_id, type, title, message, priority) 
                    VALUES (?, "support", "Support Reply", "You have a new reply from our support team.", "medium")
                ');
                $notifStmt->execute([$session['user_id']]);
            }
        } else {
            // Notify all Admin and Employee users about new client message
            $userStmt = $pdo->query("
                SELECT DISTINCT u.id FROM users u 
                JOIN user_roles ur ON u.id = ur.user_id 
                JOIN roles r ON ur.role_id = r.id 
                WHERE r.name IN ('Admin', 'Employee') AND u.is_active = 1
            ");
            $adminUsers = $userStmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($adminUsers as $adminUser) {
                $notifStmt = $pdo->prepare('
                    INSERT INTO notifications (user_id, type, title, message, priority) 
                    VALUES (?, "support", "New Client Message", ?, "high")
                ');
                $notifStmt->execute([
                    $adminUser['id'],
                    "New message in chat session #$session_id"
                ]);
            }
        }
        
        respond(['success' => true, 'session_id' => $session_id]);
        
    } catch (Exception $e) {
        respond(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// Mark a chat as resolved
if ($method === 'POST' && isset($_GET['resolve'])) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $session_id = intval($input['session_id'] ?? 0);
        $resolution_notes = $input['resolution_notes'] ?? null;
        
        if (!$session_id) {
            respond(['error' => 'Invalid session_id'], 400);
        }
        
        $stmt = $pdo->prepare('
            UPDATE chat_sessions 
            SET status = "resolved", resolution_notes = ?, updated_at = NOW() 
            WHERE id = ?
        ');
        $stmt->execute([$resolution_notes, $session_id]);
        
        // Add system message
        $stmt = $pdo->prepare('
            INSERT INTO chat_messages (session_id, sender, message, message_type, read_status) 
            VALUES (?, "admin", "This chat session has been marked as resolved. Thank you for contacting SIMS Support!", "system", "unread")
        ');
        $stmt->execute([$session_id]);
        
        respond(['success' => true, 'message' => 'Chat session resolved successfully']);
        
    } catch (Exception $e) {
        respond(['error' => 'Failed to resolve chat: ' . $e->getMessage()], 500);
    }
}

// Reopen a chat session
if ($method === 'POST' && isset($_GET['reopen'])) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $session_id = intval($input['session_id'] ?? 0);
        
        if (!$session_id) {
            respond(['error' => 'Invalid session_id'], 400);
        }
        
        $stmt = $pdo->prepare('
            UPDATE chat_sessions 
            SET status = "open", updated_at = NOW() 
            WHERE id = ?
        ');
        $stmt->execute([$session_id]);
        
        // Add system message
        $stmt = $pdo->prepare('
            INSERT INTO chat_messages (session_id, sender, message, message_type, read_status) 
            VALUES (?, "admin", "This chat session has been reopened.", "system", "unread")
        ');
        $stmt->execute([$session_id]);
        
        respond(['success' => true, 'message' => 'Chat session reopened successfully']);
        
    } catch (Exception $e) {
        respond(['error' => 'Failed to reopen chat: ' . $e->getMessage()], 500);
    }
}

// Delete a message (admin only)
if ($method === 'POST' && isset($_GET['delete_message'])) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $message_id = intval($input['message_id'] ?? 0);
        
        if (!$message_id) {
            respond(['error' => 'Invalid message_id'], 400);
        }
        
        $stmt = $pdo->prepare('DELETE FROM chat_messages WHERE id = ?');
        $stmt->execute([$message_id]);
        
        respond(['success' => true, 'message' => 'Message deleted successfully']);
        
    } catch (Exception $e) {
        respond(['error' => 'Failed to delete message: ' . $e->getMessage()], 500);
    }
}

// Delete a chat session (admin only)
if ($method === 'POST' && isset($_GET['delete_session'])) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $session_id = intval($input['session_id'] ?? 0);
        
        if (!$session_id) {
            respond(['error' => 'Invalid session_id'], 400);
        }
        
        $stmt = $pdo->prepare('DELETE FROM chat_sessions WHERE id = ?');
        $stmt->execute([$session_id]);
        
        respond(['success' => true, 'message' => 'Chat session deleted successfully']);
        
    } catch (Exception $e) {
        respond(['error' => 'Failed to delete session: ' . $e->getMessage()], 500);
    }
}

// Update chat priority
if ($method === 'POST' && isset($_GET['update_priority'])) {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        $session_id = intval($input['session_id'] ?? 0);
        $priority = $input['priority'] ?? 'normal';
        
        if (!$session_id) {
            respond(['error' => 'Invalid session_id'], 400);
        }
        
        if (!in_array($priority, ['low', 'normal', 'high', 'urgent'])) {
            respond(['error' => 'Invalid priority level'], 400);
        }
        
        $stmt = $pdo->prepare('UPDATE chat_sessions SET priority = ? WHERE id = ?');
        $stmt->execute([$priority, $session_id]);
        
        respond(['success' => true, 'message' => 'Priority updated successfully']);
        
    } catch (Exception $e) {
        respond(['error' => 'Failed to update priority: ' . $e->getMessage()], 500);
    }
}

// Get unread count for user
if ($method === 'GET' && isset($_GET['unread_count'])) {
    try {
        $user_id = intval($_GET['user_id'] ?? 0);
        
        if (!$user_id) {
            respond(['error' => 'Invalid user_id'], 400);
        }
        
        $count = getUnreadCount($user_id);
        respond(['success' => true, 'unread_count' => $count]);
        
    } catch (Exception $e) {
        respond(['error' => 'Failed to get unread count: ' . $e->getMessage()], 500);
    }
}

// If no endpoint matched
respond(['error' => 'Invalid endpoint'], 404); 