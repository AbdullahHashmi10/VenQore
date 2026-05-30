<?php
$logPath = __DIR__ . '/../storage/logs/laravel.log';
if (!file_exists($logPath)) {
    echo "Log file does not exist.\n";
    exit;
}

$content = file_get_contents($logPath);
$errors = explode('[2026-', $content);
if (empty($errors)) {
    echo "No errors found.\n";
    exit;
}

$lastError = end($errors);
// Output only the first 500 characters of the error message to avoid long stack trace
echo "Last error summary:\n";
echo substr("[2026-" . $lastError, 0, 800) . "\n";
