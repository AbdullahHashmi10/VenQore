const fs = require('fs');

const xmlContent = fs.readFileSync('docs/testing/current-run-2026-09-24.xml', 'utf8');
const comparison = JSON.parse(fs.readFileSync('docs/approval-dashboard-audit-2026-09-22/full-suite-comparison.json', 'utf8'));

const sharedFailures = (comparison.breakdown.shared_failures || []).map(s => s.toLowerCase().trim());
const fixedFailures = (comparison.breakdown.fixed_failures || []).map(s => s.toLowerCase().trim());

const tcRegex = /<testcase\s+([^>]+?)(\/>|>([\s\S]*?)<\/testcase>)/g;
let match;
const failingCases = [];

while ((match = tcRegex.exec(xmlContent)) !== null) {
    const attrsStr = match[1];
    const body = match[3] || '';
    if (body.includes('<failure') || body.includes('<error')) {
        const nameMatch = attrsStr.match(/name="([^"]+)"/);
        const classMatch = attrsStr.match(/class="([^"]+)"/) || attrsStr.match(/classname="([^"]+)"/);
        const name = nameMatch ? nameMatch[1] : 'unknown';
        const className = classMatch ? classMatch[1] : 'unknown';

        const failMessageMatch = body.match(/<failure[^>]*>([\s\S]*?)<\/failure>/) || body.match(/<error[^>]*>([\s\S]*?)<\/error>/);
        const msg = failMessageMatch ? failMessageMatch[1].trim().split('\n')[0].slice(0, 150) : '';
        failingCases.push({ className, name, msg });
    }
}

console.log(`Parsed ${failingCases.length} total failing testcases from docs/testing/current-run-2026-09-24.xml:`);
console.log('--------------------------------------------------------------------------------');

// Group by test file / class
const byClass = {};
failingCases.forEach(f => {
    byClass[f.className] = byClass[f.className] || [];
    byClass[f.className].push(f);
});

let index = 1;
for (const [cls, list] of Object.entries(byClass)) {
    console.log(`\n### ${cls} (${list.length} failures):`);
    list.forEach(item => {
        console.log(`  ${index++}. ${item.name}`);
        console.log(`     Reason: ${item.msg}`);
    });
}
