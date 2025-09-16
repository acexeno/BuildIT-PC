<?php
// Clean components table: keep only PC components (category_id 1-8, is_active=1)
require_once __DIR__ . '/backend/config/database.php';
$pdo = get_db_connection();

// Delete non-PC components
$deleteSql = "DELETE FROM components WHERE category_id < 1 OR category_id > 8 OR is_active != 1";
$deleted = $pdo->exec($deleteSql);
echo "Deleted $deleted non-PC components.\n";

// Optionally, optimize table
$pdo->exec("OPTIMIZE TABLE components");
echo "PC components table cleaned and optimized.\n";
