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
                'slug'          => $this->uniqueSlug($request->name),
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

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i    = 1;
        while (Tenant::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }
        return $slug;
    }

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
