/**
 * VenQore Test Runner — Local Server
 * Streams Pest output live to the dashboard via WebSocket
 */

const http = require('http');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = 7821;
const RESULTS_FILE = path.join(__dirname, 'last-results.json');

// Read project path from config file (set by launch.bat)
const configFile = path.join(__dirname, 'config.json');
let config = { projectPath: '', phpBin: 'php', phpIni: '' };
if (fs.existsSync(configFile)) {
  try { config = { ...config, ...JSON.parse(fs.readFileSync(configFile, 'utf8')) }; } catch (e) { }
}

// ─── HTTP Server (serves dashboard.html) ───────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/dashboard.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'dashboard.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  if (req.method === 'GET' && req.url === '/last-results') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    if (fs.existsSync(RESULTS_FILE)) {
      res.end(fs.readFileSync(RESULTS_FILE, 'utf8'));
    } else {
      res.end(JSON.stringify({ runs: [] }));
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/config') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ projectPath: config.projectPath }));
    return;
  }

  if (req.method === 'POST' && req.url === '/set-config') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.projectPath) {
          config.projectPath = data.projectPath;
          fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        }
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400); res.end('Bad request');
      }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

// ─── WebSocket Server ───────────────────────────────────────────────────────
const wss = new WebSocketServer({ server });
let activeRun = null;

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  // Send last results on connect
  if (fs.existsSync(RESULTS_FILE)) {
    try {
      ws.send(JSON.stringify({ type: 'history', data: JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')) }));
    } catch (e) { }
  }

  ws.on('message', (msg) => {
    try {
      const { action, projectPath, customVersion } = JSON.parse(msg.toString());

      if (action === 'run') {
        if (activeRun) {
          ws.send(JSON.stringify({ type: 'error', message: 'A test run is already in progress.' }));
          return;
        }

        const projPath = projectPath || config.projectPath;
        if (!projPath || !fs.existsSync(projPath)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Project path not set or does not exist. Please configure it first.' }));
          return;
        }

        runTests(projPath, ws);
      }

      if (action === 'stop') {
        if (activeRun) { activeRun.kill(); activeRun = null; }
      }

      if (action === 'get_version') {
        const projPath = projectPath || config.projectPath;
        if (projPath && fs.existsSync(projPath)) {
          const info = getVersionInfo(projPath);
          ws.send(JSON.stringify({ type: 'version_info', current: info.current, next: info.next }));
        }
      }

      if (action === 'build') {
        if (activeRun) {
          ws.send(JSON.stringify({ type: 'error', message: 'A test run is currently in progress.' }));
          return;
        }
        const projPath = projectPath || config.projectPath;
        if (!projPath || !fs.existsSync(projPath)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Project path not set.' }));
          return;
        }
        runBuild(projPath, ws, customVersion);
      }
    } catch (e) {
      console.error('WS message error:', e);
    }
  });

  ws.on('close', () => console.log('[WS] Client disconnected'));
});

// ─── Test Runner ────────────────────────────────────────────────────────────
function runTests(projectPath, ws) {
  const startTime = Date.now();
  const modules = [
    ...Array.from({ length: 21 }, (_, i) => `Tester/tests/Feature/Module${String(i + 1).padStart(2, '0')}`),
    'Tester/tests/Feature/Smoke',
    'Tester/tests/Feature/DemoStore',
    'Tester/tests/Feature/AppSumo',
    'Tester/tests/Feature/V3',
    'Tester/tests/Feature/Auth',
    'Tester/tests/Feature/ProfileTest.php',
    'Tester/tests/Feature/ImportMappingTest.php',
    'Tester/tests/Feature/StoreUniqueNameTest.php',
    'Tester/tests/Feature/MigrateOpeningBalancesTest.php'
  ];

  const cmd = `"${config.phpBin || 'php'}" ${config.phpIni ? `-c "${config.phpIni}"` : ''} vendor/bin/pest ${modules.join(' ')} --configuration Tester/phpunit.xml --no-coverage`;

  ws.send(JSON.stringify({ type: 'start', timestamp: new Date().toISOString(), projectPath }));

  const results = {
    timestamp: new Date().toISOString(),
    projectPath,
    duration: 0,
    passed: 0,
    failed: 0,
    todos: 0,
    incomplete: 0,
    modules: {},
    bugs: [],
    rawLines: []
  };

  // Init module states
  const keys = [
    ...Array.from({ length: 21 }, (_, i) => `Module${String(i + 1).padStart(2, '0')}`),
    'Smoke',
    'DemoStore',
    'AppSumo',
    'V3',
    'Auth',
    'ProfileTest',
    'ImportMappingTest',
    'StoreUniqueNameTest',
    'MigrateOpeningBalancesTest'
  ];

  for (const key of keys) {
    results.modules[key] = { name: key, status: 'pending', tests: [], passed: 0, failed: 0, todos: 0 };
  }

  let currentModule = null;
  let buffer = '';

  activeRun = spawn(cmd, [], { cwd: projectPath, shell: true });

  activeRun.stdout.on('data', (data) => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      const trimmedLine = line.replace(/\r$/, ''); // strip Windows \r
      results.rawLines.push(trimmedLine);
      parseLine(trimmedLine, results, ws);
    }
  });

  activeRun.stderr.on('data', (data) => {
    const text = data.toString();
    results.rawLines.push(text);
    ws.send(JSON.stringify({ type: 'stderr', text }));
  });

  activeRun.on('close', (code) => {
    activeRun = null;
    results.duration = ((Date.now() - startTime) / 1000).toFixed(2);
    results.exitCode = code;

    // Mark pending or running modules as skipped and notify client
    for (const key of Object.keys(results.modules)) {
      if (results.modules[key].status === 'pending' || results.modules[key].status === 'running') {
        results.modules[key].status = 'skipped';
        ws.send(JSON.stringify({ type: 'module_done', module: key, status: 'skipped', data: results.modules[key] }));
      }
    }

    // Save results
    let history = { runs: [] };
    if (fs.existsSync(RESULTS_FILE)) {
      try { history = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')); } catch (e) { }
    }
    history.runs.unshift(results);
    if (history.runs.length > 20) history.runs = history.runs.slice(0, 20);
    fs.writeFileSync(RESULTS_FILE, JSON.stringify(history, null, 2));

    ws.send(JSON.stringify({ type: 'complete', results }));
    console.log(`[Runner] Tests complete in ${results.duration}s — ${results.passed} passed, ${results.failed} failed`);
  });

  activeRun.on('error', (err) => {
    activeRun = null;
    ws.send(JSON.stringify({ type: 'error', message: `Failed to start PHP: ${err.message}. Make sure PHP is in your PATH or configure phpBin in config.json.` }));
  });
}

