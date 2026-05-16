const fs = require('fs');
const path = require('path');

function walk(dir, ext) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file, ext));
        } else if (file.endsWith(ext)) {
            results.push(file);
        }
    });
    return results;
}

const formatControllerOutput = (info) => {
    let out = [];
    out.push('  ┌─────────────────────────────────────────────────────────┐');
    out.push(`  │ CONTROLLER: ${info.name.padEnd(43)} │`);
    out.push(`  │ FILE: ${info.file.replace(/\\/g, '/').padEnd(49)} │`);
    out.push('  ├─────────────────────────────────────────────────────────┤');

    info.methods.forEach((m, idx) => {
        if (idx > 0) {
            out.push('  ├─────────────────────────────────────────────────────────┤');
        }
        out.push(`  │ METHOD: ${m.name.padEnd(47)} │`);
        if (m.notNeeded) {
            out.push(`  │   V3 SWAP STATUS: ✅ NOT NEEDED (read only)             │`);
        } else {
            out.push(`  │   Uses old AccountingService:     ${m.usesOldAcc.padEnd(21)} │`);
            out.push(`  │   Uses old FifoService:           ${m.usesOldFifo.padEnd(21)} │`);
            out.push(`  │   Uses V3 AccountingService:      ${m.usesV3Acc.padEnd(21)} │`);
            out.push(`  │   Uses V3 FifoService:            ${m.usesV3Fifo.padEnd(21)} │`);
            if (m.usesV3Other) {
                out.push(`  │   Uses other V3 class:            ${m.usesV3Other.padEnd(21)} │`);
            }
            out.push(`  │   Writes journal_entries direct:  ${(m.writesJe ? 'YES' : 'NO').padEnd(21)} │`);
            out.push(`  │   Writes inventory_batches direct:${(m.writesInv ? 'YES' : 'NO').padEnd(21)} │`);
            out.push(`  │   Writes payment_allocations direct:${(m.writesPayAlloc ? 'YES' : 'NO').padEnd(19)} │`);
            out.push(`  │   Updates payment_status direct:  ${(m.writesPayStat ? 'YES' : 'NO').padEnd(21)} │`);
            out.push(`  │   Updates remaining_qty direct:   ${(m.writesRemQty ? 'YES' : 'NO').padEnd(21)} │`);
            let status = m.status;
            let statusStr = status === 'DONE' ? '✅ DONE' : (status === 'NEEDS SWAP' ? '⏳ NEEDS SWAP' : '✅ NOT NEEDED');
            out.push(`  │   V3 SWAP STATUS: ${statusStr.padEnd(39)} │`);
        }
    });

    if (info.methods.length === 0) {
        out.push(`  │   (No methods found)                                    │`);
    }

    out.push('  └─────────────────────────────────────────────────────────┘');
    return out.join('\n');
};

