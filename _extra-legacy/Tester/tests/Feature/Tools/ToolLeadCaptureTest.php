<?php

namespace Tests\Feature\Tools;

use App\Mail\ToolConsentConfirmMail;
use App\Mail\ToolDeliveryMail;
use App\Models\EmailSuppression;
use App\Models\ToolLead;
use App\Services\Tools\ToolLeadService;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * ToolLeadCaptureTest — encodes the legal consent position in executable
 * form (plan §11.2). If someone later "simplifies" the consent flow, these
 * tests should break. Do not weaken these assertions without a plan update
 * and, per plan §6.6, counsel review.
 */
class ToolLeadCaptureTest extends TestCase
{
    use \Illuminate\Foundation\Testing\RefreshDatabase;
    private function baseData(array $overrides = []): array
    {
        return array_merge([
            'email'     => 'shopowner@example.com',
            'tool_slug' => 'barcode',
            'tool_name' => 'Barcode Generator',
        ], $overrides);
    }

    public function test_delivery_mail_is_queued_even_when_marketing_consent_is_false(): void
    {
        Mail::fake();

        (new ToolLeadService())->capture($this->baseData(['marketing_consent' => false]));

        Mail::assertQueued(ToolDeliveryMail::class);
    }

    public function test_confirm_mail_is_not_queued_when_marketing_consent_is_false(): void
    {
        Mail::fake();

        (new ToolLeadService())->capture($this->baseData(['marketing_consent' => false]));

        Mail::assertNotQueued(ToolConsentConfirmMail::class);
    }

    public function test_confirm_mail_is_queued_when_marketing_consent_is_true(): void
    {
        Mail::fake();

        (new ToolLeadService())->capture($this->baseData(['marketing_consent' => true, 'consent_text' => 'test']));

        Mail::assertQueued(ToolConsentConfirmMail::class);
        Mail::assertQueued(ToolDeliveryMail::class); // both tracks fire
    }

    public function test_pending_lead_is_excluded_from_marketing_eligibility(): void
    {
        Mail::fake();

        $lead = (new ToolLeadService())->capture($this->baseData(['marketing_consent' => true, 'consent_text' => 'test']));

        $this->assertSame('pending', $lead->status);
        $this->assertFalse($lead->isMarketingEligible());
    }

    public function test_lead_becomes_marketing_eligible_only_after_confirm_click(): void
    {
        Mail::fake();

        $service = new ToolLeadService();
        $lead = $service->capture($this->baseData(['marketing_consent' => true, 'consent_text' => 'test']));

        $this->assertFalse($lead->isMarketingEligible());

        $confirmed = $service->confirm($lead->confirm_token);

        $this->assertNotNull($confirmed->confirmed_at);
        $this->assertSame('confirmed', $confirmed->status);
        $this->assertTrue($confirmed->isMarketingEligible());
    }

    public function test_suppressed_email_never_receives_confirm_mail_but_still_receives_delivery(): void
    {
        Mail::fake();
        EmailSuppression::suppress('blocked@example.com', 'unsubscribed', 'test');

        (new ToolLeadService())->capture($this->baseData([
            'email' => 'blocked@example.com',
            'marketing_consent' => true,
            'consent_text' => 'test',
        ]));

        Mail::assertQueued(ToolDeliveryMail::class);
        Mail::assertNotQueued(ToolConsentConfirmMail::class);
    }

    public function test_consent_metadata_populated_only_when_consent_given(): void
    {
        Mail::fake();
        $service = new ToolLeadService();

        $withConsent = $service->capture($this->baseData([
            'email' => 'with-consent@example.com',
            'marketing_consent' => true,
            'consent_text' => 'Also send me occasional retail and POS tips from VenQore.',
            'ip' => '203.0.113.5',
            'user_agent' => 'PHPUnit-Test-Agent',
        ]));

        $this->assertNotNull($withConsent->consent_ip);
        $this->assertNotNull($withConsent->consent_user_agent);
        $this->assertNotNull($withConsent->consent_at);
        $this->assertNotNull($withConsent->consent_text_hash);
        $this->assertSame(
            hash('sha256', 'Also send me occasional retail and POS tips from VenQore.'),
            $withConsent->consent_text_hash
        );

        $withoutConsent = $service->capture($this->baseData([
            'email' => 'without-consent@example.com',
            'marketing_consent' => false,
            'ip' => '203.0.113.6',
            'user_agent' => 'PHPUnit-Test-Agent',
        ]));

        $this->assertNull($withoutConsent->consent_ip);
        $this->assertNull($withoutConsent->consent_user_agent);
        $this->assertNull($withoutConsent->consent_at);
        $this->assertNull($withoutConsent->consent_text_hash);
    }

    public function test_unsubscribe_writes_global_suppression_and_is_honoured_across_leads(): void
    {
        Mail::fake();
        $service = new ToolLeadService();

        $lead = $service->capture($this->baseData([
            'email' => 'will-unsub@example.com',
            'marketing_consent' => true,
            'consent_text' => 'test',
        ]));
        $service->confirm($lead->confirm_token);

        $unsubscribed = $service->unsubscribe($lead->unsubscribe_token);

        $this->assertSame('unsubscribed', $unsubscribed->status);
        $this->assertNotNull($unsubscribed->unsubscribed_at);
        $this->assertTrue(EmailSuppression::isSuppressed('will-unsub@example.com'));

        // A second capture with the same (now-suppressed) email must not
        // be offered marketing consent even if the checkbox is ticked again.
        Mail::fake();
        $secondLead = $service->capture($this->baseData([
            'email' => 'will-unsub@example.com',
            'tool_slug' => 'invoice',
            'tool_name' => 'Invoice Generator',
            'marketing_consent' => true,
            'consent_text' => 'test',
        ]));

        $this->assertFalse($secondLead->marketing_consent);
        Mail::assertQueued(ToolDeliveryMail::class); // still gets the file
        Mail::assertNotQueued(ToolConsentConfirmMail::class);
    }

    public function test_every_capture_writes_a_captured_event(): void
    {
        Mail::fake();

        $lead = (new ToolLeadService())->capture($this->baseData());

        $this->assertDatabaseHas('tool_lead_events', [
            'tool_lead_id' => $lead->id,
            'event' => 'captured',
        ]);
        $this->assertDatabaseHas('tool_lead_events', [
            'tool_lead_id' => $lead->id,
            'event' => 'delivery_sent',
        ]);
    }

    public function test_disposable_email_domain_is_detected(): void
    {
        $service = new ToolLeadService();

        $this->assertTrue($service->isDisposableDomain('someone@mailinator.com'));
        $this->assertFalse($service->isDisposableDomain('someone@gmail.com'));
    }

    public function test_disposable_email_is_rejected_at_the_controller(): void
    {
        $response = $this->post('/tools/lead', [
            'email' => 'test@mailinator.com',
            'tool_slug' => 'barcode',
            'tool_name' => 'Barcode Generator',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertDatabaseMissing('tool_leads', ['email' => 'test@mailinator.com']);
    }
}
