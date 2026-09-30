/**
 * audit_ziggy_routes.cjs
 *
 * Scans JavaScript / JSX source files in resources/js for static route('name')
 * calls and verifies them against registered Laravel/Ziggy routes.
 *
 * Exit code 0: All route references valid.
 * Exit code 1: One or more route references invalid.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function getPhpBinary() {
    if (process.env.PHP_BINARY && fs.existsSync(process.env.PHP_BINARY)) {
        return process.env.PHP_BINARY;
    }
    const xamppPhp = 'E:\\Software\\Xampp\\php\\php.exe';
    if (fs.existsSync(xamppPhp)) {
        return `"${xamppPhp}"`;
    }
    return 'php';
}

function getRegisteredRoutes(projectRoot, customRoutes = null) {
    if (customRoutes) {
        return new Set(customRoutes);
    }
    try {
        const php = getPhpBinary();
        const output = execSync(`${php} artisan route:list --json`, {
            cwd: projectRoot,
            maxBuffer: 10 * 1024 * 1024,
            encoding: 'utf8',
            stdio: ['ignore', 'pipe', 'ignore']
        });
        const parsed = JSON.parse(output);
        const routeNames = new Set();
        for (const item of parsed) {
            if (item.name) {
                routeNames.add(item.name);
            }
        }
        return routeNames;
    } catch (err) {
        console.error('Error fetching registered routes via artisan:', err.message);
        throw err;
    }
}

function scanDirectory(dir, fileList = [], ignorePatterns = ['_superseded', 'node_modules', '.git']) {
    if (!fs.existsSync(dir)) return fileList;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (ignorePatterns.some(p => fullPath.includes(p))) continue;
        if (entry.isDirectory()) {
            scanDirectory(fullPath, fileList, ignorePatterns);
        } else if (/\.(jsx?|tsx?)$/.test(entry.name)) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

function auditRoutes(options = {}) {
    const projectRoot = options.projectRoot || path.resolve(__dirname, '..');
    const scanDir = options.scanDir || path.join(projectRoot, 'resources', 'js');
    const registeredRoutes = options.registeredRoutes || getRegisteredRoutes(projectRoot, options.customRoutes);
    const files = options.files || scanDirectory(scanDir, [], options.ignorePatterns);

    const routeCallRegex = /(?:(?:\bwindow\.)?route(?:\(\))?\.(?:has|current)|\b(?:window\.)?route)\(\s*['"]([a-zA-Z0-9_\-.]+)['"]/g;

    const errors = [];
    let totalChecked = 0;

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');

        lines.forEach((line, lineIndex) => {
            // Skip comments
            const trimmed = line.trim();
            if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

            let match;
            routeCallRegex.lastIndex = 0;
            while ((match = routeCallRegex.exec(line)) !== null) {
                const routeName = match[1];
                totalChecked++;

                // Ignore wildcard checks in route().current('store.*') or placeholder names
                if (routeName.endsWith('.*')) {
                    const prefix = routeName.slice(0, -2);
                    const hasPrefixMatch = Array.from(registeredRoutes).some(r => r.startsWith(prefix));
                    if (!hasPrefixMatch) {
                        errors.push({
                            file: path.relative(projectRoot, file),
                            line: lineIndex + 1,
                            routeName,
                            snippet: line.trim()
                        });
                    }
                    continue;
                }

                if (!registeredRoutes.has(routeName)) {
                    errors.push({
                        file: path.relative(projectRoot, file),
                        line: lineIndex + 1,
                        routeName,
                        snippet: line.trim()
                    });
                }
            }
        });
    }

    return {
        totalChecked,
        filesScanned: files.length,
        errors,
        passed: errors.length === 0
    };
}

if (require.main === module) {
    try {
        const root = path.resolve(__dirname, '..');
        const result = auditRoutes({ projectRoot: root });

        if (!result.passed) {
            console.error(`\x1b[31m[Ziggy Route Audit] Found ${result.errors.length} invalid route reference(s):\x1b[0m`);
            result.errors.forEach(err => {
                console.error(`  - ${err.file}:${err.line} -> Unknown route '${err.routeName}' in: ${err.snippet}`);
            });
            process.exit(1);
        } else {
            console.log(`\x1b[32m[Ziggy Route Audit] PASSED: Scanned ${result.filesScanned} files, validated ${result.totalChecked} route references.\x1b[0m`);
            process.exit(0);
        }
    } catch (e) {
        console.error('\x1b[31m[Ziggy Route Audit] Fatal error during audit:\x1b[0m', e.message);
        process.exit(1);
    }
}

module.exports = { auditRoutes, getRegisteredRoutes, scanDirectory };
