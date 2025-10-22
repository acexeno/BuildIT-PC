<?php
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
    AND severity IN ('high', 'critical')
    GROUP BY ip_address
    HAVING attempts > 10
");

$suspiciousIPs = $stmt->fetchAll();

foreach ($suspiciousIPs as $ip) {
    echo "Suspicious activity detected from IP: {$ip['ip_address']} ({$ip['attempts']} attempts)\n";
    
    // Block IP if too many attempts
    if ($ip['attempts'] > 20) {
        $blockStmt = $pdo->prepare("
            INSERT INTO blocked_ips (ip_address, reason, blocked_until) 
            VALUES (?, 'Automated blocking due to suspicious activity', DATE_ADD(NOW(), INTERVAL 24 HOUR))
            ON DUPLICATE KEY UPDATE 
            reason = VALUES(reason), 
            blocked_until = VALUES(blocked_until)
        ");
        $blockStmt->execute([$ip['ip_address']]);
        echo "IP {$ip['ip_address']} blocked for 24 hours\n";
    }
}

// Clean old security logs
$cleanStmt = $pdo->prepare("
    DELETE FROM security_logs 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
");
$cleanStmt->execute();

echo "Security monitoring completed\n";
