<?php

namespace Tests\Unit\AiBuilder;

use App\Services\AiBuilder\BusinessProfile;
use App\Services\AiBuilder\CapabilityRegistry;
use App\Services\AiBuilder\ConversationalBuilderService;
use App\Services\AiBuilder\DiscoverySession;
use App\Services\AiBuilder\DiscoveryResolver;
use App\Services\Ai\AiGateway;
use App\Services\Ai\AiResult;
use App\Support\BusinessTypes;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Screenshot Regression Test Suite (Section 10 Acceptance Checks)          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Covers all findings from the screenshot audit:
 * 1. Positive capability gating prevents irrelevant questions (dining, expiry, IMEI, etc.)
 * 2. Freelance designer turn 1 asks recurring billing / quotations, NOT repair tracking
 * 3. Declining quotations ("No, I invoice directly") does NOT imply POS
 * 4. Ambiguous freelancer triggers clarification before committing to questions
 * 5. Separation of template confidence from activity confidence
 * 6. Fact retention across multiple conversational turns
 */
class ScreenshotRegressionTest extends TestCase
{
    private CapabilityRegistry $registry;
    private ConversationalBuilderService $builder;

    protected function setUp(): void
    {
        parent::setUp();
        $this->registry = app(CapabilityRegistry::class);
        $this->builder = app(ConversationalBuilderService::class);
    }

    /**
     * Acceptance Check 1: Freelance designer never receives irrelevant capabilities.
     * The 5 capabilities bundled in the bug screenshot (multi_branch_warehouses,
     * batch_expiry_tracking, table_and_kot_management, counter_checkout, serial_imei_tracking)
     * must ALL be evaluated as ineligible for a freelance designer.
     */
    public function test_freelance_designer_ineligible_for_screenshot_bundle_capabilities(): void
    {
        $prompt = 'I am a freelance designer invoicing clients monthly.';
        $facts = $this->registry->detectStructuredFacts($prompt)['facts'];

        $profile = BusinessProfile::fromInitialInput($prompt, $facts);
        $this->assertSame('services', $profile->sells);
        $this->assertTrue($profile->solo);
        $this->assertSame('monthly', $profile->billingCadence);
        $this->assertContains($profile->preset, ['professional_services', 'freelancer']);

        $mergedFacts = array_merge($facts, $profile->facts);

        $screenshotCaps = [
            'multi_branch_warehouses',
            'batch_expiry_tracking',
            'table_and_kot_management',
            'counter_checkout',
            'serial_imei_tracking',
            'repair_job_tracking',
            'recipe_and_bom',
            'food_delivery_dispatch',
        ];

        foreach ($screenshotCaps as $cap) {
            $eligibility = $this->registry->evaluateEligibility(
                $cap,
                $mergedFacts,
                $profile->preset,
                $profile->sector,
                $profile->businessType
            );

            $this->assertFalse(
                $eligibility['eligible'],
                "Capability [{$cap}] must NOT be eligible for a freelance designer, but was reported eligible."
            );
        }

        // Positive check: recurring_billing and quotations_and_orders MUST be eligible
        $recurringEligibility = $this->registry->evaluateEligibility(
            'recurring_billing',
            $mergedFacts,
            $profile->preset,
            $profile->sector,
            $profile->businessType
        );
        $this->assertTrue($recurringEligibility['eligible'], 'recurring_billing must be eligible for freelance designer.');

        $quoteEligibility = $this->registry->evaluateEligibility(
            'quotations_and_orders',
            $mergedFacts,
            $profile->preset,
            $profile->sector,
            $profile->businessType
        );
        $this->assertTrue($quoteEligibility['eligible'], 'quotations_and_orders must be eligible for freelance designer.');
    }

    /**
     * Acceptance Check 2: Turn 1 question selection for freelance designer.
     * Must select recurring_billing or quotations_and_orders, NEVER repair_job_tracking.
     */
    public function test_freelance_designer_turn_one_selects_service_capability(): void
    {
        $prompt = 'I am a freelance designer invoicing clients monthly.';
        $response = $this->builder->startSession($prompt);

        $this->assertTrue($response['ok']);
        $this->assertFalse($response['is_complete']);

        $targetCap = $response['target_capability'] ?? null;
        $this->assertNotEquals(
            'repair_job_tracking',
            $targetCap,
            'Turn 1 must NOT ask about repair tracking for a freelance designer.'
        );

        $this->assertContains(
            $targetCap,
            ['recurring_billing', 'quotations_and_orders'],
            'Turn 1 should ask about recurring billing or quotations/orders.'
        );
    }

