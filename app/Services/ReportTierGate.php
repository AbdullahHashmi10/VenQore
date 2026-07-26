<?php

namespace App\Services;

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
            $txLimit = $tenant->getLimit('transactions_per_month');
            if ($txLimit == 500) {
                return 'starter';
            } elseif ($txLimit == 2000) {
                return 'growth';
            } elseif ($txLimit == 6000) {
                return 'business';
            }
        }

        $map = [
            'ltd_1' => 'starter',
            'ltd_2' => 'growth',
            'ltd_3' => 'business',
            'trial' => 'starter',
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
            $tenantIndex = 0; // default to starter
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
