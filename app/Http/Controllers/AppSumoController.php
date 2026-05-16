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
     * Alias for form() — used by the /redeem GET route registered at the tenant level.
     * Route: GET /redeem  (name: appsumo.index)
     */
    public function index(): Response
    {
        return $this->form();
    }

    /**
     * Show the AppSumo code redemption form.
     */
    public function form(): Response
    {
        $user = Auth::user();

        $existingCount = StoreLicense::where('user_id', $user->id)
            ->where('source', 'appsumo')
            ->count();

        $currentPlan = match(true) {
            $existingCount >= 3 => 'business',
            $existingCount >= 2 => 'growth',
            $existingCount >= 1 => 'starter',
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
            ->where('status', 'available')
            ->lockForUpdate()
            ->first();

        if (!$appsumoCode) {
            return response()->json([
                'error' => 'This code is invalid or has already been redeemed.',
            ], 422);
        }

        $existingCodeCount = StoreLicense::where('user_id', $user->id)
            ->where('source', 'appsumo')
            ->count();

        if ($existingCodeCount >= 3) {
            return response()->json([
                'error' => 'Maximum of 3 AppSumo codes can be redeemed per account.',
            ], 422);
        }

        $newTotal = $existingCodeCount + 1;
        $plan = match(true) {
            $newTotal >= 3 => 'business',
            $newTotal >= 2 => 'growth',
            default        => 'starter',
        };

        DB::transaction(function () use ($user, $appsumoCode, $plan, $existingCodeCount) {
            // Mark code as consumed
            $appsumoCode->update([
                'status'      => 'consumed',
                'redeemed_by' => $user->id,
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
                StoreLicense::where('user_id', $user->id)
                    ->where('source', 'appsumo')
                    ->where('type', 'ltd')
                    ->update(['plan' => $plan]);

                // If they already have a store attached to this license, upgrade it too
                $existingLicense = StoreLicense::where('user_id', $user->id)
                    ->where('source', 'appsumo')
                    ->whereNotNull('tenant_id')
                    ->first();

                if ($existingLicense) {
                    Tenant::where('id', $existingLicense->tenant_id)
                          ->update(['plan' => $plan]);
                }
            }
        });

        $messages = [
            1 => 'Code redeemed! You have the Starter plan. Add a 2nd code to upgrade to Growth.',
            2 => 'Upgraded to Growth plan! Add a 3rd code to unlock Business plan.',
            3 => 'Upgraded to Business plan — maximum tier unlocked!',
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
