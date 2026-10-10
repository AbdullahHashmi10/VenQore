<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /** Sales created by completing an online order carry source = 'online'. */
    public function up(): void
    {
        DB::table('sales')
            ->whereIn('id', DB::table('commerce_orders')->whereNotNull('sale_id')->select('sale_id'))
            ->where('source', '!=', 'online')
            ->update(['source' => 'online']);
    }

    public function down(): void
    {
        DB::table('sales')
            ->whereIn('id', DB::table('commerce_orders')->whereNotNull('sale_id')->select('sale_id'))
            ->where('source', 'online')
            ->update(['source' => 'manual']);
    }
};
