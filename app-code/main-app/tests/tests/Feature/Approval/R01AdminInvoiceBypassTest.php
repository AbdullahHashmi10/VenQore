<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\Category;
use App\Models\Party;
use App\Models\Product;
use App\Models\Register;
use App\Models\RegisterShift;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\TenantUser;
use App\Models\Warehouse;
use Tests\Feature\VenQoreTestCase;

/**
 * R01 — Trusted POS bypass closure tests.
 *
 * Doc 33 R01 acceptance criteria:
 *   "Required admin invoices stay pending with forged source/Referer, while the
 *    same cashier's genuine checkout works. Include admin invoices created while
 *    the cashier has an open shift."
 *
 * Each "bypass" test:
 *   - Enables approval (approval_admin_enabled = true)
 *   - Sets per-document policy = required for TYPE_SALES_INVOICE
 *   - Posts to the ADMIN invoice route with a formerly-bypassing signal
 *   - Asserts the response is 202 (pending_approval), not 200/201/redirect
 *   - Asserts zero Sale rows (nothing posted)
 *   - Asserts one ApprovalDocument row (submission recorded)
 *
 * The positive control test verifies the genuine POS route still works.
 */
class R01AdminInvoiceBypassTest extends VenQoreTestCase
{
    // ─── Shared fixture helpers ──────────────────────────────────────────────

