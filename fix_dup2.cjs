const fs = require('fs');
const path = require('path');

function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]@inertiajs\/react['"]/);
            if (importMatch) {
                let inside = importMatch[1];
                let parts = inside.split(',').map(s => s.trim()).filter(s => s.length > 0);
                let uniqueParts = [...new Set(parts)];
                if (uniqueParts.length !== parts.length) {
                    content = content.replace(importMatch[0], `import { ${uniqueParts.join(', ')} } from '@inertiajs/react'`);
                    fs.writeFileSync(fullPath, content);
                    console.log('Fixed DUP', fullPath);
                }
            }
        }
    }
}
walk('resources/js');
