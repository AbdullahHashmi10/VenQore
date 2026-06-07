<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->boolean('is_jit')->default(false)->after('status');
            $table->unsignedBigInteger('jit_sale_id')->nullable()->after('is_jit');
            $table->string('channel_order_id')->nullable()->after('jit_sale_id');
            $table->enum('approval_status', ['draft', 'approved'])->nullable()->after('channel_order_id');
        });
    }

    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn(['is_jit', 'jit_sale_id', 'channel_order_id', 'approval_status']);
        });
    }
};
