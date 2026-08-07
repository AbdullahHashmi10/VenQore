<?php

$tables = ['products', 'sales', 'sale_items', 'purchases', 'purchase_items', 'parties', 'accounts', 'journal_entries', 'journal_items', 'categories', 'warehouses', 'stocks', 'stock_movements', 'expenses', 'invoices', 'invoice_items', 'batches', 'serials'];

$dirs = ['app/Http/Controllers', 'app/Services', 'app/Console/Commands', 'app/Jobs'];

$issues = [];

function checkFile($path) {
    global $tables, $issues;
    $content = file_get_contents($path);
    
    // a) DB::table
    preg_match_all("/DB::table\(\s*['\"]([a-zA-Z_]+)(?:\s+as\s+[a-zA-Z_]+)?['\"]\s*\)/", $content, $matches, PREG_OFFSET_CAPTURE);
    if (!empty($matches[0])) {
        foreach ($matches[0] as $idx => $match) {
            $table = $matches[1][$idx][0];
            if (in_array($table, $tables)) {
                $endPos = $match[1] + strlen($match[0]);
                $context = substr($content, $endPos, 150);
                if (strpos($context, 'tenant_id') === false) {
                    $issues[] = "$path: DB::table('$table') missing tenant_id filter";
                }
            }
        }
    }
    
    // b) Model::all()
    preg_match_all("/([A-Z][a-zA-Z]+)::all\(\)/", $content, $matches);
    if (!empty($matches[0])) {
        foreach ($matches[1] as $model) {
            $issues[] = "$path: Model::all() on $model (check HasTenant)";
        }
    }
    
    // c) Jobs without current.tenant
    if (strpos($path, 'app/Jobs') !== false || strpos($path, 'app\Jobs') !== false) {
        if (strpos($content, "app()->instance('current.tenant'") === false && strpos($content, "app('current.tenant')") === false) {
            $issues[] = "$path: Background job might not set tenant";
        }
    }
}

foreach ($dirs as $dir) {
    if (!is_dir($dir)) continue;
    $ritit = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir), RecursiveIteratorIterator::CHILD_FIRST);
    foreach ($ritit as $splFileInfo) {
        if ($splFileInfo->isFile() && $splFileInfo->getExtension() === 'php') {
            checkFile($splFileInfo->getPathname());
        }
    }
}

echo implode("\n", $issues);
