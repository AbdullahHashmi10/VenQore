/**
 * VenQore Golden Verification Dashboard — Server
 * Port: 7822
 *
 * Runs all 11 phases of the Golden financial verification suite via PHPUnit
 * and the Vitest frontend tests. Streams results live to the dashboard via WebSocket.
 */

const http   = require('http');
const { WebSocketServer } = require('ws');
const { spawn } = require('child_process');
const fs     = require('fs');
const path   = require('path');

// ─── Config ────────────────────────────────────────────────────────────────
const PORT         = 7822;
const RESULTS_FILE = path.join(__dirname, 'last-results.json');
const configFile   = path.join(__dirname, 'config.json');

let config = {
  projectPath : 'E:\\AMD POS\\AMD POS',
  phpBin      : 'E:\\Software\\Xampp\\php\\php.exe',
  phpIni      : '',
  vitestBin   : 'node_modules\\.bin\\vitest',
  npmBin      : 'npm'
};

if (fs.existsSync(configFile)) {
  try { config = { ...config, ...JSON.parse(fs.readFileSync(configFile, 'utf8')) }; } catch (e) {}
}

// ─── All Golden Phases ──────────────────────────────────────────────────────
const GOLDEN_PHASES = [
  {
    id          : 'phase1',
    label       : 'Phase 1 — Golden Company Seeder',
    emoji       : '🏗️',
    file        : 'Tester/tests/Feature/Golden/GoldenCompanyTest.php',
    tests       : 12,
    description : 'Deterministic dataset seeded; all values cross-checked against manifest'
  },
  {
    id          : 'phase3a',
    label       : 'Phase 3a — Sale Input Verification',
    emoji       : '🧾',
    file        : 'Tester/tests/Feature/Golden/SaleInputVerificationTest.php',
    tests       : 5,
    description : 'Validates sale creation, journal entries, and validation rules'
  },
  {
    id          : 'phase3b',
    label       : 'Phase 3b — Purchase Input Verification',
    emoji       : '📦',
    file        : 'Tester/tests/Feature/Golden/PurchaseInputVerificationTest.php',
    tests       : 5,
    description : 'Validates purchase creation and supplier payable entries'
  },
  {
    id          : 'phase3c',
    label       : 'Phase 3c — Expense & Payment Verification',
    emoji       : '💳',
    file        : 'Tester/tests/Feature/Golden/ExpensePaymentInputVerificationTest.php',
    tests       : 5,
    description : 'Validates expense posting and customer/supplier payment flows'
  },
  {
    id          : 'phase4a',
    label       : 'Phase 4a — Financial Core',
    emoji       : '💰',
    file        : 'Tester/tests/Feature/Golden/FinancialCoreVerificationTest.php',
    tests       : 12,
    description : 'P&L, Balance Sheet, Trial Balance against manifest figures'
  },
  {
    id          : 'phase4b',
    label       : 'Phase 4b — FIFO Batch Verification',
    emoji       : '📊',
    file        : 'Tester/tests/Feature/Golden/FifoBatchVerificationTest.php',
    tests       : 10,
    description : 'FIFO consumption order, batch drain, and valuation correctness'
  },
  {
    id          : 'phase4c',
    label       : 'Phase 4c — COGS Reconciliation',
    emoji       : '⚖️',
    file        : 'Tester/tests/Feature/Golden/CogsReconciliationTest.php',
    tests       : 13,
    description : 'COGS per transaction reconciled to the independent calculator'
  },
  {
    id          : 'phase5a',
    label       : 'Phase 5a — Dashboard Output',
    emoji       : '📈',
    file        : 'Tester/tests/Feature/Golden/DashboardOutputTest.php',
    tests       : 11,
    description : 'Dashboard KPI cards verified against ledger for all periods'
  },
  {
    id          : 'phase5b',
    label       : 'Phase 5b — Report Output',
    emoji       : '📋',
    file        : 'Tester/tests/Feature/Golden/ReportOutputTest.php',
    tests       : 10,
    description : 'All report endpoints return exact manifest figures'
  },
  {
    id          : 'phase5c',
    label       : 'Phase 5c — Filter Matrix',
    emoji       : '🔍',
    file        : 'Tester/tests/Feature/Golden/FilterMatrixTest.php',
    tests       : 12,
    description : 'Date filter combinations: today/month/year/custom/MTD/YTD'
  },
  {
    id          : 'phase6a',
    label       : 'Phase 6a — Cross-Surface Consistency',
    emoji       : '🔗',
    file        : 'Tester/tests/Feature/Golden/CrossSurfaceConsistencyTest.php',
    tests       : 10,
    description : 'Dashboard = Reports = Trial Balance for same period'
  },
  {
    id          : 'phase6b',
    label       : 'Phase 6b — Clock Position Consistency',
    emoji       : '🕐',
    file        : 'Tester/tests/Feature/Golden/ClockPositionConsistencyTest.php',
    tests       : 9,
    description : 'Period filters behave correctly as time advances'
  },
  {
    id          : 'phase6c',
    label       : 'Phase 6c — Formatting Consistency',
    emoji       : '🎨',
    file        : 'Tester/tests/Feature/Golden/FormattingConsistencyTest.php',
    tests       : 9,
    description : 'Decimal(20,4), no float casts, consistent currency symbols'
  },
  {
    id          : 'phase7',
    label       : 'Phase 7 — Architectural Enforcement',
    emoji       : '🏛️',
    file        : 'Tester/tests/Feature/Golden/ArchitecturalEnforcementTest.php',
    tests       : 13,
    description : 'Zero raw SQL in controllers, no float columns in migrations'
  },
  {
    id          : 'phase8',
    label       : 'Phase 8 — Adversarial & Corruption',
    emoji       : '🛡️',
    file        : 'Tester/tests/Feature/Golden/AdversarialCorruptionTest.php',
    tests       : 10,
    description : 'Orphans, unbalanced entries, tenant isolation, negative stock'
  },
  {
    id          : 'phase9',
    label       : 'Phase 9 — Edge Cases & Concurrency',
    emoji       : '⚡',
    file        : 'Tester/tests/Feature/Golden/EdgeCasesTimeConcurrencyTest.php',
    tests       : 15,
    description : 'Leap day, rounding pivot, FIFO locking, ACID atomicity'
  },
  {
    id          : 'phase10',
    label       : 'Phase 10 — Frontend Logic (Vitest)',
    emoji       : '⚛️',
    file        : 'resources/js/tests/frontend.test.js',
    tests       : 59,
    description : 'roundTotal, formatCurrency, POS cart math, manifest cross-checks',
    isVitest    : true
  },
  {
    id          : 'phase11',
    label       : 'Phase 11 — Launch Gate',
    emoji       : '🚀',
    file        : 'Tester/tests/Feature/Golden/LaunchGateTest.php',
    tests       : 15,
    description : 'All 7 launch gate checks + 8 live financial invariants'
  }
];

