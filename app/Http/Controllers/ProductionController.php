<?php

namespace App\Http\Controllers;

use App\Models\ProductionRun;
use App\Models\Product;
use App\Models\Warehouse;
use App\Models\Recipe;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

use App\Services\PlanGate;

class ProductionController extends Controller
{
    public function index(Request $request)
    {
        PlanGate::enforce('production');
        $query = ProductionRun::with(['product']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('run_number', 'like', "%{$search}%")
                  ->orWhereHas('product', function($q) use ($search) {
                      $q->where('name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('filter')) {
            if ($request->filter === 'today') {
                $query->whereDate('created_at', Carbon::today());
            } elseif ($request->filter === 'active') {
                $query->where('status', 'in_progress');
            } elseif ($request->filter === 'failed') {
                $query->where('status', 'failed');
            }
        }

        $productionRuns = $query->orderBy('created_at', 'desc')->paginate(50)->withQueryString()->through(function ($run) {
             return [
                'id' => $run->id,
                'run_number' => $run->run_number ?? 'PR-' . str_pad($run->id, 6, '0', STR_PAD_LEFT),
                'created_at' => $run->created_at,
                'product' => $run->product,
                'quantity' => $run->quantity,
                'status' => $run->status ?? 'completed',
                'ingredients_used' => 0, 
                'cost' => 0 
            ];
        });

        if ($request->wantsJson()) {
            return response()->json($productionRuns);
        }

        // Calculate stats
        $today = Carbon::today();
        $stats = [
            'in_progress' => ProductionRun::where('status', 'in_progress')->count(),
            'completed_today' => ProductionRun::where('status', 'completed')
                ->whereDate('created_at', $today)
                ->count(),
            'month_count' => ProductionRun::whereMonth('created_at', $today->month)
                ->whereYear('created_at', $today->year)
                ->count(),
            'month_cost' => 0 
        ];

        return Inertia::render('Inventory/Production/ProductionRuns', [
            'productionRuns' => $productionRuns ?? [],
            'stats' => $stats ?? [],
             'filters' => (object) ($request->only(['search', 'filter']) ?? [])
        ]);
    }

    public function create()
    {
        PlanGate::enforce('production');
        $products = Product::orderBy('name')->get();
        $warehouses = Warehouse::orderBy('name')->get();

        return Inertia::render('Inventory/Production/Create', [
            'products' => $products,
            'warehouses' => $warehouses
        ]);
    }

    public function store(Request $request)
    {
        PlanGate::enforce('production');
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|numeric|min:1',
            'date' => 'required|date',
            'notes' => 'nullable|string'
        ]);

        $run = ProductionRun::create([
            'product_id' => $validated['product_id'],
            'quantity' => $validated['quantity'],
            'date' => $validated['date'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'completed'
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Production run created successfully',
            'run' => $run
        ]);
    }

    public function show($id)
    {
        PlanGate::enforce('production');
        $run = ProductionRun::with(['product'])
            ->findOrFail($id);

        // BOM consumption: production_run_materials records exactly which
        // inventory_batch(es) were deducted for this run, at what unit cost
        // (written by ManufacturingService::startRun()). No Eloquent model exists
        // for this junction table, so we query it directly like the rest of the
        // V3 services do, and eager-load the raw material product name + BOM item
        // via the inventory batch and bom_items table.
        $materials = \Illuminate\Support\Facades\DB::table('production_run_materials as prm')
            ->join('inventory_batches as ib', 'prm.inventory_batch_id', '=', 'ib.id')
            ->join('products as p', 'ib.product_id', '=', 'p.id')
            ->leftJoin('bom_items as bi', 'prm.bom_item_id', '=', 'bi.id')
            ->where('prm.production_run_id', $id)
            ->select(
                'prm.id',
                'p.name as product_name',
                'prm.qty_deducted',
                'prm.unit_cost',
                'prm.total_cost',
                'ib.id as batch_id'
            )
            ->get();

        // Output / finished-goods batch created by completeRun() — tagged with
        // production_run_id + batch_type = 'manufactured' on inventory_batches.
        $outputBatch = \Illuminate\Support\Facades\DB::table('inventory_batches')
            ->where('production_run_id', $id)
            ->where('batch_type', 'manufactured')
            ->where('product_id', $run->product_id)
            ->first();

        return Inertia::render('Inventory/Production/Show', [
            'run' => $run,
            'materials' => $materials,
            'outputBatch' => $outputBatch,
        ]);
    }

    public function complete(Request $request, $id)
    {
        PlanGate::enforce('production');
        $run = ProductionRun::findOrFail($id);

        // Mark as completed and update stock
        $run->update([
            'status' => 'completed',
            'completed_at' => now()
        ]);

        // Add stock to warehouse (implement based on your stock model)

        return response()->json([
            'success' => true,
            'message' => 'Production run completed successfully'
        ]);
    }
}
