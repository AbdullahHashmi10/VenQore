const fs = require('fs');
const path = require('path');

const baselinePath = path.resolve(__dirname, '../docs/approval-dashboard-audit-2026-09-22/evidence/final-repair/lint_baseline.json');
const currentPath = path.resolve(__dirname, '../docs/approval-dashboard-audit-2026-09-22/evidence/final-repair/lint_current.json');
const backlogOutPath = path.resolve(__dirname, '../docs/approval-dashboard-audit-2026-09-22/evidence/final-repair/lint_backlog.json');

function readJsonFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    } else if (content.charCodeAt(0) === 0xFFFD) {
        content = fs.readFileSync(filePath, 'utf16le');
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
    }
    const parsed = JSON.parse(content.trim());
    return parsed.diagnostics || (Array.isArray(parsed) ? parsed : []);
}

const baselineData = readJsonFile(baselinePath);
const currentData = readJsonFile(currentPath);

console.log('Baseline total diagnostics:', baselineData.length);
console.log('Current total diagnostics:', currentData.length);

// Index baseline by file + message + rule
const baselineSet = new Set();
for (const d of baselineData) {
    const filename = d.filename || (d.labels && d.labels[0] && d.labels[0].filename) || 'unknown';
    const normFile = filename.replace(/\\/g, '/');
    const key = `${normFile}|${d.code || d.rule}|${d.message}`;
    baselineSet.add(key);
}

const currentSet = new Set();
const newDiagnostics = [];
const touchedFiles = [
    'resources/js/Hooks/useOfflineSync.js',
    'resources/js/Pages/Approvals/Inbox.jsx',
    'resources/js/Pages/Approvals/MySubmissions.jsx',
    'resources/js/Pages/Approvals/Show.jsx',
    'resources/js/Pages/Dashboards/AccountantDashboard.jsx',
    'resources/js/Pages/Expenses/Create.jsx',
    'resources/js/Pages/NewPos.jsx',
    'resources/js/Pages/Payments/In.jsx',
    'resources/js/Pages/Payments/Out.jsx',
    'resources/js/Pages/Pos.jsx',
    'resources/js/Pages/Sales/CreateInvoice.jsx',
    'resources/js/Pages/Settings/SettingsPanel.jsx',
    'resources/js/Pages/Store/Staff/Index.jsx',
    'resources/js/ziggy.js'
];

for (const d of currentData) {
    const filename = d.filename || (d.labels && d.labels[0] && d.labels[0].filename) || 'unknown';
    const normFile = filename.replace(/\\/g, '/');
    const key = `${normFile}|${d.code || d.rule}|${d.message}`;
    currentSet.add(key);

    if (!baselineSet.has(key)) {
        newDiagnostics.push({
            file: normFile,
            rule: d.code || d.rule,
            message: d.message,
            span: d.labels
        });
    }
}

console.log('New diagnostics in current tree relative to baseline:', newDiagnostics.length);
if (newDiagnostics.length > 0) {
    console.log('NEW DIAGNOSTICS:', JSON.stringify(newDiagnostics, null, 2));
}

// Group legacy backlog by rule and file
const backlogByRule = {};
const backlogByFile = {};

for (const d of currentData) {
    const filename = d.filename || (d.labels && d.labels[0] && d.labels[0].filename) || 'unknown';
    const normFile = filename.replace(/\\/g, '/');
    const rule = d.code || d.rule || 'unknown_rule';

    if (!backlogByRule[rule]) backlogByRule[rule] = 0;
    backlogByRule[rule]++;

    if (!backlogByFile[normFile]) backlogByFile[normFile] = [];
    backlogByFile[normFile].push({
        rule,
        message: d.message,
        severity: d.severity
    });
}

const backlogReport = {
    generated_at: new Date().toISOString(),
    baseline_commit: '10988c43',
    baseline_error_count: baselineData.length,
    current_error_count: currentData.length,
    net_change: currentData.length - baselineData.length,
    new_errors_introduced: newDiagnostics.length,
    new_errors_list: newDiagnostics,
    rules_summary: backlogByRule,
    files_with_violations_count: Object.keys(backlogByFile).length,
    files_summary: Object.keys(backlogByFile).map(f => ({
        file: f,
        error_count: backlogByFile[f].length
    })).sort((a, b) => b.error_count - a.error_count)
};

fs.writeFileSync(backlogOutPath, JSON.stringify(backlogReport, null, 2));
console.log('Saved lint backlog to', backlogOutPath);
