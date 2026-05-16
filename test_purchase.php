<?php
use Illuminate\Support\Facades\DB;
use App\Services\V3\AccountingService;
use App\Services\V3\InventoryService;
use App\Services\V3\PaymentService;

$accounting = app(AccountingService::class);
$inventory = app(InventoryService::class);
$paymentService = app(PaymentService::class);

$productId = "548ab9ca-c0b4-4b42-b3d8-240f579e92d6";
$supplierId = "1f2db3dd-124d-4f66-af49-0bdcef3705cf";
$warehouseId = "9bf387d2-9cd5-43b3-8c14-97217b4223aa";

try {
    DB::beginTransaction();

    // 1. Credit Purchase of 100 units @ 100 Rs = 10,000 Rs
    $purchaseId = \Illuminate\Support\Str::uuid()->toString();
    
    // Journal for Purchase
    $je = $accounting->createEntry([
        'date' => now()->toDateString(),
        'reference_type' => 'purchase',
        'reference' => $purchaseId,
        'description' => 'Test Credit Purchase',
        'party_id' => $supplierId,
        'created_by' => '019cc98f-f6ee-7342-8a67-34a848e421fa'
    ], [
        ['account_code' => '1100', 'debit' => 10000, 'credit' => 0], // Inventory
        ['account_code' => '2000', 'debit' => 0, 'credit' => 10000, 'party_id' => $supplierId], // A/P
    ]);

    DB::table('purchases')->insert([
        'id' => $purchaseId,
        'invoice_number' => 'PUR-TEST-1',
        'party_id' => $supplierId,
        'warehouse_id' => $warehouseId,
        'purchase_date' => now()->toDateString(),
        'subtotal' => 10000,
        'total' => 10000,
        'payment_status' => 'unpaid',
        'payment_method' => 'credit',
        'journal_entry_id' => $je->id,
        'created_by' => '019cc98f-f6ee-7342-8a67-34a848e421fa',
        'created_at' => now(),
        'updated_at' => now()
    ]);

    $inventory->fifo->receiveBatch(
        productId: $productId,
        warehouseId: $warehouseId,
        qty: 100,
        unitCost: 100,
        batchType: 'purchase',
        purchaseId: $purchaseId
    );

    // 2. Partial Payment of 4,000 Rs
    $paymentId = \Illuminate\Support\Str::uuid()->toString();
    $payJe = $accounting->createEntry([
        'date' => now()->toDateString(),
        'reference_type' => 'supplier_payment',
        'reference' => $paymentId,
        'description' => 'Partial Payment to Supplier',
        'party_id' => $supplierId,
        'created_by' => '019cc98f-f6ee-7342-8a67-34a848e421fa'
    ], [
        ['account_code' => '2000', 'debit' => 4000, 'credit' => 0, 'party_id' => $supplierId], // A/P (Debit decreases liability)
        ['account_code' => '1000', 'debit' => 0, 'credit' => 4000], // Cash
    ]);

    // Track payment in table
    DB::table('payments')->insert([
        'id' => $paymentId,
        'party_id' => $supplierId,
        'amount' => 4000,
        'payment_date' => now()->toDateString(),
        'payment_method' => 'cash',
        'reference' => 'PUR-TEST-1',
        'journal_entry_id' => $payJe->id,
        'user_id' => '019cc98f-f6ee-7342-8a67-34a848e421fa',
        'created_at' => now(),
        'updated_at' => now()
    ]);

    DB::commit();
    echo "✅ Purchase & Partial Payment Recorded." . PHP_EOL;

} catch (\Exception $e) {
    DB::rollBack();
    echo "❌ Error: " . $e->getMessage() . PHP_EOL;
}
