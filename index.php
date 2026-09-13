<?php
/**
 * VenQore POS - Universal Entry Point
 */

// If app is deployed directly (e.g. release branch)
if (file_exists(__DIR__ . '/public/index.php')) {
    require_once __DIR__ . '/public/index.php';
    exit;
}

// If app is in monorepo subdirectory (e.g. main branch)
if (file_exists(__DIR__ . '/app-code/main-app/public/index.php')) {
    require_once __DIR__ . '/app-code/main-app/public/index.php';
    exit;
}

http_response_code(500);
echo "VenQore application entry point could not be located in " . htmlspecialchars(__DIR__);