import re

file_path = 'app/Http/Controllers/ExpenseController.php'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """        // Get bank accounts and cash balance
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
        }"""

content = content.replace(
    "        // Get bank accounts for payment options\n        $bankAccounts = BankAccount::orderBy('name')->get();",
    replacement
)

# And add cashBalance to inertia render
inertia_replace = """        return Inertia::render('Expenses/ExpensesList', [
            'expenses' => $expenses,
            'categories' => $categories,
            'stats' => $stats,
            'bankAccounts' => $bankAccounts,
            'cashBalance' => $cashBalance,
            'filters' => $request->only(['search', 'filter', 'from_date', 'to_date'])
        ]);"""

# The file currently has:
content = re.sub(
    r"return Inertia::render\('Expenses/ExpensesList', \[\s*'expenses' => \$expenses,\s*'categories' => \$categories,\s*'stats' => \$stats,\s*'bankAccounts' => \$bankAccounts,\s*'filters' => \$request->only\(\['search', 'filter', 'from_date', 'to_date'\]\)\s*\]\);",
    inertia_replace,
    content,
    flags=re.MULTILINE
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('ExpenseController updated')
