/**
 * pest-sync.cjs — CLI pest runner that keeps the dashboard in sync.
 *
 * Usage (from project root):
 *   node Tester/dashboard/pest-sync.cjs [extra pest args...]
 *
 * What it does:
 *   1. Runs: php vendor/bin/pest --configuration Tester/phpunit.xml --no-coverage [args]
 *   2. Streams output to stdout in real time (you see it as it runs)
 *   3. After completion writes/updates Tester/dashboard/last-results.json
 *      in the exact same format the dashboard's test-runner.js uses
 *
 * So the dashboard is always up to date after any terminal pest run.
 */

'use strict';

const { spawn }  = require('child_process');
const fs         = require('path').join;
const path       = require('path');
const fsSync     = require('fs');

// ─── Paths ──────────────────────────────────────────────────────────────────
const PROJECT_ROOT  = path.resolve(__dirname, '..', '..');
const RESULTS_FILE  = path.join(__dirname, 'last-results.json');
const CONFIG_FILE   = path.join(__dirname, 'config.json');

// ─── Config (reads phpBin + phpIni from dashboard config.json if present) ──
let config = { phpBin: 'E:\\Software\\Xampp\\php\\php.exe', phpIni: '' };
if (fsSync.existsSync(CONFIG_FILE)) {
  try { Object.assign(config, JSON.parse(fsSync.readFileSync(CONFIG_FILE, 'utf8'))); } catch (_) {}
}

// ─── Extra args forwarded from CLI ──────────────────────────────────────────
const extraArgs = process.argv.slice(2);

// ─── Build pest command ─────────────────────────────────────────────────────
const phpArgs = [
  ...(config.phpIni ? ['-c', config.phpIni] : []),
  'vendor/bin/pest',
  '--configuration', 'Tester/phpunit.xml',
  '--no-coverage',
  ...extraArgs,
];

// ─── Results object (mirrors test-runner.js shape) ──────────────────────────
const results = {
  timestamp:      new Date().toISOString(),
  projectPath:    PROJECT_ROOT,
  duration:       '0',
  passed:         0,
  failed:         0,
  todos:          0,
  incomplete:     0,
  modules:        {},
  bugs:           [],
  _currentModule: null,
};

