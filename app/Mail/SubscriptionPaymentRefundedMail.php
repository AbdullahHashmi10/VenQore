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
 * SubscriptionPaymentRefundedMail
 *
 * Sent when Lemon Squeezy reports a subscription payment refund
 * (`subscription_payment_refunded`). Access has already been suspended by
 * HandleSubscriptionPaymentRefundedJob by the time this sends — this tells
 * the admin why, and that a human decision is needed (reinstate if it was a
 * legitimate goodwill refund, or leave suspended if it was a chargeback).
 */
class SubscriptionPaymentRefundedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $billingUrl;

    public function __construct(
        public readonly Tenant $tenant,
        public readonly User   $user
    ) {
        $baseUrl          = rtrim(config('app.url', 'https://venqore.com'), '/');
        $this->billingUrl = "{$baseUrl}/s/{$tenant->slug}/billing";
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Action required: A subscription payment was refunded — access suspended",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tenant.subscription-payment-refunded',
            with: [
                'tenant'     => $this->tenant,
                'user'       => $this->user,
                'billingUrl' => $this->billingUrl,
            ],
        );
    }
}
