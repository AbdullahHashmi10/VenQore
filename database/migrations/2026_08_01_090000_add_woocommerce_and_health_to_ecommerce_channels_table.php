<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * T16 — VenSynQ Integration & UX Engine.
 *
 * 1. Widens ecommerce_channels.platform to admit 'woocommerce', promoting Woo
 *    from a standalone module to a first-class VenSynQ channel.
 * 2. Adds the health/observability columns the Sync Status Dashboard needs:
 *    consecutive_failures, last_error_at, last_sync_duration_ms, auth_method.
 *
 * MySQL-only per CLAUDE.md — the enum change uses a raw MODIFY COLUMN because
 * Doctrine DBAL cannot alter native MySQL enums.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Widen the platform enum ────────────────────────────────────────
        DB::statement(
            "ALTER TABLE `ecommerce_channels`
             MODIFY COLUMN `platform`
             ENUM('amazon', 'tiktok', 'ebay', 'woocommerce') NOT NULL"
        );

        // ── 2. Health & observability columns ─────────────────────────────────
        Schema::table('ecommerce_channels', function (Blueprint $table) {
            if (!Schema::hasColumn('ecommerce_channels', 'consecutive_failures')) {
                $table->unsignedSmallInteger('consecutive_failures')
                    ->default(0)
                    ->after('sync_error_message')
                    ->comment('Reset to 0 on every successful sync; drives the red health badge at >= 3.');
            }

            if (!Schema::hasColumn('ecommerce_channels', 'last_error_at')) {
                $table->timestamp('last_error_at')
                    ->nullable()
                    ->after('consecutive_failures');
            }

            if (!Schema::hasColumn('ecommerce_channels', 'last_sync_duration_ms')) {
                $table->unsignedInteger('last_sync_duration_ms')
                    ->nullable()
                    ->after('last_error_at');
            }

            if (!Schema::hasColumn('ecommerce_channels', 'auth_method')) {
                // 'oauth'       — redirect consent flow (default, pre-existing behaviour)
                // 'credentials' — the T16 3-step manual SP-API wizard
                // 'plugin'      — WooCommerce key pair issued by the VenQore plugin
                $table->enum('auth_method', ['oauth', 'credentials', 'plugin'])
                    ->default('oauth')
                    ->after('is_connected');
            }
        });

        // Existing Woo rows (if any were hand-inserted) should report the plugin
        // auth method rather than pretending they came through an OAuth consent.
        DB::table('ecommerce_channels')
            ->where('platform', 'woocommerce')
            ->update(['auth_method' => 'plugin']);
    }

    public function down(): void
    {
        Schema::table('ecommerce_channels', function (Blueprint $table) {
            foreach (['consecutive_failures', 'last_error_at', 'last_sync_duration_ms', 'auth_method'] as $column) {
                if (Schema::hasColumn('ecommerce_channels', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        // Drop Woo channels before narrowing the enum, otherwise MySQL silently
        // coerces them to an empty string and corrupts the rows.
        DB::table('ecommerce_channels')->where('platform', 'woocommerce')->delete();

        DB::statement(
            "ALTER TABLE `ecommerce_channels`
             MODIFY COLUMN `platform`
             ENUM('amazon', 'tiktok', 'ebay') NOT NULL"
        );
    }
};
