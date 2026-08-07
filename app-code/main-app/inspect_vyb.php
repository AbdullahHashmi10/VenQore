<?php

$vybFile = 'e:\VenQore POS\08-02-2026_12.26.26_AMD_Outlets_VypBackup.vyb';
$tempDir = 'e:\VenQore POS\storage\app\inspect_vyapar_' . time();

if (!file_exists($tempDir)) {
    mkdir($tempDir, 0755, true);
}

echo "Extracting vyb file...\n";
$zip = new ZipArchive;
if ($zip->open($vybFile) === TRUE) {
    $zip->extractTo($tempDir);
    $zip->close();
} else {
    die("Failed to open vyb file.\n");
}

$vypFiles = glob($tempDir . '/*.vyp');
if (empty($vypFiles)) {
    // Check nested
    $vypFiles = glob($tempDir . '/**/*.vyp');
}

if (empty($vypFiles)) {
    die("No .vyp database found in the backup.\n");
}

$vypPath = $vypFiles[0];
echo "Found database: " . basename($vypPath) . "\n";

try {
    $pdo = new PDO("sqlite:" . $vypPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // List all tables
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $keyTables = ['Party', 'Item', 'Transaction', 'lineitems', 'Payment', 'Expense', 'Bank', 'Company', 'adjustments'];
    
    foreach ($tables as $table) {
        $found = false;
        foreach ($keyTables as $kt) {
            if (stripos($table, $kt) !== false) {
                $found = true;
                break;
            }
        }
        
        if ($found) {
            echo "\n--- $table ---\n";
            $colsStmt = $pdo->query("PRAGMA table_info(\"$table\")");
            $cols = $colsStmt->fetchAll(PDO::FETCH_ASSOC);
            $names = array_map(fn($c) => $c['name'], $cols);
            // echo "Columns: " . implode(', ', $names) . "\n";
            
            $dataStmt = $pdo->query("SELECT * FROM \"$table\" LIMIT 5");
            $rows = $dataStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rows as $row) {
                echo "(" . ($row['txn_type'] ?? $row['item_id'] ?? $row['party_id'] ?? '?') . ") ";
                print_r($row);
            }
        }
    }

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
} finally {
    // Cleanup - no, keep it for manual inspection if needed, or I'll delete later
    // exec("rm -rf " . escapeshellarg($tempDir));
}
