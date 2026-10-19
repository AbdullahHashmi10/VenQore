<?php

use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Tests\Feature\VenQoreTestCase;

uses(VenQoreTestCase::class);

/*
 * Live request (2026-10-18): phone must be required at signup, and whatever
 * the owner types (phone + address) must be saved once, not asked again.
 */

test('signup is refused without a phone number', function () {
    $response = $this->postJson('/workspace/provision', [
        'business_name' => 'No Phone Store',
        'email'         => 'no-phone-' . \Illuminate\Support\Str::random(8) . '@example.test',
        'password'      => 'password123',
        'modules'       => ['products', 'pos'],
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('phone');
});

test('phone and address given at signup are saved on the new store', function () {
    Mail::fake();
    $email = 'with-contact-' . \Illuminate\Support\Str::random(8) . '@example.test';

    $this->postJson('/workspace/provision', [
        'business_name' => 'Contact Details Store',
        'email'         => $email,
        'password'      => 'password123',
        'phone'         => '+1 555 0177',
        'address'       => '42 Signup Street, Lahore',
        'modules'       => ['products', 'pos'],
    ])->assertJsonPath('pending_verification', true);

    $code = null;
    Mail::assertQueued(\App\Mail\EmailOtpCodeMail::class, function ($m) use (&$code) {
        $code = $m->code;
        return true;
    });
    $verify = $this->post('/verify-code', ['code' => $code]);
    preg_match('#/s/([^/]+)/dashboard#', (string) $verify->headers->get('Location'), $m);
    $tenant = Tenant::where('slug', $m[1])->firstOrFail();

    $phone = Setting::withoutGlobalScopes()->where('tenant_id', $tenant->id)->where('key', 'store_phone')->value('value');
    $address = Setting::withoutGlobalScopes()->where('tenant_id', $tenant->id)->where('key', 'store_address')->value('value');

    expect($phone)->toBe('+1 555 0177')->and($address)->toBe('42 Signup Street, Lahore');
});
