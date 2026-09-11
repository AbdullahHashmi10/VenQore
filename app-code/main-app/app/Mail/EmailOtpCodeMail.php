<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldBeEncrypted;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * AUTH-01: the 6-digit sign-in / sign-up code.
 *
 * ShouldBeEncrypted: the queued job necessarily contains the code, so the
 * payload in the `jobs` table is encrypted with the app key.
 */
class EmailOtpCodeMail extends Mailable implements ShouldQueue, ShouldBeEncrypted
{
    use Queueable, SerializesModels;

    /** Retry briefly; a code older than its expiry is useless anyway. */
    public int $tries = 3;
    public array $backoff = [5, 20];

    public function __construct(
        public readonly string $code,
        public readonly string $purpose,
        public readonly int $minutes,
        public readonly ?string $challengeId = null,
    ) {}

    /**
     * Queue delays can outlive a code. At send time, drop the email if its
     * challenge was used, replaced by a newer code, or has expired.
     */
    public function send($mailer)
    {
        if ($this->challengeId !== null && !$this->isStillValid()) {
            return null;
        }

        return parent::send($mailer);
    }

    public function isStillValid(): bool
    {
        $challenge = \App\Models\EmailOtpChallenge::find($this->challengeId);

        return $challenge
            && $challenge->consumed_at === null
            && $challenge->expires_at !== null && $challenge->expires_at->isFuture()
            && hash_equals((string) $challenge->code_hash, \App\Services\Auth\EmailOtpService::codeHash($this->code));
    }

    public function envelope(): Envelope
    {
        $subject = match ($this->purpose) {
            'signup'      => 'Your VenQore sign-up code: ' . $this->code,
            'link_google' => 'Confirm linking Google to your VenQore account',
            default       => 'Your VenQore sign-in code: ' . $this->code,
        };

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.auth.otp-code');
    }
}
