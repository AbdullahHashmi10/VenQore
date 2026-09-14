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
 * SubscriptionExpiryReminderMail — Gift Access Links / subscription expiry
 *
 * Sent at 7 and 2 days before subscription_ends_at. Mirrors
 * TrialReminderMail's structure exactly for a subscription/gift date
 * instead of a trial date.
 */
class SubscriptionExpiryReminderMail extends Mailable implements ShouldQueue
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
            subject: "{$urgency}Your VenQore access ends in {$this->daysLeft} day" . ($this->daysLeft === 1 ? '' : 's'),
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tenant.subscription-expiry-reminder',
            with: [
                'tenant'     => $this->tenant,
                'user'       => $this->user,
                'daysLeft'   => $this->daysLeft,
                'billingUrl' => $this->billingUrl,
                'endsAt'     => $this->tenant->subscription_ends_at?->format('F j, Y') ?? 'soon',
            ],
        );
    }
}
