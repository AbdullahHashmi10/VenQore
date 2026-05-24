<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Party;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $tenantId = app('current.tenant')->id;
        $query = Customer::query()->where('tenant_id', $tenantId);

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        $customers = $query->latest()->paginate(10)->withQueryString();

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
        $tenantId = app('current.tenant')->id;
        $query = Customer::query()->where('tenant_id', $tenantId);

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('phone', 'like', '%' . $search . '%')
                  ->orWhere('email', 'like', '%' . $search . '%');
            });
        }

        $customers = $query->limit(10)->get();

        return response()->json($customers);
    }

    public function store(Request $request)
    {
        $tenantId = app('current.tenant')->id;

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $data = $request->all();
        $data['tenant_id'] = $tenantId;

        $party = Party::create([
            'tenant_id' => $tenantId,
            'name' => $data['name'],
            'type' => 'customer',
            'email' => $data['email'] ?? null,
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'current_balance' => 0,
        ]);
        
        $data['party_id'] = $party->id;

        $customer = Customer::create($data);

        return redirect()->back()->with('success', 'Customer created successfully.');
    }

    public function update(Request $request, Customer $customer)
    {
        $tenantId = app('current.tenant')->id;

        // Extra isolation check
        if ($customer->tenant_id !== $tenantId) {
            abort(403, 'Unauthorized access to customer data.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $customer->update($validated);

        if ($customer->party_id) {
            $party = Party::where('tenant_id', $tenantId)
                ->where('id', $customer->party_id)
                ->first();
        } else {
            // Legacy fallback if party_id is missing from older records
            $party = Party::where('tenant_id', $tenantId)
                ->where('name', $customer->name)
                ->where('type', 'customer')
                ->first();
        }

        if ($party) {
            $party->update([
                'name' => $validated['name'],
                'email' => $validated['email'] ?? $party->email,
                'phone' => $validated['phone'] ?? $party->phone,
                'address' => $validated['address'] ?? $party->address,
            ]);
            
            // Retroactively link it if it wasn't
            if (!$customer->party_id) {
                $customer->update(['party_id' => $party->id]);
            }
        }

        return redirect()->back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $tenantId = app('current.tenant')->id;

        if ($customer->tenant_id !== $tenantId) {
            abort(403);
        }

        if ($customer->party_id) {
            $party = Party::where('tenant_id', $tenantId)
                ->where('id', $customer->party_id)
                ->first();
        } else {
            $party = Party::where('tenant_id', $tenantId)
                ->where('name', $customer->name)
                ->where('type', 'customer')
                ->first();
        }

        if ($party) {
            $party->delete();
        }

        $customer->delete();
        return redirect()->back()->with('success', 'Customer deleted successfully.');
    }
}
