<?php

namespace Tests\Feature\Marketing;

use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PricingPageReportingTiersTest extends TestCase
{
    #[Test]
    public function pricing_jsx_contains_canonical_reporting_tier_counts(): void
    {
        $jsxPath = resource_path('js/Pages/Marketing/Pricing.jsx');
        $this->assertFileExists($jsxPath, "Pricing.jsx must exist at {$jsxPath}");

        $content = (string) file_get_contents($jsxPath);

        // Assert no "43" in report context
        $this->assertDoesNotMatchRegularExpression('/43\+?\s*reports/i', $content, 'Pricing.jsx must not reference 43 reports.');
        $this->assertDoesNotMatchRegularExpression('/all 43 reports/i', $content, 'Pricing.jsx must not reference all 43 reports.');

        // Assert canonical tier numbers in Pricing.jsx
        $this->assertStringContainsString('9 live dashboard cards', $content, 'Pricing.jsx must mention 9 live dashboard cards for Solo.');
        $this->assertStringContainsString('20 Essential', $content, 'Pricing.jsx must mention 20 Essential reports for Starter.');
        $this->assertStringContainsString('32 Core', $content, 'Pricing.jsx must mention 32 Core reports for Core.');
        $this->assertStringContainsString('All 40', $content, 'Pricing.jsx must mention All 40 reports for Scale.');
        $this->assertStringContainsString('Dashboard cards only', $content, 'Pricing.jsx must label Solo reports row as Dashboard cards only.');
    }

    #[Test]
    public function marketing_seo_contains_canonical_reporting_tier_counts(): void
    {
        $seoPath = app_path('Support/MarketingSeo.php');
        $this->assertFileExists($seoPath, "MarketingSeo.php must exist at {$seoPath}");

        $content = (string) file_get_contents($seoPath);

        // Assert no "43 reports" in MarketingSeo.php
        $this->assertDoesNotMatchRegularExpression('/43\s*reports/i', $content, 'MarketingSeo.php must not reference 43 reports.');
        $this->assertDoesNotMatchRegularExpression('/all 43 reports/i', $content, 'MarketingSeo.php must not reference all 43 reports.');
        $this->assertDoesNotMatchRegularExpression('/43\s*statements/i', $content, 'MarketingSeo.php must not reference 43 statements.');

        // Assert canonical counts
        $this->assertStringContainsString('all 40 reports', $content, 'MarketingSeo.php must reference all 40 reports.');
        $this->assertStringContainsString('20 Essential', $content, 'MarketingSeo.php must mention 20 Essential reports.');
        $this->assertStringContainsString('32 Core', $content, 'MarketingSeo.php must mention 32 Core reports.');
    }
}