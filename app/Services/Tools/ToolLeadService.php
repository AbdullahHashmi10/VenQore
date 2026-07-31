<?php

namespace App\Services\Tools;

use App\Mail\ToolConsentConfirmMail;
use App\Mail\ToolDeliveryMail;
use App\Models\EmailSuppression;
use App\Models\ToolLead;
use App\Models\ToolLeadEvent;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * ToolLeadService — the single entry point for capturing a tools email lead.
 *
 * Controllers MUST NOT write to ToolLead directly. See
 * SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md §4.4 and §6.3
 * for the two-track model this implements:
 *
 *   Track 1 (ALWAYS): the artifact they asked for is delivered by email,
 *                      regardless of the marketing checkbox. This is a
 *                      transactional, solicited send.
 *   Track 2 (ONLY IF marketing_consent === true): a separate double
 *                      opt-in confirmation is sent. Only a click on that
 *                      link makes the lead marketing-eligible.
 *
 * These two tracks must never be merged. Track 1 must never wait on
 * Track 2's confirmation — that would hold the user's requested file
 * hostage to a permission they never needed to give it.
 */
class ToolLeadService
{
    /**
     * A conservative, deliberately short list of disposable-email domains.
     * Lookup fails open: if we can't tell, we don't block. Extend this list
     * as abuse is observed rather than trying to be exhaustive up front.
     */
    private const DISPOSABLE_DOMAINS = [
        'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', '10minutemail.com',
        'tempmail.com', 'temp-mail.org', 'throwawaymail.com', 'yopmail.com',
        'trashmail.com', 'getnada.com', 'sharklasers.com', 'dispostable.com',
    ];

    /**
     * @param array{
     *   email:string, name?:string, company?:string,
     *   tool_slug:string, deliverable?:string, context?:array,
     *   country?:string, referrer?:string, utm?:array,
     *   marketing_consent?:bool, consent_text?:string,
     *   ip?:string, user_agent?:string,
     *   tool_name:string,
     *   download_url?:string, attachment_path?:string, attachment_name?:string,
     * } $data
     */
    public function capture(array $data): ToolLead
    {
        $email = strtolower(trim($data['email']));
        $marketingConsent = (bool) ($data['marketing_consent'] ?? false);
        $suppressed = EmailSuppression::isSuppressed($email);

        // Suppressed addresses still get the file they asked for (it is a
        // service they requested) but are NEVER offered marketing consent,
        // regardless of what the checkbox said.
        if ($suppressed) {
            $marketingConsent = false;
        }

        $lead = ToolLead::create([
            'email'       => $email,
            'name'        => $data['name'] ?? null,
            'company'     => $data['company'] ?? null,
            'tool_slug'   => $data['tool_slug'],
            'deliverable' => $data['deliverable'] ?? null,
            'context'     => $data['context'] ?? null,
            'country'     => $data['country'] ?? null,
            'referrer'    => $data['referrer'] ?? null,
            'utm'         => $data['utm'] ?? null,

            'marketing_consent'  => $marketingConsent,
            'consent_text_hash'  => $marketingConsent ? hash('sha256', (string) ($data['consent_text'] ?? '')) : null,
            'consent_ip'         => $marketingConsent ? ($data['ip'] ?? null) : null,
            'consent_user_agent' => $marketingConsent ? ($data['user_agent'] ?? null) : null,
            'consent_at'         => $marketingConsent ? now() : null,

            'confirm_token'      => $marketingConsent ? Str::random(64) : null,
            'status'             => 'pending',
            'unsubscribe_token'  => Str::random(64),
        ]);

        $this->logEvent($lead, 'captured', $data, [
            'suppressed_at_capture' => $suppressed,
            'requested_consent'     => (bool) ($data['marketing_consent'] ?? false),
        ]);

        // Track 1 — ALWAYS. Not gated on consent, not gated on confirmation.
        Mail::to($lead->email)->queue(new ToolDeliveryMail(
            lead: $lead,
            toolName: $data['tool_name'],
            downloadUrl: $data['download_url'] ?? null,
            attachmentPath: $data['attachment_path'] ?? null,
            attachmentName: $data['attachment_name'] ?? null,
        ));
        $this->logEvent($lead, 'delivery_sent', $data);

        // Track 2 — only if consent was given and the address isn't suppressed.
        if ($marketingConsent) {
            $lead->forceFill(['confirm_sent_at' => now()])->save();
            Mail::to($lead->email)->queue(new ToolConsentConfirmMail(lead: $lead));
            $this->logEvent($lead, 'confirm_sent', $data);
        }

        return $lead->refresh();
    }

    /**
     * Handle a click on the double opt-in confirmation link.
     */
    public function confirm(string $token): ?ToolLead
    {
        $lead = ToolLead::where('confirm_token', $token)->first();
        if (!$lead || $lead->confirmed_at) {
            return $lead;
        }

        $lead->forceFill([
            'confirmed_at' => now(),
            'status'       => 'confirmed',
        ])->save();

        $this->logEvent($lead, 'confirmed', []);

        return $lead;
    }

    /**
     * Handle an unsubscribe — global, across tools AND the newsletter list
     * (plan §6.5). This is the only place that should write to
     * email_suppressions for a self-service unsubscribe.
     */
    public function unsubscribe(string $token): ?ToolLead
    {
        $lead = ToolLead::where('unsubscribe_token', $token)->first();
        if (!$lead) {
            return null;
        }

        $lead->forceFill([
            'status'           => 'unsubscribed',
            'unsubscribed_at'  => now(),
        ])->save();

        EmailSuppression::suppress($lead->email, 'unsubscribed', 'tools.lead.unsubscribe');
        $this->logEvent($lead, 'unsubscribed', []);

        return $lead;
    }

    public function isDisposableDomain(string $email): bool
    {
        $domain = strtolower(substr(strrchr($email, '@') ?: '', 1));
        if ($domain === '') {
            return false; // fail open — malformed email is caught by validation upstream
        }

        return in_array($domain, self::DISPOSABLE_DOMAINS, true);
    }

    private function logEvent(ToolLead $lead, string $event, array $requestData, array $extraMeta = []): void
    {
        ToolLeadEvent::create([
            'tool_lead_id' => $lead->id,
            'event'        => $event,
            'ip'           => $requestData['ip'] ?? null,
            'user_agent'   => $requestData['user_agent'] ?? null,
            'meta'         => empty($extraMeta) ? null : $extraMeta,
        ]);
    }
}
