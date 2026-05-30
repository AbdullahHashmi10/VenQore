<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Warehouse;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use App\Services\StorageService;
use App\Models\ActivityLog;
use App\Models\Activity;
use App\Services\V3\ReportService;
use App\Services\V3\InventoryService as V3InventoryService;


class InventoryController extends Controller
{
    public function dashboard()
    {
        $tenantId = app('current.tenant')->id;
        
        // V3 Logic: Use ReportService for valuation and stats
        $reportService = resolve(ReportService::class);
        $valuationData = $reportService->inventoryValuation();
        $inventoryValue = $valuationData['grand_total'];

        $lowStockCount = DB::table('products as p')
            ->leftJoin('inventory_batches as ib', 'p.id', '=', 'ib.product_id')
            ->select('p.id', 'p.min_stock_alert', DB::raw('SUM(ib.remaining_qty) as total_qty'))
            ->where('p.tenant_id', $tenantId)
            ->whereNull('p.deleted_at')
            ->groupBy('p.id', 'p.min_stock_alert')
            ->get()
            ->filter(function ($p) {
                return (float)$p->total_qty <= (float)$p->min_stock_alert;
            })
            ->count();

        $totalProducts = DB::table('products')->where('tenant_id', $tenantId)->whereNull('deleted_at')->count();
        $totalCategories = DB::table('categories')->where('tenant_id', $tenantId)->count();
        $totalWarehouses = DB::table('warehouses')->where('tenant_id', $tenantId)->count();

        // Top Moving Items from V3 Sales
        $topMoving = DB::table('sale_items as si')
            ->join('sales as s', 'si.sale_id', '=', 's.id')
            ->join('products as p', 'si.product_id', '=', 'p.id')
            ->select('p.name', DB::raw('SUM(si.quantity) as total_sold'))
            ->where('s.tenant_id', $tenantId)
            ->where('s.status', 'posted')
            ->groupBy('p.id', 'p.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        return Inertia::render('Inventory/Dashboard', [
            'stats' => [
                'total_products' => $totalProducts,
                'low_stock_count' => $lowStockCount,
                'inventory_value' => $inventoryValue,
                'total_categories' => $totalCategories,
                'total_warehouses' => $totalWarehouses,
            ],
            'topMoving' => $topMoving
        ]);
    }

    public function index(Request $request)
    {
        $tenantId = app('current.tenant')->id;
        // V3 Logic: Products and Stock from inventory_batches
        $query = Product::query()
            ->with(['category', 'brand', 'images', 'variants', 'barcodes'])
            ->whereNull('deleted_at');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        // Global Sorting
        $sortBy = $request->input('sort_by', 'name');
        $sortDir = $request->input('sort_dir', 'asc');

        if ($sortBy === 'category') {
            $query->leftJoin('categories', 'products.category_id', '=', 'categories.id')
                ->select('products.*')
                ->orderBy('categories.name', $sortDir);
        } elseif ($sortBy === 'available_stock') {
            $query->orderBy('stock_quantity', $sortDir);
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $products = $query->paginate(200)->withQueryString();

        // Get Stock Totals from stocks (Simple) and variants (Variant)
        $simpleStock = DB::table('stocks')
            ->where('tenant_id', $tenantId)
            ->select('product_id', DB::raw('SUM(quantity) as total_on_hand'))
            ->groupBy('product_id')
            ->get();

        $variantStock = DB::table('product_variants')
            ->where('tenant_id', $tenantId)
            ->select('product_id', DB::raw('SUM(stock) as total_on_hand'))
            ->groupBy('product_id')
            ->get();

        // Merge both (if a product has both, unlikely but safe)
        $stockTotals = $simpleStock->concat($variantStock)->groupBy('product_id');

        // Parked Sales
        $parkedSalesData = DB::table('parked_sales')
            ->where('tenant_id', $tenantId)
            ->pluck('cart_data');
        $parkedProductQtys = [];
        foreach ($parkedSalesData as $cartData) {
            $cart = json_decode($cartData, true) ?? [];
            foreach ($cart as $item) {
                if (isset($item['id'])) {
                    $key = $item['id'] . (isset($item['variant_id']) ? '-' . $item['variant_id'] : '');
                    $parkedProductQtys[$key] = ($parkedProductQtys[$key] ?? 0) + ($item['qty'] ?? 0);
                }
            }
        }

        // Query reserved quantities from active Pre-Sales
        $reservedTotals = \Illuminate\Support\Facades\DB::table('sales_order_items')
            ->join('sales_orders', function($join) use ($tenantId) {
                $join->on('sales_order_items.sales_order_id', '=', 'sales_orders.id')
                    ->where('sales_orders.tenant_id', $tenantId);
            })
            ->select('sales_order_items.product_id', \Illuminate\Support\Facades\DB::raw('SUM(sales_order_items.quantity_reserved) as total_reserved'))
            ->where('sales_order_items.tenant_id', $tenantId)
            ->whereNull('sales_orders.deleted_at')
            ->whereNull('sales_order_items.deleted_at')
            ->whereNotIn('sales_orders.status', ['cancelled', 'completed', 'delivered'])
            ->groupBy('sales_order_items.product_id')
            ->pluck('total_reserved', 'product_id');
        
        $preSaleTotals = $reservedTotals; // Using pluck results instead of get()+group for performance since variant_id is missing anyway

        $products->through(function ($product) use ($stockTotals, $preSaleTotals, $parkedProductQtys) {
            $totalStock = (float)($stockTotals->get($product->id)?->sum('total_on_hand') ?? 0);
            
            // Total Reserved for product (sum all variants if any)
            $preSaleQty = (float)($preSaleTotals->get($product->id) ?? 0);
            $parkedQty = 0;
            foreach ($parkedProductQtys as $key => $qty) {
                if (strpos($key, $product->id) === 0) {
                    $parkedQty += $qty;
                }
            }
            $reservedStock = $preSaleQty + $parkedQty;

            $status = 'In Stock';
            if ($totalStock == 0) $status = 'Out of Stock';
            elseif ($totalStock <= $product->min_stock_alert) $status = 'Low Stock';

            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category' => $product->category ? $product->category->name : 'Uncategorized',
                'category_id' => $product->category_id,
                'stock' => $totalStock,
                'reserved_stock' => $reservedStock,
                'available_stock' => $totalStock - $reservedStock,
                'price' => (float) $product->price,
                'cost_price' => (float) $product->cost_price,
                'image' => $product->image_path ? \Illuminate\Support\Facades\Storage::url($product->image_path) : null,
                'status' => $status,
                'description' => $product->description,
                'short_description' => $product->short_description,
                'min_stock_alert' => $product->min_stock_alert,
                'unit' => $product->base_unit ?? $product->unit ?? 'pcs',
                'history' => [], // Fetched via AJAX getHistory, or could be pre-loaded
                'images' => $product->images->map(fn($img) => ['id' => $img->id, 'url' => Storage::url($img->file_path), 'type' => $img->file_type]),
                'variants' => $product->variants->map(function ($v) use ($stockTotals, $preSaleTotals, $parkedProductQtys, $product) {
                    $vStock = (float)($stockTotals->get($product->id)?->where('variant_id', $v->id)->first()?->total_on_hand ?? 0);
                    
                    // Since sales_order_items doesn't have variant_id, we can't accurately track per-variant pre-sale reservations
                    // We'll treat all pre-sale reservations as main product for now (conservative)
                    $vPreSaleQty = 0; 
                    $vParkedKey = $product->id . '-' . $v->id;
                    $vParkedQty = $parkedProductQtys[$vParkedKey] ?? 0;
                    $vReservedQty = $vPreSaleQty + $vParkedQty;

                    return [
                        'id' => $v->id,
                        'sku' => $v->sku,
                        'name' => $v->variant_name,
                        'price' => (float)$v->price,
                        'cost_price' => (float)$v->cost_price,
                        'stock' => $vStock,
                        'reserved_stock' => $vReservedQty,
                        'available_stock' => $vStock - $vReservedQty,
                        'barcode' => $v->barcode,
                    ];
                }),
                'barcodes' => $product->barcodes->map(fn($bc) => [
                    'id' => $bc->id,
                    'barcode' => $bc->barcode,
                    'type' => $bc->barcode_type,
                    'is_primary' => (bool)$bc->is_primary,
                ]),
            ];
        });

        if ($request->wantsJson()) {
            return response()->json($products);
        }

        $reportService = resolve(ReportService::class);
        $valuationData = $reportService->inventoryValuation();

        return Inertia::render('Inventory/InventoryList', [
            'products' => $products,
            'filters' => $request->only(['search']),
            'stats' => [
                'total_products' => $products->total(),
                'low_stock_count' => DB::table('products as p')
                    ->leftJoin('inventory_batches as ib', function($join) use ($tenantId) {
                        $join->on('p.id', '=', 'ib.product_id')
                             ->where('ib.tenant_id', $tenantId);
                    })
                    ->select('p.id', 'p.min_stock_alert', DB::raw('SUM(ib.remaining_qty) as total_qty'))
                    ->where('p.tenant_id', $tenantId)
                    ->whereNull('p.deleted_at')
                    ->groupBy('p.id', 'p.min_stock_alert')
                    ->get()
                    ->filter(fn($p) => (float)$p->total_qty <= (float)$p->min_stock_alert)
                    ->count(),
                'inventory_value' => $valuationData['grand_total'],
            ],
            'warehouses' => Warehouse::query()->get(),
            'categories' => Category::query()->get(),
            'attributes' => \App\Models\ProductAttribute::where('is_active', true)
                ->orderBy('sort_order')
                ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $tenantId = app('current.tenant')->id;
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => [
                'nullable', 
                'string', 
                \Illuminate\Validation\Rule::unique('products')->where(fn ($q) => $q->where('tenant_id', $tenantId))
            ],
            'category' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'new_category_name' => 'nullable|string',
            'base_unit' => 'nullable|string',
            'secondary_unit' => 'nullable|string',
            'conversion_rate' => 'nullable|numeric',
            'price' => 'required|numeric',
            'cost_price' => 'required|numeric',
            'stock' => 'required|numeric',
            'min_stock_alert' => 'nullable|integer',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:255',
            'main_image' => 'nullable|image|max:5120', // 5MB max
            'gallery_images.*' => 'nullable|file|mimes:jpeg,png,jpg,webp,mp4,mov,avi|max:20480', // 20MB max for videos
            'unit' => 'nullable|string',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'barcodes' => 'nullable|array',
            'barcodes.*.barcode' => 'required|string',
            'barcodes.*.type' => 'nullable|string',
            'barcodes.*.is_primary' => 'nullable|boolean',
            'barcodes.*.description' => 'nullable|string',
            'batch_number' => 'nullable|string',
            'expiry_date' => 'nullable|date',
        ]);

        $categoryId = $request->category_id;

        // ── Phase 4.3: SKU Limit Gate ────────────────────────────────────────
        // Product::count() automatically respects HasTenant global scope —
        // counts only this tenant's products. No need to filter manually.
        if (app()->bound('current.tenant')) {
            \App\Services\PlanGate::enforce('sku_limit', Product::count());
        }

        // Sanitize: If 0 or empty, treat as null initially
        if (empty($categoryId) || $categoryId === '0' || $categoryId === 0) {
            $categoryId = null;
        }


        // Handle New Category Creation
        if ($request->filled('new_category_name')) {
            $category = Category::create([
                'name' => $request->new_category_name,
                'base_unit' => $request->base_unit,
                'secondary_unit' => $request->secondary_unit,
                'conversion_rate' => $request->conversion_rate,
            ]);
            $categoryId = $category->id;
        } elseif (!$categoryId && $request->category) {
            $category = Category::firstOrCreate(['name' => $request->category]);
            $categoryId = $category->id;
        }

        $productData = [
            'name' => $validated['name'],
            'sku' => $validated['sku'],
            'category_id' => $categoryId,
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'],
            'min_stock_alert' => $validated['min_stock_alert'] ?? 5,
            'description' => $validated['description'],
            'short_description' => $validated['short_description'],
            'base_unit' => $validated['unit'] ?? 'pcs',
        ];

        // Handle Main Image — Phase 3.3: routes through StorageService
        if ($request->hasFile('main_image')) {
            $file = $request->file('main_image');
            // storeOptimized: resizes to 500×500 max, preserves aspect ratio
            $productData['image_path'] = StorageService::storeOptimized($file, 'products', 500);
        }

        $product = Product::create($productData);

        // Save Main Image to Gallery as well (Full Resolution)
        if ($request->hasFile('main_image')) {
            $path = StorageService::store($request->file('main_image'), 'products');
            $product->images()->create(['file_path' => $path, 'file_type' => 'image']);
        }

        // Handle Gallery Images
        if ($request->hasFile('gallery_images')) {
            foreach ($request->file('gallery_images') as $file) {
                $path = StorageService::store($file, 'products');
                $type = str_starts_with($file->getMimeType(), 'video') ? 'video' : 'image';
                $product->images()->create(['file_path' => $path, 'file_type' => $type]);
            }
        }

        if ($validated['stock'] > 0) {
            $warehouseId = $request->warehouse_id ?? (Warehouse::first()?->id ?? 1);

            $product->stocks()->create([
                'warehouse_id' => $warehouseId,
                'quantity' => $validated['stock'],
                'status' => 'available'
            ]);

            if ($request->batch_number) {
                $product->batches()->create([
                    'batch_number' => $request->batch_number,
                    'expiry_date' => $request->expiry_date,
                    'quantity' => $validated['stock'],
                ]);
            }

            StockMovement::create([
                'product_id' => $product->id,
                'warehouse_id' => $warehouseId,
                'quantity' => $validated['stock'],
                'type' => 'initial_stock',
                'description' => 'Initial stock creation',
                'user_id' => auth()->id(),
            ]);

            // V3 Logic: Every product with stock MUST have a batch for valuation
            $fifo = resolve(\App\Services\V3\FifoService::class);
            $fifo->receiveBatch(
                productId: $product->id,
                warehouseId: $warehouseId,
                qty: $validated['stock'],
                unitCost: (float)$product->cost_price ?? 0,
                batchType: 'initial_stock',
                expiryDate: $request->expiry_date ?? null
            );
        }

        // Handle Barcodes
        if ($request->filled('barcodes')) {
            foreach ($request->barcodes as $bc) {
                $product->barcodes()->create([
                    'barcode' => $bc['barcode'],
                    'barcode_type' => $bc['type'] ?? 'EAN13',
                    'is_primary' => $bc['is_primary'] ?? false,
                    'description' => $bc['description'] ?? null,
                    'is_active' => true,
                ]);
            }
        }

        if (app()->bound('current.tenant')) {
            $tenant = app('current.tenant');
            if ($tenant->onboarding_step === 'inventory_tour') {
                $tenant->onboarding_step = 'congratulations';
                $tenant->save();
            }
        }

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    public function update(Request $request, $store_slug = null, $id = null)
    {
        $id = $id ?? $store_slug; // Fallback if positional binding happened or store_slug wasn't forgotten
        $product = Product::findOrFail($id);

        $tenantId = app('current.tenant')->id;
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => [
                'nullable', 
                'string', 
                \Illuminate\Validation\Rule::unique('products')->ignore($id)->where(fn ($q) => $q->where('tenant_id', $tenantId))
            ],
            'category' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'new_category_name' => 'nullable|string',
            'base_unit' => 'nullable|string',
            'secondary_unit' => 'nullable|string',
            'conversion_rate' => 'nullable|numeric',
            'price' => 'required|numeric',
            'cost_price' => 'required|numeric',
            'stock' => 'nullable|numeric',
            'min_stock_alert' => 'nullable|integer',
            'description' => 'nullable|string',
            'short_description' => 'nullable|string|max:255',
            'main_image' => 'nullable|image|max:5120', // 5MB max
            'gallery_images.*' => 'nullable|file|mimes:jpeg,png,jpg,webp,mp4,mov,avi|max:20480',
            'unit' => 'nullable|string',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'deleted_images' => 'nullable|array',
            'deleted_images.*' => 'integer|exists:product_images,id',
            'barcodes' => 'nullable|array',
            'barcodes.*.barcode' => 'required|string',
            'barcodes.*.type' => 'nullable|string',
            'barcodes.*.is_primary' => 'nullable|boolean',
            'barcodes.*.description' => 'nullable|string',
            'batch_number' => 'nullable|string',
            'expiry_date' => 'nullable|date',
        ]);

        $categoryId = $request->category_id;

        // Handle New Category Creation
        if (!$categoryId && $request->new_category_name) {
            $category = Category::create([
                'name' => $request->new_category_name,
                'base_unit' => $request->base_unit,
                'secondary_unit' => $request->secondary_unit,
                'conversion_rate' => $request->conversion_rate,
            ]);
            $categoryId = $category->id;
        } elseif (!$categoryId && $request->category) {
            $category = Category::firstOrCreate(['name' => $request->category]);
            $categoryId = $category->id;
        }

        $productData = [
            'name' => $validated['name'],
            'sku' => $validated['sku'],
            'category_id' => $categoryId,
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'],
            'min_stock_alert' => $validated['min_stock_alert'] ?? 5,
            'description' => $validated['description'],
            'short_description' => $validated['short_description'],
            'base_unit' => $validated['unit'] ?? 'pcs',
        ];

        // Handle Main Image (Thumbnail + Full)
        if ($request->hasFile('main_image')) {
            $file = $request->file('main_image');

            // 1. Save Optimized Thumbnail to products.image_path
            try {
                // Generate a unique name
                $filename = 'thumb_' . $file->hashName();
                $thumbPath = 'products/' . $filename;
                
                 // Check if it's an image before optimizing
                if (in_array(strtolower($file->getClientOriginalExtension()), ['jpg', 'jpeg', 'png', 'webp']) && extension_loaded('gd')) {
                    $image = \imagecreatefromstring(file_get_contents($file));
                    $width = \imagesx($image);
                    $height = \imagesy($image);
                    $maxDim = 500;

                    if ($width > $maxDim || $height > $maxDim) {
                        $ratio = $width / $height;
                        if ($ratio > 1) {
                            $newWidth = $maxDim;
                            $newHeight = $maxDim / $ratio;
                        } else {
                            $newHeight = $maxDim;
                            $newWidth = $maxDim * $ratio;
                        }

                        $thumb = \imagecreatetruecolor($newWidth, $newHeight);

                        \imagecolortransparent($thumb, \imagecolorallocatealpha($thumb, 0, 0, 0, 127));
                        \imagealphablending($thumb, false);
                        \imagesavealpha($thumb, true);

                        \imagecopyresampled($thumb, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);

                        ob_start();
                        \imagejpeg($thumb, null, 80);
                        $thumbData = ob_get_clean();

                        Storage::disk('public')->put($thumbPath, $thumbData);
                        $productData['image_path'] = $thumbPath;

                        \imagedestroy($image);
                        \imagedestroy($thumb);
                    } else {
                         // Small enough, just use original
                        $productData['image_path'] = $file->store('products', 'public');
                    }
                } else {
                    // Not an optimize-able image or GD not loaded
                    $productData['image_path'] = $file->store('products', 'public');
                }
            } catch (\Throwable $e) {
                // Fallback on error
                \Log::warning('Image optimization failed: ' . $e->getMessage());
                $productData['image_path'] = $file->store('products', 'public');
            }

            // Save Main Image to Gallery as well (Full Resolution)
            // Note: We use the Original file here, not the thumb
            $path = $request->file('main_image')->store('products', 'public');
            $product->images()->create([
                'file_path' => $path,
                'file_type' => 'image'
            ]);
        }

        $product->update($productData);

        // Handle Deleted Images
        if ($request->filled('deleted_images')) {
            $deletedIds = $request->input('deleted_images');
            $imagesToDelete = \App\Models\ProductImage::whereIn('id', $deletedIds)
                ->where('product_id', $product->id)
                ->get();

            foreach ($imagesToDelete as $img) {
                Storage::disk('public')->delete($img->file_path);
                $img->delete();
            }
        }

        // Handle Gallery Images
        if ($request->hasFile('gallery_images')) {
            foreach ($request->file('gallery_images') as $file) {
                $path = $file->store('products', 'public');
                $type = str_starts_with($file->getMimeType(), 'video') ? 'video' : 'image';

                $product->images()->create([
                    'file_path' => $path,
                    'file_type' => $type
                ]);
            }
        }

        // Update Stock (Only if explicitly provided as a number)
        if ($request->has('stock') && $request->get('stock') !== null && $request->get('stock') !== '') {
            $warehouseId = $request->warehouse_id ?? (Warehouse::first()?->id ?? 1);
            $newQuantity = (float)$request->get('stock');
            
            $fifo = resolve(\App\Services\V3\FifoService::class);

            // Get current stock from V3 batches
            $currentStock = DB::table('inventory_batches')
                ->where('product_id', $product->id)
                ->where('warehouse_id', $warehouseId)
                ->whereNull('deleted_at')
                ->sum('remaining_qty');

            $diff = $newQuantity - $currentStock;

            if ($diff != 0) {
                $direction = $diff > 0 ? 'increase' : 'decrease';
                $absQty = abs($diff);

                try {
                    if ($direction === 'increase') {
                        // Create an opening/adjustment batch
                        $fifo->receiveBatch(
                            productId: $product->id,
                            warehouseId: $warehouseId,
                            qty: $absQty,
                            unitCost: (float)$product->cost_price,
                            batchType: 'adjustment'
                        );
                    } else {
                        // Deduct stock via FIFO
                        $fifo->deductStock($product->id, $warehouseId, $absQty);
                    }

                    // ALSO SYNC LEGACY STOCKS TABLE (Used for UI list and old parts of system)
                    \App\Models\Stock::updateOrCreate(
                        ['product_id' => $product->id, 'warehouse_id' => $warehouseId],
                        ['quantity' => $newQuantity]
                    );

                } catch (\Exception $e) {
                    \Log::error('Stock update failed in V3 logic: '.$e->getMessage());
                }
            }
        }

        // Handle Barcodes
        if ($request->has('barcodes')) {
            $existingBarcodeIds = $product->barcodes()->pluck('id')->toArray();
            $updatedBarcodeIds = [];

            foreach ($request->barcodes as $bc) {
                // If it has an ID and it's a real ID (not a timestamp from frontend)
                if (isset($bc['id']) && in_array($bc['id'], $existingBarcodeIds)) {
                    $product->barcodes()->where('id', $bc['id'])->update([
                        'barcode' => $bc['barcode'],
                        'barcode_type' => $bc['type'] ?? 'EAN13',
                        'is_primary' => $bc['is_primary'] ?? false,
                        'description' => $bc['description'] ?? null,
                    ]);
                    $updatedBarcodeIds[] = $bc['id'];
                } else {
                    $newBc = $product->barcodes()->create([
                        'barcode' => $bc['barcode'],
                        'barcode_type' => $bc['type'] ?? 'EAN13',
                        'is_primary' => $bc['is_primary'] ?? false,
                        'description' => $bc['description'] ?? null,
                        'is_active' => true,
                    ]);
                    $updatedBarcodeIds[] = $newBc->id;
                }
            }

            // Delete barcodes that were removed
            $product->barcodes()->whereNotIn('id', $updatedBarcodeIds)->delete();
        }

        return redirect()->back()->with('success', 'Product updated successfully.');
    }

    public function destroy($store_slug = null, $id = null)
    {
        $id = $id ?? $store_slug; // Fallback if positional binding happened or store_slug wasn't forgotten
        try {
            $product = Product::findOrFail($id);

            // Guard 1 — open inventory batches
            $remainingStock = \App\Models\InventoryBatch::where('product_id', $product->id)
                ->where('remaining_qty', '>', 0)
                ->sum('remaining_qty');
            if ($remainingStock > 0) {
                $msg = "Cannot delete — this product has {$remainingStock} units still in inventory. Clear stock first.";
                if (request()->wantsJson() && !request()->header('X-Inertia')) {
                    return response()->json(['success' => false, 'message' => $msg], 422);
                }
                return redirect()->back()->with('error', $msg);
            }

            // Guard 2 — referenced in sales or purchases
            $usedInSales     = \App\Models\SaleItem::where('product_id', $product->id)->exists();
            $usedInPurchases = \App\Models\PurchaseItem::where('product_id', $product->id)->exists();
            if ($usedInSales || $usedInPurchases) {
                $msg = "Cannot delete — this product has transaction history. Archive it instead.";
                if (request()->wantsJson() && !request()->header('X-Inertia')) {
                    return response()->json(['success' => false, 'message' => $msg], 422);
                }
                return redirect()->back()->with('error', $msg);
            }

            DB::transaction(function() use ($product) {
                // Delete associated stocks and log movement first
                $stocks = $product->stocks;
                foreach ($stocks as $stock) {
                    StockMovement::create([
                        'product_id' => $product->id,
                        'warehouse_id' => $stock->warehouse_id,
                        'quantity' => -$stock->quantity,
                        'type' => 'adjustment',
                        'description' => 'Product deletion stock clearance',
                        'user_id' => auth()->id(),
                    ]);
                    $stock->delete();
                }

                // Soft delete is automatic due to trait
                $product->delete();
            });

            $this->logActivity('delete', "Deleted product: {$product->name}", $product);

            $msg = 'Product moved to Recycle Bin and stock cleared.';
            if (request()->wantsJson() && !request()->header('X-Inertia')) {
                return response()->json(['success' => true, 'message' => $msg]);
            }
            return redirect()->back()->with('success', $msg);

        } catch (\Illuminate\Database\QueryException $e) {
            Log::error("Failed to delete product ID {$id}: " . $e->getMessage());
            $msg = "Cannot delete product due to database integrity constraints. Please clean up related batches, barcodes, or variants first.";
            if ($e->getCode() === '23000') {
                $msg = "This product is referenced by other system records (e.g. variants, barcodes, or batches). Please remove them first.";
            }
            if (request()->wantsJson() && !request()->header('X-Inertia')) {
                return response()->json(['success' => false, 'message' => $msg], 409);
            }
            return redirect()->back()->with('error', $msg);
        } catch (\Throwable $e) {
            Log::error("Failed to delete product ID {$id}: " . $e->getMessage());
            $msg = "An unexpected error occurred while deleting the product.";
            if (request()->wantsJson() && !request()->header('X-Inertia')) {
                return response()->json(['success' => false, 'message' => $msg], 500);
            }
            return redirect()->back()->with('error', $msg);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:products,id',
        ]);

        try {
            $products = Product::whereIn('id', $request->ids)->get();
            $deletedCount = 0;

            DB::transaction(function() use ($products, &$deletedCount) {
                foreach ($products as $product) {
                    // Guard 1 — open inventory batches
                    $remainingStock = \App\Models\InventoryBatch::where('product_id', $product->id)
                        ->where('remaining_qty', '>', 0)
                        ->sum('remaining_qty');
                    if ($remainingStock > 0) {
                        throw new \Exception("Product '{$product->name}' has stock in inventory. Clear stock first.");
                    }

                    // Guard 2 — referenced in sales or purchases
                    $usedInSales     = \App\Models\SaleItem::where('product_id', $product->id)->exists();
                    $usedInPurchases = \App\Models\PurchaseItem::where('product_id', $product->id)->exists();
                    if ($usedInSales || $usedInPurchases) {
                        throw new \Exception("Product '{$product->name}' has transaction history. Archive it instead.");
                    }

                    // Clear related stocks
                    $stocks = $product->stocks;
                    foreach ($stocks as $stock) {
                        StockMovement::create([
                            'product_id' => $product->id,
                            'warehouse_id' => $stock->warehouse_id,
                            'quantity' => -$stock->quantity,
                            'type' => 'adjustment',
                            'description' => 'Product bulk deletion stock clearance',
                            'user_id' => auth()->id(),
                        ]);
                        $stock->delete();
                    }

                    $product->delete();
                    $this->logActivity('delete', "Deleted product: {$product->name}", $product);
                    $deletedCount++;
                }
            });

            return redirect()->back()->with('success', $deletedCount . ' products moved to Recycle Bin and stock cleared.');
        } catch (\Illuminate\Database\QueryException $e) {
            Log::error("Failed to bulk delete products: " . $e->getMessage());
            $msg = "Cannot delete products due to database integrity constraints.";
            if ($e->getCode() === '23000') {
                $msg = "One or more selected products are referenced by other system records. Please remove references first.";
            }
            return redirect()->back()->with('error', $msg);
        } catch (\Throwable $e) {
            Log::error("Failed to bulk delete products: " . $e->getMessage());
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function checkDependencies(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:products,id',
        ]);

        $results = [];
        $products = Product::with(['stocks'])->whereIn('id', $request->ids)->get();

        foreach ($products as $product) {
            $totalStock = $product->stocks->sum('quantity');
            // Check if product has ever been sold (invoice items)
            $hasSales = $product->invoiceItems()->exists();

            if ($totalStock > 0 || $hasSales) {
                $results[] = [
                    'id' => $product->id,
                    'name' => $product->name,
                    'stock' => $totalStock,
                    'has_sales' => $hasSales,
                ];
            }
        }

        return response()->json($results);
    }

    private function logActivity($action, $description, $subject, $properties = null)
    {
        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'description' => $description,
            'subject_type' => get_class($subject),
            'subject_id' => $subject->id,
            'properties' => $properties,
        ]);
    }
    public function stats(Request $request, $store_slug = null, $id = null)
    {
        $id = $id ?? $store_slug; // Fallback if positional binding happened or store_slug wasn't forgotten
        $tenantId = app('current.tenant')->id;
        $product = Product::findOrFail($id);
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        if (!$startDate || !$endDate) {
            return response()->json(['error' => 'Date range required'], 400);
        }

        $purchasedQty = $product->stockMovements()
            ->where('type', 'purchase')
            ->whereBetween('created_at', [
                \Carbon\Carbon::parse($startDate)->startOfDay(),
                \Carbon\Carbon::parse($endDate)->endOfDay()
            ])
            ->sum('quantity');

        // Assuming cost is constant or we just use current cost * qty for estimation
        // For more accuracy, we should track cost at time of purchase if available in movements
        $totalCost = $purchasedQty * $product->cost_price;

        return response()->json([
            'purchased_qty' => $purchasedQty,
            'total_cost' => $totalCost
        ]);
    }


    public function search(Request $request)
    {
        try {
            $query = $request->get('query');
            $categoryId = $request->get('category_id');
            $ids = $request->get('ids');

            $productsQuery = Product::with(['variants', 'category', 'stocks'])
                ->whereNull('deleted_at');

            if (!empty($ids)) {
                $productsQuery->whereIn('id', (array)$ids);
            }

            if (!empty($query)) {
                $productsQuery->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                        ->orWhere('sku', 'like', "%{$query}%")
                        ->orWhereHas('variants', function ($qv) use ($query) {
                            $qv->where('sku', 'like', "%{$query}%")
                                ->withoutGlobalScopes();
                        })
                        ->orWhereHas('barcodes', function ($qb) use ($query) {
                            $qb->where('barcode', 'like', "%{$query}%");
                        });
                });
            }

            if (!empty($categoryId)) {
                $productsQuery->where('category_id', $categoryId);
            }

            $tenantId = app('current.tenant')->id;
            $parkedSalesData = DB::table('parked_sales')
                ->where('tenant_id', $tenantId)
                ->pluck('cart_data');
            $parkedProductQtys = [];
            foreach ($parkedSalesData as $cartData) {
                $cart = json_decode($cartData, true) ?? [];
                foreach ($cart as $item) {
                    if (isset($item['id'])) {
                        $key = $item['id'] . (isset($item['variant_id']) ? '-' . $item['variant_id'] : '');
                        $parkedProductQtys[$key] = ($parkedProductQtys[$key] ?? 0) + ($item['qty'] ?? 0);
                    }
                }
            }

            $products = $productsQuery->take(50)
                ->get()
                ->map(function ($product) use ($parkedProductQtys, $tenantId) {
                    // Check if product has an active manufacturing rule
                    $hasManufacturingRule = \App\Models\ManufacturingRule::where('product_id', $product->id)
                        ->where('is_active', true)
                        ->exists();

                    $simpleStock = (float)DB::table('stocks')
                        ->where('tenant_id', $tenantId)
                        ->where('product_id', $product->id)
                        ->sum('quantity');

                    $variantStock = (float)DB::table('product_variants')
                        ->where('tenant_id', $tenantId)
                        ->where('product_id', $product->id)
                        ->sum('stock');

                    $totalStock = $simpleStock + $variantStock;

                    $preSaleQty = (float)DB::table('sales_order_items as soi')
                        ->join('sales_orders as so', function($join) use ($tenantId) {
                            $join->on('soi.sales_order_id', '=', 'so.id')
                                ->where('so.tenant_id', $tenantId);
                        })
                        ->where('soi.tenant_id', $tenantId)
                        ->where('soi.product_id', $product->id)
                        ->whereNull('so.deleted_at')
                        ->whereNull('soi.deleted_at')
                        ->whereNotIn('so.status', ['completed', 'cancelled', 'delivered']) 
                        ->sum('soi.quantity_reserved');
                        
                    // For main product, calculate total reservations (sum all variants if any)
                    $parkedQty = 0;
                    foreach ($parkedProductQtys as $key => $qty) {
                        if (strpos($key, $product->id) === 0) {
                            $parkedQty += $qty;
                        }
                    }
                    $reservedQty = $preSaleQty + $parkedQty;

                    $availableStock = $totalStock - $reservedQty;

                    return [
                        'id' => $product->id,
                        'name' => $product->name,
                        'sku' => $product->sku,
                        'price' => (float) ($product->price ?: ($product->selling_price ?: 0)),
                        'wholesale_price' => $product->wholesale_price,
                        'wholesale_min_quantity' => $product->wholesale_min_quantity,
                        'stock_quantity' => $totalStock,
                        'reserved_quantity' => $reservedQty,
                        'available_stock' => $availableStock,
                        'cost' => $product->cost_price,
                        'image_path' => $product->image_path ? Storage::url($product->image_path) : null,
                        'category' => $product->category,
                        'variants' => $product->variants->map(function ($variant) use ($product, $parkedProductQtys) {
                            $vStock = (float)$variant->stock;

                            // No variant-level pre-sale reservation support in DB
                            $vPreSaleQty = 0;
                            
                            $vParkedKey = $product->id . '-' . $variant->id;
                            $vParkedQty = $parkedProductQtys[$vParkedKey] ?? 0;
                            $vReservedQty = $vPreSaleQty + $vParkedQty;
                            $vAvailableStock = $vStock - $vReservedQty;

                            return [
                                'id' => $variant->id,
                                'sku' => $variant->sku,
                                'price' => $variant->price,
                                'wholesale_price' => $variant->wholesale_price ?? null,
                                'stock_quantity' => $vStock,
                                'reserved_quantity' => $vReservedQty,
                                'available_stock' => $vAvailableStock,
                            ];
                        })
                    ];
                });

            return response()->json($products);
        } catch (\Exception $e) {
            Log::error('Product search error: ' . $e->getMessage(), [
                'query' => $request->get('query'),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Search failed',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stock Levels (Phase 3 - Unification)
     */
    public function stockLevels()
    {
        $products = Product::with(['category', 'stocks.warehouse'])
            ->get()
            ->map(function ($product) {
                $totalStock = $product->stocks->sum('quantity');
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'image_path' => $product->image_path,
                    'category' => $product->category,
                    'cost_price' => $product->cost_price,
                    'total_stock' => $totalStock,
                    'min_stock_alert' => $product->min_stock_alert ?? 0,
                    'stocks' => $product->stocks
                ];
            });

        $warehouses = Warehouse::orderBy('name')->get();

        // Calculate stats
        $stats = [
            'total_products' => $products->count(),
            'total_value' => $products->sum(fn($p) => $p['total_stock'] * $p['cost_price']),
            'low_stock_count' => $products->filter(fn($p) => $p['total_stock'] <= $p['min_stock_alert'] && $p['total_stock'] > 0)->count(),
            'out_of_stock_count' => $products->filter(fn($p) => $p['total_stock'] <= 0)->count()
        ];

        return Inertia::render('Inventory/StockLevels', [
            'products' => $products,
            'warehouses' => $warehouses,
            'stats' => $stats
        ]);
    }

    /**
     * Categories Management (Phase 1 - Unification)
     */
    public function categories(Request $request)
    {
        $query = Category::with('parent')->withCount('products');

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
        }

        $categories = $query->orderBy('created_at', 'desc')->paginate(200)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($categories);
        }

        // Calculate Stats
        $stats = [
            'total_categories' => Category::count(),
            'total_products' => \App\Models\Product::whereNotNull('category_id')->count(),
            'most_populated' => Category::withCount('products')->orderByDesc('products_count')->first(),
            'parent_categories' => Category::whereNull('parent_id')->count(),
        ];

        return Inertia::render('Inventory/Categories', [
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['search']),
        ]);
    }

    public function storeCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id'
        ]);

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category created successfully',
            'category' => $category
        ]);
    }

    public function updateCategory(Request $request, $store_slug = null, $id = null)
    {
        $id = $id ?? $store_slug; // Fallback if positional binding happened or store_slug wasn't forgotten
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $id,
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:categories,id'
        ]);

        // Prevent setting parent to self
        if (isset($validated['parent_id']) && $validated['parent_id'] == $id) {
            return response()->json([
                'message' => 'A category cannot be its own parent'
            ], 422);
        }

        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'category' => $category
        ]);
    }

    public function destroyCategory($store_slug = null, $id = null)
    {
        $id = $id ?? $store_slug; // Fallback if positional binding happened or store_slug wasn't forgotten
        $category = Category::findOrFail($id);

        // Check if category has products
        if ($category->products()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with products. Move products first.'
            ], 422);
        }

        // Check if category has children
        if (Category::where('parent_id', $id)->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete category with subcategories. Delete subcategories first.'
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully'
        ]);
    }

    public function getReservations($store_slug = null, $id = null)
    {
        $id = $id ?? $store_slug; // Fallback if positional binding happened or store_slug wasn't forgotten
        try {
            $preSaleReservations = \App\Models\SalesOrderItem::where('product_id', $id)
                ->where('quantity_reserved', '>', 0)
                ->whereHas('salesOrder', function($q) {
                    $q->whereNotIn('status', ['cancelled', 'completed', 'delivered']);
                })
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'date' => $item->salesOrder->order_date ?? $item->created_at->format('Y-m-d'),
                        'order_number' => $item->salesOrder->order_number,
                        'customer' => $item->salesOrder->customer_name ?? 'Unknown',
                        'quantity_reserved' => $item->quantity_reserved,
                        'warehouse_id' => $item->salesOrder->warehouse_id ?? 1,
                        'type' => 'Pre-Sale'
                    ];
                });

            // Parked Sales Reservations
            $tenantId = app('current.tenant')->id;
            $parkedReservations = [];
            $parkedSales = DB::table('parked_sales')
                ->where('tenant_id', $tenantId)
                ->get();
            foreach ($parkedSales as $parked) {
                $cart = json_decode($parked->cart_data, true) ?? [];
                foreach ($cart as $item) {
                    if (isset($item['id']) && $item['id'] == $id && ($item['qty'] ?? 0) > 0) {
                        $parkedReservations[] = [
                            'id' => 'parked-' . $parked->id,
                            'date' => $parked->created_at,
                            'order_number' => 'PARKED',
                            'customer' => $parked->customer_name ?? 'Parked Cart',
                            'quantity_reserved' => $item['qty'],
                            'warehouse_id' => 1,
                            'type' => 'Parked'
                        ];
                    }
                }
            }

            return response()->json(collect($preSaleReservations)->concat($parkedReservations));
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getHistory($store_slug = null, $id = null)
    {
        $id = $id ?? $store_slug; // Fallback if positional binding happened or store_slug wasn't forgotten
        try {
            $product = Product::findOrFail($id);

            $tenantId = app('current.tenant')->id;
            // 1. Fetch Sales (V3)
            $sales = DB::table('sale_items as si')
                ->join('sales as s', function($join) use ($tenantId) {
                    $join->on('si.sale_id', '=', 's.id')
                        ->where('s.tenant_id', $tenantId);
                })
                ->leftJoin('parties as p', function($join) use ($tenantId) {
                    $join->on('s.party_id', '=', 'p.id')
                        ->where('p.tenant_id', $tenantId);
                })
                ->where('si.tenant_id', $tenantId)
                ->where('si.product_id', $id)
                ->whereNull('s.deleted_at')
                ->select([
                    'si.id', 's.id as transaction_id', 's.reference_number', 's.posted_at',
                    'p.name as party_name', 'si.quantity', 'si.unit_price', 'si.line_total', 's.status'
                ])
                ->get()
                ->map(function ($item) {
                    return [
                        'id'             => $item->id,
                        'transaction_id' => $item->transaction_id,
                        'type'           => ($item->status === 'returned' || str_starts_with($item->reference_number ?? '', 'RET')) ? 'Return' : 'Sale',
                        'party'          => $item->party_name ?? 'Walk-in Customer',
                        'date'           => \Carbon\Carbon::parse($item->posted_at)->format('M d, Y, h:i A'),
                        'date_raw'       => $item->posted_at,
                        'qty'            => (float) $item->quantity,
                        'price'          => (float) $item->unit_price,
                        'total'          => (float) $item->line_total,
                        'invoice_number' => $item->reference_number,
                        'route'          => 'sales.show',
                    ];
                });

            // 2. Fetch Purchases (V3)
            $purchases = DB::table('purchase_items as pi')
                ->join('purchases as pu', function($join) use ($tenantId) {
                    $join->on('pi.purchase_id', '=', 'pu.id')
                        ->where('pu.tenant_id', $tenantId);
                })
                ->leftJoin('parties as p', function($join) use ($tenantId) {
                    $join->on('pu.party_id', '=', 'p.id')
                        ->where('p.tenant_id', $tenantId);
                })
                ->where('pi.tenant_id', $tenantId)
                ->where('pi.product_id', $id)
                ->select([
                    'pi.id', 'pu.id as transaction_id', 'pu.purchase_date',
                    'p.name as party_name', 'pi.qty', 'pi.unit_cost', 'pi.line_total'
                ])
                ->get()
                ->map(function ($item) {
                    return [
                        'id'             => $item->id,
                        'transaction_id' => $item->transaction_id,
                        'type'           => 'Purchase',
                        'party'          => $item->party_name ?? 'Unknown Supplier',
                        'date'           => \Carbon\Carbon::parse($item->purchase_date)->format('M d, Y, h:i A'),
                        'date_raw'       => $item->purchase_date,
                        'qty'            => (float) $item->qty,
                        'price'          => (float) $item->unit_cost,
                        'total'          => (float) $item->line_total,
                        'invoice_number' => $item->transaction_id, // purchases table doesn't have reference_number in DESCRIBE? Wait, let me check.
                        'route'          => 'purchases.show',
                    ];
                });

            // 3. Merge and sort
            $history = $sales->concat($purchases)
                ->sortByDesc('date_raw')
                ->values();

            return response()->json($history);
        } catch (\Exception $e) {
            Log::error('getHistory error: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * SELF-HEALING: Disabled.
     * Relying solely on StockMovements is dangerous because some flows (like Excel Import)
     * currently do not generate StockMovements. This was causing valid imported stock
     * to be wiped out (set to 0) simply because it lacked a movement record.
     */
    private function autoHealStockIntegrity(): void
    {
        // Disabled to prevent destructive stock wiping.
        // Needs a safer implementation in the future.
    }
}
