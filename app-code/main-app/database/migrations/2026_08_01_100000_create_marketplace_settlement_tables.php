<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * T17 — Marketplace Settlement / Clearing Pipeline.
 *
 * Money from an online sale is NOT cash. Amazon holds it ~14 days, Stripe ~2.
 * Posting it straight to 1000 Cash on Hand tells the owner they can spend funds
 * the platform is still sitting on, and makes bank reconciliation impossible.
 *
 * This migration adds the three things the pipeline needs:
 *   1. Per-channel settlement terms (delay, reserve, sweep preference).
 *   2. A marketplace_payouts ledger tracking expected vs actual settlement.
 *   3. A per-tenant CUTOVER timestamp — clearing applies only to orders created
 *      after it, so closed periods and filed reports are never rewritten.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Per-channel settlement terms ───────────────────────────────────
        Schema::table('ecommerce_channels', function (Blueprint $table) {
            if (!Schema::hasColumn('ecommerce_channels', 'settlement_days')) {
                $table->unsignedSmallInteger('settlement_days')
                    ->default(0)
                    ->after('fee_source')
                    ->comment('Days the platform holds funds before payout. 0 = settles immediately.');
            }

            if (!Schema::hasColumn('ecommerce_channels', 'reserve_percentage')) {
                // PayPal/Amazon sometimes withhold a rolling chargeback reserve.
                // Without modelling it the owner cannot understand why a payout
                // came in short.
                $table->decimal('reserve_percentage', 5, 2)
                    ->default(0)
                    ->after('settlement_days');
            }

            if (!Schema::hasColumn('ecommerce_channels', 'auto_sweep')) {
                // Deliberately defaults to FALSE. Auto-posting bank deposits that
                // may not have landed is worse than ghost cash — it silently
                // breaks bank reconciliation. Owner confirms payouts by default.
                $table->boolean('auto_sweep')
                    ->default(false)
                    ->after('reserve_percentage');
            }

            if (!Schema::hasColumn('ecommerce_channels', 'settlement_bank_account_id')) {
                $table->string('settlement_bank_account_id')
                    ->nullable()
                    ->after('auto_sweep')
                    ->comment('Where confirmed payouts land. Null = default bank account.');
            }
        });

        // ── 2. Payout ledger ──────────────────────────────────────────────────
        Schema::create('marketplace_payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedBigInteger('tenant_id')->index();
            $table->unsignedBigInteger('ecommerce_channel_id');

            // What we PREDICTED from the orders in this batch.
            $table->decimal('expected_gross', 15, 2)->default(0);
            $table->decimal('expected_fees', 15, 2)->default(0);
            $table->decimal('expected_reserve', 15, 2)->default(0);
            $table->decimal('expected_net', 15, 2)->default(0);

            // What the platform ACTUALLY deposited. Null until confirmed.
            $table->decimal('actual_net', 15, 2)->nullable();

            // actual_net - expected_net. Negative = platform took more than we
            // estimated (extra storage/ad fees). Posted to 5410 at confirmation.
            $table->decimal('variance', 15, 2)->nullable();

            $table->string('currency', 3)->default('GBP');
            $table->string('external_payout_id')->nullable()->comment('Platform settlement id, when the API exposes one.');

            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->timestamp('expected_at')->nullable()->comment('Projected arrival — drives the Cash Arrival view.');
            $table->timestamp('confirmed_at')->nullable();

            // pending   — accruing, settlement window still open
            // due       — window elapsed, awaiting owner confirmation
            // confirmed — owner confirmed receipt; Dr Bank / Cr Clearing posted
            // cancelled — reversed or written off
            $table->enum('status', ['pending', 'due', 'confirmed', 'cancelled'])->default('pending');

            $table->uuid('journal_entry_id')->nullable()->comment('The Dr Bank / Cr Clearing entry, once confirmed.');
            $table->unsignedBigInteger('confirmed_by')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->foreign('ecommerce_channel_id')->references('id')->on('ecommerce_channels')->cascadeOnDelete();
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'expected_at']);
            $table->index(['ecommerce_channel_id', 'status']);
        });

        // ── 3. Link each sale to the payout batch that will settle it ─────────
        Schema::table('sales', function (Blueprint $table) {
            if (!Schema::hasColumn('sales', 'marketplace_payout_id')) {
                $table->uuid('marketplace_payout_id')
                    ->nullable()
                    ->after('ecommerce_channel_id')
                    ->comment('T17 — the settlement batch this order belongs to.');
                $table->index('marketplace_payout_id');
            }

            if (!Schema::hasColumn('sales', 'cleared_at')) {
                $table->timestamp('cleared_at')
                    ->nullable()
                    ->after('marketplace_payout_id')
                    ->comment('When the funds actually reached the bank.');
            }
        });

        // ── 4. Per-tenant cutover ─────────────────────────────────────────────
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'clearing_go_live_at')) {
                $table->timestamp('clearing_go_live_at')
                    ->nullable()
                    ->comment('T17 — orders created BEFORE this keep legacy Dr Cash posting. Null = clearing disabled.');
            }
        });

        // ── 5. Sensible settlement defaults for existing channels ─────────────
        // Real-world platform terms. The owner can override per channel; these
        // exist so the feature is useful the moment it is switched on.
        $defaults = [
            'amazon'      => 14,  // biweekly settlement
            'ebay'        => 2,   // eBay Managed Payments
            'tiktok'      => 7,
            'woocommerce' => 2,   // typical Stripe/PayPal rolling payout
        ];

        foreach ($defaults as $platform => $days) {
            DB::table('ecommerce_channels')
                ->where('platform', $platform)
                ->update(['settlement_days' => $days]);
        }
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            foreach (['marketplace_payout_id', 'cleared_at'] as $column) {
                if (Schema::hasColumn('sales', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::dropIfExists('marketplace_payouts');

        Schema::table('ecommerce_channels', function (Blueprint $table) {
            foreach (['settlement_days', 'reserve_percentage', 'auto_sweep', 'settlement_bank_account_id'] as $column) {
                if (Schema::hasColumn('ecommerce_channels', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        Schema::table('tenants', function (Blueprint $table) {
            if (Schema::hasColumn('tenants', 'clearing_go_live_at')) {
                $table->dropColumn('clearing_go_live_at');
            }
        });
    }
};
