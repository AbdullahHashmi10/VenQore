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
 * TrialExpiredMail — Phase 2.4
 *
 * Sent when the trial period ends without a subscription.
 * Data is preserved — this email reassures them and drives billing conversion.
 */
class TrialExpiredMail extends Mailable implements ShouldQueue
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
            subject: "Your VenQore trial has ended — your data is safe",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tenant.trial-expired',
            with: [
                'tenant'     => $this->tenant,
                'user'       => $this->user,
                'billingUrl' => $this->billingUrl,
            ],
        );
    }
}
