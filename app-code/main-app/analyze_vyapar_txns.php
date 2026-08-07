<?php
$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";
$pdo = new \PDO("sqlite:" . $vypPath);

echo "=== ALL VYAPAR TRANSACTION TYPES ===\n";
$stmt = $pdo->query("SELECT txn_type, COUNT(*) as count FROM kb_transactions GROUP BY txn_type");
while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
    echo "Type {$row['txn_type']}: {$row['count']} records\n";
}

echo "\n=== TRANSACTION TYPE MEANINGS ===\n";
echo "1 = Sale Invoice\n";
echo "2 = Purchase Invoice\n";
echo "3 = Payment Out\n";
echo "4 = Payment In\n";
echo "5 = Opening Balance\n";
echo "6 = Payable Opening\n";
echo "7 = Expense\n";
echo "8 = Credit Note (Sales Return)\n";
echo "9 = Debit Note (Purchase Return)\n";

echo "\n=== SAMPLE PURCHASE (type=2) ===\n";
$stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 2 LIMIT 1");
$row = $stmt->fetch(\PDO::FETCH_ASSOC);
if ($row) {
    echo "ID: {$row['txn_id']} | Date: {$row['txn_date']} | Cash: {$row['txn_cash_amount']} | Bal: {$row['txn_balance_amount']}\n";
}

echo "\n=== SAMPLE EXPENSE (type=7) ===\n";
$stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 7 LIMIT 1");
$row = $stmt->fetch(\PDO::FETCH_ASSOC);
if ($row) {
    echo "ID: {$row['txn_id']} | Date: {$row['txn_date']} | Desc: {$row['txn_description']} | Amount: {$row['txn_cash_amount']}\n";
}

echo "\n=== SAMPLE PAYMENT IN (type=4) ===\n";
$stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 4 LIMIT 1");
$row = $stmt->fetch(\PDO::FETCH_ASSOC);
if ($row) {
    echo "ID: {$row['txn_id']} | Date: {$row['txn_date']} | Amount: {$row['txn_cash_amount']}\n";
}

echo "\n=== SAMPLE PAYMENT OUT (type=3) ===\n";
$stmt = $pdo->query("SELECT * FROM kb_transactions WHERE txn_type = 3 LIMIT 1");
$row = $stmt->fetch(\PDO::FETCH_ASSOC);
if ($row) {
    echo "ID: {$row['txn_id']} | Date: {$row['txn_date']} | Amount: {$row['txn_cash_amount']}\n";
}
