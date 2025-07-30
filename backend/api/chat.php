<?php
require_once __DIR__ . '/../config/database.php';
$pdo = get_db_connection();
header('Content-Type: application/json');

function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// List all chat sessions (admin)
if ($method === 'GET' && isset($_GET['sessions'])) {
    $stmt = $pdo->query('SELECT cs.*, u.username FROM chat_sessions cs LEFT JOIN users u ON cs.user_id = u.id ORDER BY cs.updated_at DESC');
    $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respond(['sessions' => $sessions]);
}

// Get messages for a session
if ($method === 'GET' && isset($_GET['messages']) && isset($_GET['session_id'])) {
    $session_id = intval($_GET['session_id']);
    $stmt = $pdo->prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY sent_at ASC');
    $stmt->execute([$session_id]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
    respond(['messages' => $messages]);
}

// Send a message (admin or user, or create new session if needed)
if ($method === 'POST' && isset($_GET['send'])) {
    $input = json_decode(file_get_contents('php://input'), true);
    $session_id = isset($input['session_id']) ? intval($input['session_id']) : 0;
    $sender = $input['sender'] ?? '';
    $message = trim($input['message'] ?? '');
    $guest_name = $input['guest_name'] ?? null;
    $guest_email = $input['guest_email'] ?? null;
    $user_id = isset($input['user_id']) && $input['user_id'] !== '' ? intval($input['user_id']) : null;

    if (!$sender || !$message) {
        respond(['error' => 'Invalid input: sender and message required'], 400);
    }

    try {
        // If no session_id, create a new session
        if (!$session_id) {
            $stmt = $pdo->prepare('INSERT INTO chat_sessions (user_id, guest_name, guest_email) VALUES (?, ?, ?)');
            $stmt->execute([
                $user_id !== null ? $user_id : null,
                $guest_name,
                $guest_email
            ]);
            $session_id = $pdo->lastInsertId();
            // Insert user's first message
            $stmt = $pdo->prepare('INSERT INTO chat_messages (session_id, sender, message) VALUES (?, ?, ?)');
            $stmt->execute([$session_id, $sender, $message]);
            // Notify all Admin and Employee users (not Super Admin) for the first client message
            $userStmt = $pdo->query("SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name IN ('Admin', 'Employee')");
            $adminUsers = $userStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($adminUsers as $adminUser) {
                $msg = "A client has sent a new message in chat support.";
                $notifStmt = $pdo->prepare('INSERT INTO notifications (user_id, type, title, message, priority) VALUES (?, ?, ?, ?, ?)');
                $notifStmt->execute([
                    $adminUser['id'],
                    'support',
                    'New Client Chat Message',
                    $msg,
                    'high'
                ]);
            }
            // Insert auto-reply from support
            $autoReply = 'Thank you for contacting BUILD IT:PC Support! Our team will respond within 5-10 minutes.';
            $stmt->execute([$session_id, 'admin', $autoReply]);
            // Update session updated_at
            $pdo->prepare('UPDATE chat_sessions SET updated_at = NOW() WHERE id = ?')->execute([$session_id]);
            respond(['success' => true, 'session_id' => $session_id]);
        }

        $stmt = $pdo->prepare('INSERT INTO chat_messages (session_id, sender, message) VALUES (?, ?, ?)');
        $stmt->execute([$session_id, $sender, $message]);
        // Update session updated_at
        $pdo->prepare('UPDATE chat_sessions SET updated_at = NOW() WHERE id = ?')->execute([$session_id]);
        // If admin replied, create notification for user (if user_id exists)
        if ($sender === 'admin') {
            $stmt = $pdo->prepare('SELECT user_id FROM chat_sessions WHERE id = ?');
            $stmt->execute([$session_id]);
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($session && !empty($session['user_id'])) {
                $userId = $session['user_id'];
                $notifStmt = $pdo->prepare('INSERT INTO notifications (user_id, type, title, message, priority) VALUES (?, ?, ?, ?, ?)');
                $notifStmt->execute([
                    $userId,
                    'support',
                    'New Support Reply',
                    'You have a new reply from support.',
                    'medium'
                ]);
            }
        } else {
            // If client sent a message, always notify all Admin and Employee users (not Super Admin)
            $userStmt = $pdo->query("SELECT u.id FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE r.name IN ('Admin', 'Employee')");
            $adminUsers = $userStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($adminUsers as $adminUser) {
                $msg = "A client has sent a new message in chat support.";
                $notifStmt = $pdo->prepare('INSERT INTO notifications (user_id, type, title, message, priority) VALUES (?, ?, ?, ?, ?)');
                $notifStmt->execute([
                    $adminUser['id'],
                    'support',
                    'New Client Chat Message',
                    $msg,
                    'high'
                ]);
            }
        }
        respond(['success' => true, 'session_id' => $session_id]);
    } catch (PDOException $e) {
        respond(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// Mark a chat as resolved
if ($method === 'POST' && isset($_GET['resolve'])) {
    $input = json_decode(file_get_contents('php://input'), true);
    $session_id = intval($input['session_id'] ?? 0);
    if (!$session_id) {
        respond(['error' => 'Invalid input'], 400);
    }
    $pdo->prepare('UPDATE chat_sessions SET status = "resolved", updated_at = NOW() WHERE id = ?')->execute([$session_id]);
    respond(['success' => true]);
}

// Delete a message (admin only)
if ($method === 'POST' && isset($_GET['delete_message'])) {
    $input = json_decode(file_get_contents('php://input'), true);
    $message_id = intval($input['message_id'] ?? 0);
    if (!$message_id) {
        respond(['error' => 'Invalid message_id'], 400);
    }
    try {
        $stmt = $pdo->prepare('DELETE FROM chat_messages WHERE id = ?');
        $stmt->execute([$message_id]);
        respond(['success' => true]);
    } catch (PDOException $e) {
        respond(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// Delete a chat session (admin only)
if ($method === 'POST' && isset($_GET['delete_session'])) {
    $input = json_decode(file_get_contents('php://input'), true);
    $session_id = intval($input['session_id'] ?? 0);
    if (!$session_id) {
        respond(['error' => 'Invalid session_id'], 400);
    }
    try {
        $stmt = $pdo->prepare('DELETE FROM chat_sessions WHERE id = ?');
        $stmt->execute([$session_id]);
        respond(['success' => true]);
    } catch (PDOException $e) {
        respond(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

// If no endpoint matched
respond(['error' => 'Invalid endpoint'], 404); 