// ─── HTTP Server ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/dashboard.html')) {
    const html = fs.readFileSync(path.join(__dirname, 'dashboard.html'), 'utf8');
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
    res.end(html);
    return;
  }

  if (req.method === 'GET' && req.url === '/last-results') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(fs.existsSync(RESULTS_FILE) ? fs.readFileSync(RESULTS_FILE, 'utf8') : JSON.stringify({ runs: [] }));
    return;
  }

  if (req.method === 'GET' && req.url === '/config') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ projectPath: config.projectPath }));
    return;
  }

  if (req.method === 'GET' && req.url === '/phases') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify(GOLDEN_PHASES));
    return;
  }

  if (req.method === 'POST' && req.url === '/set-config') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.projectPath) config.projectPath = data.projectPath;
        if (data.phpBin)      config.phpBin      = data.phpBin;
        fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) { res.writeHead(400); res.end('Bad request'); }
    });
    return;
  }

  res.writeHead(404); res.end('Not found');
});

// ─── WebSocket ──────────────────────────────────────────────────────────────
const wss    = new WebSocketServer({ server });
let activeRun = null;

wss.on('connection', ws => {
  console.log('[WS] Client connected');

  // Send phase manifest on connect
  ws.send(JSON.stringify({ type: 'phases', data: GOLDEN_PHASES }));

  // Send last results
  if (fs.existsSync(RESULTS_FILE)) {
    try { ws.send(JSON.stringify({ type: 'history', data: JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')) })); }
    catch (e) {}
  }

  ws.on('message', msg => {
    try {
      const { action, phaseId, projectPath } = JSON.parse(msg.toString());
      const projPath = projectPath || config.projectPath;

      if (action === 'run_all') {
        if (activeRun) { ws.send(JSON.stringify({ type: 'error', message: 'A run is already in progress.' })); return; }
        if (!projPath || !fs.existsSync(projPath)) {
          ws.send(JSON.stringify({ type: 'error', message: 'Project path not set or not found.' })); return;
        }
        runAllPhases(projPath, ws);
      }

      if (action === 'run_phase') {
        if (activeRun) { ws.send(JSON.stringify({ type: 'error', message: 'A run is already in progress.' })); return; }
        const phase = GOLDEN_PHASES.find(p => p.id === phaseId);
        if (!phase) { ws.send(JSON.stringify({ type: 'error', message: `Unknown phase: ${phaseId}` })); return; }
        runSinglePhase(projPath, ws, phase);
      }

      if (action === 'run_quick_gate') {
        if (activeRun) { ws.send(JSON.stringify({ type: 'error', message: 'A run is already in progress.' })); return; }
        runLaunchGate(projPath, ws);
      }

      if (action === 'stop') {
        if (activeRun) { activeRun.kill(); activeRun = null; }
        ws.send(JSON.stringify({ type: 'stopped' }));
      }
    } catch (e) { console.error('WS error:', e); }
  });

  ws.on('close', () => console.log('[WS] Client disconnected'));
});

// ─── Run ALL Phases ─────────────────────────────────────────────────────────
function runAllPhases(projectPath, ws) {
  const startTime = Date.now();

  // Build PHPUnit file list (all non-vitest phases)
  const phpFiles = GOLDEN_PHASES
    .filter(p => !p.isVitest)
    .map(p => p.file)
    .join(' ');

  const phpUnit = `"${config.phpBin}" ${config.phpIni ? `-c "${config.phpIni}"` : ''} vendor/bin/phpunit ${phpFiles} --configuration Tester/phpunit.xml --no-coverage --testdox`;

  const results = {
    timestamp   : new Date().toISOString(),
    projectPath,
    duration    : 0,
    passed      : 0,
    failed      : 0,
    phases      : {},
    type        : 'full'
  };

  // Init all phases
  for (const phase of GOLDEN_PHASES) {
    results.phases[phase.id] = { ...phase, status: 'pending', passed: 0, failed: 0, testLogs: [] };
  }

  ws.send(JSON.stringify({ type: 'run_start', timestamp: results.timestamp, totalPhases: GOLDEN_PHASES.length }));

  // Step 1: PHPUnit phases
  runPhpUnit(phpUnit, projectPath, results, ws, () => {
    // Step 2: Vitest (Phase 10)
    runVitest(projectPath, results, ws, () => {
      // Step 3: Verification Engines
      runVerificationEngines(projectPath, ws, () => {
        results.duration = ((Date.now() - startTime) / 1000).toFixed(2);
        saveAndBroadcast(results, ws);
      });
    });
  });
}

// ─── Run Single Phase ───────────────────────────────────────────────────────
function runSinglePhase(projectPath, ws, phase) {
  const results = {
    timestamp   : new Date().toISOString(),
    projectPath,
    duration    : 0,
    passed      : 0,
    failed      : 0,
    phases      : {},
    type        : 'single',
    singlePhase : phase.id
  };

  for (const p of GOLDEN_PHASES) {
    results.phases[p.id] = { ...p, status: p.id === phase.id ? 'pending' : 'idle', passed: 0, failed: 0, testLogs: [] };
  }

  ws.send(JSON.stringify({ type: 'run_start', timestamp: results.timestamp, singlePhase: phase.id }));

  const startTime = Date.now();

  if (phase.isVitest) {
    runVitest(projectPath, results, ws, () => {
      results.duration = ((Date.now() - startTime) / 1000).toFixed(2);
      saveAndBroadcast(results, ws);
    });
  } else {
    const cmd = `"${config.phpBin}" ${config.phpIni ? `-c "${config.phpIni}"` : ''} vendor/bin/phpunit ${phase.file} --configuration Tester/phpunit.xml --no-coverage --testdox`;
    runPhpUnit(cmd, projectPath, results, ws, () => {
      results.duration = ((Date.now() - startTime) / 1000).toFixed(2);
      saveAndBroadcast(results, ws);
    });
  }
}

// ─── Quick Launch Gate (Phase 11 only) ─────────────────────────────────────
function runLaunchGate(projectPath, ws) {
  const phase = GOLDEN_PHASES.find(p => p.id === 'phase11');
  runSinglePhase(projectPath, ws, phase);
}

// ─── PHPUnit Runner ─────────────────────────────────────────────────────────
function runPhpUnit(cmd, projectPath, results, ws, onDone) {
  let buffer = '';
  let currentPhaseId = null;

  activeRun = spawn(cmd, [], { cwd: projectPath, shell: true });

  activeRun.stdout.on('data', data => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const clean = line.replace(/\r$/, '');
      ws.send(JSON.stringify({ type: 'line', text: clean }));
      parsePhpUnitLine(clean, results, ws);
    }
  });

  activeRun.stderr.on('data', data => {
    ws.send(JSON.stringify({ type: 'stderr', text: data.toString() }));
  });

  activeRun.on('close', code => {
    activeRun = null;
    results.exitCode = code;

    // Finalize any still-running phases
    for (const [id, phase] of Object.entries(results.phases)) {
      if (phase.status === 'running' || phase.status === 'pending') {
        if (phase.failed > 0) phase.status = 'failed';
        else if (phase.passed > 0) phase.status = 'passed';
        else phase.status = 'skipped';
        ws.send(JSON.stringify({ type: 'phase_done', phaseId: id, data: phase }));
      }
    }

    if (onDone) onDone();
  });

  activeRun.on('error', err => {
    activeRun = null;
    ws.send(JSON.stringify({ type: 'error', message: `PHP execution failed: ${err.message}` }));
    if (onDone) onDone();
  });
}

// ─── PHPUnit Line Parser ────────────────────────────────────────────────────
function parsePhpUnitLine(line, results, ws) {
  // Detect which phase/file is being run
  // Matches "Class Name (Tests\Feature\Golden\ClassName)" or old paths
  const fileMatch = line.match(/Golden[\\/]([A-Za-z0-9_]+)/);
  if (fileMatch) {
    const fileName = fileMatch[1] + 'Test';
    const phase = GOLDEN_PHASES.find(p =>
      p.file.includes(fileMatch[1]) || p.file.endsWith(fileMatch[1] + '.php')
    );
    if (phase && results.phases[phase.id]) {
      const pd = results.phases[phase.id];
      if (pd.status === 'pending' || pd.status === 'idle') {
        pd.status = 'running';
        ws.send(JSON.stringify({ type: 'phase_start', phaseId: phase.id }));
      }
      results._currentPhaseId = phase.id;
    }
  }

  // PASS line
  const passFile = line.match(/PASS\s+.*?Golden[\\/]([^/\\]+?)(?:\.php)?(?:\s|$)/);
  if (passFile) {
    const phase = GOLDEN_PHASES.find(p => p.file.includes(passFile[1]));
    if (phase) {
      results.phases[phase.id].status = 'passed';
      ws.send(JSON.stringify({ type: 'phase_done', phaseId: phase.id, data: results.phases[phase.id] }));
    }
  }

  // FAIL line
  const failFile = line.match(/FAIL\s+.*?Golden[\\/]([^/\\]+?)(?:\.php)?(?:\s|$)/);
  if (failFile) {
    const phase = GOLDEN_PHASES.find(p => p.file.includes(failFile[1]));
    if (phase) {
      results.phases[phase.id].status = 'failed';
      ws.send(JSON.stringify({ type: 'phase_done', phaseId: phase.id, data: results.phases[phase.id] }));
    }
  }

  // Individual test pass: ✓, ✔ or OK
  const testPass = line.match(/^\s*[✓✔]\s+(.*?)(?:\s+\d+(?:\.\d+)?s)?\s*$/);
  if (testPass) {
    results.passed++;
    const name = testPass[1].trim();
    ws.send(JSON.stringify({ type: 'test_pass', name, phaseId: results._currentPhaseId }));
    if (results._currentPhaseId && results.phases[results._currentPhaseId]) {
      results.phases[results._currentPhaseId].passed++;
      results.phases[results._currentPhaseId].testLogs.push({ name, status: 'passed' });
    }
  }

  // Individual test fail
  const testFail = line.match(/^\s+[✗×⨯x]\s+(.*?)(?:\s+\d+(?:\.\d+)?s)?\s*$/);
  if (testFail) {
    results.failed++;
    const name = testFail[1].trim();
    ws.send(JSON.stringify({ type: 'test_fail', name, phaseId: results._currentPhaseId }));
    if (results._currentPhaseId && results.phases[results._currentPhaseId]) {
      results.phases[results._currentPhaseId].failed++;
      results.phases[results._currentPhaseId].testLogs.push({ name, status: 'failed' });
    }
  }

  // Summary line
  if (line.match(/Tests:\s+\d+/)) {
    ws.send(JSON.stringify({ type: 'summary_line', text: line.trim() }));
  }
}

// ─── Vitest Runner (Phase 10) ───────────────────────────────────────────────
function runVitest(projectPath, results, ws, onDone) {
  const phaseId = 'phase10';
  if (results.phases[phaseId]) {
    results.phases[phaseId].status = 'running';
    ws.send(JSON.stringify({ type: 'phase_start', phaseId }));
  }

  const vitestCmd = `${config.npmBin || 'npm'} test`;
  let buffer = '';

  const vitestProc = spawn(vitestCmd, [], { cwd: projectPath, shell: true });
  activeRun = vitestProc;

  vitestProc.stdout.on('data', data => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const clean = line.replace(/\r$/, '');
      ws.send(JSON.stringify({ type: 'line', text: clean }));
      parseVitestLine(clean, results, ws, phaseId);
    }
  });

  vitestProc.stderr.on('data', data => {
    ws.send(JSON.stringify({ type: 'stderr', text: data.toString() }));
  });

  vitestProc.on('close', code => {
    activeRun = null;
    const phase = results.phases[phaseId];
    if (phase) {
      if (code === 0 && phase.passed > 0) phase.status = 'passed';
      else if (phase.failed > 0) phase.status = 'failed';
      else phase.status = code === 0 ? 'passed' : 'failed';
      ws.send(JSON.stringify({ type: 'phase_done', phaseId, data: phase }));
    }
    if (onDone) onDone();
  });

  vitestProc.on('error', err => {
    activeRun = null;
    const phase = results.phases[phaseId];
    if (phase) { phase.status = 'failed'; ws.send(JSON.stringify({ type: 'phase_done', phaseId, data: phase })); }
    ws.send(JSON.stringify({ type: 'error', message: `Vitest failed: ${err.message}` }));
    if (onDone) onDone();
  });
}

