<?php
// docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/setup_test_envs.php

$baselineDir = 'E:/AMD POS/baseline-10988c43/app-code/main-app';
$currentDir = 'E:/AMD POS/AMD POS/app-code/main-app';

// 1. Setup Baseline env
$baselineEnv = <<<EOT
APP_NAME=VenQore
APP_ENV=testing
APP_KEY=base64:3f0m9v58uVj4b6K2YvY2H7z8M6n9b1v3x4z5a6b7c8d=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=amd_pos_test_baseline_10988c43
DB_USERNAME=root
DB_PASSWORD=

CACHE_STORE=array
CACHE_PREFIX=baseline_test_
SESSION_DRIVER=array
QUEUE_CONNECTION=sync
EOT;

file_put_contents($baselineDir . '/.env.testing', $baselineEnv);
file_put_contents($baselineDir . '/.env', $baselineEnv);
if (!file_exists($baselineDir . '/storage/installed')) {
    @mkdir($baselineDir . '/storage', 0777, true);
    file_put_contents($baselineDir . '/storage/installed', '');
}

// 2. Setup Current env
$currentEnv = <<<EOT
APP_NAME=VenQore
APP_ENV=testing
APP_KEY=base64:3f0m9v58uVj4b6K2YvY2H7z8M6n9b1v3x4z5a6b7c8d=
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mariadb
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=amd_pos_test_current_0d33d5b0
DB_USERNAME=root
DB_PASSWORD=

CACHE_STORE=array
CACHE_PREFIX=current_test_
SESSION_DRIVER=array
QUEUE_CONNECTION=sync
EOT;

file_put_contents($currentDir . '/.env.testing', $currentEnv);
file_put_contents($currentDir . '/.env', $currentEnv);
if (!file_exists($currentDir . '/storage/installed')) {
    @mkdir($currentDir . '/storage', 0777, true);
    file_put_contents($currentDir . '/storage/installed', '');
}

// 3. Test PDO connectivity to both
$pdoB = new PDO("mysql:host=127.0.0.1;port=3306;dbname=amd_pos_test_baseline_10988c43", "root", "");
$dbNameB = $pdoB->query("SELECT DATABASE()")->fetchColumn();

$pdoC = new PDO("mysql:host=127.0.0.1;port=3306;dbname=amd_pos_test_current_0d33d5b0", "root", "");
$dbNameC = $pdoC->query("SELECT DATABASE()")->fetchColumn();

$proof = [
    'baseline_verified_database' => $dbNameB,
    'current_verified_database' => $dbNameC,
    'verified_at' => date('c'),
];

file_put_contents(__DIR__ . '/db_connection_proof.json', json_encode($proof, JSON_PRETTY_PRINT));
echo json_encode($proof, JSON_PRETTY_PRINT) . "\n";
