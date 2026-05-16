<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PartyController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'          => ['required', 'string', 'max:255'],
            'type'          => ['required', 'in:customer,supplier,both'],
            'phone'         => ['nullable', 'string', 'max:20'],
            'email'         => ['nullable', 'email', 'max:255'],
            'address'       => ['nullable', 'string', 'max:500'],
            'tax_number'    => ['nullable', 'string', 'max:50'],
            'credit_limit'  => ['nullable', 'numeric', 'min:0'],
        ]);

        $id = Str::uuid()->toString();

        $tenantId = app('current.tenant')->id;
        DB::table('parties')->where('parties.tenant_id', app('current.tenant')->id)->insert([
            'id'           => $id,
            'tenant_id'    => $tenantId,
            'name'         => $validated['name'],
            'type'         => $validated['type'],
            'phone'        => $validated['phone']        ?? null,
            'email'        => $validated['email']        ?? null,
            'address'      => $validated['address']      ?? null,
            'tax_number'   => $validated['tax_number']   ?? null,
            'credit_limit' => $validated['credit_limit'] ?? 0,
            'created_at'   => now(),
            'updated_at'   => now(),
        ]);

        return redirect()->back()->with('success', 'Party created.');
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'name'          => ['sometimes', 'string', 'max:255'],
            'phone'         => ['nullable', 'string', 'max:20'],
            'email'         => ['nullable', 'email', 'max:255'],
            'address'       => ['nullable', 'string', 'max:500'],
            'tax_number'    => ['nullable', 'string', 'max:50'],
            'credit_limit'  => ['nullable', 'numeric', 'min:0'],
        ]);

        $tenantId = app('current.tenant')->id;
        DB::table('parties')->where('parties.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->update(array_merge($validated, ['updated_at' => now()]));

        return redirect()->back()->with('success', 'Party updated.');
    }

    public function destroy(string $id)
    {
        $tenantId = app('current.tenant')->id;
        // Only soft-delete by clearing — hard delete blocked if linked to transactions
        $hasTransactions = DB::table('sales')->where('sales.tenant_id', app('current.tenant')->id)->where('party_id', $id)->exists()
            || DB::table('purchases')->where('purchases.tenant_id', app('current.tenant')->id)->where('party_id', $id)->exists();

        if ($hasTransactions) {
            return redirect()->back()->withErrors([
                'party' => 'Cannot delete a party with existing transactions.',
            ]);
        }

        DB::table('parties')->where('parties.tenant_id', app('current.tenant')->id)
            ->where('tenant_id', $tenantId)
            ->where('id', $id)
            ->delete();

        return redirect()->back()->with('success', 'Party deleted.');
    }
}
