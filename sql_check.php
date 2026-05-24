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
            return $results;
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
        return $results;
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        return [];
    }
}

// Check 1
$sql1 = "
SELECT id, code, name, type, tenant_id 
FROM accounts 
WHERE tenant_id IS NULL;
";
runQueryAndPrint("Orphaned Accounts", $sql1);


// Check 2
$sql2 = "
SELECT COUNT(*) as count FROM journal_items ji
JOIN accounts a ON a.id = ji.account_id  
WHERE a.tenant_id IS NULL;
";
$countResult = runQueryAndPrint("Journal Items linking to Orphaned Accounts", $sql2);

$count = $countResult[0]->count ?? 0;

if ($count == 0) {
    echo "\nJournal items count is 0. Deleting orphaned accounts...\n";
    $deleted = DB::delete("DELETE FROM accounts WHERE tenant_id IS NULL;");
    echo "Deleted $deleted records.\n";
} else {
    echo "\nJournal items count is NOT 0. Deferring deletion.\n";
}
