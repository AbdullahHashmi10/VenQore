const fs = require('fs');
const path = require('path');

const missing = JSON.parse(fs.readFileSync('routes_missing_slug.json', 'utf8'));

// Group by file
const filesToFix = {};
missing.forEach(m => {
    if (!filesToFix[m.file]) filesToFix[m.file] = [];
    filesToFix[m.file].push(m);
});

Object.keys(filesToFix).forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Ensure usePage is imported from @inertiajs/react
    if (!content.includes("@inertiajs/react")) {
        // This is tricky. If there's no inertia import, we might need to add it.
        // But usually route() users at least have some inertia thing.
        // If not, we'll prefix the import list.
        content = "import { usePage } from '@inertiajs/react';\n" + content;
        changed = true;
    } else if (!content.includes("usePage") && content.includes("@inertiajs/react")) {
        // Add usePage to existing import
        content = content.replace(/import\s*\{([^}]+)\}\s*from\s*['"]@inertiajs\/react['"]/, (match, p1) => {
            return `import { usePage, ${p1.trim()} } from '@inertiajs/react'`;
        });
        changed = true;
    }

    // 2. Ensure const { store } = usePage().props; is present
    if (!content.includes("store") && !content.includes("store_slug")) {
        // Inject into the first function component body
        // Matches: export default function Name(...) { or const Name = (...) => {
        const funcRegex = /(function\s+\w+\s*\(.*?\)\s*\{|const\s+\w+\s*=\s*\(.*?\)\s*=>\s*\{)/;
        content = content.replace(funcRegex, `$1\n    const { store } = usePage().props;`);
        changed = true;
    }

    // 3. Replace route() calls
    filesToFix[filePath].forEach(m => {
        // Specific replacement to avoid double-injecting if script runs twice
        const oldCall = m.content;
        const newCall = `route('${m.route}', { store_slug: store.slug })`;
        
        // Escape for regex or just use string replace if one instance
        // We use split/join for global string replace without regex escaping hell
        content = content.split(oldCall).join(newCall);
        changed = true;
    });

    if (changed) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed: ${filePath}`);
    }
});
