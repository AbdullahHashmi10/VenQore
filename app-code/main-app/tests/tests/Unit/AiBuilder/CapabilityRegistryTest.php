<?php

namespace Tests\Unit\AiBuilder;

use App\Services\AiBuilder\CapabilityRegistry;
use Tests\TestCase;

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
        // 'grocery', not 'grocery_store' — the latter is not a preset key, and
        // this only ever passed because resolveModules() used to bolt a fixed
        // baseline onto every trade whether the preset resolved or not.
        $resolved = $this->registry->resolveModules([], 'grocery');

        $this->assertContains('pos', $resolved);
        $this->assertContains('products', $resolved);
        $this->assertContains('inventory', $resolved);

        // Deliberately absent. A counter shop gets a customer directory when it
        // tells us it sells on credit — not because groceries in general might.
        // Starting with everything the trade could want is the behaviour this
        // whole flow exists to replace.
        $this->assertNotContains('customers', $resolved);

        // Must NOT enable manufacturing, tables, or repairs
        $this->assertNotContains('tables', $resolved);
        $this->assertNotContains('cookbook', $resolved);
        $this->assertNotContains('repairs', $resolved);
    }

    /** An unknown preset key is a bug, but it must not produce a blank workspace. */
    public function test_unknown_preset_still_yields_a_usable_floor(): void
    {
        $resolved = $this->registry->resolveModules([], 'no_such_preset');

        $this->assertNotEmpty($resolved);
        $this->assertContains('pos', $resolved);
    }

    /** A stated fact outranks the trade's default shape. */
    public function test_working_alone_removes_staff_modules(): void
    {
        $facts = $this->registry->detectStructuredFacts('plumbing business, I work alone')['facts'];
        $this->assertTrue($facts['solo']['value'] ?? false);

        $resolved = $this->registry->resolveModules([], 'field_service', $facts);
        $this->assertNotContains('staff_attendance', $resolved);

        // …and a business that never said it stays as its trade describes it.
        $team = $this->registry->resolveModules([], 'field_service');
        $this->assertNotContains('staff_attendance', $team, 'staff attendance is earned by an answer, not assumed');
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

        // A phone shop that also repairs is scored on BOTH trades' priority
        // questions. Two are still unanswered (spare parts & labour, customer
        // credit), so readiness is only moderate…
        $partial = $this->registry->calculateReadinessConfidence($facts, $confirmed, $rejected);
        $this->assertGreaterThan(0.6, $partial);
        $this->assertLessThan(0.88, $partial);

        // …and the picker asks one of those next.
        $next = $this->registry->selectNextCandidateQuestion($facts, $confirmed, $rejected);
        $this->assertContains($next['key'] ?? null, ['spare_parts_and_labour', 'customer_khata_credit']);

        // Once every priority question for both trades is answered, it is high.
        $readiness = $this->registry->calculateReadinessConfidence(
            $facts,
            array_merge($confirmed, ['spare_parts_and_labour']),
            array_merge($rejected, ['customer_khata_credit'])
        );
        $this->assertGreaterThanOrEqual(0.88, $readiness);
        $this->assertGreaterThan($partial, $readiness);
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
