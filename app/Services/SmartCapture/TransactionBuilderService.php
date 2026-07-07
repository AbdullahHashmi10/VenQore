<?php

namespace App\Services\SmartCapture;

use App\Models\Party;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\StockMovement;
use App\Models\Payment;
use App\Models\Proposal;
use App\Models\ProposalItem;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\RecurringInvoice;
use App\Models\DebitNote;
use App\Models\DebitNoteItem;
use App\Models\Supplier;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use App\Services\V3\SaleService;
use App\Services\V3\TaxService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class TransactionBuilderService
{
    public function __construct(
        private AccountingService $accounting,
        private FifoService       $fifo,
        private SaleService       $saleService,
        private TaxService        $tax
    ) {}

    /**
     * Build and confirm a transaction in the database.
     *
     * Expected $data:
     *  - action          : validated action string
     *  - party_id        : explicit, user-confirmed party id (required except for expense)
     *  - party           : legacy party name (fallback ONLY for exact tenant-scoped lookup)
     *  - payment_method  : cash | credit | bank
     *  - expense_category_id : required when action = expense
     *  - items[]         : { product_id | create_new:{name, unit_price, cost_price}, qty, unit_price, name }
     *  - append_to       : optional { type: proposal|pre_invoice|pre_purchase|recurring_invoice, id }
     */
    public function confirm(array $data): array
    {
        $tenantId = app('current.tenant')->id;
        $action = $data['action'];
        $paymentMethod = $data['payment_method'] ?? 'cash';
        $items = $data['items'] ?? [];
        $appendTo = $data['append_to'] ?? null;

        // 1. Resolve Party (Customer / Supplier) — explicit and user-confirmed.
        //    NO silent fallback to "first party": that silently mis-attributed
        //    transactions before. The UI must send party_id.
        $party = $this->resolveParty($data, $action, $tenantId);

        // 2. Resolve Warehouse (Default or first available)
        $warehouse = Warehouse::where('tenant_id', $tenantId)->orderByDesc('is_default')->first()
            ?? Warehouse::where('tenant_id', $tenantId)->first();

        if (!$warehouse) {
            throw new \Exception("No warehouses available. Please configure a warehouse first.");
        }

        return DB::transaction(function () use ($action, $party, $warehouse, $paymentMethod, $items, $tenantId, $data, $appendTo) {
            // 3. Create any user-confirmed NEW products first, so every line has a product_id.
            $items = $this->materializeNewProducts($items, $tenantId, $action);

            // 4. Append mode — add lines to an existing open/draft document.
            if ($appendTo && !empty($appendTo['id']) && !empty($appendTo['type'])) {
                return match ($appendTo['type']) {
                    'proposal'          => $this->appendToProposal($appendTo['id'], $items, $tenantId),
                    'pre_invoice'       => $this->appendToSalesOrder($appendTo['id'], $items, $tenantId, $warehouse),
                    'pre_purchase'      => $this->appendToPurchaseOrder($appendTo['id'], $items, $tenantId),
                    'recurring_invoice' => $this->appendToRecurringInvoice($appendTo['id'], $items, $tenantId),
                    default             => throw new \Exception("Appending to '{$appendTo['type']}' documents is not supported. Only draft/open documents (proposals, sales orders, purchase orders, recurring invoices) can be appended to."),
                };
            }

            switch ($action) {
                case 'purchase':
                    return $this->buildPurchase($party, $warehouse, $paymentMethod, $items, $tenantId);
                case 'sale':
                case 'invoice':
                    return $this->buildSale($party, $warehouse, $paymentMethod, $items);
                case 'expense':
                    return $this->buildExpense($items, $paymentMethod, $data);
                case 'return':
                    return $this->buildReturn($party, $items, $paymentMethod);
                case 'proposal':
                    return $this->buildProposal($party, $warehouse, $items);
                case 'pre_invoice':
                    return $this->buildPreInvoice($party, $warehouse, $items);
                case 'pre_purchase':
                    return $this->buildPrePurchase($party, $warehouse, $items, $tenantId);
                case 'recurring_invoice':
                    return $this->buildRecurringInvoice($party, $warehouse, $items);
                case 'purchase_return':
                    return $this->buildPurchaseReturn($party, $warehouse, $items);
                default:
                    throw new \Exception("Invalid transaction action: {$action}");
            }
        });
    }

    /**
     * Resolve the party strictly. Priority:
     *  1. Explicit party_id (must belong to this tenant).
     *  2. Exact (case-insensitive) tenant-scoped name match on the legacy 'party' field.
     * NEVER falls back to an arbitrary first party.
     */
    private function resolveParty(array $data, string $action, int|string $tenantId): ?Party
    {
        $type = in_array($action, ['purchase', 'pre_purchase', 'purchase_return']) ? 'supplier' : 'customer';

        if (!empty($data['party_id'])) {
            $party = Party::where('tenant_id', $tenantId)
                ->where('id', $data['party_id'])
                ->first();

            if (!$party) {
                throw new \Exception('Selected party was not found in this store.');
            }

            return $party;
        }

        $name = $data['party'] ?? null;
        if ($name) {
            return Party::where('tenant_id', $tenantId)
                ->where('type', $type)
                ->whereRaw('LOWER(name) = ?', [mb_strtolower(trim($name))])
                ->first();
        }

        return null;
    }

    /**
     * Create user-confirmed new products for lines flagged create_new, and
     * verify all other product_ids belong to this tenant.
     */
    private function materializeNewProducts(array $items, int|string $tenantId, string $action): array
    {
        foreach ($items as $idx => $item) {
            if (!empty($item['create_new']) && is_array($item['create_new'])) {
                $new = $item['create_new'];
                $name = trim((string) ($new['name'] ?? ''));

                if ($name === '') {
                    throw new \Exception('New product name cannot be empty.');
                }

                // Reuse an identically-named product instead of duplicating
                $existing = Product::where('tenant_id', $tenantId)
                    ->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])
                    ->first();

                $isPurchaseSide = in_array($action, ['purchase', 'pre_purchase', 'purchase_return']);
                $linePrice = (float) ($item['unit_price'] ?? 0);

                $product = $existing ?? Product::create([
                    'tenant_id'  => $tenantId,
                    'name'       => $name,
                    'sku'        => $new['sku'] ?? ('AI-' . strtoupper(Str::random(8))),
                    'price'      => (float) ($new['price'] ?? ($isPurchaseSide ? 0 : $linePrice)),
                    'cost_price' => (float) ($new['cost_price'] ?? ($isPurchaseSide ? $linePrice : 0)),
                ]);

                $items[$idx]['product_id'] = $product->id;
                unset($items[$idx]['create_new']);
            } elseif ($action !== 'expense') {
                // Tenant-isolation guard: the product must belong to this store
                $ok = Product::where('tenant_id', $tenantId)
                    ->where('id', $item['product_id'] ?? '')
                    ->exists();
                if (!$ok) {
                    throw new \Exception('One of the selected products does not belong to this store.');
                }
            }
        }

        return $items;
    }

    /**
     * Build standard purchase transaction.
     */
    private function buildPurchase(?Party $supplier, Warehouse $warehouse, string $paymentMethod, array $items, int $tenantId): array
    {
        $purchaseId = Str::uuid()->toString();
        $invoiceNumber = 'PUR-' . strtoupper(Str::random(8));

        $subtotal = 0.00;
        $taxTotal = 0.00;
        $itcTotal = 0.00;
        $expTotal = 0.00;
        $lineItems = [];

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $qty = (float) $item['qty'];
            $unitCost = (float) ($item['unit_price'] ?? $product->cost_price ?? 0);
            
            $lineCost = round($qty * $unitCost, 2);
            $businessPct = 100.0; // default full ITC

            $taxCalc = $this->tax->calculateLineTax(
                amount: $lineCost,
                taxRate: $product->tax_rate ?? 0,
                priceIncludesTax: false
            );

            $recoverableTax = round($taxCalc['tax'] * ($businessPct / 100), 2);
            $nonRecoverableTax = round($taxCalc['tax'] - $recoverableTax, 2);

            $subtotal += $taxCalc['net'];
            $taxTotal += $taxCalc['tax'];
            $itcTotal += $recoverableTax;
            $expTotal += $nonRecoverableTax;

            $lineItems[] = [
                'product_id' => $product->id,
                'qty' => $qty,
                'unit_cost' => $unitCost,
                'tax_rate' => $product->tax_rate ?? 0,
                'business_pct' => $businessPct,
                'line_total' => $lineCost,
                'tax_amount' => $taxCalc['tax'],
                'recoverable_tax' => $recoverableTax,
                'nonrecoverable_tax' => $nonRecoverableTax,
            ];
        }

        $grandTotal = round($subtotal + $taxTotal, 2);
        $supplierId = $supplier?->id ?? Party::where('tenant_id', $tenantId)->where('type', 'supplier')->value('id');

        if (!$supplierId) {
            throw new \Exception("Supplier is required to record a purchase.");
        }

        // Journal Entry lines
        $journalLines = [
            ['account_code' => '1100', 'debit' => $subtotal, 'credit' => 0],
        ];

        if ($itcTotal > 0) {
            $journalLines[] = ['account_code' => '2300', 'debit' => $itcTotal, 'credit' => 0];
        }

        if ($expTotal > 0) {
            $journalLines[] = ['account_code' => '6000', 'debit' => $expTotal, 'credit' => 0];
        }

        if ($paymentMethod === 'cash') {
            $journalLines[] = [
                'account_code' => '1000',
                'debit' => 0,
                'credit' => $grandTotal,
                'party_id' => $supplierId
            ];
            $paymentStatus = 'paid';
        } else {
            $journalLines[] = [
                'account_code' => '2000',
                'debit' => 0,
                'credit' => $grandTotal,
                'party_id' => $supplierId
            ];
            $paymentStatus = 'unpaid';
        }

        // Post Journal Entry
        $journalEntry = $this->accounting->createEntry([
            'date' => now()->toDateString(),
            'reference_type' => 'purchase',
            'reference' => $purchaseId,
            'description' => "SmartCapture purchase — {$invoiceNumber}",
            'party_id' => $supplierId,
        ], $journalLines);

        // Save Purchase record
        DB::table('purchases')->insert([
            'id' => $purchaseId,
            'tenant_id' => $tenantId,
            'invoice_number' => $invoiceNumber,
            'party_id' => $supplierId,
            'warehouse_id' => $warehouse->id,
            'purchase_date' => now()->toDateString(),
            'subtotal' => $subtotal,
            'tax' => $taxTotal,
            'total' => $grandTotal,
            'payment_status' => $paymentStatus,
            'payment_method' => $paymentMethod,
            'journal_entry_id' => $journalEntry->id,
            'created_by' => Auth::id() ?? 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Save purchase items & inventory batches
        foreach ($lineItems as $item) {
            $itemId = Str::uuid()->toString();

            DB::table('purchase_items')->insert([
                'id' => $itemId,
                'tenant_id' => $tenantId,
                'purchase_id' => $purchaseId,
                'product_id' => $item['product_id'],
                'qty' => $item['qty'],
                'unit_cost' => $item['unit_cost'],
                'tax_rate' => $item['tax_rate'],
                'business_pct' => $item['business_pct'],
                'line_total' => $item['line_total'],
                'created_at' => now(),
            ]);

            // receive FIFO stock batch
            $batch = $this->fifo->receiveBatch(
                productId: $item['product_id'],
                warehouseId: $warehouse->id,
                qty: (float) $item['qty'],
                unitCost: (float) $item['unit_cost'],
                batchType: 'purchase',
                purchaseId: $purchaseId
            );

            DB::table('purchase_items')
                ->where('id', $itemId)
                ->update(['inventory_batch_id' => $batch->id]);
        }

        return [
            'success' => true,
            'type' => 'purchase',
            'id' => $purchaseId,
            'reference' => $invoiceNumber,
            'total' => $grandTotal
        ];
    }

    /**
     * Build standard sales transaction.
     */
    private function buildSale(?Party $customer, Warehouse $warehouse, string $paymentMethod, array $items): array
    {
        $tenantId = app('current.tenant')->id;
        $customerId = $customer?->id ?? Party::where('tenant_id', $tenantId)->where('type', 'customer')->value('id');

        if (!$customerId) {
            throw new \Exception("Customer context is required to record a sale.");
        }

        $saleData = [
            'customer_id' => $customerId,
            'warehouse_id' => $warehouse->id,
            'sale_date' => now()->toDateString(),
            'payment_method' => $paymentMethod,
            'items' => array_map(function ($item) {
                $product = Product::findOrFail($item['product_id']);
                return [
                    'product_id' => $product->id,
                    'qty' => (float) $item['qty'],
                    'sale_uom' => $product->base_unit ?? 'pcs',
                    'unit_price' => (float) ($item['unit_price'] ?? $product->price ?? 0),
                    'discount_percent' => 0,
                    'tax_rate' => $product->tax_rate ?? 0,
                ];
            }, $items)
        ];

        $sale = $this->saleService->post($saleData);

        return [
            'success' => true,
            'type' => 'sale',
            'id' => $sale->id,
            'reference' => $sale->reference_number,
            'total' => (float) $sale->total
        ];
    }

    /**
     * Build operating expense transaction.
     *
     * Creates a REAL Expense record (with its required category) exactly like the
     * Expenses module does, plus the double-entry journal and Activity log — so
     * AI-captured expenses show up in the Expenses screen and P&L consistently.
     */
    private function buildExpense(array $items, string $paymentMethod, array $data = []): array
    {
        $tenantId = app('current.tenant')->id;

        $categoryId = $data['expense_category_id'] ?? null;
        if (!$categoryId) {
            throw new \Exception('An expense category is required. Please pick the category this expense belongs to.');
        }

        $category = \App\Models\ExpenseCategory::where('tenant_id', $tenantId)
            ->where('id', $categoryId)
            ->first();

        if (!$category) {
            throw new \Exception('Selected expense category was not found in this store.');
        }

        $amount = 0.00;
        $descriptionLines = [];

        foreach ($items as $item) {
            $amount += (float) ($item['unit_price'] ?? 0) * (float) ($item['qty'] ?? 1);
            $descriptionLines[] = ($item['name'] ?? 'General item') . ' (Qty: ' . ($item['qty'] ?? 1) . ')';
        }

        if ($amount <= 0) {
            throw new \Exception('Expense amount must be greater than zero.');
        }

        $description = implode(', ', $descriptionLines) ?: 'SmartCapture Operating Expense';

        // Expenses support cash | bank only — map anything else to cash.
        $method = $paymentMethod === 'bank' ? 'bank' : 'cash';
        $totalPaid = round($amount, 2);

        $expense = \App\Models\Expense::create([
            'tenant_id'           => $tenantId,
            'date'                => $data['date'] ?? now()->toDateString(),
            'expense_category_id' => $category->id,
            'category'            => $category->name,
            'amount'              => $totalPaid,
            'tax_amount'          => 0,
            'payment_method'      => $method,
            'payee'               => $data['party'] ?? null,
            'reference'           => $data['reference'] ?? null,
            'description'         => $description,
            'notes'               => 'Created via AI Scan (SmartCapture)',
        ]);

        $cashAccount = $method === 'bank' ? '1010' : '1000';

        $this->accounting->createEntry([
            'date'           => $expense->date instanceof \Carbon\Carbon ? $expense->date->toDateString() : (string) $expense->date,
            'reference_type' => 'expense',
            'reference'      => $expense->id,
            'description'    => "{$category->name}: {$description}",
        ], [
            ['account_code' => '6000', 'debit' => $totalPaid, 'credit' => 0],
            ['account_code' => $cashAccount, 'debit' => 0, 'credit' => $totalPaid],
        ]);

        try {
            \App\Models\Activity::create([
                'type'           => 'expense',
                'description'    => 'Expense: ' . $description,
                'amount'         => $totalPaid,
                'reference_id'   => $expense->id,
                'reference_type' => 'expense',
                'user_id'        => Auth::id(),
                'tenant_id'      => $tenantId,
            ]);
        } catch (\Exception $e) {
            // Activity logging is best-effort
        }

        return [
            'success' => true,
            'type' => 'expense',
            'id' => $expense->id,
            'reference' => $expense->reference ?? ('EXP-' . strtoupper(Str::random(8))),
            'total' => $totalPaid
        ];
    }

    /**
     * Build return transaction (Sale return).
     */
    private function buildReturn(?Party $customer, array $items, string $paymentMethod): array
    {
        $tenantId = app('current.tenant')->id;
        $customerId = $customer?->id ?? Party::where('tenant_id', $tenantId)->where('type', 'customer')->value('id');

        if (!$customerId) {
            throw new \Exception("Customer context is required to process a return.");
        }

        $subtotal = 0;
        $itemsData = [];

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $qty = (float) $item['qty'];
            $price = (float) ($item['unit_price'] ?? $product->price ?? 0);
            $lineTotal = round($qty * $price, 2);
            
            $subtotal += $lineTotal;

            $itemsData[] = [
                'product_id' => $product->id,
                'quantity' => $qty,
                'price' => $price,
                'total' => $lineTotal
            ];
        }

        $reference = 'RET-' . date('ymd') . '-' . str_pad(Sale::whereDate('created_at', today())->count() + 1, 3, '0', STR_PAD_LEFT);
        
        $sale = Sale::forceCreate([
            'reference_number' => $reference,
            'party_id' => $customerId,
            'user_id' => Auth::id() ?? 1,
            'warehouse_id' => Warehouse::where('tenant_id', $tenantId)->orderByDesc('is_default')->value('id') ?? 1,
            'subtotal' => -$subtotal,
            'tax' => 0,
            'discount' => 0,
            'total' => -$subtotal,
            'net_sales' => -$subtotal,
            'subtotal_gross' => -$subtotal,
            'tendered_amount' => 0,
            'change_return' => 0,
            'status' => 'returned',
            'payment_status' => 'refunded',
            'payment_method' => $paymentMethod,
            'notes' => 'SmartCapture Auto Return',
            'posted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
            'tenant_id' => $tenantId
        ]);

        $warehouseId = $sale->warehouse_id;
        $totalCogs = 0;

        foreach ($itemsData as $data) {
            $productRecord = Product::find($data['product_id']);

            $saleItem = SaleItem::create([
                'sale_id' => $sale->id,
                'product_id' => $data['product_id'],
                'quantity' => -$data['quantity'],
                'unit_price' => $data['price'],
                'subtotal' => -$data['total'],
                'net_amount' => -$data['total'],
                'cost_price' => $productRecord?->cost_price ?? 0,
                'tenant_id' => $tenantId
            ]);

            // Legacy path: receive as return batch at product cost
            $unitCost = $productRecord?->cost_price ?? $data['price'];
            $this->fifo->receiveBatch(
                productId: $data['product_id'],
                warehouseId: $warehouseId,
                qty: $data['quantity'],
                unitCost: $unitCost,
                batchType: 'return'
            );
            $totalCogs += $data['quantity'] * $unitCost;

            // Log stock movement
            StockMovement::create([
                'product_id' => $data['product_id'],
                'warehouse_id' => $warehouseId,
                'type' => 'return',
                'quantity' => $data['quantity'],
                'reference_id' => $reference,
                'description' => 'Return #' . $sale->id,
                'user_id' => Auth::id() ?? 1,
                'tenant_id' => $tenantId
            ]);
        }

        // Create accounting entry
        $journalItems = [];

        // DR: Sales Revenue
        $salesAccount = $this->accounting->getAccountByCode('4000', 'Sales Revenue', 'income');
        $journalItems[] = [
            'account_id' => $salesAccount->id,
            'debit' => $subtotal,
            'credit' => 0,
            'description' => "Return for Sale #{$sale->reference_number}",
            'party_id' => $sale->party_id,
        ];

        // CR: Cash / AR
        if ($paymentMethod === 'credit') {
            Payment::create([
                'sale_id' => $sale->id,
                'amount' => -$subtotal,
                'method' => 'store_credit',
                'type' => 'out',
                'date' => today()->toDateString(),
                'reference' => 'Store Credit Issued',
                'tenant_id' => $tenantId
            ]);
            
            $receivablesAccount = $this->accounting->getAccountByCode('1200', 'Accounts Receivable', 'asset');
            $journalItems[] = [
                'account_id' => $receivablesAccount->id,
                'debit' => 0,
                'credit' => $subtotal,
                'description' => "Return (Store Credit) for Sale #{$sale->reference_number}",
                'party_id' => $sale->party_id,
            ];
        } else {
            Payment::create([
                'sale_id' => $sale->id,
                'amount' => -$subtotal,
                'method' => 'cash',
                'type' => 'out',
                'date' => today()->toDateString(),
                'reference' => 'Cash Refund',
                'tenant_id' => $tenantId
            ]);
            
            $cashAccount = $this->accounting->getAccountByCode('1000', 'Cash in Hand', 'asset');
            $journalItems[] = [
                'account_id' => $cashAccount->id,
                'debit' => 0,
                'credit' => $subtotal,
                'description' => "Cash Refund for Sale #{$sale->reference_number}",
                'party_id' => $sale->party_id,
            ];
        }

        // Reversal of COGS
        if ($totalCogs > 0) {
            $cogsAccount = $this->accounting->getAccountByCode('5000', 'Cost of Goods Sold', 'expense');
            $journalItems[] = [
                'account_id' => $cogsAccount->id,
                'debit' => 0,
                'credit' => $totalCogs,
                'description' => "COGS reversal for Return #{$sale->reference_number}",
            ];
            
            $inventoryAccount = $this->accounting->getAccountByCode('1100', 'Inventory Asset', 'asset');
            $journalItems[] = [
                'account_id' => $inventoryAccount->id,
                'debit' => $totalCogs,
                'credit' => 0,
                'description' => "Inventory addition for Return #{$sale->reference_number}",
            ];
        }

        $this->accounting->createEntry([
            'date' => today()->toDateString(),
            'reference_type' => 'sale_return',
            'reference' => $sale->id,
            'description' => "Auto journal — Return #{$sale->reference_number}",
            'party_id' => $sale->party_id,
        ], $journalItems);

        return [
            'success' => true,
            'type' => 'return',
            'id' => $sale->id,
            'reference' => $reference,
            'total' => -$subtotal
        ];
    }

    /**
     * Build customer proposal (estimate/quote).
     */
    private function buildProposal(?Party $customer, Warehouse $warehouse, array $items): array
    {
        $tenantId = app('current.tenant')->id;
        $customerId = $customer?->id ?? Party::where('tenant_id', $tenantId)->where('type', 'customer')->value('id');

        if (!$customerId) {
            throw new \Exception("Customer context is required to record a proposal.");
        }

        $totalAmount = 0.00;
        $taxAmount = 0.00;
        $lineItems = [];

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $qty = (float) $item['qty'];
            $price = (float) ($item['unit_price'] ?? $product->price ?? 0);
            $cost = (float) ($product->cost_price ?? 0);
            $lineTotal = round($qty * $price, 2);

            $taxCalc = $this->tax->calculateLineTax(
                amount: $lineTotal,
                taxRate: $product->tax_rate ?? 0,
                priceIncludesTax: false
            );

            $totalAmount += $lineTotal;
            $taxAmount += $taxCalc['tax'];

            $lineItems[] = [
                'id' => Str::uuid()->toString(),
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => $qty,
                'unit_price' => $price,
                'unit_cost' => $cost,
                'total' => $lineTotal,
                'tax_rate' => $product->tax_rate ?? 0,
                'discount' => 0,
                'tenant_id' => $tenantId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $proposalId = Str::uuid()->toString();
        $reference = 'PROP-' . strtoupper(Str::random(8));

        DB::table('proposals')->insert([
            'id' => $proposalId,
            'tenant_id' => $tenantId,
            'reference_number' => $reference,
            'customer_id' => $customerId,
            'customer_name' => $customer?->name ?? Party::find($customerId)?->name,
            'valid_until' => now()->addDays(30)->toDateString(),
            'status' => 'draft',
            'total_amount' => $totalAmount,
            'tax_amount' => $taxAmount,
            'discount_amount' => 0,
            'estimated_cost' => 0,
            'expected_margin' => 0,
            'user_id' => Auth::id() ?? 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($lineItems as $item) {
            $item['proposal_id'] = $proposalId;
            DB::table('proposal_items')->insert($item);
        }

        return [
            'success' => true,
            'type' => 'proposal',
            'id' => $proposalId,
            'reference' => $reference,
            'total' => $totalAmount
        ];
    }

    /**
     * Build customer sales order (pre-invoice).
     */
    private function buildPreInvoice(?Party $customer, Warehouse $warehouse, array $items): array
    {
        $tenantId = app('current.tenant')->id;
        $customerId = $customer?->id ?? Party::where('tenant_id', $tenantId)->where('type', 'customer')->value('id');

        if (!$customerId) {
            throw new \Exception("Customer context is required to record a pre-invoice.");
        }

        $totalAmount = 0.00;
        $lineItems = [];

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $qty = (float) $item['qty'];
            $price = (float) ($item['unit_price'] ?? $product->price ?? 0);
            $lineTotal = round($qty * $price, 2);

            $totalAmount += $lineTotal;

            // Reserve stock up to available inventory
            $currentStock = DB::table('stocks')
                ->where('tenant_id', $tenantId)
                ->where('product_id', $product->id)
                ->where('warehouse_id', $warehouse->id)
                ->first();
            $available = $currentStock ? max(0, (float)$currentStock->quantity - (float)$currentStock->reserved_quantity) : 0;
            $reserved = min($qty, $available);

            if ($reserved > 0) {
                DB::table('stocks')
                    ->where('id', $currentStock->id)
                    ->update([
                        'reserved_quantity' => DB::raw('reserved_quantity + ' . $reserved)
                    ]);
            }

            $lineItems[] = [
                'id' => Str::uuid()->toString(),
                'product_id' => $product->id,
                'name' => $product->name,
                'quantity_requested' => $qty,
                'quantity_reserved' => $reserved,
                'unit_price' => $price,
                'discount' => 0,
                'discount_type' => 'fixed',
                'subtotal' => $lineTotal,
                'tenant_id' => $tenantId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $orderId = Str::uuid()->toString();
        $orderNumber = 'SO-' . strtoupper(Str::random(8));

        DB::table('sales_orders')->insert([
            'id' => $orderId,
            'tenant_id' => $tenantId,
            'order_number' => $orderNumber,
            'customer_id' => $customerId,
            'party_id' => $customerId,
            'customer_name' => $customer?->name ?? Party::find($customerId)?->name,
            'order_date' => now()->toDateString(),
            'delivery_date' => now()->addDays(7)->toDateString(),
            'status' => 'pending',
            'total_amount' => $totalAmount,
            'discount' => 0,
            'tax' => 0,
            'delivery_charge' => 0,
            'extra_charge_value' => 0,
            'extra_charge_label' => null,
            'notes' => 'SmartCapture auto-generated sales order',
            'user_id' => Auth::id() ?? 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($lineItems as $item) {
            $item['sales_order_id'] = $orderId;
            DB::table('sales_order_items')->insert($item);
        }

        return [
            'success' => true,
            'type' => 'pre_invoice',
            'id' => $orderId,
            'reference' => $orderNumber,
            'total' => $totalAmount
        ];
    }

    /**
     * Build purchase order to supplier (pre-purchase).
     */
    private function buildPrePurchase(?Party $supplier, Warehouse $warehouse, array $items, int $tenantId): array
    {
        $resolvedSupplier = $this->resolveSupplier($supplier?->name, $tenantId);

        if (!$resolvedSupplier) {
            throw new \Exception("Supplier is required to record a purchase order.");
        }

        $totalAmount = 0.00;
        $lineItems = [];

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $qty = (float) $item['qty'];
            $cost = (float) ($item['unit_price'] ?? $product->cost_price ?? 0);
            $lineTotal = round($qty * $cost, 2);

            $totalAmount += $lineTotal;

            $lineItems[] = [
                'id' => Str::uuid()->toString(),
                'product_id' => $product->id,
                'quantity' => $qty,
                'unit_cost' => $cost,
                'total_cost' => $lineTotal,
                'received_quantity' => 0,
                'tenant_id' => $tenantId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $orderId = Str::uuid()->toString();
        $reference = 'PO-' . strtoupper(Str::random(8));

        DB::table('purchase_orders')->insert([
            'id' => $orderId,
            'tenant_id' => $tenantId,
            'supplier_id' => $resolvedSupplier->id,
            'warehouse_id' => $warehouse->id,
            'reference_number' => $reference,
            'status' => 'ordered',
            'order_date' => now()->toDateString(),
            'expected_delivery_date' => now()->addDays(7)->toDateString(),
            'total_amount' => $totalAmount,
            'notes' => 'SmartCapture auto-generated purchase order',
            'user_id' => Auth::id() ?? 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($lineItems as $item) {
            $item['purchase_order_id'] = $orderId;
            DB::table('purchase_order_items')->insert($item);
        }

        return [
            'success' => true,
            'type' => 'pre_purchase',
            'id' => $orderId,
            'reference' => $reference,
            'total' => $totalAmount
        ];
    }

    /**
     * Build recurring invoice template.
     */
    private function buildRecurringInvoice(?Party $customer, Warehouse $warehouse, array $items): array
    {
        $tenantId = app('current.tenant')->id;
        $customerId = $customer?->id ?? Party::where('tenant_id', $tenantId)->where('type', 'customer')->value('id');

        if (!$customerId) {
            throw new \Exception("Customer context is required to record a recurring invoice.");
        }

        $itemsJson = [];
        $totalAmount = 0.00;

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $qty = (float) $item['qty'];
            $price = (float) ($item['unit_price'] ?? $product->price ?? 0);
            $lineTotal = round($qty * $price, 2);

            $totalAmount += $lineTotal;

            $itemsJson[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'qty' => $qty,
                'unit_price' => $price,
            ];
        }

        $recurringId = Str::uuid()->toString();
        $reference = 'REC-' . strtoupper(Str::random(8));

        DB::table('recurring_invoices')->insert([
            'id' => $recurringId,
            'tenant_id' => $tenantId,
            'customer_id' => $customerId,
            'warehouse_id' => $warehouse->id,
            'frequency' => 'monthly',
            'items' => json_encode($itemsJson),
            'next_run_date' => now()->addMonth()->toDateString(),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return [
            'success' => true,
            'type' => 'recurring_invoice',
            'id' => $recurringId,
            'reference' => $reference,
            'total' => $totalAmount
        ];
    }

    /**
     * Build supplier purchase return (debit note).
     */
    private function buildPurchaseReturn(?Party $supplier, Warehouse $warehouse, array $items): array
    {
        $tenantId = app('current.tenant')->id;
        $supplierId = $supplier?->id ?? Party::where('tenant_id', $tenantId)->where('type', 'supplier')->value('id');

        if (!$supplierId) {
            throw new \Exception("Supplier context is required to process a purchase return.");
        }

        $totalAmount = 0.00;
        $lineItems = [];

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $qty = (float) $item['qty'];
            $price = (float) ($item['unit_price'] ?? $product->cost_price ?? 0);
            $lineTotal = round($qty * $price, 2);

            $totalAmount += $lineTotal;

            // Decrement quantity in stocks
            $currentStock = DB::table('stocks')
                ->where('tenant_id', $tenantId)
                ->where('product_id', $product->id)
                ->where('warehouse_id', $warehouse->id)
                ->first();

            if ($currentStock) {
                DB::table('stocks')
                    ->where('id', $currentStock->id)
                    ->update([
                        'quantity' => DB::raw('quantity - ' . $qty)
                    ]);
            }

            $lineItems[] = [
                'id' => Str::uuid()->toString(),
                'product_id' => $product->id,
                'quantity' => $qty,
                'unit_price' => $price,
                'subtotal' => $lineTotal,
                'tenant_id' => $tenantId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $debitNoteId = Str::uuid()->toString();
        $reference = 'DN-' . strtoupper(Str::random(8));

        DB::table('debit_notes')->insert([
            'id' => $debitNoteId,
            'tenant_id' => $tenantId,
            'reference_number' => $reference,
            'supplier_id' => $supplierId,
            'purchase_id' => null,
            'date' => now()->toDateString(),
            'amount' => $totalAmount,
            'reason' => 'SmartCapture auto return',
            'status' => 'approved',
            'created_by' => Auth::id() ?? 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        foreach ($lineItems as $item) {
            $item['debit_note_id'] = $debitNoteId;

            // Log stock movement
            StockMovement::create([
                'product_id' => $item['product_id'],
                'warehouse_id' => $warehouse->id,
                'type' => 'purchase_return',
                'quantity' => -$item['quantity'],
                'reference_id' => $reference,
                'description' => 'Purchase Return #' . $debitNoteId,
                'user_id' => Auth::id() ?? 1,
                'tenant_id' => $tenantId
            ]);

            DB::table('debit_note_items')->insert($item);
        }

        return [
            'success' => true,
            'type' => 'purchase_return',
            'id' => $debitNoteId,
            'reference' => $reference,
            'total' => $totalAmount
        ];
    }

    // ─────────────────────────────────────────────────────────────────────────
    // APPEND MODE — add AI-captured lines to an existing open/draft document.
    // Posted sales/purchases are intentionally NOT appendable (accounting-safe).
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Append items to an existing draft/sent proposal and refresh its totals.
     */
    private function appendToProposal(string $proposalId, array $items, int|string $tenantId): array
    {
        $proposal = DB::table('proposals')
            ->where('tenant_id', $tenantId)
            ->where('id', $proposalId)
            ->first();

        if (!$proposal) {
            throw new \Exception('Proposal not found in this store.');
        }
        if (!in_array($proposal->status, ['draft', 'sent', 'pending'])) {
            throw new \Exception("Only draft or sent proposals can be appended to (this one is '{$proposal->status}').");
        }

        $addedAmount = 0.00;
        $addedTax = 0.00;

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $qty = (float) $item['qty'];
            $price = (float) ($item['unit_price'] ?? $product->price ?? 0);
            $lineTotal = round($qty * $price, 2);

            $taxCalc = $this->tax->calculateLineTax(
                amount: $lineTotal,
                taxRate: $product->tax_rate ?? 0,
                priceIncludesTax: false
            );

            $addedAmount += $lineTotal;
            $addedTax += $taxCalc['tax'];

            DB::table('proposal_items')->insert([
                'id'           => Str::uuid()->toString(),
                'proposal_id'  => $proposal->id,
                'product_id'   => $product->id,
                'product_name' => $product->name,
                'quantity'     => $qty,
                'unit_price'   => $price,
                'unit_cost'    => (float) ($product->cost_price ?? 0),
                'total'        => $lineTotal,
                'tax_rate'     => $product->tax_rate ?? 0,
                'discount'     => 0,
                'tenant_id'    => $tenantId,
                'created_at'   => now(),
                'updated_at'   => now(),
            ]);
        }

        DB::table('proposals')->where('id', $proposal->id)->update([
            'total_amount' => DB::raw('total_amount + ' . $addedAmount),
            'tax_amount'   => DB::raw('tax_amount + ' . $addedTax),
            'updated_at'   => now(),
        ]);

        return [
            'success'   => true,
            'type'      => 'proposal',
            'id'        => $proposal->id,
            'reference' => $proposal->reference_number,
            'total'     => round(((float) $proposal->total_amount) + $addedAmount, 2),
            'appended'  => count($items),
        ];
    }

    /**
     * Append items to an existing pending sales order (pre-invoice), reserving stock.
     */
    private function appendToSalesOrder(string $orderId, array $items, int|string $tenantId, Warehouse $warehouse): array
    {
        $order = DB::table('sales_orders')
            ->where('tenant_id', $tenantId)
            ->where('id', $orderId)
            ->first();

        if (!$order) {
            throw new \Exception('Sales order not found in this store.');
        }
        if (!in_array($order->status, ['pending', 'draft', 'confirmed'])) {
            throw new \Exception("Only open sales orders can be appended to (this one is '{$order->status}').");
        }

        $addedAmount = 0.00;

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $qty = (float) $item['qty'];
            $price = (float) ($item['unit_price'] ?? $product->price ?? 0);
            $lineTotal = round($qty * $price, 2);
            $addedAmount += $lineTotal;

            // Reserve stock up to available inventory (same rules as creating a new order)
            $currentStock = DB::table('stocks')
                ->where('tenant_id', $tenantId)
                ->where('product_id', $product->id)
                ->where('warehouse_id', $warehouse->id)
                ->first();
            $available = $currentStock ? max(0, (float) $currentStock->quantity - (float) $currentStock->reserved_quantity) : 0;
            $reserved = min($qty, $available);

            if ($reserved > 0) {
                DB::table('stocks')
                    ->where('id', $currentStock->id)
                    ->update(['reserved_quantity' => DB::raw('reserved_quantity + ' . $reserved)]);
            }

            DB::table('sales_order_items')->insert([
                'id'                 => Str::uuid()->toString(),
                'sales_order_id'     => $order->id,
                'product_id'         => $product->id,
                'name'               => $product->name,
                'quantity_requested' => $qty,
                'quantity_reserved'  => $reserved,
                'unit_price'         => $price,
                'discount'           => 0,
                'discount_type'      => 'fixed',
                'subtotal'           => $lineTotal,
                'tenant_id'          => $tenantId,
                'created_at'         => now(),
                'updated_at'         => now(),
            ]);
        }

        DB::table('sales_orders')->where('id', $order->id)->update([
            'total_amount' => DB::raw('total_amount + ' . $addedAmount),
            'updated_at'   => now(),
        ]);

        return [
            'success'   => true,
            'type'      => 'pre_invoice',
            'id'        => $order->id,
            'reference' => $order->order_number,
            'total'     => round(((float) $order->total_amount) + $addedAmount, 2),
            'appended'  => count($items),
        ];
    }

    /**
     * Append items to an existing open purchase order (pre-purchase).
     */
    private function appendToPurchaseOrder(string $orderId, array $items, int|string $tenantId): array
    {
        $order = DB::table('purchase_orders')
            ->where('tenant_id', $tenantId)
            ->where('id', $orderId)
            ->first();

        if (!$order) {
            throw new \Exception('Purchase order not found in this store.');
        }
        if (!in_array($order->status, ['draft', 'ordered', 'pending'])) {
            throw new \Exception("Only open purchase orders can be appended to (this one is '{$order->status}').");
        }

        $addedAmount = 0.00;

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $qty = (float) $item['qty'];
            $cost = (float) ($item['unit_price'] ?? $product->cost_price ?? 0);
            $lineTotal = round($qty * $cost, 2);
            $addedAmount += $lineTotal;

            DB::table('purchase_order_items')->insert([
                'id'                => Str::uuid()->toString(),
                'purchase_order_id' => $order->id,
                'product_id'        => $product->id,
                'quantity'          => $qty,
                'unit_cost'         => $cost,
                'total_cost'        => $lineTotal,
                'received_quantity' => 0,
                'tenant_id'         => $tenantId,
                'created_at'        => now(),
                'updated_at'        => now(),
            ]);
        }

        DB::table('purchase_orders')->where('id', $order->id)->update([
            'total_amount' => DB::raw('total_amount + ' . $addedAmount),
            'updated_at'   => now(),
        ]);

        return [
            'success'   => true,
            'type'      => 'pre_purchase',
            'id'        => $order->id,
            'reference' => $order->reference_number,
            'total'     => round(((float) $order->total_amount) + $addedAmount, 2),
            'appended'  => count($items),
        ];
    }

    /**
     * Append items to an existing active recurring invoice template (items JSON merge).
     */
    private function appendToRecurringInvoice(string $recurringId, array $items, int|string $tenantId): array
    {
        $recurring = DB::table('recurring_invoices')
            ->where('tenant_id', $tenantId)
            ->where('id', $recurringId)
            ->first();

        if (!$recurring) {
            throw new \Exception('Recurring invoice not found in this store.');
        }
        if (!in_array($recurring->status, ['active', 'paused', 'draft'])) {
            throw new \Exception("This recurring invoice cannot be modified (status '{$recurring->status}').");
        }

        $existingItems = json_decode($recurring->items ?? '[]', true) ?: [];
        $addedAmount = 0.00;

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $qty = (float) $item['qty'];
            $price = (float) ($item['unit_price'] ?? $product->price ?? 0);
            $addedAmount += round($qty * $price, 2);

            $existingItems[] = [
                'product_id' => $product->id,
                'name'       => $product->name,
                'qty'        => $qty,
                'unit_price' => $price,
            ];
        }

        DB::table('recurring_invoices')->where('id', $recurring->id)->update([
            'items'      => json_encode($existingItems),
            'updated_at' => now(),
        ]);

        return [
            'success'   => true,
            'type'      => 'recurring_invoice',
            'id'        => $recurring->id,
            'reference' => 'REC-UPDATED',
            'total'     => $addedAmount,
            'appended'  => count($items),
        ];
    }

    /**
     * Resolve a Supplier model from name or fallback.
     */
    private function resolveSupplier(?string $name, int $tenantId): ?Supplier
    {
        if (!$name) {
            $supplier = Supplier::where('tenant_id', $tenantId)->first();
            if (!$supplier) {
                $supplier = Supplier::create([
                    'tenant_id' => $tenantId,
                    'name' => 'Default Supplier',
                ]);
            }
            return $supplier;
        }

        $supplier = Supplier::where('tenant_id', $tenantId)
            ->where('name', 'like', '%' . $name . '%')
            ->first();

        if (!$supplier) {
            $supplier = Supplier::where('tenant_id', $tenantId)->first() ?? Supplier::create([
                'tenant_id' => $tenantId,
                'name' => $name,
            ]);
        }

        return $supplier;
    }
}
