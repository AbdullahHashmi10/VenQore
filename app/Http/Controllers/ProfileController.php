<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\TenantUser;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('account.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    /**
     * Update the user's quick-login PIN (pos_pin on the tenant_users membership).
     *
     * The 'passcode' column was removed from users table and moved to
     * tenant_users.pos_pin — so we must update the membership record.
     */
    public function updatePasscode(Request $request): RedirectResponse
    {
        $request->validate([
            'passcode' => ['nullable', 'string', 'min:4', 'max:6', 'regex:/^\d+$/'],
        ]);

        $user = $request->user();

        if (!$user->last_store_id) {
            return Redirect::back()->withErrors(['passcode' => 'No active store selected.']);
        }

        $membership = TenantUser::where('tenant_id', $user->last_store_id)
            ->where('user_id', $user->id)
            ->first();

        if (!$membership) {
            return Redirect::back()->withErrors(['passcode' => 'Membership not found for the active store.']);
        }

        // pos_pin stores the quick-login PIN (4-6 digits, plain — used for POS PIN entry)
        $membership->pos_pin = $request->passcode ?: null;
        $membership->save();

        return Redirect::back()->with('status', 'passcode-updated');
    }
}