    /**
     * Acceptance Check 3: Turn 2 cannot bundle unrelated physical inventory or dining capabilities.
     */
    public function test_freelance_designer_bundle_does_not_contain_screenshot_options(): void
    {
        $prompt = 'I am a freelance designer invoicing clients monthly.';
        $fastExtraction = $this->registry->detectStructuredFacts($prompt);
        $profile = BusinessProfile::fromInitialInput($prompt, $fastExtraction['facts']);
        $facts = array_merge($fastExtraction['facts'], $profile->facts);

        // Turn 1 resolves recurring_billing
        $bundle = $this->registry->composeBundleQuestion(
            $facts,
            ['recurring_billing'],
            [],
            [],
            $profile->preset,
            $profile->sector,
            $profile->businessType
        );

        // Either null because eligible candidates < BUNDLE_MIN (3), or contains only service-compatible caps
        if ($bundle !== null) {
            $this->assertArrayNotHasKey('table_and_kot_management', array_flip($bundle['members']));
            $this->assertArrayNotHasKey('batch_expiry_tracking', array_flip($bundle['members']));
            $this->assertArrayNotHasKey('serial_imei_tracking', array_flip($bundle['members']));
            $this->assertArrayNotHasKey('multi_branch_warehouses', array_flip($bundle['members']));
        } else {
            // Null bundle is expected and correct when fewer than 3 eligible candidates remain!
            $this->assertNull($bundle);
        }
    }

    /**
     * Acceptance Check 4: Final modules for freelance designer are clean and omit POS/inventory.
     */
    public function test_freelance_designer_final_modules_omit_pos_and_inventory(): void
    {
        $confirmed = ['recurring_billing'];
        $facts = [
            'solo'  => ['value' => true],
            'sells' => ['value' => 'services'],
        ];

        $modules = $this->registry->resolveModules($confirmed, 'freelancer', $facts);

        // Must include core service modules
        $this->assertContains('invoicing', $modules);
        $this->assertContains('services', $modules);
        $this->assertContains('customers', $modules);
        $this->assertContains('expenses', $modules);
        $this->assertContains('recurring_invoices', $modules);

        // Must NOT include POS or physical inventory modules
        $this->assertNotContains('pos', $modules);
        $this->assertNotContains('batches_expiry', $modules);
        $this->assertNotContains('table_service', $modules);
        $this->assertNotContains('serials', $modules);
        $this->assertNotContains('stock_transfers', $modules);
        $this->assertNotContains('cookbook', $modules);
    }

    /**
     * Acceptance Check 5: Negative quotations answer does NOT imply POS.
     */
    public function test_declining_quotations_does_not_imply_pos(): void
    {
        $all = $this->registry->allCapabilities();
        $quoteCap = $all['quotations_and_orders'] ?? [];

        $noOption = null;
        foreach ($quoteCap['options'] as $opt) {
            if ($opt['key'] === 'no') {
                $noOption = $opt;
                break;
            }
        }

        $this->assertNotNull($noOption);
        $this->assertNotSame(
            'pos_only',
            $noOption['implies'],
            'Declining quotations must not imply pos_only.'
        );
        $this->assertSame(
            'direct_billing',
            $noOption['implies']
        );
    }

    /**
     * Acceptance Check 6: Ambiguous freelancer triggers clarification.
     */
    public function test_ambiguous_freelancer_triggers_clarification(): void
    {
        $prompt = 'I freelance and charge monthly';
        $response = $this->builder->startSession($prompt);

        $this->assertTrue($response['ok']);
        $this->assertSame(
            '__clarification:activity__',
            $response['target_capability'] ?? null,
            'Ambiguous freelancer should receive clarification question on turn 1.'
        );
        $this->assertNotEmpty($response['quick_options']);

        // Test answering clarification with creative design option
        $sessionId = $response['session_id'];
        $stepResponse = $this->builder->step($sessionId, 'Design & Creative', 'act:freelance_creative');

        $this->assertTrue($stepResponse['ok']);
        $this->assertNotEquals(
            '__clarification:activity__',
            $stepResponse['target_capability'],
            'After clarification, system should advance to business capabilities.'
        );

        if ($stepResponse['target_capability'] === '__bundle__') {
            $this->assertTrue($stepResponse['is_multi']);
            $this->assertNotEmpty($stepResponse['quick_options']);
            $optionsJson = json_encode($stepResponse['quick_options']);
            $this->assertStringNotContainsString('table', $optionsJson);
            $this->assertStringNotContainsString('expiry', $optionsJson);
            $this->assertStringNotContainsString('serial', $optionsJson);
        } else {
            $this->assertContains(
                $stepResponse['target_capability'],
                ['recurring_billing', 'quotations_and_orders']
            );
        }
    }

