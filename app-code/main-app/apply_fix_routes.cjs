const fs = require('fs');
const path = require('path');

const map = {
  "accounting.balance-sheet": "store.accounting.balance-sheet",
  "accounting.index": "store.accounting.index",
  "accounting.pnl": "store.accounting.pnl",
  "activity-log.index": "store.activity-log.index",
  "admin.dashboard": "store.admin.dashboard",
  "admin.data": "store.admin.data",
  "admin.settings": "store.admin.settings",
  "admin.users": "store.admin.users",
  "ai.query": "store.ai.query",
  "ai.test": "store.ai.test",
  "attendance.check-in": "store.attendance.check-in",
  "attendance.heartbeat": "store.attendance.heartbeat",
  "attendance.log-gap": "store.attendance.log-gap",
  "bank-accounts.destroy": "store.bank-accounts.destroy",
  "bank-accounts.index": "store.bank-accounts.index",
  "bank-accounts.store": "store.bank-accounts.store",
  "bank-accounts.transactions": "store.bank-accounts.transactions",
  "bank-accounts.update": "store.bank-accounts.update",
  "batches.index": "store.batches.index",
  "charity.add": "store.charity.add",
  "charity.stats": "store.charity.stats",
  "charity.update-default": "store.charity.update-default",
  "cookbook.create": "store.cookbook.create",
  "cookbook.destroy": "store.cookbook.destroy",
  "cookbook.edit": "store.cookbook.edit",
  "cookbook.index": "store.cookbook.index",
  "cookbook.simulate": "store.cookbook.simulate",
  "cookbook.store": "store.cookbook.store",
  "cookbook.update": "store.cookbook.update",
  "debit-notes.create": "store.debit-notes.create",
  "debit-notes.index": "store.debit-notes.index",
  "debit-notes.show": "store.debit-notes.show",
  "debit-notes.store": "store.debit-notes.store",
  "expenses.destroy": "store.expenses.destroy",
  "expenses.index": "store.expenses.index",
  "expenses.store": "store.expenses.store",
  "expenses.update": "store.expenses.update",
  "funds.index": "store.funds.index",
  "growth-engine.index": "store.growth-engine.index",
  "home": "store.home",
  "import.template": "store.import.template",
  "invoice-reminders.create": "store.invoice-reminders.create",
  "invoice-reminders.index": "store.invoice-reminders.index",
  "invoice-reminders.send": "store.invoice-reminders.send",
  "labels.index": "store.labels.index",
  "labels.print": "store.labels.print",
  "notifications.destroy": "store.notifications.destroy",
  "notifications.index": "store.notifications.index",
  "notifications.mark-all-read": "store.notifications.mark-all-read",
  "notifications.mark-read": "store.notifications.mark-read",
  "payments.in": "store.payments.in",
  "payments.index": "store.payments.index",
  "payments.out": "store.payments.out",
  "payments.store": "store.payments.store",
  "profile.destroy": "store.profile.destroy",
  "profile.edit": "store.profile.edit",
  "profile.passcode": "store.profile.passcode",
  "profile.update": "store.profile.update",
  "purchase-orders.create": "store.purchase-orders.create",
  "purchase-orders.edit": "store.purchase-orders.edit",
  "purchase-orders.index": "store.purchase-orders.index",
  "purchase-orders.print": "store.purchase-orders.print",
  "purchase-orders.receive": "store.purchase-orders.receive",
  "purchase-orders.show": "store.purchase-orders.show",
  "purchase-orders.store": "store.purchase-orders.store",
  "purchase-orders.update": "store.purchase-orders.update",
  "recurring-invoices.create": "store.recurring-invoices.create",
  "recurring-invoices.destroy": "store.recurring-invoices.destroy",
  "recurring-invoices.edit": "store.recurring-invoices.edit",
  "recurring-invoices.toggle": "store.recurring-invoices.toggle",
  "returns-history.index": "store.returns-history.index",
  "returns.create": "store.returns.create",
  "returns.store": "store.returns.store",
  "serials.index": "store.serials.index",
  "settings.update": "store.settings.update",
  "staff-attendance.approve-gap": "store.staff-attendance.approve-gap",
  "staff-attendance.index": "store.staff-attendance.index",
  "staff-attendance.reject-gap": "store.staff-attendance.reject-gap",
  "staff-attendance.show": "store.staff-attendance.show",
  "stock-operations.adjust": "store.stock-operations.adjust",
  "stock-operations.audit": "store.stock-operations.audit",
  "stock-operations.transfer": "store.stock-operations.transfer",
  "stock-operations.warehouse.store": "store.stock-operations.warehouse.store",
  "stock-operations.warehouse.update": "store.stock-operations.warehouse.update",
  "stock-takes.create": "store.stock-takes.create",
  "stock-takes.index": "store.stock-takes.index",
  "stock-takes.show": "store.stock-takes.show",
  "stock-takes.store": "store.stock-takes.store",
  "stock-transfers.create": "store.stock-transfers.create",
  "stock-transfers.index": "store.stock-transfers.index",
  "stock-transfers.show": "store.stock-transfers.show",
  "stock-transfers.store": "store.stock-transfers.store",
  "suppliers.destroy": "store.suppliers.destroy",
  "suppliers.index": "store.suppliers.index",
  "suppliers.store": "store.suppliers.store",
  "suppliers.update": "store.suppliers.update",
  "v3.products.edit": "store.v3.products.edit",
  "v3.products.tiers.destroy": "store.v3.products.tiers.destroy",
  "v3.products.tiers.store": "store.v3.products.tiers.store",
  "v3.products.uom.destroy": "store.v3.products.uom.destroy",
  "v3.products.uom.store": "store.v3.products.uom.store",
  "v3.purchases.create": "store.v3.purchases.create",
  "v3.purchases.index": "store.v3.purchases.index",
  "v3.purchases.return.create": "store.v3.purchases.return.create",
  "v3.purchases.return.store": "store.v3.purchases.return.store",
  "v3.purchases.show": "store.v3.purchases.show",
  "v3.purchases.store": "store.v3.purchases.store"
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
                const regex = new RegExp(`route\\(['"]${oldName.replace(/\./g, '\\.')}['"]`, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, `route('${newName}'`);
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed:', fullPath);
            }
        }
    }
}

walk('resources/js');
console.log('Done fixing routes.');
