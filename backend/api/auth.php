<?php
// this file has all the authentication functions
// it's included by the main router (index.php) and doesn't handle routing itself

// note: error reporting, database connection ($pdo), and JWT helpers are handled by the main index.php router

// user registration
function handleRegister($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // check that all required fields are present
    $required = ['username', 'email', 'password', 'first_name', 'last_name'];
    foreach ($required as $field) {
        if (empty($input[$field])) {
            http_response_code(400);
            echo json_encode(['error' => "Missing required field: $field"]);
            return;
        }
    }
    
    // check if the email format is valid
    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid email format']);
        return;
    }
    
    // check if username or email already exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$input['username'], $input['email']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['error' => 'Username or email already exists']);
        return;
    }
    
    // hash the password for security
    $passwordHash = password_hash($input['password'], PASSWORD_DEFAULT);
    
    // add the new user to the database
    $stmt = $pdo->prepare("
        INSERT INTO users (username, email, password_hash, first_name, last_name, phone, country) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $input['username'],
        $input['email'],
        $passwordHash,
        $input['first_name'],
        $input['last_name'],
        $input['phone'] ?? null,
        $input['country'] ?? 'Philippines'
    ]);
    
    $userId = $pdo->lastInsertId();
    
    // give them the default Client role
    $stmt = $pdo->prepare("SELECT id FROM roles WHERE name = 'Client'");
    $stmt->execute();
    $role = $stmt->fetch();
    
    if ($role) {
        $stmt = $pdo->prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)");
        $stmt->execute([$userId, $role['id']]);
    }
    
    // create a JWT token for the new user
    $token = generateJWT($userId, $input['username'], ['Client']);
    
    echo json_encode([
        'success' => true,
        'message' => 'User registered successfully',
        'token' => $token,
        'user' => [
            'id' => $userId,
            'username' => $input['username'],
            'email' => $input['email'],
            'first_name' => $input['first_name'],
            'last_name' => $input['last_name'],
            'roles' => ['Client']
        ]
    ]);
}

// user login
function handleLogin($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['username']) || empty($input['password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Username and password are required']);
        return;
    }
    
    // get user info along with their roles
    $stmt = $pdo->prepare("
        SELECT u.*, GROUP_CONCAT(r.name) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.username = ? OR u.email = ?
        GROUP BY u.id
    ");
    $stmt->execute([$input['username'], $input['username']]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($input['password'], $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid username or password']);
        return;
    }
    
    if (!$user['is_active']) {
        http_response_code(403);
        echo json_encode(['error' => 'Account is deactivated']);
        return;
    }
    
    // Update last login
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $stmt->execute([$user['id']]);
    
    // Parse roles
    $roles = $user['roles'] ? explode(',', $user['roles']) : [];
    
    // Generate JWT token
    $token = generateJWT($user['id'], $user['username'], $roles);
    
    echo json_encode([
        'success' => true,
        'message' => 'Login successful',
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'roles' => $roles,
            'profile_image' => $user['profile_image'],
            'last_login' => $user['last_login']
        ]
    ]);
}

// Get User Profile
function handleGetProfile($pdo) {
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        return;
    }
    
    $payload = verifyJWT($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        return;
    }
    
    $stmt = $pdo->prepare("
        SELECT u.*, GROUP_CONCAT(r.name) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.id = ?
        GROUP BY u.id
    ");
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        return;
    }
    
    // Remove sensitive data
    unset($user['password_hash']);
    
    $roles = $user['roles'] ? explode(',', $user['roles']) : [];
    
    echo json_encode([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'first_name' => $user['first_name'],
            'last_name' => $user['last_name'],
            'phone' => $user['phone'],
            'country' => $user['country'],
            'profile_image' => $user['profile_image'],
            'created_at' => $user['created_at'],
            'last_login' => $user['last_login'],
            'roles' => $roles,
            'can_access_inventory' => isset($user['can_access_inventory']) ? (int)$user['can_access_inventory'] : 0,
            'can_access_orders' => isset($user['can_access_orders']) ? (int)$user['can_access_orders'] : 0,
            'can_access_chat_support' => isset($user['can_access_chat_support']) ? (int)$user['can_access_chat_support'] : 0
        ]
    ]);
}

// Update User Profile
function handleUpdateProfile($pdo) {
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        return;
    }
    
    $payload = verifyJWT($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Fields that can be updated
    $allowed_fields = ['first_name', 'last_name', 'phone', 'country', 'profile_image'];
    $update_fields = [];
    $update_values = [];
    
    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $update_fields[] = "$field = ?";
            $update_values[] = $input[$field];
        }
    }
    
    if (empty($update_fields)) {
        http_response_code(400);
        echo json_encode(['error' => 'No fields to update']);
        return;
    }
    
    $update_values[] = $payload['user_id'];
    
    $stmt = $pdo->prepare("UPDATE users SET " . implode(', ', $update_fields) . " WHERE id = ?");
    $stmt->execute($update_values);
    
    // Fetch updated user data to return
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();
    unset($user['password_hash']);
    
    echo json_encode([
        'success' => true,
        'message' => 'Profile updated successfully',
        'user' => $user
    ]);
}

