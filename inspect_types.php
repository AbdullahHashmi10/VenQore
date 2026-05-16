<?php
$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";
try {
    $pdo = new PDO("sqlite:" . $vypPath);
    
    echo "--- Transaction Types by Party Type ---\n";
    $sql = "SELECT t.txn_type, n.name_type, COUNT(*) as c 
            FROM kb_transactions t 
            LEFT JOIN kb_names n ON t.txn_name_id = n.name_id 
            GROUP BY t.txn_type, n.name_type 
            ORDER BY t.txn_type, n.name_type";
    
    $stmt = $pdo->query($sql);
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "TxnType: " . $row['txn_type'] . " | PartyType: " . ($row['name_type'] ?? 'NULL') . " | Count: " . $row['c'] . "\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
