<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            if (!Schema::hasColumn('accounts', 'role')) {
                $table->string('role', 32)->nullable()->after('type');
            }
            if (!Schema::hasColumn('accounts', 'is_current')) {
                $table->boolean('is_current')->nullable()->after('role');
            }
            $table->index(['tenant_id', 'role']);
        });

        // Backfill existing accounts by code per §5.2
        $accounts = DB::table('accounts')->get();
        foreach ($accounts as $acc) {
            $role = self::determineRole($acc->code, $acc->type);
            $isCurrent = self::determineIsCurrent($acc->code, $acc->type, $role);

            DB::table('accounts')
                ->where('id', $acc->id)
                ->update([
                    'role' => $role,
                    'is_current' => $isCurrent,
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'role']);
            $table->dropColumn(['role', 'is_current']);
        });
    }

    public static function determineRole(string $code, string $type): string
    {
        return match ($code) {
            '1000' => 'cash',
            '1010' => 'bank',
            '1100' => 'inventory',
            '1200' => 'ar',
            '1205' => 'marketplace_clearing',
            '1300' => 'prepaid',
            '1500' => 'fixed_asset',
            '1510' => 'accumulated_depreciation',
            '2000' => 'ap',
            '2050' => 'customer_credit',
            '2060' => 'customer_advance',
            '2100' => 'tax_output',
            '2150' => 'tips',
            '2200' => 'loan',
            '2300' => 'tax_input',
            '3000', '3100', '3999', '7000' => 'equity',
            '3200' => 'drawings',
            '4000' => 'sales_revenue',
            '4100', '4200', '4900' => 'other_income',
            '5000' => 'cogs',
            default => match ($type) {
                'income', 'revenue' => 'other_income',
                'expense' => ($code === '5000' ? 'cogs' : 'opex'),
                'asset' => ($code >= '1000' && $code < '1100' ? 'cash' : ($code >= '1500' ? 'fixed_asset' : 'prepaid')),
                'liability' => ($code >= '2200' ? 'loan' : 'ap'),
                'equity' => 'equity',
                default => 'opex',
            },
        };
    }

    public static function determineIsCurrent(string $code, string $type, string $role): bool
    {
        // Decision D4: current assets: 1000-1300, 2300; current liabilities: 2000-2150
        // Non-current: fixed assets 1500, loans 2200, equity
        if ($role === 'equity' || $type === 'equity') {
            return false;
        }

        if (in_array($role, ['fixed_asset', 'accumulated_depreciation', 'loan'], true)) {
            return false;
        }

        if ($code >= '1000' && $code <= '1300') {
            return true;
        }

        if ($code >= '2000' && $code <= '2150') {
            return true;
        }

        if ($code === '2300') {
            return true;
        }

        if ($code === '1500' || $code === '2200') {
            return false;
        }

        if (in_array($type, ['income', 'revenue', 'expense'], true)) {
            return true;
        }

        return false;
    }
};