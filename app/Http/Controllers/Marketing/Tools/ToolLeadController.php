<?php

namespace App\Http\Controllers\Marketing\Tools;

use App\Http\Controllers\Controller;
use App\Services\Tools\ToolLeadService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * ToolLeadController — the shared email-capture endpoint for every gated
 * tool deliverable, plus the double opt-in confirm and unsubscribe links.
 *
 * Controller stays thin; all consent logic lives in ToolLeadService
 * (plan §4.4, §6.3). This controller must never write to ToolLead directly.
 */
class ToolLeadController extends Controller
{
    public function __construct(private readonly ToolLeadService $leads)
    {
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'email'             => ['required', 'email', 'max:255'],
            'name'              => ['nullable', 'string', 'max:255'],
            'company'           => ['nullable', 'string', 'max:255'],
            'tool_slug'         => ['required', 'string', 'max:100'],
            'tool_name'         => ['required', 'string', 'max:150'],
            'deliverable'       => ['nullable', 'string', 'max:100'],
            'context'           => ['nullable', 'array'],
            'marketing_consent' => ['nullable', 'boolean'],
            'download_url'      => ['nullable', 'string', 'max:2048'],
        ]);

        if ($this->leads->isDisposableDomain($validated['email'])) {
            return back()->withErrors(['email' => 'Please use a permanent email address.']);
        }

        $consentText = 'Also send me occasional retail and POS tips from VenQore. No spam, unsubscribe anytime.';

        $lead = $this->leads->capture([
            ...$validated,
            'country'      => $request->header('CF-IPCountry') ?? null,
            'referrer'     => $request->headers->get('referer'),
            'utm'          => $request->only(['utm_source', 'utm_medium', 'utm_campaign']),
            'ip'           => $request->ip(),
            'user_agent'   => $request->userAgent(),
            'consent_text' => $consentText,
        ]);

        return back()->with('success', "Check your email — we've sent your file.")
            ->with('tool_lead_id', $lead->id);
    }

    public function confirm(string $token)
    {
        $lead = $this->leads->confirm($token);

        return \Inertia\Inertia::render('Marketing/Tools/LeadConfirm', [
            'found'     => $lead !== null,
            'confirmed' => $lead?->confirmed_at !== null,
        ]);
    }

    public function unsubscribe(string $token)
    {
        return \Inertia\Inertia::render('Marketing/Tools/LeadUnsubscribe', [
            'token' => $token,
        ]);
    }

    public function unsubscribeConfirm(Request $request, string $token)
    {
        $lead = $this->leads->unsubscribe($token);

        return back()->with('success', $lead
            ? "You're unsubscribed. You won't receive any more marketing emails from VenQore."
            : 'This link is no longer valid.');
    }
}
