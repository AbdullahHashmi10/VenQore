<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\PlanGate;
use Inertia\Inertia;
use App\Models\RecurringInvoice;
use App\Models\Party;
use App\Models\Warehouse;
use App\Models\Product;

class RecurringInvoiceController extends Controller
{
    public function index()
    {
        // ── Plan Gate: Recurring Auto-Invoicing ────────────────────────────
        if (app()->bound('current.tenant')) {
            PlanGate::enforce('recurring_invoicing');
        }

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
        // ── Plan Gate: Recurring Auto-Invoicing ────────────────────────────
        if (app()->bound('current.tenant')) {
            PlanGate::enforce('recurring_invoicing');
        }

        $validated = $request->validate([
            'customer_id'   => 'nullable|exists:parties,id',
            'warehouse_id'  => 'nullable|exists:warehouses,id',
            'frequency'     => 'required|in:daily,weekly,monthly',
            'items'         => 'required|array',
            'next_run_date' => 'required|date',
            'status'        => 'nullable|string',
            /* A template raises invoices, so it has to carry what those
               invoices should say. Without these columns every invoice it
               raised came out at list price with no tax on it. */
            'name'               => 'nullable|string|max:120',
            'payment_terms'      => 'nullable|string|max:40',
            'notes'              => 'nullable|string',
            'discount'           => 'nullable|numeric|min:0',
            'tax'                => 'nullable|numeric|min:0',
            'tax_rate'           => 'nullable|numeric|min:0|max:100',
            'delivery_charge'    => 'nullable|numeric|min:0',
            'extra_charge_value' => 'nullable|numeric|min:0',
            'extra_charge_label' => 'nullable|string|max:120',
            'total_amount'       => 'nullable|numeric|min:0',
            /* The items blob had no shape at all: anything posted was stored.
               A template whose lines are unreadable raises nothing. */
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty'        => 'required|numeric|min:0.0001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount'   => 'nullable|numeric|min:0',
            'items.*.discount_type' => 'nullable|in:fixed,percent',
            'items.*.free_qty'   => 'nullable|numeric|min:0',
            'items.*.tax_rate'   => 'nullable|numeric|min:0|max:100',
            /* validated() returns ONLY keys that have rules, so a rule list is
               also a whitelist. Leaving these off stripped them from the stored
               blob, and GenerateRecurringInvoices falls back on `discount` when
               `discount_percent` is absent — turning a Rs 50 fixed discount
               into 50% off, on every invoice the template ever raises. */
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.sale_uom'   => 'nullable|string|max:40',
            'items.*.name'       => 'nullable|string|max:255',
            'items.*.is_promotional' => 'nullable|boolean',
        ]);

        $recurringInvoice = RecurringInvoice::create($validated);

        if ($request->wantsJson()) {
            return response()->json($recurringInvoice, 201);
        }
        return redirect()->route('store.recurring-invoices.index', ['store_slug' => app('current.tenant')->slug])->with('success', 'Recurring invoice template created.');
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
            /* The same shape as store(), so an edit cannot quietly strip the
               template of the money it was meant to raise invoices at. */
            'name'               => 'nullable|string|max:120',
            'payment_terms'      => 'nullable|string|max:40',
            'notes'              => 'nullable|string',
            'discount'           => 'nullable|numeric|min:0',
            'tax'                => 'nullable|numeric|min:0',
            'tax_rate'           => 'nullable|numeric|min:0|max:100',
            'delivery_charge'    => 'nullable|numeric|min:0',
            'extra_charge_value' => 'nullable|numeric|min:0',
            'extra_charge_label' => 'nullable|string|max:120',
            'total_amount'       => 'nullable|numeric|min:0',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty'        => 'required|numeric|min:0.0001',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount'   => 'nullable|numeric|min:0',
            'items.*.discount_type' => 'nullable|in:fixed,percent',
            'items.*.free_qty'   => 'nullable|numeric|min:0',
            'items.*.tax_rate'   => 'nullable|numeric|min:0|max:100',
            /* validated() returns ONLY keys that have rules, so a rule list is
               also a whitelist. Leaving these off stripped them from the stored
               blob, and GenerateRecurringInvoices falls back on `discount` when
               `discount_percent` is absent — turning a Rs 50 fixed discount
               into 50% off, on every invoice the template ever raises. */
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.sale_uom'   => 'nullable|string|max:40',
            'items.*.name'       => 'nullable|string|max:255',
            'items.*.is_promotional' => 'nullable|boolean',
            'status'        => 'nullable|string',
        ]);

        $invoice = RecurringInvoice::findOrFail($id);
        $invoice->update($validated);

        if ($request->wantsJson()) {
            return response()->json($invoice);
        }
        return redirect()->route('store.recurring-invoices.index', ['store_slug' => app('current.tenant')->slug])->with('success', 'Recurring invoice template updated.');
    }

    public function destroy($id)
    {
        $invoice = RecurringInvoice::findOrFail($id);
        $invoice->delete();

        return redirect()->route('store.recurring-invoices.index', ['store_slug' => app('current.tenant')->slug])->with('success', 'Recurring invoice template deleted.');
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
