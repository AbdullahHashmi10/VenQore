<?php

namespace Tests\Feature;

use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Warehouse;
use App\Services\CanonicalPostingScope;

class SaleReturnDocumentSeparationTest extends VenQoreTestCase
{
    private function createCustomer($tenant): Party
    {
        return Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Test Customer',
            'phone'     => '03001234567',
            'type'      => 'customer',
        ]);
    }

    private function createWarehouse($tenant): Warehouse
    {
        return Warehouse::where('tenant_id', $tenant->id)->first() ?? Warehouse::create([
            'tenant_id'  => $tenant->id,
            'name'       => 'Default Store Warehouse',
            'is_default' => true,
        ]);
    }

    private function createProduct($tenant): Product
    {
        return Product::create([
            'tenant_id'  => $tenant->id,
            'name'       => 'Widget A',
            'sku'        => 'WID-A-101',
            'price'      => 500.0,
            'cost_price' => 300.0,
        ]);
    }

    public function test_normal_sale_cannot_become_credit_note_via_returns_pdf_route(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->actingAsTenantUserModel($owner, $tenant);
        $customer = $this->createCustomer($tenant);
        $warehouse = $this->createWarehouse($tenant);
        $product = $this->createProduct($tenant);

        $normalSale = CanonicalPostingScope::run(function () use ($tenant, $owner, $customer, $warehouse, $product) {
            $sale = Sale::create([
                'tenant_id'        => $tenant->id,
                'user_id'          => $owner->id,
                'party_id'         => $customer->id,
                'warehouse_id'     => $warehouse->id,
                'reference_number' => 'INV-2026-NORMAL-01',
                'status'           => 'completed',
                'total'            => 1000.00,
                'subtotal_gross'   => 1000.00,
                'net_sales'        => 1000.00,
                'invoice_total'    => 1000.00,
                'payment_status'   => 'paid',
                'payment_method'   => 'cash',
            ]);

            SaleItem::create([
                'tenant_id'       => $tenant->id,
                'sale_id'         => $sale->id,
                'product_id'      => $product->id,
                'quantity'        => 2,
                'unit_price'      => 500.00,
                'line_total'      => 1000.00,
                'cost_price'      => 300.00,
                'tax_rate'        => 0,
                'tax_amount'      => 0,
                'free_quantity'   => 0,
                'discount_amount' => 0,
                'gross_amount'    => 1000.00,
            ]);

            return $sale;
        });

        // Attempting to access a normal completed sale via returns.pdf route MUST abort 404
        $response = $this->get(route('store.v3.returns.pdf', [
            'store_slug' => $tenant->slug,
            'returnId'   => $normalSale->id,
        ]));

        $response->assertNotFound();
    }

    public function test_normal_sale_cannot_become_credit_note_via_whatsapp_draft_route(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->actingAsTenantUserModel($owner, $tenant);
        $customer = $this->createCustomer($tenant);
        $warehouse = $this->createWarehouse($tenant);

        $normalSale = CanonicalPostingScope::run(function () use ($tenant, $owner, $customer, $warehouse) {
            return Sale::create([
                'tenant_id'        => $tenant->id,
                'user_id'          => $owner->id,
                'party_id'         => $customer->id,
                'warehouse_id'     => $warehouse->id,
                'reference_number' => 'INV-2026-NORMAL-02',
                'status'           => 'completed',
                'total'            => 2500.00,
                'subtotal_gross'   => 2500.00,
                'net_sales'        => 2500.00,
                'invoice_total'    => 2500.00,
                'payment_status'   => 'paid',
                'payment_method'   => 'cash',
            ]);
        });

        // Requesting sale_return for an ordinary completed sale MUST return 422
        $response = $this->postJson(route('store.communication.whatsapp.prepare', [
            'store_slug' => $tenant->slug,
        ]), [
            'document_type' => 'sale_return',
            'document_id'   => $normalSale->id,
        ]);

        $response->assertStatus(422);
        $response->assertJson([
            'success' => false,
            'message' => 'Specified transaction is not a return.',
        ]);
    }

    public function test_actual_return_renders_credit_note_pdf(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->actingAsTenantUserModel($owner, $tenant);
        $customer = $this->createCustomer($tenant);
        $warehouse = $this->createWarehouse($tenant);
        $product = $this->createProduct($tenant);

        $returnSale = CanonicalPostingScope::run(function () use ($tenant, $owner, $customer, $warehouse, $product) {
            $sale = Sale::create([
                'tenant_id'        => $tenant->id,
                'user_id'          => $owner->id,
                'party_id'         => $customer->id,
                'warehouse_id'     => $warehouse->id,
                'reference_number' => 'RET-2026-001',
                'status'           => 'returned',
                'total'            => -500.00,
                'subtotal_gross'   => -500.00,
                'net_sales'        => -500.00,
                'invoice_total'    => -500.00,
                'payment_status'   => 'paid',
                'payment_method'   => 'cash',
            ]);

            SaleItem::create([
                'tenant_id'       => $tenant->id,
                'sale_id'         => $sale->id,
                'product_id'      => $product->id,
                'quantity'        => 1,
                'unit_price'      => 500.00,
                'line_total'      => 500.00,
                'cost_price'      => 300.00,
                'tax_rate'        => 0,
                'tax_amount'      => 0,
                'free_quantity'   => 0,
                'discount_amount' => 0,
                'gross_amount'    => 500.00,
            ]);

            return $sale;
        });

        // Requesting returns.pdf for an actual return MUST return 200 with credit-note filename
        $response = $this->get(route('store.v3.returns.pdf', [
            'store_slug' => $tenant->slug,
            'returnId'   => $returnSale->id,
        ]));

        $response->assertOk();
        $contentDisposition = $response->headers->get('content-disposition');
        $this->assertStringContainsString('credit-note-RET-2026-001.pdf', (string)$contentDisposition);
    }

    public function test_actual_return_creates_credit_note_whatsapp_draft_even_if_requested_as_sale(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->actingAsTenantUserModel($owner, $tenant);
        $customer = $this->createCustomer($tenant);
        $warehouse = $this->createWarehouse($tenant);

        $returnSale = CanonicalPostingScope::run(function () use ($tenant, $owner, $customer, $warehouse) {
            return Sale::create([
                'tenant_id'        => $tenant->id,
                'user_id'          => $owner->id,
                'party_id'         => $customer->id,
                'warehouse_id'     => $warehouse->id,
                'reference_number' => 'RET-2026-002',
                'status'           => 'returned',
                'total'            => -750.00,
                'subtotal_gross'   => -750.00,
                'net_sales'        => -750.00,
                'invoice_total'    => -750.00,
                'payment_status'   => 'paid',
                'payment_method'   => 'cash',
            ]);
        });

        // Even if client sent document_type = 'sale', the controller detects status = 'returned'
        // and enforces credit note formatting and dedicated returns.pdf URL
        $response = $this->postJson(route('store.communication.whatsapp.prepare', [
            'store_slug' => $tenant->slug,
        ]), [
            'document_type' => 'sale',
            'document_id'   => $returnSale->id,
        ]);

        $response->assertOk();
        $response->assertJson([
            'success'             => true,
            'document_type'       => 'sale_return',
            'document_type_label' => 'Credit Note / Sale Return',
            'action'              => 'open_whatsapp_draft',
        ]);
        $this->assertStringContainsString('/returns/' . $returnSale->id . '/pdf', $response->json('pdf_url'));
        $this->assertStringNotContainsString('/sales/' . $returnSale->id . '/pdf', $response->json('pdf_url'));
    }

    public function test_actual_return_accessing_sales_pdf_redirects_to_returns_pdf(): void
    {
        $tenant = $this->createTenant();
        $owner = $this->createTenantUser($tenant, 'owner');
        $this->actingAsTenantUserModel($owner, $tenant);
        $customer = $this->createCustomer($tenant);
        $warehouse = $this->createWarehouse($tenant);

        $returnSale = CanonicalPostingScope::run(function () use ($tenant, $owner, $customer, $warehouse) {
            return Sale::create([
                'tenant_id'        => $tenant->id,
                'user_id'          => $owner->id,
                'party_id'         => $customer->id,
                'warehouse_id'     => $warehouse->id,
                'reference_number' => 'RET-2026-003',
                'status'           => 'returned',
                'total'            => -300.00,
                'subtotal_gross'   => -300.00,
                'net_sales'        => -300.00,
                'invoice_total'    => -300.00,
                'payment_status'   => 'paid',
                'payment_method'   => 'cash',
            ]);
        });

        // Accessing sales.pdf with a return record redirects to returns.pdf
        $response = $this->get(route('store.v3.sales.pdf', [
            'store_slug' => $tenant->slug,
            'saleId'     => $returnSale->id,
        ]));

        $response->assertRedirect(route('store.v3.returns.pdf', [
            'store_slug' => $tenant->slug,
            'returnId'   => $returnSale->id,
        ]));
    }
}
