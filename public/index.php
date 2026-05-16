<?php

// --- GATEKEEPER CHECKS (Before Laravel Boots) ---

// 1. Critical Extensions Check
$requiredExtensions = [
    'bcmath' => 'Required for precise calculations',
    'ctype' => 'Character type checking',
    'fileinfo' => 'File upload processing',
    'json' => 'JSON data support',
    'mbstring' => 'Multibyte string support',
    'openssl' => 'Encryption and security',
    'pdo' => 'Database connectivity',
    'tokenizer' => 'PHP code processing',
    'xml' => 'XML data parsing'
];

$missingExtensions = [];
foreach ($requiredExtensions as $ext => $desc) {
    if (!extension_loaded($ext)) {
        $missingExtensions[] = ['name' => $ext, 'desc' => $desc];
    }
}

// 2. PHP Version Check
$phpVersion = phpversion();
$phpOk = version_compare($phpVersion, '8.2.0', '>=');

// 3. Permission Checks & Auto-Healing Directories
// The zip extraction often drops empty folders, which causes a fatal 500 in Laravel.
$vitalFolders = [
    __DIR__ . '/../storage',
    __DIR__ . '/../storage/app',
    __DIR__ . '/../storage/app/public',
    __DIR__ . '/../storage/framework',
    __DIR__ . '/../storage/framework/cache',
    __DIR__ . '/../storage/framework/cache/data',
    __DIR__ . '/../storage/framework/sessions',
    __DIR__ . '/../storage/framework/views',
    __DIR__ . '/../storage/logs',
    __DIR__ . '/../bootstrap/cache'
];

foreach ($vitalFolders as $folder) {
    if (!is_dir($folder)) {
        @mkdir($folder, 0775, true);
    }
}

$storagePath = __DIR__ . '/../storage';
$bootstrapPath = __DIR__ . '/../bootstrap/cache';

$storageOk = is_writable($storagePath);
$bootstrapOk = is_writable($bootstrapPath);

// If EVERYTHING is OK, let Laravel take over
if ($phpOk && $storageOk && $bootstrapOk && empty($missingExtensions)) {
    
    // --- LARAVEL BOOTSTRAP ---
    define('LARAVEL_START', microtime(true));

    if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
        require $maintenance;
    }

    require __DIR__.'/../vendor/autoload.php';

    /** @var \Illuminate\Foundation\Application $app */
    $app = require_once __DIR__.'/../bootstrap/app.php';

    $app->handleRequest(\Illuminate\Http\Request::capture());
    
    exit; // Stop execution here if Laravel handles the request
}

