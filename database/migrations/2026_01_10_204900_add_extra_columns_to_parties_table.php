<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->string('email')->nullable()->after('phone');
            $table->text('address')->nullable()->after('payment_terms');
            $table->text('notes')->nullable()->after('address');
            $table->enum('opening_balance_type', ['receivable', 'payable'])->default('receivable')->after('opening_balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parties', function (Blueprint $table) {
            $table->dropColumn(['email', 'address', 'notes', 'opening_balance_type']);
        });
    }
};


