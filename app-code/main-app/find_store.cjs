const fs = require('fs');
const path = require('path');

function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('store.slug')) {
                // Determine if store is destructured from usePage().props or passed as prop
                const hasStoreDestructured = /const\s+\{[^}]*store[^}]*\}\s*=\s*usePage\(\)\.props/g.test(content);
                const hasStoreProp = /const\s+\w+\s*=\s*\(\{[^}]*store[^}]*\}\)/g.test(content) || /function\s+\w+\s*\(\{[^}]*store[^}]*\}\)/g.test(content);
                
                if (!hasStoreDestructured && !hasStoreProp) {
                    console.log('Misses store prop/destructure:', fullPath);
                }
            }
        }
    }
}
walk('resources/js');