function parseLine(line, results, ws) {
  // Detect module
  const moduleMatch = line.match(/(?:Tests|Tester[\/\\]tests)[\/\\]Feature[\/\\]([^/\\]+?)(?:[\/\\]|\.php|$)/);
  if (moduleMatch) {
    const key = moduleMatch[1];
    if (results.modules[key]) {
      results._currentModule = key;
      results.modules[key].status = 'running';
      ws.send(JSON.stringify({ type: 'module_start', module: key }));
    }
  }

  // Detect PASS/FAIL suite
  const passMatch = line.match(/PASS\s+(?:Tests|Tester[\/\\]tests)[\/\\]Feature[\/\\]([^/\\]+?)(?:[\/\\]|\.php|$)/);
  if (passMatch) {
    const key = passMatch[1];
    if (results.modules[key]) {
      results.modules[key].status = 'passed';
      ws.send(JSON.stringify({ type: 'module_done', module: key, status: 'passed', data: results.modules[key] }));
    }
  }

  const failMatch = line.match(/FAIL\s+(?:Tests|Tester[\/\\]tests)[\/\\]Feature[\/\\]([^/\\]+?)(?:[\/\\]|\.php|$)/);
  if (failMatch) {
    const key = failMatch[1];
    if (results.modules[key]) {
      results.modules[key].status = 'failed';
      ws.send(JSON.stringify({ type: 'module_done', module: key, status: 'failed', data: results.modules[key] }));
    }
  }

  // Detect TODO-only suite
  const todoMatch = line.match(/TODO\s+(?:Tests|Tester[\/\\]tests)[\/\\]Feature[\/\\]([^/\\]+?)(?:[\/\\]|\.php|$)/);
  if (todoMatch) {
    const key = todoMatch[1];
    if (results.modules[key]) {
      results.modules[key].status = 'skipped';
      ws.send(JSON.stringify({ type: 'module_done', module: key, status: 'skipped', data: results.modules[key] }));
    }
  }

  // Individual test results
  const testPass = line.match(/^\s+✓\s+(.+?)\s+[\d.]+s/);
  if (testPass) {
    const testName = testPass[1].trim();
    ws.send(JSON.stringify({ type: 'test_pass', name: testName }));
    results.passed++;
    if (results._currentModule && results.modules[results._currentModule]) {
      results.modules[results._currentModule].tests.push({ name: testName, status: 'passed' });
      results.modules[results._currentModule].passed++;
      ws.send(JSON.stringify({ type: 'module_update', module: results._currentModule, data: results.modules[results._currentModule] }));
    }
  }

  const testFail = line.match(/^\s+[✗×⨯]\s+(.+?)\s+[\d.]+s/);
  if (testFail) {
    const testName = testFail[1].trim();
    ws.send(JSON.stringify({ type: 'test_fail', name: testName }));
    results.failed++;
    results.bugs.push({ test: testName, module: results._currentModule || 'unknown' });
    if (results._currentModule && results.modules[results._currentModule]) {
      results.modules[results._currentModule].tests.push({ name: testName, status: 'failed' });
      results.modules[results._currentModule].failed++;
      ws.send(JSON.stringify({ type: 'module_update', module: results._currentModule, data: results.modules[results._currentModule] }));
    }
  }

  const testTodo = line.match(/^\s+↓\s+(.+?)\s+[\d.]+s/);
  if (testTodo) {
    results.todos++;
    if (results._currentModule && results.modules[results._currentModule]) {
      results.modules[results._currentModule].todos++;
      ws.send(JSON.stringify({ type: 'module_update', module: results._currentModule, data: results.modules[results._currentModule] }));
    }
  }

  // Track current module from PASS/FAIL lines
  const moduleTrack = line.match(/(?:PASS|FAIL|TODO|WARN)\s+(?:Tests|Tester[\/\\]tests)[\/\\]Feature[\/\\]([^/\\]+?)(?:[\/\\]|\.php|$)/);
  if (moduleTrack) {
    const key = moduleTrack[1];
    if (results.modules[key]) {
      results._currentModule = key;
    }
  }

  // Summary line
  const summaryMatch = line.match(/Tests:\s+(.*)/);
  if (summaryMatch) {
    ws.send(JSON.stringify({ type: 'summary_line', text: line.trim() }));
  }

  // Stream every line to client
  ws.send(JSON.stringify({ type: 'line', text: line }));
}

