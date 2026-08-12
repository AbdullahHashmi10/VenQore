<?php

namespace Tests\Unit\Reckoner;

use App\Reckoner\ReckonerCharts;
use App\Reckoner\ReckonerShape;
use Tests\TestCase;

/**
 * ReckonerChartsTest — verifies shape-to-chart configuration legality.
 *
 * @group reckoner
 */
class ReckonerChartsTest extends TestCase
{
    public function test_charts_mapping_contains_expected_shapes(): void
    {
        $this->assertNotEmpty(ReckonerCharts::MAP['scalar']);
        $this->assertNotEmpty(ReckonerCharts::MAP['status']);
        $this->assertContains('stat', ReckonerCharts::MAP['scalar']);
        $this->assertContains('gauge', ReckonerCharts::MAP['scalar']);
    }

    public function test_for_method_returns_matching_charts(): void
    {
        $charts = ReckonerCharts::for(ReckonerShape::SCALAR);
        $this->assertContains('stat', $charts);
        $this->assertContains('gauge', $charts);

        $statusCharts = ReckonerCharts::for(ReckonerShape::STATUS);
        $this->assertContains('status', $statusCharts);
        $this->assertContains('stat', $statusCharts);
    }

    public function test_is_legal_validates_pairs(): void
    {
        $this->assertTrue(ReckonerCharts::isLegal(ReckonerShape::SCALAR, 'stat'));
        $this->assertTrue(ReckonerCharts::isLegal(ReckonerShape::SCALAR, 'gauge'));
        $this->assertFalse(ReckonerCharts::isLegal(ReckonerShape::SCALAR, 'pie')); // pie is illegal for scalar

        $this->assertTrue(ReckonerCharts::isLegal(ReckonerShape::STATUS, 'status'));
        $this->assertFalse(ReckonerCharts::isLegal(ReckonerShape::STATUS, 'pie'));
    }

    public function test_default_returns_fallback_chart(): void
    {
        $this->assertSame('stat', ReckonerCharts::default(ReckonerShape::SCALAR));
        $this->assertSame('status', ReckonerCharts::default(ReckonerShape::STATUS));
    }
}