    /**
     * Acceptance Check 7: Phone repair freelancer is recognized as repair technician.
     */
    public function test_phone_repair_freelancer_allows_repair_capabilities(): void
    {
        $prompt = 'I freelance doing mobile and phone repairs';
        $facts = $this->registry->detectStructuredFacts($prompt)['facts'];
        $profile = BusinessProfile::fromInitialInput($prompt, $facts);

        $this->assertTrue($profile->devices);
        $this->assertSame('phone_repair', $profile->businessType);

        $mergedFacts = array_merge($facts, $profile->facts);

        $repairEligibility = $this->registry->evaluateEligibility(
            'repair_job_tracking',
            $mergedFacts,
            $profile->preset,
            $profile->sector,
            $profile->businessType
        );
        $this->assertTrue($repairEligibility['eligible'], 'Repair job tracking should be eligible for phone repair freelancer.');

        // But restaurant tables remain ineligible
        $diningEligibility = $this->registry->evaluateEligibility(
            'table_and_kot_management',
            $mergedFacts,
            $profile->preset,
            $profile->sector,
            $profile->businessType
        );
        $this->assertFalse($diningEligibility['eligible'], 'Dining tables should still be ineligible.');
    }

    /**
     * Acceptance Check 8: Template confidence vs Activity confidence.
     */
    public function test_template_confidence_separated_from_activity_confidence(): void
    {
        // "freelancer": All candidates share 'freelancer' preset, but activity is uncertain
        $genericMatch = BusinessTypes::match('I am a freelancer');
        $this->assertTrue($genericMatch['template_confident'], 'Generic freelancer should have high template confidence.');
        $this->assertFalse($genericMatch['activity_confident'], 'Generic freelancer should have low activity confidence.');

        // "freelance designer": Specific activity matches graphic_designer
        $specificMatch = BusinessTypes::match('freelance graphic designer');
        $this->assertTrue($specificMatch['template_confident']);
        $this->assertTrue($specificMatch['activity_confident'], 'Specific graphic designer match should be activity confident.');
    }

    /**
     * Acceptance Check 9: Fact retention across multiple conversational turns.
     */
    public function test_facts_retained_across_turns(): void
    {
        $prompt = 'I am a freelance designer invoicing clients monthly.';
        $turn1 = $this->builder->startSession($prompt);
        $sessionId = $turn1['session_id'];

        $session = DiscoverySession::load($sessionId);
        $this->assertNotNull($session);
        $this->assertEquals('services', $session->structuredFacts['sells']['value'] ?? null);
        $this->assertTrue($session->structuredFacts['solo']['value'] ?? false);
        $this->assertEquals('monthly', $session->structuredFacts['billing_cadence']['value'] ?? null);

        // Turn 2
        $turn2 = $this->builder->step($sessionId, 'Yes, regular retainers', 'yes');
        $this->assertTrue($turn2['ok']);

        $sessionReloaded = DiscoverySession::load($sessionId);
        $this->assertEquals('services', $sessionReloaded->structuredFacts['sells']['value'] ?? null);
        $this->assertTrue($sessionReloaded->structuredFacts['solo']['value'] ?? false);
        $this->assertEquals('monthly', $sessionReloaded->structuredFacts['billing_cadence']['value'] ?? null);
        $this->assertContains('recurring_billing', $sessionReloaded->confirmed);
    }

    /**
     * Acceptance Check 10: System does not claim full understanding when ending on turn limit with low confidence.
     */
    public function test_reaches_question_limit_without_claiming_full_understanding(): void
    {
        $session = DiscoverySession::start('I am testing edge cases.', []);
        $session->systemReadinessConfidence = 0.45; // Low confidence
        $session->turnCount = $session->maxTurns();

        $response = $this->builder->finalizeProposal($session);

        $this->assertTrue($response['is_complete']);
        $this->assertStringContainsString('provisional setup', $response['assistant_message']);
        $this->assertStringNotContainsString('Great! I have all the details needed', $response['assistant_message']);
    }

    /**
     * Acceptance Check 11: Recurring billing question matches user specification.
     */
    public function test_recurring_billing_question_wording(): void
    {
        $all = $this->registry->allCapabilities();
        $recurring = $all['recurring_billing'] ?? [];

        $this->assertStringContainsString(
            'Do clients pay a fixed monthly retainer, or do you invoice each month for the work completed?',
            $recurring['question_template']
        );
        $this->assertArrayHasKey('automated_recurring_invoicing', $all);
    }

