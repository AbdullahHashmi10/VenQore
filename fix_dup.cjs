const fs = require('fs');
const p = require('path');
function walk(d) {
    for (const f of fs.readdirSync(d)) {
        const pf = p.join(d, f);
        if (fs.statSync(pf).isDirectory()) {
            walk(pf);
        } else if (pf.endsWith('.jsx') || pf.endsWith('.js')) {
            let c = fs.readFileSync(pf, 'utf8');
            if (c.includes('import { usePage } from \'@inertiajs/react\';')) {
                let lines = c.split('\n');
                let m = 0;
                let toRemove = -1;
                for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes('import ') && lines[i].includes('usePage')) {
                        m++;
                        if (lines[i].trim() === 'import { usePage } from \'@inertiajs/react\';') {
                            toRemove = i;
                        }
                    }
                }
                if (m > 1 && toRemove !== -1) {
                    lines.splice(toRemove, 1);
                    fs.writeFileSync(pf, lines.join('\n'));
                    console.log('Fixed:', pf);
                }
            }
        }
    }
}
walk('resources/js');
