<?php
$vypPath = "temp_vyb_inspect/AMDOutlets__t_2024_12_28_20_09_48_hlpe_1768804784315.vyp";
try {
    $pdo = new PDO("sqlite:" . $vypPath);
    echo "--- Name Types ---\n";
    $sql = "SELECT name_type, COUNT(*) as c FROM kb_names GROUP BY name_type";
    $stmt = $pdo->query($sql);
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "NameType: " . $row['name_type'] . " Count: " . $row['c'] . "\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
