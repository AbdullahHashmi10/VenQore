<?php

namespace Tests\Feature\Reckoner;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\Custom\CustomCardResolver;
use App\Reckoner\Custom\CustomCardValidator;
use App\Reckoner\Engine\MeasureEngine;
use App\Reckoner\ReckonerContext;
use App\Reckoner\ReckonerPeriod;
use App\Reckoner\ReckonerRequest;
use InvalidArgumentException;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

/**
 * Gate 8: Custom Cards & Measures API Tests (§5.3, §8, Gate 8).
 */
class CustomCardsGateTest extends TestCase
{
    protected ?Tenant $tenant = null;
    protected ?User $user = null;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::where('slug', 'golden-store')->first();
        if (!$this->tenant) {
            $built = ReckonerGoldenStoreFixture::build(http: $this);
            $this->tenant = $built['tenant'];
            $this->user   = $built['user'];
        } else {
            $this->user = User::where('email', 'golden-owner@venqore.com')->first();
        }

        $this->user->last_store_id = $this->tenant->id;
        $this->user->save();

        app()->instance('current.tenant', $this->tenant);
    }

    /**
     * 1. GET /api/reckoner/measures returns legal measures catalog.
     */
    public function test_measures_catalog_api_returns_legal_measures(): void
    {
        $response = $this->actingAs($this->user)
            ->withSession(['tenant_id' => $this->tenant->id])
            ->getJson('/api/reckoner/measures');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertIsArray($data);
        $this->assertNotEmpty($data);

        $keys = array_column($data, 'key');
        $this->assertContains('gl.sales_revenue', $keys);
        $this->assertContains('gl.cogs', $keys);

        $salesRev = collect($data)->firstWhere('key', 'gl.sales_revenue');
        $this->assertSame('currency', $salesRev['unit']);
        $this->assertContains('stat', $salesRev['allowed_shapes']);
        $this->assertContains('trend', $salesRev['allowed_shapes']);
    }

    /**
     * 2. Gate 8 Requirement 1: Build "Revenue by payment method, this quarter vs last".
     */
    public function test_custom_card_revenue_by_payment_method(): void
    {
        $engine = app(MeasureEngine::class);
        $ctx = new ReckonerContext($this->tenant, $this->user, 'scale');

        $req = new ReckonerRequest(
            key: 'custom.revenue_by_payment',
            period: 'custom',
            custom: ['from' => '2026-08-01', 'to' => '2026-08-31'],
            args: [
                'spec' => [
                    'measure' => 'sales.net_revenue',
                    'dims'    => ['payment_method'],
                    'shape'   => 'breakdown',
                    'compare' => true,
                ],
            ]
        );

        $res = $engine->resolve([$req], $ctx);
        $cardRes = $res[$req->getCompositeId()];

        $this->assertTrue($cardRes->ok);
        $this->assertSame('ok', $cardRes->status);
        $this->assertIsArray($cardRes->data['segments']);
        $this->assertEqualsWithDelta(7700.00, $cardRes->data['total'], 0.01);
    }

    /**
     * 3. Gate 8 Requirement 2: Build "Gross margin % by location, monthly for a year".
     */
    public function test_custom_card_gross_margin_derived_formula(): void
    {
        $engine = app(MeasureEngine::class);
        $ctx = new ReckonerContext($this->tenant, $this->user, 'scale');

        $req = new ReckonerRequest(
            key: 'custom.gross_margin_pct',
            period: 'custom',
            custom: ['from' => '2026-08-01', 'to' => '2026-08-31'],
            args: [
                'spec' => [
                    'formula' => '(gl.sales_revenue - gl.cogs) / gl.sales_revenue * 100',
                    'shape'   => 'gauge',
                ],
            ]
        );

        $res = $engine->resolve([$req], $ctx);
        $cardRes = $res[$req->getCompositeId()];

        $this->assertTrue($cardRes->ok);
        $this->assertSame('ok', $cardRes->status);
        // (7700 - 3200) / 7700 * 100 = 58.44%
        $this->assertEqualsWithDelta(58.44, (float) $cardRes->data['value'], 0.05);
    }

    /**
     * 4. Validator strictly rejects unsafe formulas.
     */
    public function test_validator_rejects_unsafe_code(): void
    {
        $this->expectException(InvalidArgumentException::class);
        CustomCardValidator::validate([
            'formula' => 'system("whoami")',
            'shape'   => 'stat',
        ]);
    }

    /**
     * 5. Validator strictly rejects illegal shapes for measure kinds.
     */
    public function test_validator_rejects_illegal_shapes(): void
    {
        $this->expectException(InvalidArgumentException::class);
        CustomCardValidator::validate([
            'measure' => 'gl.sales_revenue',
            'shape'   => 'list', // flow measure cannot be 'list'
        ]);
    }

    /**
     * 6. Shunting-yard math parser handles precedence, unary minus, parens, and division by zero safely without eval().
     */
    public function test_safe_math_parser_without_eval(): void
    {
        // Precedence & grouping
        $this->assertSame(14.0, \App\Reckoner\Custom\CustomCardResolver::evaluateMathExpression('2 + 3 * 4'));
        $this->assertSame(20.0, \App\Reckoner\Custom\CustomCardResolver::evaluateMathExpression('(2 + 3) * 4'));
        $this->assertSame(8.0, \App\Reckoner\Custom\CustomCardResolver::evaluateMathExpression('((10 - 2) * (3 + 1)) / 4'));

        // Unary minus
        $this->assertSame(5.0, \App\Reckoner\Custom\CustomCardResolver::evaluateMathExpression('-5 + 10'));
        $this->assertSame(-15.0, \App\Reckoner\Custom\CustomCardResolver::evaluateMathExpression('-5 - 10'));

        // Decimal floats
        $this->assertEqualsWithDelta(58.44, \App\Reckoner\Custom\CustomCardResolver::evaluateMathExpression('(7700 - 3200) / 7700 * 100'), 0.01);

        // Division by zero strictly returns null
        $this->assertNull(\App\Reckoner\Custom\CustomCardResolver::evaluateMathExpression('10 / 0'));
        $this->assertNull(\App\Reckoner\Custom\CustomCardResolver::evaluateMathExpression('10 / (5 - 5)'));

        // Syntax errors / malicious strings strictly return null
        $this->assertNull(\App\Reckoner\Custom\CustomCardResolver::evaluateMathExpression('system("calc")'));
        $this->assertNull(\App\Reckoner\Custom\CustomCardResolver::evaluateMathExpression('2 + (3 * 4'));

        // File must not contain eval()
        $resolverFile = file_get_contents(app_path('Reckoner/Custom/CustomCardResolver.php'));
        $this->assertFalse(str_contains($resolverFile, 'eval('), "CustomCardResolver must not contain any eval() calls");
    }
}
