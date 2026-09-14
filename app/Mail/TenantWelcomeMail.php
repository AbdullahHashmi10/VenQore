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
 * TenantWelcomeMail — Phase 2.4
 *
 * Sent immediately after successful tenant provisioning.
 * Contains: subdomain URL, login credentials, getting-started guide.
 *
 * This email sets the first impression of VenQore — make it excellent.
 */
class TenantWelcomeMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public string $loginUrl;
    public string $dashboardUrl;

    public function __construct(
        public readonly Tenant $tenant,
        public readonly User   $user,
        public readonly string $temporaryPassword
    ) {
        $baseUrl = rtrim(config('app.url', 'https://venqore.com'), '/');
        $this->loginUrl     = "{$baseUrl}/login";
        $this->dashboardUrl = "{$baseUrl}/s/{$tenant->slug}/dashboard";
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Welcome to VenQore — Your store is ready! 🎉",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tenant.welcome',
            with: [
                'tenant'            => $this->tenant,
                'user'              => $this->user,
                'temporaryPassword' => $this->temporaryPassword,
                'loginUrl'          => $this->loginUrl,
                'dashboardUrl'      => $this->dashboardUrl,
            ],
        );
    }
}
