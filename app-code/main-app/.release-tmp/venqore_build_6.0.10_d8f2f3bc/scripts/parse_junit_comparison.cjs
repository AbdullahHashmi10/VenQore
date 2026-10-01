const fs = require('fs');

// Read full-suite-comparison.json
const comparison = JSON.parse(fs.readFileSync('docs/approval-dashboard-audit-2026-09-22/full-suite-comparison.json', 'utf8'));
const sharedFailures = (comparison.breakdown.shared_failures || []).map(s => s.toLowerCase().trim());
const fixedFailures = (comparison.breakdown.fixed_failures || []).map(s => s.toLowerCase().trim());

// Read current-run-2026-09-24.xml
const xmlPath = 'docs/testing/current-run-2026-09-24.xml';
if (!fs.existsSync(xmlPath)) {
    console.error('File not found:', xmlPath);
    process.exit(1);
}
const xmlContent = fs.readFileSync(xmlPath, 'utf8');

// Regex to capture all testcases (either self-closing or with body)
const tcRegex = /<testcase\s+([^>]+?)(\/>|>([\s\S]*?)<\/testcase>)/g;
let match;

let totalTests = 0;
let totalFailures = 0;
const failingCases = [];

while ((match = tcRegex.exec(xmlContent)) !== null) {
    totalTests++;
    const attrsStr = match[1];
    const isClosing = match[2].startsWith('/>');
    const body = match[3] || '';

    const nameMatch = attrsStr.match(/name="([^"]+)"/);
    const classMatch = attrsStr.match(/class="([^"]+)"/);
    const classnameMatch = attrsStr.match(/classname="([^"]+)"/);

    const name = nameMatch ? nameMatch[1] : 'unknown';
    const className = classMatch ? classMatch[1] : (classnameMatch ? classnameMatch[1] : 'unknown');

    if (body.includes('<failure') || body.includes('<error')) {
        totalFailures++;
        const failMessageMatch = body.match(/<failure[^>]*>([\s\S]*?)<\/failure>/);
        const errorMatch = body.match(/<error[^>]*>([\s\S]*?)<\/error>/);
        const failAttrMatch = body.match(/<failure[^>]*message="([^"]*)"/);
        const errorAttrMatch = body.match(/<error[^>]*message="([^"]*)"/);

        let message = '';
        if (failMessageMatch) message = failMessageMatch[1].trim();
        else if (errorMatch) message = errorMatch[1].trim();
        else if (failAttrMatch) message = failAttrMatch[1].trim();
        else if (errorAttrMatch) message = errorAttrMatch[1].trim();

        // Take first 2 lines or 200 chars
        message = message.split('\n').slice(0, 2).join(' ').slice(0, 200);

        failingCases.push({
            class: className,
            name: name,
            identifier: `${className} > ${name}`,
            message: message
        });
    }
}

console.log('================================================================');
console.log('JUNIT XML PARSE SUMMARY (docs/testing/current-run-2026-09-24.xml)');
console.log('================================================================');
console.log('Total Testcases parsed in XML:', totalTests);
console.log('Total Failures/Errors parsed in XML:', totalFailures);
console.log('Documented shared_failures in JSON:', sharedFailures.length);
console.log('Documented fixed_failures in JSON:', fixedFailures.length);

const notInSharedFailures = [];
const inSharedFailures = [];

for (const fc of failingCases) {
    const normId = fc.identifier.toLowerCase().replace(/\\/g, '/');
    const normName = fc.name.toLowerCase();
    const normClass = fc.class.toLowerCase().replace(/\\/g, '/');

    let found = false;
    for (const sf of sharedFailures) {
        const normSf = sf.replace(/\\/g, '/');
        if (normSf.includes(normName) || normId.includes(normSf) || normSf.includes(normId)) {
            found = true;
            break;
        }
    }
    if (found) {
        inSharedFailures.push(fc);
    } else {
        notInSharedFailures.push(fc);
    }
}

console.log('Failures matching baseline shared_failures:', inSharedFailures.length);
console.log('Failures NOT matching baseline shared_failures:', notInSharedFailures.length);

console.log('\n================================================================');
console.log('DETAILED LIST OF ALL FAILING TESTS IN CURRENT RUN (' + failingCases.length + ')');
console.log('================================================================');

failingCases.forEach((f, i) => {
    const isShared = inSharedFailures.includes(f);
    console.log(`[${i+1}] ${isShared ? '[SHARED BASELINE]' : '[NEW / UNMATCHED]'} ${f.class} > ${f.name}`);
    if (f.message) {
        console.log(`    Message: ${f.message.replace(/\r?\n/g, ' ')}`);
    }
});
