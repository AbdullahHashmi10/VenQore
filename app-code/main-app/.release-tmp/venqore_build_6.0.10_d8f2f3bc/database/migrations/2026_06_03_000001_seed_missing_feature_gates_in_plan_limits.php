<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Seed missing feature gate rows into plan_limits.
 *
 * These features were added to BillingController but never had corresponding
 * plan_limits rows, so PlanGate::check() was returning true (unlimited) for
 * all plans — meaning they never showed as "Locked" on the Billing page.
 *
 * Feature gate values:
 *   '0' = disabled / locked for this plan
 *   '1' = enabled / unlocked for this plan
 */
return new class extends Migration
{
    public function up(): void
    {
        $planId = fn(string $slug) => DB::table('plans')->where('slug', $slug)->value('id');

        // [plan_slug, feature_key, value]
        $gates = [
            // ── TRIAL ──────────────────────────────────────────────────────
            ['trial',    'chat_support',             '0'],
            ['trial',    'recurring_invoicing',      '0'],
            ['trial',    'bill_of_materials',         '0'],
            ['trial',    'fixed_asset_depreciation', '0'],
            ['trial',    'fiscal_year_closing',      '0'],
            ['trial',    'imei_scanner',             '0'],
            ['trial',    'whatsapp_reminders',        '0'],
            ['trial',    'loyalty_points',            '0'],
            ['trial',    'wholesale_pricing',         '0'],
            ['trial',    'dedicated_account_manager','0'],

            // ── STARTER ────────────────────────────────────────────────────
            ['starter',  'chat_support',             '0'],
            ['starter',  'recurring_invoicing',      '0'],
            ['starter',  'bill_of_materials',         '0'],
            ['starter',  'fixed_asset_depreciation', '0'],
            ['starter',  'fiscal_year_closing',      '0'],
            ['starter',  'imei_scanner',             '0'],
            ['starter',  'whatsapp_reminders',        '0'],
            ['starter',  'loyalty_points',            '0'],
            ['starter',  'wholesale_pricing',         '0'],
            ['starter',  'dedicated_account_manager','0'],

            // ── GROWTH ─────────────────────────────────────────────────────
            ['growth',   'chat_support',             '1'],
            ['growth',   'recurring_invoicing',      '1'],
            ['growth',   'bill_of_materials',         '0'],
            ['growth',   'fixed_asset_depreciation', '0'],
            ['growth',   'fiscal_year_closing',      '0'],
            ['growth',   'imei_scanner',             '0'],
            ['growth',   'whatsapp_reminders',        '1'],
            ['growth',   'loyalty_points',            '0'],
            ['growth',   'wholesale_pricing',         '0'],
            ['growth',   'dedicated_account_manager','0'],

            // ── BUSINESS ───────────────────────────────────────────────────
            ['business', 'chat_support',             '1'],
            ['business', 'recurring_invoicing',      '1'],
            ['business', 'bill_of_materials',         '1'],
            ['business', 'fixed_asset_depreciation', '1'],
            ['business', 'fiscal_year_closing',      '1'],
            ['business', 'imei_scanner',             '1'],
            ['business', 'whatsapp_reminders',        '1'],
            ['business', 'loyalty_points',            '1'],
            ['business', 'wholesale_pricing',         '1'],
            ['business', 'dedicated_account_manager','1'],

            // ── LTD_1 ──────────────────────────────────────────────────────
            ['ltd_1',    'chat_support',             '0'],
            ['ltd_1',    'recurring_invoicing',      '0'],
            ['ltd_1',    'bill_of_materials',         '0'],
            ['ltd_1',    'fixed_asset_depreciation', '0'],
            ['ltd_1',    'fiscal_year_closing',      '0'],
            ['ltd_1',    'imei_scanner',             '0'],
            ['ltd_1',    'whatsapp_reminders',        '0'],
            ['ltd_1',    'loyalty_points',            '0'],
            ['ltd_1',    'wholesale_pricing',         '0'],
            ['ltd_1',    'dedicated_account_manager','0'],

            // ── LTD_2 ──────────────────────────────────────────────────────
            ['ltd_2',    'chat_support',             '1'],
            ['ltd_2',    'recurring_invoicing',      '1'],
            ['ltd_2',    'bill_of_materials',         '0'],
            ['ltd_2',    'fixed_asset_depreciation', '0'],
            ['ltd_2',    'fiscal_year_closing',      '0'],
            ['ltd_2',    'imei_scanner',             '0'],
            ['ltd_2',    'whatsapp_reminders',        '1'],
            ['ltd_2',    'loyalty_points',            '0'],
            ['ltd_2',    'wholesale_pricing',         '0'],
            ['ltd_2',    'dedicated_account_manager','0'],

            // ── LTD_3 ──────────────────────────────────────────────────────
            ['ltd_3',    'chat_support',             '1'],
            ['ltd_3',    'recurring_invoicing',      '1'],
            ['ltd_3',    'bill_of_materials',         '1'],
            ['ltd_3',    'fixed_asset_depreciation', '1'],
            ['ltd_3',    'fiscal_year_closing',      '1'],
            ['ltd_3',    'imei_scanner',             '1'],
            ['ltd_3',    'whatsapp_reminders',        '1'],
            ['ltd_3',    'loyalty_points',            '1'],
            ['ltd_3',    'wholesale_pricing',         '1'],
            ['ltd_3',    'dedicated_account_manager','1'],
        ];

        foreach ($gates as [$slug, $key, $value]) {
            $pid = $planId($slug);
            if ($pid === null) continue;

            // Use upsert to be idempotent — safe to run even if rows already exist
            DB::table('plan_limits')->upsert(
                [
                    'plan_id'      => $pid,
                    'key'          => $key,
                    'value'        => $value,
                    'reset_period' => 'never',
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ],
                ['plan_id', 'key'],  // unique columns
                ['value', 'updated_at']  // columns to update on conflict
            );
        }
    }

    public function down(): void
    {
        $featureKeys = [
            'chat_support', 'recurring_invoicing', 'bill_of_materials',
            'fixed_asset_depreciation', 'fiscal_year_closing', 'imei_scanner',
            'whatsapp_reminders', 'loyalty_points', 'wholesale_pricing',
            'dedicated_account_manager',
        ];

        DB::table('plan_limits')->whereIn('key', $featureKeys)->delete();
    }
};
