<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Tenant;
use App\Models\TenantUser;
use App\Models\DemoVisitorLog;
use App\Services\DemoStoreService;
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

        // Must resolve to the Golden Master specifically, not any other
        // visitor's ephemeral demo clone (see DemoSessionService) — this is
        // the shared demo instance login, not a per-visitor sandbox.
        //
        // Previously this was firstOrFail(), which 404'd (surfaced to the
        // browser as a 409+redirect-to-/error/404 via the Inertia error
        // handler) whenever no Golden Master existed yet. Seeding 5 years
        // of data synchronously inside a login request would itself time
        // out, so instead: self-heal the tenant ROW via the shared
        // resolver (cheap, instant), and if it has no seeded data yet,
        // send the visitor to a friendly "demo is being prepared" page
        // rather than crashing.
        $demoTenant = DemoStoreService::goldenMaster();

        $hasData = \Illuminate\Support\Facades\Schema::hasTable('sales')
            && \Illuminate\Support\Facades\DB::table('sales')->where('tenant_id', $demoTenant->id)->exists();

        if (!$hasData) {
            return redirect()->route('demo.landing')->with(
                'error',
                'The demo store is being prepared. Please try again in a few minutes.'
            );
        }

        // Ensure user exists for this role
        $email = "demo-{$role}@venqore-demo.internal";
        $demoUser = User::withTrashed()->where('email', $email)->first();
        
        if (!$demoUser) {
            $demoUser = User::create([
                'email'    => $email,
                'name'     => 'Demo ' . ucfirst($role),
                'password' => bcrypt(Str::random(64)),
            ]);
        } elseif ($demoUser->trashed()) {
            $demoUser->restore();
        }

        // Ensure TenantUser record exists for this demo user
        TenantUser::firstOrCreate(
            ['tenant_id' => $demoTenant->id, 'user_id' => $demoUser->id],
            ['role' => $role, 'status' => 'active', 'joined_at' => now()]
        );

        // Log in the demo user
        Auth::login($demoUser, false);
        $request->session()->regenerate();

        // Track the visit — persistent log + live counter
        $demoTenant->update(['onboarding_completed' => true, 'onboarding_step' => 'completed']);
        $demoTenant->increment('demo_visit_count');
        $demoTenant->increment('demo_visit_today');
        Cache::increment('demo_visit_live');
        Cache::put("demo_user_{$request->session()->getId()}", true, now()->addHours(2));
        DemoVisitorLog::recordVisit($role);

        $demoUser->update(['last_store_id' => $demoTenant->id]);

        return redirect()->route('store.dashboard', ['store_slug' => $demoTenant->slug]);
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
