<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * GET /s/{store}/inventory/production/boms[?product_id=…]
 *
 * The New Production Run screen (Inventory/Production/Create.jsx) posts to
 * store.production.store, which is the V3 ProductionRunController and needs a
 * `bom_id`. The page's own controller does not pass BOMs, so the screen loads
 * this store's ACTIVE bills of materials (with their components) from here.
 * Guarded like the store route: permission inventory.adjust + plan feature
 * production.
 */
class ProductionBomListController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = app('current.tenant')->id;

        $boms = DB::table('bill_of_materials as b')
            ->leftJoin('products as p', function ($j) use ($tenantId) {
                $j->on('p.id', '=', 'b.product_id')->where('p.tenant_id', $tenantId);
            })
            ->where('b.tenant_id', $tenantId)
            ->where('b.is_active', 1)
            ->when($request->filled('product_id'), fn ($q) => $q->where('b.product_id', $request->input('product_id')))
            ->orderBy('p.name')
            ->orderByDesc('b.version')
            ->get(['b.id', 'b.product_id', 'b.version', 'b.effective_from', 'b.notes', 'p.name as product_name', 'p.sku as product_sku']);

        $items = DB::table('bom_items as i')
            ->leftJoin('products as p', function ($j) use ($tenantId) {
                $j->on('p.id', '=', 'i.product_id')->where('p.tenant_id', $tenantId);
            })
            ->where('i.tenant_id', $tenantId)
            ->whereIn('i.bom_id', $boms->pluck('id'))
            ->get(['i.bom_id', 'i.product_id', 'i.qty_per_unit', 'i.is_byproduct', 'p.name', 'p.sku'])
            ->groupBy('bom_id');

        return response()->json([
            'boms' => $boms->map(fn ($b) => [
                'id'             => (string) $b->id,
                'product_id'     => (string) $b->product_id,
                'product_name'   => $b->product_name,
                'product_sku'    => $b->product_sku,
                'version'        => (int) $b->version,
                'effective_from' => $b->effective_from,
                'notes'          => $b->notes,
                'items'          => ($items[$b->id] ?? collect())->map(fn ($i) => [
                    'product_id'   => (string) $i->product_id,
                    'name'         => $i->name,
                    'sku'          => $i->sku,
                    'qty_per_unit' => (float) $i->qty_per_unit,
                    'is_byproduct' => (bool) $i->is_byproduct,
                ])->values(),
            ])->values(),
        ]);
    }
}
