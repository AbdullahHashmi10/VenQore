import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { parseMatrixData } from './parse-matrix-data.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.resolve(__dirname, '../../../extras/VENQORE_MODULE_BUSINESS_INTERACTIVE_MAP.html');
const outDir = path.resolve(__dirname, '../resources/data/reckoner');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const html = fs.readFileSync(htmlPath, 'utf8');

// Find the script content where DATA is defined
const scriptStartTag = '<script>';
const scriptEndTag = '</script>';
const scriptStart = html.indexOf(scriptStartTag);
const scriptEnd = html.indexOf(scriptEndTag, scriptStart);

if (scriptStart === -1 || scriptEnd === -1) {
  console.error('Could not find script block in HTML');
  process.exit(1);
}

const scriptContent = html.substring(scriptStart + scriptStartTag.length, scriptEnd);

// Create a sandbox to run the interactive map's data engine
const sandbox = {
  console,
  document: {
    getElementById: () => ({ addEventListener: () => {}, style: {}, classList: { add: () => {}, remove: () => {} } }),
    querySelector: () => ({ addEventListener: () => {}, style: {}, classList: { add: () => {}, remove: () => {} } }),
    querySelectorAll: () => [],
    addEventListener: () => {},
  },
  window: {
    addEventListener: () => {},
    scrollTo: () => {},
  },
  addEventListener: () => {},
  scrollTo: () => {},
  $: () => ({ addEventListener: () => {}, style: {}, classList: { add: () => {}, remove: () => {} } }),
  $$: () => [],
};

const context = vm.createContext(sandbox);

let exported;
try {
  exported = vm.runInContext(
    scriptContent + '\n;({ DATA, M, B, C, P, E, topPreset, rankedPreset, topBiz, rankedBiz, forbiddenFor, rounds, lexiconFor, streamsOf });',
    context
  );
} catch (err) {
  console.error('Script execution error:', err);
  process.exit(1);
}

const { DATA, M, B, C, P, E, topPreset, rankedPreset, topBiz, rankedBiz, forbiddenFor, rounds, lexiconFor, streamsOf } = exported || {};

if (!C || !M || !B || !P) {
  console.error('Failed to extract objects from HTML context');
  process.exit(1);
}

console.log('Total cards in DATA:', Object.keys(C).length);
console.log('Total modules in DATA:', Object.keys(M).length);
console.log('Total businesses in DATA:', Object.keys(B).length);
console.log('Total presets in DATA:', Object.keys(P).length);

const presets = Object.fromEntries(Object.values(P).map(p => [p.key, {
  name: p.name,
  sector: p.sector,
  modules: p.modules,
  default12: topPreset(p.key).map(c => c.key),
  available: rankedPreset(p.key).length,
}]));

const businesses = Object.fromEntries(Object.values(B).map(b => [b.key, {
  label: b.label,
  sector: b.sector,
  preset: b.preset,
  modules: b.modules,
  default12: topBiz(b.key).map(c => c.key),
  available: rankedBiz(b.key).length,
}]));

function deduceUnit(key, card) {
  const t = (key + ' ' + card.title + ' ' + (card.topic || '') + ' ' + card.insight).toLowerCase();
  if (card.viz === 'gauge' || t.includes(' %') || t.includes('percent') || t.includes('pct') || t.includes('rate') || t.includes('margin') || t.includes('share') || t.includes('yield')) {
    return { unit: 'percent', precision: 1 };
  }
  if (t.includes('days') || t.includes('transit') || t.includes('cycle')) {
    return { unit: 'days', precision: 0 };
  }
  if (t.includes('ratio')) {
    return { unit: 'ratio', precision: 2 };
  }
  if (t.includes('count') || t.includes('number of') || t.includes('qty') || t.includes('units') || t.includes('items') || t.includes('orders') || t.includes('customers') || t.includes('products') || t.includes('suppliers') || t.includes('batches') || t.includes('shifts') || t.includes('covers') || t.includes('tables')) {
    if (!t.includes('revenue') && !t.includes('value') && !t.includes('spend') && !t.includes('cost') && !t.includes('price')) {
      return { unit: 'count', precision: 0 };
    }
  }
  if (t.includes('revenue') || t.includes('profit') || t.includes('value') || t.includes('cost') || t.includes('spend') || t.includes('receivable') || t.includes('payable') || t.includes('balance') || t.includes('cash') || t.includes('ticket') || t.includes('flow') || t.includes('paid') || t.includes('due') || t.includes('debtors') || t.includes('price') || t.includes('money') || t.includes('drawings') || t.includes('emi') || t.includes('rupee') || t.includes('total')) {
    return { unit: 'currency', precision: 2 };
  }
  if (card.viz === 'trend' || card.viz === 'breakdown') {
    return { unit: 'currency', precision: 2 };
  }
  return { unit: 'count', precision: 0 };
}

