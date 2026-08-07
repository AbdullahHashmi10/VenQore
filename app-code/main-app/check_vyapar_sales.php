<?php
$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";
$pdo = new \PDO("sqlite:" . $vypPath);
echo "--- SAMPLE SALES (txn_type=1) ---\n";
$stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 1 LIMIT 5");
while($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
    echo "ID: " . $row['txn_id'] . " | Date: " . $row['txn_date'] . " | Cash: " . $row['txn_cash_amount'] . " | Bal: " . $row['txn_balance_amount'] . "\n";
}
