const fs = require('fs');
const files = [
  'resources/js/Pages/Admin/Backups.jsx',
  'resources/js/Pages/DebitNotes/Create.jsx',
  'resources/js/Pages/Manufacturing/Rules.jsx',
  'resources/js/Pages/Proposals/Create.jsx',
  'resources/js/Pages/PurchaseOrders/Create.jsx',
  'resources/js/Pages/Returns/Create.jsx',
  'resources/js/Pages/SalesOrders/CreatePreSale.jsx'
];

files.forEach(f => {
   let text = fs.readFileSync(f, 'utf8');
   
   // 1. Remove ALL occurrences of `const { store } = usePage().props;` anywhere in the file to fix hook scope rule violations
   text = text.replace(/const\s+\{\s*store\s*\}\s*=\s*usePage\(\)\.props;?/g, '');
   // Also remove indented ones
   text = text.replace(/^\s*const\s+\{\s*store\s*\}\s*=\s*usePage\(\)\.props;?\n/gm, '');
   
   // 2. Insert it correctly at the top.
   if (text.includes('const { settings, auth } = usePage().props;')) {
        text = text.replace('const { settings, auth } = usePage().props;', 'const { settings, auth, store } = usePage().props;');
   } else if (text.includes('const { auth } = usePage().props;')) {
        text = text.replace('const { auth } = usePage().props;', 'const { auth, store } = usePage().props;');
   } else {
        // Fallback: Just look for standard react top-level component declaration
        let match = text.match(/(const\s+[A-Z]\w+\s*=\s*\([^)]*\)\s*=>\s*\{|export\s+default\s+function\s+[A-Z]\w+\s*\([^)]*\)\s*\{)/);
        if (match) {
            text = text.replace(match[0], match[0] + '\n    const { store } = usePage().props;');
        }
   }
   
   // API fixes in these forms:
   text = text.replace(/route\(['"]api\.categories['"]\)/g, "route('store.api.categories', { store_slug: store.slug })");
   text = text.replace(/route\(['"]api\.warehouses['"]\)/g, "route('store.api.warehouses', { store_slug: store.slug })");
   text = text.replace(/route\(['"]api\.bank-accounts['"]\)/g, "route('store.api.bank-accounts', { store_slug: store.slug })");
   text = text.replace(/route\(['"]accounting\.accounts\.api['"]\s*,\s*\{\s*type:\s*['"]asset['"]\s*\}\)/g, "route('store.accounting.accounts.api', { store_slug: store.slug, type: 'asset' })");
   text = text.replace(/route\(['"]suppliers\.search['"]\)/g, "route('store.suppliers.search', { store_slug: store.slug })");
   
   fs.writeFileSync(f, text);
});
console.log('Fixed specific remaining files.');
