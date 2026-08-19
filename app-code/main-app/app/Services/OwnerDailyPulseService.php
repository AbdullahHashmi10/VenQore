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
     * @param Tenant $tenant
     * @param string|Carbon $date
     * @return DailySnapshot
     */
    public function captureSnapshot(Tenant $tenant, $date): DailySnapshot
    {
        $dateString = $date instanceof Carbon ? $date->toDateString() : (string) $date;

        // Bind tenant to DI container for HasTenant and other scoping systems
        app()->instance('current.tenant', $tenant);

        // 1. Resolve metrics via Reckoner
        $reckoner = app(\App\Reckoner\Reckoner::class);
        $user = \App\Models\User::where('tenant_id', $tenant->id)->first() ?? \App\Models\User::first();

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

        $requests = [];
        foreach ($keys as $key) {
            $requests[] = new \App\Reckoner\ReckonerRequest(
                key: $key,
                period: 'custom',
                customPeriod: $customParams
            );
        }

        $results = $reckoner->readMany($requests, $user, $tenant);
        $argsHash = md5(json_encode($customParams));

        $salesValue = (float) ($results["sales.revenue|custom|{$argsHash}"]->data['value'] ?? 0.0);
        $purchasesValue = (float) ($results["purchasing.spend|custom|{$argsHash}"]->data['value'] ?? 0.0);
        $stockValue = (float) ($results["inventory.stock_value|custom|{$argsHash}"]->data['value'] ?? 0.0);
        $payablesValue = (float) ($results["finance.payables|custom|{$argsHash}"]->data['value'] ?? 0.0);
        $receivablesValue = (float) ($results["finance.receivables|custom|{$argsHash}"]->data['value'] ?? 0.0);
        $cashValue = (float) ($results["finance.total_liquidity|custom|{$argsHash}"]->data['value'] ?? 0.0);
        $expenseValue = (float) ($results["finance.expenses_total|custom|{$argsHash}"]->data['value'] ?? 0.0);

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
