<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Illuminate\Http\RedirectResponse;

class DemoController extends Controller
{
    /**
     * Show the demo landing page.
     */
    public function landing()
    {
        return Inertia::render('Demo/Landing');
    }

    /**
     * Log into the shared demo instance as a specific role.
     */
    public function login(Request $request): RedirectResponse
    {
        $role = $request->input('role', 'cashier');
        $allowedRoles = ['owner', 'admin', 'manager', 'cashier', 'accountant', 'purchasing_officer', 'viewer'];

        if (!in_array($role, $allowedRoles)) {
            $role = 'cashier';
        }

        $demoTenant = Tenant::where('is_demo', true)->firstOrFail();

        // Ensure user exists for this role
        $demoUser = User::firstOrCreate(
            ['email' => "demo-{$role}@venqore-demo.internal"],
            [
                'name'     => 'Demo ' . ucfirst($role),
                'password' => bcrypt(Str::random(64)),
            ]
        );

        // Ensure TenantUser record exists for this demo user
        TenantUser::firstOrCreate(
            ['tenant_id' => $demoTenant->id, 'user_id' => $demoUser->id],
            ['role' => $role, 'status' => 'active', 'joined_at' => now()]
        );

        // Log in the demo user
        Auth::login($demoUser, false);
        $request->session()->regenerate();

        // Track the visit
        $demoTenant->increment('demo_visit_count');
        $demoTenant->increment('demo_visit_today');
        Cache::increment('demo_visit_live');
        Cache::put("demo_user_{$request->session()->getId()}", true, now()->addHours(2));

        $demoUser->update(['last_store_id' => $demoTenant->id]);

        return redirect()->route('store.dashboard', ['store_slug' => 'demo']);
    }

    /**
     * Log out of the demo.
     */
    public function logout(Request $request): RedirectResponse
    {
        Cache::decrement('demo_visit_live');
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('demo.landing');
    }
}
