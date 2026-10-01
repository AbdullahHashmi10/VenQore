<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A quotation had a valid-until date and no date of its own, so the screen's
 * date box wrote to nothing and re-opening a quotation showed the row's
 * creation timestamp instead of the day it was actually quoted.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            if (! Schema::hasColumn('proposals', 'date')) {
                $table->date('date')->nullable()->after('customer_name');
            }
        });

        \Illuminate\Support\Facades\DB::table('proposals')
            ->whereNull('date')
            ->update(['date' => \Illuminate\Support\Facades\DB::raw('DATE(created_at)')]);
    }

    public function down(): void
    {
        Schema::table('proposals', function (Blueprint $table) {
            if (Schema::hasColumn('proposals', 'date')) $table->dropColumn('date');
        });
    }
};
