<?php
$pdo = new PDO("mysql:host=127.0.0.1;port=3306", "root", "");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec("CREATE DATABASE IF NOT EXISTS `amd_pos_test_baseline_10988c43` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
$pdo->exec("CREATE DATABASE IF NOT EXISTS `amd_pos_test_current_0d33d5b0` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");
echo "Databases created successfully: amd_pos_test_baseline_10988c43, amd_pos_test_current_0d33d5b0\n";
