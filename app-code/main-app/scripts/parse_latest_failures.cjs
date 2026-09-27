const fs = require('fs');

const xmlContent = fs.readFileSync('storage/test-results/junit_final_parallel.xml', 'utf8');
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

console.log(`Parsed ${failingCases.length} total failing testcases:`);
failingCases.forEach((f, idx) => {
    console.log(`${idx + 1}. [${f.className}] ${f.name}`);
    console.log(`   ${f.msg}`);
});
