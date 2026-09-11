<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Require2FA — authenticator-app MFA gate.
 *
 * SEC-05 (2026-09-10): this class existed but was never registered, so it
 * protected nothing. It is now appended to the global `web` group and:
 *
 *   - ALWAYS enforces TOTP for platform admins/staff (every web route, including
 *     store routes they can enter via the platform bypass);
 *   - enforces it for store owners only when venqore.require_owner_2fa is on;
 *   - enforces it for ANY user who has switched 2FA on (2026-09-10 — before,
 *     a store user who enabled 2FA was never asked for the code);
 *   - is skipped in the test suite unless a test opts in with
 *     config(['venqore.enforce_2fa_in_tests' => true]) — so MFA itself can be
 *     tested without breaking unrelated feature tests.
 */
class Require2FA
{
    /** Routes a half-authenticated user must still reach. */
    private const EXEMPT_ROUTES = [
        '2fa.setup', '2fa.confirm', '2fa.verify', '2fa.post-verify', '2fa.recovery',
        'logout', 'platform.login', 'platform.login.store',
    ];

    public function handle(Request $request, Closure $next)
    {
        if (app()->runningUnitTests() && !config('venqore.enforce_2fa_in_tests', false)) {
            return $next($request);
        }

        $user = Auth::user();
        if (!$user) {
            return $next($request);
        }

        foreach (self::EXEMPT_ROUTES as $name) {
            if ($request->routeIs($name)) {
                return $next($request);
            }
        }

        $attributes = $user->getAttributes();
        $isPlatform = (bool) ($attributes['is_platform_admin'] ?? false)
            || (method_exists($user, 'isPlatformStaff') && $user->isPlatformStaff());

        $is2faSetup = !empty($attributes['two_factor_secret']) && !empty($attributes['two_factor_confirmed_at']);

        // This runs in the `web` group, BEFORE the route's tenant middleware
        // has bound the store — so resolve it from the URL when needed.
        $isOwner = false;
        if (!$isPlatform && config('venqore.require_owner_2fa', false)) {
            $tenantId = (app()->bound('current.tenant') && app('current.tenant')?->id)
                ? app('current.tenant')->id
                : (($slug = $request->route('store_slug'))
                    ? \App\Models\Tenant::withoutGlobalScopes()->where('slug', $slug)->value('id')
                    : null);
            $isOwner = $tenantId && $user->roleIn($tenantId) === 'owner';
        }

        // Anyone who has turned 2FA on is asked for the code — switching it on
        // must actually protect the account, whatever the role.
        if (!$isPlatform && !$isOwner && !$is2faSetup) {
            return $next($request);
        }

        if (!$is2faSetup) {
            return $this->deny($request, '2fa.setup', 'Set up two-factor authentication to continue.');
        }

        if (!$request->session()->has('2fa_verified_at')) {
            return $this->deny($request, '2fa.verify', 'Enter your authenticator code to continue.');
        }

        return $next($request);
    }

    private function deny(Request $request, string $route, string $message)
    {
        if ($request->expectsJson() && !$request->header('X-Inertia')) {
            return response()->json(['message' => $message, 'redirect' => route($route)], 423);
        }
        if (!$request->isMethod('GET')) {
            return redirect()->route($route);
        }
        return redirect()->guest(route($route));
    }
}
