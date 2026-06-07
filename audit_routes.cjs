const fs = require('fs');

const frontendRoutes = fs.readFileSync('frontend_routes_used.txt', 'utf8').split('\n').map(r => r.trim()).filter(Boolean);
const webPhp = fs.readFileSync('routes/web.php', 'utf8');

// I will manually extract a more complete list of valid names from the file content analysis
const validNames = new Set([
  'marketing.features', 'marketing.pricing', 'marketing.about', 'marketing.contact', 
  'blog.index', 'blog.show', 'terms', 'privacy', 'webhooks.lemon-squeezy',
  'demo.start', 'demo.ping', 'demo.expired',
  'hub', 'my-stores.api', 'store.create-or-join', 'store.create', 'store.store', 'store.join', 'store.join.submit',
  'invite.accept', 'invite.complete', 'redeem', 'redeem.submit', 'account.edit', 'account.update',
  'store.setup', 'store.setup.complete', 'store.pos', 'store.pos.sale', 'store.pos.search', 'store.pos.featured', 'store.pos.categories', 'store.pos.barcode', 'store.pos.open', 'store.pos.close',
  'store.staff', 'store.staff.invite', 'store.staff.update', 'store.staff.remove',
  'store.billing', 'store.billing.portal', 'store.settings', 'store.settings.update', 'store.trial.expired',
  'store.admin.home', 'store.admin.dashboard', 'store.admin.settings', 'store.admin.settings.update', 'store.admin.users', 'store.admin.users.store', 'store.admin.staff', 'store.admin.attendance', 'store.admin.logs',
  'store.admin.data', 'store.admin.data.export', 'store.admin.data.import',
  'store.admin.backups', 'store.admin.backups.store', 'store.admin.backups.download', 'store.admin.backups.delete', 'store.admin.backups.email', 'store.admin.backups.restore',
  'store.admin.recycle-bin.index', 'store.admin.recycle-bin.restore', 'store.admin.recycle-bin.purge',
  'platform.dashboard', 'platform.stores', 'platform.users', 'platform.store.suspend', 'platform.store.activate', 'platform.store.extend-trial', 'platform.store.restore', 'platform.store.purge', 'platform.user.restore', 'platform.user.purge',
  'platform.appsumo.index', 'platform.appsumo.generate', 'platform.appsumo.import', 'platform.appsumo.export', 'platform.appsumo.purge',
  'platform.tickets', 'platform.ticket.show', 'platform.ticket.reply', 'platform.ticket.status', 'platform.webhooks', 'platform.store.feature-flag', 'platform.impersonate.start', 'platform.impersonate.end',
  'platform.set-passcode', 'platform.clear-passcode', 'platform.change-password',
  'installer.index', 'csrf.refresh', 'updater.index', 'dashboard', 'welcome', 'welcome-splash',
  'appsumo.index', 'appsumo.redeem', 'what-is-included', 'refund-policy', 'health',
  'inventory.search', 'customers.search', 'api.categories', 'sales.parked', 'sales.recall', 'sales.parked.delete', 'sales.park',
  'store.dashboard', 'store.home', 'store.dashboard-v1',
  'store.inventory.dashboard', 'store.inventory.index', 'store.inventory.stats', 'store.inventory.store', 'store.inventory.bulk-destroy', 'store.inventory.check-dependencies', 'store.inventory.search', 'store.inventory.reservations', 'store.inventory.history', 'store.inventory.update', 'store.inventory.destroy',
  'store.stock-operations', 'store.stock-operations.transfer', 'store.stock-operations.adjust', 'store.stock-operations.audit', 'store.stock-operations.warehouse.store', 'store.stock-operations.warehouse.update',
  'store.activity-log.index',
  'store.api.sync.users', 'store.api.sync.products', 'store.api.sync.customers', 'store.api.sync.suppliers', 'store.api.sync.inventory', 'store.api.sync.taxes', 'store.api.sync.orders.batch', 'store.api.heartbeat', 'store.api.check-connection',
  'store.suppliers.index', 'store.suppliers.create', 'store.suppliers.store', 'store.suppliers.show', 'store.suppliers.edit', 'store.suppliers.update', 'store.suppliers.destroy',
  'store.purchase-orders.index', 'store.purchase-orders.create', 'store.purchase-orders.store', 'store.purchase-orders.show', 'store.purchase-orders.edit', 'store.purchase-orders.update', 'store.purchase-orders.destroy',
  'store.purchase-orders.receive', 'store.purchase-orders.print',
  'store.proposals.index', 'store.proposals.create', 'store.proposals.store', 'store.proposals.show', 'store.proposals.edit', 'store.proposals.update', 'store.proposals.destroy',
  'store.proposals.convert', 'store.proposals.convert-to-sale', 'store.proposals.convert-to-presale', 'store.proposals.print',
  'store.sales-orders.index', 'store.sales-orders.create', 'store.sales-orders.store', 'store.sales-orders.show', 'store.sales-orders.edit', 'store.sales-orders.update', 'store.sales-orders.destroy',
  'store.sales-orders.convert', 'store.sales-orders.export', 'store.sales-orders.print', 'store.sales-orders.cancel',
  'store.labels.index', 'store.labels.print',
  'store.reports.index', 'store.reports.sales', 'store.reports.purchases', 'store.reports.day-book', 'store.reports.profit-loss', 'store.reports.party-statement', 'store.reports.transactions', 'store.reports.expenses', 'store.reports.account-ledger', 'store.reports.tax', 'store.reports.bank-statement',
  'store.reports.stock-valuation', 'store.reports.low-stock', 'store.reports.movement-history', 'store.reports.expiry',
  'store.reports.balance-sheet', 'store.reports.all-parties', 'store.reports.trial-balance', 'store.reports.item-wise-profit', 'store.reports.party-wise-profit-loss', 'store.reports.discount', 'store.reports.cash-flow', 'store.reports.sale-aging', 'store.reports.sale-orders', 'store.reports.bill-wise-profit', 'store.reports.expense-by-category', 'store.reports.expense-by-item', 'store.reports.stock-summary-by-category', 'store.reports.item-detail', 'store.reports.loan-statement', 'store.reports.tax-rate', 'store.reports.sale-purchase-by-party', 'store.reports.item-report-by-party', 'store.reports.party-report-by-item', 'store.reports.sale-purchase-by-item-category', 'store.reports.item-category-wise-profit-loss', 'store.reports.item-wise-discount', 'store.reports.sale-order-items', 'store.reports.stock-aging', 'store.reports.sale-purchase-by-party-group',
  'store.cookbook.index', 'store.cookbook.create', 'store.cookbook.store', 'store.cookbook.edit', 'store.cookbook.update', 'store.cookbook.destroy', 'store.cookbook.simulate',
  'store.growth-engine.index', 'store.growth-engine.refresh', 'store.growth-engine.dashboard', 'store.growth-engine.whatsapp', 'store.growth-engine.dismiss', 'store.growth-engine.mark-read', 'store.growth-engine.settings', 'store.growth-engine.update-settings',
  'store.global.search', 'store.ai.query', 'store.ai.test',
  'store.import-export.index', 'store.products.export', 'store.products.import', 'store.parties.export', 'store.parties.import', 'store.import.template',
  'store.products.variants.index', 'store.products.variants.store', 'store.variants.update', 'store.variants.destroy',
  'store.attributes.index', 'store.attributes.store', 'store.attributes.update', 'store.attributes.destroy',
  'store.categories.index', 'store.categories.store', 'store.categories.update', 'store.categories.destroy',
  'store.inventory.stock-levels',
  'store.bank-accounts.index', 'store.bank-accounts.store', 'store.bank-accounts.update', 'store.bank-accounts.destroy', 'store.bank-accounts.transactions',
  'store.parties.index', 'store.parties.store', 'store.parties.update', 'store.parties.destroy', 'store.parties.ledgers', 'store.parties.ledger',
  'store.expenses.index', 'store.expenses.store', 'store.expenses.category.store', 'store.expenses.update', 'store.expenses.destroy',
  'store.payments.index', 'store.payments.in', 'store.payments.out', 'store.payments.store', 'store.payments.show',
  'store.purchases.index', 'store.purchases.create', 'store.purchases.store', 'store.purchases.show', 'store.purchases.edit', 'store.purchases.update', 'store.purchases.destroy', 'store.purchases.receive', 'store.transactions.index',
  'store.inventory.stock', 'store.pre-sales.index', 'store.pre-sales.create', 'store.pre-sales.store', 'store.pre-sales.export', 'store.sales.orders.show', 'store.sales.orders.update', 'store.pre-sales.convert', 'store.pre-sales.destroy',
  'store.production.index', 'store.production.create', 'store.production.store', 'store.production.show', 'store.production.complete',
  'store.parked-sales.index', 'store.parked-sales.destroy', 'store.purchases.receive.store', 'store.customers.index', 'store.customers.create', 'store.customers.store', 'store.customers.show', 'store.customers.edit', 'store.customers.update', 'store.customers.destroy',
  'store.customers.search', 'store.suppliers.search', 'store.parties.search',
  'store.sales.dashboard', 'store.sales.index', 'store.reports.analytics', 'store.sales.export', 'store.sales.store', 'store.attendance.status', 'store.attendance.check-in', 'store.attendance.heartbeat', 'store.attendance.check-out', 'store.attendance.log-gap', 'store.sales.print',
  'store.sales.bulk-destroy', 'store.sales.park', 'store.sales.parked', 'store.sales.recall', 'store.sales.parked.delete', 'store.sales.get-items', 'store.sales.show', 'store.sales.edit', 'store.sales.update', 'store.sales.cancel', 'store.sales.return', 'store.sales.destroy',
  'store.api.categories', 'store.sales.invoice.create', 'store.sales.master', 'store.presales.create', 'store.manufacturing.rules', 'store.api.categories.general', 'store.api.warehouses',
  'store.finance', 'store.finance.receivables', 'store.finance.payables', 'store.funds.index', 'store.funds.add', 'store.funds.remove', 'store.funds.transfer', 'store.funds.adjust', 'store.funds.history.ledger', 'store.funds.cash-history',
  'store.api.custom-charges', 'store.api.bank-accounts', 'store.settings.charges.store', 'store.settings.charges.update', 'store.settings.charges.delete',
  'store.charity.stats', 'store.charity.add', 'store.charity.update-default', 'store.sales.send-email', 'store.sales.send-whatsapp',
  'store.accounting.dashboard', 'store.accounting.index', 'store.accounting.pnl', 'store.accounting.balance-sheet', 'store.accounting.accounts.api',
  'store.reports.dashboard', 'store.admin.home', 'store.admin.data', 'store.admin.data.export', 'store.admin.data.import', 'store.admin.data.upload-mapping', 'store.admin.data.template',
  'store.staff-attendance.index', 'store.staff-attendance.show', 'store.staff-attendance.approve-gap', 'store.staff-attendance.reject-gap',
  'store.loyalty.info', 'store.loyalty.award', 'store.loyalty.redeem', 'store.gift-cards.create', 'store.gift-cards.check', 'store.gift-cards.use', 'store.store-credit.add', 'store.store-credit.use',
  'store.notifications.index', 'store.notifications.mark-all-read', 'store.notifications.mark-read', 'store.notifications.destroy',
  'store.profile.edit', 'store.profile.update', 'store.profile.destroy', 'store.profile.passcode',
  'store.returns-history.index', 'store.returns.create', 'store.returns.store', 'store.returns-history.show',
  'store.recurring-invoices.index', 'store.recurring-invoices.create', 'store.recurring-invoices.store', 'store.recurring-invoices.edit', 'store.recurring-invoices.update', 'store.recurring-invoices.toggle', 'store.recurring-invoices.destroy',
  'store.stock-transfers.index', 'store.stock-transfers.create', 'store.stock-transfers.store', 'store.stock-transfers.show', 'store.stock-transfers.edit',
  'store.stock-takes.index', 'store.stock-takes.create', 'store.stock-takes.store', 'store.stock-takes.show',
  'store.batches.index', 'store.batches.show', 'store.serials.index', 'store.serials.show',
  'store.debit-notes.index', 'store.debit-notes.create', 'store.debit-notes.store', 'store.debit-notes.show',
  'store.bank-reconciliation.index', 'store.bank-reconciliation.import',
  'store.invoice-reminders.index', 'store.invoice-reminders.create', 'store.invoice-reminders.store', 'store.invoice-reminders.send',
  'store.staff.attendance.index', 'store.staff.attendance.show', 'store.staff.attendance.approve-gap', 'store.staff.attendance.reject-gap',
  'store.marketing-campaigns.index', 'store.marketing-campaigns.create', 'store.marketing-campaigns.store',
  'store.online-store.index', 'store.online-store.update', 'store.woocommerce.index', 'store.e-invoicing.index', 'store.e-invoicing.generate', 'store.system.reset', 'store.system.delete-entity',
  'billing.index', 'billing.upgrade', 'billing.portal', 'api.plan.usage',
  'superadmin.dashboard', 'superadmin.tenants', 'superadmin.tenants.suspend', 'superadmin.tenants.reactivate', 'superadmin.tenants.upgrade',
  'store.v3.products.index', 'store.v3.products.create', 'store.v3.products.store', 'store.v3.products.show', 'store.v3.products.edit', 'store.v3.products.update', 'store.v3.products.destroy',
  'store.v3.warehouses.index', 'store.v3.warehouses.create', 'store.v3.warehouses.store', 'store.v3.warehouses.show', 'store.v3.warehouses.edit', 'store.v3.warehouses.update', 'store.v3.warehouses.destroy',
  'store.v3.purchases.index', 'store.v3.purchases.create', 'store.v3.purchases.store', 'store.v3.purchases.show',
  'store.v3.purchases.return.create', 'store.v3.purchases.return.store',
  'store.v3.supplier-payments.store', 'store.v3.opening-balances.store', 'store.v3.opening-balances.status', 'store.v3.supplier-advances.store', 'store.v3.stock-adjustments.store', 'store.v3.stock-transfers.store', 'store.v3.suppliers.statement',
  'store.v3.parties.store', 'store.v3.parties.update', 'store.v3.parties.destroy', 'store.v3.sales.store', 'store.v3.sales.pdf', 'store.v3.sales.return.store', 'store.v3.customer-payments.store', 'store.v3.customer-payments.bounce', 'store.v3.sales.write-off', 'store.v3.customer-advances.store',
  'store.v3.sales-orders.store', 'store.v3.sales-orders.cancel', 'store.v3.sales-orders.convert', 'store.v3.quotations.store', 'store.v3.quotations.convert-to-order', 'store.v3.customers.statement',
  'store.v3.products.uom.index', 'store.v3.products.uom.store', 'store.v3.products.uom.destroy',
  'store.v3.products.tiers.index', 'store.v3.products.tiers.store', 'store.v3.products.tiers.destroy',
  'store.v3.boms.store', 'store.v3.boms.update', 'store.v3.boms.destroy', 'store.v3.production-runs.store', 'store.v3.production-runs.complete', 'store.v3.production-runs.reverse', 'store.v3.disassembly.store',
  'store.v3.employees.store', 'store.v3.employees.update', 'store.v3.payroll.accrue', 'store.v3.payroll.pay', 'store.v3.employee-settlements.store', 'store.v3.cash-shortages.store', 'store.v3.disaster-claims.store', 'store.v3.disaster-claims.recover',
  'store.v3.assets.store', 'store.v3.depreciation.store', 'store.v3.loans.drawdown', 'store.v3.loans.repay', 'store.v3.expenses.store', 'store.v3.funds.store', 'store.v3.bank-transfers.store', 'store.v3.donations.store', 'store.v3.users.role.update', 'store.v3.settings.discount-limits', 'store.v3.fiscal-year.close'
]);

