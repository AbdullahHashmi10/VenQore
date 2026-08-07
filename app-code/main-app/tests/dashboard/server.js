/**
 * FinalTester/dashboard/server.js — VenQore Test Command Center
 * =============================================================
 *
 * WHAT WAS WRONG BEFORE
 * ---------------------
 * The previous runners scraped Pest's human-readable console output with
 * regexes, then computed progress as:
 *
 *     completedModules.size / TOTAL_MODULES * 100
 *
 * where TOTAL_MODULES was the length of a hand-maintained array that mixed
 * real module names ("Module01") with individual test descriptions
 * ("logout route does not support delete method"). Two consequences:
 *
 *   - The first matched name jumped the bar straight to ~2%, so it never
 *     started at zero.
 *   - Any module discovered at runtime that was not in the array still got
 *     added to completedModules, so the numerator could exceed the
 *     denominator and the bar sailed past 100% before snapping back.
 *
 * The numerator and the denominator were counting different things. No amount
 * of clamping fixes that; the measurement itself was wrong.
 *
 * HOW THIS VERSION WORKS
 * ----------------------
 * Nothing is scraped. Three machine-readable channels, each used for the one
 * job it is actually good at:
 *
 *   1. DENOMINATOR — `pest --list-tests-xml`, run BEFORE execution. This is
 *      PHPUnit's own collector doing full discovery without executing
 *      anything, so the number it returns is by construction the number of
 *      tests that will run. Confirmed live at run start by the
 *      `##teamcity[testCount count='N']` message, which comes from the same
 *      collector.
 *
 *   2. NUMERATOR — `--teamcity`, streamed. Every test emits testStarted and
 *      exactly one terminal event (testFinished / testFailed / testIgnored).
 *      We count terminal events. One test, one increment.
 *
 *   3. FINAL TRUTH — `--log-junit`, parsed on close. If the stream and the
 *      log ever disagree, the log wins and the UI is corrected.
 *
 * Therefore:
 *
 *     progress = executed / expected,  clamped to [0, 100]
 *
 * starts at exactly 0, is monotonic, and cannot exceed 100. If the process
 * dies half way, the bar stops where it stopped and the UI says so, rather
 * than pretending the run completed.
 *
 * Port 7830 — deliberately not 7821/7822/7823, so this can run alongside the
 * three legacy dashboards without a port fight.
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

let WebSocketServer;
try {
  WebSocketServer = require('ws').Server;
} catch (e) {
  console.error('\n  Missing dependency "ws". Run:  npm install ws\n');
  process.exit(1);
}

const PORT = 7830;
const FINAL_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(FINAL_ROOT, '..');
const REPORTS = path.join(FINAL_ROOT, 'reports');
const LOGS = path.join(FINAL_ROOT, 'logs');

for (const dir of [REPORTS, LOGS]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CONFIG_PATH = path.join(FINAL_ROOT, 'config', 'finaltester.json');

function loadConfig() {
  const defaults = {
    phpBin: 'php',
    projectRoot: PROJECT_ROOT,
    canonicalConfig: 'FinalTester/phpunit.xml',
    categoriesConfig: 'FinalTester/config/phpunit.categories.xml'
  };
  try {
    return Object.assign(defaults, JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')));
  } catch (e) {
    return defaults;
  }
}

const config = loadConfig();

// ---------------------------------------------------------------------------
// TeamCity service-message parsing
//
// Format:  ##teamcity[<type> key='value' key='value' ...]
// Escaping (see Pest\Logging\TeamCity\ServiceMessage::escapeServiceMessage):
//     |  -> ||      '  -> |'      \n -> |n
//     \r -> |r      ]  -> |]      [  -> |[
// Unescaping must be a single left-to-right pass, otherwise "||n" (an escaped
// pipe followed by the letter n) would wrongly become a newline.
// ---------------------------------------------------------------------------
function unescapeTeamCity(value) {
  let out = '';
  for (let i = 0; i < value.length; i++) {
    if (value[i] !== '|') { out += value[i]; continue; }
    const next = value[++i];
    if (next === 'n') out += '\n';
    else if (next === 'r') out += '\r';
    else out += next; // covers ||  |'  |]  |[
  }
  return out;
}

function parseServiceMessage(line) {
  const trimmed = line.trim();

  // Two namespaces share the same grammar:
  //   ##teamcity[...]  from Pest
  //   ##venqore[...]   from Tests\Support\Live\LiveMetricsExtension, carrying
  //                    assertion counts and incomplete markers that the
  //                    TeamCity protocol does not transmit.
  let prefix = null;
  if (trimmed.startsWith('##teamcity[')) prefix = '##teamcity[';
  else if (trimmed.startsWith('##venqore[')) prefix = '##venqore[';

  if (prefix === null || !trimmed.endsWith(']')) return null;

  const body = trimmed.slice(prefix.length, -1);
  const spaceAt = body.indexOf(' ');
  if (spaceAt === -1) return { type: body, params: {} };

  const type = body.slice(0, spaceAt);
  const rest = body.slice(spaceAt + 1);
  const params = {};

  // key='value', where value may contain escaped quotes as |'
  const re = /(\w+)='((?:[^'|]|\|.)*)'/g;
  let m;
  while ((m = re.exec(rest)) !== null) {
    params[m[1]] = unescapeTeamCity(m[2]);
  }

  return { type, params };
}

// ---------------------------------------------------------------------------
// Area mapping — presentation only, never affects counts.
// Mirrors areaFor() in Scripts/expected.php.
// ---------------------------------------------------------------------------
/**
 * Normalise a test "class name" to a suite path.
 *
 * Pest gives closure-style test files a SYNTHETIC class name derived from the
 * file path, not from a namespace. Across one run you therefore see all of:
 *
 *   Tests\Feature\Money\GatingTest                    (real namespace)
 *   FinalTester\tests\Feature\Billing\GeoPricingTest  (path-derived)
 *   P\FinalTester\tests\Feature\Module12\ReportsTest  (path-derived, P\ prefix)
 *
 * Matching on a `Tests\` prefix therefore missed every Pest-syntax file and
 * dumped 595 of 1358 tests into "Feature (general)" — which is why Reports
 * showed 3 tests when Module12 alone has 12.
 *
 * Anchoring on the first Feature/Unit/Routes/Performance segment makes all
 * three forms collapse to the same thing.
 */