    /**
     * Acceptance Check 12: Retail store prompt end-to-end question selection.
     * When user enters "Retail store with counter POS, barcode scanning, stock tracking, and customer khata credit.",
     * system MUST ask retail questions (e.g. khata credit, counter POS, stock tracking),
     * and NEVER ask repair job tracking, dining tables, batch expiry or freelancer billing.
     */
    public function test_retail_store_asks_retail_questions_never_repairs_or_freelancing(): void
    {
        $prompt = 'Retail store with counter POS, barcode scanning, stock tracking, and customer khata credit.';
        
        $facts = $this->registry->detectStructuredFacts($prompt)['facts'];
        $this->assertEquals('goods', $facts['sells']['value'] ?? null);
        $this->assertTrue($facts['has_stock']['value'] ?? false);
        $this->assertTrue($facts['customer_credit']['value'] ?? false);
        $this->assertTrue($facts['counter']['value'] ?? false);

        $profile = BusinessProfile::fromInitialInput($prompt, $facts);
        $this->assertSame('goods', $profile->sells);
        $this->assertTrue($profile->hasStock);
        $this->assertSame('retail', $profile->sector);

        $mergedFacts = array_merge($facts, $profile->facts);

        // Verify that repair job tracking and dining tables are 100% ineligible
        $repairEligibility = $this->registry->evaluateEligibility(
            'repair_job_tracking',
            $mergedFacts,
            $profile->preset,
            $profile->sector,
            $profile->businessType
        );
        $this->assertFalse($repairEligibility['eligible'], 'repair_job_tracking must NOT be eligible for retail store.');

        $diningEligibility = $this->registry->evaluateEligibility(
            'table_and_kot_management',
            $mergedFacts,
            $profile->preset,
            $profile->sector,
            $profile->businessType
        );
        $this->assertFalse($diningEligibility['eligible'], 'table_and_kot_management must NOT be eligible for retail store.');

        $retainerEligibility = $this->registry->evaluateEligibility(
            'recurring_billing',
            $mergedFacts,
            $profile->preset,
            $profile->sector,
            $profile->businessType
        );
        $this->assertFalse($retainerEligibility['eligible'], 'recurring_billing must NOT be eligible for retail store.');

        // End-to-end discovery session start
        $start = $this->builder->startSession($prompt);
        $this->assertTrue($start['ok']);
        $this->assertFalse($start['is_complete']);

        // First question MUST be retail relevant
        $this->assertContains(
            $start['target_capability'],
            ['customer_khata_credit', 'counter_checkout', 'stock_volume', 'trade_pricing', 'multi_branch_warehouses', 'team_and_attendance']
        );
        $this->assertNotSame('repair_job_tracking', $start['target_capability']);
        $this->assertNotSame('table_and_kot_management', $start['target_capability']);
        $this->assertNotSame('recurring_billing', $start['target_capability']);
        $this->assertNotSame('counter_checkout', $start['target_capability'], 'Explicit counter POS must not be asked again.');
        $this->assertNotSame('customer_khata_credit', $start['target_capability'], 'Explicit khata credit must not be asked again.');

        // Turn 1 answer
        $turn1 = $this->builder->step($start['session_id'], 'Yes, they pay later', 'yes');
        $this->assertTrue($turn1['ok']);
        $this->assertNotSame('repair_job_tracking', $turn1['target_capability'] ?? null);
    }

    /**
     * Acceptance Check 13: Repair clarification option assigns valid 'repair_workshop' preset.
     */
    public function test_repair_clarification_assigns_valid_preset_and_stock(): void
    {
        $session = DiscoverySession::start('I work as a freelancer', [], null, BusinessProfile::fromInitialInput('I work as a freelancer'));

        $turn = $this->builder->step($session->sessionId, 'Repairs and technical', 'act:phone_repair');
        $this->assertTrue($turn['ok']);

        $reloaded = DiscoverySession::load($session->sessionId);
        $this->assertSame('repair_workshop', $reloaded->preset);
        $this->assertSame('repair_workshop', $reloaded->profile->preset);
        $this->assertTrue($reloaded->profile->hasStock, 'Repair trades must have hasStock = true');
    }

    public function test_generic_retail_stays_generic_and_requires_subtype_evidence(): void
    {
        $prompt = 'Retail store with counter POS, barcode scanning, stock tracking, and customer khata credit.';
        $extraction = $this->registry->detectStructuredFacts($prompt);
        $profile = BusinessProfile::fromInitialInput($prompt, $extraction['facts'], null, $extraction['detected_preset']);
        $facts = array_merge($extraction['facts'], $profile->facts);

        $this->assertNull($profile->businessType, 'Generic retail must not be mislabeled as grocery.');
        $this->assertSame('retail', $profile->sector);
        $this->assertSame('retail_shop', $profile->preset);

        foreach (['batch_expiry_tracking', 'serial_imei_tracking', 'product_variants', 'repair_job_tracking', 'recurring_billing'] as $capability) {
            $eligibility = $this->registry->evaluateEligibility(
                $capability, $facts, $profile->preset, $profile->sector, $profile->businessType
            );
            $this->assertFalse($eligibility['eligible'], "{$capability} needs subtype evidence for generic retail.");
        }

        $bundle = $this->registry->composeBundleQuestion(
            $facts, ['customer_khata_credit'], [], [], $profile->preset, $profile->sector, $profile->businessType
        );
        if ($bundle !== null) {
            foreach ($bundle['members'] as $member) {
                $this->assertNotContains($member, [
                    'batch_expiry_tracking', 'serial_imei_tracking', 'product_variants',
                    'repair_job_tracking', 'table_and_kot_management', 'recurring_billing',
                ]);
            }
        }
    }

