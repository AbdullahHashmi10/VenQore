const fs = require('fs');
const path = require('path');
const routes = new Set();

function walk(dir) {
    for (let f of fs.readdirSync(dir)) {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.jsx') || p.endsWith('.js')) {
            let content = fs.readFileSync(p, 'utf8');
            let m;
            let regex = /route\(['"]([^'"]+)['"]/g;
            while ((m = regex.exec(content)) !== null) {
                routes.add(m[1]);
            }
        }
    }
}

walk('resources/js');
fs.writeFileSync('frontend_routes_used.txt', Array.from(routes).sort().join('\n'));
console.log('Done mapping frontend routes');
