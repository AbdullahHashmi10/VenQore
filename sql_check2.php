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
        
        $firstRow = (array)$results[0];
        // Special formatting if it just returns COUNT(*) which PDO might map to 'COUNT(*)' or similar
        $headers = array_keys($firstRow);
        
        echo implode(" | ", $headers) . "\n";
        echo str_repeat("-", 50) . "\n";
        
        foreach ($results as $row) {
            $rowArr = (array)$row;
            $values = [];
            foreach ($headers as $header) {
                $values[] = $rowArr[$header] ?? 'NULL';
            }
            echo implode(" | ", $values) . "\n";
        }
        return $results;
    } catch (\Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
        return [];
    }
}

// 1. Confirm Customer model is now tenant scoped
$sql1 = "SELECT COUNT(*) as null_tenant_count FROM customers WHERE tenant_id IS NULL;";
runQueryAndPrint("Customers with NULL tenant_id", $sql1);

// 2. Confirm no cross-tenant customer phone matching possible
$sql2 = "
SELECT phone, COUNT(DISTINCT tenant_id) as tenant_count
FROM customers  
GROUP BY phone
HAVING tenant_count > 1;
";
runQueryAndPrint("Cross-tenant customer phone matching", $sql2);

// 3. Confirm orphaned accounts deleted
$sql3 = "SELECT COUNT(*) as orphaned_accounts_count FROM accounts WHERE tenant_id IS NULL;";
runQueryAndPrint("Orphaned Accounts", $sql3);

// 4. Confirm party_id link exists on customers
$sql4 = "SHOW COLUMNS FROM customers;";
runQueryAndPrint("Columns in 'customers' table", $sql4);

