<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_limits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('plan_id')->constrained('plans')->cascadeOnDelete();
            $table->string('key', 100);
            $table->string('value', 255)->nullable();
            $table->enum('reset_period', ['never', 'monthly', 'annually'])->default('never');
            $table->timestamps();

            $table->unique(['plan_id', 'key']);
            $table->index('key');
        });

        // Helper closure
        $planId = fn(string $slug) => DB::table('plans')->where('slug', $slug)->value('id');

        $limits = [
            // TRIAL
            [$planId('trial'),    'transactions_per_month', '200',    'monthly'],
            [$planId('trial'),    'locations',              '1',       'never'],
            [$planId('trial'),    'sku_limit',              '50',      'never'],
            [$planId('trial'),    'staff_limit',            '2',       'never'],
            [$planId('trial'),    'woocommerce',            '0',       'never'],
            [$planId('trial'),    'api_access',             '0',       'never'],
            [$planId('trial'),    'reports',                'basic',   'never'],
            [$planId('trial'),    'growth_engine',          '0',       'never'],
            [$planId('trial'),    'multi_branch',           '0',       'never'],

            // STARTER
            [$planId('starter'), 'transactions_per_month', '2000',    'monthly'],
            [$planId('starter'), 'locations',              '1',       'never'],
            [$planId('starter'), 'sku_limit',              '1000',    'never'],
            [$planId('starter'), 'staff_limit',            '3',       'never'],
            [$planId('starter'), 'woocommerce',            '0',       'never'],
            [$planId('starter'), 'api_access',             '0',       'never'],
            [$planId('starter'), 'reports',                'basic',   'never'],
            [$planId('starter'), 'growth_engine',          '0',       'never'],
            [$planId('starter'), 'multi_branch',           '0',       'never'],

            // GROWTH
            [$planId('growth'),  'transactions_per_month', '10000',   'monthly'],
            [$planId('growth'),  'locations',              '3',       'never'],
            [$planId('growth'),  'sku_limit',              null,      'never'],
            [$planId('growth'),  'staff_limit',            '10',      'never'],
            [$planId('growth'),  'woocommerce',            '1',       'never'],
            [$planId('growth'),  'api_access',             '0',       'never'],
            [$planId('growth'),  'reports',                'advanced','never'],
            [$planId('growth'),  'growth_engine',          '1',       'never'],
            [$planId('growth'),  'multi_branch',           '1',       'never'],

            // BUSINESS
            [$planId('business'), 'transactions_per_month', null,     'monthly'],
            [$planId('business'), 'locations',              null,     'never'],
            [$planId('business'), 'sku_limit',              null,     'never'],
            [$planId('business'), 'staff_limit',            null,     'never'],
            [$planId('business'), 'woocommerce',            '1',      'never'],
            [$planId('business'), 'api_access',             '1',      'never'],
            [$planId('business'), 'reports',                'advanced','never'],
            [$planId('business'), 'growth_engine',          '1',      'never'],
            [$planId('business'), 'multi_branch',           '1',      'never'],

            // LTD_1
            [$planId('ltd_1'),   'transactions_per_month', '500',    'monthly'],
            [$planId('ltd_1'),   'locations',              '1',      'never'],
            [$planId('ltd_1'),   'sku_limit',              '1000',   'never'],
            [$planId('ltd_1'),   'staff_limit',            '3',      'never'],
            [$planId('ltd_1'),   'woocommerce',            '0',      'never'],
            [$planId('ltd_1'),   'api_access',             '0',      'never'],
            [$planId('ltd_1'),   'reports',                'basic',  'never'],
            [$planId('ltd_1'),   'growth_engine',          '0',      'never'],
            [$planId('ltd_1'),   'multi_branch',           '0',      'never'],

            // LTD_2
            [$planId('ltd_2'),   'transactions_per_month', '2000',   'monthly'],
            [$planId('ltd_2'),   'locations',              '3',      'never'],
            [$planId('ltd_2'),   'sku_limit',              null,     'never'],
            [$planId('ltd_2'),   'staff_limit',            '10',     'never'],
            [$planId('ltd_2'),   'woocommerce',            '1',      'never'],
            [$planId('ltd_2'),   'api_access',             '0',      'never'],
            [$planId('ltd_2'),   'reports',                'advanced','never'],
            [$planId('ltd_2'),   'growth_engine',          '1',      'never'],
            [$planId('ltd_2'),   'multi_branch',           '1',      'never'],

            // LTD_3
            [$planId('ltd_3'),   'transactions_per_month', '6000',   'monthly'],
            [$planId('ltd_3'),   'locations',              null,     'never'],
            [$planId('ltd_3'),   'sku_limit',              null,     'never'],
            [$planId('ltd_3'),   'staff_limit',            null,     'never'],
            [$planId('ltd_3'),   'woocommerce',            '1',      'never'],
            [$planId('ltd_3'),   'api_access',             '1',      'never'],
            [$planId('ltd_3'),   'reports',                'advanced','never'],
            [$planId('ltd_3'),   'growth_engine',          '1',      'never'],
            [$planId('ltd_3'),   'multi_branch',           '1',      'never'],
        ];

        foreach ($limits as [$pid, $key, $value, $reset]) {
            if ($pid === null) continue; // skip if plan slug not found
            DB::table('plan_limits')->insert([
                'plan_id'      => $pid,
                'key'          => $key,
                'value'        => $value,
                'reset_period' => $reset,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_limits');
    }
};
