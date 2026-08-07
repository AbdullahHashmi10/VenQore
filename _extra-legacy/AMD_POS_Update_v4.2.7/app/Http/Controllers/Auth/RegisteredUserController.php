<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\InviteRedirect;
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
    public function create(Request $request): Response
    {
        InviteRedirect::captureFromIntended();

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

        // Invited users go straight to accepting their invite — no plan, no store.
        if ($redirect = InviteRedirect::pending()) {
            return $redirect;
        }

        // Otherwise, off to the Hub to create or join their first store.
        // (Plan selection happens later, only if they create a store of their own.)
        return redirect()->intended(route('hub', absolute: false));
    }
}
