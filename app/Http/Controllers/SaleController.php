<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Payment;
use App\Models\StockMovement;
use App\Models\ParkedSale;
use App\Services\AutoManufacturingService;
use App\Services\V3\AccountingService;
use App\Services\V3\FifoService;
use App\Services\FbrService;
use App\Services\LedgerService;
use App\Services\FinancialReportingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;

class SaleController extends Controller
{
    protected $accounting;
    protected $fbr;
    protected $fifo;
    protected $frs;

    public function __construct(AccountingService $accounting, FbrService $fbr, FifoService $fifo, FinancialReportingService $frs)
    {
        $this->accounting = $accounting;
        $this->fbr        = $fbr;
        $this->fifo       = $fifo;
        $this->frs        = $frs;
    }
    public function store(Request $request)
    {
        $date = Carbon::parse($request->input('sale_date', Carbon::now()->toDateString()));
        $start = $date->copy()->startOfMonth();
        $end = $date->copy()->endOfMonth();

        $monthlyCount = \App\Models\Sale::where('status', 'posted')
            ->whereBetween('created_at', [$start, $end])
            ->count();
        \App\Services\PlanGate::enforce('transactions_per_month', $monthlyCount);

        $request->validate([
            'customer_id'           => 'nullable|exists:parties,id',
            'items'                 => 'required|array|min:1',
            'items.*.product_id'    => 'required|exists:products,id',
            'items.*.variant_id'    => 'nullable|exists:product_variants,id',
            'items.*.quantity'      => 'required|numeric|min:0.001',
            'items.*.free_quantity' => 'nullable|numeric|min:0',
            'items.*.price'         => 'required|numeric|min:0',
            'items.*.discount'      => 'nullable|numeric|min:0',
            'payment_method'        => 'required|string',
            'amount_paid'           => 'required|numeric|min:0',
            'discount'              => 'nullable|numeric|min:0',
            'tax'                   => 'nullable|numeric|min:0',
            'tax_rate'              => 'nullable|numeric|min:0',
            'delivery_charge'       => 'nullable|numeric|min:0',
            'extra_charge_value'    => 'nullable|numeric|min:0',
            'extra_charge_label'    => 'nullable|string',
            'add_to_ledger'         => 'nullable|boolean',
            'payment_account_id'    => 'nullable',
        ]);

        try {
            DB::beginTransaction();

            // 1. PERFORMANCE: Pre-load products to avoid DB hits in the loop
            $productIds = collect($request->items)->pluck('product_id')->unique();
            $products = Product::whereIn('id', $productIds)->get()->keyBy('id');
            
            $isStockEnabled = \App\Helpers\SettingsHelper::isStockMaintenanceEnabled();
            $stopNegative = \App\Helpers\SettingsHelper::shouldStopNegativeStock();
            $autoMfg = new AutoManufacturingService();
            $manufacturingNotifications = [];

            // 2. WATERFALL: Calculate totals
            // PASS 1 — gather gross/item-discount/net per line; do NOT compute tax yet
            // because tax must be charged on the net AFTER the global/order discount is
            // apportioned (Finding F7 / M1-06 fix).
            $subtotalGross = 0;
            $totalItemDiscounts = 0;
            $globalDiscount = (float)($request->discount ?? 0);
            $lineItemsData = [];

            foreach ($request->items as $item) {
                $product = $products->get($item['product_id']);
                if (!$product) continue;

                $qty = (float)$item['quantity'];
                $freeQty = (float)($item['free_quantity'] ?? 0);
                $unitPrice = (float)$item['price'];
                $itemDiscount = (float)($item['discount'] ?? 0);

                $gross = $unitPrice * $qty;
                $freeValue = $unitPrice * $freeQty;
                // net = line revenue after item-level discount (before global discount)
                $net = max(0, $gross - $itemDiscount);

                $taxRate = ($product->tax_rate !== null) ? (float)$product->tax_rate : (float)$request->input('tax_rate', \App\Helpers\SettingsHelper::getDefaultTaxRate());

                $subtotalGross += $gross + $freeValue;
                $totalItemDiscounts += $itemDiscount + $freeValue;

                $lineItemsData[] = [
                    'product'       => $product,
                    'product_id'    => $item['product_id'],
                    'variant_id'    => $item['variant_id'] ?? null,
                    'qty'           => $qty,
                    'free_qty'      => $freeQty,
                    'unit_price'    => $unitPrice,
                    'gross'         => $gross + $freeValue,
                    'discount'      => $itemDiscount + $freeValue,  // total discount incl. free items (for totals)
                    'item_discount' => $itemDiscount,               // pure user-entered row discount (saved to DB)
                    'discount_type' => $item['discount_type'] ?? 'fixed',
                    'net'           => $net,
                    'tax_rate'      => $taxRate,
                    'tax_amt'       => 0.0, // filled in pass 2 below
                    'serials'       => $item['serials'] ?? [],
                ];
            }

            // PASS 2 — apportion global discount across lines proportionally to each
            // line's after-item-discount net, then compute tax on the reduced taxable
            // base.  This ensures the correct order of operations:
            //   net_sales  = Σgross − Σitem_discounts − global_discount   (taxable base)
            //   tax        = Σ round(line_taxable × rate / 100, 2)
            //   invoice    = net_sales + tax
            //
            // If all lines share the same rate this collapses to:
            //   tax = net_sales × rate — but the per-line path stays correct for
            //   multi-rate invoices without any extra branch.
            $sumLineNets = max(0, $subtotalGross - $totalItemDiscounts); // Σ(net after item discount)
            $totalTax    = 0.0;

            foreach ($lineItemsData as &$ld) {
                // Each line's share of the global discount, weighted by its net.
                // If sumLineNets is 0 (fully discounted away) the tax is 0.
                $lineShare     = ($sumLineNets > 0)
                    ? $globalDiscount * ($ld['net'] / $sumLineNets)
                    : 0.0;
                $lineTaxable   = max(0.0, $ld['net'] - $lineShare);
                $taxAmt        = round($lineTaxable * ($ld['tax_rate'] / 100), 2);
                $ld['tax_amt'] = $taxAmt;
                $totalTax     += $taxAmt;
            }
            unset($ld); // release reference

            $netSales       = max(0, $subtotalGross - $totalItemDiscounts - $globalDiscount);
            $deliveryCharge = (float)($request->delivery_charge ?? 0);
            $extraCharge    = (float)($request->extra_charge_value ?? 0);
            
            $invoiceTotal = \App\Helpers\SettingsHelper::roundTotal(round($netSales + $totalTax + $deliveryCharge + $extraCharge, 2));
            $roundOff     = $invoiceTotal - ($netSales + $totalTax + $deliveryCharge + $extraCharge);

            // ── Credit Limit Check ──
            if ($request->customer_id) {
                $customer = DB::table('parties')
                    ->where('tenant_id', app('current.tenant')->id)
                    ->where('id', $request->customer_id)
                    ->lockForUpdate()
                    ->first();

                if ($customer && $customer->credit_limit !== null) {
                    $creditPortion = 0.00;
                    if ($request->payment_method === 'credit') {
                        $creditPortion = $invoiceTotal;
                    } else {
                        $amountPaid = (float) $request->amount_paid;
                        if (round($amountPaid, 2) < round($invoiceTotal, 2)) {
                            $creditPortion = round($invoiceTotal - $amountPaid, 2);
                        }
                    }

                    if ($creditPortion > 0) {
                        $currentBalance = (float) DB::table('journal_items as ji')
                            ->join('journal_entries as je', 'ji.journal_entry_id', '=', 'je.id')
                            ->join('accounts as a', 'ji.account_id', '=', 'a.id')
                            ->where('je.tenant_id', app('current.tenant')->id)
                            ->where('je.party_id', $request->customer_id)
                            ->where('a.code', '1200')
                            ->where('je.is_reversed', 0)
                            ->selectRaw('SUM(ji.debit) - SUM(ji.credit) as balance')
                            ->value('balance') ?? 0.0;

                        if ($currentBalance + $creditPortion > (float) $customer->credit_limit) {
                            throw \Illuminate\Validation\ValidationException::withMessages([
                                'customer_id' => ["Credit limit exceeded. Remaining limit is " . ($customer->credit_limit - $currentBalance) . ", attempting to charge " . $creditPortion]
                            ]);
                        }
                    }
                }
            }

            // ── Serial Tracking Validation ──────────────────────────────────────
            // For every item whose product has track_serial = true:
            //  1. The caller must supply a 'serials' array matching the quantity.
            //  2. Each serial must not already exist in product_serials with status='sold'.
            $serialErrors = [];
            foreach ($request->items as $index => $item) {
                $product = $products->get($item['product_id']);
                if (!$product || !$product->track_serial) continue;

                $qty = (int) ceil((float) ($item['quantity'] ?? 0));
                $serials = $item['serials'] ?? null;

                if (empty($serials) || !is_array($serials) || count($serials) !== $qty) {
                    $serialErrors["items.{$index}.serials"] = [
                        "Serial numbers are required for '{$product->name}'. Expected {$qty}, got " . (is_array($serials) ? count($serials) : 0) . "."
                    ];
                    continue;
                }

                // Check for already-sold serials
                $duplicate = DB::table('product_serials')
                    ->where('product_id', $product->id)
                    ->where('status', 'sold')
                    ->whereIn('serial_number', $serials)
                    ->pluck('serial_number');

                if ($duplicate->isNotEmpty()) {
                    $serialErrors["items.{$index}.serials"] = [
                        "Serial number(s) already sold: " . $duplicate->implode(', ')
                    ];
                }
            }

            if (!empty($serialErrors)) {
                throw \Illuminate\Validation\ValidationException::withMessages($serialErrors);
            }

            $tendered = (float)$request->amount_paid;
            $addToLedger = $request->boolean('add_to_ledger') && $request->customer_id;
            $changeReturn = (!$addToLedger && $tendered > $invoiceTotal) ? ($tendered - $invoiceTotal) : 0;

            $sale = Sale::create([
                'id'                   => $request->input('id', \Illuminate\Support\Str::uuid()->toString()),
                'reference_number'     => \App\Services\SequenceService::generateTransactionNumber('SAL'),
                'source'               => $request->source === 'pos' ? 'pos' : 'manual',
                'party_id'             => $request->customer_id ?: \App\Models\Party::firstOrCreate(['phone' => '0000000000', 'name' => 'Walk-in Customer'], ['type' => 'customer'])->id,
                'user_id'              => Auth::id() ?? 1,
                'warehouse_id'         => $request->warehouse_id ?? (\App\Models\Warehouse::first()?->id ?? 1),
                'subtotal'             => $subtotalGross,
                'tax'                  => $totalTax,
                'discount'             => $globalDiscount,
                'total'                => $invoiceTotal,
                'subtotal_gross'       => $subtotalGross,
                'total_item_discounts' => $totalItemDiscounts,
                'global_discount'      => $globalDiscount,
                'net_sales'            => $netSales,
                'total_tax'            => $totalTax,
                'delivery_charge'      => $deliveryCharge,
                'shipping_charges'     => $deliveryCharge,
                'extra_charge_value'   => $extraCharge,
                'extra_charge_label'   => $request->extra_charge_label,
                'invoice_total'        => $invoiceTotal,
                'tendered_amount'      => $tendered,
                'change_return'        => $changeReturn,
                'round_off'            => $roundOff,
                'status'               => 'posted',
                'posted_at'            => now(),
                'payment_status'       => $tendered >= $invoiceTotal ? 'paid' : ($tendered > 0 ? 'partial' : 'unpaid'),
                'payment_method'       => $request->payment_method,
            ]);

            // 4. STORAGE: Process Items, Stock, and FIFO
            $totalCogs = 0;
            foreach ($lineItemsData as $ld) {
                $product = $ld['product'];
                $totalQty = $ld['qty'] + $ld['free_qty'];

                if ($isStockEnabled) {
                    $stock = \App\Models\Stock::where('product_id', $ld['product_id'])->where('warehouse_id', $sale->warehouse_id)->first();
                    $avail = $stock ? $stock->quantity : 0;

                    if ($avail < $totalQty && $autoMfg->hasManufacturingRules($ld['product_id'])) {
                        $mfg = $autoMfg->manufactureByProductId($ld['product_id'], $totalQty - max(0, $avail), $sale);
                        if ($mfg['success']) $manufacturingNotifications[] = $mfg['notification'];
                    }

                    if ($stopNegative && ($avail < $totalQty)) {
                        throw new \App\Exceptions\InsufficientStockException(
                            $ld['product_id'],
                            $sale->warehouse_id,
                            $totalQty,
                            $avail
                        );
                    }
                }

                $saleItem = SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $ld['product_id'],
                    'product_variant_id' => $ld['variant_id'],
                    'quantity' => $ld['qty'],
                    'free_quantity' => $ld['free_qty'],
                    'unit_price' => $ld['unit_price'],
                    'cost_price' => $product->cost_price ?? 0,
                    'gross_amount' => $ld['qty'] * $ld['unit_price'],
                    'discount_amount' => $ld['item_discount'], // pure item-level discount, no freeValue mixed in
                    'net_amount' => $ld['net'],
                    'tax_amount' => $ld['tax_amt'],
                    'subtotal' => $ld['qty'] * $ld['unit_price'],
                    'line_total' => $ld['net'] + $ld['tax_amt'],
                ]);

                // Serial Number Recording
                if ($product->track_serial && !empty($ld['serials'])) {
                    foreach ($ld['serials'] as $serial) {
                        DB::table('product_serials')->updateOrInsert(
                            ['serial_number' => $serial, 'product_id' => $ld['product_id']],
                            [
                                'id'         => \Illuminate\Support\Str::uuid()->toString(),
                                'status'     => 'sold',
                                'sale_id'    => $sale->id,
                                'warehouse_id' => $sale->warehouse_id,
                                'updated_at' => now(),
                                'created_at' => now(),
                            ]
                        );
                    }
                }

                // FIFO Deduction
                $itemCogs = 0;
                if ($isStockEnabled && $this->fifo->checkAvailability($ld['product_id'], $sale->warehouse_id, $totalQty)) {
                    try {
                        $deductions = app(\App\Services\V3\FifoService::class)->deductStock($ld['product_id'], $sale->warehouse_id, $totalQty);
                        foreach ($deductions as $d) {
                            $itemCogs += $d['total_cost'];
                            DB::table('sale_item_batches')->insert([
                                'id'                 => \Illuminate\Support\Str::uuid()->toString(),
                                'tenant_id'          => $sale->tenant_id,
                                'sale_item_id'       => $saleItem->id,
                                'inventory_batch_id' => $d['batch_id'],
                                'qty_deducted'       => $d['qty_taken'],
                                'unit_cost'          => $d['unit_cost'],
                                'total_cogs'         => $d['total_cost'],
                                'created_at' => now(), 'updated_at' => now(),
                            ]);
                        }
                        $saleItem->update(['cost_price' => $totalQty > 0 ? $itemCogs / $totalQty : 0]);
                    } catch (\Exception $e) { $itemCogs = ($product->cost_price ?? 0) * $totalQty; }
                } else {
                    $itemCogs = ($product->cost_price ?? 0) * $totalQty;
                }
                $totalCogs += $itemCogs;

                // Legacy Stock Update
                if ($isStockEnabled) {
                    if ($ld['variant_id']) {
                        ProductVariant::find($ld['variant_id'])?->decrement('stock', $totalQty);
                    } else {
                        $stockRecord = \App\Models\Stock::where('product_id', $ld['product_id'])
                            ->where('warehouse_id', $sale->warehouse_id)
                            ->first();
                        if ($stockRecord) {
                            $stockRecord->decrement('quantity', $totalQty);
                        } else {
                            \App\Models\Stock::create([
                                'product_id' => $ld['product_id'],
                                'warehouse_id' => $sale->warehouse_id,
                                'quantity' => -$totalQty,
                            ]);
                        }
                    }
                    Product::where('id', $ld['product_id'])->decrement('stock_quantity', $totalQty);
                    StockMovement::create([
                        'product_id' => $ld['product_id'], 'warehouse_id' => $sale->warehouse_id,
                        'type' => 'sale', 'quantity' => -$totalQty, 'reference_id' => $sale->reference_number, 'user_id' => Auth::id(),
                    ]);
                }
            }