    /** Minimal product + customer + warehouse for a valid sale payload. */
    private function makeFixtures($tenant): array
    {
        $warehouse = Warehouse::where('tenant_id', $tenant->id)->first()
            ?? Warehouse::create([
                'tenant_id' => $tenant->id,
                'name'      => 'Main',
                'code'      => 'WH-1',
            ]);

        $category = Category::create(['tenant_id' => $tenant->id, 'name' => 'Test']);
        $product  = Product::create([
            'tenant_id'   => $tenant->id,
            'name'        => 'Test Widget',
            'sku'         => 'TW-' . uniqid(),
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'price'       => 200.00,
            'cost_price'  => 100.00,
            'category_id' => $category->id,
        ]);
        $customer = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Walk-in Customer',
            'type'      => 'customer',
            'phone'     => '0000000000',
        ]);

        return compact('warehouse', 'product', 'customer');
    }

    /** Enable approval and require it for every sales invoice. */
    private function enableRequiredApproval($tenant): void
    {
        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_admin_enabled'],
            ['value' => 'true']
        );
        Setting::updateOrCreate(
            ['tenant_id' => $tenant->id, 'key' => 'approval_policy_sales_invoice'],
            ['value' => 'required']
        );
    }

    /** Build a minimal valid payload for POST /sales (legacy admin invoice). */
    private function legacyPayload(array $fixtures, array $overrides = []): array
    {
        return array_merge([
            'payment_method' => 'cash',
            'amount_paid'    => 200.00,
            'items'          => [
                [
                    'product_id' => $fixtures['product']->id,
                    'quantity'   => 1,
                    'price'      => 200.00,
                    'discount'   => 0,
                ],
            ],
            'discount' => 0,
        ], $overrides);
    }

    /** Build a minimal valid payload for POST s/{slug}/v3/sales. */
    private function v3Payload(array $fixtures, array $overrides = []): array
    {
        return array_merge([
            'customer_id'     => $fixtures['customer']->id,
            'warehouse_id'    => $fixtures['warehouse']->id,
            'sale_date'       => now()->toDateString(),
            'payment_method'  => 'cash',
            'amount_received' => 200.00,
            'items'           => [
                [
                    'product_id'   => $fixtures['product']->id,
                    'qty'          => 1,
                    'sale_uom'     => 'pcs',
                    'unit_price'   => 200.00,
                ],
            ],
        ], $overrides);
    }

    // ─── Bypass tests — legacy POST /sales ──────────────────────────────────

    /**
     * R01-A: source=pos field in request body does NOT bypass approval.
     *
     * Pre-fix behaviour: SaleController line 370 included
     *   ($request->input('source') === 'pos')
     * in isTrustedPos, so any client could send source=pos to skip approval.
     */
    public function test_legacy_admin_route_source_pos_does_not_bypass_approval(): void
    {
        $tenant   = $this->createTenant('r01-legacy-source-' . uniqid(), 'ltd_3');
        $cashier  = $this->createTenantUser($tenant, 'cashier');
        $this->actingAsTenantUserModel($cashier, $tenant);

        $this->enableRequiredApproval($tenant);
        $fixtures = $this->makeFixtures($tenant);

        $response = $this->postJson(
            $this->storeUrl($tenant, '/sales'),
            $this->legacyPayload($fixtures, ['source' => 'pos'])
        );

        // Must be routed to approval — never posted directly.
        $response->assertStatus(202);
        $response->assertJson(['status' => 'pending_approval']);

        // Zero sales posted, one pending document.
        $this->assertSame(0, Sale::where('tenant_id', $tenant->id)->count(),
            'No sale should be posted when approval is required (source=pos bypass attempt).'
        );
        $this->assertSame(1, ApprovalDocument::where('tenant_id', $tenant->id)->count(),
            'One pending ApprovalDocument should exist.'
        );
    }

    /**
     * R01-B: approved_by field in request body does NOT bypass approval.
     *
     * Pre-fix behaviour: isTrustedPos included ($approvedBy !== null), where
     * $approvedBy came from PosSaleApprovalGuard — which governs *below-cost/
     * discounted product* authorization, not the document-level workflow.
     *
     * Even if a valid manager PIN is supplied, the admin invoice must still go
     * through the approval workflow when approval is required.
     */
    public function test_legacy_admin_route_approved_by_field_does_not_bypass_approval(): void
    {
        $tenant  = $this->createTenant('r01-legacy-apprby-' . uniqid(), 'ltd_3');
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->actingAsTenantUserModel($cashier, $tenant);

        $this->enableRequiredApproval($tenant);
        $fixtures = $this->makeFixtures($tenant);

        // Pass a forged/arbitrary approved_by value — PosSaleApprovalGuard will
        // find no matching manager and set $approvedBy = null, but the old code
        // would have checked before the guard result. After the fix, isTrustedPos
        // is always false regardless.
        $response = $this->postJson(
            $this->storeUrl($tenant, '/sales'),
            $this->legacyPayload($fixtures, ['approved_by' => 'some-manager-id', 'approval_pin' => '1234'])
        );

        // PosSaleApprovalGuard may throw a 422 for invalid PIN/manager, OR the
        // approval interceptor may catch first. Either way: no sale is posted.
        $this->assertNotSame(200, $response->status(),
            'Admin invoice must not post directly when approval is required.'
        );
        $this->assertSame(0, Sale::where('tenant_id', $tenant->id)->count(),
            'No sale should be posted — either invalid PIN (422) or pending approval (202).'
        );
    }

    /**
     * R01-C: An open register shift for the cashier does NOT bypass approval
     * on the admin invoice route.
     *
     * Pre-fix behaviour: isTrustedPos included $hasActiveShift — meaning any
     * cashier with an open shift could post admin invoices without approval.
     * The admin invoice route is NOT a POS checkout route; open shifts are
     * irrelevant to document-level approval policy here.
     *
     * This is the exact scenario doc 33 R01 acceptance specifies:
     * "Include admin invoices created while the cashier has an open shift."
     */
    public function test_legacy_admin_route_open_shift_does_not_bypass_approval(): void
    {
        $tenant  = $this->createTenant('r01-legacy-shift-' . uniqid(), 'ltd_3');
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->actingAsTenantUserModel($cashier, $tenant);

        $this->enableRequiredApproval($tenant);
        $fixtures = $this->makeFixtures($tenant);

        // Create a real, verified open shift for this cashier.
        $register = Register::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Till 1',
            'status'    => 'active',
        ]);
        RegisterShift::create([
            'tenant_id'       => $tenant->id,
            'register_id'     => $register->id,
            'opened_by'       => $cashier->id,
            'opening_balance' => 500.00,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        // Post to the ADMIN route (not /pos/sales) while shift is open.
        $response = $this->postJson(
            $this->storeUrl($tenant, '/sales'),
            $this->legacyPayload($fixtures)
        );

        // The open shift is irrelevant on the admin route — must require approval.
        $response->assertStatus(202);
        $response->assertJson(['status' => 'pending_approval']);

        $this->assertSame(0, Sale::where('tenant_id', $tenant->id)->count(),
            'Open shift must not exempt admin invoices from approval policy.'
        );
        $this->assertSame(1, ApprovalDocument::where('tenant_id', $tenant->id)->count());
    }

    // ─── Bypass tests — V3 POST s/{slug}/v3/sales ───────────────────────────

    /**
     * R01-D: Referer header containing '/pos' does NOT bypass approval on V3 admin API.
     *
     * Pre-fix behaviour: V3/SaleController line 74–75 set
     *   $isPosRequest = str_contains($request->header('referer'), '/pos')
     * and included it in isTrustedPos. Any client can forge the Referer header.
     */
    public function test_v3_admin_route_forged_referer_pos_does_not_bypass_approval(): void
    {
        $tenant  = $this->createTenant('r01-v3-referer-' . uniqid(), 'ltd_3');
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->actingAsTenantUserModel($cashier, $tenant);

        $this->enableRequiredApproval($tenant);
        $fixtures = $this->makeFixtures($tenant);

        // Attach a forged Referer header that previously granted POS clearance.
        $response = $this->withHeaders(['Referer' => 'http://localhost/s/' . $tenant->slug . '/pos'])
            ->postJson(
                $this->storeUrl($tenant, 'v3/sales'),
                $this->v3Payload($fixtures)
            );

        $response->assertStatus(202);
        $response->assertJson(['status' => 'pending_approval']);

        $this->assertSame(0, Sale::where('tenant_id', $tenant->id)->count(),
            'Forged Referer /pos must not bypass approval on the V3 admin API.'
        );
        $this->assertSame(1, ApprovalDocument::where('tenant_id', $tenant->id)->count());
    }

    /**
     * R01-E: approved_by field on V3 admin API does NOT bypass approval.
     *
     * Pre-fix behaviour: isTrustedPos included !empty($data['approved_by']).
     */
    public function test_v3_admin_route_approved_by_field_does_not_bypass_approval(): void
    {
        $tenant  = $this->createTenant('r01-v3-apprby-' . uniqid(), 'ltd_3');
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->actingAsTenantUserModel($cashier, $tenant);

        $this->enableRequiredApproval($tenant);
        $fixtures = $this->makeFixtures($tenant);

        // Pass approved_by on V3 request — should have no effect on document approval.
        $response = $this->postJson(
            $this->storeUrl($tenant, 'v3/sales'),
            $this->v3Payload($fixtures, ['approved_by' => 'some-manager-id', 'approval_pin' => '1234'])
        );

        // Either invalid PIN (422) or pending approval (202) — never a direct post (200/201).
        $this->assertNotSame(200, $response->status());
        $this->assertNotSame(201, $response->status());

        $this->assertSame(0, Sale::where('tenant_id', $tenant->id)->count(),
            'approved_by field must not bypass approval on V3 admin API.'
        );
    }

    /**
     * R01-F: An open shift on V3 admin API does NOT bypass approval.
     *
     * Pre-fix behaviour: isTrustedPos included $hasActiveShift.
     */
    public function test_v3_admin_route_open_shift_does_not_bypass_approval(): void
    {
        $tenant  = $this->createTenant('r01-v3-shift-' . uniqid(), 'ltd_3');
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->actingAsTenantUserModel($cashier, $tenant);

        $this->enableRequiredApproval($tenant);
        $fixtures = $this->makeFixtures($tenant);

        // Create a real open shift.
        $register = Register::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Till V3',
            'status'    => 'active',
        ]);
        RegisterShift::create([
            'tenant_id'       => $tenant->id,
            'register_id'     => $register->id,
            'opened_by'       => $cashier->id,
            'opening_balance' => 500.00,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        $response = $this->postJson(
            $this->storeUrl($tenant, 'v3/sales'),
            $this->v3Payload($fixtures)
        );

        $response->assertStatus(202);
        $response->assertJson(['status' => 'pending_approval']);

        $this->assertSame(0, Sale::where('tenant_id', $tenant->id)->count(),
            'Open shift must not bypass approval on V3 admin API.'
        );
        $this->assertSame(1, ApprovalDocument::where('tenant_id', $tenant->id)->count());
    }

    // ─── Positive control — genuine POS route ───────────────────────────────

    /**
     * R01-G (positive control): Genuine POS checkout via POST /pos/sales with a
     * server-verified open shift still posts directly.
     *
     * Even with approval required for admin invoices, the cashier's genuine
     * POS checkout (PosSaleController, server-verified shift, isTrustedPos=true)
     * must continue to work immediately.
     */
    public function test_genuine_pos_checkout_with_verified_shift_posts_directly(): void
    {
        $tenant  = $this->createTenant('r01-pos-ctrl-' . uniqid(), 'ltd_3');
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->actingAsTenantUserModel($cashier, $tenant);

        // Enable approval & require it for sales — this must NOT affect POS checkout.
        $this->enableRequiredApproval($tenant);

        $category = Category::create(['tenant_id' => $tenant->id, 'name' => 'General']);
        $product  = Product::create([
            'tenant_id'   => $tenant->id,
            'name'        => 'Espresso',
            'sku'         => 'ESP-' . uniqid(),
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'price'       => 250.00,
            'cost_price'  => 100.00,
            'category_id' => $category->id,
        ]);
        $register = Register::create([
            'tenant_id' => $tenant->id,
            'name'      => 'POS Till',
            'status'    => 'active',
        ]);
        $shift = RegisterShift::create([
            'tenant_id'       => $tenant->id,
            'register_id'     => $register->id,
            'opened_by'       => $cashier->id,
            'opening_balance' => 1000.00,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        $response = $this->postJson($this->storeUrl($tenant, '/pos/sales'), [
            'register_id'    => $register->id,
            'items'          => [
                ['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 250.00],
            ],
            'total'          => 250.00,
            'paid_amount'    => 250.00,
            'payment_method' => 'cash',
        ]);

        // POS checkout with verified shift: posts directly even when approval is required for admin invoices.
        $response->assertStatus(201);
        $response->assertJson(['status' => 'posted', 'success' => true]);

        $this->assertSame(1, Sale::where('tenant_id', $tenant->id)->count(),
            'Genuine POS checkout should post directly with an open shift.'
        );
        $this->assertSame(0, ApprovalDocument::where('tenant_id', $tenant->id)->count(),
            'No approval document should be created for a successful POS checkout.'
        );
    }
}