function normalizeSuite(className) {
  if (!className) return '';
  const m = String(className).replace(/\//g, '\\')
    .match(/(?:^|\\)(Feature|Unit|Routes|Performance)\\(.*)$/);
  return m ? m[1] + '\\' + m[2] : String(className);
}

// Matched against the NORMALISED suite path. Order matters: first hit wins.
const AREA_RULES = [
  [/^Feature\\(Money|Golden|Heart|Module05)\\/, 'Financial Engine'],
  [/^Feature\\Module20\\/,                      'SuperAdmin'],
  [/^Feature\\(V3|Module15)\\/,                 'Accounting'],
  [/^Feature\\Module03\\/,                      'POS'],
  [/^Feature\\Module04\\/,                      'Payments'],
  [/^Feature\\Module06\\/,                      'Sales'],
  [/^Feature\\Module07\\/,                      'Purchasing'],
  [/^Feature\\(Module08|Module09)\\/,           'Inventory'],
  [/^Feature\\(Module12|Module13|Reports)\\/,   'Reports'],
  [/^Feature\\(Module10|Module21)\\/,           'Integrations'],
  [/^Feature\\Module11\\/,                      'Billing'],
  [/^Feature\\Module16\\/,                      'Staff'],
  [/^Feature\\Module17\\/,                      'Settings'],
  [/^Feature\\Module18\\/,                      'Offline Sync'],
  [/^Feature\\Module19\\/,                      'VenSynQ'],
  [/^Feature\\Module01\\/,                      'Tenant Isolation'],
  [/^Feature\\Module02\\/,                      'Provisioning'],
  [/^Feature\\(Module14|Chat)\\/,               'AI'],
  [/^Feature\\(Guardrails|Core)\\/,             'Guardrails'],
  [/^Feature\\Production\\/,                    'Regression'],
  [/^Feature\\(Smoke|DemoStore)\\/,             'Smoke'],
  [/^Feature\\Tools\\/,                         'Tools'],
  [/^Feature\\Auth\\/,                          'Security'],
  [/^Feature\\(Billing|AppSumo)\\/,             'Billing'],
  [/^Routes\\/,                                 'Routes'],
  [/^Performance\\/,                            'Performance'],
  [/^Unit\\/,                                   'Unit']
];

// Root-level Feature/*.php files, matched on filename.
const NAME_RULES = [
  [/Route|Ziggy|Pulse/,                         'Routes'],
  [/Regression|RecentFixes/,                    'Regression'],
  [/Ledger|Accounting|PaymentAllocation|DebitNote|OpeningBalances/, 'Accounting'],
  [/Plan|Billing|AppSumo/,                      'Billing'],
  [/Pos|Terminal/,                              'POS'],
  [/Golden|Audit/,                              'Financial Engine'],
  [/Marketing|Sitemap|Blog|Partners|Pricing|Solutions|Compare|Feature Pages|Roadmap|Documentation|Crawl/, 'Marketing'],
  [/Migration|SystemReset|ProductDeletion|Import/, 'Database'],
  [/Profile|Auth|Passcode|Permission/,          'Security'],
  [/Smart|Chat/,                                'AI'],
  [/Inventory|Fulfillment|Stock/,               'Inventory']
];

const ALL_AREAS = [
  'Financial Engine', 'Accounting', 'POS', 'Payments', 'Sales', 'Purchasing',
  'Inventory', 'Reports', 'Security', 'Tenant Isolation', 'Provisioning',
  'Routes', 'Guardrails', 'VenSynQ', 'Integrations', 'AI', 'Offline Sync',
  'Database', 'Regression', 'Performance', 'Smoke', 'Tools', 'Billing',
  'Staff', 'Settings', 'SuperAdmin', 'Marketing', 'Unit', 'Feature (general)'
];

function areaFor(className) {
  const suite = normalizeSuite(className);
  if (!suite) return 'Feature (general)';

  for (const [re, area] of AREA_RULES) {
    if (re.test(suite)) return area;
  }

  const leaf = suite.split('\\').pop();
  for (const [re, area] of NAME_RULES) {
    if (re.test(leaf)) return area;
  }

  return 'Feature (general)';
}

// ---------------------------------------------------------------------------
// Preflight
//
// Scripts/run.bat has always run this; the dashboard did NOT, which was a real
// hole. On 2026-08-02 MySQL was stopped in XAMPP and the dashboard cheerfully
// started a run: 8 tests passed, 1322 sat at "not executed", and every failure
// read as a product defect. The whole point of preflight is that a red board
// must mean "the product is broken", never "a service was switched off".
//
// Returns null when the environment is fit, or the captured report when it is
// not. Nothing is executed in the failing case.
// ---------------------------------------------------------------------------
function preflight() {
  try {
    execFileSync(config.phpBin, [path.join(FINAL_ROOT, 'Scripts', 'preflight.php')], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 60000
    });
    return null;                       // exit 0 -> good to go
  } catch (e) {
    // Non-zero exit. stdout carries the numbered problems and their fixes.
    const out = [e.stdout, e.stderr].filter(Boolean).join('\n').trim();
    return out || `Preflight failed and produced no output (${e.message}).`;
  }
}

