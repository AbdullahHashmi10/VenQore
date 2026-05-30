<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\RecurringInvoice;

class RecurringInvoiceController extends Controller
{
    public function index()
    {
        $invoices = RecurringInvoice::latest()->paginate(10);
        
        return Inertia::render('RecurringInvoices/RecurringInvoices', [
            'invoices' => $invoices,
            'stats' => [
                'total_active' => RecurringInvoice::where('status', 'active')->count(),
                'total_revenue' => 0,
            ]
        ]);
    }

    public function create()
    {
        return Inertia::render('RecurringInvoices/Create');
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
        return Inertia::render('RecurringInvoices/Edit', [
            'invoice' => $invoice
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