    public function test_every_catalogue_type_obeys_sector_and_subtype_boundaries(): void
    {
        foreach (BusinessTypes::all() as $key => $type) {
            $prompt = (string) $type['label'];
            $extraction = $this->registry->detectStructuredFacts($prompt);
            $profile = BusinessProfile::fromInitialInput($prompt, $extraction['facts'], null, $extraction['detected_preset']);
            $facts = array_merge($extraction['facts'], $profile->facts);

            $match = BusinessTypes::match($prompt);
            $this->assertContains($key, $match['candidates'], "Catalogue candidate missing for {$key}");
            if ($profile->businessType !== $key) {
                $this->assertTrue($profile->isAmbiguousActivity(), "Ambiguous activity was silently accepted for {$key}");
                $optionKeys = array_column($profile->getClarificationQuestion()['options'], 'key');
                $this->assertContains("act:{$key}", $optionKeys, "Clarification cannot select {$key}");
            }

            // Evaluate the canonical type as if the user selected that exact
            // catalogue option. This makes every one of the 85 types exercise
            // the shared eligibility policy, including subtype capabilities.
            $profile->businessType = $key;
            $profile->sector = $type['sector'];
            $profile->preset = $type['preset'];
            $facts["type:{$key}"] = ['value' => true, 'confidence' => 1.0];
            $facts["sector:{$type['sector']}"] = ['value' => true, 'confidence' => 1.0];
            $facts['sells'] = ['value' => $type['sector'] === 'services' ? 'services' : 'goods', 'confidence' => 1.0];
            if (in_array($type['preset'], ['repair_workshop', 'field_service'], true)) {
                $facts['has_stock'] = ['value' => true, 'confidence' => 0.8];
            }

            $members = [];
            $first = $this->registry->selectNextCandidateQuestion(
                $facts, [], [], [], $profile->preset, $profile->sector, $profile->businessType
            );
            if ($first !== null) {
                $members[] = $first['key'];
            }
            $bundle = $this->registry->composeBundleQuestion(
                $facts, [], [], [], $profile->preset, $profile->sector, $profile->businessType
            );
            if ($bundle !== null) {
                $members = array_merge($members, $bundle['members']);
            }

            $isRepair = in_array($type['preset'], ['repair_workshop', 'field_service'], true);
            foreach (array_unique($members) as $member) {
                $cap = $this->registry->allCapabilities()[$member];
                if ($type['sector'] !== 'food') {
                    $this->assertNotSame('hospitality_dining', $cap['domain'], "{$key} received hospitality question {$member}");
                }
                if ($type['sector'] !== 'manufacturing' && $type['sector'] !== 'food') {
                    $this->assertNotSame('manufacturing_production', $cap['domain'], "{$key} received manufacturing question {$member}");
                }
                if ($type['sector'] !== 'services') {
                    $this->assertNotSame('services_invoicing', $cap['domain'], "{$key} received service-billing question {$member}");
                }
                if (!$isRepair) {
                    $this->assertNotSame('service_repairs', $cap['domain'], "{$key} received repair question {$member}");
                }
            }

            $modules = BusinessTypes::modulesFor($key);
            foreach (['serials' => 'serial_imei_tracking', 'batches_expiry' => 'batch_expiry_tracking', 'variants' => 'product_variants'] as $module => $capability) {
                if (in_array($module, $modules, true)) {
                    $eligibility = $this->registry->evaluateEligibility(
                        $capability, $facts, $profile->preset, $profile->sector, $profile->businessType
                    );
                    $this->assertTrue($eligibility['eligible'], "{$key} needs supported capability {$capability}");
                }
            }
        }
    }

    public function test_catalogue_has_positive_appointment_coverage_for_services(): void
    {
        foreach (BusinessTypes::all() as $key => $type) {
            if ($type['sector'] !== 'services') {
                continue;
            }
            $prompt = $type['aliases'][0] ?? $type['label'];
            $fast = $this->registry->detectStructuredFacts($prompt);
            $profile = BusinessProfile::fromInitialInput($prompt, $fast['facts'], null, $type['preset']);
            $facts = array_merge($fast['facts'], $profile->facts, [
                "type:{$key}" => ['value' => true, 'confidence' => 1.0],
                'sector:services' => ['value' => true, 'confidence' => 1.0],
                'sells' => ['value' => 'services', 'confidence' => 1.0],
            ]);
            $eligibility = $this->registry->evaluateEligibility(
                'appointment_scheduling', $facts, $type['preset'], 'services', $key
            );
            $this->assertTrue($eligibility['eligible'], "{$key} must be able to answer the booking question");
        }
    }