const out = {
    A: [], B: [], C: [], D: [], E: []
};

const map = {};

frontendRoutes.forEach(r => {
    if (validNames.has(r)) {
        if (r.startsWith('platform.') || r.startsWith('superadmin.') || ['hub', 'login', 'logout', 'register', 'welcome'].includes(r)) {
            out.E.push(r);
        } else {
            out.A.push(r);
        }
    } else if (validNames.has('store.' + r)) {
        out.B.push(r);
        map[r] = 'store.' + r;
    } else if (r.startsWith('v3.') && validNames.has('store.' + r)) {
        out.C.push(r);
        map[r] = 'store.' + r;
    } else if (r.includes('.') && validNames.has('store.' + r)) {
         // Catch-all for other missed store prefixes
         out.B.push(r);
         map[r] = 'store.' + r;
    } else {
        out.D.push(r);
    }
});

fs.writeFileSync('route_audit.json', JSON.stringify({ counts: { A: out.A.length, B: out.B.length, C: out.C.length, D: out.D.length, E: out.E.length }, samples: out }, null, 2));

let sedScript = '#!/bin/bash\ncd resources/js\n';
for (const [oldName, newName] of Object.entries(map)) {
    // Escape dots for sed
    const escapedOld = oldName.replace(/\./g, '\\.');
    // Match route('OLD_NAME') and route("OLD_NAME")
    sedScript += `grep -rl "route(['\\"]${escapedOld}['\\"]" . | xargs sed -i "s/route(['\\"]${escapedOld}['\\"]/route('${newName}'/g"\n`;
}
fs.writeFileSync('fix_routes.sh', sedScript);

console.log('Audit complete. Counts:', { A: out.A.length, B: out.B.length, C: out.C.length, D: out.D.length, E: out.E.length });