function parseVitestLine(line, results, ws, phaseId) {
  // Strip ANSI escape codes
  line = line.replace(/\x1b\[[0-9;]*m/g, '');
  // ✓ or × individual tests
  const pass = line.match(/[✓✔]\s+\[?(.*?)\]?(?:\s+\(\d+\s+tests\))?/);
  if (pass) {
    results.passed++;
    if (results.phases[phaseId]) {
      results.phases[phaseId].passed++;
      results.phases[phaseId].testLogs.push({ name: pass[1], status: 'passed' });
    }
    ws.send(JSON.stringify({ type: 'test_pass', name: pass[1], phaseId }));
  }

  const fail = line.match(/[×✗]\s+\[(.*?)\]/);
  if (fail) {
    results.failed++;
    if (results.phases[phaseId]) {
      results.phases[phaseId].failed++;
      results.phases[phaseId].testLogs.push({ name: fail[1], status: 'failed' });
    }
    ws.send(JSON.stringify({ type: 'test_fail', name: fail[1], phaseId }));
  }

  // Summary: "Tests  59 passed"
  const summary = line.match(/Tests\s+(\d+)\s+passed/);
  if (summary) {
    const totalPassed = parseInt(summary[1]);
    const currentPhasePassed = results.phases[phaseId] ? results.phases[phaseId].passed : 0;
    if (currentPhasePassed < totalPassed) {
       const diff = totalPassed - currentPhasePassed;
       results.passed += diff;
       if (results.phases[phaseId]) results.phases[phaseId].passed += diff;
    }
    ws.send(JSON.stringify({ type: 'summary_line', text: line.trim() }));
  }
}

// ─── Verification Engines Runner ───────────────────────────────────────────
function runVerificationEngines(projectPath, ws, onDone) {
  ws.send(JSON.stringify({ type: 'line', text: '\n===============================================================' }));
  ws.send(JSON.stringify({ type: 'summary_line', text: '▶ RUNNING VERIFICATION ENGINES (PHASES B - E)' }));
  ws.send(JSON.stringify({ type: 'line', text: '===============================================================\n' }));

  const cmd = `"${config.phpBin}" ${config.phpIni ? `-c "${config.phpIni}"` : ''} artisan verify:engines`;
  let buffer = '';

  const engineProc = spawn(cmd, [], { cwd: projectPath, shell: true });
  activeRun = engineProc;

  engineProc.stdout.on('data', data => {
    buffer += data.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const clean = line.replace(/\r$/, '').replace(/\x1b\[[0-9;]*m/g, '');
      if (clean.trim().length > 0) {
        ws.send(JSON.stringify({ type: 'line', text: clean }));
      }
    }
  });

  engineProc.stderr.on('data', data => {
    ws.send(JSON.stringify({ type: 'stderr', text: data.toString() }));
  });

  engineProc.on('close', code => {
    activeRun = null;
    ws.send(JSON.stringify({ type: 'line', text: '\n===============================================================' }));
    ws.send(JSON.stringify({ type: 'summary_line', text: '✔ VERIFICATION ENGINES COMPLETE' }));
    ws.send(JSON.stringify({ type: 'line', text: '===============================================================\n' }));
    if (onDone) onDone();
  });

  engineProc.on('error', err => {
    activeRun = null;
    ws.send(JSON.stringify({ type: 'error', message: `Engines failed: ${err.message}` }));
    if (onDone) onDone();
  });
}

// ─── Save & Broadcast Complete ──────────────────────────────────────────────
function saveAndBroadcast(results, ws) {
  let history = { runs: [] };
  if (fs.existsSync(RESULTS_FILE)) {
    try { history = JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8')); } catch (e) {}
  }
  history.runs.unshift(results);
  if (history.runs.length > 30) history.runs = history.runs.slice(0, 30);
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(history, null, 2));
  ws.send(JSON.stringify({ type: 'complete', results }));
  console.log(`[Golden] Run complete: ${results.passed} passed, ${results.failed} failed in ${results.duration}s`);
}

// ─── Start ──────────────────────────────────────────────────────────────────
server.listen(PORT, '127.0.0.1', () => {
  console.log('\n✦ VenQore Golden Verification Dashboard');
  console.log(`  http://localhost:${PORT}`);
  console.log('  Press Ctrl+C to stop\n');
});
