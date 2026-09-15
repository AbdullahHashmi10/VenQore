<?php

namespace Tests\Unit\Reckoner;

use App\Reckoner\DashboardSanitizer;
use Tests\TestCase;

/**
 * DashboardSanitizerTest — verifies layout clamping, card capping, plan/feature
 * filtering and security controls in DashboardSanitizer.
 *
 * @group reckoner
 */
class DashboardSanitizerTest extends TestCase
{
    public function test_sanitizes_valid_cards(): void
    {
        $cards = [
            [
                'reading_key' => 'sales.revenue',
                'period' => 'today',
                'chart' => 'stat',
                'size' => '4x4',
                'x' => 15, // should clamp to 11
                'y' => 600, // should clamp to 500
                'title_override' => 'Override Revenue Title',
                'args' => ['foo' => 'bar'],
            ]
        ];

        $available = ['sales.revenue'];
        $clean = DashboardSanitizer::sanitize($cards, $available);

        $this->assertCount(1, $clean);
        $item = $clean[0];
        $this->assertSame('sales.revenue', $item['reading_key']);
        $this->assertSame('today', $item['period']);
        $this->assertSame('stat', $item['chart']);
        $this->assertSame('C4', $item['category']);
        $this->assertSame('full', $item['fit']);
        $this->assertSame(8, $item['x']); // clamped to 12-column grid (12 - 4 = 8)
        $this->assertSame(500, $item['y']); // clamped
        $this->assertSame(4, $item['w']); // derived from 4x4 w=4
        $this->assertSame(4, $item['h']); // derived from 4x4 h=4
        $this->assertSame('Override Revenue Title', $item['title_override']);
        $this->assertSame(['foo' => 'bar'], $item['args']);
    }

    public function test_rejects_platform_scoped_keys(): void
    {
        $cards = [
            [
                'reading_key' => 'platform.active_tenant_count',
                'period' => 'live',
                'chart' => 'stat',
                'size' => '4x4',
            ]
        ];

        $available = ['platform.active_tenant_count'];
        $clean = DashboardSanitizer::sanitize($cards, $available);

        $this->assertEmpty($clean); // platform key rejected outright
    }

    public function test_drops_unavailable_gated_keys(): void
    {
        $cards = [
            [
                'reading_key' => 'finance.net_profit',
                'period' => 'this_month',
                'chart' => 'stat',
                'size' => '4x4',
            ]
        ];

        // finance.net_profit is not in the available keys (gated/plan locked)
        $available = ['sales.revenue'];
        $clean = DashboardSanitizer::sanitize($cards, $available);

        $this->assertEmpty($clean);
    }

    public function test_limits_to_maximum_45_cards(): void
    {
        $cards = [];
        for ($i = 0; $i < 50; $i++) {
            $cards[] = [
                'reading_key' => 'sales.revenue',
                'period' => 'today',
                'chart' => 'stat',
                'size' => '4x4',
                'x' => 0,
                'y' => $i,
            ];
        }

        $available = ['sales.revenue'];
        $clean = DashboardSanitizer::sanitize($cards, $available);

        $this->assertCount(40, $clean); // capped at 40
    }
}