    public function test_generic_service_capabilities_do_not_leak_into_law_firm(): void
    {
        $facts = [
            'type:law_firm' => ['value' => true],
            'sector:services' => ['value' => true],
            'sells' => ['value' => 'services'],
        ];
        foreach (['counter_checkout', 'supplier_purchasing', 'trade_pricing'] as $capability) {
            $result = $this->registry->evaluateEligibility(
                $capability, $facts, 'professional_services', 'services', 'law_firm'
            );
            $this->assertFalse($result['eligible'], "Law firm must not receive {$capability} without explicit evidence");
        }
        $this->assertTrue($this->registry->evaluateEligibility(
            'appointment_scheduling', $facts, 'professional_services', 'services', 'law_firm'
        )['eligible']);
    }

    public function test_natural_walk_in_language_unlocks_counter_when_sector_default_denies_it(): void
    {
        foreach ([
            'I run a tailoring shop, customers come and pay.',
            'I run a tailoring shop and customers pay me at the shop.',
            'Meri tailoring ki dukaan hai, customer dukaan par pay karte hain.',
        ] as $prompt) {
            $fast = $this->registry->detectStructuredFacts($prompt);
            $this->assertTrue($fast['facts']['counter']['value'] ?? false, $prompt);
            $result = $this->registry->evaluateEligibility(
                'counter_checkout', $fast['facts'], 'tailoring', 'manufacturing', 'tailoring'
            );
            $this->assertTrue($result['eligible'], $prompt);
        }
    }

    public function test_manual_questionnaire_keeps_specialist_stock_questions_conditional(): void
    {
        $resolver = app(DiscoveryResolver::class);
        $serviceAnswers = ['sells' => ['time'], 'stock' => 'none'];
        $visibleKeys = array_column($resolver->visibleQuestions($serviceAnswers, 'professional_services'), 'key');

        $this->assertNotContains('stock_traits', $visibleKeys);
        $this->assertNotContains('buying', $visibleKeys);

        $modules = $resolver->impliedModules($serviceAnswers, 'professional_services');
        $this->assertContains('services', $modules);
        $this->assertContains('invoicing', $modules);
        $this->assertNotContains('serials', $modules);
        $this->assertNotContains('batches_expiry', $modules);
        $this->assertNotContains('variants', $modules);
    }

    public function test_confident_catalogue_identity_outranks_conflicting_keyword_trade(): void
    {
        foreach (['furniture workshop' => 'furniture_maker', 'leather workshop' => 'leather_goods'] as $prompt => $type) {
            $fast = $this->registry->detectStructuredFacts($prompt);
            $this->assertTrue($fast['facts']['trade:repairs']['value']);
            $profile = BusinessProfile::fromInitialInput($prompt, $fast['facts'], null, $fast['detected_preset']);
            $facts = array_merge($fast['facts'], $profile->facts);

            $this->assertSame($type, $profile->businessType);
            $this->assertFalse($facts['trade:repairs']['value']);
            $this->assertTrue($this->registry->evaluateEligibility(
                'recipe_and_bom', $facts, $profile->preset, $profile->sector, $profile->businessType
            )['eligible'], "{$prompt} must retain manufacturing/BOM capability");
        }
    }

    public function test_catalogue_reconciliation_preserves_supported_cross_sector_subtypes(): void
    {
        $cases = [
            ['medicine distributor', 'batch_expiry_tracking', 'pharma_wholesale'],
            ['electronics distributor', 'serial_imei_tracking', 'tech_distributor'],
            ['garment stockist', 'product_variants', 'fabric_stockist'],
        ];
        foreach ($cases as [$prompt, $capability, $type]) {
            $fast = $this->registry->detectStructuredFacts($prompt);
            $profile = BusinessProfile::fromInitialInput($prompt, $fast['facts'], null, $fast['detected_preset']);
            $facts = array_merge($fast['facts'], $profile->facts);
            $this->assertSame($type, $profile->businessType);
            $this->assertTrue($this->registry->evaluateEligibility(
                $capability, $facts, $profile->preset, $profile->sector, $profile->businessType
            )['eligible'], "{$prompt} must retain {$capability} from catalogue modules");
        }
    }

    public function test_explicit_mixed_business_keeps_second_trade_signal(): void
    {
        $prompt = 'I run a mobile shop and we also repair phones.';
        $fast = $this->registry->detectStructuredFacts($prompt);
        $profile = BusinessProfile::fromInitialInput($prompt, $fast['facts'], null, 'mobile_electronics');

        $this->assertTrue($profile->facts['trade:repairs']['value'] ?? false);
    }

