<?php

namespace Tests\Feature\Module;

use App\Models\Tenant;
use App\Models\User;
use App\Services\ModuleService;
use App\Support\ReportPlanMap;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

class ReportAccessLockoutTest extends VenQoreTestCase
{
    #[Test]
    public function solo_tenant_locked_out_of_all_40_reports(): void
    {
        $tenant = $this->createTenant(plan: 'solo', status: 'active');
        $this->actingAsTenantUser($tenant, 'owner');

        // Enable all modules so module gating does not block
        $allLiveModules = array_keys(config('modules', []));
        foreach ($allLiveModules as $mod) {
            ModuleService::enable($tenant, $mod);
        }

        $map = ReportPlanMap::MAP;
        $uniqueReports = array_unique(array_keys($map));

        $blockedCount = 0;
        foreach ($uniqueReports as $suffix) {
            $url = $this->resolveReportUrl($tenant, $suffix);
            if (!$url) continue;

            $isPost = str_starts_with($suffix, 'owner-daily-pulse.') && $suffix !== 'owner-daily-pulse';
            $response = $isPost ? $this->postJson($url) : $this->getJson($url);

            // Assert 402/403 response or redirect to upgrade
            $status = $response->getStatusCode();
            $this->assertTrue(
                in_array($status, [402, 403, 302], true),
                "Report '{$suffix}' must be blocked on Solo, got status {$status}."
            );

            if ($status === 402) {
                $this->assertSame('upgrade_required', $response->json('message'));
            }

            $blockedCount++;
        }

        // All mapped report endpoints are blocked on Solo (at least 40 canonical reports)
        $this->assertGreaterThanOrEqual(40, $blockedCount);
    }

    #[Test]
    public function starter_tenant_has_exact_ceiling_of_20_reports(): void
    {
        $tenant = $this->createTenant(plan: 'starter', status: 'active');
        $this->actingAsTenantUser($tenant, 'owner');

        $allLiveModules = array_keys(config('modules', []));
        foreach ($allLiveModules as $mod) {
            ModuleService::enable($tenant, $mod);
        }

        $map = ReportPlanMap::MAP;
        $featureTiers = ReportPlanMap::FEATURE_TIERS;

        $starterAccessibleCount = 0;
        $coreScaleBlockedCount = 0;

        foreach ($map as $suffix => $featureKey) {
            $tier = $featureTiers[$featureKey] ?? 'Scale';
            $url = $this->resolveReportUrl($tenant, $suffix);
            if (!$url) continue;

            $isPost = str_starts_with($suffix, 'owner-daily-pulse.') && $suffix !== 'owner-daily-pulse';
            $response = $isPost ? $this->postJson($url) : $this->getJson($url);
            $status = $response->getStatusCode();

            if ($tier === 'Starter') {
                $this->assertNotSame(
                    402,
                    $status,
                    "Starter report '{$suffix}' ({$featureKey}) must not return 402 on Starter."
                );
                $this->assertNotSame(
                    302,
                    $status,
                    "Starter report '{$suffix}' ({$featureKey}) must not redirect to upgrade on Starter."
                );
                $starterAccessibleCount++;
            } else {
                $this->assertTrue(
                    in_array($status, [402, 403, 302], true),
                    "Core/Scale report '{$suffix}' ({$featureKey}, {$tier}) must be blocked on Starter, got status {$status}."
                );
                $coreScaleBlockedCount++;
            }
        }

        $this->assertGreaterThanOrEqual(20, $starterAccessibleCount);
        $this->assertGreaterThanOrEqual(20, $coreScaleBlockedCount);
    }

    private function resolveReportUrl(Tenant $tenant, string $suffix): ?string
    {
        $routeName = Route::has("reports.{$suffix}")
            ? "reports.{$suffix}"
            : (Route::has("store.reports.{$suffix}")
                ? "store.reports.{$suffix}"
                : (Route::has("store.v3.reports.{$suffix}")
                    ? "store.v3.reports.{$suffix}"
                    : null));

        if (!$routeName) {
            return "/reports/{$suffix}";
        }

        $params = ['store_slug' => $tenant->slug];
        if ($suffix === 'party-ledger') {
            $params['partyId'] = 1;
        }
        $url = route($routeName, $params);
        if ($suffix === 'export') {
            $url .= '?report=profit_loss&format=json';
        }

        return $url;
    }
}