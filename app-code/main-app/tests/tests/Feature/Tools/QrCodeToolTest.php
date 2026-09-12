<?php

namespace Tests\Feature\Tools;

use App\Services\Tools\QrCodeService;
use Tests\TestCase;

/**
 * QrCodeToolTest — mirrors BarcodeToolTest's pattern.
 *
 * IMPORTANT: App\Services\Tools\QrCodeService::render() requires the
 * `endroid/qr-code` composer package, which is NOT installed as of writing
 * (see QrCodeService's top-of-file docblock). The render-endpoint tests
 * below defensively skip if the library class is missing, so this suite
 * stays green in an environment where the package hasn't been installed
 * yet, while still fully exercising it once `composer require
 * endroid/qr-code` has been run locally — matching the same defensive
 * judgment BarcodeService::supportsRaster() uses for GD/Imagick.
 *
 * The payload-building tests (WiFi/vCard/mailto/tel string formatting) have
 * no dependency on the QR library at all and always run.
 */
class QrCodeToolTest extends TestCase
{
    private function libraryInstalled(): bool
    {
        return class_exists(\Endroid\QrCode\Builder\Builder::class);
    }

    public function test_index_page_renders(): void
    {
        $this->get(route('tools.qr'))->assertOk();
    }

    // ── Payload building — no QR library dependency ────────────────────

    public function test_url_payload_adds_https_scheme_when_missing(): void
    {
        $service = new QrCodeService();
        $payload = $service->buildPayload('url', ['url' => 'example.com']);
        $this->assertSame('https://example.com', $payload);
    }

    public function test_url_payload_preserves_existing_scheme(): void
    {
        $service = new QrCodeService();
        $payload = $service->buildPayload('url', ['url' => 'http://example.com']);
        $this->assertSame('http://example.com', $payload);
    }

