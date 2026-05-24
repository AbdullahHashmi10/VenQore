const fs = require('fs');
const path = require('path');

function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            // If uses usePage but no import line
            if (content.includes('usePage') && !content.includes('import { usePage }') && !content.includes('import {usePage}') && !content.includes(', usePage}')) {
                // Find if an @inertiajs/react import exists
                let importMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]@inertiajs\/react['"]/);
                if (importMatch) {
                    let oldImports = importMatch[1];
                    let newImports = `import { ${oldImports.trim()}, usePage } from '@inertiajs/react'`;
                    content = content.replace(importMatch[0], newImports);
                } else {
                    // Try to add right below the react import
                    let reactMatch = content.match(/import React.*\n/);
                    if (reactMatch) {
                        content = content.replace(reactMatch[0], reactMatch[0] + "import { usePage } from '@inertiajs/react';\n");
                    } else {
                        // At the very top
                        content = "import { usePage } from '@inertiajs/react';\n" + content;
                    }
                }
                fs.writeFileSync(fullPath, content);
                console.log('Fixed', fullPath);
            }
        }
    }
}
walk('resources/js');
console.log('Done fixing missing usePage imports.');
