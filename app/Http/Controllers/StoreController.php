<?php

namespace App\Http\Controllers;

use App\Models\StoreLicense;
use App\Models\Tenant;
use App\Models\TenantUser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * StoreController — Definitive Plan
 *
 * Handles creating new stores and the "create or join" landing page
 * shown to new users (0 stores) after registration/login.
 */
class StoreController extends Controller
{
    /**
     * Page shown to users with no stores yet.
     * Offers: create a new store OR join an existing one via join code.
     */
    public function createOrJoin(): Response
    {
        $user = Auth::user();

        // Check if they have an available license to create a store
        $availableLicense = StoreLicense::where('user_id', $user->id)
            ->where('status', 'available')
            ->first();

        return Inertia::render('Store/CreateOrJoin', [
            'has_license'   => !is_null($availableLicense),
            'license_plan'  => $availableLicense?->plan ?? 'trial',
        ]);
    }

    /**
     * Show the new store creation form.
     */
    public function create(): Response
    {
        $user = Auth::user();

        $license = StoreLicense::where('user_id', $user->id)
            ->where('status', 'available')
            ->first();

        // If no license, they can still create a trial store
        return Inertia::render('Store/Create', [
            'available_license' => $license ? [
                'plan'   => $license->plan,
                'type'   => $license->type,
                'source' => $license->source,
            ] : null,
        ]);
    }

    /**
     * Create a new store for the authenticated user.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name'          => 'required|string|max:100',
        ]);

        $user = Auth::user();

        // ── Unique Store Name & Soft-Delete Re-activation Check ───────────
        $baseSlug = \Illuminate\Support\Str::slug($request->name);
        if (empty($baseSlug)) {
            $baseSlug = 'store';
        }
        if (strlen($baseSlug) < 3) {
            $baseSlug = $baseSlug . '-store';
        }

        $existingTenant = \App\Models\Tenant::withTrashed()->where('slug', $baseSlug)->first();

        if ($existingTenant) {
            // Check if the current user was or is the owner of this store
            $wasOwner = \App\Models\TenantUser::where('tenant_id', $existingTenant->id)
                ->where('user_id', $user->id)
                ->where('role', 'owner')
                ->exists();

            if ($existingTenant->trashed()) {
                if ($wasOwner) {
                    return back()->withErrors([
                        'name' => 'This store was previously deleted by you. Please contact support to reopen it.',
                    ]);
                } else {
                    return back()->withErrors([
                        'name' => 'This store name is already taken. Please choose a unique store name.',
                    ]);
                }
            } else {
                if ($wasOwner) {
                    return back()->withErrors([
                        'name' => 'You already have an active store with this name.',
                    ]);
                } else {
                    return back()->withErrors([
                        'name' => 'This store name is already in use by another account. Please choose a unique store name.',
                    ]);
                }
            }
        }

        // ── LTD Store Limit Check ─────────────────────────────────────────
        // Count how many stores this user already owns (any status).
        $ownedStoreCount = TenantUser::where('user_id', $user->id)
            ->where('role', 'owner')
            ->count();

        // Check their AppSumo license plan for a store count ceiling.
        $appsumoLicense = StoreLicense::where('user_id', $user->id)
            ->whereIn('status', ['available', 'consumed'])
            ->where('source', 'appsumo')
            ->orderByDesc('created_at')
            ->first();

        if ($appsumoLicense) {
            $storeLimits = [
                'ltd_1'    => 1,
                'ltd_2'    => 2,
                'ltd_3'    => 4,
                // legacy keys (pre-fix) — keep for backward compat
                'starter'  => 1,
                'growth'   => 2,
                'business' => 4,
            ];
            $storeLimit = $storeLimits[$appsumoLicense->plan] ?? 1;

            if ($ownedStoreCount >= $storeLimit) {
                return back()->withErrors([
                    'name' => "Your AppSumo plan allows a maximum of {$storeLimit} store(s). Stack another code to unlock more stores.",
                ]);
            }
        }
        // ─────────────────────────────────────────────────────────────────

        $tenant = DB::transaction(function () use ($request, $user) {
            // Claim available license or create a trial license
            $license = StoreLicense::where('user_id', $user->id)
                ->where('status', 'available')
                ->lockForUpdate()
                ->first();

            $plan = $license?->plan ?? 'starter';

            // Create the store
            $tenant = Tenant::create([
                'name'          => $request->name,
                'slug'          => \App\Services\SubdomainGenerator::generate($request->name),
                'plan'          => $plan,
                'status'        => 'trial',
                'trial_ends_at' => now()->addDays(14),
                'join_code'     => $this->generateJoinCode(),
                'currency_code' => 'PKR', // Default till setup wizard
                'currency_symbol' => 'Rs.',
                'timezone'      => 'Asia/Karachi',
                'industry'      => 'retail',
            ]);

            // Make the user the owner
            TenantUser::create([
                'tenant_id' => $tenant->id,
                'user_id'   => $user->id,
                'role'      => 'owner',
                'status'    => 'active',
                'joined_at' => now(),
            ]);

            // Consume or create the license record
            if ($license) {
                $license->update([
                    'tenant_id'   => $tenant->id,
                    'status'      => 'consumed',
                    'consumed_at' => now(),
                ]);
            } else {
                StoreLicense::create([
                    'user_id'     => $user->id,
                    'tenant_id'   => $tenant->id,
                    'type'        => 'trial',
                    'status'      => 'consumed',
                    'plan'        => 'starter',
                    'source'      => 'registration',
                    'consumed_at' => now(),
                    'valid_until' => now()->addDays(14),
                ]);
            }

            // Set as their active store
            $user->update(['last_store_id' => $tenant->id]);

            // Seed chart of accounts and default settings
            \Database\Seeders\TenantDefaultSeeder::seedFor($tenant);

            return $tenant;
        });

        $user->refresh();

        return redirect()->route('hub');
    }

    // ──────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────

    private function generateJoinCode(): string
    {
        do {
            $code = 'VQ-' . strtoupper(Str::random(4));
        } while (Tenant::where('join_code', $code)->exists());
        return $code;
    }

    private function symbolFor(string $code): string
    {
        $symbols = [
            'USD' => '$', 'EUR' => '€', 'GBP' => '£', 'PKR' => 'Rs.',
            'INR' => '₹', 'AED' => 'AED', 'SAR' => 'SAR', 'CAD' => 'CA$',
            'AUD' => 'A$', 'JPY' => '¥', 'CNY' => '¥', 'SGD' => 'S$',
        ];
        return $symbols[$code] ?? $code;
    }
}
