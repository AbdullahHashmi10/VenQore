<?php

namespace App\Http\Controllers\V3;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RoleController extends Controller
{
    /**
     * Update a user's role. Admin only.
     * Roles used in enforcement: admin, manager, cashier
     */
    public function update(Request $request, string $userId)
    {
        $validated = $request->validate([
            'role' => ['required', 'in:admin,manager,cashier'],
        ]);

        // Only admin can change roles
        $actor = DB::table('users')->where('id', auth()->id())->first();
        if (!$actor || $actor->role !== 'admin') {
            abort(403, 'Only admins can change user roles.');
        }

        // Prevent demoting the last admin
        if ($validated['role'] !== 'admin') {
            $adminCount = DB::table('users')
                ->where('role', 'admin')
                ->where('id', '!=', $userId)
                ->count();

            if ($adminCount === 0) {
                return back()->withErrors([
                    'role' => 'Cannot remove the last admin account.',
                ]);
            }
        }

        DB::table('users')
            ->where('id', $userId)
            ->update(['role' => $validated['role'], 'updated_at' => now()]);

        return redirect()->back()->with('success', 'Role updated.');
    }

    /**
     * Update discount limit for a role.
     */
    public function updateDiscountLimit(Request $request)
    {
        $validated = $request->validate([
            'role'                 => ['required', 'string', 'max:50'],
            'max_discount_percent' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::table('discount_limits')
            ->updateOrInsert(
                ['role' => $validated['role']],
                [
                    'max_discount_percent' => $validated['max_discount_percent'],
                    'updated_at'           => now(),
                ]
            );

        return redirect()->back()->with('success', 'Discount limit updated.');
    }
}
