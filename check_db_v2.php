<?php
try {
    $pdo = new PDO("mysql:host=127.0.0.1;dbname=venqore_pos", "root", "");
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $table) {
        $count = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        if ($count > 0) {
            echo "$table: $count\n";
        }
    }
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage();
}
