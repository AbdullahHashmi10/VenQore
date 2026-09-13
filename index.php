<?php
/**
 * VenQore POS - Root Entry Point
 */

if (file_exists(__DIR__ . '/public/index.php')) {
    require_once __DIR__ . '/public/index.php';
} elseif (file_exists(__DIR__ . '/app-code/main-app/public/index.php')) {
    require_once __DIR__ . '/app-code/main-app/public/index.php';
} else {
    http_response_code(500);
    echo "VenQore entry point not found.";
}