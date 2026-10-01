<?php

namespace App\Mail;

use App\Models\ToolLead;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * ToolDeliveryMail — TRANSACTIONAL. Sends the artifact the visitor requested
 * from a /tools/* page.
 *
 * Sent for EVERY capture regardless of marketing_consent (plan §6.3 Track 1).
 * This is a solicited, requested delivery — not a marketing message — so it
 * is legally distinct from ToolConsentConfirmMail and must never be gated
 * on double opt-in confirmation.
 *
 * Still carries an unsubscribe footer (see emails.tools.delivery) because a
 * one-off transactional mail can still trigger a spam complaint if the
 * recipient has no visible way to signal "stop"; the footer here links to
 * the marketing unsubscribe for cleanliness, not because this send is
 * itself a marketing send.
 */
class ToolDeliveryMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * @param ToolLead $lead
     * @param string $toolName        Human-readable tool name, e.g. "Barcode Generator"
     * @param string|null $downloadUrl Signed temporary download URL, if the artifact
     *                                  is too large to attach (>2MB per plan §4.5)
     * @param string|null $attachmentPath Absolute path to a small file to attach directly
     * @param string|null $attachmentName
     */
    public function __construct(
        public readonly ToolLead $lead,
        public readonly string $toolName,
        public readonly ?string $downloadUrl = null,
        public readonly ?string $attachmentPath = null,
        public readonly ?string $attachmentName = null,
    ) {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your {$this->toolName} file from VenQore",
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.tools.delivery',
            with: [
                'lead'        => $this->lead,
                'toolName'    => $this->toolName,
                'downloadUrl' => $this->downloadUrl,
                'unsubscribeUrl' => route('tools.lead.unsubscribe', ['token' => $this->lead->unsubscribe_token]),
            ],
        );
    }

    public function attachments(): array
    {
        if (!$this->attachmentPath || !is_file($this->attachmentPath)) {
            return [];
        }

        return [
            Attachment::fromPath($this->attachmentPath)
                ->as($this->attachmentName ?? basename($this->attachmentPath)),
        ];
    }

    /**
     * List-Unsubscribe headers — required for Gmail/Yahoo bulk-sender rules
     * (plan §6.5). One-click unsubscribe via List-Unsubscribe-Post.
     */
    public function headers(): \Illuminate\Mail\Mailables\Headers
    {
        $unsubscribeUrl = route('tools.lead.unsubscribe', ['token' => $this->lead->unsubscribe_token]);

        return new \Illuminate\Mail\Mailables\Headers(
            text: [
                'List-Unsubscribe'      => "<{$unsubscribeUrl}>",
                'List-Unsubscribe-Post' => 'List-Unsubscribe=One-Click',
            ],
        );
    }
}
