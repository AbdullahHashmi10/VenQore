<?php
header('Content-Type: text/plain');
foreach (['expenses','expense_items','expense_categories'] as $t) { echo "$t: ".DB::table($t)->count()."\n"; }
foreach (DB::table('expenses')->orderByDesc('id')->limit(3)->get() as $r) echo json_encode($r)."\n";
echo "journal expense accts: ".DB::table('journal_entries')->count()."\n";
