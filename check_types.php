<?php
$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";
try {
    $pdo = new PDO("sqlite:" . $vypPath);
    $stmt = $pdo->query("SELECT txn_type, COUNT(*) as c FROM kb_transactions GROUP BY txn_type");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "Type: " . $row['txn_type'] . " Count: " . $row['c'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
