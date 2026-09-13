<?php
 
 namespace App\Imports;
 
 use Maatwebsite\Excel\Row;
 use Maatwebsite\Excel\Concerns\OnEachRow;
 use Maatwebsite\Excel\Concerns\WithMultipleSheets;
 use Illuminate\Support\Carbon;
 use Illuminate\Support\Str;
 
 class SalesImport implements WithMultipleSheets
 {
     protected array $mapping;
     public int $importedCount = 0;
     public int $updatedCount = 0;
     public array $warnings = [];
     protected bool $dryRun = false;
     protected array $overrides = [];
     protected array $ignoredRows = [];
     protected int|string $tenantId;
     protected int|string $userId;
 
     public function __construct(
         int|string $tenantId,
         int|string $userId,
         array $mapping = [], 
         bool $dryRun = false, 
         array $overrides = [], 
         array $ignoredRows = []
     ) {
         $this->tenantId = $tenantId;
         $this->userId = $userId;
         $this->mapping = $mapping;
         $this->dryRun = $dryRun;
         $this->overrides = $overrides;
         $this->ignoredRows = $ignoredRows;
     }
 
     public function sheets(): array
     {
         return [
             0 => new SalesDataSheetImport(
                 $this->tenantId,
                 $this->userId,
                 $this->mapping, 
                 $this, 
                 $this->dryRun, 
                 $this->overrides, 
                 $this->ignoredRows
             )
         ];
     }
 }
 
 class SalesDataSheetImport implements OnEachRow
 {
     protected int|string $tenantId;
     protected int|string $userId;
     protected array $mapping;
     protected ?SalesImport $parent;
     protected bool $dryRun = false;
     protected array $overrides = [];
     protected array $ignoredRows = [];
     protected array $seenInvoices = []; // invoice => row
     protected array $seenData = [];
 
     public function __construct(
         int|string $tenantId,
         int|string $userId,
         array $mapping = [], 
         ?SalesImport $parent = null, 
         bool $dryRun = false, 
         array $overrides = [], 
         array $ignoredRows = []
     ) {
         $this->tenantId = $tenantId;
         $this->userId = $userId;
         $this->parent = $parent;
         $this->dryRun = $dryRun;
         $this->overrides = $overrides;
         $this->ignoredRows = $ignoredRows;
         
         if (empty($mapping)) {
             $this->mapping = [
                 'invoice_number' => 0,
                 'date'           => 1,
                 'customer_phone' => 2,
                 'customer_name'  => 3,
                 'product_sku'    => 4,
                 'product_name'   => 5,
                 'quantity'       => 6,
                 'unit_price'     => 7,
                 'total'          => 8,
             ];
         } else {
             $this->mapping = $mapping;
         }
     }
 
     public function onRow(Row $row)
     {
         $index = $row->getIndex();
         // Skip template header/instructional rows (Title, Headers, Guide, Separator, Example)
         if ($index <= 3) return;
         if (in_array($index, $this->ignoredRows)) return;
 
         $numericArray = $row->toArray();
 
         // Check for branding markers
         if (isset($numericArray[0]) && is_string($numericArray[0])) {
             $firstCell = $numericArray[0];
             if (
                 str_contains($firstCell, 'VenQore ERP —') ||
                 str_contains($firstCell, 'Enter your') ||
                 str_contains($firstCell, 'Invoice Number')
             ) {
                 return;
             }
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
             $dbSale = \App\Models\Sale::where('tenant_id', $this->tenantId)
                 ->where('reference_number', $invoice)
                 ->first();
             if ($dbSale) {
                 $existing = true;
                 $reason = "Invoice #$invoice already exists in database (Sale ID: $dbSale->id)";
                 $dbData = [
                     'invoice_number' => $dbSale->reference_number,
                     'customer_name' => $dbSale->customer?->name ?? 'Unknown',
                     'total' => $dbSale->total,
                     'is_db' => true
                 ];
             }
         }
 
         if ($this->dryRun) {
             if ($existing) {
                 $this->parent->warnings[] = [
                     'row' => $index, 'name' => $data['customer_name'] ?? 'Sale', 'phone' => $invoice,
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
 
         // Parse Date
         try {
             $date = Carbon::parse($data['date']);
         } catch (\Exception $e) {
             $date = Carbon::now();
         }
 
         // Handle Customer
         $customerId = null;
         if (!empty($data['customer_phone'])) {
             $customer = \App\Models\Customer::firstOrCreate(
                 ['phone' => preg_replace('/[^0-9]/', '', $data['customer_phone']), 'tenant_id' => $this->tenantId],
                 ['name' => $data['customer_name'] ?? 'Unknown Customer', 'tenant_id' => $this->tenantId]
             );
             $customerId = $customer->id;
         } elseif (!empty($data['customer_name'])) {
             $customer = \App\Models\Customer::firstOrCreate(
                 ['name' => $data['customer_name'], 'tenant_id' => $this->tenantId],
                 ['tenant_id' => $this->tenantId]
             );
             $customerId = $customer->id;
         }
 
         // Handle Product
         $product = null;
         if (!empty($data['product_sku'])) {
             $product = \App\Models\Product::where('tenant_id', $this->tenantId)
                 ->where('sku', $data['product_sku'])
                 ->first();
         }
         if (!$product && !empty($data['product_name'])) {
             $product = \App\Models\Product::where('tenant_id', $this->tenantId)
                 ->where('name', $data['product_name'])
                 ->first();
         }
 
         $qty = abs((float)($data['quantity'] ?? 1));
         $price = abs((float)($data['unit_price'] ?? ($product ? $product->price : 0)));
         $lineTotal = abs((float)($data['total'] ?? ($qty * $price)));
 
         // Generate or find Sale
         $sale = \App\Models\Sale::firstOrCreate(
             ['reference_number' => $invoice, 'tenant_id' => $this->tenantId],
             [
                 'customer_id' => $customerId,
                 'user_id' => $this->userId,
                 'tenant_id' => $this->tenantId,
                 'subtotal' => 0,
                 'tax' => 0,
                 'discount' => 0,
                 'total' => 0,
                 'status' => 'completed',
                 'payment_status' => 'paid',
                 'payment_method' => 'cash',
                 'created_at' => $date,
                 'updated_at' => $date,
             ]
         );
 
         if ($sale->wasRecentlyCreated) {
             if ($this->parent) $this->parent->importedCount++;
         } else {
             if ($this->parent) $this->parent->updatedCount++;
         }
 
         // Add Sale Item if a product exists (or pseudo product)
         if ($product) {
             \App\Models\SaleItem::create([
                 'tenant_id' => $this->tenantId,
                 'sale_id' => $sale->id,
                 'product_id' => $product->id,
                 'quantity' => $qty,
                 'unit_price' => $price,
                 'subtotal' => $lineTotal,
             ]);
 
             // Update Sale Total
             $sale->increment('subtotal', $lineTotal);
             $sale->increment('total', $lineTotal);
         }
     }
 }
