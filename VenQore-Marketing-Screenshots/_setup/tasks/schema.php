<?php
header('Content-Type: text/plain');
$pat = $_GET['p'] ?? 'purchase_order|transfer|stock_take|production|batch|cheque|offer|online_order|store_order|returns|customer';
foreach (DB::select('SHOW TABLES') as $r) { $t = array_values((array)$r)[0]; if (!preg_match("/$pat/", $t)) continue;
  $cols = array_map(fn($c)=>$c->Field.($c->Null==='NO' && $c->Default===null && stripos($c->Extra,'auto')===false?'*':''), DB::select("SHOW COLUMNS FROM `$t`"));
  echo "$t (".DB::table($t)->count()."): ".implode(',',$cols)."\n"; }
