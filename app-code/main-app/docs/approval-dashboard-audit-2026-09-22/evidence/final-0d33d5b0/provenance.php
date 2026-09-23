<?php
// docs/approval-dashboard-audit-2026-09-22/evidence/final-0d33d5b0/provenance.php

function sha256_file_safe(string $path): string {
    return file_exists($path) ? hash_file('sha256', $path) : 'FILE_NOT_FOUND';
}

$basePath = 'E:/AMD POS/baseline-10988c43/app-code/main-app';

$provenance = [
    'timestamp' => date('c'),
    'current_commit' => trim(shell_exec('git rev-parse HEAD')),
    'origin_main_commit' => trim(shell_exec('git rev-parse origin/main')),
    'baseline_commit' => '10988c439169faee75fa3d622f98f6d7d6f51954',
    'git_status' => trim(shell_exec('git status --short --branch')),
    'environment_versions' => [
        'php' => PHP_VERSION,
        'composer' => 'Composer version 2.7.2',
        'node' => trim(shell_exec('node -v 2>&1') ?: 'N/A'),
        'npm' => trim(shell_exec('npm -v 2>&1') ?: 'N/A'),
        'mariadb' => '10.4.32-MariaDB',
        'laravel' => 'Laravel Framework 12.x',
    ],
    'current_hashes' => [
        'composer.lock' => sha256_file_safe('composer.lock'),
        'package-lock.json' => sha256_file_safe('package-lock.json'),
        'phpunit.xml' => sha256_file_safe('tests/phpunit.xml'),
        '.env.testing' => sha256_file_safe('.env.testing'),
    ],
    'baseline_hashes' => [
        'composer.lock' => sha256_file_safe($basePath . '/composer.lock'),
        'package-lock.json' => sha256_file_safe($basePath . '/package-lock.json'),
        'phpunit.xml' => sha256_file_safe($basePath . '/tests/phpunit.xml'),
    ],
    'databases' => [
        'baseline' => 'amd_pos_test_baseline_10988c43',
        'current' => 'amd_pos_test_current_0d33d5b0',
    ],
];

file_put_contents(__DIR__ . '/provenance.json', json_encode($provenance, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo json_encode($provenance, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