    public function test_reconciled_false_trade_facts_cannot_unlock_trigger_escape_hatches(): void
    {
        $cases = [
            ['beauty products', 'appointment_scheduling', 'cosmetics'],
            ['pet food', 'table_and_kot_management', 'pet_supply'],
            ['pet food', 'food_delivery_dispatch', 'pet_supply'],
            ['furniture workshop', 'repair_job_tracking', 'furniture_maker'],
            ['furniture workshop', 'spare_parts_and_labour', 'furniture_maker'],
            ['leather workshop', 'repair_job_tracking', 'leather_goods'],
            ['leather workshop', 'spare_parts_and_labour', 'leather_goods'],
        ];

        foreach ($cases as [$prompt, $capability, $expectedType]) {
            $fast = $this->registry->detectStructuredFacts($prompt);
            $profile = BusinessProfile::fromInitialInput($prompt, $fast['facts'], null, $fast['detected_preset']);
            $facts = array_merge($fast['facts'], $profile->facts);
            $this->assertSame($expectedType, $profile->businessType);
            $result = $this->registry->evaluateEligibility(
                $capability, $facts, $profile->preset, $profile->sector, $profile->businessType
            );
            $this->assertFalse($result['eligible'], "{$prompt} incorrectly unlocked {$capability}");
        }
    }

    public function test_every_catalogue_alias_treats_reconciled_false_facts_as_no_evidence(): void
    {
        foreach (BusinessTypes::all() as $expectedType => $type) {
            foreach ($type['aliases'] as $alias) {
                $fast = $this->registry->detectStructuredFacts($alias);
                $profile = BusinessProfile::fromInitialInput($alias, $fast['facts'], null, $fast['detected_preset']);
                if (!$profile->activityConfident || $profile->businessType !== $expectedType) {
                    continue;
                }
                $facts = array_merge($fast['facts'], $profile->facts);
                $withoutFalse = array_filter($facts, fn ($fact) => !(
                    is_array($fact) && array_key_exists('value', $fact) && $fact['value'] === false
                ));
                foreach (array_keys($this->registry->allCapabilities()) as $capability) {
                    $actual = $this->registry->evaluateEligibility(
                        $capability, $facts, $profile->preset, $profile->sector, $profile->businessType
                    );
                    $control = $this->registry->evaluateEligibility(
                        $capability, $withoutFalse, $profile->preset, $profile->sector, $profile->businessType
                    );
                    $this->assertSame(
                        [$control['eligible'], $control['affinity_score']],
                        [$actual['eligible'], $actual['affinity_score']],
                        "False fact changed {$capability} for {$expectedType} alias '{$alias}'"
                    );
                }
            }
        }
    }

    public function test_every_preset_named_by_eligibility_gates_exists(): void
    {
        $configured = array_keys(config('ai_builder.presets', []));
        $reflection = new \ReflectionClass(CapabilityRegistry::class);
        foreach ($reflection->getReflectionConstants() as $constant) {
            if (!str_ends_with($constant->getName(), '_PRESETS')) {
                continue;
            }
            foreach ($constant->getValue() as $preset) {
                $this->assertContains($preset, $configured, "Dead eligibility preset: {$preset}");
            }
        }
    }

    public function test_every_sector_clarification_resolves_to_a_real_preset(): void
    {
        $configured = array_keys(config('ai_builder.presets', []));
        foreach (array_keys(BusinessTypes::sectors()) as $sector) {
            $preset = BusinessProfile::defaultPresetForSector($sector);
            $this->assertNotNull($preset, "No default preset for sector {$sector}");
            $this->assertContains($preset, $configured, "Dead sector preset {$preset}");
        }
        $this->assertSame('light_manufacturing', BusinessProfile::defaultPresetForSector('manufacturing'));
    }

    public function test_manufacturing_sector_choice_uses_manufacturing_workspace(): void
    {
        $gateway = \Mockery::mock(AiGateway::class);
        $gateway->shouldReceive('screen')->andReturnNull();
        $gateway->shouldReceive('resolve')->andReturn(AiResult::failure('test_fallback', 'Use deterministic fallback.'));
        $this->app->instance(AiGateway::class, $gateway);
        $builder = $this->app->make(ConversationalBuilderService::class);

        $start = $builder->startSession('I run a business and need help organising it.');
        $this->assertSame('__clarification:activity__', $start['target_capability']);
        $builder->step($start['session_id'], 'Making things', 'sector:manufacturing');

        $session = DiscoverySession::load($start['session_id']);
        $this->assertSame('manufacturing', $session->profile->sector);
        $this->assertSame('light_manufacturing', $session->preset);
        $this->assertSame('light_manufacturing', $session->profile->preset);
        $this->assertNotSame('retail_shop', $session->preset);
    }

