<?php

namespace App\Mail;

use App\Models\ContactSubmission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactSubmissionReceived extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public readonly ContactSubmission $submission)
    {
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            replyTo: [new Address($this->submission->email, $this->submission->name)],
            subject: $this->submission->subject ?: 'New VenQore contact submission',
        );
    }

    public function content(): Content
    {
        return new Content(
            markdown: 'emails.marketing.contact-submission-received',
            with: ['submission' => $this->submission],
        );
    }
}
