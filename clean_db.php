<?php
use Illuminate\Support\Facades\DB;
DB::statement("DELETE FROM inventory_batches WHERE batch_type = 'opening' AND unit_cost <= 0;");
echo "DELETED zero-cost opening batches.";
