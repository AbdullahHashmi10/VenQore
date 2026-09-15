<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * OrderRefundNeedsReviewMail
 *
 * Sent to the ops inbox (config('mail.notifications.contact')) by HandleOrderRefundedJob
 * for any refunded one-time order this app cannot safely auto-reverse: a
 * lifetime-deal signup, a seat/location/register/catalogue add-on, a channel
 * sync add-on, or the upload service. No tenant state has been changed —
 * this is purely a "please look at this" notice.
 */
class OrderRefundNeedsReviewMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /** @param array<string, mixed> $context */
    public function __construct(public readonly array $context) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Order refund needs manual review (Lemon Squeezy)',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.ops.order-refund-needs-review',
            with: ['context' => $this->context],
        );
    }
}