// --- FALLBACK UI (If checks fail) ---
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>System Halted | VenQore POS</title>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #050508;
            --panel: #0a0a10;
            --border: #1e1e2d;
            --text-primary: #e2e8f0;
            --text-secondary: #94a3b8;
            --accent: #6366f1; /* Indigo 500 */
            --accent-glow: rgba(99, 102, 241, 0.2);
            --error: #f43f5e;
            --success: #10b981;
        }

        /* Base Reset */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: var(--bg);
            color: var(--text-primary);
            font-family: 'Inter', sans-serif;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background-image: 
                radial-gradient(circle at 50% 0%, #1e1b4b 0%, transparent 50%),
                linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
            background-size: 100% 100%, 40px 40px, 40px 40px;
        }

        /* Container */
        .terminal-window {
            width: 100%;
            max-width: 800px;
            background: rgba(10, 10, 16, 0.85); /* Glassy dark */
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            overflow: hidden;
            animation: slideIn 0.6s ease-out;
        }

        @keyframes slideIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* Header */
        .window-header {
            padding: 16px 24px;
            background: rgba(0, 0, 0, 0.3);
            border-bottom: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .brand {
            font-family: 'JetBrains Mono', monospace;
            font-weight: 700;
            letter-spacing: -0.5px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #fff;
        }
        .brand span { color: var(--error); text-transform: uppercase; font-size: 0.8rem; letter-spacing: 1px; padding: 2px 6px; background: rgba(244, 63, 94, 0.1); border-radius: 4px; }

        /* Content */
        .window-content {
            padding: 40px;
        }

        h1 {
            font-size: 1.5rem;
            margin-bottom: 1rem;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        p.intro {
            color: var(--text-secondary);
            margin-bottom: 2rem;
            line-height: 1.6;
            font-size: 0.95rem;
        }

        /* Status Grid */
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 12px;
            margin-bottom: 2rem;
        }

        .status-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 16px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            transition: all 0.2s;
        }
        .status-card.error { border-color: rgba(244, 63, 94, 0.3); background: rgba(244, 63, 94, 0.05); }
        .status-card.success { border-color: rgba(16, 185, 129, 0.3); }

        .icon { width: 20px; height: 20px; flex-shrink: 0; }
        .icon-error { color: var(--error); }
        .icon-success { color: var(--success); }

        .card-content h3 { font-size: 0.85rem; font-weight: 600; margin-bottom: 4px; color: #fff; }
        .card-content p { font-size: 0.75rem; color: var(--text-secondary); }

        /* Actions */
        .actions {
            display: flex;
            gap: 12px;
            margin-top: 2rem;
            padding-top: 2rem;
            border-top: 1px solid var(--border);
        }

        .btn {
            background: var(--bg);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .btn:hover { background: rgba(255, 255, 255, 0.05); color: #fff; border-color: #475569; }
        .btn-primary {
            background: var(--accent);
            border-color: var(--accent);
            color: #fff;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .btn-primary:hover { background: #4f46e5; box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4); }

    </style>
</head>
<body>

<div class="terminal-window">
    <div class="window-header">
        <div class="brand">
            VenQore PROJECT <span>HALTED</span>
        </div>
        <div style="display:flex; gap:6px;">
            <div style="width:10px; height:10px; border-radius:50%; background:#f43f5e;"></div>
            <div style="width:10px; height:10px; border-radius:50%; background:#fbbf24;"></div>
            <div style="width:10px; height:10px; border-radius:50%; background:#10b981;"></div>
        </div>
    </div>

    <div class="window-content">
        <h1>
            <svg class="icon icon-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            System Pre-flight Check Failed
        </h1>
        <p class="intro">
            Required system components are missing or misconfigured. The application cannot boot safely until these issues are resolved.
        </p>

        <div class="status-grid">
            <!-- PHP Version -->
            <div class="status-card <?php echo $phpOk ? 'success' : 'error'; ?>">
                <?php if ($phpOk): ?>
                    <svg class="icon icon-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                <?php else: ?>
                    <svg class="icon icon-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                <?php endif; ?>
                <div class="card-content">
                    <h3>PHP Version</h3>
                    <p>Required: 8.2.0+ (Current: <?php echo $phpVersion; ?>)</p>
                </div>
            </div>

            <!-- Storage Permissions -->
            <div class="status-card <?php echo $storageOk ? 'success' : 'error'; ?>">
                 <?php if ($storageOk): ?>
                    <svg class="icon icon-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                <?php else: ?>
                    <svg class="icon icon-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <?php endif; ?>
                <div class="card-content">
                    <h3>Storage Permission</h3>
                    <p>/storage needs write access (775)</p>
                </div>
            </div>

             <!-- Bootstrap Cache Permissions -->
             <div class="status-card <?php echo $bootstrapOk ? 'success' : 'error'; ?>">
                 <?php if ($bootstrapOk): ?>
                    <svg class="icon icon-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                <?php else: ?>
                    <svg class="icon icon-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <?php endif; ?>
                <div class="card-content">
                    <h3>Cache Permission</h3>
                    <p>/bootstrap/cache needs write access</p>
                </div>
            </div>

            <!-- Missing Extensions -->
            <?php foreach ($missingExtensions as $ext): ?>
                <div class="status-card error">
                    <svg class="icon icon-error" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    <div class="card-content">
                        <h3>Missing: <?php echo htmlspecialchars($ext['name']); ?></h3>
                        <p><?php echo htmlspecialchars($ext['desc']); ?></p>
                    </div>
                </div>
            <?php endforeach; ?>

        </div>

        <div class="actions">
            <button class="btn btn-primary" onclick="window.location.reload()">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Run Diagnostics Again
            </button>
            <a href="https://php.net/manual/en/install.php" target="_blank" class="btn">
                View Documentation
            </a>
        </div>
    </div>
</div>

</body>
</html>
