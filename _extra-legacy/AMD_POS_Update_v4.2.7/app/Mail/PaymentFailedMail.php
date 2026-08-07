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
 * PaymentFailedMail — Phase 2.4
 *
 * Sent when Lemon Squeezy reports a payment failure.
 * Does NOT suspend access — gives the user a chance to update billing.
 */
class PaymentFailedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $billingUrl;

    public function __construct(
        public readonly Tenant $tenant,
        public readonly User   $user
    ) {
        $domain           = config('app.domain', 'venqore.com');
        $this->billingUrl = "https://{$tenant->subdomain}.{$domain}/billing";
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Action required: Payment failed for your VenQore subscription",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tenant.payment-failed',
            with: [
                'tenant'     => $this->tenant,
                'user'       => $this->user,
                'billingUrl' => $this->billingUrl,
            ],
        );
    }
}
