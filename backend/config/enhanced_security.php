<?php
/**
 * Enhanced Security Configuration
 * Comprehensive security measures for production deployment
 */

require_once __DIR__ . '/env.php';

class EnhancedSecurity {
    private $pdo;
    private $config;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->config = $this->getSecurityConfig();
        $this->setupSecurityTables();
    }
    
    /**
     * Get security configuration based on environment
     */
    private function getSecurityConfig() {
        $isProduction = env('APP_ENV', 'development') === 'production';
        
        return [
            'rate_limits' => [
                'login' => ['max' => $isProduction ? 5 : 10, 'window' => 900],
                'register' => ['max' => $isProduction ? 3 : 5, 'window' => 3600],
                'otp_request' => ['max' => $isProduction ? 5 : 10, 'window' => 3600],
                'api_call' => ['max' => $isProduction ? 100 : 1000, 'window' => 3600],
                'password_reset' => ['max' => 3, 'window' => 3600],
                'file_upload' => ['max' => 10, 'window' => 3600],
            ],
            'password_requirements' => [
                'min_length' => $isProduction ? 12 : 8,
                'require_uppercase' => true,
                'require_lowercase' => true,
                'require_numbers' => true,
                'require_special' => true,
                'max_age_days' => $isProduction ? 90 : 365,
            ],
            'session_security' => [
                'timeout' => $isProduction ? 3600 : 7200,
                'regenerate_interval' => 1800, // 30 minutes
                'secure_cookies' => $isProduction,
                'httponly_cookies' => true,
                'samesite' => $isProduction ? 'Strict' : 'Lax',
            ],
            'file_upload' => [
                'max_size' => 5242880, // 5MB
                'allowed_types' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                'scan_content' => $isProduction,
                'quarantine_suspicious' => $isProduction,
                'virus_scan' => $isProduction,
            ],
            'monitoring' => [
                'log_failed_attempts' => true,
                'log_suspicious_activity' => true,
                'alert_threshold' => 10,
                'block_threshold' => 20,
                'block_duration' => 3600,
            ]
        ];
    }
    
    /**
     * Enhanced rate limiting with IP and user-based tracking
     */
    public function checkRateLimit($action, $identifier = null, $ipAddress = null) {
        $identifier = $identifier ?: $this->getIdentifier();
        $ipAddress = $ipAddress ?: $this->getClientIP();
        
        $limit = $this->config['rate_limits'][$action] ?? ['max' => 10, 'window' => 3600];
        
        // Check IP-based rate limit
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as attempts 
            FROM rate_limits 
            WHERE ip_address = ? AND action = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
        ");
        $stmt->execute([$ipAddress, $action, $limit['window']]);
        $ipAttempts = $stmt->fetch()['attempts'];
        
        // Check identifier-based rate limit
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as attempts 
            FROM rate_limits 
            WHERE identifier = ? AND action = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
        ");
        $stmt->execute([$identifier, $action, $limit['window']]);
        $idAttempts = $stmt->fetch()['attempts'];
        
        return $ipAttempts < $limit['max'] && $idAttempts < $limit['max'];
    }
    
    /**
     * Record rate limit attempt
     */
    public function recordRateLimitAttempt($action, $identifier = null, $ipAddress = null) {
        $identifier = $identifier ?: $this->getIdentifier();
        $ipAddress = $ipAddress ?: $this->getClientIP();
        
        $stmt = $this->pdo->prepare("
            INSERT INTO rate_limits (identifier, ip_address, action, created_at) 
            VALUES (?, ?, ?, NOW())
        ");
        $stmt->execute([$identifier, $ipAddress, $action]);
    }
    
    /**
     * Enhanced password validation
     */
    public function validatePassword($password, $username = null, $email = null) {
        $errors = [];
        $requirements = $this->config['password_requirements'];
        
        // Basic requirements
        if (strlen($password) < $requirements['min_length']) {
            $errors[] = "Password must be at least {$requirements['min_length']} characters long";
        }
        
        if ($requirements['require_uppercase'] && !preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Password must contain at least one uppercase letter';
        }
        
        if ($requirements['require_lowercase'] && !preg_match('/[a-z]/', $password)) {
            $errors[] = 'Password must contain at least one lowercase letter';
        }
        
        if ($requirements['require_numbers'] && !preg_match('/[0-9]/', $password)) {
            $errors[] = 'Password must contain at least one number';
        }
        
        if ($requirements['require_special'] && !preg_match('/[^A-Za-z0-9]/', $password)) {
            $errors[] = 'Password must contain at least one special character';
        }
        
        // Check against common passwords
        if ($this->isCommonPassword($password)) {
            $errors[] = 'Password is too common. Please choose a more unique password';
        }
        
        // Check against username/email
        if ($username && stripos($password, $username) !== false) {
            $errors[] = 'Password cannot contain your username';
        }
        
        if ($email) {
            $emailPart = explode('@', $email)[0];
            if (stripos($password, $emailPart) !== false) {
                $errors[] = 'Password cannot contain your email address';
            }
        }
        
        return $errors;
    }
    
    /**
     * Check if password is in common passwords list
     */
    private function isCommonPassword($password) {
        $commonPasswords = [
            'password', '123456', 'password123', 'admin', 'qwerty',
            'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
        ];
        
        return in_array(strtolower($password), $commonPasswords);
    }
    
    /**
     * Enhanced file upload validation
     */
    public function validateFileUpload($file) {
        $errors = [];
        $config = $this->config['file_upload'];
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $errors[] = 'File upload error';
            return $errors;
        }
        
        // Size check
        if ($file['size'] > $config['max_size']) {
            $errors[] = 'File too large. Maximum size: ' . ($config['max_size'] / 1024 / 1024) . 'MB';
        }
        
        // MIME type check
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, $config['allowed_types'])) {
            $errors[] = 'Invalid file type. Allowed: ' . implode(', ', $config['allowed_types']);
        }
        
        // Content scan for malicious files
        if ($config['scan_content']) {
            $content = file_get_contents($file['tmp_name']);
            if ($this->containsMaliciousContent($content)) {
                $errors[] = 'File contains potentially malicious content';
            }
        }
        
        // File extension validation
        $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        if (!in_array($extension, $allowedExtensions)) {
            $errors[] = 'Invalid file extension';
        }
        
        return $errors;
    }
    
    /**
     * Check for malicious content in files
     */
    private function containsMaliciousContent($content) {
        $maliciousPatterns = [
            '/<\?php/i',
            '/<script/i',
            '/javascript:/i',
            '/vbscript:/i',
            '/onload\s*=/i',
            '/onerror\s*=/i',
            '/eval\s*\(/i',
            '/exec\s*\(/i',
            '/system\s*\(/i',
            '/shell_exec\s*\(/i',
        ];
        
        foreach ($maliciousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Generate secure CSRF token
     */
    public function generateCSRFToken() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $token = bin2hex(random_bytes(32));
        $_SESSION['csrf_token'] = $token;
        $_SESSION['csrf_token_time'] = time();
        
        return $token;
    }
    
    /**
     * Verify CSRF token
     */
    public function verifyCSRFToken($token) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token']) || !isset($_SESSION['csrf_token_time'])) {
            return false;
        }
        
        // Token expires after 1 hour
        if (time() - $_SESSION['csrf_token_time'] > 3600) {
            unset($_SESSION['csrf_token'], $_SESSION['csrf_token_time']);
            return false;
        }
        
        return hash_equals($_SESSION['csrf_token'], $token);
    }
    
    /**
     * Enhanced security headers
     */
    public function setEnhancedSecurityHeaders() {
        // Prevent clickjacking
        header('X-Frame-Options: DENY');
        
        // Prevent MIME type sniffing
        header('X-Content-Type-Options: nosniff');
        
        // Enable XSS protection
        header('X-XSS-Protection: 1; mode=block');
        
        // Referrer policy
        header('Referrer-Policy: strict-origin-when-cross-origin');
        
        // Content Security Policy
        $csp = $this->getContentSecurityPolicy();
        header("Content-Security-Policy: $csp");
        
        // HSTS (only in production with HTTPS)
        if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') {
            header('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload');
        }
        
        // Permissions Policy
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    }
    
    /**
     * Get Content Security Policy
     */
    private function getContentSecurityPolicy() {
        $isProduction = env('APP_ENV', 'development') === 'production';
        
        if ($isProduction) {
            return "default-src 'self'; " .
                   "script-src 'self'; " .
                   "style-src 'self' 'unsafe-inline'; " .
                   "img-src 'self' data: https:; " .
                   "font-src 'self' data:; " .
                   "connect-src 'self'; " .
                   "frame-ancestors 'none'; " .
                   "base-uri 'self'; " .
                   "form-action 'self'; " .
                   "object-src 'none'; " .
                   "media-src 'self';";
        } else {
            return "default-src 'self'; " .
                   "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " .
                   "style-src 'self' 'unsafe-inline'; " .
                   "img-src 'self' data: https:; " .
                   "font-src 'self' data:; " .
                   "connect-src 'self'; " .
                   "frame-ancestors 'none';";
        }
    }
    
    /**
     * Log security events
     */
    public function logSecurityEvent($event, $details, $userId = null, $severity = 'medium') {
        $ipAddress = $this->getClientIP();
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        $stmt = $this->pdo->prepare("
            INSERT INTO security_logs (event, details, user_id, ip_address, user_agent, severity, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$event, $details, $userId, $ipAddress, $userAgent, $severity]);
        
        // Alert if high severity
        if ($severity === 'high') {
            $this->sendSecurityAlert($event, $details, $ipAddress);
        }
    }
    
    /**
     * Send security alert (implement based on your notification system)
     */
    private function sendSecurityAlert($event, $details, $ipAddress) {
        // Implement email/SMS alerts for critical security events
        error_log("SECURITY ALERT: $event - $details - IP: $ipAddress");
    }
    
    /**
     * Check for suspicious activity patterns
     */
    public function detectSuspiciousActivity($userId = null) {
        $ipAddress = $this->getClientIP();
        
        // Check for rapid successive requests
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as count 
            FROM security_logs 
            WHERE ip_address = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)
        ");
        $stmt->execute([$ipAddress]);
        $recentRequests = $stmt->fetch()['count'];
        
        if ($recentRequests > 50) {
            $this->logSecurityEvent('rapid_requests', "Rapid requests detected: $recentRequests in 60 seconds", $userId, 'high');
            return true;
        }
        
        // Check for multiple failed login attempts
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as count 
            FROM security_logs 
            WHERE ip_address = ? AND event = 'login_failed' AND created_at > DATE_SUB(NOW(), INTERVAL 300 SECOND)
        ");
        $stmt->execute([$ipAddress]);
        $failedLogins = $stmt->fetch()['count'];
        
        if ($failedLogins > 10) {
            $this->logSecurityEvent('brute_force_attempt', "Multiple failed logins detected: $failedLogins in 5 minutes", $userId, 'high');
            return true;
        }
        
        return false;
    }
    
    /**
     * Block IP address temporarily
     */
    public function blockIP($ipAddress, $duration = 3600, $reason = 'Suspicious activity') {
        $stmt = $this->pdo->prepare("
            INSERT INTO blocked_ips (ip_address, reason, blocked_until, created_at) 
            VALUES (?, ?, DATE_ADD(NOW(), INTERVAL ? SECOND), NOW())
            ON DUPLICATE KEY UPDATE 
            reason = VALUES(reason), 
            blocked_until = VALUES(blocked_until)
        ");
        $stmt->execute([$ipAddress, $reason, $duration]);
        
        $this->logSecurityEvent('ip_blocked', "IP blocked: $ipAddress - Reason: $reason", null, 'high');
    }
    
    /**
     * Check if IP is blocked
     */
    public function isIPBlocked($ipAddress) {
        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) as count 
            FROM blocked_ips 
            WHERE ip_address = ? AND blocked_until > NOW()
        ");
        $stmt->execute([$ipAddress]);
        return $stmt->fetch()['count'] > 0;
    }
    
    /**
     * Setup enhanced security tables
     */
    private function setupSecurityTables() {
        // Rate limits table
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS rate_limits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                identifier VARCHAR(255) NOT NULL,
                ip_address VARCHAR(45) NOT NULL,
                action VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_identifier_action_time (identifier, action, created_at),
                INDEX idx_ip_action_time (ip_address, action, created_at)
            )
        ");
        
        // Enhanced security logs
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS security_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event VARCHAR(100) NOT NULL,
                details TEXT,
                user_id INT NULL,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_event_time (event, created_at),
                INDEX idx_user_time (user_id, created_at),
                INDEX idx_ip_time (ip_address, created_at),
                INDEX idx_severity_time (severity, created_at)
            )
        ");
        
        // Blocked IPs table
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS blocked_ips (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_address VARCHAR(45) NOT NULL UNIQUE,
                reason TEXT,
                blocked_until TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_ip_blocked (ip_address, blocked_until)
            )
        ");
        
        // Password history table
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS password_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_time (user_id, created_at),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
        
        // Session management table
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                session_token VARCHAR(255) NOT NULL UNIQUE,
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                INDEX idx_user_token (user_id, session_token),
                INDEX idx_token (session_token),
                INDEX idx_expires (expires_at),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
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
     * Get identifier for rate limiting
     */
    private function getIdentifier() {
        // Try to get from Authorization header first
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            $payload = verifyJWT($token);
            if ($payload && isset($payload['username'])) {
                return $payload['username'];
            }
        }
        
        // Fall back to IP address
        return $this->getClientIP();
    }
}

// Global security instance
$enhancedSecurity = null;

/**
 * Initialize enhanced security
 */
function initEnhancedSecurity($pdo) {
    global $enhancedSecurity;
    $enhancedSecurity = new EnhancedSecurity($pdo);
}

/**
 * Get enhanced security instance
 */
function getEnhancedSecurity() {
    global $enhancedSecurity;
    return $enhancedSecurity;
}
