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
        // Check by URI prefix — NOT by route name prefix — because both the
        // Platform HQ (/VenQore/*) and the legacy Store Admin (/admin-panel/*)
        // share the 'admin.' route name prefix, and we must not block store users
        // from their own admin panel.
        // 404 is intentional: a 403 reveals the route exists.
        if ($request->is('VenQore*') || $request->routeIs('superadmin.*')) {
            if (!$user->isPlatformAdmin()) {
                abort(404);
            }
            return $next($request);
        }

        // ── Store routes: check against tenant membership role ────────────────
        $membership = app()->bound('current.membership') ? app('current.membership') : null;

        // No membership bound = legacy bare route (/admin-panel/*, /reports/*, etc.)
        // These routes don't go through TenantMiddleware so no membership is set.
        // Allow store owners/admins through by checking their role on the User model.
        // (The User model stores last-known role from their primary store membership.)
        if (!$membership) {
            // Platform admin: always through
            if ($user->isPlatformAdmin()) {
                return $next($request);
            }

            // For legacy bare routes, fall through to permission check below.
            // We'll use the user's model-level permissions (set by their role in config/permissions.php).
            // If no required permission is specified, allow authenticated users through.
            if (empty($permissions)) {
                return $next($request);
            }

            // Check via config/permissions.php using the user's stored role
            $userRole = $user->role ?? 'viewer';
            $permMap  = config('permissions', []);
            $rolePerms = $permMap[$userRole] ?? [];

            // Store owners and admins get through on all bare /admin-panel/* routes.
            // NOTE: 'platform_admin' is intentionally NOT listed here.
            // Platform access is already gated above via $user->isPlatformAdmin()
            // which checks is_platform_admin === true (the boolean DB column).
            // A role string of 'platform_admin' must NOT bypass this check —
            // the role column can be set without the is_platform_admin flag being true.
            if (in_array($userRole, ['owner', 'admin'])) {
                return $next($request);
            }

            foreach ($permissions as $permission) {
                if (in_array($permission, $rolePerms)) {
                    return $next($request);
                }
            }

            // Not authorized — redirect to hub, not 403, so bookmarks don't white-screen
            return redirect()->route('hub')
                ->with('info', 'You do not have permission to access that area.');
        }

        // ── Has store membership: role-based check ────────────────────────────
        $role = $membership->role;

        // Store owners and admins have full store-level access
        // Including the /admin/ sub-routes for legacy pages
        if (in_array($role, ['owner', 'admin']) || str_contains($request->getPathInfo(), '/admin')) {
            if (in_array($role, ['owner', 'admin'])) {
                return $next($request);
            }
        }

        // Map permissions config if it exists, otherwise fall back to user->permissions shim
        $permMap = config('permissions', []);
        if (!empty($permMap) && !empty($permissions)) {
            $rolePerms = $permMap[$role] ?? [];
            foreach ($permissions as $permission) {
                if (in_array($permission, $rolePerms)) {
                    return $next($request);
                }
            }
            abort(403, 'You do not have permission to access this area.');
        }

        // Fallback: legacy permissions array on user model
        $userPerms = $user->permissions ?? [];
        if (!is_array($userPerms)) {
            $userPerms = [];
        }

        if (in_array('*', $userPerms)) {
            return $next($request);
        }

        foreach ($permissions as $permission) {
            if (in_array($permission, $userPerms)) {
                return $next($request);
            }
        }

        abort(403, 'Access Denied: You do not have the required permission (' . implode(' or ', $permissions) . ').');
    }
}
