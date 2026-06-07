const fs = require('fs');
const path = require('path');

function walk(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walk(filePath, fileList);
        } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const files = walk('resources/js');
const missing = [];

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    // Regex to find route('store.something') or route("store.something") WITHOUT second argument
    // Matches: route('store.foo') or route('store.foo' ) or route("store.foo")
    const regex = /route\(['"](store\.[^'"]+)['"]\s*\)/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        missing.push({ file, route: match[1], content: match[0] });
    }
});

fs.writeFileSync('routes_missing_slug.json', JSON.stringify(missing, null, 2));
console.log(`Found ${missing.length} missing slug injections.`);
