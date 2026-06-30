<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /** Subscription plans a visitor can start a trial of. */
    private const TRIAL_PLAN_SLUGS = ['starter', 'growth', 'business'];

    /**
     * Display the registration view.
     *
     * If the visitor arrived from the pricing page with a chosen plan
     * (?plan=growth&interval=monthly), remember it for after sign-up so the
     * trial is created on that plan — surviving the round-trip even through
     * Google OAuth, which posts to a different controller.
     */
    public function create(Request $request): Response
    {
        $plan     = strtolower((string) $request->query('plan', ''));
        $interval = strtolower((string) $request->query('interval', 'monthly'));

        $plan     = in_array($plan, self::TRIAL_PLAN_SLUGS, true) ? $plan : null;
        $interval = in_array($interval, ['monthly', 'annual'], true) ? $interval : 'monthly';

        if ($plan) {
            session(['signup_plan' => $plan, 'signup_interval' => $interval]);
        }

        return Inertia::render('Auth/Register', [
            'intended_plan'     => $plan,
            'intended_interval' => $interval,
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // First user becomes Platform Owner (platform owner)
        $isFirstUser = User::count() === 0;

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'is_platform_admin' => $isFirstUser,
            'platform_role'  => $isFirstUser ? 'platform_owner' : 'none',
        ]);

        event(new Registered($user));

        Auth::login($user);

        // Resolve the plan the visitor selected on the pricing page — from the
        // submitted hidden fields, falling back to the session stash.
        $plan     = strtolower((string) ($request->input('plan')     ?: session('signup_plan', '')));
        $interval = strtolower((string) ($request->input('interval') ?: session('signup_interval', 'monthly')));
        session()->forget(['signup_plan', 'signup_interval']);

        // If they picked a plan, take them straight into store creation on it
        // (name the store → trial starts). Otherwise, the Hub as before.
        if (in_array($plan, self::TRIAL_PLAN_SLUGS, true)) {
            $interval = in_array($interval, ['monthly', 'annual'], true) ? $interval : 'monthly';
            return redirect()->route('store.create', ['plan' => $plan, 'interval' => $interval]);
        }

        // After registering, you go to the Hub to create or join your first store
        return redirect()->intended(route('hub', absolute: false));
    }
}