// Load parsed matrix rows and measures
const matrixRows = parseMatrixData();
const cardMeasuresPath = path.resolve(outDir, 'card_to_measures.json');
const cardMeasuresMap = fs.existsSync(cardMeasuresPath)
  ? JSON.parse(fs.readFileSync(cardMeasuresPath, 'utf8'))
  : {};

const contractStatesPath = path.resolve(outDir, 'card_contract_states.json');
const contractStates = fs.existsSync(contractStatesPath)
  ? JSON.parse(fs.readFileSync(contractStatesPath, 'utf8'))
  : { verified: [], implemented_unverified: [], unimplemented: [] };

const verifiedKeys = new Set(contractStates.verified);
const implementedUnverifiedKeys = new Set(contractStates.implemented_unverified);

function resolvePermissions(mod, key) {
  switch (mod) {
    case 'pos':
    case 'invoicing':
    case 'quotations':
    case 'sales_orders':
    case 'sales_returns':
    case 'pricing_tiers':
    case 'pre_sales':
      return ['sales.view'];
    case 'expenses':
      return ['finance.expenses', 'reports.financial'];
    case 'payments':
    case 'cash_register':
    case 'bank_accounts':
    case 'bank_reconciliation':
    case 'accounting_workspace':
    case 'tax_compliance':
    case 'loans':
      return ['finance.balances', 'reports.financial'];
    case 'inventory':
    case 'multi_location':
    case 'stock_transfers':
    case 'stock_takes':
    case 'batches_expiry':
    case 'serials':
    case 'variants':
    case 'barcodes_labels':
    case 'units_of_measure':
      return ['inventory.view'];
    case 'purchases':
    case 'purchase_orders':
    case 'purchase_returns':
    case 'landed_cost':
      return ['purchases.view'];
    case 'cookbook':
    case 'production_runs':
    case 'composite_items':
      return ['inventory.view'];
    case 'customers':
      return ['sales.view'];
    case 'suppliers':
      return ['purchases.view'];
    case 'khata_credit':
      return ['finance.balances', 'sales.view'];
    case 'staff_attendance':
      return ['admin.staff_view'];
    default:
      return key.startsWith('core.') ? ['reports.financial', 'reports.summary'] : ['reports.summary'];
  }
}

