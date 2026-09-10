<?php

namespace Tests\Feature\Security;

use App\Http\Controllers\AdminController;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

class PrintLogoUploadTest extends VenQoreTestCase
{
    #[Test]
    public function it_rejects_svg_print_logos(): void
    {
        $tenant = $this->createTenant();
        $this->bindTenantContext($tenant);

        $request = Request::create('/settings', 'POST');
        $request->files->set('print_logo_file', UploadedFile::fake()->createWithContent(
            'logo.svg',
            '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'
        ));

        $this->expectException(ValidationException::class);

        app(AdminController::class)->updateSettings($request);
    }

    #[Test]
    public function it_accepts_and_stores_a_raster_print_logo(): void
    {
        Storage::fake('public');
        $tenant = $this->createTenant();
        $this->bindTenantContext($tenant);

        $request = Request::create('/settings', 'POST');
        $request->files->set(
            'print_logo_file',
            UploadedFile::fake()->createWithContent(
                'logo.png',
                base64_decode(
                    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
                )
            )
        );

        app(AdminController::class)->updateSettings($request);

        $path = Setting::where('key', 'print_logo_path')->value('value');
        $this->assertNotNull($path);
        $this->assertStringEndsWith('.png', $path);
        Storage::disk('public')->assertExists(str_replace('/storage/', '', $path));
    }
}
