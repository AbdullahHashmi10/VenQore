<?php

namespace Tests\Feature;

use App\Models\ContactSubmission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * PartnersPageTest — RECONSTRUCTED 2026-08-02.
 *
 * Original deleted during Batch 1/2 cleanup, never committed to git. The three
 * method names were recovered from the run ledger and reimplemented against
 * PartnersPublicController.
 *
 * The submission test writes a row, so unlike the other reconstructed
 * marketing tests this one needs RefreshDatabase — a bare
 * assertDatabaseHas/Count without isolation is exactly the bug that made
 * ToolLeadCaptureTest and ReceiptToolTest fail earlier in this cleanup.
 */
class PartnersPageTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function partners_page_renders_successfully_with_ssr()
    {
        config(['inertia.ssr.enabled' => false]);

        $response = $this->get('/partners');

        $response->assertStatus(200);
        $this->assertTrue(
            config('inertia.ssr.enabled'),
            'Expected Inertia SSR to be enabled for /partners'
        );
        $response->assertInertia(fn ($page) => $page->component('Marketing/Partners'));
    }

    /** @test */
    public function partners_page_is_included_in_sitemap()
    {
        $response = $this->get('/sitemap-pages.xml');

        $response->assertStatus(200);
        $response->assertSee('/partners', false);
    }

    /**
     * A partnership enquiry is a sales lead. If the write silently fails the
     * lead is lost with no trace, so this asserts the row lands with the
     * correct source and subject prefix that PartnersPublicController sets.
     *
     * @test
     */
    public function partnership_inquiry_submission_stores_to_database()
    {
        Mail::fake();

        $payload = [
            'name'             => 'Aisha Khan',
            'email'            => 'aisha@example-partner.test',
            'company'          => 'Khan Distribution',
            'partnership_type' => 'Reseller',
            'message'          => 'We would like to resell VenQore across Punjab.',
        ];

        $response = $this->post('/partners-submit', $payload);

        $response->assertRedirect();

        $this->assertDatabaseHas('contact_submissions', [
            'name'    => 'Aisha Khan',
            'email'   => 'aisha@example-partner.test',
            'company' => 'Khan Distribution',
            'subject' => 'Partnership Inquiry: Reseller',
            'source'  => 'partners_page',
        ]);

        $submission = ContactSubmission::where('email', 'aisha@example-partner.test')->first();

        $this->assertNotNull($submission, 'Partnership enquiry was not persisted.');
        $this->assertNotEmpty($submission->ip_address, 'IP address is recorded for abuse tracing.');
    }

    /** @test */
    public function partnership_inquiry_rejects_incomplete_submissions()
    {
        // ADDED during reconstruction. The controller validates five required
        // fields; nothing asserted that validation actually fires, so a
        // regression that dropped the rules would have gone unnoticed.
        Mail::fake();

        $this->post('/partners-submit', ['name' => 'Only A Name'])
            ->assertSessionHasErrors(['email', 'company', 'partnership_type', 'message']);

        $this->assertDatabaseCount('contact_submissions', 0);
    }
}
