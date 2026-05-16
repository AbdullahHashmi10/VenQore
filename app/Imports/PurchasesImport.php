<?php
 
 namespace App\Imports;
 
 use Maatwebsite\Excel\Row;
 use Maatwebsite\Excel\Concerns\OnEachRow;
 use Maatwebsite\Excel\Concerns\WithMultipleSheets;
 use Illuminate\Support\Carbon;
 use Illuminate\Support\Str;
 
 class PurchasesImport implements WithMultipleSheets
 {
     protected array $mapping;
     public int $importedCount = 0;
     public int $updatedCount = 0;
     public array $warnings = [];
     protected bool $dryRun = false;
     protected array $overrides = [];
     protected array $ignoredRows = [];
 
     public function __construct(array $mapping = [], bool $dryRun = false, array $overrides = [], array $ignoredRows = [])
     {
         $this->mapping = $mapping;
         $this->dryRun = $dryRun;
         $this->overrides = $overrides;
         $this->ignoredRows = $ignoredRows;
     }
 
     public function sheets(): array
     {
         return [
             0 => new PurchasesDataSheetImport($this->mapping, $this, $this->dryRun, $this->overrides, $this->ignoredRows)
         ];
     }
 }
 
 class PurchasesDataSheetImport implements OnEachRow
 {
     protected array $mapping;
     protected ?PurchasesImport $parent;
     protected bool $dryRun = false;
     protected array $overrides = [];
     protected array $ignoredRows = [];
     protected array $seenInvoices = [];
     protected array $seenData = [];
 
     public function __construct(array $mapping = [], ?PurchasesImport $parent = null, bool $dryRun = false, array $overrides = [], array $ignoredRows = [])
     {
         $this->parent = $parent;
         $this->dryRun = $dryRun;
         $this->overrides = $overrides;
         $this->ignoredRows = $ignoredRows;
         
         if (empty($mapping)) {
             $this->mapping = [
                 'invoice_number' => 0, 'date' => 1, 'supplier_phone' => 2,
                 'supplier_name' => 3, 'product_sku' => 4, 'product_name' => 5,
                 'quantity' => 6, 'cost_price' => 7, 'total' => 8,
             ];
         } else {
             $this->mapping = $mapping;
         }
     }
 
     public function onRow(Row $row)
     {
         $index = $row->getIndex();
         if ($index <= 5) return;
         if (in_array($index, $this->ignoredRows)) return;
 
         $numericArray = $row->toArray();
         if (isset($numericArray[0]) && is_string($numericArray[0])) {
             $firstCell = $numericArray[0];
             if (str_contains($firstCell, 'VenQore ERP —') || str_contains($firstCell, 'Enter your') || str_contains($firstCell, 'Invoice Number')) return;
         }
 
         $data = [];
         foreach ($this->mapping as $expectedKey => $columnIndex) {
             $data[$expectedKey] = ($columnIndex !== null && isset($numericArray[$columnIndex])) ? $numericArray[$columnIndex] : null;
         }
 
         if (isset($this->overrides[$index])) {
             $data = array_merge($data, $this->overrides[$index]);
         }
 
         if (empty($data['invoice_number'])) return;
 
         $invoice = trim((string)$data['invoice_number']);
         $existing = null;
         $reason = null;
         $firstRowIndex = null;
 
         if (isset($this->seenInvoices[$invoice])) {
             $existing = true;
             $firstRowIndex = $this->seenInvoices[$invoice];
             $reason = "Invoice number [$invoice] repeats in row $firstRowIndex";
         }
         $this->seenInvoices[$invoice] = $index;
         $this->seenData[$index] = $data;
 
         $dbData = null;
         if (!$existing) {
             $dbPurchase = \App\Models\Purchase::where('reference_number', $invoice)->first();
             if ($dbPurchase) {
                 $existing = true;
                 $reason = "Purchase #$invoice already exists in DB (ID: $dbPurchase->id)";
                 $dbData = [
                     'invoice_number' => $dbPurchase->reference_number,
                     'supplier_name' => $dbPurchase->supplier?->name ?? 'Unknown',
                     'total' => $dbPurchase->total,
                     'is_db' => true
                 ];
             }
         }
 
         if ($this->dryRun) {
             if ($existing) {
                 $this->parent->warnings[] = [
                     'row' => $index, 'name' => $data['supplier_name'] ?? 'Purchase', 'phone' => $invoice,
                     'reason' => $reason, 'is_db' => $dbData !== null, 'data' => $data,
                     'first_row_index' => $firstRowIndex,
                     'first_row_data' => $firstRowIndex ? ($this->seenData[$firstRowIndex] ?? null) : null,
                     'db_data' => $dbData
                 ];
                 if ($this->parent) $this->parent->updatedCount++;
             } else {
                 if ($this->parent) $this->parent->importedCount++;
             }
             return;
         }
 
         // Final Logic
         try {
             $date = Carbon::parse($data['date']);
         } catch (\Exception $e) {
             $date = Carbon::now();
         }
 
         $supplierId = null;
         if (!empty($data['supplier_phone'])) {
             $supplier = \App\Models\Supplier::firstOrCreate(
                 ['phone' => preg_replace('/[^0-9]/', '', $data['supplier_phone'])],
                 ['name' => $data['supplier_name'] ?? 'Unknown Supplier']
             );
             $supplierId = $supplier->id;
         } elseif (!empty($data['supplier_name'])) {
             $supplier = \App\Models\Supplier::firstOrCreate(['name' => $data['supplier_name']]);
             $supplierId = $supplier->id;
         }
 
         $product = null;
         if (!empty($data['product_sku'])) {
             $product = \App\Models\Product::where('sku', $data['product_sku'])->first();
         }
         if (!$product && !empty($data['product_name'])) {
             $product = \App\Models\Product::where('name', $data['product_name'])->first();
         }
 
         $qty = abs((float)($data['quantity'] ?? 1));
         $cost = abs((float)($data['cost_price'] ?? ($product ? $product->cost_price : 0)));
         $lineTotal = abs((float)($data['total'] ?? ($qty * $cost)));
 
         $purchase = \App\Models\Purchase::firstOrCreate(
             ['reference_number' => $invoice],
             [
                 'supplier_id' => $supplierId,
                 'user_id' => \Illuminate\Support\Facades\Auth::id() ?? (\App\Models\User::value('id') ?? 1),
                 'total' => 0, 'status' => 'received', 'payment_status' => 'paid', 'created_at' => $date,
             ]
         );
 
         if ($purchase->wasRecentlyCreated) {
             if ($this->parent) $this->parent->importedCount++;
         } else {
             if ($this->parent) $this->parent->updatedCount++;
         }
 
         if ($product) {
             \App\Models\PurchaseItem::create([
                 'purchase_id' => $purchase->id, 'product_id' => $product->id,
                 'quantity' => $qty, 'cost_price' => $cost, 'subtotal' => $lineTotal,
             ]);
             $purchase->increment('total', $lineTotal);
         }
     }
 }
