<?php

namespace Tests\Feature\AppSumo;

use App\Models\AppSumoCode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\VenQoreTestCase;

class ImportAppSumoCodesTest extends VenQoreTestCase
{
    use RefreshDatabase;

    public function test_can_import_appsumo_codes_from_csv(): void
    {
        // Generate a temporary CSV file
        $tempFile = tempnam(sys_get_temp_dir(), 'appsumo_codes');
        file_put_contents($tempFile, "code\nSUMO-CODE-111\nSUMO-CODE-222\nSUMO-INVALID-!!!\nSUMO-CODE-111");

        $this->artisan('appsumo:import-codes', [
            'file' => $tempFile,
            '--campaign' => 'appsumo-test-campaign',
        ])
        ->assertExitCode(0);

        // Verify valid, non-duplicate codes are imported
        $this->assertDatabaseHas('appsumo_codes', [
            'code' => 'SUMO-CODE-111',
        ]);
        $this->assertDatabaseHas('appsumo_codes', [
            'code' => 'SUMO-CODE-222',
        ]);

        // Verify invalid code was not imported
        $this->assertDatabaseMissing('appsumo_codes', [
            'code' => 'SUMO-INVALID-!!!',
        ]);

        // Verify campaign and status are stored in metadata
        $code1 = AppSumoCode::where('code', 'SUMO-CODE-111')->first();
        $this->assertNotNull($code1);
        $this->assertIsArray($code1->metadata);
        $this->assertEquals('appsumo-test-campaign', $code1->metadata['campaign'] ?? null);
        $this->assertEquals('issued', $code1->metadata['status'] ?? null);

        // Cleanup
        @unlink($tempFile);
    }
}
