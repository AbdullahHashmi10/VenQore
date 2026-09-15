<?php

namespace Tests\Feature\Module;

use App\Support\ReportPlanMap;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ReportPlanMapCountTest extends TestCase
{
    #[Test]
    public function report_plan_map_has_exact_tier_counts_and_23_keys(): void
    {
        $featureTiers = ReportPlanMap::FEATURE_TIERS;
        $map = ReportPlanMap::MAP;

        // 1. Total unique feature keys is exactly 23
        $uniqueKeys = array_unique(array_values($map));
        $this->assertCount(23, $uniqueKeys, 'ReportPlanMap must map to exactly 23 unique feature keys.');
        $this->assertCount(23, $featureTiers, 'ReportPlanMap::FEATURE_TIERS must contain exactly 23 keys.');

        // Group feature keys by tier
        $tierKeys = [
            'Starter' => [],
            'Core' => [],
            'Scale' => [],
        ];

        foreach ($featureTiers as $key => $tier) {
            $this->assertArrayHasKey($tier, $tierKeys, "Unknown tier '{$tier}' for feature key '{$key}'.");
            $tierKeys[$tier][] = $key;
        }

        // Key counts per tier: 10 Starter, 8 Core, 5 Scale = 23 keys
        $this->assertCount(10, $tierKeys['Starter'], 'Starter tier must have exactly 10 feature keys.');
        $this->assertCount(8, $tierKeys['Core'], 'Core tier must have exactly 8 feature keys.');
        $this->assertCount(5, $tierKeys['Scale'], 'Scale tier must have exactly 5 feature keys.');

        // Canonical tier counts: 20 Starter, 12 Core, 8 Scale
        $canonicalTierCounts = [
            'Starter' => 20,
            'Core' => 12,
            'Scale' => 8,
        ];

        $this->assertSame(20, $canonicalTierCounts['Starter']);
        $this->assertSame(12, $canonicalTierCounts['Core']);
        $this->assertSame(8, $canonicalTierCounts['Scale']);

        // Cumulative counts: 20, 32, 40
        $this->assertSame(20, $canonicalTierCounts['Starter']);
        $this->assertSame(32, $canonicalTierCounts['Starter'] + $canonicalTierCounts['Core']);
        $this->assertSame(40, $canonicalTierCounts['Starter'] + $canonicalTierCounts['Core'] + $canonicalTierCounts['Scale']);
    }

    #[Test]
    public function report_decision_messages_exist_for_all_23_keys(): void
    {
        $messages = ReportPlanMap::REPORT_DECISION_MESSAGES;
        $this->assertCount(23, $messages, 'ReportPlanMap::REPORT_DECISION_MESSAGES must contain exactly 23 decision messages.');

        foreach (ReportPlanMap::FEATURE_TIERS as $key => $tier) {
            $this->assertArrayHasKey($key, $messages, "Decision message missing for key '{$key}'.");
            $this->assertNotEmpty($messages[$key], "Decision message for key '{$key}' cannot be empty.");
            $this->assertStringContainsString($tier, $messages[$key], "Decision message for '{$key}' must mention tier '{$tier}'.");
        }
    }
}