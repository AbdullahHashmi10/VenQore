<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('phone', 'like', '%' . $request->search . '%')
                ->orWhere('email', 'like', '%' . $request->search . '%');
        }

        $customers = $query->latest()->paginate(10)->withQueryString();

        // Return JSON for AJAX requests (but not Inertia requests)
        if (!$request->header('X-Inertia') && ($request->wantsJson() || $request->ajax())) {
            return response()->json($customers);
        }

        return Inertia::render('Sales/Customers/CustomersList', [
            'customers' => $customers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return Inertia::render('Sales/Customers/CustomersList', [
            'showCreate' => true
        ]);
    }

    public function search(Request $request)
    {
        $query = Customer::query();

        if ($request->search) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('phone', 'like', '%' . $request->search . '%')
                ->orWhere('email', 'like', '%' . $request->search . '%');
        }

        $customers = $query->limit(10)->get();

        return response()->json($customers);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $customer = Customer::create($request->all());

        // ALSO create a Party record so customer appears in Parties list and can be used in sales
        \App\Models\Party::create([
            'name' => $customer->name,
            'type' => 'customer',
            'email' => $customer->email,
            'phone' => $customer->phone,
            'address' => $customer->address,
            'current_balance' => 0,
        ]);

        return redirect()->back()->with('success', 'Customer created successfully.');
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        // Find the linked party before updating the customer
        // We look for a party with the OLD name and type 'customer'
        // Ideally we should have a party_id, but we fallback to name matching for now
        $party = \App\Models\Party::where('name', $customer->name)
            ->where('type', 'customer')
            ->first();

        // Update the customer record
        $customer->update($validated);

        // Sync the Party record if found
        if ($party) {
            $party->update([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? $party->email,
                'phone' => $validated['phone'] ?? $party->phone,
                'address' => $validated['address'] ?? $party->address,
            ]);
        }

        return redirect()->back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        // Find linked party before deletion
        $party = \App\Models\Party::where('name', $customer->name)
            ->where('type', 'customer')
            ->first();

        if ($party) {
            $party->delete();
        }

        $customer->delete();
        return redirect()->back()->with('success', 'Customer deleted successfully.');
    }
}