// ─── Start ──────────────────────────────────────────────────────────────────
server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n✦ VenQore Test Runner`);
  console.log(`  Local server: http://localhost:${PORT}`);
  console.log(`  Press Ctrl+C to stop\n`);
});

// ─── Build Helper Functions ──────────────────────────────────────────────────
function getVersionInfo(projectPath) {
  const versionFile = path.join(projectPath, 'AMD_POS_VERSION.txt');
  let current = '1.0.0';
  if (fs.existsSync(versionFile)) {
    const content = fs.readFileSync(versionFile, 'utf8');
    const match = content.match(/AMD_POS_VERSION=([\d.]+)/);
    if (match) current = match[1];
  }
  const parts = current.split('.').map(Number);
  if (parts.length === 3) {
    parts[2] = parts[2] + 1; // Increment patch version
  } else {
    parts.push(1);
  }
  const next = parts.join('.');
  return { current, next };
}

function runBuild(projectPath, ws, customVersion) {
  const info = getVersionInfo(projectPath);
  const next = (customVersion && customVersion.trim()) ? customVersion.trim() : info.next;
  
  ws.send(JSON.stringify({ type: 'build_log', text: `Initiating production bundle v${next}...` }));
  
  // 1. Run npm run build
  ws.send(JSON.stringify({ type: 'build_log', text: 'Step 1: Compiling assets (npm run build)...' }));
  const npmBuild = spawn('npm', ['run', 'build'], { cwd: projectPath, shell: true });
  
  npmBuild.stdout.on('data', (data) => {
    ws.send(JSON.stringify({ type: 'build_log', text: data.toString().trim() }));
  });
  
  npmBuild.stderr.on('data', (data) => {
    ws.send(JSON.stringify({ type: 'build_log', text: data.toString().trim() }));
  });
  
  npmBuild.on('close', (code) => {
    if (code !== 0) {
      ws.send(JSON.stringify({ type: 'build_complete', success: false, error: 'Asset compilation failed' }));
      return;
    }
    
    // 2. Run bundle_for_update.ps1 script
    ws.send(JSON.stringify({ type: 'build_log', text: `Step 2: Zipping update package v${next}...` }));
    const psBuild = spawn('powershell', ['-ExecutionPolicy', 'Bypass', '-File', './bundle_for_update.ps1', '-Version', next], { cwd: projectPath, shell: true });
    
    psBuild.stdout.on('data', (data) => {
      ws.send(JSON.stringify({ type: 'build_log', text: data.toString().trim() }));
    });
    
    psBuild.stderr.on('data', (data) => {
      ws.send(JSON.stringify({ type: 'build_log', text: data.toString().trim() }));
    });
    
    psBuild.on('close', (psCode) => {
      if (psCode !== 0) {
        ws.send(JSON.stringify({ type: 'build_complete', success: false, error: 'Zip packaging failed' }));
        return;
      }
      
      // 3. Update root version file to next version
      try {
        const rootVersionFile = path.join(projectPath, 'AMD_POS_VERSION.txt');
        const content = `AMD_POS_VERSION=${next}\nRELEASED=${new Date().toISOString().split('T')[0]}\nTYPE=update_package\n`;
        fs.writeFileSync(rootVersionFile, content, 'utf8');
      } catch (e) {
        console.error('Failed to update AMD_POS_VERSION.txt:', e);
      }
      
      ws.send(JSON.stringify({
        type: 'build_complete',
        success: true,
        version: next,
        file: `AMD_POS_Update_v${next}.zip`
      }));
    });
  });
}
