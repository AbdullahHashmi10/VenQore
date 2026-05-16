<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use App\Models\TenantUser;

class ProfileSecurityController extends Controller
{
    /**
     * Update the user's security pin for sensitive operations.
     */
    public function updateSecurityPin(Request $request)
    {
        $request->validate([
            'security_pin' => ['nullable', 'string', 'size:6', 'regex:/^\d+$/'],
        ]);

        $user = $request->user();
        
        if (!$user->last_store_id) {
            return Redirect::back()->withErrors(['security_pin' => 'No active store selected.']);
        }

        $membership = TenantUser::where('tenant_id', $user->last_store_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership) {
            return Redirect::back()->withErrors(['security_pin' => 'Membership not found for the active store.']);
        }

        if ($request->security_pin) {
            // Hash the security pin for security
            $membership->security_pin = Hash::make($request->security_pin);
        } else {
            // Remove security pin
            $membership->security_pin = null;
        }

        $membership->save();

        return Redirect::back()->with('status', 'security-pin-updated');
    }

    /**
     * Verify the security pin.
     */
    public function verifySecurityPin(Request $request)
    {
        $request->validate([
            'pin' => ['required', 'string', 'size:6', 'regex:/^\d+$/'],
        ]);

        $user = $request->user();
        
        if (!$user->last_store_id) {
            return response()->json(['success' => false, 'message' => 'No active store selected.'], 403);
        }

        $membership = TenantUser::where('tenant_id', $user->last_store_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership || !$membership->security_pin) {
            return response()->json(['success' => false, 'message' => 'Security PIN not set.'], 404);
        }

        if (Hash::check($request->pin, $membership->security_pin)) {
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false, 'message' => 'Incorrect Security PIN.'], 401);
    }
}
