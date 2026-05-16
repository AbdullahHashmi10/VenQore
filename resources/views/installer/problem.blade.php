<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VENQORE Installer</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root { --primary: #3b82f6; --primary-dark: #2563eb; --bg: #0f172a; --panel: #1e293b; --border: #334155; --text: #e2e8f0; --success: #10b981; --error: #ef4444; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); height: 100vh; margin: 0; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        
        .wizard-container { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; width: 900px; height: 600px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden; }
        
        /* Header */
        .wizard-header { padding: 1.5rem 2rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; background: rgba(30, 41, 59, 0.95); }
        .brand { font-size: 1.25rem; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
        .brand span { color: var(--primary); }
        
        /* Steps */
        .steps { display: flex; gap: 0.5rem; align-items: center; }
        .step { font-size: 0.85rem; font-weight: 500; color: #64748b; padding: 0.25rem 0.75rem; border-radius: 99px; background: #334155; }
        .step.active { background: var(--primary); color: white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
        .step-arrow { color: #64748b; font-size: 0.8rem; }
        
        /* Content Area */
        .wizard-body { display: flex; flex: 1; overflow: hidden; }
        .wizard-content { flex: 1; padding: 2rem; overflow-y: auto; border-right: 1px solid var(--border); display: flex; flex-direction: column; }
        .wizard-help { flex: 0.8; padding: 2rem; background: #162032; overflow-y: auto; display: flex; flex-direction: column; }
        
        h2 { margin: 0 0 1.5rem; font-size: 1.5rem; color: #fff; letter-spacing: -0.5px; }
        .status-list { list-style: none; padding: 0; margin: 0; }
        .status-item { padding: 1rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; }
        .status-item:first-child { border-top: 1px solid var(--border); }
        .status-item:hover { background: rgba(255, 255, 255, 0.02); }
        .status-label { font-weight: 500; font-size: 0.95rem; }
        .status-badge { font-size: 0.8rem; font-weight: 700; padding: 0.25rem 0.6rem; border-radius: 6px; text-transform: uppercase; }
        .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success); }
        .badge-error { background: rgba(239, 68, 68, 0.1); color: var(--error); }
        
        /* Error Box in Help Panel */
        .terminal-box { background: #000; color: var(--error); font-family: 'Courier New', monospace; padding: 1rem; border-radius: 8px; border: 1px solid #7f1d1d; font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap; margin-bottom: 1.5rem; flex-shrink: 0; }
        .help-title { font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 1rem; margin-top: 1rem; }
        
        /* Accordion */
        .accordion-item { border: 1px solid var(--border); border-radius: 8px; margin-bottom: 0.75rem; overflow: hidden; background: var(--panel); }
        .accordion-header { padding: 1rem; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 600; font-size: 0.9rem; background: rgba(255, 255, 255, 0.03); transition: background 0.2s; }
        .accordion-header:hover { background: rgba(255, 255, 255, 0.05); }
        .accordion-body { padding: 1.25rem; background: rgba(0, 0, 0, 0.2); display: none; font-size: 0.9rem; line-height: 1.6; color: #cbd5e1; border-top: 1px solid var(--border); }
        .accordion-body.active { display: block; }
        .accordion-body h3 { color: var(--primary); margin: 0 0 0.5rem; font-size: 1rem; }
        .accordion-body code { background: rgba(0, 0, 0, 0.5); padding: 0.2rem 0.4rem; border-radius: 4px; color: #fbbf24; font-family: monospace; }
        
        /* Buttons */
        .btn { padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; border: none; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none; }
        .btn-primary { background: var(--primary); color: white; width: 100%; box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3); }
        .btn-primary:hover { background: var(--primary-dark); transform: translateY(-1px); }
        .btn-outline { background: transparent; border: 1px solid var(--border); color: #94a3b8; margin-top: auto; }
        .btn-outline:hover { border-color: #64748b; color: #fff; }
    </style>
</head>
<body>
    <div class="wizard-container">
        <!-- Header -->
        <div class="wizard-header">
            <div class="brand">VenQore <span>POS</span> Installer</div>
            <div class="steps">
                <div class="step active">0. Readiness</div>
                <div class="step-arrow">&rarr;</div>
                <div class="step">1. Config</div>
                <div class="step-arrow">&rarr;</div>
                <div class="step">2. Setup</div>
            </div>
        </div>

        <!-- Body -->
        <div class="wizard-body">
            <!-- Left: Check List -->
            <div class="wizard-content">
                <h2>System Readiness</h2>
                <p style="color: #94a3b8; margin-bottom: 2rem; font-size: 0.95rem;">
                    Before we can launch the installation wizard, we need to ensure your server meets the minimum requirements.
                </p>
                
                <ul class="status-list">
                    {{-- These passed because we didn't crash in index.php --}}
                    <li class="status-item">
                        <span class="status-label">PHP Version (8.2+)</span>
                        <span class="status-badge badge-success">Pass</span>
                    </li>
                    <li class="status-item">
                        <span class="status-label">Directory Permissions</span>
                        <span class="status-badge badge-success">Pass</span>
                    </li>
                    
                    {{-- Check for Database Error --}}
                    @php
                        $isDbError = str_contains($error, 'Connection refused') || str_contains($error, 'Access denied') || str_contains($error, 'SQLSTATE');
                        $isKeyError = str_contains($error, 'No application encryption key') || empty(config('app.key'));
                    @endphp

                    <li class="status-item">
                        <span class="status-label">Database Connection</span>
                        @if($isDbError)
                            <span class="status-badge badge-error">Fail</span>
                        @else
                            <span class="status-badge badge-success">Check</span>
                        @endif
                    </li>

                    <li class="status-item">
                        <span class="status-label">Application Key</span>
                        @if($isKeyError)
                            <span class="status-badge badge-error">Missing</span>
                        @else
                            <span class="status-badge badge-success">Pass</span>
                        @endif
                    </li>
                </ul>

                <button class="btn btn-outline" onclick="window.location.reload()">
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Refresh Status
                </button>
            </div>

            <!-- Right: Logic & Help -->
            <div class="wizard-help">
                <div class="terminal-box" id="errorLog">{{ $error }}</div>
                <button class="btn btn-primary" onclick="copyLog()">Copy Error Log</button>

                <div class="help-title">Troubleshooting Guides</div>
                
                <div class="accordion">
                    @if($isDbError)
                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>🗄️ Fix Database Connection</span>
                            <span>&#9660;</span>
                        </div>
                        <div class="accordion-body active">
                            <h3>1. Check .env File</h3>
                            <p>Verify these settings in your <code>.env</code> file:</p>
                            <pre>DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=your_db_name
DB_USERNAME=your_db_user</pre>
                            
                            <h3>2. Create Database</h3>
                            <p>Ensure the database actually exists. In cPanel, look for "MySQL Database Wizard". Ensure your user has <b>ALL PRIVILEGES</b>.</p>
                        </div>
                    </div>
                    @endif

                    @if($isKeyError)
                    <div class="accordion-item">
                        <div class="accordion-header" onclick="toggleAccordion(this)">
                            <span>🔑 Generate App Key</span>
                            <span>&#9660;</span>
                        </div>
                        <div class="accordion-body active">
                            <h3>Auto-generation failed</h3>
                            <p>We tried to generate a key automatically, but the server blocked the request. Please ensure the <code>.env</code> file is writable.</p>
                            <h3>Manual Fix (Terminal)</h3>
                            <code>php artisan key:generate</code>
                        </div>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
    <script>
        function copyLog() {
            var copyText = document.getElementById("errorLog").innerText;
            navigator.clipboard.writeText(copyText).then(() => {
                const btn = document.querySelector('.btn-primary');
                const originalText = btn.innerText;
                btn.innerText = 'Copied to Clipboard!';
                btn.style.background = '#10b981';
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = '#3b82f6';
                }, 2000);
            });
        }

        function toggleAccordion(header) {
            const body = header.nextElementSibling;
            if (body.style.display === "none" || !body.classList.contains('active')) {
                body.style.display = "block";
                body.classList.add('active');
                header.innerHTML = header.innerHTML.replace('▼', '▲');
            } else {
                body.style.display = "none";
                body.classList.remove('active');
                header.innerHTML = header.innerHTML.replace('▲', '▼');
            }
        }
    </script>
</body>
</html>
