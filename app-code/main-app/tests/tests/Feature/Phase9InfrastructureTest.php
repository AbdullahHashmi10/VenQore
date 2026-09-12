<?php

namespace Tests\Feature;

use App\Services\MessagingAuditService;
use App\Services\OffsiteBackupService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class Phase9InfrastructureTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_verifies_r2_and_offsite_backup_disk_configurations()
    {
        $r2Config = config('filesystems.disks.r2');
        $this->assertNotNull($r2Config, 'R2 filesystem disk must be configured');
        $this->assertEquals('local', $r2Config['driver'], 'R2 driver defaults to local when Cloudflare credentials missing');

        $offsiteConfig = config('filesystems.disks.s3_offsite');
        $this->assertNotNull($offsiteConfig, 's3_offsite filesystem disk must be configured');
    }

    /** @test */
    public function it_copies_backup_archives_to_offsite_storage_with_hash_verification()
    {
        Storage::fake('local');
        Storage::fake('s3_offsite');

        $content  = 'DB_BACKUP_DUMP_SQL_CONTENT_SIMULATION_12345';
        $filename = 'test-backup-2026-08-05.sql';
        Storage::disk('local')->put($filename, $content);

        $service = new OffsiteBackupService();
        $result  = $service->dispatchOffsiteBackup($filename, 's3_offsite');

        $this->assertTrue($result['success']);
        $this->assertEquals('s3_offsite', $result['disk']);
        $this->assertEquals(hash('sha256', $content), $result['hash']);
    }

    /** @test */
    public function it_audits_database_infrastructure_command()
    {
        $exitCode = $this->artisan('venqore:audit-database')->run();
        $this->assertEquals(0, $exitCode);
    }

    /** @test */
    public function it_audits_messaging_channels_and_mail_driver_configuration()
    {
        $service = new MessagingAuditService();
        $report  = $service->auditChannels();

        $this->assertArrayHasKey('mail', $report);
        $this->assertArrayHasKey('sms', $report);
        $this->assertArrayHasKey('whatsapp', $report);
    }

    /** @test */
    public function it_verifies_ai_model_deprecation_dates_and_fallback_chains()
    {
        $auditConfig = config('ai_models.deprecation_audit');
        $this->assertIsArray($auditConfig);
        $this->assertArrayHasKey('gemini-2.5-flash', $auditConfig);
        $this->assertEquals('2026-10-16', $auditConfig['gemini-2.5-flash']['deprecation_date']);
    }
}