// ---------------------------------------------------------------------------
// Source sync
//
// FinalTester/tests is a MATERIALISED VIEW of Tester/tests (see
// FinalTester/Scripts/sync.php and FinalTester/bootstrap.php). Scripts/run.bat
// has always run the sync as step 2; this dashboard did not, so a run launched
// from the browser executed whatever happened to be sitting in FinalTester/tests
// while every edit made to the real source tree was silently ignored.
//
// That is how the 2026-08-03 10:07 run reported failures (I-05's TXN- filter,
// S-054, SuiteIntegrityTest) whose fixes had already been written to
// Tester/tests, and how 31 recovered marketing tests sat on disk without ever
// being counted. Both execution paths must sync. Do not remove this.
// ---------------------------------------------------------------------------
function syncSources() {
  try {
    const out = execFileSync(config.phpBin, [path.join(FINAL_ROOT, 'Scripts', 'sync.php'), '--quiet'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 120000
    });
    return { ok: true, output: (out || '').trim() };
  } catch (e) {
    const out = [e.stdout, e.stderr].filter(Boolean).join('\n').trim();
    return { ok: false, output: out || e.message };
  }
}

// ---------------------------------------------------------------------------
// Expected-count discovery
// ---------------------------------------------------------------------------
function discoverExpected(configFile, testsuite) {
  const args = [path.join(FINAL_ROOT, 'Scripts', 'expected.php'), `--config=${configFile}`];
  if (testsuite) args.push(`--testsuite=${testsuite}`);

  try {
    const out = execFileSync(config.phpBin, args, {
      cwd: PROJECT_ROOT,
      encoding: 'utf8',
      timeout: 300000,
      maxBuffer: 32 * 1024 * 1024
    });
    const lines = out.trim().split('\n');
    const n = parseInt(lines[lines.length - 1].trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch (e) {
    console.error('[expected] discovery failed:', e.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Run state
// ---------------------------------------------------------------------------
let activeRun = null;

function freshState(expected) {
  const areas = {};
  for (const a of ALL_AREAS) {
    areas[a] = { name: a, expected: 0, executed: 0, passed: 0, failed: 0, skipped: 0, status: 'not-executed' };
  }

  return {
    startedAt: new Date().toISOString(),
    // Denominator. Null means discovery failed; the UI shows an indeterminate
    // bar rather than inventing a number.
    expected: expected,
    executed: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    incomplete: 0,
    risky: 0,
    assertions: null,          // JUnit only; not available mid-stream
    durationMs: 0,
    finished: false,
    aborted: false,
    exitCode: null,
    areas: areas,
    failures: [],
    currentTest: null,
    currentClass: null
  };
}

/**
 * progress() — the whole point of this file.
 *
 *   0 when nothing has executed
 *   executed/expected in between
 *   never above 100
 *   null when we genuinely do not know the denominator, so the UI can say
 *   "unknown" instead of lying
 */
function progress(state) {
  if (!state.expected || state.expected <= 0) return null;
  const pct = (state.executed / state.expected) * 100;
  return Math.max(0, Math.min(100, pct));
}

function snapshot(state) {
  return {
    expected: state.expected,
    executed: state.executed,
    passed: state.passed,
    failed: state.failed,
    skipped: state.skipped,
    incomplete: state.incomplete,
    risky: state.risky,
    assertions: state.assertions,
    durationMs: state.durationMs,
    finished: state.finished,
    aborted: state.aborted,
    exitCode: state.exitCode,
    percent: progress(state),
    areas: state.areas,
    failures: state.failures.slice(0, 100),
    currentTest: state.currentTest,
    currentClass: state.currentClass
  };
}

function broadcast(wss, payload) {
  const data = JSON.stringify(payload);
  wss.clients.forEach((c) => {
    if (c.readyState === 1) c.send(data);
  });
}

// ---------------------------------------------------------------------------
// Test execution
// ---------------------------------------------------------------------------
function runTests(wss, opts) {
  const configFile = opts.testsuite
    ? config.categoriesConfig
    : config.canonicalConfig;

  broadcast(wss, { type: 'phase', phase: 'preflight', message: 'Preflight: checking the environment...' });

  const problems = preflight();

  if (problems !== null) {
    broadcast(wss, { type: 'blocked', report: problems });
    console.log('[preflight] blocked the run:\n' + problems);
    return;                            // nothing executes
  }

  broadcast(wss, { type: 'phase', phase: 'syncing', message: 'Syncing FinalTester/tests from the source suites...' });

  const sync = syncSources();

  if (!sync.ok) {
    // A stale copy silently reports results about code that no longer exists,
    // which is worse than not running at all. Refuse rather than guess.
    broadcast(wss, { type: 'blocked', report: 'FinalTester/tests could not be synced from Tester/tests, so the run would execute a stale copy.\n\n' + sync.output });
    console.log('[sync] blocked the run:\n' + sync.output);
    return;
  }

  broadcast(wss, { type: 'phase', phase: 'discovering', message: 'Counting tests (pest --list-tests-xml)...' });

  const expected = discoverExpected(configFile, opts.testsuite);
  const state = freshState(expected);
  const started = Date.now();

  // Seed per-area expected counts from the discovery report so each section
  // can show "executed / expected" too.
  try {
    const rep = JSON.parse(fs.readFileSync(path.join(REPORTS, 'expected.json'), 'utf8'));
    for (const [area, n] of Object.entries(rep.by_area || {})) {
      if (!state.areas[area]) {
        state.areas[area] = { name: area, expected: 0, executed: 0, passed: 0, failed: 0, skipped: 0, status: 'not-executed' };
      }
      state.areas[area].expected = n;
    }
  } catch (e) { /* discovery report optional */ }

  broadcast(wss, { type: 'start', expected: expected, state: snapshot(state) });

  const junitPath = path.join(REPORTS, 'junit.xml');
  if (fs.existsSync(junitPath)) fs.unlinkSync(junitPath);

  const args = [
    '-d', 'memory_limit=-1',
    path.join(PROJECT_ROOT, 'vendor', 'bin', 'pest'),
    '--configuration', configFile,
    // CRITICAL. Pest's test directory is NOT derived from --configuration.
    // bin/pest reads it as: $input->getParameterOption('--test-directory', 'tests')
    // and Bootstrappers\BootFiles then loads <root>/<test-directory>/Pest.php.
    //
    // Without this flag Pest loads the LEGACY tests/Pest.php, whose
    // pest()->extend(VenQoreTestCase::class)->in(...) registrations point at
    // tests/ and Tester/tests/ — never FinalTester/tests/. Every Pest
    // closure-style file then runs with no base class, no booted Laravel app,
    // and fails with "Call to undefined method ...::createTenant()" or
    // "Target class [config] does not exist".
    //
    // That single missing flag caused 352 of 438 failures in the 2026-08-02
    // 07:14 run. Do not remove it.
    '--test-directory=FinalTester/tests',
    '--teamcity',
    '--log-junit', junitPath,
    '--no-coverage'
  ];

  if (opts.testsuite) args.push('--testsuite', opts.testsuite);
  if (opts.filter) args.push('--filter', opts.filter);

  const logStream = fs.createWriteStream(path.join(LOGS, 'last-run.log'), { flags: 'w' });

  activeRun = spawn(config.phpBin, args, { cwd: PROJECT_ROOT });

  let buffer = '';
  // Tracks which class each running test belongs to, so a failure can be
  // attributed to the right area.
  let suiteStack = [];

  // Pest prints its own authoritative summary at the end:
  //   Tests:    438 failed, 1 risky, 55 incomplete, 6 skipped, 858 passed (4535 assertions)
  //   Duration: 305.42s
  // This is the ONLY source that accounts for every test, including ones that
  // error before PHPUnit can emit a testcase. Captured here, applied on close.
  let pestSummary = null;
  let pestDuration = null;

  // Verdict seen since the last testStarted. Pest emits testFailed or
  // testIgnored BEFORE the testFinished for the same test (both are guarded by
  // whenFirstEventForTest, so at most one arrives), then always emits
  // testFinished. We therefore treat testFinished as the single terminal event
  // and use this to decide which bucket it lands in. No verdict seen == pass.
  let pendingOutcome = null;

  activeRun.stdout.on('data', (chunk) => {
    logStream.write(chunk);
    buffer += chunk.toString();

    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const raw of lines) {
      const line = raw.replace(/\r$/, '');
      const msg = parseServiceMessage(line);

      if (!msg) {
        // Non-service output (fatal errors, warnings, Pest's own summary).
        const plain = stripAnsi(line);

        const summary = parsePestSummary(plain);
        if (summary) pestSummary = summary;

        const dur = plain.match(/^\s*Duration:\s*([\d.]+)s/);
        if (dur) pestDuration = parseFloat(dur[1]) * 1000;

        if (line.trim()) broadcast(wss, { type: 'output', line: plain });
        continue;
      }

      handleMessage(msg);
    }

    state.durationMs = Date.now() - started;
    broadcast(wss, { type: 'progress', state: snapshot(state) });
  });

  function currentArea() {
    const cls = suiteStack[suiteStack.length - 1] || state.currentClass;
    return areaFor(cls);
  }

  function bumpArea(field) {
    const area = currentArea();
    if (!state.areas[area]) {
      state.areas[area] = { name: area, expected: 0, executed: 0, passed: 0, failed: 0, skipped: 0, status: 'running' };
    }
    const a = state.areas[area];
    a.executed++;
    a[field]++;
    a.status = a.failed > 0 ? 'failing' : 'running';
  }

  function handleMessage(msg) {
    const p = msg.params;

    switch (msg.type) {
      case 'testCount': {
        // Authoritative confirmation from the same collector that produced
        // our denominator. If it disagrees with --list-tests-xml, trust this
        // one: it describes the run actually happening.
        const n = parseInt(p.count, 10);
        if (Number.isFinite(n) && n > 0 && n !== state.expected) {
          console.log(`[runner] expected adjusted ${state.expected} -> ${n} (testCount)`);
          state.expected = n;
        }
        break;
      }

      // ---- ##venqore[...] : metrics TeamCity does not carry --------------
      case 'assertions':
        state.assertions = parseInt(p.total, 10);
        break;

      case 'incomplete':
        state.incomplete = parseInt(p.total, 10);
        break;

      case 'testSuiteStarted':
        suiteStack.push(p.name);
        break;

      case 'testSuiteFinished': {
        suiteStack.pop();
        const area = areaFor(p.name);
        if (state.areas[area] && state.areas[area].status === 'running') {
          state.areas[area].status = state.areas[area].failed > 0 ? 'failing' : 'passing';
        }
        break;
      }

      case 'testStarted':
        state.currentTest = p.name;
        state.currentClass = suiteStack[suiteStack.length - 1] || null;
        break;

      // ---- terminal events: exactly one per test -----------------------
      case 'testFinished':
        // THE one place `executed` is incremented. One test, one increment.
        state.executed++;

        if (pendingOutcome === 'failed') {
          state.failed++;
          bumpArea('failed');
        } else if (pendingOutcome === 'risky') {
          state.risky++;
          // Risky tests did run and did not fail, so they count as executed
          // and are shown separately rather than being hidden in "skipped".
          bumpArea('passed');
        } else if (pendingOutcome === 'skipped') {
          state.skipped++;
          bumpArea('skipped');
        } else {
          state.passed++;
          bumpArea('passed');
        }

        pendingOutcome = null;
        state.currentTest = null;
        break;

      case 'testFailed':
        pendingOutcome = 'failed';
        state.failures.push({
          test: p.name,
          class: suiteStack[suiteStack.length - 1] || null,
          area: currentArea(),
          message: p.message || '',
          details: (p.details || '').split('\n').slice(0, 12).join('\n')
        });
        break;

      case 'testIgnored':
        // Pest routes BOTH "skipped" and "considered risky" through
        // testIgnored. The only thing distinguishing them is the message:
        // a genuine skip always says exactly "This test was ignored."
        // (see Pest\Logging\TeamCity\TeamCityLogger::testSkipped), whereas a
        // risky test carries PHPUnit's own explanation.
        pendingOutcome = (p.message === 'This test was ignored.') ? 'skipped' : 'risky';
        break;

      default:
        break;
    }
  }

  activeRun.stderr.on('data', (chunk) => {
    logStream.write(chunk);
    broadcast(wss, { type: 'stderr', text: chunk.toString() });
  });

  activeRun.on('error', (err) => {
    activeRun = null;
    logStream.end();
    broadcast(wss, {
      type: 'error',
      message: `Could not start PHP (${config.phpBin}): ${err.message}. `
             + 'Set "phpBin" in FinalTester/config/finaltester.json to the full path of php.exe.'
    });
  });

  activeRun.on('close', (code) => {
    activeRun = null;
    logStream.end();

    state.exitCode = code;
    state.durationMs = Date.now() - started;
    state.finished = true;
    state.currentTest = null;

    // ---- Reconciliation ------------------------------------------------
    const reconciled = reconcile(state, junitPath, pestSummary, pestDuration);

    // If the run genuinely did not finish, say so plainly rather than letting
    // the bar sit at some arbitrary percentage with no context.
    if (state.expected && state.executed < state.expected) {
      state.aborted = true;
    }

    fs.writeFileSync(
      path.join(REPORTS, 'last-run.json'),
      JSON.stringify({ finishedAt: new Date().toISOString(), ...snapshot(state) }, null, 2)
    );

    broadcast(wss, {
      type: 'complete',
      state: snapshot(state),
      reconciled: reconciled
    });

    console.log(
      `[runner] done in ${(state.durationMs / 1000).toFixed(1)}s — `
      + `${state.executed}/${state.expected || '?'} executed, `
      + `${state.passed} passed, ${state.failed} failed, ${state.skipped} skipped`
    );
  });
}

/**
 * Live ledger-truth route sweep.
 *
 * This is `php artisan audit:ledger-truth`, not a PHPUnit run: it boots the
 * app, seeds a Golden Audit tenant, hits every store.* GET route over HTTP and
 * reconciles the financial numbers rendered on each page against
 * journal_items. That is the ~154-route sweep, and it is a different KIND of
 * check from the 27 static route tests in the Routes suite — those verify the
 * wiring exists; this one verifies the pages actually load and their numbers
 * are true.
 *
 * It has no per-test protocol, so there is nothing to drive the progress bar
 * with. Rather than fake one, the output is streamed to the console panel and
 * the sweep reports its own totals.
 */
function runLedgerSweep(wss, skipSeed) {
  const started = Date.now();

  // The sweep boots the app and seeds a tenant — it needs the database even
  // more than the suite does.
  const problems = preflight();

  if (problems !== null) {
    broadcast(wss, { type: 'blocked', report: problems });
    return;
  }

  broadcast(wss, {
    type: 'sweep-start',
    message: skipSeed
      ? 'Ledger-truth route sweep (reusing existing tenant)...'
      : 'Ledger-truth route sweep (seeding Golden Audit tenant, this takes a while)...'
  });

  const args = [
    '-d', 'memory_limit=-1',
    'artisan', 'audit:ledger-truth',
    '--strict',
    '--env=testing'
  ];

  if (skipSeed) args.push('--skip-seed');

  activeRun = spawn(config.phpBin, args, {
    cwd: PROJECT_ROOT,
    env: Object.assign({}, process.env, { APP_ENV: 'testing' })
  });

  const logStream = fs.createWriteStream(path.join(LOGS, 'last-sweep.log'), { flags: 'w' });
  let buffer = '';
  let routesFound = null;
  let tick = null;

  // Liveness heartbeat: this command can sit silent for a minute while it
  // seeds, and a silent console is indistinguishable from a hang.
  tick = setInterval(function () {
    broadcast(wss, { type: 'sweep-tick', elapsedMs: Date.now() - started });
  }, 1000);

  const handle = (chunk) => {
    logStream.write(chunk);
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const raw of lines) {
      const line = stripAnsi(raw.replace(/\r$/, ''));

      const found = line.match(/Found\s+(\d+)\s+GET routes/i);
      if (found) routesFound = parseInt(found[1], 10);

      if (line.trim()) broadcast(wss, { type: 'output', line });
    }
  };

  activeRun.stdout.on('data', handle);
  activeRun.stderr.on('data', handle);

  activeRun.on('error', (err) => {
    activeRun = null;
    clearInterval(tick);
    logStream.end();
    broadcast(wss, { type: 'error', message: `Could not start PHP: ${err.message}` });
  });

  activeRun.on('close', (code) => {
    activeRun = null;
    clearInterval(tick);
    logStream.end();

    broadcast(wss, {
      type: 'sweep-complete',
      exitCode: code,
      routesFound: routesFound,
      durationMs: Date.now() - started
    });
  });
}

function stripAnsi(s) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '');
}

/**
 * Parse Pest's own end-of-run summary line.
 *
 *   Tests:    438 failed, 1 risky, 55 incomplete, 6 skipped, 858 passed (4535 assertions)
 *
 * Order and presence of the segments vary, so each is matched independently.
 */
function parsePestSummary(plainLine) {
  if (!/^\s*Tests:\s/.test(plainLine)) return null;

  const pick = (word) => {
    const m = plainLine.match(new RegExp('(\\d+)\\s+' + word));
    return m ? parseInt(m[1], 10) : 0;
  };

  const assertionsMatch = plainLine.match(/\((\d+)\s+assertions?\)/);

  const summary = {
    failed: pick('failed'),
    passed: pick('passed'),
    skipped: pick('skipped'),
    risky: pick('risky'),
    incomplete: pick('incomplete'),
    todos: pick('todos?'),
    assertions: assertionsMatch ? parseInt(assertionsMatch[1], 10) : null
  };

  summary.executed = summary.failed + summary.passed + summary.skipped
                   + summary.risky + summary.incomplete + summary.todos;

  return summary.executed > 0 ? summary : null;
}

/**
 * Read the ROOT <testsuite> attributes from a JUnit log.
 *
 * WHY ATTRIBUTES AND NOT <testcase> ELEMENTS
 * ------------------------------------------
 * The first version of this function counted <testcase> elements. On the
 * 2026-08-02 07:14 run that returned 73 for a run that executed 1358 tests,
 * and the dashboard collapsed from 1169 to 73 at the moment the run finished.
 *
 * The cause: when a test errors during construction — which is what happens
 * when a Pest closure-style file has no base class bound — PHPUnit never
 * writes a <testcase> for it. It only increments the parent testsuite's
 * `errors` attribute. In that run, 192 of 206 leaf suites carried tests="0"
 * while collectively reporting 355 errors, and the root said
 * tests="73" errors="355" failures="83" skipped="61" time="36.67"
 * against a real duration of 305s.
 *
 * JUnit is therefore NOT a safe source of truth for this project. It is kept
 * as a cross-check only.
 */
function readJunitRoot(junitPath) {
  if (!fs.existsSync(junitPath)) return null;

  try {
    const xml = fs.readFileSync(junitPath, 'utf8');
    const root = xml.match(/<testsuite\b[^>]*>/);
    if (!root) return null;

    const attr = (name) => {
      const m = root[0].match(new RegExp(name + '="([\\d.]+)"'));
      return m ? Number(m[1]) : 0;
    };

    const tests = attr('tests');
    const errors = attr('errors');
    const failures = attr('failures');
    const skipped = attr('skipped');

    return {
      tests: tests,
      errors: errors,
      failures: failures,
      skipped: skipped,
      assertions: attr('assertions'),
      // Tests that errored before construction are counted in `errors` but
      // never appear in `tests`, so the honest executed figure is the sum.
      accountedFor: tests + errors
    };
  } catch (e) {
    return null;
  }
}

/**
 * Decide the final numbers from three sources, in order of trustworthiness.
 *
 *   1. Pest's own summary line  — accounts for EVERY test, including ones
 *      that error before PHPUnit can record them. Authoritative.
 *   2. The live TeamCity stream — accurate for tests that actually started,
 *      misses tests that error at file level.
 *   3. The JUnit log            — cross-check only. See readJunitRoot above.
 *
 * The old code applied (3) unconditionally and clobbered (2). That is what
 * made the dashboard fall from 1169 to 73 at the end of a completed run.
 * Nothing is now allowed to silently reduce a count: if the sources disagree,
 * the disagreement is reported.
 */
function reconcile(state, junitPath, pestSummary, pestDuration) {
  const stream = {
    executed: state.executed,
    passed: state.passed,
    failed: state.failed,
    skipped: state.skipped,
    risky: state.risky
  };

  const junit = readJunitRoot(junitPath);

  if (pestSummary) {
    state.executed = pestSummary.executed;
    state.passed = pestSummary.passed;
    state.failed = pestSummary.failed;
    state.skipped = pestSummary.skipped;
    state.risky = pestSummary.risky;
    state.incomplete = pestSummary.incomplete;

    if (pestSummary.assertions !== null) state.assertions = pestSummary.assertions;
    if (pestDuration) state.durationMs = Math.max(state.durationMs, pestDuration);

    return {
      source: 'pest-summary',
      available: true,
      changed: stream.executed !== state.executed,
      stream: stream,
      pest: pestSummary,
      junit: junit,
      note: junit && junit.tests !== state.executed
        ? `JUnit recorded only ${junit.tests} testcase element(s) for ${state.executed} executed tests. `
          + 'That is expected when tests error during construction, and is why JUnit is a '
          + 'cross-check here rather than the source of truth.'
        : null
    };
  }

  // No Pest summary means the process died before printing one. Keep the
  // streamed numbers — they are the best available — and say so.
  return {
    source: 'stream',
    available: false,
    changed: false,
    stream: stream,
    junit: junit,
    reason: 'Pest never printed its summary line, so the run did not complete. '
          + 'Showing live-stream counts, which cover only tests that started.'
  };
}

// ---------------------------------------------------------------------------
// HTTP + WebSocket
// ---------------------------------------------------------------------------
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  // Expose the reports directory read-only so the UI can show the last run
  // and the route-coverage census without a round trip through the socket.
  if (urlPath.startsWith('/reports/')) {
    const file = path.join(REPORTS, path.basename(urlPath));
    if (fs.existsSync(file)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(fs.readFileSync(file));
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end('{"error":"not found"}');
  }

  const file = path.join(__dirname, path.basename(urlPath));
  if (!fs.existsSync(file)) {
    res.writeHead(404);
    return res.end('Not found');
  }

  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
  res.end(fs.readFileSync(file));
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'hello', projectRoot: PROJECT_ROOT, phpBin: config.phpBin }));

  // Replay the last run so a fresh browser tab is not blank.
  const last = path.join(REPORTS, 'last-run.json');
  if (fs.existsSync(last)) {
    try {
      ws.send(JSON.stringify({ type: 'last-run', state: JSON.parse(fs.readFileSync(last, 'utf8')) }));
    } catch (e) { /* ignore */ }
  }

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch (e) { return; }

    if (msg.action === 'run') {
      if (activeRun) {
        ws.send(JSON.stringify({ type: 'error', message: 'A run is already in progress.' }));
        return;
      }
      runTests(wss, { testsuite: msg.testsuite || null, filter: msg.filter || null });
    }

    if (msg.action === 'sweep') {
      if (activeRun) {
        ws.send(JSON.stringify({ type: 'error', message: 'A run is already in progress.' }));
        return;
      }
      runLedgerSweep(wss, msg.skipSeed === true);
    }

    if (msg.action === 'stop' && activeRun) {
      activeRun.kill();
      broadcast(wss, { type: 'output', line: '  Run cancelled by user.' });
    }
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  VenQore Test Command Center');
  console.log('  ' + '-'.repeat(52));
  console.log(`  Dashboard : http://localhost:${PORT}`);
  console.log(`  Project   : ${PROJECT_ROOT}`);
  console.log(`  PHP       : ${config.phpBin}`);
  console.log('');
  console.log('  Keep this window open. Ctrl+C to stop.');
  console.log('');
});