const cards = Object.fromEntries(Object.values(C).map(c => {
  const deduced = deduceUnit(c.key, c);
  const matrixRow = matrixRows[c.key];

  let unit = matrixRow?.correctedUnit || deduced.unit;
  let precision = (unit === 'currency' || unit === 'ratio' || unit === 'percent') ? 2 : 0;

  const tier = matrixRow?.tier || 'Flow';
  const matrixStatus = matrixRow?.status || 'READY';

  // Determine contract_state and status_reason
  let contractState = 'unimplemented';
  let statusReason = null;
  if (verifiedKeys.has(c.key)) {
    contractState = 'verified';
  } else if (implementedUnverifiedKeys.has(c.key)) {
    contractState = 'implemented_unverified';
  } else {
    if (matrixStatus === 'FEATURE') {
      statusReason = 'Not available yet — feature data is not captured in this version';
    } else if (matrixStatus === 'COLUMN') {
      statusReason = 'Not available yet — required tracking column/event is pending migration';
    } else {
      statusReason = 'Not available yet — calculation contract implementation in progress';
    }
  }

  // Determine period_kind
  const periodKind = (tier === 'Flow') ? 'flow' : ((tier === 'Live' || tier === 'Check') ? 'live' : 'as_of');

  // Allowed periods
  const periods = (tier === 'Live' || tier === 'Ledger balance' || tier === 'Check')
    ? ['live', 'today', 'as_of', 'this_month']
    : ['today', 'yesterday', 'this_week', 'this_month', 'last_month', 'this_quarter', 'this_year', 'custom'];
  const defaultPeriod = (tier === 'Live' || tier === 'Ledger balance' || tier === 'Check')
    ? 'today'
    : (c.period ? 'this_month' : 'today');

  const permissions = resolvePermissions(c.module, c.key);
  const streams = streamsOf(c) || [];
  const cardMeasures = cardMeasuresMap[c.key] || ['gl.sales_revenue'];
  const checks = matrixRow?.check ? [matrixRow.check] : [];

  const contract = {
    measures: cardMeasures,
    projection: c.viz,
    unit,
    precision,
    period_kind: periodKind,
    dims: [],
    tier,
    checks,
    status: matrixStatus,
    status_reason: statusReason,
    definition_version: 1,
  };

  return [c.key, {
    key: c.key,
    title: c.title,
    viz: c.viz,
    shape: c.viz,
    module: c.module || null,
    period: c.period,
    weight: c.weight,
    topic: c.topic || null,
    insight: c.insight,
    unit,
    precision,
    streams,
    contract_state: contractState,
    status_reason: statusReason,
    permissions,
    periods,
    default_period: defaultPeriod,
    tier,
    matrix_status: matrixStatus,
    matrix: matrixRow ? {
      num: matrixRow.num,
      section: matrixRow.section,
      today: matrixRow.today,
      unit_col: matrixRow.unitCol,
      target: matrixRow.target,
      streams: matrixRow.streamsRaw,
    } : null,
    contract,
  }];
}));

const modules = Object.fromEntries(Object.values(M).map(m => [m.key, {
  id: m.id,
  label: m.label,
  group: m.group,
  groupName: m.groupName,
  alwaysOn: !!m.alwaysOn,
  needs: m.needs || [],
  needsAny: m.needsAny || [],
  why: m.why || null,
  cards: m.cards,
  businesses: m.businesses,
  neverOfferTo: m.forbidden || [],
}]));

const onboarding = Object.fromEntries(Object.values(B).map(b => [b.key, {
  alwaysOn: DATA.alwaysOn,
  neverOffer: forbiddenFor(b.key).map(m => ({ module: m.key, why: m.why })),
  rounds: rounds(b.key).map(r => ({
    round: r.n,
    modules: r.modules.map(x => ({
      module: x.m.key,
      label: x.m.label,
      blurb: x.m.description,
      preTicked: x.ticked,
      sectorProbability: x.p,
      needs: x.m.needs || [],
      needsAny: x.m.needsAny || [],
    })),
  })),
}]));

const lexicon = Object.fromEntries(Object.values(B).map(b => [b.key, lexiconFor(b.key)]));

const reckoner = {
  streams: DATA.streams,
  coreStreams: DATA.coreStreams,
  envelope: DATA.envelope,
  invariants: DATA.invariants,
  cardStreams: Object.fromEntries(Object.values(C).map(c => [c.key, streamsOf(c)])),
};

const blocks = {
  presets,
  businesses,
  cards,
  modules,
  onboarding,
  lexicon,
  reckoner,
};

for (const [name, data] of Object.entries(blocks)) {
  const filePath = path.join(outDir, `${name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Wrote ${filePath} (${Object.keys(data).length} entries)`);
}

console.log('Export completed successfully!');
