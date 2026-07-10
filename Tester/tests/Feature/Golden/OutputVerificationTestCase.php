<?php

namespace Tests\Feature\Golden;

use Tests\Feature\VenQoreTestCase;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;
use App\Models\Tenant;
use Tests\Feature\Golden\Verification\VerificationClaim;
use Tests\Feature\Golden\Verification\ClaimLogger;

/**
 * ============================================================
 * Phase 5 — Base for Output Verification Tests
 * ============================================================
 *
 * Shared infrastructure for all HTTP surface tests.
 * All tests in Phase 5 hit REAL routes (through Inertia/JSON middleware)
 * using the Golden Company seeded tenant and compare JSON output
 * field-by-field against manifest.json.
 *
 * KEY DESIGN DECISIONS:
 *  - Clock frozen to 2025-12-31 23:59:59 using Carbon::setTestNow()
 *  - Auth user is a seeded owner-role user for Golden Company Tenant 1
 *  - Requests sent with `Accept: application/json` to get JSON, not HTML
 *  - The Inertia `X-Inertia: true` header causes controllers to return
 *    a JSON blob with `{ component, props, ... }` instead of full HTML
 *  - All monetary comparisons use TOLERANCE = 0.02 (2 paise)
 */
abstract class OutputVerificationTestCase extends VenQoreTestCase
{
    use DatabaseTransactions;

    protected const TENANT_ID   = '999991';
    protected const TENANT_SLUG = 'golden-company';
    protected const TENANT_2_ID = '999992';
    protected const YEAR_START  = '2025-01-01';
    protected const YEAR_END    = '2025-12-31';
    protected const TOLERANCE   = 0.02;

    protected static array $manifest = [];
    protected static bool  $seeded   = false;

    protected Tenant $tenant;

    // ─────────────────────────────────────────────────────────────────────────
    // SETUP
    // ─────────────────────────────────────────────────────────────────────────

    protected function setUp(): void
    {
        parent::setUp();

        $this->ensureSeeded();
        $this->loadManifest();

        // Freeze the clock at year-end early morning to prevent any timezone conversion from pushing it to 2026
        Carbon::setTestNow('2025-12-31 02:00:00');

        $this->tenant = Tenant::findOrFail(self::TENANT_ID);
        $this->bindTenantContext($this->tenant);

        $ownerUser = DB::table('users')
            ->join('tenant_users', 'tenant_users.user_id', '=', 'users.id')
            ->where('tenant_users.tenant_id', self::TENANT_ID)
            ->where('tenant_users.role', 'owner')
            ->select('users.*')
            ->first();

        if ($ownerUser) {
            $this->actingAs(\App\Models\User::find($ownerUser->id));
        }
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow(); // Reset frozen clock
        parent::tearDown();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MANIFEST HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private function loadManifest(): void
    {
        if (!empty(self::$manifest)) return;
        $path = base_path('verification/golden_company/manifest.json');
        if (!file_exists($path)) {
            $this->markTestSkipped('manifest.json not found. Run: php verification/golden_company/calculator.php');
        }
        self::$manifest = json_decode(file_get_contents($path), true);
    }

    protected function ensureSeeded(): void
    {
        if (DB::table('tenants')->where('id', self::TENANT_ID)->exists()) {
            return;
        }

        // Commit parent transaction so seeder is not rolled back
        DB::commit();

        Artisan::call('db:seed', ['--class' => 'GoldenCompanySeeder', '--force' => true]);

        // Start a new transaction for the test itself
        DB::beginTransaction();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HTTP HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * GET a V3 report endpoint as JSON (not Inertia). Returns decoded array.
     */
    protected function reportGet(string $path, array $params = []): array
    {
        $url = $this->v3Url($path);
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        $response = $this->withHeaders([
            'Accept'     => 'application/json',
            'X-Inertia'  => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
        ])->get($url);

        $response->assertStatus(200);
        $data = $response->json();

        // Unwrap Inertia response if needed (props key holds the data)
        return $data['props'] ?? $data;
    }

    /**
     * Build a full V3 URL for the Golden Company tenant.
     */
    protected function v3Url(string $path): string
    {
        $slug = $this->tenant->slug ?? self::TENANT_SLUG;
        return "/s/{$slug}/v3/{$path}";
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ASSERTION HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    protected function assertMoney(float $expected, float $actual, string $label): void
    {
        ClaimLogger::log(new VerificationClaim(
            expectedValue: $expected,
            actualValue: $actual,
            metric: $label,
            surface: 'OutputVerificationTestCase'
        ));

        $this->assertEqualsWithDelta(
            $expected, $actual, self::TOLERANCE,
            sprintf('%s — expected Rs.%s, got Rs.%s',
                $label,
                number_format($expected, 2),
                number_format($actual, 2)
            )
        );
    }

    protected function M(string ...$keys): mixed
    {
        $val = self::$manifest;
        foreach ($keys as $k) {
            $val = $val[$k] ?? null;
            if ($val === null) return null;
        }
        return $val;
    }

    /**
     * Recursively find a key in a nested array and return its value.
     */
    protected function findKey(array $data, string $key): mixed
    {
        if (array_key_exists($key, $data)) return $data[$key];
        foreach ($data as $v) {
            if (is_array($v)) {
                $found = $this->findKey($v, $key);
                if ($found !== null) return $found;
            }
        }
        return null;
    }
}
