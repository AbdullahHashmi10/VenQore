<?php
/**
 * VenQore POS - Root Entry Point
 * 
 * This file performs critical pre-flight checks before loading the application.
 * It ensures the server meets minimum requirements and redirects to the public folder.
 */

// Immediate PHP Version Check
if (version_compare(phpversion(), '8.2.0', '<')) {
    http_response_code(503);
    die('<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PHP Version Error - VenQore POS</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 40px;
            max-width: 500px;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        .icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #ff6b6b; font-size: 24px; margin-bottom: 16px; }
        p { color: #a0a0a0; line-height: 1.6; margin-bottom: 12px; }
        .version { 
            display: inline-block;
            background: rgba(255,107,107,0.2);
            color: #ff6b6b;
            padding: 4px 12px;
            border-radius: 20px;
            font-family: monospace;
            font-weight: bold;
        }
        .required {
            display: inline-block;
            background: rgba(46,213,115,0.2);
            color: #2ed573;
            padding: 4px 12px;
            border-radius: 20px;
            font-family: monospace;
            font-weight: bold;
        }
        .steps {
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
            padding: 20px;
            margin-top: 24px;
            text-align: left;
        }
        .steps h3 { color: #fff; font-size: 14px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .steps ol { color: #a0a0a0; padding-left: 20px; }
        .steps li { margin-bottom: 8px; }
        .steps strong { color: #6c5ce7; }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⚠️</div>
        <h1>PHP Version Mismatch</h1>
        <p>Your server is running <span class="version">PHP ' . phpversion() . '</span></p>
        <p>This software requires <span class="required">PHP 8.2+</span></p>
        
        <div class="steps">
            <h3>How to Fix</h3>
            <ol>
                <li>Login to your <strong>cPanel</strong> or hosting control panel</li>
                <li>Look for <strong>"Select PHP Version"</strong> or <strong>"MultiPHP Manager"</strong></li>
                <li>Change the PHP version to <strong>8.2</strong> or higher</li>
                <li>Refresh this page</li>
            </ol>
        </div>
    </div>
</body>
</html>');
}

// Check if we're already in the public folder
if (file_exists(__DIR__ . '/server.php')) {
    // We're in root, redirect to public
    require_once __DIR__ . '/public/index.php';
} else {
    // We might be accessed from a subdirectory
    header('Location: public/');
    exit;
}
