<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use App\Services\V3\ManufacturingService;
use Illuminate\Http\Request;

class ProductionRunController extends Controller
{
    public function __construct(
        private ManufacturingService $manufacturing
    ) {}

    public function store(Request $request)
    {
        $validated = $request->validate([
            'bom_id'       => ['required', 'string', 'exists:bill_of_materials,id'],
            'warehouse_id' => ['required', 'string', 'exists:warehouses,id'],
            'planned_qty'  => ['required', 'numeric', 'min:0.0001'],
            'run_date'     => ['required', 'date', 'before_or_equal:today'],
            'labor_cost'   => ['nullable', 'numeric', 'min:0'],
            'labor_type'   => ['nullable', 'in:external,internal'],
            'labor_bank'   => ['boolean'],
        ]);

        $run = $this->manufacturing->startRun($validated);

        return redirect()->back()->with([
            'success' => 'Production run started.',
            'run_id'  => $run->id,
        ]);
    }

    public function complete(Request $request, string $id)
    {
        $validated = $request->validate([
            'actual_qty' => ['required', 'numeric', 'min:0.0001'],
        ]);

        $this->manufacturing->completeRun($id, $validated['actual_qty']);

        return redirect()->back()->with('success', 'Production run completed.');
    }

    public function reverse(Request $request, string $id)
    {
        $validated = $request->validate([
            'reverse_qty' => ['required', 'numeric', 'min:0.0001'],
        ]);

        $this->manufacturing->partialReverse($id, $validated['reverse_qty']);

        return redirect()->back()->with('success', 'Production run partially reversed.');
    }

    public function disassemble(Request $request)
    {
        $validated = $request->validate([
            'product_id'   => ['required', 'string', 'exists:products,id'],
            'qty'          => ['required', 'numeric', 'min:0.0001'],
            'warehouse_id' => ['required', 'string', 'exists:warehouses,id'],
        ]);

        $this->manufacturing->disassemble(
            $validated['product_id'],
            $validated['qty'],
            $validated['warehouse_id']
        );

        return redirect()->back()->with('success', 'Disassembly completed.');
    }
}
