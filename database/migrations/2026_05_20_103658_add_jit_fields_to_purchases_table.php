<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            // ── VenSynQ: JIT Purchase Tracking ────────────────────────────────
            $table->boolean('is_jit')->default(false)->after('payment_status');
            $table->uuid('jit_sale_id')->nullable()->after('is_jit');               // Links back to originating Sale
            $table->string('jit_sku')->nullable()->after('jit_sale_id');            // Which specific SKU this covers
            $table->integer('jit_quantity')->nullable()->after('jit_sku');          // Exact shortfall qty (not full order qty)

            // ── VenSynQ: Approval Workflow ─────────────────────────────────────
            // draft    = auto-created, awaiting client to confirm actual supplier cost
            // approved = client has confirmed the real cost, COGS is now locked in
            $table->enum('approval_status', ['draft', 'approved'])->default('draft')->after('jit_quantity');

            // ── VenSynQ: Fee Audit Trail ───────────────────────────────────────
            // Tracks whether the channel fee on the linked sale was an estimate or exact API value
            $table->boolean('fee_estimate_used')->default(false)->after('approval_status');
        });
    }

    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn([
                'is_jit',
                'jit_sale_id',
                'jit_sku',
                'jit_quantity',
                'approval_status',
                'fee_estimate_used',
            ]);
        });
    }
};