            // 5. ACCOUNTING: Unified Journal Entry
            $recorded = $addToLedger ? $tendered : min($tendered, $invoiceTotal);
            $overpayment = max(0, $tendered - $invoiceTotal);
            $this->postSaleJournal($sale, $request, $netSales, $totalTax, $totalCogs, $roundOff, $invoiceTotal, $recorded, $overpayment, $addToLedger);

            // 6. INTEGRATIONS: FBR
            $fbrEnabled = \App\Helpers\SettingsHelper::get('fbr_integration') == '1';
            if ($fbrEnabled) {
                $fbrRes = $this->fbr->reportSale($sale);
                if (($fbrRes['Code'] ?? 0) == 100) {
                    $sale->update(['fbr_invoice_number' => $fbrRes['InvoiceNumber'], 'fbr_qr_data' => $fbrRes['QRData'], 'is_fbr_reported' => true]);
                }
            }

            DB::commit();

            // 7. AUDIT: Activity Log (Done after commit for speed, though technically async is better)
            \App\Models\Activity::create([
                'type' => 'sale', 'reference_id' => $sale->id, 'reference_type' => 'sale', 'user_id' => Auth::id(),
                'amount' => $invoiceTotal, 'description' => 'Sale #' . $sale->reference_number,
                'metadata' => json_encode(['reference' => $sale->reference_number, 'total' => $invoiceTotal]),
            ]);