const extractRoutesMap = () => {
    let routesMap = {};
    if (fs.existsSync('routes/web.php')) {
        const webContent = fs.readFileSync('routes/web.php', 'utf8');
        const routeRegex = /Route::[a-zA-Z]+\s*\(\s*['"](.*?)['"]\s*,\s*\[?\\?([a-zA-Z0-9_\\]+Controller)::class\s*,\s*['"](.*?)['"]\]?/g;
        let match;
        while ((match = routeRegex.exec(webContent)) !== null) {
            const ctrl = match[2];
            let nameMatch = webContent.substring(match.index).match(/->name\s*\(\s*['"](.*?)['"]\s*\)/);
            if (nameMatch) {
                routesMap[nameMatch[1]] = `${ctrl}@${match[3]}`;
            }
        }
    }
    return routesMap;
};

const main = () => {
    const controllersFiles = walk('app/Http/Controllers', '.php');
    let controllerScan = [];
    let methodStatuses = {}; // format: "SaleController@store" -> "DONE" / "NEEDS SWAP" / "NOT NEEDED"

    let allMethodsCount = 0;
    let doneMethodsCount = 0;
    let notNeededMethodsCount = 0;
    let criticalRisks = [];
    let taskList = [];

    // 1. Controllers Audit
    controllersFiles.forEach(c => {
        const fileNormalized = c.replace(/\\/g, '/');
        if (fileNormalized.includes('/V3/') || fileNormalized.includes('/Auth/')) return;
        const content = fs.readFileSync(c, 'utf8');
        const name = path.basename(c, '.php');

        let methods = [];
        const methodRegex = /public\s+function\s+([a-zA-Z0-9_]+)\s*\(/g;
        let match;
        let indices = [];
        while ((match = methodRegex.exec(content)) !== null) {
            indices.push({ name: match[1], index: match.index });
        }

        for (let i = 0; i < indices.length; i++) {
            const start = indices[i].index;
            const end = i < indices.length - 1 ? indices[i + 1].index : content.length;
            const methodBody = content.substring(start, end);
            const mName = indices[i].name + '()';
            const mNameRaw = indices[i].name;

            const usesOldAcc = methodBody.includes('AccountingService') && !methodBody.includes('V3\\AccountingService') && !methodBody.includes('V3\\\\AccountingService');
            const usesOldFifo = methodBody.includes('FifoService') && !methodBody.includes('V3\\FifoService') && !methodBody.includes('V3\\\\FifoService');
            const usesV3Acc = methodBody.includes('V3\\AccountingService') || methodBody.includes('V3\\\\AccountingService') || (content.includes('use App\\Services\\V3\\AccountingService;') && methodBody.includes('AccountingService'));
            const usesV3Fifo = methodBody.includes('V3\\FifoService') || methodBody.includes('V3\\\\FifoService') || (content.includes('use App\\Services\\V3\\FifoService;') && methodBody.includes('FifoService'));

            let usesV3Other = 'NO';
            const v3OtherMatch = methodBody.match(/V3\\[a-zA-Z0-9_]+Service/);
            if (v3OtherMatch) usesV3Other = v3OtherMatch[0];

            const writesJe = /journal_entries.*?insert|JournalEntry::(?:create|insert|update|delete|destroy)|(?:update|save).*?JournalEntry/i.test(methodBody);
            const writesInv = /inventory_batches.*?insert|InventoryBatch::(?:create|insert|update|delete|destroy)|(?:update|save).*?InventoryBatch/i.test(methodBody);
            const writesPayAlloc = /payment_allocations.*?insert|PaymentAllocation::(?:create|insert|update|delete|destroy)|(?:update|save).*?PaymentAllocation/i.test(methodBody);
            const writesPayStat = /update\(\[\s*['"]?payment_status/i.test(methodBody);
            const writesRemQty = /update\(\[\s*['"]?remaining_qty/i.test(methodBody);

            const writesData = writesJe || writesInv || writesPayAlloc || writesPayStat || writesRemQty || /update\(|create\(|delete\(|save\(|insert\(|destroy\(/i.test(methodBody);

            let status = 'NOT NEEDED';
            let notNeeded = false;

            const isReadOp = /^(index|show|create|edit|export|print|data|list|get)/i.test(mNameRaw);
            if (isReadOp && !writesData) {
                status = 'NOT NEEDED';
                notNeeded = true;
            } else if (usesOldAcc || usesOldFifo || writesData) {
                if (usesV3Acc && usesV3Fifo) {
                    status = 'DONE';
                } else if (usesOldAcc || usesOldFifo || writesData) {
                    status = 'NEEDS SWAP';
                } else {
                    status = 'NOT NEEDED';
                    notNeeded = true;
                }
            } else {
                notNeeded = true;
            }

            if (writesJe || writesInv || writesPayAlloc || writesPayStat || writesRemQty) {
                if (status === 'NEEDS SWAP') {
                    criticalRisks.push(`[ ] ${name}@${mNameRaw} — Direct write to DB bypassing V3 services`);
                    taskList.push({ task: `[ ] ${name}@${mNameRaw} — Fix Critical Direct DB Write`, priority: 1 });
                }
            } else if (status === 'NEEDS SWAP') {
                if (/(store|update|destroy|save|delete)/i.test(mNameRaw)) {
                    taskList.push({ task: `[ ] ${name}@${mNameRaw} — Swap to V3 Services`, priority: 2 });
                } else {
                    taskList.push({ task: `[ ] ${name}@${mNameRaw} — Swap to V3 Services`, priority: 5 });
                }
            }

            methodStatuses[`${name}@${mNameRaw}`] = status;

            allMethodsCount++;
            if (status === 'DONE') doneMethodsCount++;
            if (notNeeded) notNeededMethodsCount++;

            methods.push({
                name: mName,
                usesOldAcc: usesOldAcc ? 'YES' : 'NO',
                usesOldFifo: usesOldFifo ? 'YES' : 'NO',
                usesV3Acc: usesV3Acc ? 'YES → SWAPPED' : 'NO',
                usesV3Fifo: usesV3Fifo ? 'YES → SWAPPED' : 'NO',
                usesV3Other: usesV3Other === 'NO' ? null : usesV3Other,
                writesJe: writesJe,
                writesInv: writesInv,
                writesPayAlloc: writesPayAlloc,
                writesPayStat: writesPayStat,
                writesRemQty: writesRemQty,
                status: status,
                notNeeded: notNeeded,
                writesData: writesData ? true : false
            });
        }

        if (methods.length > 0) {
            controllerScan.push({ name, file: fileNormalized, methods });
        }
    });

    const routesMap = extractRoutesMap();

    // 2. Pages Audit
    let pagesFiles = walk('resources/js/Pages', '.jsx');
    let pagesScan = [];
    pagesFiles.forEach(file => {
        const fileNormalized = file.replace(/\\/g, '/');
        const content = fs.readFileSync(file, 'utf8');

        let calls = [];
        let status = 'NOT NEEDED';

        const routeRegex = /route\(['"]([^'"]+)['"]/g;
        let routeMatch;
        let pStatus = [];
        while ((routeMatch = routeRegex.exec(content)) !== null) {
            const rName = routeMatch[1];
            const ctrl = routesMap[rName];
            if (ctrl) {
                const s = methodStatuses[ctrl] || 'UNKNOWN';
                calls.push(`CALL  route('${rName}') → ${ctrl} [${s}]`);
                pStatus.push(s);
            } else {
                calls.push(`CALL  route('${rName}') → Unknown [UNKNOWN]`);
            }
        }

        const axiosRegex = /axios\.(post|put|delete|get)\(['"]([^'"]+)['"]/g;
        let axiosMatch;
        while ((axiosMatch = axiosRegex.exec(content)) !== null) {
            calls.push(`${axiosMatch[1].toUpperCase()}  ${axiosMatch[2]}`);
        }

        if (pStatus.includes('NEEDS SWAP')) status = 'PARTIAL';
        if (pStatus.length > 0 && pStatus.every(s => s === 'DONE')) status = 'DONE';

        const directManip = content.includes('setRemainingQty') || content.includes('payment_status') ? 'YES' : 'NO';

        if (calls.length > 0) {
            pagesScan.push(`  PAGE: ${fileNormalized}
  HTTP CALLS:
${calls.map(c => '    ' + c).join('\n')}
  DIRECT MANIPULATIONS: ${directManip}
  STATUS: ${status}
`);
        }
    });

    // 3. Dashboard Widgets Audit
    let widgetsFiles = [...walk('resources/js/Components', '.jsx'), ...walk('resources/js/Pages/Dashboard', '.jsx')];
    let widgetsScan = [];
    widgetsFiles.forEach(file => {
        const fileNormalized = file.replace(/\\/g, '/');
        const content = fs.readFileSync(file, 'utf8');

        // crude check for financial numbers
        if (/revenue|cogs|cash|balance|profit|inventory value|receivables|payables|formatCurrency/i.test(content) && /card|widget/i.test(path.basename(file))) {
            widgetsScan.push(`  WIDGET: ${path.basename(file)}
  FILE: ${fileNormalized}
  DATA FROM: PROPS/API
  CONTROLLER SWAPPED: ⏳ NEEDS SWAP (Needs manual verification)
  RISK: Showing wrong financial metrics until swapped`);
            taskList.push({ task: `[ ] Widget ${path.basename(file)} — wire to V3 data source`, priority: 3 });
        }
    });

    // 4. Reports Audit
    let reportsFiles = walk('resources/js/Pages/Reports', '.jsx');
    let reportsScan = [];
    reportsFiles.forEach(file => {
        const fileNormalized = file.replace(/\\/g, '/');
        const content = fs.readFileSync(file, 'utf8');
        reportsScan.push(`  REPORT: ${path.basename(file, '.jsx')}
  FILE: ${fileNormalized}
  CALLS: Props / API
  USES V3 REPORT SERVICE: ⏳ NEEDS SWAP
  DISPLAYS: Check component for specific metrics`);
        taskList.push({ task: `[ ] Report ${path.basename(file, '.jsx')} — wire to V3 ReportService`, priority: 4 });
    });

    taskList.sort((a, b) => a.priority - b.priority);

    // Build Output
    let out = [];
    out.push('# VenQore ERP — V3 Engine Swap Task List\n');
    out.push('## SUMMARY');
    out.push(`  Total methods needing swap:     ${taskList.filter(t => t.priority === 2 || t.priority === 5).length}`);
    out.push(`  Total methods swapped (done):   ${doneMethodsCount}`);
    out.push(`  Total methods not needed:       ${notNeededMethodsCount}`);
    out.push(`  Total pages affected:           ${pagesScan.length}`);
    out.push(`  Total widgets affected:         ${widgetsScan.length}`);
    out.push(`  Total reports affected:         ${reportsScan.length}`);
    out.push(`  CRITICAL RISKS found:           ${criticalRisks.length} (direct DB writes bypassing V3)\n`);

    out.push('## CRITICAL RISKS (Fix These First)');
    if (criticalRisks.length === 0) {
        out.push('  No critical risks found.');
    } else {
        criticalRisks.forEach(r => out.push('  ' + r));
    }

    out.push('\n## CONTROLLERS — SWAP STATUS');
    controllerScan.forEach(c => out.push(formatControllerOutput(c)));

    out.push('\n## REACT PAGES — SWAP STATUS');
    pagesScan.forEach(p => out.push(p));

    out.push('\n## DASHBOARD WIDGETS — SWAP STATUS');
    if (widgetsScan.length === 0) out.push('  None found.');
    widgetsScan.forEach(w => out.push(w + '\n'));

    out.push('\n## REPORTS — SWAP STATUS');
    if (reportsScan.length === 0) out.push('  None found.');
    reportsScan.forEach(r => out.push(r + '\n'));

    out.push('\n## ORDERED TASK LIST');
    taskList.forEach(t => out.push(t.task));

    if (!fs.existsSync('system_brain')) {
        fs.mkdirSync('system_brain');
    }
    fs.writeFileSync('system_brain/SWAP_TASK_LIST.md', out.join('\n'));
    console.log(`Successfully generated task list with ${taskList.length} total tasks.`);
};

main();
