<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\PlanGate;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BomController extends Controller
{
    private const MAX_BOM_DEPTH = 5;

    public function store(Request $request)
    {
        if (!\App\Services\PlanGate::check('bill_of_materials')) {
            abort(403, 'Cookbook is not available on your current plan.');
        }

        // ── Plan Gate: Bill of Materials ─────────────────────────────────────
        PlanGate::enforce('bill_of_materials');

        // Finished good and every component must be this store's products.
        $tenantId = app('current.tenant')->id;
        $validated = $request->validate([
            'product_id'     => ['required', 'string', Rule::exists('products', 'id')->where('tenant_id', $tenantId)],
            'version'        => ['required', 'integer', 'min:1'],
            'effective_from' => ['required', 'date'],
            'notes'          => ['nullable', 'string', 'max:1000'],
            'items'          => ['required', 'array', 'min:1'],
            'items.*.product_id'    => ['required', 'string', Rule::exists('products', 'id')->where('tenant_id', $tenantId)],
            'items.*.qty_per_unit'  => ['required', 'numeric', 'min:0.0001'],
            'items.*.is_byproduct'  => ['boolean'],
            'items.*.byproduct_nrv' => ['nullable', 'numeric', 'min:0'],
        ]);

        // A finished-good cannot be its own component
        foreach ($validated['items'] as $item) {
            if ($item['product_id'] === $validated['product_id']) {
                return back()->withErrors([
                    'items' => 'A product cannot be its own BOM component.',
                ]);
            }
        }

        // S-014: sub-assemblies may nest at most MAX_BOM_DEPTH levels, and a
        // BOM may never (directly or through a sub-assembly) consume itself.
        $componentIds = array_column(array_filter(
            $validated['items'],
            fn ($item) => empty($item['is_byproduct'])
        ), 'product_id');
        try {
            $depth = 1 + $this->deepestBom($componentIds, [$validated['product_id']]);
        } catch (\DomainException $e) {
            return back()->withErrors(['items' => $e->getMessage()]);
        }
        if ($depth > self::MAX_BOM_DEPTH) {
            return back()->withErrors([
                'items' => 'Sub-assemblies can be nested at most ' . self::MAX_BOM_DEPTH
                    . " levels deep; this BOM would be {$depth} levels.",
            ]);
        }

        // Deactivate any previous active BOM for this product
        DB::table('bill_of_materials')->where('bill_of_materials.tenant_id', app('current.tenant')->id)
            ->where('product_id', $validated['product_id'])
            ->where('is_active', 1)
            ->update(['is_active' => 0, 'updated_at' => now()]);

        DB::transaction(function () use ($validated) {

            $bomId = Str::uuid()->toString();

            DB::table('bill_of_materials')->where('bill_of_materials.tenant_id', app('current.tenant')->id)->insert([
                'id'             => $bomId,
                'tenant_id'      => app('current.tenant')->id,
                'product_id'     => $validated['product_id'],
                'version'        => $validated['version'],
                'effective_from' => $validated['effective_from'],
                'is_active'      => 1,
                'notes'          => $validated['notes'] ?? null,
                'created_at'     => now(),
                'updated_at'     => now(),
            ]);

            foreach ($validated['items'] as $item) {
                DB::table('bom_items')->where('bom_items.tenant_id', app('current.tenant')->id)->insert([
                    'id'            => Str::uuid()->toString(),
                    'bom_id'        => $bomId,
                    'tenant_id'     => app('current.tenant')->id,
                    'product_id'    => $item['product_id'],
                    'qty_per_unit'  => $item['qty_per_unit'],
                    'is_byproduct'  => $item['is_byproduct']  ?? 0,
                    'byproduct_nrv' => $item['byproduct_nrv'] ?? 0,
                    'created_at'    => now(),
                ]);
            }

            // Mark the finished-good product as manufactured
            DB::table('products')->where('products.tenant_id', app('current.tenant')->id)
                ->where('id', $validated['product_id'])
                ->update(['is_manufactured' => 1, 'updated_at' => now()]);
        });

        return redirect()->back()->with('success', 'BOM created.');
    }

    public function update(Request $request, string $id)
    {
        // BOMs are versioned — update means deactivate old + create new version
        // Redirect to store with incremented version
        $bom = DB::table('bill_of_materials')->where('bill_of_materials.tenant_id', app('current.tenant')->id)->where('id', $id)->firstOrFail();

        $request->merge([
            'product_id' => $bom->product_id,
            'version'    => $bom->version + 1,
        ]);

        return $this->store($request);
    }

    public function destroy(string $id)
    {
        if (!\App\Services\PlanGate::check('bill_of_materials')) {
            abort(403, 'Cookbook is not available on your current plan.');
        }

        $bom = DB::table('bill_of_materials')->where('bill_of_materials.tenant_id', app('current.tenant')->id)->where('id', $id)->firstOrFail();

        $hasRuns = DB::table('production_runs')->where('production_runs.tenant_id', app('current.tenant')->id)
            ->where('bom_id', $id)
            ->exists();

        if ($hasRuns) {
            return back()->withErrors([
                'bom' => 'Cannot delete a BOM that has been used in production runs.',
            ]);
        }

        DB::table('bom_items')->where('bom_items.tenant_id', app('current.tenant')->id)->where('bom_id', $id)->delete();
        DB::table('bill_of_materials')->where('bill_of_materials.tenant_id', app('current.tenant')->id)->where('id', $id)->delete();

        return redirect()->back()->with('success', 'BOM deleted.');
    }

    /**
     * Number of BOM levels beneath the given components (0 = all raw
     * materials). Throws when a component leads back to a product on
     * $path (circular BOM). Bounded: gives up past MAX_BOM_DEPTH + 1.
     */
    private function deepestBom(array $productIds, array $path): int
    {
        $tenantId = app('current.tenant')->id;
        $deepest  = 0;

        foreach (array_unique($productIds) as $productId) {
            if (in_array($productId, $path, true)) {
                throw new \DomainException('Circular BOM: a component already uses this product as a sub-assembly.');
            }

            $bomId = DB::table('bill_of_materials')
                ->where('tenant_id', $tenantId)
                ->where('product_id', $productId)
                ->where('is_active', 1)
                ->value('id');
            if (!$bomId) {
                continue; // raw material
            }
            if (count($path) > self::MAX_BOM_DEPTH) {
                return self::MAX_BOM_DEPTH + 1; // already too deep — stop walking
            }

            $children = DB::table('bom_items')
                ->where('tenant_id', $tenantId)
                ->where('bom_id', $bomId)
                ->where('is_byproduct', 0)
                ->pluck('product_id')
                ->all();

            $deepest = max($deepest, 1 + $this->deepestBom($children, array_merge($path, [$productId])));
        }

        return $deepest;
    }
}
