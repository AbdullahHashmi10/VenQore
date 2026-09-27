<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\DebitNote;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\JournalEntry;
use App\Models\Party;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Sale;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\User;
use Tests\Feature\VenQoreTestCase;

class R02RouteBypassTest extends VenQoreTestCase
{
    public function test_debit_note_store_creates_only_approval_document_when_approval_required(): void
    {
        $tenant = $this->createTenant('r02-dn-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        // Require approval for purchase return
        Setting::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'key'       => 'approval_policy_purchase_return',
            'value'     => 'required',
        ]);

        $user = $this->createTenantUser($tenant, 'purchasing_officer');
        $this->actingAsTenantUserModel($user, $tenant);

        $supplier = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Supplier Test',
            'type'      => 'supplier',
        ]);

        $product = Product::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Product Test',
            'sku'       => 'PRD-TEST-1',
            'cost'      => 50.00,
            'price'     => 100.00,
        ]);

        $purchase = Purchase::create([
            'tenant_id'       => $tenant->id,
            'party_id'        => $supplier->id,
            'purchase_date'   => '2026-09-20',
            'workflow_status' => 'received',
            'total'           => 100.00,
            'subtotal'        => 100.00,
            'created_by'      => $user->id,
        ]);
        $purchaseItem = \App\Models\PurchaseItem::create([
            'tenant_id'   => $tenant->id,
            'purchase_id' => $purchase->id,
            'product_id'  => $product->id,
            'qty'         => 2,
            'unit_cost'   => 50.00,
            'line_total'  => 100.00,
        ]);

        // Attempt to store debit note with status=approved
        $response = $this->post($this->storeUrl($tenant, '/debit-notes'), [
            'supplier_id' => $supplier->id,
            'purchase_id' => $purchase->id,
            'date'        => '2026-09-24',
            'status'      => 'approved',
            'reason'      => 'Faulty stock',
            'items'       => [
                [
                    'product_id' => $product->id,
                    'quantity'   => 2,
                    'unit_price' => 50.00,
                ],
            ],
        ]);

        $response->assertStatus(302);
        $this->assertSame(0, DebitNote::where('tenant_id', $tenant->id)->count(), 'A pending request must not create a debit-note financial row');
        $doc = ApprovalDocument::where('tenant_id', $tenant->id)
            ->where('document_type', ApprovalDocument::TYPE_PURCHASE_RETURN)
            ->first();
        $this->assertNotNull($doc);
        $this->assertSame(ApprovalDocument::STATUS_PENDING, $doc->status);
        $this->assertSame($purchaseItem->id, $doc->currentRevision->payload['items'][0]['purchase_item_id']);
    }

    public function test_sale_cancel_and_destroy_blocked_when_approval_required(): void
    {
        $tenant = $this->createTenant('r02-sale-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        Setting::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'key'       => 'approval_policy_sales_return',
            'value'     => 'required',
        ]);

        $admin = $this->createTenantUser($tenant, 'admin');
        $this->actingAsTenantUserModel($admin, $tenant);

        $customer = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Customer One',
            'type'      => 'customer',
        ]);

        $sale = \App\Services\CanonicalPostingScope::run(fn() => Sale::create([
            'tenant_id'        => $tenant->id,
            'party_id'         => $customer->id,
            'user_id'          => $admin->id,
            'reference_number' => 'SALE-R02-001',
            'status'           => 'posted',
            'total'            => 500.00,
            'net_sales'        => 500.00,
            'posted_at'        => now(),
        ]));

        // Attempt to cancel
        $cancelResponse = $this->postJson($this->storeUrl($tenant, "/sales/{$sale->id}/cancel"), [
            'reason' => 'Customer requested cancel',
        ]);
        $cancelResponse->assertStatus(422);

        $sale->refresh();
        $this->assertSame('posted', $sale->status, 'Sale status must remain posted when cancel is blocked by approval policy');

        // Attempt to destroy
        $destroyResponse = $this->deleteJson($this->storeUrl($tenant, "/sales/{$sale->id}"));
        $destroyResponse->assertStatus(422);

        $this->assertFalse($sale->fresh()->trashed(), 'Sale must not be deleted when destroy is blocked by approval policy');
    }

    public function test_expense_quick_add_intercepted_by_approval_policy(): void
    {
        $tenant = $this->createTenant('r02-exp-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        Setting::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'key'       => 'approval_policy_operating_expense',
            'value'     => 'required',
        ]);

        $user = $this->createTenantUser($tenant, 'accountant');
        $this->actingAsTenantUserModel($user, $tenant);

        $cat = ExpenseCategory::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Charity/Donations',
        ]);

        $response = $this->postJson($this->storeUrl($tenant, '/expenses/quick-add'), [
            'category_name' => 'Charity/Donations',
            'amount'        => 50.00,
            'description'   => 'Customer donation',
        ]);

        $response->assertStatus(202);
        $response->assertJson(['status' => 'pending_approval']);

        $this->assertSame(0, Expense::where('tenant_id', $tenant->id)->count(), 'Expense row must not be posted directly');
        $this->assertSame(1, ApprovalDocument::where('tenant_id', $tenant->id)->where('document_type', 'operating_expense')->count(), 'ApprovalDocument must be created');
    }

    public function test_v3_purchase_destroy_blocked_when_approval_required(): void
    {
        $tenant = $this->createTenant('r02-pvoid-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        Setting::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'key'       => 'approval_policy_purchase_return',
            'value'     => 'required',
        ]);

        $admin = $this->createTenantUser($tenant, 'admin');
        $this->actingAsTenantUserModel($admin, $tenant);

        $supplier = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Supplier Void',
            'type'      => 'supplier',
        ]);

        $purchase = Purchase::create([
            'tenant_id'       => $tenant->id,
            'party_id'        => $supplier->id,
            'purchase_date'   => '2026-09-20',
            'workflow_status' => 'received',
            'total'           => 1200.00,
            'subtotal'        => 1200.00,
            'created_by'      => $admin->id,
        ]);

        $response = $this->deleteJson($this->storeUrl($tenant, "/v3/purchases/{$purchase->id}"), [
            'reason' => 'Void test',
        ]);

        $response->assertStatus(422);
        $this->assertSame('received', $purchase->fresh()->workflow_status, 'Purchase workflow_status must remain received');
    }
}
