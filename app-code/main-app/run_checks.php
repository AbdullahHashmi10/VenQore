<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

function runQueryAndPrint($title, $sql) {
    echo "\n=== $title ===\n";
    try {
        $results = DB::select($sql);
        if (empty($results)) {
            echo "0 rows returned.\n";
            return;
        }
        $headers = array_keys(get_object_vars((object)$results[0]));
        echo implode(" | ", $headers) . "\n";
        echo str_repeat("-", 50) . "\n";
        foreach ($results as $row) {
            $values = [];
            foreach ($headers as $header) {
                $values[] = $row->$header ?? 'NULL';
            }
            echo implode(" | ", $values) . "\n";
        }
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

// Check 1
$sql1 = "
SELECT 'sales' as tbl, COUNT(*) as count FROM sales WHERE tenant_id IS NULL
UNION SELECT 'journal_entries', COUNT(*) FROM journal_entries WHERE tenant_id IS NULL
UNION SELECT 'journal_items', COUNT(*) FROM journal_items WHERE tenant_id IS NULL
UNION SELECT 'parties', COUNT(*) FROM parties WHERE tenant_id IS NULL
UNION SELECT 'accounts', COUNT(*) FROM accounts WHERE tenant_id IS NULL
UNION SELECT 'inventory_batches', COUNT(*) FROM inventory_batches WHERE tenant_id IS NULL
UNION SELECT 'payments', COUNT(*) FROM payments WHERE tenant_id IS NULL;
";
runQueryAndPrint("Check 1: Orphaned records (must all return 0)", $sql1);


// Check 2
$sql2 = "
SELECT je.id, je.tenant_id,
SUM(CASE WHEN ji.debit > 0 THEN ji.debit ELSE 0 END) as debits,
SUM(CASE WHEN ji.credit > 0 THEN ji.credit ELSE 0 END) as credits,
ABS(SUM(CASE WHEN ji.debit > 0 THEN ji.debit ELSE 0 END) - 
SUM(CASE WHEN ji.credit > 0 THEN ji.credit ELSE 0 END)) as diff
FROM journal_entries je
JOIN journal_items ji ON ji.journal_entry_id = je.id
GROUP BY je.id, je.tenant_id
HAVING diff > 0.01
LIMIT 20;
";
runQueryAndPrint("Check 2: Unbalanced journal entries (must return 0 rows)", $sql2);


// Check 3
$sql3 = "
SELECT je.id, je.tenant_id as entry_tenant, 
ji.tenant_id as item_tenant
FROM journal_entries je
JOIN journal_items ji ON ji.journal_entry_id = je.id
WHERE je.tenant_id != ji.tenant_id
LIMIT 10;
";
runQueryAndPrint("Check 3: Cross-tenant data leak (must return 0 rows)", $sql3);

// Check 4
$sql4 = "
SELECT COUNT(*) as items_with_party, 
COUNT(party_id) as items_with_party_id_filled
FROM journal_items
WHERE created_at >= NOW() - INTERVAL 1 DAY;
";
runQueryAndPrint("Check 4: party_id now saving correctly", $sql4);

// Check 5
$sql5 = "
SELECT tenant_id, code, name, type 
FROM accounts 
WHERE code IN ('1100', '1010', '1200')
ORDER BY tenant_id, code;
";
runQueryAndPrint("Check 5: COA code 1100 correct everywhere", $sql5);
