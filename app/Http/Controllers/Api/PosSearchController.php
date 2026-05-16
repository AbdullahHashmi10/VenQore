<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * PosSearchController — Phase 3.1
 *
 * Replaces the catastrophic Product::get() that loaded the entire catalog
 * into every POS page load. 1,942 products × 5 relations = memory bomb.
 *
 * Architecture:
 *   - All requests are under /api/pos/* with 'pos' rate limiter (300/min per tenant)
 *   - Product search: real-time debounced search with FULLTEXT-friendly LIKE
 *   - Barcode lookup: exact match, returns single product
 *   - Category list: cached per tenant for 5 minutes
 *   - All images resolved to public URLs here so React doesn't need Storage
 *
 * React integration:
 *   - On POS open: load first 50 products for the grid (no search term)
 *   - On keypress (debounced 300ms): call /api/pos/search?q=term&category_id=
 *   - On barcode scan: call /api/pos/barcode/{code}
 *
 * Response format matches the existing productData shape in Pos.jsx exactly,
 * so zero frontend changes are needed to the cart/checkout logic.
 */
class PosSearchController extends Controller
{
    /**
     * Search products by name, SKU, or barcode.
     * Returns paginated results (30 per page) with stock info.
     *
     * GET /api/pos/search?q=&category_id=&page=1
     */
    public function search(Request $request): JsonResponse
    {
        $query      = $request->get('q', '');
        $categoryId = $request->get('category_id');
        $page       = max(1, (int) $request->get('page', 1));
        $perPage    = 30;

        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : null;

        // Build DB query — much cheaper than Eloquent with 4 eager-loaded relations
        $q = DB::table('products as p')
            ->leftJoin('categories as c', 'p.category_id', '=', 'c.id')
            ->leftJoin('stocks as s', function ($join) {
                $join->on('s.product_id', '=', 'p.id')
                    ->whereNull('s.deleted_at');
            })
            ->leftJoin('barcodes as b', function ($join) {
                $join->on('b.product_id', '=', 'p.id')
                    ->where('b.is_primary', true);
            })
            ->whereNull('p.deleted_at')
            ->select([
                'p.id',
                'p.name',
                'p.sku',
                'p.price',
                'p.cost_price',
                'p.image_path',
                'p.has_variants',
                'p.base_unit',
                'p.tax_rate',
                'p.category_id',
                'c.name as category_name',
                DB::raw('COALESCE(SUM(s.quantity), 0) as stock_quantity'),
                DB::raw('MAX(b.barcode) as primary_barcode'),
            ])
            ->groupBy('p.id', 'p.name', 'p.sku', 'p.price', 'p.cost_price',
                      'p.image_path', 'p.has_variants', 'p.base_unit',
                      'p.tax_rate', 'p.category_id', 'c.name');

        // Apply tenant isolation manually (DB query bypasses Eloquent scope)
        if ($tenantId) {
            $q->where('p.tenant_id', $tenantId);
        }

        // Search filter
        if (!empty($query)) {
            $like = "%{$query}%";
            $q->where(function ($where) use ($like, $query) {
                $where->where('p.name', 'LIKE', $like)
                      ->orWhere('p.sku', 'LIKE', $like)
                      ->orWhere('b.barcode', '=', $query); // exact barcode match
            });
        }

        // Category filter
        if ($categoryId) {
            $q->where('p.category_id', $categoryId);
        }

        // Default: active stock first, then alphabetical
        $q->orderByDesc(DB::raw('COALESCE(SUM(s.quantity), 0) > 0'))
          ->orderBy('p.name');

        // Manual pagination (LIMIT/OFFSET)
        $total   = DB::table(DB::raw("({$q->toSql()}) as sub"))
            ->mergeBindings($q)
            ->count();

        $products = $q->offset(($page - 1) * $perPage)
                      ->limit($perPage)
                      ->get();

        // Resolve image URLs
        $appUrl = config('app.url');
        $products->transform(function ($product) use ($appUrl) {
            $product->image_url = $product->image_path
                ? Storage::url($product->image_path)
                : null;
            unset($product->image_path);
            return $product;
        });

        return response()->json([
            'data'         => $products,
            'total'        => $total,
            'per_page'     => $perPage,
            'current_page' => $page,
            'last_page'    => (int) ceil($total / $perPage),
        ]);
    }

