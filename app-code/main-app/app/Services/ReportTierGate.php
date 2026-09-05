<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class ReportTierGate
{
    public static $order = ['starter', 'growth', 'business'];

    public static function tier(?string $plan): string
    {
        if (!$plan) {
            return 'starter';
        }

        $plan = strtolower($plan);

        if ($plan === 'ltd' && app()->bound('current.tenant')) {
            $tenant = app('current.tenant');
            $txLimit = (int) $tenant->getLimit('transactions_per_month');
            if ($txLimit === 500 || $txLimit === 1000) {
                return 'starter';
            } elseif ($txLimit === 2000 || $txLimit === 3000) {
                return 'growth';
            } elseif ($txLimit === 6000 || $txLimit === 8000) {
                return 'business';
            }
        }

        // The public pricing table publishes "Reports — All 33" as a universal
        // row: every subscription plan sees every report, and the tiers
        // differentiate on seats, branches, AI allowance and five feature rows
        // instead. config/report_tiers.php is kept intact so re-gating is a
        // one-line change here if that ever changes.
        //
        // 'counter' was also missing entirely, so every report check on the
        // entry tier fell through to the "unrecognized tier, failing open"
        // branch and logged an error on each request.
        $map = [
            'ltd_1'    => 'starter',
            'ltd_2'    => 'growth',
            'ltd_3'    => 'business',
            'trial'    => 'business',
            'counter'  => 'business',
            'starter'  => 'business',
            'growth'   => 'business',
            'business' => 'business',
        ];

        return $map[$plan] ?? $plan;
    }

    public static function check(string $reportKey): bool
    {
        // Platform admin always passes
        $user = auth()->user();
        if ($user && $user->is_platform_admin) {
            return true;
        }

        // Demo stores always have full access to all reports
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;
        if ($tenant?->is_demo) {
            return true;
        }

        $requiredTier = self::getRequiredTier($reportKey);
        if (!$requiredTier) {
            return true; // If key is not in config, allow access
        }

        $tenantPlan = $tenant ? $tenant->plan : 'starter';
        $tenantTier = self::tier($tenantPlan);

        $tenantIndex = array_search($tenantTier, self::$order);
        $requiredIndex = array_search($requiredTier, self::$order);

        if ($tenantIndex === false) {
            Log::error('ReportTierGate: unrecognized tenant tier, failing open', [
                'tenant_id'     => $tenant?->id,
                'plan'          => $tenantPlan,
                'resolved_tier' => $tenantTier,
            ]);
            return true; // fail open — never silently deny a paying customer
        }
        if ($requiredIndex === false) {
            return true;
        }

        return $tenantIndex >= $requiredIndex;
    }

    public static function enforce(string $reportKey): void
    {
        if (!self::check($reportKey)) {
            $requiredTier = self::getRequiredTier($reportKey);
            $message = 'Upgrade to ' . ucfirst($requiredTier) . ' to unlock this report.';

            abort(response()->json([
                'message' => $message,
                'upgrade' => true,
                'required_tier' => $requiredTier
            ], 403));
        }
    }

    public static function allTiers(): array
    {
        return config('report_tiers', []);
    }

    public static function allowedKeys(): array
    {
        $tenant = app()->bound('current.tenant') ? app('current.tenant') : null;

        // Platform admin or demo store — return every report key
        $user = auth()->user();
        if (($user && $user->is_platform_admin) || $tenant?->is_demo) {
            $allKeys = [];
            foreach (self::allTiers() as $tierKeys) {
                $allKeys = array_merge($allKeys, $tierKeys);
            }
            return array_unique($allKeys);
        }

        $tenantPlan = $tenant ? $tenant->plan : 'starter';
        $tenantTier = self::tier($tenantPlan);

        $allowed = [];
        $tiers = self::allTiers();

        foreach (self::$order as $tier) {
            if (isset($tiers[$tier])) {
                $allowed = array_merge($allowed, $tiers[$tier]);
            }
            if ($tier === $tenantTier) {
                break;
            }
        }

        return $allowed;
    }

    protected static function getRequiredTier(string $reportKey): ?string
    {
        $tiers = self::allTiers();
        foreach ($tiers as $tier => $keys) {
            if (in_array($reportKey, $keys)) {
                return $tier;
            }
        }
        return null;
    }
}
