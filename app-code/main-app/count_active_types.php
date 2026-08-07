<?php
$rows = DB::select("SELECT reference_type, COUNT(*) as cnt FROM journal_entries WHERE is_reversed = 0 GROUP BY reference_type");
foreach($rows as $r) {
    echo $r->reference_type . ': ' . $r->cnt . PHP_EOL;
}
