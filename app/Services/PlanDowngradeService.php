<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\Product;
use App\Models\TenantUser;
use App\Models\Warehouse;
use Illuminate\Support\Facades\DB;

class PlanDowngradeService
{
    /**
     * Check if a tenant is allowed to downgrade to target plan.
     */
    public function validateDowngrade(Tenant $tenant, string $targetPlanSlug): array
    {
        $targetLimits = PlanRepository::getLimits($targetPlanSlug);
        $reasons = [];

        // 1. Check open payables & receivables balance across all downgrades
        $tenantId = $tenant->id;
        $openReceivables = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('accounts.tenant_id', $tenantId)
            ->where('accounts.code', '1200')
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.debit),0) - COALESCE(SUM(journal_items.credit),0) as net')
            ->value('net');

        $openPayables = (float) DB::table('journal_items')
            ->join('journal_entries', 'journal_items.journal_entry_id', '=', 'journal_entries.id')
            ->join('accounts', 'journal_items.account_id', '=', 'accounts.id')
            ->where('accounts.tenant_id', $tenantId)
            ->where('accounts.code', '2000')
            ->where('journal_entries.tenant_id', $tenantId)
            ->where('journal_entries.is_reversed', 0)
            ->selectRaw('COALESCE(SUM(journal_items.credit),0) - COALESCE(SUM(journal_items.debit),0) as net')
            ->value('net');

        $partyReceivables = (float) DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where('type', 'customer')
            ->where('current_balance', '>', 0)
            ->sum('current_balance');

        $partyPayables = (float) DB::table('parties')
            ->where('tenant_id', $tenantId)
            ->where('type', 'supplier')
            ->where('current_balance', '>', 0)
            ->sum('current_balance');

        $openReceivables += $partyReceivables;
        $openPayables += $partyPayables;

        if (round(max(0, $openReceivables), 2) > 0 || round(max(0, $openPayables), 2) > 0) {
            $totalOpen = max(0, $openReceivables) + max(0, $openPayables);
            $reasons[] = "You have recorded open balances (Rs " . number_format($totalOpen, 2) . " of payables/receivables). Settle or archive all open balances before downgrading.";
        }

        // 2. Check SKU limit
        $targetSkuLimit = isset($targetLimits['sku_limit']) ? (int) $targetLimits['sku_limit'] : null;
        if ($targetSkuLimit > 0) {
            $skuCount = Product::where('tenant_id', $tenant->id)->count();
            if ($skuCount > $targetSkuLimit) {
                $reasons[] = "Your current SKU count ({$skuCount}) exceeds the {$targetPlanSlug} limit of {$targetSkuLimit}.";
            }
        }

        // 3. Check staff limit
        $targetStaffLimit = isset($targetLimits['staff_limit']) ? (int) $targetLimits['staff_limit'] : null;
        if ($targetStaffLimit > 0) {
            $staffCount = TenantUser::where('tenant_id', $tenant->id)->where('status', 'active')->count();
            if ($staffCount > $targetStaffLimit) {
                $reasons[] = "Your active staff count ({$staffCount}) exceeds the {$targetPlanSlug} limit of {$targetStaffLimit}. Remove seats to continue.";
            }
        }

        // 4. Check location limit
        $targetLocationLimit = isset($targetLimits['location_limit']) ? (int) $targetLimits['location_limit'] : null;
        if ($targetLocationLimit > 0) {
            $locationCount = Warehouse::where('tenant_id', $tenant->id)->count();
            if ($locationCount > $targetLocationLimit) {
                $reasons[] = "Your location count ({$locationCount}) exceeds the {$targetPlanSlug} limit of {$targetLocationLimit}.";
            }
        }

        return [
            'allowed' => empty($reasons),
            'reasons' => $reasons,
        ];
    }
}
