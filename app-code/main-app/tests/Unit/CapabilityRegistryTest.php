<?php

namespace Tests\Unit;

use App\Services\AiBuilder\CapabilityRegistry;
use PHPUnit\Framework\TestCase;

class CapabilityRegistryTest extends TestCase
{
    private CapabilityRegistry $registry;

    protected function setUp(): void
    {
        parent::setUp();
        $this->registry = new CapabilityRegistry();
    }

    /**
     * Test 1: Full Capability Hierarchy & Consequence Integrity.
     */
    public function test_all_capabilities_have_consequences_and_dependencies(): void
    {
        $all = $this->registry->allCapabilities();
        $this->assertNotEmpty($all);

        foreach ($all as $key => $cap) {
            $this->assertArrayHasKey('domain', $cap);
            $this->assertArrayHasKey('name', $cap);
            $this->assertArrayHasKey('impact', $cap);
            $this->assertArrayHasKey('consequences', $cap);
            $this->assertArrayHasKey('question_template', $cap);
            $this->assertArrayHasKey('options', $cap);
            $this->assertNotEmpty($cap['consequences'], "Capability {$key} must have explicit configuration consequences.");
        }
    }

    /**
     * Test A: Simple Retail (Grocery) -> Correct Base Modules, No Unrelated Modules.
     */
    public function test_simple_retail_grocery_modules(): void
    {
        $resolved = $this->registry->resolveModules([], 'grocery_store');

        $this->assertContains('pos', $resolved);
        $this->assertContains('inventory', $resolved);
        $this->assertContains('customers', $resolved);

        // Must NOT enable manufacturing, tables, or repairs
        $this->assertNotContains('tables', $resolved);
        $this->assertNotContains('cookbook', $resolved);
        $this->assertNotContains('repairs', $resolved);
    }

    /**
     * Test B: Ambiguous Electronics Input -> Candidate Question Selects High-Impact Unknown.
     */
    public function test_ambiguous_electronics_selects_serial_or_repair_question(): void
    {
        $facts = [
            'trade:electronics' => ['value' => true, 'confidence' => 0.95, 'source' => 'user_keyword', 'evidence' => 'electronics'],
        ];

        $candidate = $this->registry->selectNextCandidateQuestion($facts, [], []);
        $this->assertNotNull($candidate);
        $this->assertContains($candidate['key'], ['serial_imei_tracking', 'repair_job_tracking']);
    }

    /**
     * Test C: Explicit Input -> High Readiness Confidence.
     */
    public function test_explicit_input_calculates_high_readiness(): void
    {
        $facts = [
            'branches'          => ['value' => 3, 'confidence' => 1.0],
            'multi_branch'      => ['value' => true, 'confidence' => 1.0],
            'trade:repairs'     => ['value' => true, 'confidence' => 0.95],
            'trade:electronics' => ['value' => true, 'confidence' => 0.95],
        ];

        $confirmed = ['repair_job_tracking', 'multi_branch_warehouses', 'serial_imei_tracking'];
        $rejected = ['batch_expiry_tracking', 'table_and_kot_management'];

        $readiness = $this->registry->calculateReadinessConfidence($facts, $confirmed, $rejected);
        $this->assertGreaterThanOrEqual(0.88, $readiness);
    }

    /**
     * Test D: Multilingual Fact Extraction (Urdu / Arabic / Mixed).
     */
    public function test_multilingual_fact_extraction(): void
    {
        // Urdu
        $urduInput = "میں موبائل کی دکان چلاتا ہوں اور مرمت بھی کرتا ہوں 2 برانچز ہیں۔";
        $urduFacts = $this->registry->detectStructuredFacts($urduInput);

        $this->assertEquals(2, $urduFacts['facts']['branches']['value']);
        $this->assertTrue($urduFacts['facts']['trade:repairs']['value']);
        $this->assertTrue($urduFacts['facts']['trade:electronics']['value']);

        // Arabic
        $arabicInput = "لدي صيدلية وأريد إدارة الأدوية";
        $arabicFacts = $this->registry->detectStructuredFacts($arabicInput);
        $this->assertTrue($arabicFacts['facts']['trade:pharmacy']['value']);

        // Mixed Language
        $mixedInput = "Meri 3 branches hain for clothing garments.";
        $mixedFacts = $this->registry->detectStructuredFacts($mixedInput);
        $this->assertEquals(3, $mixedFacts['facts']['branches']['value']);
        $this->assertTrue($mixedFacts['facts']['trade:clothing']['value']);
    }

    /**
     * Test G & F: Hallucinated / Injected Modules Dropped Strictly.
     */
    public function test_hallucinated_and_injected_modules_dropped_strictly(): void
    {
        $fakeCapabilities = ['advanced_ai_stock_prediction', 'crypto_payment_gateway', 'super_hacker_module'];
        $resolved = $this->registry->resolveModules($fakeCapabilities, 'retail_shop');

        $this->assertNotContains('advanced_ai_stock_prediction', $resolved);
        $this->assertNotContains('crypto_payment_gateway', $resolved);
        $this->assertNotContains('super_hacker_module', $resolved);
    }
}
