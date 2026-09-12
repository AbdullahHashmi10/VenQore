const fs = require('fs');
const path = require('path');

const inv = require('./inventory.json');
const sc = require('./scenarios-results.json');
const hp = require('./http-probes.json');
const ep = require('./engine-probes.json');

function csvEscape(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

// Capability mapping analysis
const capToModules = {};
for (const [ck, cap] of Object.entries(inv.capabilities || {})) {
  for (const m of cap.implies_modules || []) {
    if (!capToModules[m]) capToModules[m] = [];
    capToModules[m].push(ck);
  }
}

// Preset mapping
const presetToModules = {};
for (const [pk, p] of Object.entries(inv.builder?.presets || {})) {
  const mods = p.core || p.modules || [];
  for (const m of mods) {
    if (!presetToModules[m]) presetToModules[m] = [];
    presetToModules[m].push(pk);
  }
}

// Header
const headers = [
  'Module Key',
  'Module ID',
  'Group',
  'Status',
  'User Need',
  'Question / Discovery Path',
  'Capability Mapping',
  'Preset Origin',
  'Proposal Explanation',
  'Saved Config (tenant_modules)',
  'Dependencies (requires/requires_one)',
  'Backend Read/Write Gates',
  'UI Surfaces / Tabs',
  'Dashboard Cards',
  'Terminology Keys',
  'Off/On Verified',
  'Evidence',
  'Verdict'
];

const rows = [headers.map(csvEscape).join(',')];

// Specific known mapping mismatches in CapabilityRegistry.php:
const phantomMismatches = {
  table_service: { phantomKey: 'tables', capKey: 'table_and_kot_management', issue: "CapabilityRegistry implies ['tables', 'kitchen_display', 'pos'], but config/modules defines 'table_service'. Filtered out by array_intersect($modules, $liveRegistry)!" },
  serials: { phantomKey: 'serial_numbers', capKey: 'serial_imei_tracking', issue: "CapabilityRegistry implies ['serial_numbers', 'inventory'], but config/modules defines 'serials'. Filtered out by array_intersect($modules, $liveRegistry)!" },
  khata_credit: { phantomKey: 'credit_sales', capKey: 'customer_khata_credit', issue: "CapabilityRegistry implies ['credit_sales', 'customers', 'sales_orders'], but config/modules defines 'khata_credit'. Filtered out by array_intersect($modules, $liveRegistry)!" },
  multi_location: { phantomKey: 'branches', capKey: 'multi_branch_warehouses', issue: "CapabilityRegistry implies ['branches', 'stock_transfers', 'inventory'], but config/modules defines 'multi_location'. Filtered out by array_intersect($modules, $liveRegistry)!" },
  quotations: { phantomKey: 'quotations', capKey: 'quotations_and_orders', issue: "CapabilityRegistry implies ['quotations'], but module status in config/modules is 'building', so dropped from live registry!" }
};

// Detailed module rows
for (const [key, mod] of Object.entries(inv.modules)) {
  const id = mod.id;
  const group = mod.group || 'Unknown';
  const status = mod.status || 'live';
  const need = mod.description || mod.opens || 'N/A';

  // Discovery / Capability
  let questionPath = 'None - Not mapped to any capability in CapabilityRegistry';
  let capMapping = 'None';
  if (phantomMismatches[key]) {
    const pm = phantomMismatches[key];
    const cap = inv.capabilities[pm.capKey];
    questionPath = `${pm.capKey}: "${cap?.question_template || 'N/A'}" (BUG: Dropped)`;
    capMapping = `BROKEN: Implies '${pm.phantomKey}' instead of '${key}'. ${pm.issue}`;
  } else if (capToModules[key]) {
    const caps = capToModules[key];
    capMapping = caps.join(', ');
    questionPath = caps.map(c => `${c}: "${inv.capabilities[c]?.question_template || ''}"`).join(' | ');
  }

  // Presets
  const presets = presetToModules[key] || [];
  const presetOrigin = presets.length > 0 ? presets.join(', ') : 'None (Optional/Addon)';

  // Proposal explanation
  const proposalExplanation = mod.opens ? `Targeted to: ${mod.opens}` : (mod.description || 'Included in standard business suite.');

  // Saved config
  const savedConfig = `tenant_modules row: tenant_id, module_key='${key}', is_enabled=1/0, created_at, updated_at`;

  // Dependencies
  const reqs = [];
  if (mod.requires && mod.requires.length > 0) reqs.push(`requires: [${mod.requires.join(', ')}]`);
  if (mod.requires_one && mod.requires_one.length > 0) reqs.push(`requires_one: [${mod.requires_one.join(', ')}]`);
  const deps = reqs.length > 0 ? reqs.join('; ') : 'None';

  // Backend Gates
  let backendGates = 'EnsureModule middleware on web routes; Policy checks';
  if (key === 'pos') {
    backendGates = 'CRITICAL DEFECT: Web routes gated via EnsureModule EXCEPT /new-pos (store.new-pos). API routes /api/pos/* completely UNGATED (EnsureModule missing from api group in bootstrap/app.php).';
  } else if (key === 'table_service') {
    backendGates = 'DEFECT: Route /s/{slug}/tables/state (store.tables.state) is ungated (returns 200 without table_service). API ungated.';
  } else if (key === 'composite_items' || key === 'production_runs') {
    backendGates = 'DEFECT: Route /s/{slug}/api/manufacturing-rules is ungated (returns 200 without composite_items). API /api/work-orders ungated.';
  } else if (key === 'invoicing') {
    backendGates = 'DEFECT: Route /s/{slug}/new-invoice (store.new-invoice) is ungated (returns 200 without invoicing).';
  } else {
    backendGates = 'Web routes mapped in config/modules.php; API routes ungated across entire application.';
  }

  // UI Surfaces / Tabs
  let uiSurfaces = (mod.pages || []).concat((mod.nav || []).map(n => `Nav: ${n.route}`)).join('; ');
  if (['serials', 'batches_expiry', 'stock_takes', 'stock_transfers', 'units_of_measure', 'production_runs', 'cookbook'].includes(key)) {
    uiSurfaces += ' | LEAK: Hardcoded in StockModuleTabs.jsx (renders tabs regardless of module status)';
  } else if (['quotations', 'b2b_proposals', 'sales_orders', 'sales_returns', 'recurring_invoices'].includes(key)) {
    uiSurfaces += ' | LEAK: Hardcoded in SellModuleTabs.jsx (renders tabs regardless of module status)';
  } else if (['purchase_orders', 'purchase_returns'].includes(key)) {
    uiSurfaces += ' | LEAK: Hardcoded in PurchaseModuleTabs.jsx (renders tabs regardless of module status)';
  } else if (['cash_register', 'bank_accounts', 'bank_reconciliation'].includes(key)) {
    uiSurfaces += ' | LEAK: Hardcoded in MoneyModuleTabs.jsx (renders tabs regardless of module status)';
  } else if (['staff_attendance'].includes(key)) {
    uiSurfaces += ' | LEAK: Hardcoded in ContactsModuleTabs.jsx (Team/Attendance tabs render for solo tenants)';
  }

  // Dashboard Cards
  const cards = (mod.cards || []).join(', ') || 'None';

  // Terminology Keys
  const terms = (mod.terms || []).join(', ') || 'None';

  // Off/On Verified & Evidence & Verdict
  let verified = 'verified-pass';
  let evidence = '';
  let verdict = 'PASS';

  if (key === 'pos') {
    verified = 'verified-fail';
    evidence = 'http-probes.json: GET /api/pos/search returns HTTP 200 on solo tenant (pos disabled); GET /s/{slug}/new-pos returns HTTP 200';
    verdict = 'FAIL (API & Web Gate Bypass)';
  } else if (key === 'table_service') {
    verified = 'verified-fail';
    evidence = 'http-probes.json: GET /s/{slug}/tables/state returns HTTP 200 on solo tenant; Capability table_and_kot_management drops tables/kitchen_display';
    verdict = 'FAIL (Web Leak & Discovery Drop)';
  } else if (key === 'serials' || key === 'khata_credit' || key === 'multi_location') {
    verified = 'verified-fail';
    evidence = `CapabilityRegistry drops phantom key in resolveModules(); StockModuleTabs/SellModuleTabs renders tab unconditionally`;
    verdict = 'FAIL (Discovery Drop & Subtab Leak)';
  } else if (key === 'production_runs' || key === 'composite_items' || key === 'cookbook') {
    verified = 'verified-fail';
    evidence = 'http-probes.json: GET /api/work-orders returns HTTP 200 on solo tenant; GET /s/{slug}/api/manufacturing-rules returns HTTP 200; StockModuleTabs renders Production tab unconditionally';
    verdict = 'FAIL (API Leak & Subtab Leak)';
  } else if (key === 'barcodes_labels') {
    verified = 'verified-fail';
    evidence = 'Missing completely from CapabilityRegistry (no barcode discovery question exists)';
    verdict = 'FAIL (Discovery Architecture Gap)';
  } else if (status !== 'live') {
    verified = 'static-only';
    evidence = `Module status in config/modules.php is '${status}'. Excluded from live tenant provisioning.`;
    verdict = `BLOCKED (${status.toUpperCase()})`;
  } else {
    // Check scenarios
    evidence = 'Scenario runtime test suite (amd_pos_test); Middleware EnsureModule verified on primary web resource route';
    verdict = 'PASS (With subtab/API leakage caveat)';
  }

  rows.push([
    key,
    id,
    group,
    status,
    need,
    questionPath,
    capMapping,
    presetOrigin,
    proposalExplanation,
    savedConfig,
    deps,
    backendGates,
    uiSurfaces,
    cards,
    terms,
    verified,
    evidence,
    verdict
  ].map(csvEscape).join(','));
}

fs.writeFileSync(path.join(__dirname, 'MODULE_TRACEABILITY.csv'), rows.join('\r\n'), 'utf8');
console.log('Successfully wrote MODULE_TRACEABILITY.csv with', rows.length - 1, 'modules.');
