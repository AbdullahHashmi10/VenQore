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

        $tenantId = app('current.tenant')->id;

        // Only admin or owner can change roles
        $actor = DB::table('tenant_users')
            ->where('tenant_id', $tenantId)
            ->where('user_id', auth()->id())
            ->first();

        if (!$actor || ($actor->role !== 'admin' && $actor->role !== 'owner')) {
            abort(403, 'Only admins and owners can change user roles.');
        }

        // The target must be a member of THIS store (404 otherwise): the
        // users.role sync below used to rewrite the role of ANY user id,
        // including another store's staff.
        $target = DB::table('tenant_users')
            ->where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->first();
        abort_if(!$target, 404);

        // Prevent demoting the last admin or owner
        if ($validated['role'] !== 'admin' && $validated['role'] !== 'owner') {
            $adminCount = DB::table('tenant_users')
                ->where('tenant_id', $tenantId)
                ->whereIn('role', ['admin', 'owner'])
                ->where('user_id', '!=', $userId)
                ->count();

            if ($adminCount === 0) {
                return back()->withErrors([
                    'role' => 'Cannot remove the last admin or owner account.',
                ]);
            }
        }

        DB::table('tenant_users')
            ->where('tenant_id', $tenantId)
            ->where('user_id', $userId)
            ->update(['role' => $validated['role'], 'updated_at' => now()]);

        // Also sync back to users table fallback column
        $user = \App\Models\User::find($userId);
        if ($user) {
            $user->role = $validated['role'];
            $user->save();
        }

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

        // tenant_id MUST be part of the match attributes: updateOrInsert() drops
        // earlier where() clauses on INSERT, which used to write a GLOBAL
        // (tenant_id NULL) row that changed the limit for every store.
        DB::table('discount_limits')->updateOrInsert(
            ['tenant_id' => app('current.tenant')->id, 'role' => $validated['role']],
            fn (bool $exists) => array_filter([
                'max_discount_percent' => $validated['max_discount_percent'],
                'updated_at'           => now(),
                'created_at'           => $exists ? null : now(),
            ], fn ($v) => $v !== null)
        );

        return redirect()->back()->with('success', 'Discount limit updated.');
    }
}
