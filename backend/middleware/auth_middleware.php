<?php
/**
 * Enhanced Authentication Middleware
 * Comprehensive security checks for all API endpoints
 */

require_once __DIR__ . '/../config/enhanced_security.php';
require_once __DIR__ . '/../utils/jwt_helper.php';

class AuthenticationMiddleware {
    private $pdo;
    private $security;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->security = new EnhancedSecurity($pdo);
    }
    
    /**
     * Main authentication check - call this for every protected endpoint
     */
    public function authenticate($requiredRoles = [], $requireCSRF = false) {
        // Set security headers
        $this->security->setEnhancedSecurityHeaders();
        
        // Check for suspicious activity
        if ($this->security->detectSuspiciousActivity()) {
            $this->sendErrorResponse(429, 'Suspicious activity detected');
        }
        
        // Check IP blocking
        $ipAddress = $this->getClientIP();
        if ($this->security->isIPBlocked($ipAddress)) {
            $this->sendErrorResponse(403, 'Access denied');
        }
        
        // Check rate limiting
        if (!$this->security->checkRateLimit('api_call')) {
            $this->sendErrorResponse(429, 'Too many requests');
        }
        
        // Record rate limit attempt
        $this->security->recordRateLimitAttempt('api_call');
        
        // CSRF protection for state-changing operations
        if ($requireCSRF) {
            $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_POST['csrf_token'] ?? '';
            if (!$this->security->verifyCSRFToken($csrfToken)) {
                $this->sendErrorResponse(403, 'Invalid CSRF token');
            }
        }
        
        // JWT authentication
        $token = $this->getBearerToken();
        if (!$token) {
            $this->sendErrorResponse(401, 'Authentication required');
        }
        
        $payload = verifyJWT($token);
        if (!$payload) {
            $this->sendErrorResponse(401, 'Invalid token');
        }
        
        // Check token expiry
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            $this->sendErrorResponse(401, 'Token expired');
        }
        
        // Verify user still exists and is active
        $user = $this->verifyUserStatus($payload['user_id']);
        if (!$user) {
            $this->sendErrorResponse(401, 'User not found or inactive');
        }
        
        // Check role requirements
        if (!empty($requiredRoles)) {
            $userRoles = is_string($user['roles']) ? explode(',', $user['roles']) : $user['roles'];
            if (!array_intersect($requiredRoles, $userRoles)) {
                $this->logSecurityEvent('unauthorized_access', "Unauthorized access attempt to protected endpoint", $payload['user_id'], 'medium');
                $this->sendErrorResponse(403, 'Insufficient permissions');
            }
        }
        
        // Log successful authentication
        $this->logSecurityEvent('api_access', "API access granted", $payload['user_id'], 'low');
        
        return $payload;
    }
    
    /**
     * Verify user status in database
     */
    private function verifyUserStatus($userId) {
        $stmt = $this->pdo->prepare("
            SELECT u.*, GROUP_CONCAT(r.name) as roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.id = ? AND u.is_active = 1
            GROUP BY u.id
        ");
        $stmt->execute([$userId]);
        return $stmt->fetch();
    }
    
    /**
     * Enhanced login with security checks
     */
    public function handleSecureLogin($username, $password) {
        $ipAddress = $this->getClientIP();
        
        // Check rate limiting for login attempts
        if (!$this->security->checkRateLimit('login', $username, $ipAddress)) {
            $this->logSecurityEvent('login_rate_limit', "Login rate limit exceeded for: $username", null, 'medium');
            $this->sendErrorResponse(429, 'Too many login attempts. Please try again later.');
        }
        
        // Record login attempt
        $this->security->recordRateLimitAttempt('login', $username, $ipAddress);
        
        // Fetch user
        $stmt = $this->pdo->prepare("
            SELECT u.*, GROUP_CONCAT(r.name) as roles
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            WHERE u.username = ? OR u.email = ?
            GROUP BY u.id
        ");
        $stmt->execute([$username, $username]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            $this->logSecurityEvent('login_failed', "Failed login attempt for: $username", $user['id'] ?? null, 'medium');
            $this->sendErrorResponse(401, 'Invalid credentials');
        }
        
        // Check if user is active
        if (!$user['is_active']) {
            $this->logSecurityEvent('login_inactive', "Login attempt to inactive account: $username", $user['id'], 'high');
            $this->sendErrorResponse(403, 'Account is deactivated');
        }
        
        // Check password age
        if ($this->isPasswordExpired($user['id'])) {
            $this->logSecurityEvent('password_expired', "Login with expired password: $username", $user['id'], 'medium');
            $this->sendErrorResponse(403, 'Password has expired. Please reset your password.');
        }
        
        // Update last login
        $stmt = $this->pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        // Generate tokens
        $roles = $user['roles'] ? explode(',', $user['roles']) : [];
        $accessToken = generateJWT($user['id'], $user['username'], $roles);
        $refreshToken = generateRefreshJWT($user['id'], $user['username'], $roles);
        
        // Log successful login
        $this->logSecurityEvent('login_success', "Successful login for: $username", $user['id'], 'low');
        
        return [
            'success' => true,
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'first_name' => $user['first_name'],
                'last_name' => $user['last_name'],
                'roles' => $roles
            ]
        ];
    }
    
    /**
     * Check if password has expired
     */
    private function isPasswordExpired($userId) {
        $maxAge = env('PASSWORD_MAX_AGE_DAYS', 90);
        $stmt = $this->pdo->prepare("
            SELECT password_updated_at 
            FROM users 
            WHERE id = ? AND password_updated_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        ");
        $stmt->execute([$userId, $maxAge]);
        return $stmt->fetch() !== false;
    }
    
    /**
     * Enhanced registration with security checks
     */
    public function handleSecureRegistration($userData) {
        $ipAddress = $this->getClientIP();
        
        // Check rate limiting for registration
        if (!$this->security->checkRateLimit('register', $userData['email'], $ipAddress)) {
            $this->logSecurityEvent('register_rate_limit', "Registration rate limit exceeded for: {$userData['email']}", null, 'medium');
            $this->sendErrorResponse(429, 'Too many registration attempts. Please try again later.');
        }
        
        // Record registration attempt
        $this->security->recordRateLimitAttempt('register', $userData['email'], $ipAddress);
        
        // Validate password strength
        $passwordErrors = $this->security->validatePassword(
            $userData['password'], 
            $userData['username'], 
            $userData['email']
        );
        
        if (!empty($passwordErrors)) {
            $this->logSecurityEvent('weak_password', "Weak password attempt during registration: {$userData['email']}", null, 'low');
            $this->sendErrorResponse(400, 'Password does not meet requirements: ' . implode(', ', $passwordErrors));
        }
        
        // Check for existing user
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$userData['username'], $userData['email']]);
        if ($stmt->fetch()) {
            $this->logSecurityEvent('duplicate_registration', "Duplicate registration attempt: {$userData['email']}", null, 'medium');
            $this->sendErrorResponse(400, 'Username or email already exists');
        }
        
        // Hash password
        $passwordHash = password_hash($userData['password'], PASSWORD_ARGON2ID, [
            'memory_cost' => 65536, // 64 MB
            'time_cost' => 4,       // 4 iterations
            'threads' => 3          // 3 threads
        ]);
        
        // Create user
        $stmt = $this->pdo->prepare("
            INSERT INTO users (username, email, password_hash, first_name, last_name, phone, country, is_active, created_at, password_updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
        ");
        
        try {
            $stmt->execute([
                $userData['username'],
                $userData['email'],
                $passwordHash,
                $userData['first_name'],
                $userData['last_name'],
                $userData['phone'] ?? null,
                $userData['country'] ?? null
            ]);
            
            $userId = $this->pdo->lastInsertId();
            
            // Assign default role
            $stmt = $this->pdo->prepare("
                INSERT INTO user_roles (user_id, role_id) 
                SELECT ?, id FROM roles WHERE name = 'Client'
            ");
            $stmt->execute([$userId]);
            
            // Log successful registration
            $this->logSecurityEvent('registration_success', "Successful registration: {$userData['email']}", $userId, 'low');
            
            return ['success' => true, 'user_id' => $userId];
            
        } catch (Exception $e) {
            $this->logSecurityEvent('registration_error', "Registration error: {$e->getMessage()}", null, 'high');
            $this->sendErrorResponse(500, 'Registration failed');
        }
    }
    
    /**
     * Get bearer token from request
     */
    private function getBearerToken() {
        // Check Authorization header
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? null;
        if ($authHeader && preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
            return $matches[1];
        }
        
        // Check query parameter
        if (isset($_GET['token']) && !empty($_GET['token'])) {
            return trim($_GET['token']);
        }
        
        // Check JSON body
        $input = json_decode(file_get_contents('php://input'), true);
        if (is_array($input) && isset($input['token']) && !empty($input['token'])) {
            return $input['token'];
        }
        
        return null;
    }
    
    /**
     * Get client IP address
     */
    private function getClientIP() {
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];
        
        foreach ($ipKeys as $key) {
            if (array_key_exists($key, $_SERVER) === true) {
                $ip = $_SERVER[$key];
                if (strpos($ip, ',') !== false) {
                    $ip = explode(',', $ip)[0];
                }
                $ip = trim($ip);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }
        
        return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
    
    /**
     * Log security event
     */
    private function logSecurityEvent($event, $details, $userId = null, $severity = 'medium') {
        $this->security->logSecurityEvent($event, $details, $userId, $severity);
    }
    
    /**
     * Send error response
     */
    private function sendErrorResponse($code, $message) {
        http_response_code($code);
        echo json_encode(['error' => $message]);
        exit();
    }
}

// Global authentication middleware instance
$authMiddleware = null;

/**
 * Initialize authentication middleware
 */
function initAuthMiddleware($pdo) {
    global $authMiddleware;
    $authMiddleware = new AuthenticationMiddleware($pdo);
}

/**
 * Get authentication middleware instance
 */
function getAuthMiddleware() {
    global $authMiddleware;
    return $authMiddleware;
}

/**
 * Require authentication for endpoint
 */
function requireAuth($requiredRoles = [], $requireCSRF = false) {
    global $authMiddleware;
    if (!$authMiddleware) {
        throw new Exception('Authentication middleware not initialized');
    }
    return $authMiddleware->authenticate($requiredRoles, $requireCSRF);
}

/**
 * Require admin or super admin role
 */
function requireAdminOrSuperAdmin() {
    return requireAuth(['Admin', 'Super Admin']);
}

/**
 * Require super admin role
 */
function requireSuperAdmin() {
    return requireAuth(['Super Admin']);
}
