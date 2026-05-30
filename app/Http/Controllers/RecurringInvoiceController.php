<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RecurringInvoice;
use App\Models\Party;
use App\Models\Warehouse;
use App\Models\Product;

class RecurringInvoiceController extends Controller
{
    public function index()
    {
        $invoices = RecurringInvoice::with('customer')->latest()->get();
        
        return Inertia::render('RecurringInvoices/RecurringInvoices', [
            'recurringInvoices' => $invoices,
        ]);
    }

    public function create()
    {
        $customers = Party::where('type', 'customer')->orderBy('name')->get();
        $warehouses = Warehouse::orderBy('name')->get();
        $products = Product::select('id', 'name', 'sku', 'price', 'cost_price')->orderBy('name')->get();

        return Inertia::render('RecurringInvoices/Create', [
            'customers' => $customers,
            'warehouses' => $warehouses,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id'   => 'nullable|exists:parties,id',
            'warehouse_id'  => 'nullable|exists:warehouses,id',
            'frequency'     => 'required|in:daily,weekly,monthly',
            'items'         => 'required|array',
            'next_run_date' => 'required|date',
            'status'        => 'nullable|string',
        ]);

        $recurringInvoice = RecurringInvoice::create($validated);

        if ($request->wantsJson()) {
            return response()->json($recurringInvoice, 201);
        }
        return redirect()->route('recurring-invoices.index')->with('success', 'Recurring invoice template created.');
    }

    public function edit($id)
    {
        $invoice = RecurringInvoice::findOrFail($id);
        $customers = Party::where('type', 'customer')->orderBy('name')->get();
        $warehouses = Warehouse::orderBy('name')->get();
        $products = Product::select('id', 'name', 'sku', 'price', 'cost_price')->orderBy('name')->get();

        return Inertia::render('RecurringInvoices/Edit', [
            'invoice' => $invoice,
            'customers' => $customers,
            'warehouses' => $warehouses,
            'products' => $products,
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'customer_id'   => 'nullable|exists:parties,id',
            'warehouse_id'  => 'nullable|exists:warehouses,id',
            'frequency'     => 'nullable|in:daily,weekly,monthly',
            'items'         => 'nullable|array',
            'next_run_date' => 'nullable|date',
            'status'        => 'nullable|string',
        ]);

        $invoice = RecurringInvoice::findOrFail($id);
        $invoice->update($validated);

        if ($request->wantsJson()) {
            return response()->json($invoice);
        }
        return redirect()->route('recurring-invoices.index')->with('success', 'Recurring invoice template updated.');
    }

    public function destroy($id)
    {
        $invoice = RecurringInvoice::findOrFail($id);
        $invoice->delete();

        return redirect()->route('recurring-invoices.index')->with('success', 'Recurring invoice template deleted.');
    }

    public function toggle($id)
    {
        $invoice = RecurringInvoice::findOrFail($id);
        $invoice->update([
            'status' => $invoice->status === 'active' ? 'paused' : 'active'
        ]);

        return redirect()->back()->with('success', 'Recurring invoice status toggled.');
    }
}