    public function test_text_payload_requires_non_empty_text(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new QrCodeService())->buildPayload('text', ['text' => '']);
    }

    public function test_wifi_payload_matches_standard_format(): void
    {
        $service = new QrCodeService();
        $payload = $service->buildPayload('wifi', [
            'ssid' => 'mynetwork',
            'password' => 'mypassword',
            'encryption' => 'WPA',
        ]);
        $this->assertSame('WIFI:T:WPA;S:mynetwork;P:mypassword;;', $payload);
    }

    public function test_wifi_payload_nopass_omits_password_segment(): void
    {
        $service = new QrCodeService();
        $payload = $service->buildPayload('wifi', [
            'ssid' => 'guestnet',
            'encryption' => 'nopass',
        ]);
        $this->assertSame('WIFI:T:nopass;S:guestnet;;', $payload);
    }

    public function test_wifi_payload_requires_password_unless_nopass(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new QrCodeService())->buildPayload('wifi', ['ssid' => 'mynetwork', 'encryption' => 'WPA']);
    }

    public function test_wifi_payload_escapes_special_characters(): void
    {
        $service = new QrCodeService();
        $payload = $service->buildPayload('wifi', [
            'ssid' => 'my;net,work',
            'password' => 'pa:ss"word',
            'encryption' => 'WPA',
        ]);
        $this->assertStringContainsString('S:my\\;net\\,work;', $payload);
        $this->assertStringContainsString('P:pa\\:ss\\"word;', $payload);
    }

    public function test_vcard_payload_is_valid_vcard_3_block(): void
    {
        $service = new QrCodeService();
        $payload = $service->buildPayload('vcard', [
            'name' => 'Jane Doe',
            'phone' => '+15551234567',
            'email' => 'jane@example.com',
            'company' => 'Acme Inc',
        ]);

        $this->assertStringStartsWith('BEGIN:VCARD', $payload);
        $this->assertStringContainsString('VERSION:3.0', $payload);
        $this->assertStringContainsString('FN:Jane Doe', $payload);
        $this->assertStringContainsString('N:Doe;Jane;;;', $payload);
        $this->assertStringContainsString('ORG:Acme Inc', $payload);
        $this->assertStringContainsString('TEL;TYPE=CELL:+15551234567', $payload);
        $this->assertStringContainsString('EMAIL:jane@example.com', $payload);
        $this->assertStringEndsWith('END:VCARD', $payload);
    }

    public function test_vcard_payload_requires_name(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new QrCodeService())->buildPayload('vcard', []);
    }

    public function test_email_payload_builds_mailto_with_subject_and_body(): void
    {
        $service = new QrCodeService();
        $payload = $service->buildPayload('email', [
            'address' => 'test@example.com',
            'subject' => 'Hello',
            'body' => 'World',
        ]);
        $this->assertStringStartsWith('mailto:test@example.com?', $payload);
        $this->assertStringContainsString('subject=Hello', $payload);
        $this->assertStringContainsString('body=World', $payload);
    }

    public function test_email_payload_rejects_invalid_address(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new QrCodeService())->buildPayload('email', ['address' => 'not-an-email']);
    }

    public function test_phone_payload_builds_tel_uri(): void
    {
        $service = new QrCodeService();
        $payload = $service->buildPayload('phone', ['number' => '+1 (555) 123-4567']);
        $this->assertSame('tel:+15551234567', $payload);
    }

    public function test_unknown_type_is_rejected(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        (new QrCodeService())->buildPayload('not-a-type', []);
    }

    // ── Render endpoint — requires endroid/qr-code, skips gracefully ───

    public function test_render_produces_a_png_for_a_url(): void
    {
        if (!$this->libraryInstalled()) {
            $this->markTestSkipped('endroid/qr-code is not installed — run `composer require endroid/qr-code` locally to exercise this test.');
        }

        $response = $this->postJson(route('tools.qr.render'), [
            'type'   => 'url',
            'fields' => ['url' => 'https://venqore.com'],
            'output' => 'png',
        ]);

        $response->assertOk();
        $response->assertJsonStructure(['image_base64', 'mime_type', 'file_extension', 'actual_format', 'format_downgraded']);
        $this->assertNotEmpty($response->json('image_base64'));
    }

    public function test_render_svg_output(): void
    {
        if (!$this->libraryInstalled()) {
            $this->markTestSkipped('endroid/qr-code is not installed — run `composer require endroid/qr-code` locally to exercise this test.');
        }

        $response = $this->postJson(route('tools.qr.render'), [
            'type'   => 'text',
            'fields' => ['text' => 'Hello World'],
            'output' => 'svg',
        ]);

        $response->assertOk();
        $this->assertSame('image/svg+xml', $response->json('mime_type'));
        $this->assertSame('svg', $response->json('file_extension'));
    }

    public function test_render_rejects_invalid_type(): void
    {
        $response = $this->postJson(route('tools.qr.render'), [
            'type'   => 'not-a-real-type',
            'fields' => [],
            'output' => 'png',
        ]);

        $response->assertStatus(422);
    }

    public function test_render_returns_inline_error_for_empty_url_not_500(): void
    {
        if (!$this->libraryInstalled()) {
            $this->markTestSkipped('endroid/qr-code is not installed — run `composer require endroid/qr-code` locally to exercise this test.');
        }

        $response = $this->postJson(route('tools.qr.render'), [
            'type'   => 'url',
            'fields' => ['url' => ''],
            'output' => 'png',
        ]);

        $response->assertStatus(422);
        $response->assertJsonStructure(['errors']);
    }

    public function test_qr_generation_requires_no_email(): void
    {
        if (!$this->libraryInstalled()) {
            $this->markTestSkipped('endroid/qr-code is not installed — run `composer require endroid/qr-code` locally to exercise this test.');
        }

        $response = $this->postJson(route('tools.qr.render'), [
            'type'   => 'text',
            'fields' => ['text' => 'FREE-NO-EMAIL'],
            'output' => 'png',
        ]);

        $response->assertOk();
        $this->assertDatabaseCount('tool_leads', 0);
    }
}
