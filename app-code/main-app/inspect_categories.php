<?php
$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";
$pdo = new \PDO("sqlite:" . $vypPath);

echo "--- CATEGORY TABLE ---\n";
$stmt = $pdo->query("PRAGMA table_info(kb_item_categories)");
$cols = $stmt->fetchAll(\PDO::FETCH_ASSOC);
foreach($cols as $c) {
    echo $c['name'] . "\n";
}

echo "\n--- SAMPLE CATEGORIES ---\n";
$stmt = $pdo->query("SELECT * FROM kb_item_categories LIMIT 5");
while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
    print_r($row);
}
