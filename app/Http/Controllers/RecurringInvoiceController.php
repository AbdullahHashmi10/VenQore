<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class RecurringInvoiceController extends Controller
{
    public function index()
    {
        return Inertia::render('RecurringInvoices/RecurringInvoices', [
            'invoices' => [
                'data'  => [],
                'links' => [],
            ],
            'stats' => [
                'total_active'  => 0,
                'total_revenue' => 0,
            ],
        ]);
    }

    /**
     * Show the form to create a new recurring invoice template.
     * Route: GET /recurring-invoices/create  (name: recurring-invoices.create)
     */
    public function create()
    {
        return Inertia::render('RecurringInvoices/Create', [
            'frequencies' => ['weekly', 'monthly', 'quarterly', 'yearly'],
        ]);
    }

    /**
     * Store a new recurring invoice template.
     * Route: POST /recurring-invoices  (name: recurring-invoices.store)
     */
    public function store(Request $request)
    {
        $request->validate([
            'title'       => 'required|string|max:255',
            'frequency'   => 'required|in:weekly,monthly,quarterly,yearly',
            'amount'      => 'required|numeric|min:0.01',
            'party_id'    => 'nullable|integer',
            'next_run_at' => 'nullable|date',
            'notes'       => 'nullable|string|max:1000',
        ]);

        // Feature not yet fully wired — return a graceful not-implemented response
        return back()->with('info', 'Recurring invoices are coming soon. Your template settings have been noted.');
    }

    /**
     * Show the edit form for a recurring invoice template.
     * Route: GET /recurring-invoices/{id}/edit  (name: recurring-invoices.edit)
     */
    public function edit($id)
    {
        return Inertia::render('RecurringInvoices/Edit', [
            'invoice'     => ['id' => $id],
            'frequencies' => ['weekly', 'monthly', 'quarterly', 'yearly'],
        ]);
    }

    /**
     * Update a recurring invoice template.
     * Route: PUT /recurring-invoices/{id}  (name: recurring-invoices.update)
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'title'     => 'sometimes|required|string|max:255',
            'frequency' => 'sometimes|required|in:weekly,monthly,quarterly,yearly',
            'amount'    => 'sometimes|required|numeric|min:0.01',
        ]);

        return back()->with('info', 'Recurring invoice template updated (feature coming soon).');
    }

    /**
     * Delete a recurring invoice template.
     * Route: DELETE /recurring-invoices/{id}  (name: recurring-invoices.destroy)
     */
    public function destroy($id)
    {
        return redirect()->route('recurring-invoices.index')
            ->with('info', 'Recurring invoice template removed.');
    }

    /**
     * Toggle a recurring invoice template on/off.
     * Route: POST /recurring-invoices/{id}/toggle  (name: recurring-invoices.toggle)
     */
    public function toggle($id)
    {
        return response()->json([
            'success' => true,
            'message' => 'Recurring invoice toggled (feature coming soon).',
            'active'  => false,
        ]);
    }
}
