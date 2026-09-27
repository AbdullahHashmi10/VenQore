<?php

namespace Tests\Feature\Approval;

use App\Models\ApprovalDocument;
use App\Models\Party;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\PurchaseReturn;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Approval\Adapters\PurchaseReturnApprovalAdapter;
use Tests\Feature\VenQoreTestCase;

class R08PurchaseReturnDateTest extends VenQoreTestCase
{
    public function test_purchase_return_adapter_preserves_custom_return_date(): void
    {
        $tenant = $this->createTenant('r08-pdate-' . uniqid(), 'ltd_3');
        $tenant->update(['timezone' => 'UTC', 'setup_completed' => true]);
        $this->seedTenantDefaults($tenant);

        $maker = $this->createTenantUser($tenant, 'purchasing_officer');
        $adapter = app(PurchaseReturnApprovalAdapter::class);

        $supplier = Party::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Supplier ABC',
            'type'      => 'supplier',
        ]);

        $product = Product::create([
            'tenant_id' => $tenant->id,
            'name'      => 'Widget A',
            'sku'       => 'WID-001',
            'cost'      => 10.00,
            'price'     => 15.00,
        ]);

        $purchase = Purchase::create([
            'tenant_id'       => $tenant->id,
            'party_id'        => $supplier->id,
            'purchase_date'   => '2026-09-01',
            'workflow_status' => 'received',
            'total'           => 100.00,
            'subtotal'        => 100.00,
            'created_by'      => $maker->id,
        ]);

        $purchaseItem = PurchaseItem::create([
            'tenant_id'     => $tenant->id,
            'purchase_id'   => $purchase->id,
            'product_id'    => $product->id,
            'qty'           => 10,
            'unit_cost'     => 10.00,
            'line_total'    => 100.00,
        ]);

        // Provide custom return_date
        $customDate = '2026-09-18';
        $payload = [
            'purchase_id' => $purchase->id,
            'return_date' => $customDate,
            'reason'      => 'Damaged items',
            'items'       => [
                [
                    'purchase_item_id' => $purchaseItem->id,
                    'qty_returned'     => 2,
                ]
            ],
        ];

        $validated = $adapter->validatePayload($payload, $tenant, $maker);
        $this->assertSame($customDate, $validated['return_date'], 'Adapter validatePayload must preserve custom return_date');
    }
}
