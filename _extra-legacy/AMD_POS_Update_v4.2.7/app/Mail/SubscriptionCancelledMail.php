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
 * SubscriptionCancelledMail — Phase 2.4
 *
 * Sent when a customer requests cancellation.
 * Clarifies they'll retain access until period end and mentions data export.
 */
class SubscriptionCancelledMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Tenant $tenant,
        public readonly User   $user
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your VenQore cancellation is confirmed",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tenant.subscription-cancelled',
            with: [
                'tenant'  => $this->tenant,
                'user'    => $this->user,
                'endsAt'  => $this->tenant->subscription_ends_at?->format('F j, Y') ?? 'soon',
            ],
        );
    }
}
