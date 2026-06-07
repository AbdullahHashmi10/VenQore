const fs = require('fs');
const path = require('path');

const map = {
  "reports.profit-loss": "store.reports.profit-loss",
  "reports.balance-sheet": "store.reports.balance-sheet",
  "reports.sales": "store.reports.sales",
  "reports.analytics": "store.reports.analytics",
  "reports.item-wise-profit": "store.reports.item-wise-profit",
  "reports.bill-wise-profit": "store.reports.bill-wise-profit",
  "reports.discount": "store.reports.discount",
  "reports.sale-aging": "store.reports.sale-aging",
  "reports.sale-orders": "store.reports.sale-orders",
  "reports.sale-order-items": "store.reports.sale-order-items",
  "reports.purchases": "store.reports.purchases",
  "reports.stock-valuation": "store.reports.stock-valuation",
  "reports.low-stock": "store.reports.low-stock",
  "reports.movement-history": "store.reports.movement-history",
  "reports.stock-aging": "store.reports.stock-aging",
  "reports.stock-summary-by-category": "store.reports.stock-summary-by-category",
  "reports.item-detail": "store.reports.item-detail",
  "reports.expiry": "store.reports.expiry",
  "reports.cash-flow": "store.reports.cash-flow",
  "reports.bank-statement": "store.reports.bank-statement",
  "reports.expenses": "store.reports.expenses",
  "reports.expense-by-category": "store.reports.expense-by-category",
  "reports.tax": "store.reports.tax",
  "reports.tax-rate": "store.reports.tax-rate",
  "reports.account-ledger": "store.reports.account-ledger",
  "reports.day-book": "store.reports.day-book",
  "reports.transactions": "store.reports.transactions",
  "reports.all-parties": "store.reports.all-parties",
  "reports.party-statement": "store.reports.party-statement",
  "reports.party-wise-profit-loss": "store.reports.party-wise-profit-loss",
  "reports.sale-purchase-by-party": "store.reports.sale-purchase-by-party",
  "reports.item-report-by-party": "store.reports.item-report-by-party",
  "reports.party-report-by-item": "store.reports.party-report-by-item",
  "reports.loan-statement": "store.reports.loan-statement",
  "finance.journal": "store.finance.journal",
  "finance.accounts": "store.finance.accounts",
  "pos": "store.pos",
  "inventory.dashboard": "store.inventory.dashboard",
  "sales.dashboard": "store.sales.dashboard",
  "finance": "store.finance.index", // Assuming this mapping
  "reports.index": "store.reports.index",
  "updater.index": "store.updater.index",
  "parties.index": "store.parties.index"
};

function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            
            for (const [oldName, newName] of Object.entries(map)) {
                // Match route: 'oldName' or route: "oldName"
                const regex = new RegExp(`route:\\s*['"]${oldName}['"]`, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, `route: '${newName}'`);
                    changed = true;
                }
            }

            if (changed) {
                // Special check for usePage and store
                if (!content.includes('usePage') && !content.includes('props.store') && !content.includes('store.slug')) {
                    // Try to inject store if we can
                    // Just a warning for now
                    console.log(`WARNING: ${fullPath} changed but might need store injection.`);
                }
                fs.writeFileSync(fullPath, content);
                console.log('Fixed property in:', fullPath);
            }
        }
    }
}

walk('resources/js');
console.log('Done fixing route properties.');
