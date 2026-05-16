<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('expenses', 'is_landed_cost')) {
            Schema::table('expenses', function (Blueprint $table) {
                $table->boolean('is_landed_cost')->default(false)->after('amount');
                $table->char('purchase_id', 36)->nullable()->after('is_landed_cost');
                $table->string('allocation_method')->nullable()->after('purchase_id'); // value, quantity, manual

                $table->foreign('purchase_id')->references('id')->on('invoices')->nullOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            //
        });
    }
};
