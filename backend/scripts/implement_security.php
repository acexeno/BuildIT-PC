<?php
/**
 * Security Implementation Script
 * This script implements comprehensive security measures for the PC Building System
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/enhanced_security.php';
require_once __DIR__ . '/../middleware/auth_middleware.php';

class SecurityImplementation {
    private $pdo;
    private $security;
    
    public function __construct() {
        $this->pdo = get_db_connection();
        $this->security = new EnhancedSecurity($this->pdo);
    }
    
    /**
     * Run all security implementations
     */
    public function implementSecurity() {
        echo "🔒 Implementing Enhanced Security Measures...\n\n";
        
        $this->setupSecurityTables();
        $this->enableRateLimiting();
        $this->implementCSRFProtection();
        $this->enhancePasswordSecurity();
        $this->implementFileUploadSecurity();
        $this->setupSecurityMonitoring();
        $this->configureSecurityHeaders();
        $this->implementSessionSecurity();
        $this->setupBackupSecurity();
        
        echo "\n✅ Security implementation completed successfully!\n";
        echo "📋 Next steps:\n";
        echo "1. Update your .env file with strong secrets (use secure.env.template)\n";
        echo "2. Enable HTTPS in production\n";
        echo "3. Configure firewall rules\n";
        echo "4. Set up monitoring alerts\n";
        echo "5. Test all security measures\n\n";
    }
    
    /**
     * Setup security tables
     */
    private function setupSecurityTables() {
        echo "📊 Setting up security tables...\n";
        
        // The EnhancedSecurity class already creates these tables
        // We'll add any additional security-related tables here
        
        // Security audit log
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS security_audit_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                action VARCHAR(100) NOT NULL,
                resource VARCHAR(100),
                old_values JSON,
                new_values JSON,
                ip_address VARCHAR(45),
                user_agent TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_user_action (user_id, action),
                INDEX idx_action_time (action, created_at),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            )
        ");
        
        // Failed login attempts with enhanced tracking
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS failed_login_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255),
                email VARCHAR(255),
                ip_address VARCHAR(45) NOT NULL,
                user_agent TEXT,
                attempt_count INT DEFAULT 1,
                last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                first_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_blocked TINYINT(1) DEFAULT 0,
                INDEX idx_username_ip (username, ip_address),
                INDEX idx_ip_time (ip_address, last_attempt),
                INDEX idx_blocked (is_blocked)
            )
        ");
        
        echo "✅ Security tables created\n";
    }
    
    /**
     * Enable rate limiting
     */
    private function enableRateLimiting() {
        echo "⏱️ Enabling rate limiting...\n";
        
        // Update auth.php to enable rate limiting
        $authFile = __DIR__ . '/../api/auth.php';
        if (file_exists($authFile)) {
            $content = file_get_contents($authFile);
            
            // Uncomment rate limiting code
            $content = str_replace(
                '// Rate limiting placeholder: enable in production to slow brute-force attempts',
                '// Rate limiting enabled for security',
                $content
            );
            
            $content = str_replace(
                '// if (!checkLoginRateLimit($pdo, $username, (int)env(\'LOGIN_MAX_ATTEMPTS\', 5), (int)env(\'LOGIN_LOCKOUT_TIME\', 900))) {',
                'if (!checkLoginRateLimit($pdo, $username, (int)env(\'LOGIN_MAX_ATTEMPTS\', 5), (int)env(\'LOGIN_LOCKOUT_TIME\', 900))) {',
                $content
            );
            
            $content = str_replace(
                '//     http_response_code(429);',
                '    http_response_code(429);',
                $content
            );
            
            $content = str_replace(
                '//     echo json_encode([\'error\' => \'Too many login attempts. Please try again later.\']);',
                '    echo json_encode([\'error\' => \'Too many login attempts. Please try again later.\']);',
                $content
            );
            
            $content = str_replace(
                '//     return;',
                '    return;',
                $content
            );
            
            $content = str_replace(
                '// }',
                '}',
                $content
            );
            
            file_put_contents($authFile, $content);
        }
        
        echo "✅ Rate limiting enabled\n";
    }
    
    /**
     * Implement CSRF protection
     */
    private function implementCSRFProtection() {
        echo "🛡️ Implementing CSRF protection...\n";
        
        // Create CSRF token endpoint
        $csrfEndpoint = __DIR__ . '/../api/csrf.php';
        $csrfContent = '<?php
require_once __DIR__ . "/../config/enhanced_security.php";
require_once __DIR__ . "/../config/database.php";

header("Content-Type: application/json");

$pdo = get_db_connection();
$security = new EnhancedSecurity($pdo);

if ($_SERVER["REQUEST_METHOD"] === "GET") {
    $token = $security->generateCSRFToken();
    echo json_encode(["csrf_token" => $token]);
} else {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
}
';
        
        file_put_contents($csrfEndpoint, $csrfContent);
        
        echo "✅ CSRF protection implemented\n";
    }
    
    /**
     * Enhance password security
     */
    private function enhancePasswordSecurity() {
        echo "🔐 Enhancing password security...\n";
        
        // Add password history tracking
        $this->pdo->exec("
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ADD COLUMN IF NOT EXISTS password_history_count INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS failed_login_count INT DEFAULT 0,
            ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMP NULL,
            ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP NULL
        ");
        
        // Create password reset tokens table
        $this->pdo->exec("
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMP NOT NULL,
                used_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_token (token),
                INDEX idx_user (user_id),
                INDEX idx_expires (expires_at),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        ");
        
        echo "✅ Password security enhanced\n";
    }
    
    /**
     * Implement file upload security
     */
    private function implementFileUploadSecurity() {
        echo "📁 Implementing file upload security...\n";
        
        // Create secure file upload handler
        $uploadHandler = __DIR__ . '/../api/secure_upload.php';
        $uploadContent = '<?php
require_once __DIR__ . "/../config/enhanced_security.php";
require_once __DIR__ . "/../middleware/auth_middleware.php";
require_once __DIR__ . "/../config/database.php";

header("Content-Type: application/json");

$pdo = get_db_connection();
$security = new EnhancedSecurity($pdo);

// Require authentication
$user = requireAuth();

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    http_response_code(405);
    echo json_encode(["error" => "Method not allowed"]);
    exit;
}

if (!isset($_FILES["file"])) {
    http_response_code(400);
    echo json_encode(["error" => "No file uploaded"]);
    exit;
}

// Check rate limiting for file uploads
if (!$security->checkRateLimit("file_upload", $user["username"])) {
    http_response_code(429);
    echo json_encode(["error" => "Too many file uploads"]);
    exit;
}

// Validate file upload
$errors = $security->validateFileUpload($_FILES["file"]);
if (!empty($errors)) {
    http_response_code(400);
    echo json_encode(["error" => "File validation failed", "details" => $errors]);
    exit;
}

// Generate secure filename
$file = $_FILES["file"];
$extension = strtolower(pathinfo($file["name"], PATHINFO_EXTENSION));
$secureFilename = bin2hex(random_bytes(16)) . "." . $extension;
$uploadPath = __DIR__ . "/../uploads/" . $secureFilename;

// Create uploads directory if it doesn\'t exist
if (!is_dir(__DIR__ . "/../uploads")) {
    mkdir(__DIR__ . "/../uploads", 0755, true);
}

// Move uploaded file
if (move_uploaded_file($file["tmp_name"], $uploadPath)) {
    // Log successful upload
    $security->logSecurityEvent("file_upload_success", "File uploaded: " . $file["name"], $user["user_id"], "low");
    
    echo json_encode([
        "success" => true,
        "filename" => $secureFilename,
        "original_name" => $file["name"],
        "size" => $file["size"],
        "url" => "/uploads/" . $secureFilename
    ]);
} else {
    $security->logSecurityEvent("file_upload_failed", "File upload failed: " . $file["name"], $user["user_id"], "medium");
    http_response_code(500);
    echo json_encode(["error" => "File upload failed"]);
}
';
        
        file_put_contents($uploadHandler, $uploadContent);
        
        // Create uploads directory with proper permissions
        $uploadsDir = __DIR__ . '/../uploads';
        if (!is_dir($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }
        
        // Create .htaccess for uploads directory
        $htaccessContent = 'Options -Indexes
<Files "*.php">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.phtml">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.php3">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.php4">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.php5">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.pl">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.py">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.jsp">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.asp">
    Order Deny,Allow
    Deny from all
</Files>
<Files "*.sh">
    Order Deny,Allow
    Deny from all
</Files>
';
        
        file_put_contents($uploadsDir . '/.htaccess', $htaccessContent);
        
        echo "✅ File upload security implemented\n";
    }
    
    /**
     * Setup security monitoring
     */
    private function setupSecurityMonitoring() {
        echo "📊 Setting up security monitoring...\n";
        
        // Create security monitoring script
        $monitoringScript = __DIR__ . '/../scripts/security_monitor.php';
        $monitoringContent = '<?php
/**
 * Security Monitoring Script
 * Run this script periodically to monitor security events
 */

require_once __DIR__ . "/../config/database.php";

$pdo = get_db_connection();

// Check for suspicious activity
$stmt = $pdo->query("
    SELECT ip_address, COUNT(*) as attempts, MAX(created_at) as last_attempt
    FROM security_logs 
    WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    AND severity IN (\'high\', \'critical\')
    GROUP BY ip_address
    HAVING attempts > 10
");

$suspiciousIPs = $stmt->fetchAll();

foreach ($suspiciousIPs as $ip) {
    echo "Suspicious activity detected from IP: {$ip[\'ip_address\']} ({$ip[\'attempts\']} attempts)\n";
    
    // Block IP if too many attempts
    if ($ip[\'attempts\'] > 20) {
        $blockStmt = $pdo->prepare("
            INSERT INTO blocked_ips (ip_address, reason, blocked_until) 
            VALUES (?, \'Automated blocking due to suspicious activity\', DATE_ADD(NOW(), INTERVAL 24 HOUR))
            ON DUPLICATE KEY UPDATE 
            reason = VALUES(reason), 
            blocked_until = VALUES(blocked_until)
        ");
        $blockStmt->execute([$ip[\'ip_address\']]);
        echo "IP {$ip[\'ip_address\']} blocked for 24 hours\n";
    }
}

// Clean old security logs
$cleanStmt = $pdo->prepare("
    DELETE FROM security_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
");
$cleanStmt->execute();

echo "Security monitoring completed\n";
';
        
        file_put_contents($monitoringScript, $monitoringContent);
        
        echo "✅ Security monitoring setup completed\n";
    }
    
    /**
     * Configure security headers
     */
    private function configureSecurityHeaders() {
        echo "🔒 Configuring security headers...\n";
        
        // Update .htaccess with security headers
        $htaccessFile = __DIR__ . '/../.htaccess';
        $htaccessContent = file_get_contents($htaccessFile);
        
        $securityHeaders = '
# Security Headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "DENY"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
    Header always set Permissions-Policy "geolocation=(), microphone=(), camera=()"
    
    # HSTS (only for HTTPS)
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" env=HTTPS
</IfModule>

# Prevent access to sensitive files
<FilesMatch "\.(env|log|sql|bak|backup)$">
    Order Deny,Allow
    Deny from all
</FilesMatch>

# Prevent access to configuration files
<FilesMatch "^(config|database|security)\.php$">
    Order Deny,Allow
    Deny from all
</FilesMatch>
';
        
        $htaccessContent .= $securityHeaders;
        file_put_contents($htaccessFile, $htaccessContent);
        
        echo "✅ Security headers configured\n";
    }
    
    /**
     * Implement session security
     */
    private function implementSessionSecurity() {
        echo "🔐 Implementing session security...\n";
        
        // Create session configuration
        $sessionConfig = __DIR__ . '/../config/session_config.php';
        $sessionContent = '<?php
/**
 * Session Security Configuration
 */

// Session security settings
ini_set("session.cookie_httponly", 1);
ini_set("session.cookie_secure", isset($_SERVER["HTTPS"]) ? 1 : 0);
ini_set("session.cookie_samesite", "Strict");
ini_set("session.use_strict_mode", 1);
ini_set("session.cookie_lifetime", 3600); // 1 hour
ini_set("session.gc_maxlifetime", 3600);

// Regenerate session ID periodically
if (!isset($_SESSION["last_regeneration"])) {
    $_SESSION["last_regeneration"] = time();
} elseif (time() - $_SESSION["last_regeneration"] > 1800) { // 30 minutes
    session_regenerate_id(true);
    $_SESSION["last_regeneration"] = time();
}

// Set secure session parameters
session_set_cookie_params([
    "lifetime" => 3600,
    "path" => "/",
    "domain" => "",
    "secure" => isset($_SERVER["HTTPS"]),
    "httponly" => true,
    "samesite" => "Strict"
]);
';
        
        file_put_contents($sessionConfig, $sessionContent);
        
        echo "✅ Session security implemented\n";
    }
    
    /**
     * Setup backup security
     */
    private function setupBackupSecurity() {
        echo "💾 Setting up backup security...\n";
        
        // Create backup script
        $backupScript = __DIR__ . '/../scripts/secure_backup.php';
        $backupContent = '<?php
/**
 * Secure Backup Script
 * Creates encrypted backups of the database
 */

require_once __DIR__ . "/../config/database.php";

$backupDir = __DIR__ . "/../backups";
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

$timestamp = date("Y-m-d_H-i-s");
$backupFile = $backupDir . "/backup_" . $timestamp . ".sql";

// Database credentials
$host = env("DB_HOST", "localhost");
$dbname = env("DB_NAME", "builditpc_db");
$user = env("DB_USER", "root");
$pass = env("DB_PASS", "");

// Create mysqldump command
$command = "mysqldump -h $host -u $user -p$pass $dbname > $backupFile";

// Execute backup
exec($command, $output, $returnCode);

if ($returnCode === 0) {
    echo "Backup created successfully: $backupFile\n";
    
    // Compress backup
    exec("gzip $backupFile");
    echo "Backup compressed: $backupFile.gz\n";
    
    // Encrypt backup (if encryption key is available)
    $encryptionKey = env("ENCRYPTION_KEY", "");
    if ($encryptionKey) {
        $encryptedFile = $backupFile . ".gz.enc";
        $command = "openssl enc -aes-256-cbc -salt -in $backupFile.gz -out $encryptedFile -k $encryptionKey";
        exec($command, $output, $returnCode);
        
        if ($returnCode === 0) {
            unlink($backupFile . ".gz");
            echo "Backup encrypted: $encryptedFile\n";
        }
    }
    
    // Clean old backups (keep only last 30 days)
    $files = glob($backupDir . "/backup_*.sql*");
    foreach ($files as $file) {
        if (filemtime($file) < time() - (30 * 24 * 60 * 60)) {
            unlink($file);
            echo "Old backup removed: " . basename($file) . "\n";
        }
    }
} else {
    echo "Backup failed with return code: $returnCode\n";
}
';
        
        file_put_contents($backupScript, $backupContent);
        
        echo "✅ Backup security setup completed\n";
    }
}

// Run security implementation
if (php_sapi_name() === 'cli') {
    $implementation = new SecurityImplementation();
    $implementation->implementSecurity();
} else {
    echo "This script should be run from the command line.\n";
}
