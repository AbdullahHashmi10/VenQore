<?php

namespace Tester\tests\Feature\Money;

use Tests\Feature\VenQoreTestCase;
use App\Models\Sale;
use App\Models\Invoice; // Purchases are Invoices with type = purchase
use App\Models\Party;
use App\Models\Product;
use App\Models\Payment;
use App\Models\BankAccount;
use App\Models\Expense;
use App\Models\Warehouse;
use App\Models\Proposal;
use App\Models\SalesOrder;
use Illuminate\Support\Facades\DB;

class IdorSweepTest extends VenQoreTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_B10_IDOR_every_binding_is_safe()
    {
        // 1. Setup Tenant A (acting owner)
        $tenantA = $this->createTenant("tenant-a", "ltd_3");
        $this->actingAsOwner($tenantA);
        $this->seedTenantDefaults($tenantA);

        // 2. Setup Tenant B (foreign tenant)
        $tenantB = $this->createTenant("tenant-b", "ltd_3");
        // We temporarily act as Tenant B to seed its records
        $this->actingAsOwner($tenantB);
        $this->seedTenantDefaults($tenantB);

        // Create Tenant B records
        $partyB = Party::factory()->customer()->create(['tenant_id' => $tenantB->id]);
        $productB = Product::factory()->create(['tenant_id' => $tenantB->id]);
        $warehouseB = Warehouse::create([
            'tenant_id' => $tenantB->id,
            'name' => 'B Warehouse',
            'slug' => 'b-warehouse',
        ]);
        $saleB = Sale::factory()->create([
            'tenant_id' => $tenantB->id,
            'warehouse_id' => $warehouseB->id,
            'party_id' => $partyB->id,
        ]);
        $purchaseB = Invoice::create([
            'tenant_id' => $tenantB->id,
            'type' => 'purchase',
            'party_id' => $partyB->id,
            'date' => now()->toDateString(),
            'invoice_number' => 'PUR-TEST-1234',
            'subtotal' => 100,
            'tax_amount' => 10,
            'total_amount' => 110,
        ]);
        $paymentB = Payment::create([
            'tenant_id' => $tenantB->id,
            'party_id' => $partyB->id,
            'amount' => 100,
            'type' => 'received',
            'method' => 'cash',
        ]);
        $bankAccountB = BankAccount::create([
            'tenant_id' => $tenantB->id,
            'name' => 'B Bank',
            'account_number' => '123B',
            'type' => 'bank',
        ]);
        $expenseB = Expense::create([
            'tenant_id' => $tenantB->id,
            'category' => 'B Expense',
            'amount' => 50,
            'date' => now()->toDateString(),
        ]);
        $proposalB = Proposal::create([
            'tenant_id' => $tenantB->id,
            'reference_number' => 'PROP-TEST-1234',
            'customer_id' => $partyB->id,
            'total_amount' => 100,
            'user_id' => auth()->id() ?? 1,
        ]);
        $salesOrderB = SalesOrder::create([
            'tenant_id' => $tenantB->id,
            'order_number' => 'SO-TEST-1234',
            'customer_id' => $partyB->id,
            'order_date' => now()->toDateString(),
            'total_amount' => 100,
            'user_id' => auth()->id() ?? 1,
        ]);

        // 3. Switch back to Tenant A
        $this->actingAsOwner($tenantA);
        $this->seedTenantDefaults($tenantA);

        // Define route configurations to test
        $routes = [
            // --- Sales ---
            ['method' => 'GET',    'url' => "/s/{slug}/sales/{id}", 'id' => $saleB->id],
            ['method' => 'GET',    'url' => "/s/{slug}/sales/{id}/edit", 'id' => $saleB->id],
            ['method' => 'PUT',    'url' => "/s/{slug}/sales/{id}", 'id' => $saleB->id, 'data' => ['notes' => 'Hacked']],
            ['method' => 'DELETE', 'url' => "/s/{slug}/sales/{id}", 'id' => $saleB->id],

            // --- Purchases (Invoices v1) ---
            ['method' => 'GET',    'url' => "/s/{slug}/purchases/{id}", 'id' => $purchaseB->id],
            ['method' => 'GET',    'url' => "/s/{slug}/purchases/{id}/edit", 'id' => $purchaseB->id],
            ['method' => 'PUT',    'url' => "/s/{slug}/purchases/{id}", 'id' => $purchaseB->id, 'data' => ['notes' => 'Hacked']],
            ['method' => 'DELETE', 'url' => "/s/{slug}/purchases/{id}", 'id' => $purchaseB->id],

            // --- Parties ---
            ['method' => 'PUT',    'url' => "/s/{slug}/parties/{id}", 'id' => $partyB->id, 'data' => ['name' => 'Hacked']],
            ['method' => 'DELETE', 'url' => "/s/{slug}/parties/{id}", 'id' => $partyB->id],
            ['method' => 'GET',    'url' => "/s/{slug}/parties/{id}/ledger", 'id' => $partyB->id],

            // --- Products (v3) ---
            ['method' => 'GET',    'url' => "/s/{slug}/v3/products/{id}", 'id' => $productB->id],
            ['method' => 'PUT',    'url' => "/s/{slug}/v3/products/{id}", 'id' => $productB->id, 'data' => ['name' => 'Hacked']],
            ['method' => 'DELETE', 'url' => "/s/{slug}/v3/products/{id}", 'id' => $productB->id],

            // --- Payments ---
            ['method' => 'GET',    'url' => "/s/{slug}/payments/{id}", 'id' => $paymentB->id],

            // --- Bank Accounts ---
            ['method' => 'PUT',    'url' => "/s/{slug}/bank-accounts/{id}", 'id' => $bankAccountB->id, 'data' => ['name' => 'Hacked']],
            ['method' => 'DELETE', 'url' => "/s/{slug}/bank-accounts/{id}", 'id' => $bankAccountB->id],
            ['method' => 'GET',    'url' => "/s/{slug}/bank-accounts/{id}/transactions", 'id' => $bankAccountB->id],

            // --- Expenses ---
            ['method' => 'PUT',    'url' => "/s/{slug}/expenses/{id}", 'id' => $expenseB->id, 'data' => ['amount' => 999]],
            ['method' => 'DELETE', 'url' => "/s/{slug}/expenses/{id}", 'id' => $expenseB->id],

            // --- Warehouses (v3) ---
            ['method' => 'GET',    'url' => "/s/{slug}/v3/warehouses/{id}", 'id' => $warehouseB->id],
            ['method' => 'PUT',    'url' => "/s/{slug}/v3/warehouses/{id}", 'id' => $warehouseB->id, 'data' => ['name' => 'Hacked']],
            ['method' => 'DELETE', 'url' => "/s/{slug}/v3/warehouses/{id}", 'id' => $warehouseB->id],

            // --- Proposals ---
            ['method' => 'GET',    'url' => "/s/{slug}/proposals/{id}", 'id' => $proposalB->id],
            ['method' => 'PUT',    'url' => "/s/{slug}/proposals/{id}", 'id' => $proposalB->id, 'data' => ['notes' => 'Hacked']],
            ['method' => 'DELETE', 'url' => "/s/{slug}/proposals/{id}", 'id' => $proposalB->id],

            // --- Sales Orders ---
            ['method' => 'GET',    'url' => "/s/{slug}/sales-orders/{id}", 'id' => $salesOrderB->id],
            ['method' => 'PUT',    'url' => "/s/{slug}/sales-orders/{id}", 'id' => $salesOrderB->id, 'data' => ['notes' => 'Hacked']],
            ['method' => 'DELETE', 'url' => "/s/{slug}/sales-orders/{id}", 'id' => $salesOrderB->id],
        ];

        foreach ($routes as $route) {
            $url = str_replace(['{slug}', '{id}'], [$tenantA->slug, $route['id']], $route['url']);
            $method = $route['method'];
            $data = $route['data'] ?? [];

            // Perform request
            $response = $this->call($method, $url, $data);
            $status = $response->status();

            // Assert response is 302, 403, 404, or 500 (NOT 200)
            $this->assertTrue(
                in_array($status, [302, 403, 404, 500]),
                "Route [{$method} {$url}] leaked B's data! Status code: {$status}"
            );

            // Assert response body does not contain any of B's distinct values
            $content = $response->getContent();
            $this->assertStringNotContainsString('B Warehouse', $content);
            $this->assertStringNotContainsString('B Bank', $content);
            $this->assertStringNotContainsString('Foreign Client', $content);
        }

        // 4. Assert all Tenant B records STILL EXIST and were NOT mutated
        $this->assertTrue(Sale::withoutTenantScope()->where('id', $saleB->id)->exists());
        $this->assertTrue(Invoice::withoutTenantScope()->where('id', $purchaseB->id)->exists());
        $this->assertTrue(Party::withoutTenantScope()->where('id', $partyB->id)->exists());
        $this->assertTrue(Product::withoutTenantScope()->where('id', $productB->id)->exists());
        $this->assertTrue(Payment::withoutTenantScope()->where('id', $paymentB->id)->exists());
        $this->assertTrue(BankAccount::withoutTenantScope()->where('id', $bankAccountB->id)->exists());
        $this->assertTrue(Expense::withoutTenantScope()->where('id', $expenseB->id)->exists());
        $this->assertTrue(Warehouse::withoutTenantScope()->where('id', $warehouseB->id)->exists());
        $this->assertTrue(Proposal::withoutTenantScope()->where('id', $proposalB->id)->exists());
        $this->assertTrue(SalesOrder::withoutTenantScope()->where('id', $salesOrderB->id)->exists());

        // Verify no mutations happened
        $this->assertNotEquals('Hacked', Sale::withoutTenantScope()->find($saleB->id)->notes);
        $this->assertNotEquals('Hacked', Invoice::withoutTenantScope()->find($purchaseB->id)->notes);
        $this->assertNotEquals('Hacked', Party::withoutTenantScope()->find($partyB->id)->name);
        $this->assertNotEquals('Hacked', Product::withoutTenantScope()->find($productB->id)->name);
        $this->assertNotEquals('Hacked', BankAccount::withoutTenantScope()->find($bankAccountB->id)->name);
        $this->assertNotEquals(999, Expense::withoutTenantScope()->find($expenseB->id)->amount);
        $this->assertNotEquals('Hacked', Warehouse::withoutTenantScope()->find($warehouseB->id)->name);
        $this->assertNotEquals('Hacked', Proposal::withoutTenantScope()->find($proposalB->id)->notes);
        $this->assertNotEquals('Hacked', SalesOrder::withoutTenantScope()->find($salesOrderB->id)->notes);
    }
}