    public function test_completed_session_emits_an_outcome_event(): void
    {
        Log::spy();
        $profile = BusinessProfile::fromInitialInput('I am a photographer');
        $session = new DiscoverySession(
            sessionId: 'outcome-test',
            preset: $profile->preset,
            profile: $profile,
            confirmed: ['appointment_scheduling'],
            rejected: ['counter_checkout'],
            skipped: ['team_and_attendance'],
            clarificationShown: true,
        );

        $this->builder->finalizeProposal($session);

        Log::shouldHaveReceived('info')->once()->with(
            'ai_builder.session_outcome',
            \Mockery::on(fn (array $data) =>
                $data['session_id'] === 'outcome-test'
                && $data['clarification_shown'] === true
                && in_array('appointment_scheduling', $data['confirmed_caps'], true)
                && in_array('services', $data['final_modules'], true)
            )
        );
    }

    public function test_unknown_business_clarifies_across_all_five_sectors(): void
    {
        $start = $this->builder->startSession('I run a business and need help organising it.');
        $this->assertSame('__clarification:activity__', $start['target_capability']);
        $keys = array_column($start['quick_options'], 'key');
        foreach (array_keys(BusinessTypes::sectors()) as $sector) {
            $this->assertContains("sector:{$sector}", $keys);
        }
    }

    public function test_something_else_waits_for_a_real_description(): void
    {
        $start = $this->builder->startSession('I run a business and need help organising it.');
        $again = $this->builder->step($start['session_id'], 'Something else', 'act:other');
        $this->assertSame('__clarification:activity__', $again['target_capability']);
        $this->assertStringContainsString('own words', $again['assistant_message']);
    }

    public function test_skipping_a_bundle_costs_only_one_turn(): void
    {
        $profile = BusinessProfile::fromInitialInput('retail store', [
            'trade:retail' => ['value' => true], 'sells' => ['value' => 'goods'],
        ], null, 'retail_shop');
        $session = DiscoverySession::start('retail store', $profile->facts, 'retail_shop', $profile);
        $session->currentQuestion = [
            'target_capability' => CapabilityRegistry::BUNDLE_KEY,
            'members' => ['counter_checkout', 'stock_volume', 'supplier_purchasing'],
            'message' => 'Which apply?', 'options' => [], 'consequences' => [], 'is_multi' => true,
        ];
        $session->save();

        $this->builder->step($session->sessionId, '', null, true);
        $reloaded = DiscoverySession::load($session->sessionId);
        $this->assertSame(1, $reloaded->turnCount);
        foreach ($session->currentQuestion['members'] as $member) {
            $this->assertContains($member, $reloaded->skipped);
        }
    }

    public function test_later_specific_description_updates_the_profile(): void
    {
        $profile = BusinessProfile::fromInitialInput('retail store', [
            'trade:retail' => ['value' => true], 'sells' => ['value' => 'goods'],
        ], null, 'retail_shop');

        $profile->updateFromTurn('Actually I work as a freelance graphic designer.');

        $this->assertSame('freelance_creative', $profile->businessType);
        $this->assertSame('services', $profile->sector);
        $this->assertSame('professional_services', $profile->preset);
        $this->assertSame('services', $profile->facts['sells']['value']);
    }

    public function test_explicit_business_correction_discards_old_sector_decisions(): void
    {
        $gateway = \Mockery::mock(AiGateway::class);
        $gateway->shouldReceive('screen')->andReturnNull();
        $gateway->shouldReceive('resolve')->andReturn(AiResult::failure('test_fallback', 'Use deterministic fallback.'));
        $this->app->instance(AiGateway::class, $gateway);
        $builder = $this->app->make(ConversationalBuilderService::class);

        $prompt = 'Retail store with counter POS, stock tracking, and customer khata credit.';
        $start = $builder->startSession($prompt);
        $session = DiscoverySession::load($start['session_id']);
        $this->assertContains('counter_checkout', $session->confirmed);
        $this->assertContains('customer_khata_credit', $session->confirmed);

        $turn = $builder->step(
            $start['session_id'],
            "No, I'm a freelance graphic designer."
        );
        $this->assertTrue($turn['ok']);

        $corrected = DiscoverySession::load($start['session_id']);
        $this->assertSame('freelance_creative', $corrected->profile->businessType);
        $this->assertSame('services', $corrected->profile->sector);
        $this->assertSame('professional_services', $corrected->preset);
        $this->assertNotContains('counter_checkout', $corrected->confirmed);
        $this->assertNotContains('customer_khata_credit', $corrected->confirmed);
        $this->assertArrayNotHasKey('trade:retail', $corrected->structuredFacts);
        $this->assertArrayNotHasKey('has_stock', $corrected->structuredFacts);
        $this->assertNotSame('counter_checkout', $turn['target_capability'] ?? null);
        $this->assertNotSame('customer_khata_credit', $turn['target_capability'] ?? null);
    }
}
