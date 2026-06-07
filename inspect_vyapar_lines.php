<?php
$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";
$pdo = new \PDO("sqlite:" . $vypPath);
$colsStmt = $pdo->query("PRAGMA table_info(kb_lineitems)");
$cols = $colsStmt->fetchAll(\PDO::FETCH_ASSOC);
foreach($cols as $c) {
    echo $c['name'] . " (" . $c['type'] . ")\n";
}
echo "\n--- SAMPLE LINE ITEM ---\n";
$stmt = $pdo->query("SELECT * FROM kb_lineitems LIMIT 1");
print_r($stmt->fetch(\PDO::FETCH_ASSOC));
