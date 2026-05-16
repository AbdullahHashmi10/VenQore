<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BomController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id'     => ['required', 'string', 'exists:products,id'],
            'version'        => ['required', 'integer', 'min:1'],
            'effective_from' => ['required', 'date'],
            'notes'          => ['nullable', 'string', 'max:1000'],
            'items'          => ['required', 'array', 'min:1'],
            'items.*.product_id'    => ['required', 'string', 'exists:products,id'],
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

        // Deactivate any previous active BOM for this product
        DB::table('bill_of_materials')->where('bill_of_materials.tenant_id', app('current.tenant')->id)
            ->where('product_id', $validated['product_id'])
            ->where('is_active', 1)
            ->update(['is_active' => 0, 'updated_at' => now()]);

        DB::transaction(function () use ($validated) {

            $bomId = Str::uuid()->toString();

            DB::table('bill_of_materials')->where('bill_of_materials.tenant_id', app('current.tenant')->id)->insert([
                'id'             => $bomId,
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
}