// ─── Line parser (mirrors test-runner.js parseLine) ─────────────────────────
function parseLine(line) {
  // Module detection from "PASS Tests\Feature\ModuleXX\..."
  const moduleMatch = line.match(/(?:Tests|Tester[\\/\\\\]tests)[\\/\\\\](Feature|Unit|Performance)[\\/\\\\]([^/\\\\]+?)(?:[\\/\\\\]|\.php|$)/);
  if (moduleMatch) {
    const key = moduleMatch[1] === 'Unit' ? 'Unit' : moduleMatch[2];
    if (!results.modules[key]) {
      results.modules[key] = { name: key, status: 'pending', tests: [], passed: 0, failed: 0, todos: 0 };
    }
  }

  // PASS suite
  const passMatch = line.match(/PASS\s+(?:Tests|Tester[\\/\\\\]tests)[\\/\\\\](Feature|Unit|Performance)[\\/\\\\]([^/\\\\]+?)(?:[\\/\\\\]|\.php|$)/);
  if (passMatch) {
    const key = passMatch[1] === 'Unit' ? 'Unit' : passMatch[2];
    if (!results.modules[key]) results.modules[key] = { name: key, status: 'pending', tests: [], passed: 0, failed: 0, todos: 0 };
    results.modules[key].status = 'passed';
    results._currentModule = key;
  }

  // FAIL suite
  const failMatch = line.match(/FAIL\s+(?:Tests|Tester[\\/\\\\]tests)[\\/\\\\](Feature|Unit|Performance)[\\/\\\\]([^/\\\\]+?)(?:[\\/\\\\]|\.php|$)/);
  if (failMatch) {
    const key = failMatch[1] === 'Unit' ? 'Unit' : failMatch[2];
    if (!results.modules[key]) results.modules[key] = { name: key, status: 'pending', tests: [], passed: 0, failed: 0, todos: 0 };
    results.modules[key].status = 'failed';
    results._currentModule = key;
  }

  // Individual ✓ pass
  const testPass = line.match(/^\s+✓\s+(.*?)(?:\s+\d+(?:\.\d+)?s)?\s*$/);
  if (testPass) {
    const name = testPass[1].trim();
    results.passed++;
    if (results._currentModule && results.modules[results._currentModule]) {
      results.modules[results._currentModule].tests.push({ name, status: 'passed' });
      results.modules[results._currentModule].passed++;
    }
  }

  // Individual ✗ / × fail
  const testFail = line.match(/^\s+[✗×⨯]\s+(.*?)(?:\s+\d+(?:\.\d+)?s)?\s*$/);
  if (testFail) {
    const name = testFail[1].trim();
    results.failed++;
    results.bugs.push({ test: name, module: results._currentModule || 'unknown' });
    if (results._currentModule && results.modules[results._currentModule]) {
      results.modules[results._currentModule].tests.push({ name, status: 'failed' });
      results.modules[results._currentModule].failed++;
    }
  }

  // Individual ↓ todo / incomplete
  const testTodo = line.match(/^\s+[↓…]\s+(.*?)(?:\s+\d+(?:\.\d+)?s)?\s*$/);
  if (testTodo) {
    results.todos++;
    if (results._currentModule && results.modules[results._currentModule]) {
      results.modules[results._currentModule].todos++;
    }
  }

  // Summary line: "Tests: 53 incomplete, 649 passed (4174 assertions)"
  const summaryMatch = line.match(/Tests:\s+(.*)/);
  if (summaryMatch) {
    const summary = summaryMatch[1];
    const incompleteMatch = summary.match(/(\d+)\s+incomplete/);
    const passedMatch     = summary.match(/(\d+)\s+passed/);
    const failedMatch     = summary.match(/(\d+)\s+fail/);
    if (incompleteMatch) results.incomplete = parseInt(incompleteMatch[1], 10);
    // override totals from authoritative summary line
    if (passedMatch)     results.passed     = parseInt(passedMatch[1], 10);
    if (failedMatch)     results.failed     = parseInt(failedMatch[1], 10);
  }
}

// ─── Run pest ───────────────────────────────────────────────────────────────
console.log(`\n◈ pest-sync: running pest and syncing dashboard...\n`);

const startTime = Date.now();
const child = spawn(config.phpBin, phpArgs, {
  cwd:   PROJECT_ROOT,
  stdio: ['inherit', 'pipe', 'pipe'],
});

let buffer = '';

function handleChunk(chunk) {
  const text = chunk.toString();
  process.stdout.write(text);        // live stream to terminal
  buffer += text;
  const lines = buffer.split('\n');
  buffer = lines.pop();              // keep incomplete last line
  lines.forEach(parseLine);
}

child.stdout.on('data', handleChunk);
child.stderr.on('data',  handleChunk);

child.on('close', (code) => {
  if (buffer) parseLine(buffer);    // flush last line

  results.duration  = ((Date.now() - startTime) / 1000).toFixed(2);
  results.exitCode  = code;
  delete results._currentModule;

  // ─── Write / prepend to last-results.json ─────────────────────────────
  let history = { runs: [] };
  if (fsSync.existsSync(RESULTS_FILE)) {
    try { history = JSON.parse(fsSync.readFileSync(RESULTS_FILE, 'utf8')); } catch (_) {}
  }
  history.runs.unshift(results);
  if (history.runs.length > 20) history.runs = history.runs.slice(0, 20);
  fsSync.writeFileSync(RESULTS_FILE, JSON.stringify(history, null, 2));

  console.log(`\n◈ pest-sync: dashboard updated → ${RESULTS_FILE}`);
  console.log(`  ${results.passed} passed  ${results.failed} failed  ${results.incomplete} incomplete  (${results.duration}s)\n`);

  process.exit(code);
});

child.on('error', (err) => {
  console.error(`\npest-sync ERROR: ${err.message}`);
  console.error(`  phpBin = ${config.phpBin}`);
  process.exit(1);
});
