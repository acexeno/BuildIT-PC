<?php
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