            return response()->json([
                'success' => true,
                'sale_id' => $sale->id,
                'reference' => $sale->reference_number,
                'notifications' => $manufacturingNotifications
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'errors' => $e->errors(), 'message' => $e->getMessage()], 422);
        } catch (\App\Exceptions\InsufficientStockException $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            if (str_contains($e->getMessage(), 'Insufficient stock')) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
            }
            Log::error('Sale Store Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function dashboard()
    {
        $tz = app('current.tenant')->timezone ?: config('app.timezone', 'UTC');
        
        $todayStart = \Carbon\Carbon::today($tz)->startOfDay()->utc();
        $todayEnd = \Carbon\Carbon::today($tz)->endOfDay()->utc();
        
        $yesterdayStart = \Carbon\Carbon::yesterday($tz)->startOfDay()->utc();
        $yesterdayEnd = \Carbon\Carbon::yesterday($tz)->endOfDay()->utc();
        
        $startOfMonth = \Carbon\Carbon::now($tz)->startOfMonth()->utc();
        $startOfLastMonth = \Carbon\Carbon::now($tz)->subMonth()->startOfMonth()->utc();
        $endOfLastMonth = \Carbon\Carbon::now($tz)->subMonth()->endOfMonth()->utc();
        
        $sub30Days = \Carbon\Carbon::now($tz)->subDays(30)->utc();

        // 1. Sales & Orders Today (Ledger-derived via FinancialReportingService)
        $todayRevenue = (float) $this->frs->getProfitAndLoss($todayStart->toDateString(), $todayEnd->toDateString())['revenue'];
        $yesterdayRevenue = (float) $this->frs->getProfitAndLoss($yesterdayStart->toDateString(), $yesterdayEnd->toDateString())['revenue'];
        $todayCount = Sale::where('status', '!=', 'returned')
            ->whereBetween('created_at', [$todayStart, $todayEnd])
            ->count();

        $dailyGrowth = $yesterdayRevenue > 0 
            ? (($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue) * 100 
            : ($todayRevenue > 0 ? 100 : 0);

        // 2. Monthly Net Sales (Ledger-derived via FinancialReportingService)
        $monthRevenue = (float) $this->frs->getProfitAndLoss($startOfMonth->toDateString(), $todayEnd->toDateString())['revenue'];
        $lastMonthRevenue = (float) $this->frs->getProfitAndLoss($startOfLastMonth->toDateString(), $endOfLastMonth->toDateString())['revenue'];
        
        $monthCount = Sale::where('status', '!=', 'returned')
            ->where('created_at', '>=', $startOfMonth)
            ->count();

        $lastMonthCount = Sale::where('status', '!=', 'returned')
            ->whereBetween('created_at', [$startOfLastMonth, $endOfLastMonth])
            ->count();

        $monthlyGrowth = $lastMonthRevenue > 0 
            ? (($monthRevenue - $lastMonthRevenue) / $lastMonthRevenue) * 100 
            : ($monthRevenue > 0 ? 100 : 0);

        // 3. Average Order Value
        $averageOrderValue = $monthCount > 0 ? $monthRevenue / $monthCount : 0;
        
        // Avg Growth
        $avgLastMonth = $lastMonthCount > 0 ? $lastMonthRevenue / $lastMonthCount : 0;
        $avgGrowth = $avgLastMonth > 0 ? (($averageOrderValue - $avgLastMonth) / $avgLastMonth) * 100 : 0;

        // 4. Active Customers
        $activeCustomers = Sale::where('status', '!=', 'returned')
            ->where('created_at', '>=', $sub30Days)
            ->whereNotNull('customer_id')
            ->distinct('customer_id')
            ->count('customer_id');

        // Recent Sales (Optimized Select & Relations)
        $recentSales = Sale::where('status', 'posted')
            ->select('id', 'reference_number', 'total', 'payment_status', 'party_id', 'created_at')
            ->with(['party:id,name'])
            ->latest()
            ->take(5)
            ->get();

        $tenantId = app('current.tenant')->id;

        // Top Selling Products — net_amount is permanently backfilled, no COALESCE needed
        $topSelling = DB::table('sale_items')
            ->join('sales', 'sale_items.sale_id', '=', 'sales.id')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sales.tenant_id', $tenantId)
            ->where('sales.status', '!=', 'returned')
            ->whereBetween('sales.created_at', [$todayStart, $todayEnd])
            ->select(
                'products.name',
                'products.price',
                DB::raw('SUM(sale_items.quantity) as qty'),
                DB::raw('SUM(sale_items.net_amount) as revenue'),
                DB::raw('(
                    COALESCE((
                        SELECT SUM(sib.total_cogs)
                        FROM sale_item_batches sib
                        WHERE sib.sale_item_id = sale_items.id
                    ), sale_items.cost_price * (sale_items.quantity + COALESCE(sale_items.free_quantity,0)))
                ) as cogs')
            )
            ->groupBy('products.id', 'products.name', 'products.price')
            ->orderByDesc('qty')
            ->take(5)
            ->get()
            ->map(function ($item) {
                $item->gross_profit = round((float)$item->revenue - (float)$item->cogs, 2);
                return $item;
            });

        // Sales by Payment Method — use net_sales for accurate revenue breakdown
        $salesByMethod = DB::table('sales')
            ->where('tenant_id', $tenantId)
            ->whereNull('deleted_at')
            ->where('status', '!=', 'returned')
            ->where('created_at', '>=', $startOfMonth)
            ->select('payment_method', DB::raw('SUM(net_sales) as total'))
            ->groupBy('payment_method')
            ->get();


        $data = [
            'stats' => [
                'sales_today' => $todayRevenue,
                'sales_today_growth' => round($dailyGrowth, 1),
                'orders_today' => $todayCount,
                'sales_month' => $monthRevenue,
                'sales_month_growth' => round($monthlyGrowth, 1),
                'orders_month' => $monthCount,
                'avg_order_value' => round($averageOrderValue, 0),
                'avg_order_growth' => round($avgGrowth, 1),
                'active_customers' => $activeCustomers,
            ],
            'recentSales' => $recentSales,
            'topSelling' => $topSelling,
            'salesByMethod' => $salesByMethod
        ];

        if (!request()->header('X-Inertia') && (request()->wantsJson() || request()->ajax())) {
            return response()->json($data);
        }

        return Inertia::render('Sales/Dashboard', $data);
    }

    public function index(Request $request)
    {
        $query = Sale::with(['customer', 'user', 'items.product', 'ecommerceChannel'])->withSum('payments as paid_amount', 'amount');

        // Apply Search
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('reference_number', 'like', "%{$request->search}%")
                    ->orWhereHas('customer', function ($q) use ($request) {
                        $q->where('name', 'like', "%{$request->search}%");
                    })
                    ->orWhereHas('party', function ($q) use ($request) { // ADDED THIS
                        $q->where('name', 'like', "%{$request->search}%");
                    });
            });
        }

        // Apply Date Filters
        $tz = app('current.tenant')->timezone ?: config('app.timezone', 'UTC');
        $tzNow = \Carbon\Carbon::now($tz);
        if ($request->filter === 'today') {
            $query->whereBetween('created_at', [$tzNow->copy()->startOfDay(), $tzNow->copy()->endOfDay()]);
        } elseif ($request->filter === 'month') {
            $query->whereBetween('created_at', [$tzNow->copy()->startOfMonth(), $tzNow->copy()->endOfMonth()]);
        } elseif ($request->filter === 'year') {
            $query->whereBetween('created_at', [$tzNow->copy()->startOfYear(), $tzNow->copy()->endOfYear()]);
        }

        // Apply Date Range
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        // Apply Sorting
        $sortBy = $request->input('sort_by', 'date');
        $sortDir = $request->input('sort_dir', 'desc');

        if ($sortBy === 'date') {
            $query->orderBy('created_at', $sortDir);
        } elseif ($sortBy === 'reference') {
            $query->orderBy('reference_number', $sortDir);
        } elseif ($sortBy === 'amount') {
            $query->orderBy('total', $sortDir);
        } elseif ($sortBy === 'status') {
             $query->orderBy('payment_status', $sortDir);
        } elseif ($sortBy === 'party_name') {
            $query->leftJoin('parties', 'sales.party_id', '=', 'parties.id')
                ->select('sales.*')
                ->orderBy('parties.name', $sortDir);
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        // ── Stats (computed before pagination, on the full filtered set) ──────
        // Clone the query builder so the filters above apply to stats too,
        // but pagination does NOT — stats must cover the entire filtered result set.
        $statsQuery = (clone $query)->where('status', '!=', 'returned');

        // BUG-03 FIX (CALCULATION_LOGIC.md §8 BUG-03)
        // OLD: sum('total')  — invoice_total, includes tax → inflated revenue figure
        // NEW: sum('net_sales') — true revenue: ex-tax, ex-discount (§2.7 definition)
        $totalSales = (float) $statsQuery->sum('net_sales');

        // Get filtered sale IDs for the payment join
        // Using ->toBase() avoids loading Eloquent overhead on a pluck-only query
        $filteredSaleIds = (clone $statsQuery)->toBase()->pluck('id');

        // BUG-03 FIX: Total collected = SUM of all POSITIVE payments against these sales.
        // RULE (§6 Rule #5): NEVER use payment_status as a financial signal.
        //                     payment_status is a UI badge only.
        // Positive payments = money received from customer
        // Negative payments = refunds issued (already excluded by >0 filter)
        $totalPaid = (float) DB::table('payments')
            ->whereIn('sale_id', $filteredSaleIds)
            ->where('amount', '>', 0)
            ->sum('amount');

        // Outstanding = what was billed (net) minus what was actually collected
        // Never goes negative — a credit balance is not shown on the history stat card
        $totalUnpaid = max(0, $totalSales - $totalPaid);

        // Paginate AFTER stats — pagination must not affect the stat totals
        $sales = $query->paginate(200)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($sales);
        }

        return Inertia::render('Sales/SalesHistory', [
            'sales'   => $sales,
            'filters' => $request->all(['search', 'filter', 'from_date', 'to_date']),
            'stats'   => [
                'total_sale'        => $totalSales,   // net_sales: ex-tax, ex-discount
                'total_paid'        => $totalPaid,    // SUM(payments.amount > 0)
                'total_unpaid'      => $totalUnpaid,  // net_sales - collected
                'transaction_count' => $sales->total(),
            ],
        ]);
    }


    public function show($id)
    {
        $sale = Sale::with(['customer', 'user', 'items.product', 'items.productVariant', 'payments'])->findOrFail($id);
        
        // Get bank accounts for refund source selection
        $bankAccounts = \App\Models\Account::where('type', 'asset')
            ->where(function($q) {
                $q->where('name', 'like', '%bank%')
                  ->orWhere('code', 'like', '101%'); // Bank accounts typically start with 101x
            })
            ->get(['id', 'name', 'code']);

        if ($sale->customer) {
            $netBalance = LedgerService::partyNetBalance(
                $sale->customer->id,
                $sale->tenant_id
            );
            $sale->customer->current_balance = $netBalance;

            $invoiceTotal = (float) $sale->total;
            $amountPaid   = (float) $sale->payments->sum('amount');
            $balanceDue   = max(0, $invoiceTotal - $amountPaid);

            $sale->customer_net_balance  = $netBalance;
            $sale->customer_prev_balance = $netBalance - $balanceDue;
            $sale->append(['customer_net_balance', 'customer_prev_balance']);
        }

        if (request()->wantsJson()) {
            return response()->json([
                'sale' => $sale,
                'bankAccounts' => $bankAccounts,
            ]);
        }

        return Inertia::render('Sales/Show', [
            'sale' => $sale,
            'bankAccounts' => $bankAccounts,
        ]);
    }

    public function printReceipt($id)
    {
        $sale = Sale::with(['customer', 'user', 'items.product', 'items.productVariant', 'payments'])->findOrFail($id);
        $settings = \App\Models\Setting::all()->pluck('value', 'key');

        if ($sale->party_id) {
            $net        = LedgerService::partyNetBalance($sale->party_id, $sale->tenant_id);
            $balanceDue = max(0, (float) $sale->total - (float) $sale->payments->sum('amount'));
            $sale->customer_net_balance  = $net;
            $sale->customer_prev_balance = $net - $balanceDue;
        }

        $pdf = Pdf::loadView('pdf.receipt', [
            'sale'     => $sale,
            'settings' => $settings,
        ]);

        return $pdf->stream('receipt-' . $sale->reference_number . '.pdf');
    }

    public function lookup(Request $request)
    {
        $ref = $request->input('ref');
        if (!$ref) {
            return response()->json(['error' => 'Reference required'], 422);
        }
        $sale = Sale::with(['items.product', 'customer'])
            ->where('reference_number', $ref)
            ->firstOrFail();
        return response()->json($sale);
    }

    public function returnSale(Request $request, $id)
    {
        $sale = Sale::with(['items', 'items.saleItemBatches'])->findOrFail($id);

        if ($sale->status === 'returned') {
            return back()->withErrors(['error' => 'This sale has already been fully returned.']);
        }

        if (!in_array($sale->status, ['posted', 'partially_returned'])) {
            return back()->withErrors(['error' => "Only posted or partially-returned sales can be returned. Current status: {$sale->status}."]);
        }

        $refundMethod  = $request->input('refund_method', 'cash');
        $refundSource  = $request->input('refund_source', 'cash_drawer');
        $reason        = $request->input('reason', 'Customer return');
        $itemsToReturn = $request->input('items', []);

        // Determine if this is a full or partial return
        $isFullReturn = empty($itemsToReturn) || $this->isFullReturn($sale, $itemsToReturn);

        try {
            $retVal = DB::transaction(function () use ($sale, $request, $refundMethod, $refundSource, $reason, $itemsToReturn, $isFullReturn, &$returnTotal) {

                if ($isFullReturn) {
                    // ─── FULL RETURN ───────────────────────────────────────────
                    // SaleReversalService handles everything atomically:
                    //   1. Posts a counter journal entry (flips every debit/credit)
                    //   2. Restores FIFO inventory_batches exactly as deducted
                    //   3. Restores stock aggregates
                    //   4. Sets sale status = 'returned'
                    (new \App\Services\SaleReversalService())->reverse(
                        sale:   $sale,
                        type:   'returned',
                        reason: $reason,
                        userId: Auth::id() ?? 'system'
                    );

                    // BUG-04 FIX: full return reverses net_sales (true revenue)
                    // not total (which is tax-inclusive invoice amount — never equals revenue)
                    $returnTotal = (float) ($sale->net_sales ?: $sale->total);

                } else {
                    // ─── PARTIAL RETURN ────────────────────────────────────────
                    // For partial returns we cannot use the full reversal engine
                    // directly (it reverses the whole sale). Instead we post a
                    // partial counter journal entry proportional to the items returned.

                    $returnTotal = 0;

                    // Resolve the refund GL account based on the ORIGINAL sale's payment method.
                    // Cash sale → refund comes from Cash (1000)
                    // Bank/card/online → refund comes from Bank (1010)
                    // Credit/ledger → reduce AR (1200)
                    // This mirrors the same logic as postSaleJournal() line ~1219.
                    $originalPaymentMethod = strtolower($sale->payment_method ?? 'cash');
                    if (in_array($originalPaymentMethod, ['bank', 'card', 'online', 'upi'])) {
                        $refundAccountCode = '1010';
                    } elseif (in_array($originalPaymentMethod, ['credit', 'ledger', 'khata'])) {
                        $refundAccountCode = '1200';
                    } else {
                        $refundAccountCode = '1000'; // cash default
                    }

                    $refundAccount = $this->accounting->getAccountByCode($refundAccountCode);
                    $cogsAccount   = $this->accounting->getAccountByCode('5000', 'Cost of Goods Sold', 'expense');
                    $invAccount    = $this->accounting->getAccountByCode('1100', 'Inventory Asset', 'asset');
                    $incAccount    = $this->accounting->getAccountByCode('4000', 'Sales Revenue', 'income');

                    $journalItems = [];

                    foreach ($itemsToReturn as $returnItem) {
                        $originalItem = $sale->items->firstWhere('id', $returnItem['id']);
                        if (!$originalItem) continue;

                        $alreadyReturned     = (float) $originalItem->returned_quantity;
                        $remainingReturnable = max(0.0, (float) $originalItem->quantity - $alreadyReturned);
                        $qty                 = min((float) $returnItem['quantity'], $remainingReturnable);
                        if ($qty <= 0) { continue; }   // nothing left to return on this line

                        // BUG-04 FIX (CALCULATION_LOGIC.md §8 BUG-04 & §9.2)
                        // OLD: unit_price × qty — gross price, before discounts
                        //      If the customer got a 10% discount, this OVERESTIMATES the refund.
                        // NEW: pro-rate net_amount (what the customer actually paid after discounts)
                        //
                        // Formula: net_amount / original_qty × return_qty
                        //   net_amount  = sale_items.net_amount (gross - item_discount)
                        //   fraction    = return_qty / original_qty
                        //
                        // Fallback: if net_amount is 0 (legacy row pre-waterfall-migration),
                        //           use unit_price × qty to avoid a zero refund.
                        $originalQty        = max(0.001, (float) $originalItem->quantity);
                        $netAmountPerUnit   = ((float) $originalItem->net_amount > 0)
                            ? (float) $originalItem->net_amount / $originalQty
                            : (float) $originalItem->unit_price;

                        $lineRevenue  = round($netAmountPerUnit * $qty, 4);
                        $returnTotal += $lineRevenue;

                        // Restore FIFO stock for this specific item proportionally (LIFO order of deduction for returns)
                        $activeBatches = $originalItem->saleItemBatches()
                            ->select('sale_item_batches.*')
                            ->join('inventory_batches', 'sale_item_batches.inventory_batch_id', '=', 'inventory_batches.id')
                            ->active()
                            ->orderBy('inventory_batches.created_at', 'desc')
                            ->orderBy('inventory_batches.seq', 'desc')
                            ->get();
                        $qtyToRestore  = $qty;
                        $costToRestore = 0.0;

                        foreach ($activeBatches as $sib) {
                            if ($qtyToRestore <= 0) break;
                            $restoreFromThis = min($sib->qty_deducted, $qtyToRestore);
                            $batch = \App\Models\InventoryBatch::find($sib->inventory_batch_id);
                            if ($batch) {
                                $restoredQty = min($restoreFromThis, $batch->original_qty - $batch->remaining_qty);
                                $batch->increment('remaining_qty', $restoredQty);
                                $costToRestore += $restoredQty * (float) $batch->unit_cost;
                                Log::info("Partial FIFO restore: batch {$batch->id}, restored {$restoredQty}");
                                
                                // Decrease or mark reversed in sale_item_batches so getGrossProfitByProduct picks up the correct COGS
                                if ($restoredQty >= $sib->qty_deducted) {
                                    $sib->markReversed("Partial return of {$sale->reference_number}");
                                } else {
                                    $newQty = $sib->qty_deducted - $restoredQty;
                                    $sib->update([
                                        'qty_deducted' => $newQty,
                                        'total_cogs' => $newQty * $sib->unit_cost
                                    ]);
                                }
                            }
                            $qtyToRestore -= $restoreFromThis;
                        }

                        // THE FIX: Sync Legacy Stock Tables (Dashboard/List view)
                        $stock = \App\Models\Stock::where('product_id', $originalItem->product_id)
                            ->where('warehouse_id', $sale->warehouse_id)
                            ->first();

                        if ($stock) {
                            $stock->increment('quantity', $qty);
                        }

                        if ($originalItem->product_variant_id) {
                            $variant = \App\Models\ProductVariant::find($originalItem->product_variant_id);
                            if ($variant) $variant->increment('stock', $qty);
                        }

                        \App\Models\Product::where('id', $originalItem->product_id)->increment('stock_quantity', $qty);

                        // Build partial reversal journal items:
                        // DR Inventory (put cost back) | CR COGS (un-record the expense)
                        if ($costToRestore > 0 && $cogsAccount && $invAccount) {
                            $journalItems[] = ['account_id' => $invAccount->id,  'debit' => $costToRestore, 'credit' => 0,             'description' => "Inventory restored: partial return of {$sale->reference_number}"];
                            $journalItems[] = ['account_id' => $cogsAccount->id, 'debit' => 0,             'credit' => $costToRestore, 'description' => "COGS reversal: partial return of {$sale->reference_number}"];
                        }

                        // DR Revenue (undo earned revenue) | CR refund account (cash/bank/AR)
                        // Uses original sale's payment_method — NOT hardcoded AR.
                        if ($lineRevenue > 0 && $refundAccount && $incAccount) {
                            $journalItems[] = ['account_id' => $incAccount->id,   'debit' => $lineRevenue, 'credit' => 0,            'description' => "Revenue reversal: partial return of {$sale->reference_number}"];
                            $journalItems[] = ['account_id' => $refundAccount->id, 'debit' => 0,           'credit' => $lineRevenue, 'description' => "Refund ({$refundAccountCode}): partial return of {$sale->reference_number}"];
                        }

                        DB::table('sale_items')->where('id', $originalItem->id)
                            ->increment('returned_quantity', $qty);
                    }

                    if ($returnTotal == 0 && empty($journalItems)) {
                        return back()->withErrors(['error' => 'Nothing left to return on this sale.']);
                    }

                    // Post the partial reversal journal entry
                    if (!empty($journalItems)) {
                        app(\App\Services\V3\AccountingService::class)->createEntry([
                            'date'        => now()->toDateString(),
                            'reference'   => 'PRET-' . $sale->reference_number,
                            'description' => "Partial return of {$sale->reference_number}. Reason: {$reason}",
                            'party_id'    => $sale->party_id,
                            'source_type' => Sale::class,
                            'source_id'   => $sale->id,
                        ], $journalItems);
                    }

                    // Mark original sale as partially returned — allows further partial returns later.
                    // Only set to 'returned' when SaleReversalService::reverse() is called (full return).
                    DB::statement("UPDATE sales SET status = 'partially_returned', updated_at = ? WHERE id = ?", [now(), $sale->id]);
                }

                // ─── Record the Refund Payment ─────────────────────────────────
                // A Payment row records which physical instrument was used for the refund.
                // The financial reversal is already in the journal — this is an operational record.
                if (!$isFullReturn) {
                    $refLabel = match($refundSource) {
                        'bank_account' => 'BANK TRANSFER REFUND',
                        'online'       => 'ONLINE/CARD REFUND',
                        default        => 'CASH REFUND',
                    };

                    Payment::create([
                        'sale_id'   => $sale->id,
                        'party_id'  => $sale->party_id,
                        'amount'    => -$returnTotal,
                        'type'      => 'out',
                        'method'    => $refundMethod === 'ledger' ? 'ledger_credit' : ($refundSource === 'bank_account' ? 'bank' : 'cash'),
                        'reference' => ($refundMethod === 'ledger' ? 'KHATA CREDIT' : $refLabel) . ': Return of ' . $sale->reference_number,
                        'date'      => now()->toDateString(),
                    ]);
                }
            });

            if ($retVal instanceof \Illuminate\Http\RedirectResponse) {
                return $retVal;
            }

            $sourceLabel = match($refundSource) {
                'bank_account' => 'bank transfer',
                'online'       => 'online/card',
                default        => 'cash',
            };

            // Use $returnTotal (the actual amount reversed) not $sale->total (the gross invoice)
            $refundAmount  = number_format((float) $returnTotal, 2);
            $successMessage = $refundMethod === 'ledger'
                ? "Return processed. Rs {$refundAmount} credited to customer khata. Ledger reversed."
                : "Return processed. Rs {$refundAmount} refunded via {$sourceLabel}. Ledger reversed.";

            $storeSlug = app('current.tenant')?->slug ?? request()->route('store_slug') ?? 'default';
            return redirect()->route('store.sales.index', ['store_slug' => $storeSlug])->with('success', $successMessage);

        } catch (\Exception $e) {
            Log::error('Sale Return Error', ['sale_id' => $sale->id, 'error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->withErrors(['error' => 'Return failed: ' . $e->getMessage()]);
        }
    }

    /**
     * Returns true if the items list covers the full quantity of every sale item.
     * Empty $itemsToReturn means all items are being returned.
     */
    private function isFullReturn(Sale $sale, array $itemsToReturn): bool
    {
        if (empty($itemsToReturn)) return true;

        $returnQtyMap = [];
        foreach ($itemsToReturn as $item) {
            if (isset($item['id'])) {
                $returnQtyMap[$item['id']] = (float) ($item['quantity'] ?? 0);
            }
        }

        foreach ($sale->items as $originalItem) {
            $alreadyReturned     = (float) $originalItem->returned_quantity;
            $remainingReturnable = max(0.0, (float) $originalItem->quantity - $alreadyReturned);

            if ($remainingReturnable <= 0) {
                continue;
            }

            $requestedQty = $returnQtyMap[$originalItem->id] ?? 0.0;
            if ($requestedQty < $remainingReturnable) {
                return false;
            }
        }

        return true;
    }

    /**
     * Park (Hold) a sale for later completion
     */
    public function park(Request $request)
    {
        $request->validate([
            'cart_data' => 'required|array',
            'customer_name' => 'nullable|string',
        ]);

        $parkedSale = ParkedSale::create([
            'cart_data' => $request->cart_data,
            'user_id' => Auth::id(),
            'customer_name' => $request->customer_name,
            'expires_at' => now()->addHours(24), // Expires in 24 hours
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sale parked successfully',
            'parked_sale_id' => $parkedSale->id,
        ]);
    }

    /**
     * Get all active (non-expired) parked sales
     */
    public function getParkedSales()
    {
        $parkedSales = ParkedSale::active()
            ->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'parked_sales' => $parkedSales,
        ]);
    }

    /**
     * Recall (load) a parked sale
     */
    public function recall($id)
    {
        $parkedSale = ParkedSale::findOrFail($id);

        // Check if expired
        if ($parkedSale->isExpired()) {
            return response()->json([
                'success' => false,
                'message' => 'This parked sale has expired',
            ], 410); // 410 Gone
        }

        return response()->json([
            'success' => true,
            'parked_sale' => $parkedSale,
        ]);
    }

    /**
     * Delete a parked sale
     */
    public function deleteParked($id)
    {
        $parkedSale = ParkedSale::findOrFail($id);
        $parkedSale->delete();

        return response()->json([
            'success' => true,
            'message' => 'Parked sale deleted',
        ]);
    }
    public function edit(Sale $sale)
    {
        // Phase 1.2 — Immutable Lock (Controller Layer)
        // We now allow 'posted' sales to load in the CreateInvoice UI so the user can 
        // view them in the familiar interface. The actual lock preventing modification 
        // is enforced in the update() method and the SaleObserver.

        $sale->load(['items.product', 'customer', 'payments']);
        
        if ($sale->customer) {
            $sale->customer->current_balance = LedgerService::partyNetBalance(
                $sale->customer->id,
                app('current.tenant')->id
            );
        }

        return Inertia::render('Sales/CreateInvoice', [
            'sale' => $sale,
        ]);
    }

    public function update(Request $request, Sale $sale)
    {
        try {
            DB::beginTransaction();

            // Step 1 — Reverse old journal entries
            $oldEntries = \App\Models\JournalEntry::where('reference', $sale->id)
                ->where('reference_type', 'sale')
                ->where('is_reversed', 0)
                ->get();

            foreach ($oldEntries as $entry) {
                $entry->update(['is_reversed' => 1]);
                $reversalLines = $entry->items->map(function($item) {
                    return [
                        'account_id' => $item->account_id,
                        'debit'      => $item->credit,
                        'credit'     => $item->debit,
                    ];
                })->toArray();
                
                app(\App\Services\V3\AccountingService::class)->createEntry([
                    'date'           => now()->toDateString(),
                    'reference_type' => 'sale_reversal',
                    'reference'      => $sale->id,
                    'description'    => 'REVERSAL — ' . $entry->description,
                    'party_id'       => $entry->party_id,
                    'is_reversed'    => 1, // Rule: Reversal of an existing entry must be hidden from balances
                ], $reversalLines);
            }

            // 1. Restore Stock for OLD items
            foreach ($sale->items as $item) {
                if ($item->product_variant_id) {
                    \App\Models\ProductVariant::find($item->product_variant_id)?->increment('stock', $item->quantity);
                } elseif ($item->product_id) {
                    \App\Models\Stock::where('product_id', $item->product_id)->first()?->increment('quantity', $item->quantity);
                }
            }

            $sale->items()->delete();
            $sale->payments()->delete();

            // 2. Phase 1.1 Waterfall Recalculation
            $subtotalGross      = 0;
            $totalItemDiscounts = 0;
            $globalDiscount     = (float) ($request->discount ?? 0);
            $totalTax           = 0;
            $lineValues         = [];

            foreach ($request->items as $item) {
                $qty          = (float) $item['quantity'];
                $unitPrice    = (float) $item['price'];
                $itemDiscount = (float) ($item['discount'] ?? 0);
                $grossAmount  = $unitPrice * $qty;
                $netAmount    = max(0, $grossAmount - $itemDiscount);

                $productRecord = Product::find($item['product_id']);
                $lineTaxRate   = ($productRecord->tax_rate !== null) ? (float)$productRecord->tax_rate : (float)$request->input('tax_rate', \App\Helpers\SettingsHelper::getDefaultTaxRate());
                $lineTaxAmount = round($netAmount * ($lineTaxRate / 100), 4);

                $subtotalGross      += $grossAmount;
                $totalItemDiscounts += $itemDiscount;
                $totalTax           += $lineTaxAmount;

                $lineValues[] = [
                    'product_id'         => $item['product_id'],
                    'product_variant_id' => $item['variant_id'] ?? null,
                    'quantity'           => $qty,
                    'unit_price'      => $unitPrice,
                    'gross_amount'    => $grossAmount,
                    'discount'        => $itemDiscount,
                    'discount_amount' => $itemDiscount,
                    'discount_type'   => $item['discount_type'] ?? 'fixed',
                    'net_amount'      => $netAmount,
                    'tax_rate'        => $lineTaxRate,
                    'tax_amount'      => $lineTaxAmount,
                    'line_total'      => $netAmount + $lineTaxAmount,
                ];
            }

            $netSales            = max(0, $subtotalGross - $totalItemDiscounts - $globalDiscount);
            $deliveryCharge      = (float) ($request->delivery_charge ?? 0);
            $extraCharge         = (float) ($request->extra_charge_value ?? 0);

            $roundedInvoiceTotal = \App\Helpers\SettingsHelper::roundTotal(round($netSales + $totalTax + $deliveryCharge + $extraCharge, 2));
            $roundOff            = $roundedInvoiceTotal - ($netSales + $totalTax + $deliveryCharge + $extraCharge);

            // 3. Update Sale Header with Phase 1.1 Columns
            $sale->update([
                'party_id'             => $request->input('customer_id') ?: $sale->party_id,
                'net_sales'            => $netSales,
                'total_tax'            => $totalTax,
                'delivery_charge'      => $deliveryCharge,
                'shipping_charges'     => $deliveryCharge,
                'extra_charge_value'   => $extraCharge,
                'extra_charge_label'   => $request->extra_charge_label,
                'invoice_total'        => $roundedInvoiceTotal,
                'total'                => $roundedInvoiceTotal, // Legacy sync
                'subtotal'             => $netSales,            // Legacy sync
                'global_discount'      => $globalDiscount,
                'subtotal_gross'       => $subtotalGross,
                'total_item_discounts' => $totalItemDiscounts,
                'round_off'            => $roundOff,
                'payment_status'       => $request->amount_paid >= $roundedInvoiceTotal ? 'paid' : ($request->amount_paid > 0 ? 'partial' : 'unpaid'),
                'payment_method'       => $request->payment_method,
                'notes'                => $request->notes,
            ]);

            // 4. Re-create Items & COGS Sum
            $totalCogs = 0;
            foreach ($lineValues as $line) {
                $product   = Product::find($line['product_id']);
                $costPrice = $product->cost_price ?? 0;
                $totalCogs += $costPrice * $line['quantity'];

                SaleItem::create(array_merge($line, [
                    'sale_id'    => $sale->id,
                    'cost_price' => $costPrice,
                    'subtotal'   => $line['unit_price'] * $line['quantity'],
                ]));

                // 4.3 Deduct Stock
                if (\App\Helpers\SettingsHelper::isStockMaintenanceEnabled()) {
                    if (!empty($line['product_variant_id'])) {
                        $variant = ProductVariant::find($line['product_variant_id']);
                        if ($variant) $variant->decrement('stock', $line['quantity']);
                    } else {
                        $stock = \App\Models\Stock::where('product_id', $line['product_id'])->where('warehouse_id', 1)->first();
                        if ($stock) $stock->decrement('quantity', $line['quantity']);
                    }

                    \App\Models\StockMovement::create([
                        'product_id'         => $line['product_id'],
                        'product_variant_id' => $line['product_variant_id'] ?? null,
                        'warehouse_id'       => $sale->warehouse_id ?? 1,
                        'type'               => 'sale',
                        'quantity'           => -$line['quantity'],
                        'reference_id'       => $sale->id,
                        'description'        => 'Sale Update: ' . $sale->reference_number,
                        'user_id'            => auth()->id(),
                    ]);
                }
            }

            // 5. Re-post Journal & Payments
            $addToLedger = $request->boolean('add_to_ledger');
            $tenderedAmount = (float) $request->amount_paid;
            $recordedAmount    = $addToLedger ? $tenderedAmount : min($tenderedAmount, $roundedInvoiceTotal);
            $overpaymentAmount = max(0, $tenderedAmount - $roundedInvoiceTotal);

            $this->postSaleJournal(
                $sale, 
                $request, 
                $netSales, 
                $totalTax, 
                $totalCogs, 
                $roundOff, 
                $roundedInvoiceTotal, 
                $recordedAmount, 
                $overpaymentAmount, 
                $addToLedger
            );

            // 6. Sync Activity
            \App\Models\Activity::updateOrCreate(
                ['reference_id' => $sale->id, 'reference_type' => 'sale'],
                [
                    'type'           => 'sale',
                    'description'    => 'Sale to ' . ($sale->party_id 
                        ? \App\Models\Party::find($sale->party_id)?->name ?? 'Customer' 
                        : 'Walk-in'),
                    'amount'         => $roundedInvoiceTotal,
                    'user_id'        => auth()->id(),
                    'metadata'       => json_encode([
                        'reference_number' => $sale->reference_number,
                        'net_sales'        => $netSales,
                        'total_tax'        => $totalTax,
                        'invoice_total'    => $roundedInvoiceTotal,
                        'items_count'      => count($request->items),
                        'payment_method'   => $request->payment_method,
                        'amount_paid'      => $tenderedAmount,
                    ]),
                ]
            );

            DB::commit();
            return response()->json(['success' => true, 'sale_id' => $sale->id]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Sale Update Error: ' . $e->getMessage());
            $statusCode = $e instanceof \Symfony\Component\HttpKernel\Exception\HttpException ? $e->getStatusCode() : 500;
            return response()->json(['success' => false, 'message' => $e->getMessage()], $statusCode);
        }
    }

    private function postSaleJournal(
        Sale $sale, 
        Request $request, 
        float $netSales, 
        float $totalTax, 
        float $totalCogs, 
        float $roundOff, 
        float $roundedInvoiceTotal, 
        float $recordedAmount, 
        float $overpaymentAmount, 
        bool $addToLedger
    ) {
        // A. Record Payments
        if ($recordedAmount > 0) {
            if ($request->has('payments') && is_array($request->payments) && count($request->payments) > 0) {
                foreach ($request->payments as $p) {
                    $pAmt = (float)($p['amount'] ?? 0);
                    $pMethod = strtolower($p['method'] ?? 'cash');
                    if ($pAmt > 0) {
                        Payment::create([
                            'sale_id'         => $sale->id,
                            'amount'          => $pAmt,
                            'method'          => $pMethod,
                            'type'            => 'in',
                            'bank_account_id' => $p['account_id'] ?? $p['bank_account_id'] ?? null,
                            'date'            => $sale->posted_at ? $sale->posted_at->toDateString() : today()->toDateString(),
                        ]);
                    }
                }
            } else {
                $pmMethod = strtolower($request->payment_method);
                Payment::create([
                    'sale_id'         => $sale->id,
                    'amount'          => $recordedAmount,
                    'method'          => $pmMethod,
                    'type'            => 'in',
                    'bank_account_id' => $request->bank_account_id ?? null,
                    'date'            => $sale->posted_at ? $sale->posted_at->toDateString() : today()->toDateString(),
                ]);
            }
        }

        // B. Construct Journal Items
        $journalItems = [];
        $isLedgerOverpayment = $addToLedger && $overpaymentAmount > 0;
        $cashDebitAmount = $isLedgerOverpayment ? $recordedAmount : min($recordedAmount, $roundedInvoiceTotal);
        
        // DR: Payments
        $amountPaidCounted = 0;
        if ($request->has('payments') && is_array($request->payments) && count($request->payments) > 0) {
            foreach ($request->payments as $p) {
                $pAmt = (float)($p['amount'] ?? 0);
                if ($pAmt <= 0) continue;
                $pMethod = strtolower($p['method'] ?? 'cash');
                
                $acc = null;
                if (!empty($p['account_id'])) {
                    $acc = \App\Models\Account::find($p['account_id']);
                }
                
                if (!$acc) {
                    if ($pMethod === 'credit') {
                        $code = '1200';
                    } else {
                        $code = in_array($pMethod, ['bank', 'card', 'online', 'upi']) ? '1010' : '1000';
                    }
                    $acc = $this->accounting->getAccountByCode($code);
                }
                
                if ($acc) {
                    $journalItems[] = [
                        'account_id'  => $acc->id, 
                        'debit'       => $pAmt, 
                        'credit'      => 0, 
                        'description' => "Payment ($pMethod) for Sale #{$sale->reference_number}",
                        'party_id'    => $sale->party_id
                    ];
                }
                $amountPaidCounted += $pAmt;
            }
        } else {
            if ($cashDebitAmount > 0) {
                $pMethod = strtolower($request->payment_method);
                
                $acc = null;
                if ($request->payment_account_id) {
                    $acc = \App\Models\Account::find($request->payment_account_id);
                }
                
                // Fallback if account not found (e.g. legacy numeric ID 1 passed instead of V3 UUID)
                if (!$acc) {
                    $code = in_array($pMethod, ['bank', 'card', 'online', 'upi']) ? '1010' : '1000';
                    $acc = $this->accounting->getAccountByCode($code);
                }

                if ($acc) {
                    $journalItems[] = [
                        'account_id'  => $acc->id, 
                        'debit'       => $cashDebitAmount, 
                        'credit'      => 0, 
                        'description' => "Payment received for Sale #{$sale->reference_number}",
                        'party_id'    => $sale->party_id
                    ];
                }
                $amountPaidCounted = $cashDebitAmount;
            }
        }

        // DR: Accounts Receivable
        $unpaidBalance = max(0, $roundedInvoiceTotal - $amountPaidCounted);
        if ($unpaidBalance > 0) {
            $ar = $this->accounting->getAccountByCode('1200', 'Accounts Receivable', 'asset');
            $journalItems[] = [
                'account_id'  => $ar->id, 
                'debit'       => $unpaidBalance, 
                'credit'      => 0, 
                'description' => "Credit balance for Sale #{$sale->reference_number}",
                'party_id'    => $sale->party_id
            ];
        }

        // CR: Overpayment
        if ($isLedgerOverpayment) {
            $cr = $this->accounting->getAccountByCode('2050', 'Customer Credit Balances', 'liability');
            $journalItems[] = [
                'account_id'  => $cr->id, 
                'debit'       => 0, 
                'credit'      => $overpaymentAmount, 
                'description' => "Customer credit from Sale #{$sale->reference_number}",
                'party_id'    => $sale->party_id
            ];
        }

        // CR: Revenue
        $rev = $this->accounting->getAccountByCode('4000', 'Sales Revenue', 'income');
        $journalItems[] = [
            'account_id'  => $rev->id, 
            'debit'       => 0, 
            'credit'      => $netSales, 
            'description' => "Revenue from Sale #{$sale->reference_number}",
            'party_id'    => $sale->party_id
        ];

        // CR: Delivery Charges
        $deliveryCharge = (float)($sale->delivery_charge ?? 0);
        if ($deliveryCharge > 0) {
            $deliveryAcc = $this->accounting->getAccountByCode('4100', 'Other Income', 'income');
            $journalItems[] = [
                'account_id'  => $deliveryAcc->id,
                'debit'       => 0,
                'credit'      => $deliveryCharge,
                'description' => "Delivery charges from Sale #{$sale->reference_number}",
                'party_id'    => $sale->party_id
            ];
        }

        // CR: Extra Charges
        $extraCharge = (float)($sale->extra_charge_value ?? 0);
        if ($extraCharge > 0) {
            $extraAcc = $this->accounting->getAccountByCode('4100', 'Other Income', 'income');
            $journalItems[] = [
                'account_id'  => $extraAcc->id,
                'debit'       => 0,
                'credit'      => $extraCharge,
                'description' => "Extra charges from Sale #{$sale->reference_number}",
                'party_id'    => $sale->party_id
            ];
        }

        // CR: Tax
        if ($totalTax > 0) {
            $taxAcc = $this->accounting->getAccountByCode('2100', 'Sales Tax Payable', 'liability');
            $journalItems[] = ['account_id' => $taxAcc->id, 'debit' => 0, 'credit' => $totalTax, 'description' => "Tax collected — #{$sale->reference_number}"];
        }

        // Round Off
        $roundedRoundOff = round($roundOff, 2);
        if (abs($roundedRoundOff) > 0.001) {
            $code = $roundedRoundOff > 0 ? '4900' : '5900';
            $acc = $this->accounting->getAccountByCode($code);
            $journalItems[] = ['account_id' => $acc->id, 'debit' => $roundedRoundOff < 0 ? abs($roundedRoundOff) : 0, 'credit' => $roundedRoundOff > 0 ? abs($roundedRoundOff) : 0, 'description' => "Round off — #{$sale->reference_number}"];
        }

        // COGS
        if ($totalCogs > 0) {
            $cogs = $this->accounting->getAccountByCode('5000', 'Cost of Goods Sold', 'expense');
            $inv = $this->accounting->getAccountByCode('1100', 'Inventory Asset', 'asset');
            $journalItems[] = ['account_id' => $cogs->id, 'debit' => $totalCogs, 'credit' => 0, 'description' => "COGS — #{$sale->reference_number}"];
            $journalItems[] = ['account_id' => $inv->id, 'debit' => 0, 'credit' => $totalCogs, 'description' => "Inventory reduction — #{$sale->reference_number}"];
        }

        return app(\App\Services\V3\AccountingService::class)->createEntry([
            'date'           => $sale->posted_at ? $sale->posted_at->toDateString() : now()->toDateString(),
            'reference_type' => 'sale',
            'reference'      => $sale->id,
            'description'    => "Sale #{$sale->reference_number}",
            'party_id'       => $sale->party_id,
        ], $journalItems);
    }

    public function cancel(Sale $sale)
    {
        // Phase 1.2 — Reversal Engine
        if ($sale->status !== 'posted') {
            return back()->with('error', "Only posted sales can be cancelled. Current status: {$sale->status}.");
        }

        try {
            DB::transaction(function () use ($sale) {
                $reversal = new \App\Services\SaleReversalService();
                $reversal->reverse(
                    sale:   $sale,
                    type:   'cancelled',
                    reason: request()->input('reason', 'Cancelled by user'),
                    userId: auth()->id()
                );
            });

            if (request()->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "Sale {$sale->reference_number} has been cancelled. "
                        . "A counter journal entry has been posted and FIFO stock has been restored.",
                ]);
            }
            return back()->with('success', "Sale {$sale->reference_number} cancelled. Reversal journal entry posted.");

        } catch (\Exception $e) {
            Log::error('Sale Cancel Error', ['sale_id' => $sale->id, 'error' => $e->getMessage()]);
            if (request()->wantsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
            }
            return back()->with('error', 'Cancel failed: ' . $e->getMessage());
        }
    }

    public function bulkDestroy(Request $request)
    {
        Log::info('Bulk Destroy Attempt', ['user_id' => auth()->id(), 'role' => optional(auth()->user())->role, 'ids' => $request->ids]);

        $user = auth()->user();
        if (!$user || !in_array($user->role, ['owner', 'admin', 'platform_admin'])) {
            Log::warning('Bulk Destroy Unauthorized', ['user_id' => auth()->id(), 'role' => optional($user)->role]);
            abort(403, 'Unauthorized action. Only Owners and Admins can delete sales.');
        }

        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:sales,id'
        ]);

        $count = 0;
        $errors = [];

        foreach ($request->ids as $id) {
            try {
                $sale = Sale::findOrFail($id);
                $this->deleteSale($sale);
                $count++;
            } catch (\Exception $e) {
                $errors[] = "Failed to delete sale #{$id}: " . $e->getMessage();
            }
        }

        if (count($errors) > 0) {
            return back()->with('error', 'Deleted ' . $count . ' sales. Errors: ' . implode(', ', $errors));
        }

        return back()->with('success', $count . ' sales deleted and accounting reversed successfully');
    }

    public function destroy(Sale $sale)
    {
        Log::info('Single Destroy Attempt', ['user_id' => auth()->id(), 'role' => optional(auth()->user())->role, 'sale_id' => $sale->id]);

        $user = auth()->user();
        if (!$user || !in_array($user->role, ['owner', 'admin', 'platform_admin'])) {
            Log::warning('Single Destroy Unauthorized', ['user_id' => auth()->id(), 'role' => optional($user)->role]);
            abort(403, 'Unauthorized action. Only Owners and Admins can delete sales.');
        }

        try {
            $this->deleteSale($sale);
            return back()->with('success', 'Sale deleted and accounting reversed successfully');
        } catch (\Exception $e) {
            Log::error('Destroy Error', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return back()->with('error', 'Error deleting sale: ' . $e->getMessage());
        }
    }

    /**
     * The sole authorised path for admin-level deletion of a posted sale.
     *
     * WHAT THIS IS NOT:
     *   - This is NOT a database DELETE of the sale and its journal entries.
     *   - Erasing past journal entries is illegal in double-entry accounting.
     *     It destroys the audit trail and corrupts the trial balance permanently.
     *
     * WHAT THIS IS:
     *   1. The SaleReversalService posts a counter journal entry
     *      (every debit flipped to credit, every credit flipped to debit).
     *      The original entries are preserved forever. The net effect on every
     *      account becomes zero. The trial balance still zeroes out.
     *   2. The FIFO batches that were consumed by this sale are restored to
     *      exactly the quantities they held before the sale ran.
     *   3. The sale is soft-deleted (it remains for compliance reporting).
     *
     * If the sale is already cancelled/returned, reversals have already been
     * posted previously — we only soft-delete the record at this point.
     */
    private function deleteSale(Sale $sale): void
    {
        DB::transaction(function () use ($sale) {

            if ($sale->status === 'posted') {
                // Run the full financial + FIFO reversal.
                // This creates the counter journal entry and restores inventory_batches.
                $reason = request()->input('reason', 'Admin deletion by ' . optional(auth()->user())->name);
                (new \App\Services\SaleReversalService())->reverse(
                    sale:   $sale,
                    type:   'cancelled',
                    reason: $reason,
                    userId: auth()->id() ?? 'system'
                );
            }

            // Soft-delete the sale — it is preserved for compliance / audit queries.
            // forceDelete() is forbidden: it would destroy the FIFO paper trail
            // (sale_item_batches rows) which are the proof of what was consumed.
            $sale->delete();

            Log::info('Sale soft-deleted after reversal', [
                'sale_id'   => $sale->id,
                'reference' => $sale->reference_number,
                'user_id'   => auth()->id(),
            ]);
        });
    }
    public function export(Request $request)
    {
        $query = Sale::with('customer'); // Using Sale model as per controller context

        // Apply filters (same as index)
        if ($request->search) {
            $term = strtolower($request->search);
            $query->where(function ($q) use ($term) {
                $q->where('reference_number', 'like', "%{$term}%")
                    ->orWhereHas('customer', fn($p) => $p->where('name', 'like', "%{$term}%"));
            });
        }
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        $sales = $query->latest()->get();

        $filename = "sales_export_" . date('Y-m-d_H-i') . ".csv";
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function () use ($sales) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Date', 'Invoice No', 'Customer', 'Amount', 'Paid', 'Payment Method']);

            foreach ($sales as $sale) {
                fputcsv($file, [
                    $sale->created_at,
                    $sale->reference_number,
                    $sale->customer->name ?? 'Walk-in',
                    $sale->total,
                    // If no paid column on Sale, check Payments. But usually logic stores in header or calculated.
                    // Index uses withSum('payments as paid_amount'). We should probably load that.
                    $sale->payments->sum('amount'),
                    $sale->payment_method
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
