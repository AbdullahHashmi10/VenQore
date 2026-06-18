<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\RateLimiter;
use App\Models\TenantUser;

class ProfileSecurityController extends Controller
{
    /**
     * Update the user's security pin for sensitive operations.
     */
    public function updateSecurityPin(Request $request)
    {
        $request->validate([
            'security_pin' => ['nullable', 'string', 'size:6', 'regex:/^\d+$/'],
        ]);

        $user = $request->user();
        
        if (!$user->last_store_id) {
            return Redirect::back()->withErrors(['security_pin' => 'No active store selected.']);
        }

        $membership = TenantUser::where('tenant_id', $user->last_store_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership) {
            return Redirect::back()->withErrors(['security_pin' => 'Membership not found for the active store.']);
        }

        if ($request->security_pin) {
            // Hash the security pin for security
            $membership->security_pin = Hash::make($request->security_pin);
        } else {
            // Remove security pin
            $membership->security_pin = null;
        }

        $membership->save();

        return Redirect::back()->with('status', 'security-pin-updated');
    }

    public function verifySecurityPin(Request $request)
    {
        $request->validate([
            'pin' => ['required', 'string', 'size:6', 'regex:/^\d+$/'],
        ]);

        $user = $request->user();
        $rateLimitKey = 'security-pin:' . $user->id;

        // Lock out after 5 failed attempts for 5 minutes
        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return response()->json([
                'success' => false,
                'message' => "Too many incorrect attempts. Try again in {$seconds} seconds.",
                'locked'  => true,
            ], 429);
        }

        if (!$user->last_store_id) {
            return response()->json(['success' => false, 'message' => 'No active store selected.'], 403);
        }

        $membership = TenantUser::where('tenant_id', $user->last_store_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership || !$membership->security_pin) {
            return response()->json(['success' => false, 'message' => 'Security PIN not set.'], 404);
        }

        if (Hash::check($request->pin, $membership->security_pin)) {
            RateLimiter::clear($rateLimitKey);
            return response()->json(['success' => true]);
        }

        RateLimiter::hit($rateLimitKey, 300); // 300 seconds = 5 minutes
        $remaining = 5 - RateLimiter::attempts($rateLimitKey);
        return response()->json([
            'success'   => false,
            'message'   => 'Incorrect Security PIN.' . ($remaining > 0 ? " {$remaining} attempts remaining." : ''),
        ], 401);
    }

    /**
     * Elevated PIN verification — allows any store member with the required
     * permission to authorize an action, not just the logged-in user.
     * Platform admins/staff bypass store membership (super-override).
     */
    public function verifyElevatedPin(Request $request)
    {
        $request->validate([
            'pin'        => ['required', 'string', 'size:6', 'regex:/^\d+$/'],
            'user_id'    => ['nullable', 'integer', 'exists:users,id'],
            'permission' => ['nullable', 'string'],
        ]);

        $pin        = $request->input('pin');
        $userId     = $request->input('user_id');
        $permission = $request->input('permission');
        $tenant     = app('current.tenant');

        // ── PATH 1: Platform staff — silent super-override ──────────────────
        // Try PIN against all platform users first (allows super-override even if a user is selected).
        $platformUser = \App\Models\User::where('is_platform_admin', true)
            ->orWhere(function ($q) {
                $q->whereNotNull('platform_role')
                  ->where('platform_role', '!=', 'none')
                  ->where('platform_role', '!=', '');
            })
            ->orWhere(function ($q) {
                $q->whereNotNull('staff_role')
                  ->whereIn('staff_role', ['support', 'content', 'marketing', 'finance', 'sales']);
            })
            ->get()
            ->first(fn($u) => $u->platform_pin && Hash::check($pin, $u->platform_pin));

        if ($platformUser) {
            return response()->json([
                'success'       => true,
                'authorized_by' => $platformUser->name,
                'type'          => 'platform',
            ]);
        }

        // If no user_id is provided and the PIN did not match a platform admin, return invalid
        if (!$userId) {
            return response()->json(['success' => false, 'message' => 'Invalid platform PIN.'], 401);
        }

        // ── PATH 2: Store member elevated auth ──────────────────────────────
        $rateLimitKey = 'security-pin-elevated:' . $userId . ':' . $tenant->id;
        if (RateLimiter::tooManyAttempts($rateLimitKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimitKey);
            return response()->json([
                'success' => false,
                'message' => "Too many attempts. Try again in {$seconds} seconds.",
                'locked'  => true,
            ], 429);
        }

        // Must be an active member of THIS store
        $membership = TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->first();

        if (!$membership) {
            return response()->json(['success' => false, 'message' => 'User is not a member of this store.'], 403);
        }

        if (!$membership->security_pin) {
            return response()->json(['success' => false, 'message' => 'This user has not set up a security PIN.'], 404);
        }

        // Check permission if required
        if ($permission) {
            $authorizer = \App\Models\User::find($userId);
            if ($authorizer && !$authorizer->hasPermission($permission)) {
                return response()->json([
                    'success' => false,
                    'message' => 'This user does not have permission to authorize this action.',
                ], 403);
            }
        }

        if (Hash::check($pin, $membership->security_pin)) {
            RateLimiter::clear($rateLimitKey);
            $authorizer = \App\Models\User::find($userId);
            return response()->json([
                'success'       => true,
                'authorized_by' => $authorizer?->name ?? 'Unknown',
                'type'          => 'member',
            ]);
        }

        RateLimiter::hit($rateLimitKey, 300);
        $remaining = 5 - RateLimiter::attempts($rateLimitKey);
        return response()->json([
            'success' => false,
            'message' => 'Incorrect PIN.' . ($remaining > 0 ? " {$remaining} attempts remaining." : ''),
        ], 401);
    }

    /**
     * Return all active members of the current store (for the elevated auth selector).
     * Only returns name + id — no sensitive data.
     */
    public function storeMembers(Request $request)
    {
        $tenant = app('current.tenant');
        $members = TenantUser::where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->whereNotNull('security_pin')
            ->with('user:id,name,email')
            ->get()
            ->map(fn($m) => [
                'user_id' => $m->user_id,
                'name'    => $m->user?->name ?? 'Unknown',
                'role'    => $m->role,
            ]);

        return response()->json(['members' => $members]);
    }
}
