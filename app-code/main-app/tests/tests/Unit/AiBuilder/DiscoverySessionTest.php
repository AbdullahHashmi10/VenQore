<?php

namespace Tests\Unit\AiBuilder;

use App\Services\AiBuilder\DiscoverySession;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class DiscoverySessionTest extends TestCase
{
    public function test_session_records_and_revises_capabilities_correctly(): void
    {
        $session = DiscoverySession::start("I sell mobile phones", ['trade:electronics' => ['value' => true, 'confidence' => 0.95]]);

        // Turn 1: User initially confirms serial tracking
        $session->recordAnswer("Yes we track serial numbers", [], ['serial_imei_tracking'], []);
        $this->assertContains('serial_imei_tracking', $session->confirmed);
        $this->assertNotContains('serial_imei_tracking', $session->rejected);

        // Turn 2: User changes their mind ("Actually no, standard barcode quantity only")
        $session->recordAnswer("Actually no, standard barcode quantity only", [], [], ['serial_imei_tracking']);
        $this->assertNotContains('serial_imei_tracking', $session->confirmed);
        $this->assertContains('serial_imei_tracking', $session->rejected);
    }
}
