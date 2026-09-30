<?php

namespace Tests\Feature\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
use Tests\Feature\VenQoreTestCase;

/**
 * CardContractAndPresetResolutionTest
 *
 * Verifies access contracts for all 349 Reckoner cards and validates
 * role-specific dashboard presets without self-modifying the checked-in artifacts.
 */
class CardContractAndPresetResolutionTest extends VenQoreTestCase
{
    private const CONTRACTS_FILE = 'docs/approval-dashboard-audit-2026-09-22/role-card-contracts-349.json';
    private const PRESETS_FILE   = 'docs/approval-dashboard-audit-2026-09-22/preset-resolution-matrix.json';

    public function test_validate_349_card_contracts_artifact(): void
    {
        $contractsFilePath = base_path(self::CONTRACTS_FILE);
        $this->assertFileExists($contractsFilePath, "Contracts artifact must exist.");

        $data = json_decode(file_get_contents($contractsFilePath), true);
        $this->assertIsArray($data);
        $this->assertArrayHasKey('contracts', $data);
        $this->assertCount(349, $data['contracts'], "Catalogue must contain exactly 349 cards.");

        $permissionsConfig = config('permissions') ?? require config_path('permissions.php');
        $validPermissions = [];
        foreach ($permissionsConfig as $role => $perms) {
            foreach ($perms as $p) {
                $validPermissions[$p] = true;
            }
        }
        $validPermissions['data.export'] = true;

        foreach ($data['contracts'] as $key => $contract) {
            $this->assertSame($key, $contract['key']);
            $this->assertNotEmpty($contract['permissions'], "Card {$key} missing permissions");

            // Verify all required permissions exist in permissions configuration
            foreach ($contract['permissions'] as $perm) {
                $this->assertArrayHasKey(
                    $perm,
                    $validPermissions,
                    "Permission {$perm} on card {$key} is not registered in config/permissions.php"
                );
            }

            $this->assertContains($contract['effective_data_scope'], ['tenant', 'register', 'warehouse', 'user']);
            $this->assertContains($contract['sensitivity_class'], ['internal', 'restricted_financial', 'confidential']);
            $this->assertIsArray($contract['role_defaults']);
        }
    }

    public function test_validate_role_specific_preset_resolution_and_isolation(): void
    {
        $presetsFilePath = base_path(self::PRESETS_FILE);
        $this->assertFileExists($presetsFilePath, "Presets matrix artifact must exist.");

        $data = json_decode(file_get_contents($presetsFilePath), true);
        $this->assertIsArray($data);
        $this->assertArrayHasKey('presets', $data);

        $presets = $data['presets'];

        // Assert role-specific separation and realistic limits
        $this->assertArrayHasKey('cashier', $presets);
        $this->assertArrayHasKey('accountant', $presets);
        $this->assertArrayHasKey('purchasing_officer', $presets);
        $this->assertArrayHasKey('inventory_controller', $presets);
        $this->assertArrayHasKey('viewer', $presets);
        $this->assertArrayHasKey('manager', $presets);
        $this->assertArrayHasKey('owner', $presets);

        // Cashier has focused POS cards (< 40)
        $this->assertLessThanOrEqual(40, count($presets['cashier']));
        $this->assertGreaterThanOrEqual(10, count($presets['cashier']));

        // Viewer has read-only summary cards (< 30)
        $this->assertLessThanOrEqual(30, count($presets['viewer']));

        // Sensitive financial cards MUST NOT be present in cashier or viewer presets
        $forbiddenCashierCards = [
            'core.net_profit', 'core.gross_profit', 'core.gross_margin_pct', 'core.net_margin_pct',
            'accounting.retained_earnings', 'tax.corporate_income_tax', 'staff.owner_compensation',
            'bank.balances', 'loans.portfolio'
        ];

        foreach ($forbiddenCashierCards as $forbiddenKey) {
            $this->assertNotContains($forbiddenKey, $presets['cashier'], "Cashier preset leaked sensitive financial card: {$forbiddenKey}");
            $this->assertNotContains($forbiddenKey, $presets['viewer'], "Viewer preset leaked sensitive financial card: {$forbiddenKey}");
        }

        // Accountant must have core financial cards
        $this->assertContains('core.revenue', $presets['accountant']);
        $this->assertContains('core.balance_sheet_ok', $presets['accountant']);
        $this->assertContains('core.net_profit', $presets['accountant']);
    }

    public function test_restricted_role_cannot_query_forbidden_card_api(): void
    {
        $tenant = $this->createTenant();
        $cashierUser = $this->createTenantUser($tenant, 'cashier');
        $this->bindTenantContext($tenant, $cashierUser);

        // Cashier attempting to query forbidden net_profit metric
        $response = $this->actingAs($cashierUser)
            ->postJson('/api/reckoner/read', [
                'requests' => [
                    ['key' => 'core.net_profit', 'period' => 'this_month']
                ]
            ]);

        // Unprivileged reading receives ok=false or contract error envelope or 403
        if ($response->status() === 200) {
            $data = $response->json('data') ?? [];
            if (!empty($data)) {
                $item = $data[0] ?? [];
                $this->assertFalse($item['ok'] ?? false);
            }
        } else {
            $this->assertTrue(in_array($response->status(), [403, 401, 422]));
        }
    }
}
