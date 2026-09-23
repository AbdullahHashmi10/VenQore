const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const phpPath = 'E:\\Software\\Xampp\\php\\php.exe';
const evidenceDir = path.resolve(__dirname, '../docs/approval-dashboard-audit-2026-09-22/evidence/final-repair');

if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
}

const baselineDir = 'E:\\AMD POS\\baseline-10988c43\\app-code\\main-app';
const currentDir = path.resolve(__dirname, '..');

const baselineConsoleLog = path.join(evidenceDir, 'baseline_console.log');
const currentConsoleLog = path.join(evidenceDir, 'current_console.log');
const baselineJunit = path.join(evidenceDir, 'baseline_junit.xml');
const currentJunit = path.join(evidenceDir, 'current_junit.xml');
const comparisonJson = path.join(evidenceDir, 'full_suite_isolated_comparison.json');

console.log('=== STEP 8.1: Running Baseline Full Suite on amd_pos_test_baseline_10988c43 ===');
const baselineStart = new Date().toISOString();
console.log('Baseline start time:', baselineStart);

const baselineRun = spawnSync(phpPath, ['vendor/bin/pest', `--log-junit=${baselineJunit}`], {
    cwd: baselineDir,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    env: {
        ...process.env,
        DB_DATABASE: 'amd_pos_test_baseline_10988c43',
    }
});

const baselineEnd = new Date().toISOString();
console.log('Baseline completed with exit code:', baselineRun.status);
fs.writeFileSync(baselineConsoleLog, (baselineRun.stdout || '') + '\n' + (baselineRun.stderr || ''));

console.log('=== STEP 8.2: Running Repaired Current Full Suite on amd_pos_test_current_0d33d5b0 ===');
const currentStart = new Date().toISOString();
console.log('Current start time:', currentStart);

const currentRun = spawnSync(phpPath, ['vendor/bin/pest', `--log-junit=${currentJunit}`], {
    cwd: currentDir,
    encoding: 'utf8',
    maxBuffer: 50 * 1024 * 1024,
    env: {
        ...process.env,
        DB_DATABASE: 'amd_pos_test_current_0d33d5b0',
    }
});

const currentEnd = new Date().toISOString();
console.log('Current completed with exit code:', currentRun.status);
fs.writeFileSync(currentConsoleLog, (currentRun.stdout || '') + '\n' + (currentRun.stderr || ''));

console.log('=== STEP 8.3: Comparing JUnit XML Results ===');

function parseJunit(xmlPath) {
    if (!fs.existsSync(xmlPath)) return { total: 0, passed: 0, failed: 0, failures: [] };
    const xml = fs.readFileSync(xmlPath, 'utf8');

    const testcaseRegex = /<testcase\s+([^>]+)>(?:([\s\S]*?)<\/testcase>|(?:\/>))/g;
    const attrRegex = /(\w+)="([^"]*)"/g;

    const testcases = [];
    const failures = [];

    let match;
    while ((match = testcaseRegex.exec(xml)) !== null) {
        const attrStr = match[1];
        const innerContent = match[2] || '';

        const attrs = {};
        let attrMatch;
        while ((attrMatch = attrRegex.exec(attrStr)) !== null) {
            attrs[attrMatch[1]] = attrMatch[2];
        }

        const className = attrs.classname || attrs.class || '';
        const name = attrs.name || '';
        const file = attrs.file || '';
        const fullName = `${className}::${name}`;

        const isFailure = innerContent.includes('<failure') || innerContent.includes('<error');
        testcases.push({ fullName, file, className, name, isFailure });

        if (isFailure) {
            failures.push({ fullName, file, className, name });
        }
    }

    return {
        total: testcases.length,
        failed: failures.length,
        passed: testcases.length - failures.length,
        failures
    };
}

const baselineResults = parseJunit(baselineJunit);
const currentResults = parseJunit(currentJunit);

const baselineFailuresSet = new Set(baselineResults.failures.map(f => f.fullName));
const currentFailuresSet = new Set(currentResults.failures.map(f => f.fullName));

const currentOnlyFailures = currentResults.failures.filter(f => !baselineFailuresSet.has(f.fullName));
const fixedInCurrent = baselineResults.failures.filter(f => !currentFailuresSet.has(f.fullName));

const report = {
    generated_at: new Date().toISOString(),
    baseline: {
        commit: '10988c43',
        database: 'amd_pos_test_baseline_10988c43',
        started_at: baselineStart,
        completed_at: baselineEnd,
        exit_code: baselineRun.status,
        total: baselineResults.total,
        passed: baselineResults.passed,
        failed: baselineResults.failed,
        failures: baselineResults.failures
    },
    current: {
        commit: '0d33d5b0 (repaired)',
        database: 'amd_pos_test_current_0d33d5b0',
        started_at: currentStart,
        completed_at: currentEnd,
        exit_code: currentRun.status,
        total: currentResults.total,
        passed: currentResults.passed,
        failed: currentResults.failed,
        failures: currentResults.failures
    },
    comparison: {
        current_only_failures_count: currentOnlyFailures.length,
        current_only_failures: currentOnlyFailures,
        fixed_in_current_count: fixedInCurrent.length,
        fixed_in_current: fixedInCurrent,
        regression_status: currentOnlyFailures.length === 0 ? 'ZERO_REGRESSIONS_PASS' : 'REGRESSION_FAIL'
    }
};

fs.writeFileSync(comparisonJson, JSON.stringify(report, null, 2));

console.log('\n================ REGRESSION SUMMARY ================');
console.log(`Baseline Failures: ${baselineResults.failed} / ${baselineResults.total}`);
console.log(`Current Failures:  ${currentResults.failed} / ${currentResults.total}`);
console.log(`Fixed in Current:  ${fixedInCurrent.length}`);
console.log(`Current-Only Regressions: ${currentOnlyFailures.length}`);
console.log(`Regression Status: ${report.comparison.regression_status}`);
console.log('====================================================\n');
