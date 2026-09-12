<?php

namespace Tests\Feature\Marketing;

use App\Mail\NewsletterConsentConfirmMail;
use App\Models\NewsletterSubscriber;
use App\Services\NewsletterSubscriptionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class NewsletterSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function it_initiates_double_opt_in_with_pending_status(): void
    {
        Mail::fake();

        $service = new NewsletterSubscriptionService();
        $subscriber = $service->requestSubscription([
            'email' => 'subscriber@example.com',
            'name' => 'Jane Doe',
            'interest' => 'cloud',
        ]);

        $this->assertNotNull($subscriber);
        $this->assertEquals('pending', $subscriber->status);
        $this->assertNotNull($subscriber->confirmation_token);
        $this->assertNull($subscriber->confirmed_at);

        Mail::assertQueued(NewsletterConsentConfirmMail::class, function ($mail) {
            return $mail->hasTo('subscriber@example.com');
        });
    }

    #[Test]
    public function it_confirms_subscription_with_valid_token(): void
    {
        $subscriber = NewsletterSubscriber::create([
            'email' => 'confirm@example.com',
            'status' => 'pending',
            'confirmation_token' => 'test-confirm-token-12345',
            'unsubscribe_token' => 'test-unsub-token-12345',
        ]);

        $service = new NewsletterSubscriptionService();
        $confirmed = $service->confirm('test-confirm-token-12345', '127.0.0.1');

        $this->assertNotNull($confirmed);
        $this->assertEquals('subscribed', $confirmed->status);
        $this->assertNotNull($confirmed->confirmed_at);
        $this->assertEquals('127.0.0.1', $confirmed->consent_ip);
    }

    #[Test]
    public function it_unsubscribes_with_valid_token(): void
    {
        $subscriber = NewsletterSubscriber::create([
            'email' => 'unsub@example.com',
            'status' => 'subscribed',
            'confirmed_at' => now(),
            'unsubscribe_token' => 'test-unsub-token-67890',
        ]);

        $service = new NewsletterSubscriptionService();
        $unsubscribed = $service->unsubscribe('test-unsub-token-67890');

        $this->assertNotNull($unsubscribed);
        $this->assertEquals('unsubscribed', $unsubscribed->status);
        $this->assertNotNull($unsubscribed->unsubscribed_at);
    }
}