    /**
     * Exact barcode lookup — optimized for scanner speed.
     * Includes variant data if has_variants = true.
     *
     * GET /api/pos/barcode/{code}
     */
    public function findByBarcode(string $code): JsonResponse
    {
        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : null;

        // Check product barcodes table first
        $barcodeRow = DB::table('barcodes')
            ->where('barcode', $code)
            ->first();

        if ($barcodeRow) {
            $productId = $barcodeRow->product_id;
            $variantId = $barcodeRow->variant_id ?? null;
        } else {
            // Fallback: check product.sku
            $productId = DB::table('products')
                ->where('sku', $code)
                ->when($tenantId, fn($q) => $q->where('tenant_id', $tenantId))
                ->value('id');
            $variantId = null;
        }

        if (!$productId) {
            return response()->json(['found' => false], 404);
        }

        $product = Product::with(['stocks', 'variants', 'barcodes'])
            ->find($productId);

        if (!$product) {
            return response()->json(['found' => false], 404);
        }

        return response()->json([
            'found'      => true,
            'product'    => $this->transformProduct($product),
            'variant_id' => $variantId,
        ]);
    }

    /**
     * Category list — cached per tenant for 5 minutes.
     * Avoids a DB hit on every POS page open.
     *
     * GET /api/pos/categories
     */
    public function categories(): JsonResponse
    {
        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : 'global';
        $cacheKey = "pos.categories.{$tenantId}";

        $categories = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($tenantId) {
            return DB::table('categories as c')
                ->join('products as p', 'p.category_id', '=', 'c.id')
                ->whereNull('p.deleted_at')
                ->when($tenantId !== 'global', fn($q) => $q->where('p.tenant_id', $tenantId))
                ->select('c.id', 'c.name', DB::raw('COUNT(p.id) as product_count'))
                ->groupBy('c.id', 'c.name')
                ->having('product_count', '>', 0)
                ->orderBy('c.name')
                ->get();
        });

        return response()->json($categories);
    }

    /**
     * Initial 50 products for POS grid on open (no search term).
     * Sorted by most-sold recent for better UX.
     *
     * GET /api/pos/featured
     */
    public function featured(): JsonResponse
    {
        $tenantId = app()->bound('current.tenant') ? app('current.tenant')->id : null;
        $cacheKey = "pos.featured.{$tenantId}";

        $products = Cache::remember($cacheKey, now()->addMinutes(2), function () use ($tenantId) {
            return DB::table('products as p')
                ->leftJoin('categories as c', 'p.category_id', '=', 'c.id')
                ->leftJoin('stocks as s', 's.product_id', '=', 'p.id')
                ->leftJoin(DB::raw(
                    '(SELECT product_id, SUM(quantity) as sold_qty 
                      FROM sale_items 
                      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
                      GROUP BY product_id) as recent_sales'
                ), 'recent_sales.product_id', '=', 'p.id')
                ->whereNull('p.deleted_at')
                ->where(DB::raw('COALESCE(SUM(s.quantity), 0)'), '>', 0)
                ->when($tenantId, fn($q) => $q->where('p.tenant_id', $tenantId))
                ->select([
                    'p.id', 'p.name', 'p.sku', 'p.price', 'p.image_path',
                    'p.has_variants', 'p.base_unit', 'p.tax_rate', 'p.category_id',
                    'c.name as category_name',
                    DB::raw('COALESCE(SUM(s.quantity), 0) as stock_quantity'),
                    DB::raw('COALESCE(MAX(recent_sales.sold_qty), 0) as recent_sold'),
                ])
                ->groupBy('p.id', 'p.name', 'p.sku', 'p.price', 'p.image_path',
                         'p.has_variants', 'p.base_unit', 'p.tax_rate', 'p.category_id', 'c.name')
                ->orderByDesc('recent_sold')
                ->orderBy('p.name')
                ->limit(50)
                ->get()
                ->map(function ($p) {
                    $p->image_url = $p->image_path ? Storage::url($p->image_path) : null;
                    unset($p->image_path);
                    return $p;
                });
        });

        return response()->json($products);
    }

    /**
     * Transform a Product Eloquent model to the shape the POS React expects.
     */
    private function transformProduct(Product $product): array
    {
        return [
            'id'             => $product->id,
            'name'           => $product->name,
            'sku'            => $product->sku,
            'price'          => (float) $product->price,
            'cost_price'     => (float) $product->cost_price,
            'tax_rate'       => (float) ($product->tax_rate ?? 0),
            'image_url'      => $product->image_path ? Storage::url($product->image_path) : null,
            'stock_quantity' => $product->stocks->sum('quantity'),
            'has_variants'   => (bool) $product->has_variants,
            'base_unit'      => $product->base_unit ?? 'pcs',
            'category_id'    => $product->category_id,
            'variants'       => $product->variants->map(fn($v) => [
                'id'          => $v->id,
                'name'        => $v->variant_name,
                'sku'         => $v->sku,
                'price'       => (float) $v->price,
                'cost_price'  => (float) $v->cost_price,
                'stock'       => (float) $v->stock,
                'barcode'     => $v->barcode,
            ]),
            'barcodes'  => $product->barcodes->map(fn($b) => [
                'id'         => $b->id,
                'barcode'    => $b->barcode,
                'is_primary' => (bool) $b->is_primary,
            ]),
        ];
    }
}
