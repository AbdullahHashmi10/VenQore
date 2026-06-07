<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use App\Models\Product;
use App\Models\Sale;
use App\Mail\SystemResetOtpMail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Cache;
use Tests\Feature\VenQoreTestCase;

class SystemResetTest extends VenQoreTestCase
{
    use RefreshDatabase;

    /** @test */
    public function system_reset_endpoint_redirects_unauthenticated_guests()
    {
        $tenant = $this->createTenant();

        // Guest hitting the correct prefixed endpoint
        $response = $this->post("/s/{$tenant->slug}/api/system/reset", [
            'password' => 'password123',
        ]);

        $response->assertStatus(302);
        $response->assertRedirect('/login');
    }

    /** @test */
    public function system_reset_fails_with_invalid_credentials()
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $user->password = Hash::make('correctpassword');
        $user->save();

        $this->actingAsTenantUserModel($user, $tenant);

        // Hitting correct prefixed reset endpoint with incorrect password
        $response = $this->post("/s/{$tenant->slug}/api/system/reset", [
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(403);
        $response->assertJsonFragment([
            'message' => 'Invalid password or admin passcode.'
        ]);
    }

    /** @test */
    public function system_reset_wipes_all_tenant_data_with_valid_password()
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $user->password = Hash::make('correctpassword');
        $user->save();

        $this->actingAsTenantUserModel($user, $tenant);

        // Seed some dummy records
        Product::factory()->create(['tenant_id' => $tenant->id]);
        Sale::factory()->create(['tenant_id' => $tenant->id]);

        $this->assertGreaterThan(0, Product::count());
        $this->assertGreaterThan(0, Sale::count());

        // Perform factory reset
        $response = $this->post("/s/{$tenant->slug}/api/system/reset", [
            'password' => 'correctpassword',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'message' => 'System successfully reset to factory settings.'
        ]);

        // Verify that data is deleted
        $this->assertEquals(0, Product::count());
        $this->assertEquals(0, Sale::count());
    }

    /** @test */
    public function system_reset_selective_delete_wipes_only_products()
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        $user->password = Hash::make('correctpassword');
        $user->save();

        $this->actingAsTenantUserModel($user, $tenant);

        // Seed some dummy records
        Product::factory()->create(['tenant_id' => $tenant->id]);
        Sale::factory()->create(['tenant_id' => $tenant->id]);

        $this->assertGreaterThan(0, Product::count());
        $this->assertGreaterThan(0, Sale::count());

        // Perform selective reset of products only
        $response = $this->post("/s/{$tenant->slug}/api/system/reset/products", [
            'password' => 'correctpassword',
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'message' => 'Products data successfully deleted.'
        ]);

        // Products should be deleted, but Sales should remain
        $this->assertEquals(0, Product::count());
        $this->assertGreaterThan(0, Sale::count());
    }

    /** @test */
    public function unprefixed_system_reset_route_falls_back_to_fallback_route_or_fails()
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        
        $this->actingAsTenantUserModel($user, $tenant);

        // Hitting the unprefixed /api/system/reset endpoint directly (simulating the bug)
        // Since it's a POST request to an unmatched route, it matches the GET|HEAD fallback route,
        // resulting in a 405 Method Not Allowed error.
        $response = $this->post("/api/system/reset", [
            'password' => 'password123',
        ]);

        $response->assertStatus(405);
    }

    /** @test */
    public function system_reset_sends_email_otp_successfully()
    {
        Mail::fake();

        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        
        $this->actingAsTenantUserModel($user, $tenant);

        $response = $this->post("/s/{$tenant->slug}/api/system/reset/send-otp");

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'message' => 'Verification code sent to your registered email address.'
        ]);

        // Assert code is stored in cache
        $cachedOtp = cache()->get('system_reset_otp_' . $user->id);
        $this->assertNotNull($cachedOtp);
        $this->assertEquals(6, strlen($cachedOtp));

        // Assert mail was sent with the correct code
        Mail::assertSent(SystemResetOtpMail::class, function ($mail) use ($user, $cachedOtp) {
            return $mail->hasTo($user->email) && $mail->otpCode === $cachedOtp;
        });
    }

    /** @test */
    public function system_reset_wipes_all_tenant_data_with_valid_email_otp()
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        
        $this->actingAsTenantUserModel($user, $tenant);

        // Seed some dummy records
        Product::factory()->create(['tenant_id' => $tenant->id]);
        Sale::factory()->create(['tenant_id' => $tenant->id]);

        // Mock OTP in cache
        $otp = '987654';
        cache()->put('system_reset_otp_' . $user->id, $otp, 900);

        // Perform factory reset with the OTP instead of password
        $response = $this->post("/s/{$tenant->slug}/api/system/reset", [
            'password' => $otp,
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'message' => 'System successfully reset to factory settings.'
        ]);

        // Verify that data is deleted and OTP is cleared from cache
        $this->assertEquals(0, Product::count());
        $this->assertEquals(0, Sale::count());
        $this->assertNull(cache()->get('system_reset_otp_' . $user->id));
    }

    /** @test */
    public function system_reset_fails_with_invalid_or_expired_email_otp()
    {
        $tenant = $this->createTenant();
        $user = $this->createTenantUser($tenant, 'owner');
        
        $this->actingAsTenantUserModel($user, $tenant);

        // Seed some dummy records
        Product::factory()->create(['tenant_id' => $tenant->id]);
        Sale::factory()->create(['tenant_id' => $tenant->id]);

        // Mock OTP in cache
        $otp = '987654';
        cache()->put('system_reset_otp_' . $user->id, $otp, 900);

        // Try reset with WRONG OTP
        $response = $this->post("/s/{$tenant->slug}/api/system/reset", [
            'password' => '000000',
        ]);

        $response->assertStatus(403);
        $this->assertGreaterThan(0, Product::count());
        $this->assertGreaterThan(0, Sale::count());

        // Clear OTP (simulating expiration)
        cache()->forget('system_reset_otp_' . $user->id);

        // Try reset with EXPIRED/CLEARED OTP
        $response2 = $this->post("/s/{$tenant->slug}/api/system/reset", [
            'password' => $otp,
        ]);

        $response2->assertStatus(403);
        $this->assertGreaterThan(0, Product::count());
        $this->assertGreaterThan(0, Sale::count());
    }
}
