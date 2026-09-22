<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\Category;
use App\Models\Party;
use App\Models\Product;
use App\Models\Register;
use App\Models\RegisterShift;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Tests\Feature\VenQoreTestCase;

class TrustedPosSeparationTest extends VenQoreTestCase
{
    public function test_verified_cashier_with_open_shift_posts_directly_via_pos_route(): void
    {
        $tenant = $this->createTenant('pos-trusted-' . uniqid(), 'ltd_3');
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->actingAsTenantUserModel($cashier, $tenant);

        $category = Category::create(['tenant_id' => $tenant->id, 'name' => 'General']);
        $product = Product::create([
            'tenant_id'   => $tenant->id,
            'name'        => 'Espresso',
            'sku'         => 'ESP-1',
            'unit'        => 'pcs',
            'base_unit'   => 'pcs',
            'price'       => 250.00,
            'category_id' => $category->id,
        ]);

        $register = Register::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Front Till 1',
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
            'register_id'     => $register->id,
            'items'           => [
                ['product_id' => $product->id, 'quantity' => 2, 'unit_price' => 250.00],
            ],
            'total'           => 500.00,
            'paid_amount'     => 500.00,
            'payment_method'  => 'cash',
        ]);

        $response->assertStatus(201);
        $response->assertJson(['status' => 'posted', 'success' => true]);

        $this->assertDatabaseHas('sales', [
            'tenant_id'         => $tenant->id,
            'register_shift_id' => $shift->id,
            'status'            => 'posted',
        ]);

        // Zero approval documents created for trusted POS sale
        $this->assertSame(0, ApprovalDocument::where('tenant_id', $tenant->id)->count());
    }

    public function test_unverified_shift_or_missing_shift_routes_to_approval_workflow(): void
    {
        $tenant = $this->createTenant('pos-untrusted-' . uniqid(), 'ltd_3');
        $cashier = $this->createTenantUser($tenant, 'cashier');
        $this->actingAsTenantUserModel($cashier, $tenant);

        $category = Category::create(['tenant_id' => $tenant->id, 'name' => 'General']);
        $product = Product::create([
            'tenant_id'   => $tenant->id,
            'name'        => 'Latte',
            'sku'         => 'LAT-1',
            'price'       => 300.00,
            'category_id' => $category->id,
        ]);

        // Cashier has NO open shift, but claims source = 'pos' and provides fake shift ID 999
        $response = $this->postJson($this->storeUrl($tenant, '/pos/sales'), [
            'source'            => 'pos',
            'register_shift_id' => 999,
            'items'             => [
                ['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 300.00],
            ],
            'total'             => 300.00,
            'payment_method'    => 'cash',
        ]);

        $response->assertStatus(202);
        $response->assertJson([
            'status'  => 'pending_approval',
            'success' => true,
        ]);

        // Assert sale was NOT posted directly
        $this->assertSame(0, Sale::where('tenant_id', $tenant->id)->count());

        // Assert Approval Document created with pending status
        $this->assertDatabaseHas('approval_documents', [
            'tenant_id'     => $tenant->id,
            'document_type' => ApprovalDocument::TYPE_SALES_INVOICE,
            'status'        => ApprovalDocument::STATUS_PENDING,
            'maker_id'      => $cashier->id,
        ]);
    }

    public function test_foreign_cashier_shift_context_is_rejected_from_direct_pos_clearance(): void
    {
        $tenant = $this->createTenant('pos-foreign-shift-' . uniqid(), 'ltd_3');
        $cashierA = $this->createTenantUser($tenant, 'cashier');
        $cashierB = $this->createTenantUser($tenant, 'cashier');
        $this->actingAsTenantUserModel($cashierA, $tenant);

        $register = Register::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Till 2',
            'status'    => 'active',
        ]);

        // Shift belongs to Cashier B, not Cashier A
        $shiftB = RegisterShift::create([
            'tenant_id'       => $tenant->id,
            'register_id'     => $register->id,
            'opened_by'       => $cashierB->id,
            'opening_balance' => 500.00,
            'status'          => 'open',
            'opened_at'       => now(),
        ]);

        $category = Category::create(['tenant_id' => $tenant->id, 'name' => 'General']);
        $product = Product::create([
            'tenant_id'   => $tenant->id,
            'name'        => 'Mocha',
            'sku'         => 'MOC-1',
            'price'       => 400.00,
            'category_id' => $category->id,
        ]);

        // Cashier A attempts to checkout using Cashier B's shift ID
        $response = $this->postJson($this->storeUrl($tenant, '/pos/sales'), [
            'register_shift_id' => $shiftB->id,
            'items'             => [
                ['product_id' => $product->id, 'quantity' => 1, 'unit_price' => 400.00],
            ],
            'total'             => 400.00,
            'payment_method'    => 'cash',
        ]);

        // Server-side verification recognizes shift belongs to Cashier B -> fails POS clearance -> routes to approval
        $response->assertStatus(202);
        $response->assertJson([
            'status'  => 'pending_approval',
            'success' => true,
        ]);

        $this->assertSame(0, Sale::where('tenant_id', $tenant->id)->count());
    }
}
