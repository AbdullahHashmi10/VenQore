<?php
$dir = new RecursiveDirectoryIterator('d:/AMD POS/app');
$ite = new RecursiveIteratorIterator($dir);
$files = new RegexIterator($ite, '/^.+\.php$/i', RecursiveRegexIterator::GET_MATCH);
$results = [];

$modelsWithTenant = ['Product', 'Sale', 'SaleItem', 'Purchase', 'PurchaseItem', 'Party', 'Account', 'JournalEntry', 'JournalItem', 'Category', 'Warehouse', 'Stock', 'StockMovement', 'Expense', 'Invoice', 'InvoiceItem', 'Batch', 'Serial'];

foreach($files as $file) {
    if (str_contains($file[0], 'vendor')) continue;
    $content = file_get_contents($file[0]);
    $lines = explode(PHP_EOL, $content);
    
    foreach($lines as $i => $line) {
        $lineNum = $i + 1;
        $fileShort = str_replace('d:/AMD POS/', '', str_replace('\\', '/', $file[0]));
        
        // 1. DB::table
        if (preg_match('/DB::table\(\s*[\'"]([^\'"]+)[\'"]\s*\)/', $line, $matches) || preg_match('/DB::table\(\$([a-zA-Z0-9]+)\)/', $line, $matchesDyn)) {
            $table = isset($matches[1]) ? $matches[1] : 'dynamic';
            
            // Look ahead 15 lines and look behind 5 lines for tenant_id filtering
            $contextWindow = implode('', array_slice($lines, max(0, $i - 5), 20));
            $hasTenant = preg_match('/where\([\'"][a-zA-Z0-9_.]*tenant_id[\'"]/', $contextWindow);
            
            $isSafeTable = in_array(explode(' as', $table)[0], ['users', 'tenants', 'migrations', 'personal_access_tokens', 'system_settings', 'failed_jobs', 'jobs', 'sessions', 'product_uom_conversions']);
            
            $class = $hasTenant || $isSafeTable ? 'SAFE' : 'LEAK';
            if ($table === 'dynamic') $class = 'REVIEW';
            
            $results[] = [$fileShort, $lineNum, trim($line), explode(' as', $table)[0], $hasTenant ? 'YES' : 'NO', $class, 'A'];
        }
        
        // 2. DB::select
        if (preg_match('/DB::select\((.*)\)/', $line, $matches)) {
            $hasTenant = str_contains(strtolower($matches[1]), 'tenant_id') || str_contains($line, 'tenant_id');
            $class = $hasTenant || str_contains(strtolower($matches[1]), 'information_schema') || str_contains(strtolower($matches[1]), 'show tables') ? 'SAFE' : 'LEAK';
            $results[] = [$fileShort, $lineNum, trim($line), 'raw sql', $hasTenant ? 'YES' : 'NO', $class, 'A'];
        }
        
        // 3. ::all()
        if (preg_match('/([a-zA-Z0-9_]+)::all\(\)/', $line, $matches)) {
            $model = $matches[1];
            if (in_array($model, $modelsWithTenant)) {
                $results[] = [$fileShort, $lineNum, trim($line), $model, 'NO', 'LEAK', 'B'];
            }
        }
        
        // 4. withoutGlobalScope
        if (preg_match('/withoutGlobalScope/', $line)) {
            if (!str_contains($fileShort, 'Admin') && !str_contains($fileShort, 'SuperAdmin') && str_contains($fileShort, 'Controllers') && !str_contains($fileShort, 'InventoryController')) {
                $results[] = [$fileShort, $lineNum, trim($line), 'Model', 'NO', 'LEAK', 'B'];
            }
        }

        // 5. Raw SQL containing missing tenant_id in join 
        // Example: joinRaw('...') but let's just flag it for review
        if (preg_match('/(?:where|having|select|join)Raw\(/', $line)) {
            // Already mostly checking DB::table, but let's just mark if it joins a tenant table without tenant_id
            if (preg_match('/JOIN\s+([a-z_]s)\s+/i', $line, $m)) {
                if (!str_contains($line, 'tenant_id')) {
                    $results[] = [$fileShort, $lineNum, trim($line), 'raw sql', 'NO', 'REVIEW', 'A'];
                }
            }
        }
    }
}

$leaks = array_filter($results, fn($r) => $r[5] === 'LEAK');
$safes = array_filter($results, fn($r) => $r[5] === 'SAFE');
$reviews = array_filter($results, fn($r) => $r[5] === 'REVIEW');

$out = "| File | Line | Query | Table Queried | Has tenant_id? | Classification |\n|---|---|---|---|---|---|\n";
foreach ($results as $r) {
    if ($r[5] === 'LEAK' || $r[5] === 'REVIEW') {
        $out .= "| {$r[0]} | {$r[1]} | " . substr($r[2], 0, 80) . " | {$r[3]} | {$r[4]} | {$r[5]} |\n";
    }
}

echo $out . "\n\nTotal LEAK count: " . count($leaks) . "\nTotal SAFE count: " . count($safes) . "\nTotal REVIEW count: " . count($reviews) . "\n\n";

echo "Exact fixes needed for leaks:\n";
foreach($leaks as $l) {
    echo "- {$l[0]}:{$l[1]} -> [Fix {$l[6]}]\n";
}
