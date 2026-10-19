<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::latest();

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $suppliers = $query->paginate(200)->withQueryString();

        if ($request->wantsJson()) {
            return response()->json($suppliers);
        }

        return Inertia::render('Suppliers/SuppliersList', ['suppliers' => $suppliers]);
    }

    public function search(Request $request)
    {
        $query = $request->input('search');
        if (!$query)
            return response()->json([]);

        $suppliers = Supplier::where('name', 'like', "%{$query}%")
            ->orWhere('phone', 'like', "%{$query}%")
            ->limit(10)
            ->get();

        return response()->json($suppliers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'contact_person' => 'nullable|string',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'notes' => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'lead_time_days' => 'nullable|integer|min:0',
            'performance_rating' => 'nullable|integer|min:1|max:5',
            'credit_limit' => 'nullable|numeric|min:0',
            'opening_balance' => 'nullable|numeric',
            'opening_balance_type' => 'nullable|in:receivable,payable',
            'default_discount' => 'nullable|numeric|between:0,100',
        ]);

        $ob = floatval($request->input('opening_balance', 0));
        $obType = $request->input('opening_balance_type', 'payable');
        $currBal = $obType === 'receivable' ? -abs($ob) : abs($ob);

        [$party, $supplier] = DB::transaction(function () use ($validated, $ob, $obType, $currBal) {
            // Create Shadow Party for consistency
            $party = \App\Models\Party::create([
                'type' => 'supplier',
                'name' => $validated['name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'address' => $validated['address'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'opening_balance' => $ob,
                'opening_balance_type' => $obType,
                'current_balance' => $currBal,
                'default_discount' => $validated['default_discount'] ?? 0,
            ]);

            $validated['party_id'] = $party->id;
            $supplier = Supplier::create($validated);

            return [$party, $supplier];
        });

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'party'   => array_merge($party->toArray(), [
                    'supplier_id' => $supplier->id,
                ]),
                'supplier' => $supplier,
            ]);
        }

        return redirect()->back()->with('success', 'Supplier created successfully.');
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email',
            'phone' => 'nullable|string',
            'contact_person' => 'nullable|string',
            'address' => 'nullable|string',
            'tax_id' => 'nullable|string',
            'notes' => 'nullable|string',
            'payment_terms' => 'nullable|string',
            'lead_time_days' => 'nullable|integer|min:0',
            'performance_rating' => 'nullable|integer|min:1|max:5',
            'credit_limit' => 'nullable|numeric|min:0',
        ]);

        $supplier->update($validated);

        // Sync Shadow Party
        if ($supplier->party_id) {
            $party = \App\Models\Party::find($supplier->party_id);
            if ($party && (
                $party->name !== $validated['name'] ||
                ($validated['email'] ?? $party->email) !== $party->email ||
                ($validated['phone'] ?? $party->phone) !== $party->phone ||
                ($validated['address'] ?? $party->address) !== $party->address ||
                ($validated['notes'] ?? $party->notes) !== $party->notes
            )) {
                $party->update([
                    'name' => $validated['name'],
                    'email' => $validated['email'] ?? $party->email,
                    'phone' => $validated['phone'] ?? $party->phone,
                    'address' => $validated['address'] ?? $party->address,
                    'notes' => $validated['notes'] ?? $party->notes,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Supplier updated successfully.');
    }

    public function destroy(Supplier $supplier)
    {
        $supplier->delete();
        return redirect()->back()->with('success', 'Supplier deleted successfully.');
    }
}
