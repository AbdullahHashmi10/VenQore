const fs = require('fs');
const path = require('path');

function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes("route('api.") || content.includes('route("api.') || content.includes("route('suppliers.search')")) {
                console.log('Found old route in:', fullPath);
            }
        }
    }
}
walk('resources/js');
