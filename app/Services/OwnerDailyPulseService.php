<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\DailySnapshot;
use App\Models\Sale;
use App\Models\Expense;
use App\Models\Account;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class OwnerDailyPulseService
{
    /**
     * Calculate and save/update the daily snapshot for a tenant on a specific date.
     *
     * The Reckoner reads are made as one of the store's own active members
     * (owner, then admin, then anyone active). A store with NO active member
     * is skipped: it used to fall back to User::first() — an arbitrary user,
     * usually of another store — and read (and so cache/mail) this store's
     * pulse under that user.
     *
     * @param Tenant $tenant
     * @param string|Carbon $date
     * @return DailySnapshot
     * @throws \App\Exceptions\DailyPulseSkippedException when the store has no active member
     */
    public function captureSnapshot(Tenant $tenant, $date): DailySnapshot
    {
        $dateString = $date instanceof Carbon ? $date->toDateString() : (string) $date;

        // Bind tenant to DI container for HasTenant and other scoping systems
        app()->instance('current.tenant', $tenant);

        // 1. Resolve metrics via Reckoner
        $reckoner = app(\App\Reckoner\Reckoner::class);
        // users has no tenant_id column (membership lives on tenant_users), so
        // resolve the store's owner (then admin, then any active member).
        $memberId = \App\Models\TenantUser::where('tenant_id', $tenant->id)
            ->whereNotNull('user_id')
            ->where('status', 'active')
            ->orderByRaw("CASE WHEN role = 'owner' THEN 0 WHEN role = 'admin' THEN 1 ELSE 2 END")
            ->orderBy('id')
            ->value('user_id');
        $user = $memberId ? \App\Models\User::find($memberId) : null;
        if (!$user) {
            // Every caller (snapshot command, summary mailer, pulse backfiller)
            // catches this and moves on to the next store/date.
            throw new \App\Exceptions\DailyPulseSkippedException(
                "Store [{$tenant->id}] has no active member — daily pulse skipped."
            );
        }

        $customParams = ['from' => $dateString, 'to' => $dateString];
        $keys = [
            'sales.revenue',
            'purchasing.spend',
            'inventory.stock_value',
            'finance.payables',
            'finance.receivables',
            'finance.total_liquidity',
            'finance.expenses_total'
        ];

        // ReckonerRequest's parameter is `custom` (the old `customPeriod:` named
        // argument was a fatal "Unknown named parameter"), and results are keyed
        // by the request's own composite id — not a hand-built string.
        $requests = [];
        foreach ($keys as $key) {
            $requests[$key] = new \App\Reckoner\ReckonerRequest(
                key: $key,
                period: 'custom',
                custom: $customParams
            );
        }

        $results = $reckoner->readMany(array_values($requests), $user, $tenant);
        $value = fn (string $key): float => (float) ($results[$requests[$key]->getCompositeId()]->data['value'] ?? 0.0);

        $salesValue = $value('sales.revenue');
        $purchasesValue = $value('purchasing.spend');
        $stockValue = $value('inventory.stock_value');
        $payablesValue = $value('finance.payables');
        $receivablesValue = $value('finance.receivables');
        $cashValue = $value('finance.total_liquidity');
        $expenseValue = $value('finance.expenses_total');

        // Update or create the snapshot
        return DailySnapshot::updateOrCreate(
            [
                'tenant_id' => $tenant->id,
                'date'      => $dateString,
            ],
            [
                'sales_value'       => $salesValue,
                'purchases_value'   => $purchasesValue,
                'stock_value'       => $stockValue,
                'payables_value'    => $payablesValue,
                'receivables_value' => $receivablesValue,
                'cash_value'        => $cashValue,
                'expense_value'     => $expenseValue,
            ]
        );
    }
}
