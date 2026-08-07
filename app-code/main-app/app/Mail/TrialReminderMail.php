<?php

namespace App\Mail;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * TrialReminderMail — Phase 2.4
 *
 * Sent at day 7 and day 12 of a 14-day trial.
 * Urgency increases as the trial end approaches.
 */
class TrialReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $billingUrl;
    public int    $daysLeft;

    public function __construct(
        public readonly Tenant $tenant,
        public readonly User   $user,
        int $daysLeft
    ) {
        $baseUrl          = rtrim(config('app.url', 'https://venqore.com'), '/');
        $this->daysLeft   = $daysLeft;
        $this->billingUrl = "{$baseUrl}/s/{$tenant->slug}/billing";
    }

    public function envelope(): Envelope
    {
        $urgency = $this->daysLeft <= 2 ? '⚠️ ' : '';
        return new Envelope(
            subject: "{$urgency}Your VenQore trial ends in {$this->daysLeft} day" . ($this->daysLeft === 1 ? '' : 's'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tenant.trial-reminder',
            with: [
                'tenant'     => $this->tenant,
                'user'       => $this->user,
                'daysLeft'   => $this->daysLeft,
                'billingUrl' => $this->billingUrl,
            ],
        );
    }
}
