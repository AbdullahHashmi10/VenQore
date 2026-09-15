<?php

namespace Tests\Feature\Hardening;

use App\Models\Party;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * S-011 (below-cost) and S-044 (discount over role limit) on the MAIN POS
 * checkout — POST /s/{store}/sales, SaleController@store, the endpoint
 * Pos.jsx / NewPos.jsx call. Same rules and helper (ManagerApproval) as the
 * V3 sale route; a missing/invalid approval is a 422 with
 * code=approval_required and nothing is written.
 */
class PosApprovalGuardTest extends VenQoreTestCase
{
    private const MANAGER_PIN = '246810';
    private const CASHIER2_PIN = '888888';

    private Tenant $tenant;
    private User $cashier;
    private User $manager;
    private string $warehouseId;
    private Product $product;
    private string $customerId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->createTenant('pos-approval', 'ltd_3', 'active');
        $this->seedTenantDefaults($this->tenant);
        $this->createTenantUser($this->tenant, 'owner');
        $this->cashier = $this->createTenantUser($this->tenant, 'cashier');
        $this->manager = $this->member($this->tenant, 'manager', self::MANAGER_PIN);

        // This store's cashier limit: 5% (manager keeps the global default 50%).
        DB::table('discount_limits')->insert([
            'tenant_id' => $this->tenant->id, 'role' => 'cashier', 'max_discount_percent' => 5,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->warehouseId = (string) DB::table('warehouses')->where('tenant_id', $this->tenant->id)->value('id');

        // cost_price deliberately differs from the batch cost: the rule is about FIFO cost.
        $this->product = Product::factory()->create([
            'tenant_id' => $this->tenant->id, 'name' => 'Widget', 'cost_price' => 10.00, 'price' => 100.00, 'tax_rate' => 0,
        ]);
        Stock::updateOrCreate(['product_id' => $this->product->id, 'warehouse_id' => $this->warehouseId], ['quantity' => 20]);
        DB::table('inventory_batches')->insert([
            'id' => (string) Str::uuid(), 'tenant_id' => $this->tenant->id, 'product_id' => $this->product->id,
            'warehouse_id' => $this->warehouseId, 'unit_cost' => 60.00, 'original_qty' => 20,
            'initial_qty' => 20, 'remaining_qty' => 20, 'created_at' => now(), 'updated_at' => now(),
        ]);
        $this->customerId = (string) Party::factory()->customer()->create(['tenant_id' => $this->tenant->id])->id;

        $this->actingAsTenantUserModel($this->cashier, $this->tenant);
    }

    // ── helpers ──────────────────────────────────────────────────────────

    private function member(Tenant $tenant, string $role, ?string $pin = null): User
    {
        $user = $this->createTenantUser($tenant, $role);
        if ($pin !== null) {
            TenantUser::where('tenant_id', $tenant->id)->where('user_id', $user->id)->update(['security_pin' => Hash::make($pin)]);
        }
        return $user;
    }

    /** The shape Pos.jsx / NewPos.jsx send (item discount is an amount). */
    private function sale(float $price, int $qty = 2, float $itemDiscount = 0, float $orderDiscount = 0, array $extra = []): array
    {
        $total = $price * $qty - $itemDiscount - $orderDiscount;
        return array_merge([
            'customer_id'    => $this->customerId,
            'warehouse_id'   => $this->warehouseId,
            'items'          => [['product_id' => $this->product->id, 'quantity' => $qty, 'price' => $price, 'discount' => $itemDiscount, 'discount_type' => 'fixed']],
            'discount'       => $orderDiscount,
            'amount_paid'    => $total,
            'payment_method' => 'cash',
            'source'         => 'pos',
        ], $extra);
    }

    private function checkout(array $payload)
    {
        return $this->postJson("/s/{$this->tenant->slug}/sales", $payload);
    }

    /** @return array<string, int|float> */
    private function footprint(): array
    {
        $t = $this->tenant->id;
        return [
            'sales'        => DB::table('sales')->where('tenant_id', $t)->count(),
            'journal'      => DB::table('journal_entries')->where('tenant_id', $t)->count(),
            'sale_batches' => DB::table('sale_item_batches')->where('tenant_id', $t)->count(),
            'batch_left'   => (float) DB::table('inventory_batches')->where('tenant_id', $t)->where('product_id', $this->product->id)->sum('remaining_qty'),
            'stock'        => (float) Stock::where('product_id', $this->product->id)->where('warehouse_id', $this->warehouseId)->value('quantity'),
        ];
    }

    private function saleEntry(string $saleId): object
    {
        $je = DB::table('journal_entries')->where('tenant_id', $this->tenant->id)
            ->where('reference_type', 'sale')->where('reference', $saleId)->first();
        $this->assertNotNull($je, 'The sale must have posted its journal entry.');
        return $je;
    }

    private function assertApprovalRequired($response, string $reason): void
    {
        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('code', 'approval_required')
            ->assertJsonPath('reason', $reason);
    }

    // ── S-011 below cost ─────────────────────────────────────────────────

    public function test_cashier_below_cost_sale_is_refused_without_approval_and_writes_nothing(): void
    {
        $before = $this->footprint();

        $res = $this->checkout($this->sale(50.00));   // 2 × 50 = 100 against FIFO cost 2 × 60 = 120

        $this->assertApprovalRequired($res, 'below_cost');
        $res->assertJsonPath('reasons', ['below_cost'])
            ->assertJsonPath('lines.0.reason', 'below_cost')
            ->assertJsonPath('lines.0.index', 0)
            ->assertJsonPath('lines.0.product_id', (string) $this->product->id)
            ->assertJsonPath('approval_error', null);
        $this->assertEqualsWithDelta(100.00, $res->json('lines.0.revenue'), 0.001);
        $this->assertEqualsWithDelta(120.00, $res->json('lines.0.cost'), 0.001, 'Cost must be the FIFO batch cost, not cost_price.');

        $this->assertSame($before, $this->footprint(), 'A refused sale must write nothing.');
    }

    public function test_below_cost_is_refused_with_wrong_pin_non_manager_or_other_store_manager(): void
    {
        $cashier2 = $this->member($this->tenant, 'cashier', self::CASHIER2_PIN);
        $otherStore = $this->createTenant('pos-approval-other', 'ltd_3', 'active');
        $otherManager = $this->member($otherStore, 'manager', self::MANAGER_PIN);
        $before = $this->footprint();

        $attempts = [
            'manager, wrong PIN'           => ['approved_by' => (string) $this->manager->id, 'approval_pin' => '000000'],
            'manager, no PIN'              => ['approved_by' => (string) $this->manager->id],
            'another cashier + their PIN'  => ['approved_by' => (string) $cashier2->id, 'approval_pin' => self::CASHIER2_PIN],
            'cashier approving themselves' => ['approved_by' => (string) $this->cashier->id],
            "other store's manager + PIN"  => ['approved_by' => (string) $otherManager->id, 'approval_pin' => self::MANAGER_PIN],
            'unknown user id'              => ['approved_by' => '99999999', 'approval_pin' => self::MANAGER_PIN],
        ];

        foreach ($attempts as $label => $approval) {
            $res = $this->checkout($this->sale(50.00, 2, 0, 0, $approval));
            $this->assertApprovalRequired($res, 'below_cost');
            $this->assertNotNull($res->json('approval_error'), "{$label}: the rejected approval must be explained.");
            $this->assertArrayHasKey('approved_by', $res->json('errors'), $label);
            $this->assertSame($before, $this->footprint(), "{$label}: a refused sale must write nothing.");
        }
    }

    public function test_below_cost_is_allowed_with_manager_and_pin_and_approval_is_recorded(): void
    {
        $res = $this->checkout($this->sale(50.00, 2, 0, 0, [
            'approved_by' => (string) $this->manager->id, 'approval_pin' => self::MANAGER_PIN,
        ]));

        $res->assertOk()->assertJsonPath('success', true);
        $saleId = $res->json('sale_id');

        $this->assertSame((string) $this->manager->id, (string) $this->saleEntry($saleId)->approved_by, 'approved_by must be stamped on the journal entry.');
        $this->assertSame((string) $this->cashier->id, (string) DB::table('sales')->where('id', $saleId)->value('user_id'), 'The sale is still rung up by the cashier.');
        $this->assertEqualsWithDelta(120.00, (float) DB::table('sale_item_batches')->where('tenant_id', $this->tenant->id)->sum('total_cogs'), 0.001);
        $this->assertTrialBalanceZero($this->tenant);
    }

    public function test_an_order_discount_that_pushes_a_line_below_cost_needs_approval(): void
    {
        // 2 × 70 = 140, order discount 30 → 110 < 120. (Owner-level cashier limit is not the issue here.)
        DB::table('discount_limits')->where('tenant_id', $this->tenant->id)->where('role', 'cashier')->update(['max_discount_percent' => 100]);

        $this->assertApprovalRequired($this->checkout($this->sale(70.00, 2, 0, 30.00)), 'below_cost');
        $this->checkout($this->sale(70.00, 2, 0, 10.00))->assertOk();   // 130 ≥ 120
    }

    // ── S-044 discount limit ─────────────────────────────────────────────

    public function test_discount_over_cashier_limit_is_refused_then_allowed_with_manager_approval(): void
    {
        $before = $this->footprint();

        // Row discount 16 on 2 × 100 = 8% > this store's 5% cashier limit.
        $res = $this->checkout($this->sale(100.00, 2, 16.00));
        $this->assertApprovalRequired($res, 'discount_limit');
        $res->assertJsonPath('lines.0.reason', 'discount_limit');
        $this->assertEqualsWithDelta(8.0, $res->json('lines.0.discount_percent'), 0.001);
        $this->assertEqualsWithDelta(5.0, $res->json('lines.0.limit'), 0.001);

        // The same 8% given as an order-level discount is caught too.
        $this->assertApprovalRequired($this->checkout($this->sale(100.00, 2, 0, 16.00)), 'discount_limit');

        // A manager's PIN cannot cover 60%: beyond the manager's own 50% limit.
        $res = $this->checkout($this->sale(100.00, 1, 60.00, 0, ['approved_by' => (string) $this->manager->id, 'approval_pin' => self::MANAGER_PIN]));
        $this->assertApprovalRequired($res, 'discount_limit');
        $this->assertEqualsWithDelta(50.0, $res->json('lines.0.approver_limit'), 0.001);

        // Wrong PIN → still refused.
        $this->assertApprovalRequired($this->checkout($this->sale(100.00, 2, 16.00, 0, ['approved_by' => (string) $this->manager->id, 'approval_pin' => '111111'])), 'discount_limit');

        $this->assertSame($before, $this->footprint(), 'Nothing may have posted so far.');

        // Manager + PIN → 8% goes through: 200 − 16 = 184.
        $res = $this->checkout($this->sale(100.00, 2, 16.00, 0, ['approved_by' => (string) $this->manager->id, 'approval_pin' => self::MANAGER_PIN]));
        $res->assertOk();
        $sale = DB::table('sales')->where('id', $res->json('sale_id'))->first();
        $this->assertEqualsWithDelta(184.00, (float) $sale->net_sales, 0.001);
        $this->assertSame((string) $this->manager->id, (string) $this->saleEntry($sale->id)->approved_by);
        $this->assertTrialBalanceZero($this->tenant);
    }

    public function test_manager_own_sale_within_own_limit_needs_no_pin(): void
    {
        $this->actingAsTenantUserModel($this->manager, $this->tenant);

        // 8% is over the cashier's 5% but inside the manager's own 50%: no approval at all.
        $res = $this->checkout($this->sale(100.00, 2, 16.00));
        $res->assertOk();
        $this->assertNull($this->saleEntry($res->json('sale_id'))->approved_by);

        // Below cost: as on V3 the manager approves it themselves with no PIN — at the till
        // their session is the approval, and they are recorded as the approver.
        $res = $this->checkout($this->sale(50.00));
        $res->assertOk();
        $this->assertSame((string) $this->manager->id, (string) $this->saleEntry($res->json('sale_id'))->approved_by);

        // Sending their own id explicitly (the V3 form) works the same.
        $res = $this->checkout($this->sale(50.00, 2, 0, 0, ['approved_by' => (string) $this->manager->id]));
        $res->assertOk();
        $this->assertSame((string) $this->manager->id, (string) $this->saleEntry($res->json('sale_id'))->approved_by);

        // But a discount beyond the manager's OWN limit (50%) still needs a higher approver.
        $this->assertApprovalRequired($this->checkout($this->sale(100.00, 1, 60.00)), 'discount_limit');
        $this->assertTrialBalanceZero($this->tenant);
    }

    public function test_normal_cashier_sale_is_unaffected(): void
    {
        // Role cashier, permission pos.checkout, discount inside the 5% limit, price above cost.
        $res = $this->checkout($this->sale(100.00, 2, 8.00));   // 4%
        $res->assertOk()->assertJsonPath('success', true);
        $this->assertNull($this->saleEntry($res->json('sale_id'))->approved_by);
        $this->assertTrialBalanceZero($this->tenant);
    }

    // ── approver list for the POS modal ──────────────────────────────────

    public function test_approver_list_shows_this_stores_managers_without_secrets(): void
    {
        $otherStore = $this->createTenant('pos-approval-list-other', 'ltd_3', 'active');
        $stranger = $this->member($otherStore, 'manager', self::MANAGER_PIN);

        $res = $this->getJson("/s/{$this->tenant->slug}/sales/approvers")->assertOk();
        $rows = collect($res->json('approvers'));

        $this->assertEqualsCanonicalizing(['owner', 'manager'], $rows->pluck('role')->all());
        $this->assertFalse($rows->pluck('user_id')->contains((string) $stranger->id));
        $this->assertFalse($rows->pluck('user_id')->contains((string) $this->cashier->id));
        $mgr = $rows->firstWhere('user_id', (string) $this->manager->id);
        $this->assertTrue($mgr['has_pin']);
        $this->assertEqualsWithDelta(50.0, $mgr['discount_limit'], 0.001);
        $this->assertStringNotContainsString('security_pin', $res->getContent());

        // Permission-guarded like checkout: an accountant (no pos.checkout / sales.create) is refused.
        $accountant = $this->createTenantUser($this->tenant, 'accountant');
        $this->actingAsTenantUserModel($accountant, $this->tenant);
        $this->getJson("/s/{$this->tenant->slug}/sales/approvers")->assertForbidden();
    }
}
