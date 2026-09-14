<?php

namespace App\Mail;

use App\Models\ToolLead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

/**
 * ToolConsentConfirmMail — the double opt-in confirmation.
 *
 * Sent ONLY when marketing_consent = true (plan §6.3 Track 2). Single CTA,
 * no product pitch. Clicking the confirm link sets confirmed_at and moves
 * status to 'confirmed' — only then does the lead become eligible for
 * promotional sends (see ToolLead::isMarketingEligible()).
 *
 * Approved copy — do not reword without review (plan §15.2).
 */
class ToolConsentConfirmMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly ToolLead $lead,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Confirm you want retail tips from VenQore',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tools.consent-confirm',
            with: [
                'lead'           => $this->lead,
                'confirmUrl'     => route('tools.lead.confirm', ['token' => $this->lead->confirm_token]),
                'unsubscribeUrl' => route('tools.lead.unsubscribe', ['token' => $this->lead->unsubscribe_token]),
            ],
        );
    }

    public function headers(): Headers
    {
        $unsubscribeUrl = route('tools.lead.unsubscribe', ['token' => $this->lead->unsubscribe_token]);

        return new Headers(
            text: [
                'List-Unsubscribe'      => "<{$unsubscribeUrl}>",
                'List-Unsubscribe-Post' => 'List-Unsubscribe=One-Click',
            ],
        );
    }
}
