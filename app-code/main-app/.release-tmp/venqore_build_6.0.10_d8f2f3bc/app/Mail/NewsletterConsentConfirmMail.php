<?php

namespace App\Mail;

use App\Models\NewsletterSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Mail\Mailables\Headers;
use Illuminate\Queue\SerializesModels;

class NewsletterConsentConfirmMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(public readonly NewsletterSubscriber $subscriber)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Confirm your VenQore newsletter subscription');
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.marketing.newsletter-consent-confirm',
            with: [
                'subscriber' => $this->subscriber,
                'confirmUrl' => route('marketing.newsletter.confirm', ['token' => $this->subscriber->confirmation_token]),
                'unsubscribeUrl' => route('marketing.newsletter.unsubscribe', ['token' => $this->subscriber->unsubscribe_token]),
            ],
        );
    }

    public function headers(): Headers
    {
        return new Headers(text: [
            'List-Unsubscribe' => '<'.route('marketing.newsletter.unsubscribe', [
                'token' => $this->subscriber->unsubscribe_token,
            ]).'>',
        ]);
    }
}
