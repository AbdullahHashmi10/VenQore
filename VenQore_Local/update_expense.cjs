const fs = require('fs');

const filePath = 'app/Http/Controllers/ExpenseController.php';
let content = fs.readFileSync(filePath, 'utf8');

const replacement = `        // Get bank accounts and cash balance
        $allAccounts = BankAccount::orderBy('name')->get();
        $bankAccounts = collect();
        $cashBalance = 0;

        foreach ($allAccounts as $acc) {
            $acc->current_balance = $acc->v3Balance();
            if ($acc->account_type === 'cash' || $acc->type === 'cash' || strcasecmp(trim($acc->name), 'cash in hand') === 0 || strcasecmp(trim($acc->name), 'cash') === 0) {
                $cashBalance = $acc->current_balance;
            } else {
                $bankAccounts->push($acc);
            }
        }`;

content = content.replace(
    "        // Get bank accounts for payment options\n        $bankAccounts = BankAccount::orderBy('name')->get();",
    replacement
);

// Add cashBalance to inertia render
const inertiaReplace = `        return Inertia::render('Expenses/ExpensesList', [
            'expenses' => $expenses,
            'categories' => $categories,
            'stats' => $stats,
            'bankAccounts' => $bankAccounts,
            'cashBalance' => $cashBalance,
            'filters' => $request->only(['search', 'filter', 'from_date', 'to_date'])
        ]);`;

content = content.replace(
    /return Inertia::render\('Expenses\/ExpensesList', \[\s*'expenses' => \$expenses,\s*'categories' => \$categories,\s*'stats' => \$stats,\s*'bankAccounts' => \$bankAccounts,\s*'filters' => \$request->only\(\['search', 'filter', 'from_date', 'to_date'\]\)\s*\]\);/g,
    inertiaReplace
);

fs.writeFileSync(filePath, content);
console.log('ExpenseController updated');