// Change User Password
function handleChangePassword($pdo) {
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        return;
    }
    
    $payload = verifyJWT($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['current_password']) || empty($input['new_password'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Current and new passwords are required']);
        return;
    }
    
    if (strlen($input['new_password']) < 6) {
        http_response_code(400);
        echo json_encode(['error' => 'New password must be at least 6 characters long']);
        return;
    }
    
    // Verify current password
    $stmt = $pdo->prepare("SELECT password_hash FROM users WHERE id = ?");
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($input['current_password'], $user['password_hash'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid current password']);
        return;
    }
    
    // Update with new password
    $newPasswordHash = password_hash($input['new_password'], PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $stmt->execute([$newPasswordHash, $payload['user_id']]);
    
    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);
}

// Verify Token Endpoint
function handleVerifyToken($pdo) {
    $token = getBearerToken();
    if (!$token) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        return;
    }
    
    $payload = verifyJWT($token);
    if (!$payload) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid or expired token']);
        return;
    }

    // Optionally, you can re-fetch user data to ensure they still exist and are active
    $stmt = $pdo->prepare("SELECT is_active FROM users WHERE id = ?");
    $stmt->execute([$payload['user_id']]);
    $user = $stmt->fetch();

    if (!$user || !$user['is_active']) {
        http_response_code(401);
        echo json_encode(['error' => 'User not found or is deactivated']);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Token is valid',
        'payload' => $payload
    ]);
}

// User Logout
function handleLogout() {
    // For JWT, logout is typically handled on the client-side by deleting the token.
    // This endpoint can be used for server-side logging or token blocklisting if implemented.
    echo json_encode([
        'success' => true,
        'message' => 'Logged out successfully'
    ]);
}

// Refresh Token
function handleRefreshToken($pdo) {
    // This is a placeholder for a more complex refresh token implementation
    // A full implementation would involve refresh tokens stored in the database
    http_response_code(501);
    echo json_encode(['error' => 'Refresh token functionality not implemented']);
}

// Helper function to get bearer token
function getBearerToken() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
    if ($authHeader) {
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return $matches[1];
        }
    }
    // Fallback: X-Auth-Token custom header
    $xAuthToken = $_SERVER['HTTP_X_AUTH_TOKEN'] ?? null;
    if ($xAuthToken) {
        return $xAuthToken;
    }
    // Fallback: token in JSON POST body
    $input = json_decode(file_get_contents('php://input'), true);
    if (isset($input['token'])) {
        return $input['token'];
    }
    // Fallback: token in query string
    if (isset($_GET['token'])) {
        return $_GET['token'];
    }
    return null;
}

function handleUpdateInventoryAccess($pdo) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    if (!$authHeader) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authorization header missing']);
        return;
    }
    $token = str_replace('Bearer ', '', $authHeader);
    $decoded = verifyJWT($token);
    if (!$decoded || !isset($decoded['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        return;
    }
    $roles = $decoded['roles'] ?? [];
    if (is_string($roles)) $roles = explode(',', $roles);
    if (!in_array('Super Admin', $roles)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? null;
    $canAccess = isset($input['can_access_inventory']) ? (int)$input['can_access_inventory'] : null;
    if (!$userId || !in_array($canAccess, [0, 1], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid input']);
        return;
    }

    // Update and check affected rows
    $stmt = $pdo->prepare("UPDATE users SET can_access_inventory = ? WHERE id = ?");
    $stmt->execute([$canAccess, $userId]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found or value not changed']);
        return;
    }

    // Fetch and return the updated value for confirmation
    $stmt = $pdo->prepare("SELECT can_access_inventory FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $updated = $stmt->fetch();
    echo json_encode([
        'success' => true,
        'can_access_inventory' => isset($updated['can_access_inventory']) ? (int)$updated['can_access_inventory'] : null
    ]);
}

function handleUpdateOrderAccess($pdo) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    if (!$authHeader) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authorization header missing']);
        return;
    }
    $token = str_replace('Bearer ', '', $authHeader);
    $decoded = verifyJWT($token);
    if (!$decoded || !isset($decoded['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        return;
    }
    $roles = $decoded['roles'] ?? [];
    if (is_string($roles)) $roles = explode(',', $roles);
    if (!in_array('Super Admin', $roles)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? null;
    $canAccess = isset($input['can_access_orders']) ? (int)$input['can_access_orders'] : null;
    if (!$userId || !in_array($canAccess, [0, 1], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid input']);
        return;
    }
    $stmt = $pdo->prepare("UPDATE users SET can_access_orders = ? WHERE id = ?");
    $stmt->execute([$canAccess, $userId]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found or value not changed']);
        return;
    }
    $stmt = $pdo->prepare("SELECT can_access_orders FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $updated = $stmt->fetch();
    echo json_encode([
        'success' => true,
        'can_access_orders' => isset($updated['can_access_orders']) ? (int)$updated['can_access_orders'] : null
    ]);
}

function handleUpdateChatSupportAccess($pdo) {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;
    if (!$authHeader) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Authorization header missing']);
        return;
    }
    $token = str_replace('Bearer ', '', $authHeader);
    $decoded = verifyJWT($token);
    if (!$decoded || !isset($decoded['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Invalid token']);
        return;
    }
    $roles = $decoded['roles'] ?? [];
    if (is_string($roles)) $roles = explode(',', $roles);
    if (!in_array('Super Admin', $roles)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        return;
    }
    $input = json_decode(file_get_contents('php://input'), true);
    $userId = $input['user_id'] ?? null;
    $canAccess = isset($input['can_access_chat_support']) ? (int)$input['can_access_chat_support'] : null;
    if (!$userId || !in_array($canAccess, [0, 1], true)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid input']);
        return;
    }

    // Update and check affected rows
    $stmt = $pdo->prepare("UPDATE users SET can_access_chat_support = ? WHERE id = ?");
    $stmt->execute([$canAccess, $userId]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'User not found or value not changed']);
        return;
    }

    // Fetch and return the updated value for confirmation
    $stmt = $pdo->prepare("SELECT can_access_chat_support FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $updated = $stmt->fetch();
    echo json_encode([
        'success' => true,
        'can_access_chat_support' => isset($updated['can_access_chat_support']) ? (int)$updated['can_access_chat_support'] : null
    ]);
}
?> 