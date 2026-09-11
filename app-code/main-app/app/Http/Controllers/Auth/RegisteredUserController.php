<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\InviteRedirect;
use App\Support\GiftRedirect;
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
    /**
     * Display the registration view.
     *
     * Creating an account never requires choosing a plan. If the visitor came
     * from an invite magic-link, remember the invite so we can send them to
     * accept it after sign-up (instead of the create-store / plan flow).
     */
    public function create(Request $request): Response|RedirectResponse
    {
        InviteRedirect::captureFromIntended();
        GiftRedirect::captureFromIntended();

        // One signup path: a new business is created in the builder (modules,
        // defaults, plan, account — in that order). This plain form stays only
        // for people JOINING someone else's store via an invite or gift link.
        if (!InviteRedirect::has() && !GiftRedirect::has()) {
            return redirect()->route('workspace.build', array_filter([
                'email' => (string) $request->query('email', ''),
                'plan'  => (string) $request->query('plan', ''),
            ]));
        }

        return Inertia::render('Auth/Register');
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
            // AUTH-01: no `unique` rule here — an existing address gets the same
            // response as a new one, so this form cannot be used to discover
            // who has an account. Uniqueness is enforced again at activation.
            'email' => 'required|string|lowercase|email|max:255',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $email = strtolower(trim($request->email));

        // AUTH-03 (2026-09-10): public sign-up NEVER grants platform privileges.
        // The old "first user becomes Platform Owner" rule turned an empty or
        // restored database into a public admin-bootstrap. Create the owner with
        //   php artisan venqore:create-platform-owner
        if (!config('venqore.email_otp_required', true)) {
            if (User::withTrashed()->where('email', $email)->exists()) {
                return back()->withErrors(['email' => 'An account with this email already exists. Please sign in.']);
            }
            $user = User::create([
                'name' => $request->name,
                'email' => $email,
                'password' => Hash::make($request->password),
            ]);
            event(new Registered($user));
            Auth::login($user);
            $request->session()->regenerate();

            return $this->afterSignup();
        }

        // AUTH-01: nothing is created yet. The account exists only once the
        // emailed code is proven (EmailOtpController::completeSignup).
        if (User::withTrashed()->where('email', $email)->exists()) {
            // Decoy: same page, same wording, no email sent (protects the quota
            // and the address). Any code entered is simply "not correct".
            EmailOtpController::begin($request, 'decoy_' . \Illuminate\Support\Str::random(20), 'signup', [
                'decoy' => true,
                'display_email' => $email,
            ]);
            return redirect()->route('otp.show');
        }

        [$challenge, $error] = app(\App\Services\Auth\EmailOtpService::class)->start(
            $request,
            'signup',
            $email,
            null,
            ['name' => $request->name, 'password_hash' => Hash::make($request->password)]
        );

        if (!$challenge) {
            return back()->withErrors(['email' => $error]);
        }

        EmailOtpController::begin($request, $challenge->id, 'signup');

        return redirect()->route('otp.show');
    }

    private function afterSignup(): RedirectResponse
    {
        if ($redirect = InviteRedirect::pending()) {
            return $redirect;
        }
        if ($redirect = GiftRedirect::pending()) {
            return $redirect;
        }

        return redirect()->intended(route('hub', absolute: false));
    }
}
