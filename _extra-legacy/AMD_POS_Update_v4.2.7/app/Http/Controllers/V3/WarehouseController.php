<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\PlanGate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    public function index()
    {
        $warehouses = DB::table('warehouses')->where('warehouses.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', app('current.tenant')->id)
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get();

        return Inertia::render('V3/Warehouses/Index', [
            'warehouses' => $warehouses,
        ]);
    }

    public function create()
    {
        return Inertia::render('V3/Warehouses/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:100', 'unique:warehouses,name'],
            'address'    => ['nullable', 'string', 'max:500'],
            'is_default' => ['boolean'],
        ]);

        DB::transaction(function () use ($validated) {
            $tenantId = app('current.tenant')->id;

            // Only one default warehouse allowed
            if (!empty($validated['is_default'])) {
                DB::table('warehouses')->where('warehouses.tenant_id', app('current.tenant')->id)
                    ->where('tenant_id', $tenantId)
                    ->update(['is_default' => 0]);
            }

            // If no warehouse exists yet, force this one to be default
            $count = DB::table('warehouses')->where('warehouses.tenant_id', app('current.tenant')->id)
                ->where('tenant_id', $tenantId)
                ->count();

            // ── Phase 4.3: Locations Limit Gate ───────────────────────────
            if (app()->bound('current.tenant')) {
                PlanGate::enforce('locations', $count);
            }

            DB::table('warehouses')->where('warehouses.tenant_id', app('current.tenant')->id)->insert([
                'id'         => Str::uuid()->toString(),
                'tenant_id'  => app('current.tenant')->id,
                'name'       => $validated['name'],
                'address'    => $validated['address'] ?? null,
                'is_default' => (!empty($validated['is_default']) || $count === 0) ? 1 : 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return redirect()->route('store.v3.warehouses.index', ['store_slug' => app('current.tenant')->slug])
            ->with('success', 'Warehouse created.');
    }

    public function edit(string $id)
    {
        $warehouse = DB::table('warehouses')->where('warehouses.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', app('current.tenant')->id)
            ->where('id', $id)
            ->firstOrFail();

        return Inertia::render('V3/Warehouses/Edit', [
            'warehouse' => $warehouse,
        ]);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name'       => ['required', 'string', 'max:100',
                            'unique:warehouses,name,' . $id],
            'address'    => ['nullable', 'string', 'max:500'],
            'is_default' => ['boolean'],
            'is_active'  => ['boolean'],
        ]);

        DB::transaction(function () use ($id, $validated) {
            $tenantId = app('current.tenant')->id;
            if (!empty($validated['is_default'])) {
                DB::table('warehouses')->where('warehouses.tenant_id', app('current.tenant')->id)
                    ->where('tenant_id', $tenantId)
                    ->where('id', '!=', $id)
                    ->update(['is_default' => 0]);
            }

            DB::table('warehouses')->where('warehouses.tenant_id', app('current.tenant')->id)
                ->where('tenant_id', $tenantId)
                ->where('id', $id)
                ->update([
                'name'       => $validated['name'],
                'address'    => $validated['address'] ?? null,
                'is_default' => $validated['is_default'] ?? 0,
                'is_active'  => $validated['is_active']  ?? 1,
                'updated_at' => now(),
            ]);
        });

        return redirect()->route('store.v3.warehouses.index', ['store_slug' => app('current.tenant')->slug])
            ->with('success', 'Warehouse updated.');
    }

    public function destroy(string $id)
    {
        $tenantId = app('current.tenant')->id;
        // Block deletion if this warehouse has inventory batches
        $hasBatches = DB::table('inventory_batches')->where('inventory_batches.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', $tenantId)
            ->where('warehouse_id', $id)
            ->where('remaining_qty', '>', 0)
            ->exists();

        if ($hasBatches) {
            return back()->withErrors([
                'warehouse' => 'Cannot deactivate a warehouse that still holds stock. Transfer or adjust stock first.',
            ]);
        }

        // Block deletion of the only default warehouse
        $warehouse = DB::table('warehouses')->where('warehouses.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->first();
        if ($warehouse->is_default) {
            return back()->withErrors([
                'warehouse' => 'Cannot deactivate the default warehouse. Set another warehouse as default first.',
            ]);
        }

        DB::table('warehouses')->where('warehouses.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->delete();

        return redirect()->route('store.v3.warehouses.index', ['store_slug' => app('current.tenant')->slug])
            ->with('success', 'Warehouse deleted.');
    }
}
