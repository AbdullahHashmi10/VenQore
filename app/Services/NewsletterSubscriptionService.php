<?php

namespace App\Services;

use App\Mail\NewsletterConsentConfirmMail;
use App\Models\EmailSuppression;
use App\Models\NewsletterSubscriber;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class NewsletterSubscriptionService
{
    public function requestSubscription(array $data): ?NewsletterSubscriber
    {
        $email = strtolower(trim($data['email']));
        $subscriber = NewsletterSubscriber::where('email', $email)->first();

        // Repeated submissions must reveal nothing and must not let a third
        // party demote or repeatedly message an already-confirmed subscriber.
        if ($subscriber?->status === 'subscribed' && $subscriber->confirmed_at) {
            return $subscriber;
        }

        EmailSuppression::liftIfUnsubscribed($email);
        if (EmailSuppression::isSuppressed($email)) {
            return $subscriber;
        }

        $subscriber = NewsletterSubscriber::updateOrCreate(
            ['email' => $email],
            [
                'name' => $data['name'] ?? null,
                'interest' => $data['interest'] ?? 'cloud',
                'status' => 'pending',
                'confirmation_token' => Str::random(64),
                'unsubscribe_token' => $subscriber?->unsubscribe_token ?: Str::random(64),
                'confirmed_at' => null,
                'unsubscribed_at' => null,
                'consent_ip' => null,
            ],
        );

        try {
            Mail::to($subscriber->email)->queue(new NewsletterConsentConfirmMail($subscriber));
        } catch (\Throwable $e) {
            report($e);
        }

        return $subscriber->refresh();
    }

    public function confirm(string $token, ?string $ip): ?NewsletterSubscriber
    {
        $subscriber = NewsletterSubscriber::where('confirmation_token', $token)->first();
        if (! $subscriber || ($subscriber->status === 'subscribed' && $subscriber->confirmed_at)) {
            return $subscriber;
        }

        $subscriber->forceFill([
            'status' => 'subscribed',
            'confirmed_at' => now(),
            'unsubscribed_at' => null,
            'consent_ip' => $ip,
        ])->save();

        EmailSuppression::liftIfUnsubscribed($subscriber->email);

        return $subscriber->refresh();
    }

    public function unsubscribe(string $token): ?NewsletterSubscriber
    {
        $subscriber = NewsletterSubscriber::where('unsubscribe_token', $token)->first();
        if (! $subscriber) {
            return null;
        }

        $subscriber->forceFill([
            'status' => 'unsubscribed',
            'unsubscribed_at' => now(),
        ])->save();

        EmailSuppression::suppress($subscriber->email, 'unsubscribed', 'newsletter.unsubscribe');

        return $subscriber->refresh();
    }
}
