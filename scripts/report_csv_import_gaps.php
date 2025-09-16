<?php
// Report CSV categories not covered by import mapping and rows skipped due to invalid data
// SAFE: Reads CSV only. Does NOT touch the database.

$csvFile = __DIR__ . '/../components_database_cleaned.csv';

if (!file_exists($csvFile)) {
    fwrite(STDERR, "CSV file not found: $csvFile\n");
    exit(1);
}

// Mirror the mapping used in import_pc_components.php (keys are UPPERCASED)
$categoryMap = [
    'AIO' => 8,
    'COOLER FAN' => 8,
    'STOCK FAN' => 8,
    'HEATSINK FAN' => 8,
    'PRO & MOBO - AMD' => 2,
    'PRO & MOBO - INTEL' => 2,
    'PRO & MOBO - NO COOLER' => 2,
    'MOBO' => 2,
    'GPU' => 3,
    'HDD' => 5,
    'HDD (USED)' => 5,
    'HDD PORTABLE' => 5,
    'SSD 2.5-INCH' => 5,
    'SSD M.2' => 5,
    'SSD NVME' => 5,
    'SSD PORTABLE' => 5,
    'RAM 2666MHZ' => 4,
    'RAM 3200MHZ' => 4,
    'RAM 3600MHZ' => 4,
    'RAM 5200MHZ' => 4,
    'RAM 5600MHZ' => 4,
    'RAM 6000MHZ' => 4,
    'RAM 6400MHZ' => 4,
    'RAM DDR3' => 4,
    'RAM SODIMM' => 4,
    'PSU' => 6,
    'PSU - TR' => 6,
    'PSU GENERIC' => 6,
    'CASE GAMING' => 7,
    'CASE GENERIC' => 7,
    'CPU' => 1,
    'PROCIE ONLY' => 1,
    'PROCESSOR' => 1,
    'MOTHERBOARD' => 2,
    'STORAGE' => 5,
    'RAM' => 4,
    'CASE' => 7,
    'COOLER' => 8,
];

$totals = [
    'rows' => 0,
    'mapped_rows' => 0,
    'unmapped_rows' => 0,
    'invalid_rows' => 0,
];
$unmappedCounts = [];
$invalidCountsByCategory = [];
$invalidSamples = [];
$unmappedSamples = [];
$mappedCountsByCategory = [];

if (($handle = fopen($csvFile, 'r')) !== false) {
    $header = fgetcsv($handle);
    while (($row = fgetcsv($handle)) !== false) {
        $totals['rows']++;
        $cat = isset($row[1]) ? strtoupper(trim($row[1])) : '';
        $brand = isset($row[2]) ? trim($row[2]) : '';
        $name = isset($row[3]) ? trim($row[3]) : '';
        $priceStr = isset($row[7]) ? trim($row[7]) : '';
        $price = (float) str_replace(['₱', ','], '', $priceStr);

        if (!isset($categoryMap[$cat])) {
            $totals['unmapped_rows']++;
            if (!isset($unmappedCounts[$cat])) $unmappedCounts[$cat] = 0;
            $unmappedCounts[$cat]++;
            if (count($unmappedSamples) < 50) {
                $unmappedSamples[] = [
                    'category' => $cat,
                    'brand' => $brand,
                    'name' => $name,
                    'price' => $priceStr,
                ];
            }
            continue;
        }

        $totals['mapped_rows']++;
        $mappedCountsByCategory[$cat] = ($mappedCountsByCategory[$cat] ?? 0) + 1;

        // Determine invalid (would be skipped by importer)
        $invalid = ($name === '' || $price <= 0);
        if ($invalid) {
            $totals['invalid_rows']++;
            $invalidCountsByCategory[$cat] = ($invalidCountsByCategory[$cat] ?? 0) + 1;
            if (count($invalidSamples) < 50) {
                $invalidSamples[] = [
                    'category' => $cat,
                    'brand' => $brand,
                    'name' => $name,
                    'price' => $priceStr,
                ];
            }
        }
    }
    fclose($handle);
}

// Sort helper
arsort($unmappedCounts);
arsort($invalidCountsByCategory);
ksort($mappedCountsByCategory);

// Output report
echo "\n=== CSV Import Coverage Report ===\n";

echo "\n-- Totals --\n";
printf("Total CSV rows: %d\n", $totals['rows']);
printf("Mapped rows (to PC categories): %d\n", $totals['mapped_rows']);
printf("Unmapped rows (non-PC or unknown categories): %d\n", $totals['unmapped_rows']);
printf("Mapped but invalid rows (missing name or price <= 0): %d\n", $totals['invalid_rows']);

echo "\n-- Mapped counts by category (CSV) --\n";
foreach ($mappedCountsByCategory as $cat => $count) {
    printf("%-18s : %5d\n", $cat, $count);
}

if (!empty($invalidCountsByCategory)) {
    echo "\n-- Mapped but invalid rows by category (these would be skipped) --\n";
    foreach ($invalidCountsByCategory as $cat => $count) {
        printf("%-18s : %5d\n", $cat, $count);
    }
}

if (!empty($invalidSamples)) {
    echo "\nSample of invalid mapped rows (up to 50) --\n";
    foreach ($invalidSamples as $s) {
        printf("[%-18s] Brand: %-15s | Name: %-50s | Price: %s\n",
            $s['category'], $s['brand'], mb_strimwidth($s['name'], 0, 50, '…'), $s['price']);
    }
}

if (!empty($unmappedCounts)) {
    echo "\n-- Unmapped categories and counts --\n";
    foreach ($unmappedCounts as $cat => $count) {
        printf("%-25s : %5d\n", $cat, $count);
    }
}

if (!empty($unmappedSamples)) {
    echo "\nSample of unmapped rows (up to 50) --\n";
    foreach ($unmappedSamples as $s) {
        printf("[%-18s] Brand: %-15s | Name: %-50s | Price: %s\n",
            $s['category'], $s['brand'], mb_strimwidth($s['name'], 0, 50, '…'), $s['price']);
    }
}

echo "\nTip: To include more items, either (1) add new category mappings to import_pc_components.php, or (2) fix CSV rows with missing names or zero prices.\n";
