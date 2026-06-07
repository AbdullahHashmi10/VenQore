<?php
$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";
try {
    $pdo = new PDO("sqlite:" . $vypPath);
    echo "--- Sample Transactions ---\n";
    $types = [1, 4, 5, 21, 65];
    foreach ($types as $t) {
        echo "Type $t:\n";
        $sql = "SELECT * FROM kb_transactions WHERE txn_type = $t LIMIT 3";
        $stmt = $pdo->query($sql);
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo "  ID: " . $row['txn_id'] . " | Ref: " . $row['txn_ref_number_char'] . " | Amount: " . ($row['txn_cash_amount'] + $row['txn_balance_amount']) . " | Date: " . $row['txn_date'] . "\n";
        }
        echo "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
