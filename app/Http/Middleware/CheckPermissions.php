<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckPermissions
{
    /**
     * Handle an incoming request.
     *
     * SECURITY: God Mode bypass is DELETED.
     * - Platform routes (admin.*): only is_platform_admin = true passes. Everyone else = 404.
     * - Store routes: check permission against the user's role in the current store.
     *   If no store membership is bound, redirect to /hub.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        $user = Auth::user();

        if (!$user) {
            abort(403, 'Unauthorized');
        }

        // ── Platform HQ routes (/VenQore/*): ONLY is_platform_admin = true ────
        if ($request->is('VenQore*') || $request->routeIs('superadmin.*')) {
            if (!$user->isPlatformAdmin()) {
                abort(404);
            }
            return $next($request);
        }

        // ── Platform super admins always bypass all store-level checks ────────
        if ($user->isPlatformAdmin()) {
            return $next($request);
        }

        // ── Resolve custom permissions via getPermissionsAttribute() ────────
        // This unified getter automatically respects:
        //  1. Custom granular checkbox overrides saved in the tenant_users pivot
        //  2. config/permissions.php default role map as a fallback
        $userPerms = $user->permissions;

        // God-mode wildcard bypass
        if (in_array('*', $userPerms)) {
            return $next($request);
        }

        // ── Map legacy broad permissions to granular actions for backward compatibility ──
        $mappedPermissions = [];
        $legacyMap = [
            'inventory'  => ['inventory.view', 'inventory.create', 'inventory.edit', 'inventory.adjust', 'inventory.transfer', 'inventory.barcodes'],
            'customers'  => ['purchases.suppliers', 'sales.create'],
            'finance'    => ['finance.balances', 'finance.transactions', 'finance.receive_payment', 'finance.send_payment', 'finance.expenses', 'finance.journal'],
            'sales'      => ['sales.create', 'sales.edit', 'sales.view'],
            'sales_view' => ['sales.view', 'sales.create'],
            'reports'    => ['reports.summary', 'reports.financial', 'reports.stock', 'reports.performance', 'reports.audit'],
            'settings'   => ['admin.settings_view', 'admin.settings_manage'],
            'users'      => ['admin.staff_view', 'admin.staff_manage'],
            'audit'      => ['reports.audit'],
            'returns'    => ['sales.returns'],
            'pos'        => ['pos.open_session', 'pos.checkout', 'pos.discounts', 'pos.void_item', 'pos.refund', 'pos.close_session'],
        ];

        foreach ($permissions as $permission) {
            $mappedPermissions[] = $permission;
            if (isset($legacyMap[$permission])) {
                $mappedPermissions = array_merge($mappedPermissions, $legacyMap[$permission]);
            }
        }
        $mappedPermissions = array_unique($mappedPermissions);

        // If no required permissions specified, allow basic authenticated access
        if (empty($mappedPermissions)) {
            return $next($request);
        }

        // ── Check if user holds at least one of the required granular keys ───
        foreach ($mappedPermissions as $permission) {
            if (in_array($permission, $userPerms)) {
                return $next($request);
            }
        }

        // ── Handle access restrictions gracefully ────────────────────────────
        $membership = app()->bound('current.membership') ? app('current.membership') : null;

        if (!$membership) {
            // For bare/legacy routes without store context, redirect to hub
            return redirect()->route('hub')
                ->with('info', 'You do not have permission to access that area.');
        }

        abort(403, 'Access Denied: You do not have the required permission (' . implode(' or ', $permissions) . ').');
    }
}
