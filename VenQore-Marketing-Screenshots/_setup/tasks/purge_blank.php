<?php
header('Content-Type: text/plain');
Schema::disableForeignKeyConstraints();
foreach (['purchase_order_items','purchase_orders','stock_transfer_items','stock_transfers','stock_take_items','stock_takes','production_runs','product_batches','cheque_leaves','cheque_books'] as $t) { DB::table($t)->delete(); echo "cleared $t\n"; }
foreach (['customers','suppliers'] as $t) { echo "$t blank-id removed: ".DB::table($t)->where('id','')->delete()."\n"; }
Schema::enableForeignKeyConstraints();
