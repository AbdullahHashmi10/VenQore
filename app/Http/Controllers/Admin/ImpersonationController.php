<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TenantUser;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * ImpersonationController — V1 Read-Only Impersonation
 *
 * 3-Layer Safety Protocol (from Master Plan):
 *   Layer 1: DB flag   — session('impersonating_user_id') set only for this request chain
 *   Layer 2: Middleware — ImpersonationGuard blocks ALL write HTTP methods (POST/PUT/PATCH/DELETE)
 *   Layer 3: UI        — "You are impersonating" warning banner on every page via Inertia shared props
 *
 * Routes (under /admin — SuperAdminMiddleware required):
 *   POST /admin/impersonate/{user}      → start impersonation
 *   POST /admin/impersonate/end         → end impersonation
 */
class ImpersonationController extends Controller
{
    public function start(Request $request, User $user): RedirectResponse
    {
        // Cannot impersonate yourself or another platform admin
        if ($user->id === auth()->id()) {
            return back()->withErrors(['impersonate' => 'You cannot impersonate yourself.']);
        }

        if ($user->is_platform_admin) {
            return back()->withErrors(['impersonate' => 'Cannot impersonate another platform admin.']);
        }

        // Store the Platform Owner's real ID so we can restore the session
        $request->session()->put('impersonator_id', auth()->id());
        $request->session()->put('impersonating_user_id', $user->id);

        // Log the impersonation event
        \App\Models\PlatformActivityLog::create([
            'user_id'          => auth()->id(),
            'action'           => 'impersonation.started',
            'target_user_id'   => $user->id,
            'target_tenant_id' => $user->last_store_id,
            'payload'          => ['target_email' => $user->email],
            'ip_address'       => $request->ip(),
        ]);

        // Find the user's last store and redirect there
        $storeId = $user->last_store_id;
        if (!$storeId) {
            $membership = TenantUser::where('user_id', $user->id)->where('status', 'active')->first();
            $storeId = $membership?->tenant_id;
        }

        // Login as the target user
        auth()->login($user);

        if ($storeId) {
            $tenant = \App\Models\Tenant::find($storeId);
            if ($tenant) {
                return redirect()->route('store.dashboard', ['store_slug' => $tenant->slug])
                    ->with('info', 'Impersonation mode active — all write operations are blocked.');
            }
        }

        return redirect()->route('hub')
            ->with('info', 'Impersonation mode active — all write operations are blocked.');
    }

    public function end(Request $request): RedirectResponse
    {
        $impersonatorId = $request->session()->get('impersonator_id');

        if (!$impersonatorId) {
            return redirect()->route('platform.dashboard')
                ->withErrors(['impersonate' => 'No active impersonation session.']);
        }

        $platformOwner = User::find($impersonatorId);
        if (!$platformOwner) {
            return redirect()->route('login');
        }

        // Log the end
        \App\Models\PlatformActivityLog::create([
            'user_id'          => $impersonatorId,
            'action'           => 'impersonation.ended',
            'target_user_id'   => auth()->id(),
            'ip_address'       => $request->ip(),
        ]);

        // Clear impersonation session keys
        $request->session()->forget(['impersonating_user_id', 'impersonator_id']);

        // Restore Platform Owner session
        auth()->login($platformOwner);

        return redirect()->route('platform.dashboard')
            ->with('success', 'Impersonation ended. You are back as Platform Owner.');
    }
}
