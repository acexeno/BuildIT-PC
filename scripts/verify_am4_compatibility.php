<?php
// Verify AM4 CPU compatibility against an AM4 motherboard by applying the same normalization heuristics
// used by the backend API and frontend compatibility service.

require_once __DIR__ . '/../backend/config/database.php';

$pdo = get_db_connection();

function normalize_brand_from_fields($row) {
    $brandCandidate = '';
    if (!empty($row['brand'])) $brandCandidate = strtolower($row['brand']);
    else if (!empty($row['name'])) $brandCandidate = strtolower($row['name']);
    else if (!empty($row['model'])) $brandCandidate = strtolower($row['model']);
    else if (!empty($row['type'])) $brandCandidate = strtolower($row['type']);
    if (strpos($brandCandidate, 'amd') !== false || strpos($brandCandidate, 'ryzen') !== false) return 'AMD';
    if (strpos($brandCandidate, 'intel') !== false || strpos($brandCandidate, 'core') !== false) return 'Intel';
    return $row['brand'] ?? null;
}

function normalize_socket_string($s) {
    if (!$s) return null;
    $sLower = strtolower($s);
    $sClean = str_replace([' ', '-', '_'], '', $sLower);
    if (strpos($sClean, 'am4') !== false || strpos($sClean, 'amd4') !== false) return 'AM4';
    if (strpos($sClean, 'am5') !== false || strpos($sClean, 'amd5') !== false) return 'AM5';
    if (strpos($sLower, 'lga1200') !== false) return 'LGA1200';
    if (strpos($sLower, 'lga1700') !== false) return 'LGA1700';
    if (strpos($sLower, 'lga1151') !== false) return 'LGA1151';
    if (strpos($sLower, 'lga2066') !== false) return 'LGA2066';
    return strtoupper($s);
}

function normalize_row(&$row) {
    // Decode specs if present
    if (isset($row['specs']) && is_string($row['specs'])) {
        $dec = json_decode($row['specs']);
        if ($dec && is_object($dec)) $row['specs'] = $dec; else $row['specs'] = null;
    }
    // Brand
    if (empty($row['brand'])) {
        $row['brand'] = normalize_brand_from_fields($row);
    }
    // Socket from fields
    $socket = '';
    if (!empty($row['socket'])) $socket = $row['socket'];
    else if (!empty($row['type'])) $socket = $row['type'];
    else if (!empty($row['model'])) $socket = $row['model'];
    else if (!empty($row['name'])) $socket = $row['name'];
    $norm = normalize_socket_string($socket);

    // AMD Ryzen shorthand detection from name (e.g., "R5 5600X", "R7 5700G", "R7 5700X3D", "R5-7600X")
    if ((!$norm || $norm === '' || !in_array($norm, ['AM4','AM5','LGA1200','LGA1700','LGA1151','LGA2066'])) && !empty($row['name'])) {
        $lowerName = strtolower($row['name']);
        if (preg_match('/\br[3579]\s*-?\s*(\d{4})([a-z0-9]*)?/i', $lowerName, $m)) {
            $series = intval($m[1]);
            if ($series >= 7000) {
                $norm = 'AM5';
            } else if ($series >= 1000) {
                // Treat 1000-6999 as AM4 for desktop parts in our data
                $norm = 'AM4';
            }
        }
    }

    // If still empty, try specs
    if ((!$norm || $norm === '') && isset($row['specs']) && is_object($row['specs'])) {
        if (!empty($row['specs']->socket)) {
            $norm = normalize_socket_string($row['specs']->socket);
        }
    }

    $row['_socket_normalized'] = $norm;
}

function fetch_category_id($pdo, $name) {
    $stmt = $pdo->prepare("SELECT id FROM component_categories WHERE UPPER(name)=UPPER(?)");
    $stmt->execute([$name]);
    $cat = $stmt->fetch(PDO::FETCH_ASSOC);
    return $cat ? (int)$cat['id'] : 0;
}

try {
    $catMobo = fetch_category_id($pdo, 'Motherboard');
    $catCPU  = fetch_category_id($pdo, 'CPU');

    if (!$catMobo || !$catCPU) {
        echo json_encode(['success' => false, 'error' => 'Required categories not found']);
        exit;
    }

    // Pull a sample of motherboards and find the first AM4 after normalization
    $mStmt = $pdo->prepare("SELECT * FROM components WHERE category_id = ? AND (is_active IS NULL OR is_active=1) ORDER BY id ASC LIMIT 300");
    $mStmt->execute([$catMobo]);
    $mobos = $mStmt->fetchAll(PDO::FETCH_ASSOC);

    $am4Mobo = null;
    foreach ($mobos as $m) {
        normalize_row($m);
        $brand = $m['brand'] ?? '';
        $sock  = $m['_socket_normalized'] ?? null;
        if ($sock === 'AM4' || ($brand === 'AMD' && $sock === null && stripos($m['name'] ?? '', 'am4') !== false)) {
            $am4Mobo = $m;
            break;
        }
    }

    if (!$am4Mobo) {
        echo json_encode(['success' => false, 'error' => 'No AM4 motherboard found by normalization. Try adding motherboard socket data.']);
        exit;
    }

    // Pull CPUs and measure compatibility by normalized socket
    $cStmt = $pdo->prepare("SELECT * FROM components WHERE category_id = ? AND (is_active IS NULL OR is_active=1)");
    $cStmt->execute([$catCPU]);
    $cpus = $cStmt->fetchAll(PDO::FETCH_ASSOC);

    $compatible = [];
    $incompatible = [];

    foreach ($cpus as $cpu) {
        normalize_row($cpu);
        $cpuSock = $cpu['_socket_normalized'] ?? null;
        if ($cpuSock === 'AM4') {
            $compatible[] = $cpu;
        } else {
            $incompatible[] = [
                'id' => $cpu['id'],
                'name' => $cpu['name'],
                'normalized_socket' => $cpuSock
            ];
        }
    }

    $summary = [
        'success' => true,
        'motherboard' => [
            'id' => $am4Mobo['id'],
            'name' => $am4Mobo['name'],
            'brand' => $am4Mobo['brand'] ?? null,
            'normalized_socket' => $am4Mobo['_socket_normalized'] ?? null
        ],
        'cpu_total' => count($cpus),
        'cpu_am4_compatible_count' => count($compatible),
        'cpu_am4_compatible_samples' => array_slice(array_map(function($c){ return $c['name']; }, $compatible), 0, 10),
        'cpu_incompatible_samples' => array_slice($incompatible, 0, 10)
    ];

    echo json_encode($summary, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
