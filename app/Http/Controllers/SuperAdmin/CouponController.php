<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CouponController extends Controller
{
    public function index()
    {
        $coupons = Coupon::with(['platform', 'planRestrictions'])
            ->withCount('redemptions')
            ->orderByDesc('created_at')
            ->get();

        $plans = Plan::where('is_active', true)->with('platform')->get();

        return Inertia::render('SuperAdmin/Coupons/Index', [
            'coupons' => $coupons,
            'plans'   => $plans,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code'                => 'required|string|max:50|unique:coupons,code',
            'name'                => 'required|string|max:150',
            'description'         => 'nullable|string',
            'discount_type'       => 'required|in:percentage,fixed',
            'discount_value'      => 'required|numeric|min:0',
            'max_discount'        => 'nullable|numeric|min:0',
            'applies_to'          => 'required|in:all,subscription,ltd,specific_plans',
            'platform_id'         => 'nullable|exists:platforms,id',
            'max_uses'            => 'nullable|integer|min:1',
            'max_uses_per_user'   => 'required|integer|min:1',
            'valid_from'          => 'required|date',
            'valid_until'         => 'nullable|date|after:valid_from',
            'plan_ids'            => 'nullable|array',
            'plan_ids.*'          => 'exists:plans,id',
        ]);

        $coupon = Coupon::create($validated);

        if ($validated['applies_to'] === 'specific_plans' && !empty($validated['plan_ids'])) {
            $coupon->planRestrictions()->attach($validated['plan_ids']);
        }

        return back()->with('success', "Coupon \"{$coupon->code}\" created and active.");
    }

    public function update(Request $request, Coupon $coupon)
    {
        $validated = $request->validate([
            'is_active'   => 'boolean',
            'valid_until' => 'nullable|date',
            'max_uses'    => 'nullable|integer|min:1',
            'description' => 'nullable|string',
        ]);

        $coupon->update($validated);

        return back()->with('success', "Coupon updated.");
    }

    /**
     * Public-facing validation endpoint — called from checkout/redeem pages.
     */
    public function validateCoupon(Request $request)
    {
        $request->validate([
            'code'    => 'required|string',
            'plan_id' => 'required|exists:plans,id',
        ]);

        $coupon = Coupon::where('code', strtoupper(trim($request->code)))->first();

        if (!$coupon || !$coupon->isValid()) {
            return response()->json(['valid' => false, 'message' => 'Invalid or expired coupon code.'], 422);
        }

        // Plan restriction check
        if ($coupon->applies_to === 'specific_plans') {
            $allowed = $coupon->planRestrictions()->where('plan_id', $request->plan_id)->exists();
            if (!$allowed) {
                return response()->json(['valid' => false, 'message' => 'This coupon does not apply to the selected plan.'], 422);
            }
        }

        $discountDisplay = $coupon->discount_type === 'percentage'
            ? "{$coupon->discount_value}% off"
            : "\${$coupon->discount_value} off";

        return response()->json([
            'valid'          => true,
            'discount_type'  => $coupon->discount_type,
            'discount_value' => $coupon->discount_value,
            'message'        => "Coupon applied — {$discountDisplay}",
        ]);
    }
}
