<?php

namespace App\Http\Controllers\Marketing;

use App\Http\Controllers\Controller;
use App\Services\NewsletterSubscriptionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NewsletterController extends Controller
{
    public function __construct(private readonly NewsletterSubscriptionService $subscriptions)
    {
    }

    public function index()
    {
        return Inertia::render('Marketing/Newsletter');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'email'    => ['required', 'email', 'max:255'],
            'name'     => ['nullable', 'string', 'max:255'],
            'interest' => ['nullable', 'string', 'in:cloud,digital,both'],
        ]);

        $this->subscriptions->requestSubscription([
            ...$validated,
            'interest' => $validated['interest'] ?? 'cloud',
        ]);

        return back()->with('success', 'Check your email to confirm your subscription.');
    }

    public function confirm(Request $request, string $token)
    {
        $subscriber = $this->subscriptions->confirm($token, $request->ip());

        return Inertia::render('Marketing/NewsletterConfirm', [
            'found' => $subscriber !== null,
            'confirmed' => $subscriber?->confirmed_at !== null,
        ]);
    }

    public function unsubscribe(string $token)
    {
        return Inertia::render('Marketing/NewsletterUnsubscribe', ['token' => $token]);
    }

    public function unsubscribeConfirm(string $token)
    {
        $subscriber = $this->subscriptions->unsubscribe($token);

        return back()->with('success', $subscriber
            ? "You're unsubscribed. You won't receive newsletter emails from VenQore."
            : 'This link is no longer valid.');
    }
}
