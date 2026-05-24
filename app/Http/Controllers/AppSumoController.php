<?php

namespace App\Http\Controllers;

use App\Models\AppSumoCode;
use App\Models\StoreLicense;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * AppSumoController — Definitive Plan
 *
 * Code stacking logic:
 *   1 code ($79)  → Starter
 *   2 codes ($158) → Growth
 *   3 codes ($237) → Business
 *
 * Buyers paste codes one at a time via the /redeem page.
 * Each additional code upgrades their existing LTD license plan tier.
 */
class AppSumoController extends Controller
{
    /**
     * Show the AppSumo code redemption form.
     */
    public function index(): Response
    {
        $user = Auth::user();

        // withoutTenantScope() is required here: the /redeem route has no TenantMiddleware,
        // so no 'current.tenant' is bound. StoreLicense uses HasTenant which falls back to
        // whereRaw('1=0') when no tenant is bound — silently returning 0 rows and breaking
        // the stacking count. We scope only by user_id + source instead.
        $existingCount = StoreLicense::query()
            ->where('user_id', $user->id)
            ->where('source', 'appsumo')
            ->count();

        $currentPlan = match(true) {
            $existingCount >= 3 => 'ltd_3',
            $existingCount >= 2 => 'ltd_2',
            $existingCount >= 1 => 'ltd_1',
            default             => null,
        };

        return Inertia::render('Redeem', [
            'codes_redeemed' => $existingCount,
            'current_plan'   => $currentPlan,
            'max_codes'      => 3,
        ]);
    }

    /**
     * Redeem an AppSumo code — with stacking support.
     */
    public function redeem(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:30',
        ]);

        $code = strtoupper(trim($request->code));
        $user = Auth::user();

        $appsumoCode = AppSumoCode::where('code', $code)
            ->where('is_redeemed', false)
            ->lockForUpdate()
            ->first();

        if (!$appsumoCode) {
            return response()->json([
                'error' => 'This code is invalid or has already been redeemed.',
            ], 422);
        }

        // withoutTenantScope(): same reason as index() — no tenant bound on this public route.
        $existingCodeCount = StoreLicense::query()
            ->where('user_id', $user->id)
            ->where('source', 'appsumo')
            ->count();

        if ($existingCodeCount >= 3) {
            return response()->json([
                'error' => 'Maximum of 3 AppSumo codes can be redeemed per account.',
            ], 422);
        }

        $newTotal = $existingCodeCount + 1;
        $plan = match(true) {
            $newTotal >= 3 => 'ltd_3',
            $newTotal >= 2 => 'ltd_2',
            default        => 'ltd_1',
        };

        DB::transaction(function () use ($user, $appsumoCode, $plan, $existingCodeCount) {
            // Mark code as consumed
            $appsumoCode->update([
                'is_redeemed' => true,
                'redeemed_by_email' => $user->email,
                'redeemed_at' => now(),
            ]);

            if ($existingCodeCount === 0) {
                // First code — create a new LTD license
                StoreLicense::create([
                    'user_id'          => $user->id,
                    'type'             => 'ltd',
                    'status'           => 'available', // available until they create/attach a store
                    'plan'             => $plan,
                    'source'           => 'appsumo',
                    'source_reference' => $appsumoCode->code,
                    'valid_until'      => null, // LTD = forever
                ]);
            } else {
                // Additional code — upgrade existing LTD license
                // withoutTenantScope(): still on public route, tenant may not be bound.
                StoreLicense::query()
                    ->where('user_id', $user->id)
                    ->where('source', 'appsumo')
                    ->where('type', 'ltd')
                    ->update(['plan' => $plan]);

                // If they already have a store attached to this license, upgrade it too
                $existingLicense = StoreLicense::query()
                    ->where('user_id', $user->id)
                    ->where('source', 'appsumo')
                    ->whereNotNull('tenant_id')
                    ->first();

                if ($existingLicense) {
                    Tenant::where('id', $existingLicense->tenant_id)
                          ->update([
                              'plan'        => 'ltd',
                              'plan_limits' => json_encode(config("plans.{$plan}")), // Explicitly write limits for PlanGate
                          ]);
                }
            }
        });

        $messages = [
            1 => 'Code redeemed! You\'re on LTD Starter (ltd_1). Add a 2nd code to upgrade to LTD Growth.',
            2 => 'Upgraded to LTD Growth (ltd_2)! Add a 3rd code to unlock LTD Business.',
            3 => 'Upgraded to LTD Business (ltd_3) — maximum tier unlocked!',
        ];

        return response()->json([
            'success'        => true,
            'message'        => $messages[$newTotal],
            'plan'           => $plan,
            'codes_redeemed' => $newTotal,
            'next_step_url'  => $newTotal === 1 ? route('store.create-or-join') : null,
        ]);
    }
}
