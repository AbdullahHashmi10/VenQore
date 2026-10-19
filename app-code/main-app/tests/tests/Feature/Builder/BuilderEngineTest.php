<?php

namespace Tests\Feature\Builder;

use App\Services\Builder\BuilderEngine;
use App\Services\Builder\BuilderPolicy;
use App\Services\Builder\BuilderSession;
use App\Services\Builder\CapabilityGate;
use PHPUnit\Framework\TestCase;

/**
 * BUILDER_FINAL_PLAN.md §12 — policy coverage, invariants, worked scenarios,
 * revision, property and preview-equals-provision tests.
 *
 * Pure PHP: no database, no framework boot. Expected outcomes are written from
 * the owner's TASKS (sell / refund, buy / return / owe, book / bill), not copied
 * from the rules table.
 */
class BuilderEngineTest extends TestCase
{
    private BuilderPolicy $policy;

    private BuilderEngine $engine;

    protected function setUp(): void
    {
        $this->policy = BuilderPolicy::fromDirectory(dirname(__DIR__, 4) . '/config');
        $this->engine = new BuilderEngine($this->policy);
    }

    /**
     * Drive a session to the end. $choose receives the screen and returns the option ids to tick,
     * 'skip', or 'unsure'. Returns the session.
     *
     * @param callable(array):(array|string) $choose
     */
    private function play(BuilderSession $s, callable $choose, int $limit = 12): BuilderSession
    {
        $this->engine->resolveConfirmCard($s, true);
        for ($i = 0; $i < $limit; $i++) {
            $step = $this->engine->step($s);
            if (! empty($step['done'])) {
                break;
            }
            $screen = $step['screen'];
            $pick = $choose($screen);
            $r = $this->engine->answer(
                $s, $screen['screen_id'], $screen['version'],
                is_array($pick) ? $pick : [], $pick === 'unsure', $pick === 'skip'
            );
            $this->assertArrayNotHasKey('error', $r);
        }

        return $s;
    }

    private function modules(BuilderSession $s): array
    {
        return $this->engine->modulesFor($s);
    }

    // ── 1. policy coverage ──────────────────────────────────────────────

    public function test_every_registry_module_has_a_policy_row_and_a_capability_row(): void
    {
        foreach (array_keys($this->policy->modules) as $m) {
            $this->assertArrayHasKey($m, $this->policy->modulePolicy, "{$m} has no module_policy row");
            $this->assertArrayHasKey($m, $this->policy->capabilities['modules'], "{$m} has no capability row");
        }
        $this->assertCount(48, $this->policy->modulePolicy);
    }

    public function test_all_85_business_types_have_hints_with_valid_facts_and_questions(): void
    {
        $types = require dirname(__DIR__, 4) . '/config/business_types.php';
        $this->assertCount(85, $this->policy->typeHints);
        foreach (array_keys($types['types']) as $k) {
            $this->assertArrayHasKey($k, $this->policy->typeHints, "{$k} missing from type_hints");
            foreach ($this->policy->typeHints[$k]['template'] as $f) {
                $this->assertTrue($this->policy->validFact($f), "{$k}: unknown template fact {$f}");
            }
            foreach ($this->policy->typeHints[$k]['raise'] as $q) {
                $this->assertNotNull($this->policy->panel($q), "{$k}: unknown question {$q}");
            }
        }
    }

    public function test_every_option_writes_known_facts_and_every_workflow_is_reachable(): void
    {
        $writable = [];
        foreach ($this->policy->panels() as $pid => $panel) {
            foreach ($panel['options'] as $oid => $o) {
                foreach ($o['writes'] as $f => $v) {
                    $this->assertTrue($this->policy->validFact($f), "{$pid}.{$oid} writes unknown fact {$f}");
                    $writable[$f] = true;
                }
                $this->assertTrue(! empty($o['writes']) || isset($o['explain']) || $oid === 'basics',
                    "{$pid}.{$oid} writes nothing");
            }
        }
        // Every fact named in a workflow condition must be writable by some option or be derived/dynamic.
        $json = json_encode($this->policy->workflows['workflows']);
        preg_match_all('/"((?:activity|sale|work|items|money|id|place|people|tax|fin|make|food|channel|repeat|offer|job)\.[a-z_]+)(?:=[a-z]+)?"/', $json, $m);
        foreach (array_unique($m[1]) as $f) {
            $this->assertTrue($this->policy->validFact($f), "workflow condition uses unknown fact {$f}");
            $this->assertArrayHasKey($f, $writable, "no question can ever set {$f}");
        }
        foreach ($this->policy->workflows['workflows'] as $wid => $w) {
            foreach ($w['modules'] ?? [] as $mod) {
                $this->assertArrayHasKey($mod, $this->policy->modules, "{$wid}: unknown module {$mod}");
            }
        }
    }

    // ── 2. invariants ───────────────────────────────────────────────────

    public function test_skip_is_never_a_negative(): void
    {
        $s = $this->engine->start(null, 'fashion');
        $this->play($s, fn () => 'skip');
        foreach ($s->facts->all() as $k => $r) {
            $this->assertNotSame('negative', $r['status'], "skipping made {$k} a negative");
        }
    }

    public function test_none_of_these_rejects_only_the_options_shown(): void
    {
        $s = $this->engine->start('We sell clothes. We have sizes and colours.', 'fashion');
        $this->engine->resolveConfirmCard($s, true);
        $this->assertTrue($s->facts->isTrue('id.variants'));
        $this->play($s, function ($screen) {
            return $screen['panels'][0]['id'] === 'Q3' ? ['Q3.resale_stock'] : 'skip';
        });
        // Q5 never offered variants (already known), so nothing could have negated it.
        $this->assertTrue($s->facts->isTrue('id.variants'));
    }

    public function test_purchase_orders_always_come_with_purchasing(): void
    {
        foreach (['money.supplier_later', null] as $credit) {
            $s = $this->engine->start(null, 'grocery');
            $this->play($s, function ($screen) use ($credit) {
                return match ($screen['panels'][0]['id']) {
                    'Q2g' => ['Q2g.counter'], 'Q3' => ['Q3.resale_stock'],
                    'Q4' => $credit ? ['Q4.supplier_later'] : ['Q4.paid_in_full'],
                    default => 'skip',
                };
            });
            $m = $this->modules($s);
            foreach (['purchases', 'suppliers', 'purchase_orders', 'purchase_returns'] as $need) {
                $this->assertContains($need, $m, "{$need} missing (credit=" . json_encode($credit) . ')');
            }
        }
    }

    public function test_accountant_deposit_and_staff_do_not_imply_loans_reserved_stock_or_attendance(): void
    {
        $s = $this->engine->start(null, 'consultant');
        $this->play($s, function ($screen) {
            return match ($screen['panels'][0]['id']) {
                'Q2s' => ['Q2s.bill'], 'Q4' => ['Q4.advances'], 'Q6a', 'Q6b' => ['Q6b.roles'],
                default => 'skip',
            };
        });
        $m = $this->modules($s);
        $this->assertNotContains('loans', $m);
        $this->assertNotContains('pre_sales', $m);
        $this->assertNotContains('staff_attendance', $m);
    }

    public function test_cashless_counter_gets_no_cash_register(): void
    {
        $s = $this->engine->start(null, 'cafe');
        $this->play($s, function ($screen) {
            return match ($screen['panels'][0]['id']) {
                'Q2g' => ['Q2g.counter'], 'Q4' => ['Q4.paid_in_full', 'Q4till.no'],
                default => 'skip',
            };
        });
        $this->assertContains('pos', $this->modules($s));
        $this->assertNotContains('cash_register', $this->modules($s));
    }

    // ── 3. worked scenarios ─────────────────────────────────────────────

    public function test_grocery_one_shop_buys_stock_pays_later_customers_pay_later(): void
    {
        $s = $this->engine->start('We have one shop and our prices include tax.', 'grocery');
        $this->play($s, function ($screen) {
            return match ($screen['panels'][0]['id']) {
                'Q2g' => ['Q2g.counter'], 'Q3' => ['Q3.resale_stock'],
                'Q4' => ['Q4.customer_later', 'Q4.supplier_later', 'Q4till.yes'],
                'Q5' => ['Q5.pack_convert', 'Q5.scan_labels'],
                default => 'skip',
            };
        });
        $m = $this->modules($s);
        foreach (['pos', 'park_recall', 'sales_returns', 'cash_register', 'inventory', 'stock_takes', 'purchases',
            'purchase_orders', 'purchase_returns', 'suppliers', 'khata_credit', 'customers', 'units_of_measure',
            'barcodes_labels', 'tax_compliance', 'reports', 'expenses', 'ai_insights'] as $need) {
            $this->assertContains($need, $m, "grocery missing {$need}");
        }
        foreach (['batches_expiry', 'multi_location', 'stock_transfers', 'table_service', 'services', 'serials'] as $no) {
            $this->assertNotContains($no, $m, "grocery should not have {$no}");
        }
        $this->assertLessThanOrEqual(8, $s->screensShown);
        $r = $this->engine->review($s);
        $this->assertStringContainsString('one place', $r['summary']);
        $this->assertStringContainsString('prices include tax', $r['summary']);
    }

    public function test_plumber_gets_jobs_billing_and_materials_but_no_till(): void
    {
        $s = $this->engine->start(null, 'plumber');
        $this->play($s, function ($screen) {
            return match ($screen['panels'][0]['id']) {
                'Q2s' => ['Q2s.job_tracked', 'Q2s.bill'], 'Q3' => ['Q3.work_materials'],
                'Q4' => ['Q4.customer_later'], 'Q5' => ['Q5.measured'],
                default => 'skip',
            };
        });
        $m = $this->modules($s);
        foreach (['services', 'invoicing', 'customers', 'purchases', 'purchase_orders', 'inventory', 'units_of_measure', 'khata_credit'] as $need) {
            $this->assertContains($need, $m);
        }
        foreach (['pos', 'table_service', 'cookbook', 'multi_location'] as $no) {
            $this->assertNotContains($no, $m);
        }
    }

    public function test_skip_all_boutique_is_labelled_assumptions_and_never_tailored(): void
    {
        $s = $this->engine->start(null, 'fashion');
        $this->play($s, fn () => 'skip');
        $r = $this->engine->review($s);
        $this->assertSame('Starting setup with assumptions', $r['label']);
        $this->assertNotEmpty($r['assumptions']);
        $this->assertNotContains('variants', $this->modules($s), 'variants must not be guessed from "fashion"');
    }

    public function test_hire_estimates_and_proposals_are_kept_as_coming_soon_gaps(): void
    {
        $s = $this->engine->start(null, 'equipment_rental');
        $this->play($s, fn () => 'skip');
        $r = $this->engine->review($s);
        $this->assertContains('hire', array_column($r['gaps'], 'need'));
        $this->assertSame("Part of what you need isn't available yet", $r['label']);

        $s2 = $this->engine->start(null, 'consultant');
        $this->play($s2, function ($screen) {
            return match ($screen['panels'][0]['id']) {
                'Q2s' => ['Q2s.bill'], default => 'skip',
            };
        });
        $this->engine->revise($s2, 'offer.estimate', true);
        $this->engine->revise($s2, 'offer.formal_proposal', true);
        $r2 = $this->engine->review($s2);
        $needs = array_column($r2['gaps'], 'need');
        $this->assertContains('estimates', $needs);
        $this->assertContains('proposals', $needs);
        $this->assertNotContains('quotations', $r2['modules']);
        $this->assertNotContains('b2b_proposals', $r2['modules']);
    }

    public function test_online_shop_and_qr_menu_are_gifts_added_unpublished_by_active_choice(): void
    {
        $s = $this->engine->start(null, 'grocery');
        $this->play($s, fn ($screen) => $screen['panels'][0]['id'] === 'Q2g' ? ['Q2g.counter'] : 'skip');
        $r = $this->engine->review($s);
        $this->assertNotContains('online_store', $r['modules']);
        $this->assertContains('ai_insights', $r['modules']);

        $r = $this->engine->override($s, 'online_store', 'add');
        $this->assertContains('online_store', $r['modules']);
        $this->assertContains('online_store', $r['unpublished']);
        $this->assertContains('products', $r['modules']);
    }

    public function test_conflict_between_supplied_by_other_and_pays_suppliers_is_asked_first(): void
    {
        $s = $this->engine->start(null, 'grocery');
        $s->facts->set('items.supplied_by_other', true, 'answer');
        $s->facts->set('money.supplier_later', true, 'answer');
        $step = $this->engine->step($s);
        $this->assertSame('C1', $step['screen']['panels'][0]['id']);
        $r = $this->engine->answer($s, $step['screen']['screen_id'], $step['screen']['version'], ['C1.sent']);
        $this->assertSame([], $s->facts->conflicts());
    }

    public function test_pure_service_charged_on_the_spot_uses_quick_invoice_until_pos_is_verified(): void
    {
        $s = $this->engine->start(null, 'salon_barber');
        $this->play($s, fn ($screen) => $screen['panels'][0]['id'] === 'Q2s' ? ['Q2s.on_the_spot', 'Q2s.booking'] : 'skip');
        $m = $this->modules($s);
        $this->assertContains('invoicing', $m);
        $this->assertNotContains('pos', $m);   // capabilities.flags.pos_pure_service = false
    }

    // ── 4. revision / overrides ─────────────────────────────────────────

    public function test_revision_recomputes_and_leaves_no_stale_modules(): void
    {
        $s = $this->engine->start(null, 'grocery');
        $this->play($s, function ($screen) {
            return match ($screen['panels'][0]['id']) {
                'Q2g' => ['Q2g.counter'], 'Q3' => ['Q3.resale_stock'], 'Q4' => ['Q4.supplier_later'],
                default => 'skip',
            };
        });
        $this->assertContains('khata_credit', $this->modules($s));
        $r = $this->engine->revise($s, 'money.supplier_later', false);
        $this->assertNotContains('khata_credit', $r['modules']);
        $this->assertContains('purchase_orders', $r['modules']);   // POs survive: they never depended on terms
        $r = $this->engine->revise($s, 'items.resale_stock', false);
        foreach (['purchases', 'purchase_orders', 'inventory'] as $gone) {
            $this->assertNotContains($gone, $r['modules']);
        }
    }

    public function test_removing_a_hard_dependency_explains_instead_of_breaking(): void
    {
        $s = $this->engine->start(null, 'grocery');
        $this->play($s, function ($screen) {
            return match ($screen['panels'][0]['id']) {
                'Q2g' => ['Q2g.counter'], 'Q3' => ['Q3.resale_stock'], default => 'skip',
            };
        });
        $r = $this->engine->override($s, 'suppliers', 'remove');
        $this->assertContains('suppliers', $r['modules']);
        $this->assertNotEmpty($r['conflicts']);
        $this->assertStringContainsString('needs', $r['conflicts'][0]['message']);
    }

    // ── opening description is understood, not re-asked ────────────────

    public function test_auto_parts_distributor_opening_is_read_in_full(): void
    {
        $s = $this->engine->start('Auto parts distributor with 10,000 SKUs across two warehouses, counter sales for walk-ins, and tiered credit accounts for repair shops.');
        $this->engine->resolveConfirmCard($s, true);

        $this->assertTrue($s->facts->isTrue('activity.goods'));
        $this->assertTrue($s->facts->isTrue('items.resale_stock'));
        $this->assertSame('separate', $s->facts->value('place.stock_counts'));
        $this->assertTrue($s->facts->isTrue('sale.counter'));
        $this->assertTrue($s->facts->isTrue('money.customer_later'));
        // Repair shops are the customers; the distributor does not do repairs.
        $this->assertFalse($s->facts->known('activity.services'));

        $asked = [];
        $this->play($s, function ($screen) use (&$asked) {
            $asked[] = $screen['panels'][0]['id'];

            return $screen['panels'][0]['id'] === 'C2' ? ['C2.both'] : 'skip';
        });
        $this->assertSame('C2', $asked[0], 'the ambiguous "tiered" should be the first thing asked');
        foreach (['Q1', 'Q2g', 'Q2s', 'Q3', 'Q6a'] as $already) {
            $this->assertNotContains($already, $asked, "{$already} was already answered by the opening");
        }
        $this->assertTrue($s->facts->isTrue('repeat.group_prices'));
        $m = $this->modules($s);
        foreach (['pos', 'inventory', 'khata_credit', 'customers', 'multi_location'] as $need) {
            $this->assertContains($need, $m, "distributor missing {$need}");
        }
        $this->assertNotContains('services', $m);
    }

    public function test_own_repair_shop_is_a_service_but_customer_repair_shops_are_not(): void
    {
        $own = $this->engine->extractor->extract('I run a phone repair shop', false);
        $this->assertContains('activity.services', array_column($own, 'fact'));

        $theirs = $this->engine->extractor->extract('We sell tyres to repair shops and garages', false);
        $this->assertNotContains('activity.services', array_column($theirs, 'fact'));
        $this->assertContains('activity.goods', array_column($theirs, 'fact'));
    }

    /** An engine whose "AI" replays a recorded reply, cleaned exactly as AiFactReader cleans a real one. */
    private function engineWithAi(array $reply): BuilderEngine
    {
        $policy = $this->policy;
        $clean = (new \ReflectionClass(\App\Services\Builder\AiFactReader::class))->newInstanceWithoutConstructor();
        (fn () => $this->policy = $policy)->call($clean);

        return new BuilderEngine($policy, null, fn (string $t, string $c = '') => $clean->sanitise($reply));
    }

    public function test_ai_clarifying_question_becomes_the_first_screen_and_replaces_the_hand_written_one(): void
    {
        $e = $this->engineWithAi([
            'facts' => [['fact' => 'activity.goods', 'value' => true], ['fact' => 'money.customer_later', 'value' => true]],
            'heard' => 'You distribute auto parts from two warehouses to walk-ins and repair shops on credit.',
            'ask' => ['question' => 'For repair-shop accounts, do the tiers change prices, credit terms, or both?', 'options' => [
                ['label' => 'Prices', 'sets' => ['repeat.group_prices' => true]],
                ['label' => 'Credit terms', 'sets' => ['repeat.group_prices' => false]],
                ['label' => 'Both', 'sets' => ['repeat.group_prices' => true, 'invented.key' => true]],
            ]],
        ]);
        $s = $e->start('Auto parts distributor with 10,000 SKUs across two warehouses, counter sales for walk-ins, and tiered credit accounts for repair shops.');
        $e->resolveConfirmCard($s, true);
        $step = $e->step($s);
        $this->assertStringContainsString('auto parts', $step['heard']);
        $this->assertSame('A1', $step['screen']['panels'][0]['id']);
        $this->assertCount(1, $step['screen']['panels'], 'C2 asks the same thing and must not be shown too');
        $e->answer($s, $step['screen']['screen_id'], $step['screen']['version'], ['A1.o3']);
        $this->assertTrue($s->facts->isTrue('repeat.group_prices'));
        $this->assertFalse($s->facts->known('invented.key'));
        $this->assertNotSame('C2', $e->step($s)['screen']['panels'][0]['id'] ?? null);
    }

    public function test_an_ai_question_that_sets_nothing_real_is_never_shown(): void
    {
        $e = $this->engineWithAi(['facts' => [], 'ask' => ['question' => 'What is your favourite colour?', 'options' => [
            ['label' => 'Red', 'sets' => ['colour.red' => true]], ['label' => 'Blue', 'sets' => ['activity.goods' => 'blue']],
        ]]]);
        $s = $e->start('We run a small shop');
        $this->assertSame([], $s->aiPanels);
    }

    public function test_let_me_explain_text_is_read_and_settles_later_questions(): void
    {
        $e = $this->engineWithAi(['facts' => [['fact' => 'activity.hire', 'value' => true], ['fact' => 'activity.goods', 'value' => true]]]);
        $s = $e->start(null);
        $step = $e->step($s);
        $this->assertSame('Q1', $step['screen']['panels'][0]['id']);
        $e->answer($s, 'Q1', $step['screen']['version'], ['Q1.other'], false, false, 'We rent out party chairs and also sell decorations');
        $this->assertTrue($s->facts->isTrue('activity.hire'));
        $this->assertTrue($s->facts->isTrue('activity.goods'));
    }

    public function test_type_pick_without_words_costs_no_ai_call_and_still_says_what_it_heard(): void
    {
        $calls = 0;
        $e = new BuilderEngine($this->policy, null, function () use (&$calls) {
            $calls++;

            return [];
        });
        $s = $e->start(null, 'grocery');
        $this->assertSame(0, $calls);
        $this->assertStringContainsString('You picked', $e->step($s)['heard']);
    }

    public function test_negation_does_not_cross_a_comma(): void
    {
        $f = array_column($this->engine->extractor->extract("We don't sell on credit, single shop grocery", false), 'value', 'fact');
        $this->assertFalse($f['money.customer_later']);
        $this->assertSame('one', $f['place.stock_counts']);
    }

    public function test_owner_added_module_always_wins_with_its_dependencies(): void
    {
        $s = $this->engine->start(null, 'consultant');
        $r = $this->engine->override($s, 'bank_reconciliation', 'add');
        $this->assertContains('bank_reconciliation', $r['modules']);
        $this->assertContains('bank_accounts', $r['modules']);
    }

    public function test_sentence_and_type_routes_reach_the_same_modules_for_the_same_facts(): void
    {
        $a = $this->engine->start('We have one shop. Customers pay later.', 'grocery');
        $b = $this->engine->start(null, 'grocery');
        $this->engine->resolveConfirmCard($a, true);
        $b->facts->set('place.stock_counts', 'one', 'answer');
        $b->facts->set('money.customer_later', true, 'answer');
        $ma = $this->modules($a);
        $mb = $this->modules($b);
        sort($ma);
        sort($mb);
        $this->assertSame($mb, $ma);
    }

    // ── 5. property test ────────────────────────────────────────────────

    public function test_random_answer_skip_unsure_sequences_hold_every_invariant(): void
    {
        mt_srand(20261014);
        $types = array_keys($this->policy->typeHints);
        for ($run = 0; $run < 200; $run++) {
            $type = $types[mt_rand(0, count($types) - 1)];
            $s = $this->engine->start(null, $type);
            for ($i = 0; $i < 14; $i++) {
                $step = $this->engine->step($s);
                if (! empty($step['done'])) {
                    break;
                }
                $screen = $step['screen'];
                $roll = mt_rand(0, 9);
                $pick = [];
                if ($roll === 0) {
                    $pick = 'skip';
                } elseif ($roll === 1) {
                    $pick = 'unsure';
                } else {
                    foreach ($screen['panels'] as $p) {
                        $opts = array_column($p['options'], 'id');
                        if ($p['kind'] === 'single') {
                            $pick[] = $opts[mt_rand(0, count($opts) - 1)];
                        } else {
                            foreach ($opts as $o) {
                                if (mt_rand(0, 2) === 0) {
                                    $pick[] = $o;
                                }
                            }
                        }
                    }
                }
                $this->engine->answer($s, $screen['screen_id'], $screen['version'],
                    is_array($pick) ? $pick : [], $pick === 'unsure', $pick === 'skip');
            }
            $this->assertLessThanOrEqual(10, $s->screensShown, "{$type} run {$run}: more than 10 screens");

            $r = $this->engine->review($s);
            $set = array_flip($r['modules']);
            foreach ($r['modules'] as $m) {
                $def = $this->policy->modules[$m];
                $this->assertSame('live', $def['status'], "{$type}: non-live {$m} composed");
                $this->assertNotSame('blocked', $this->policy->capabilities['modules'][$m]['state'], "{$type}: blocked {$m} composed");
                foreach ($def['requires'] ?? [] as $dep) {
                    $this->assertArrayHasKey($dep, $set, "{$type} run {$run}: {$m} composed without {$dep}");
                }
                foreach ((array) ($def['requires_one'] ?? []) as $group) {
                    $group = is_array(reset($def['requires_one'])) ? $group : $def['requires_one'];
                    $this->assertNotEmpty(array_intersect((array) $group, $r['modules']), "{$type}: {$m} lacks one of its group");
                    break;
                }
            }
            foreach (['expenses', 'reports', 'payments', 'ai_insights'] as $base) {
                $this->assertArrayHasKey($base, $set);
            }
            $this->assertSame($r['modules'], $this->engine->modulesFor($s), 'preview must equal provisioned list');
            // a confirmed workflow always has its companions
            if (isset($set['purchases'])) {
                foreach (['suppliers', 'purchase_orders', 'purchase_returns'] as $c) {
                    $this->assertArrayHasKey($c, $set, "{$type}: purchases without {$c}");
                }
            }
            if (isset($set['pos'])) {
                foreach (['park_recall', 'sales_returns'] as $c) {
                    $this->assertArrayHasKey($c, $set, "{$type}: pos without {$c}");
                }
            }
            foreach ($s->facts->all() as $k => $f) {
                if (($f['asked'] ?? null) !== null) {
                    $this->assertNotSame('negative', $f['status'], "{$type}: skipped {$k} became negative");
                }
            }
        }
    }

    // ── 6. counts, stop rule, preview ───────────────────────────────────

    public function test_every_business_type_finishes_within_ten_screens_even_with_everything_answered_yes(): void
    {
        foreach (array_keys($this->policy->typeHints) as $type) {
            $s = $this->engine->start(null, $type);
            $this->play($s, function ($screen) {
                $pick = [];
                foreach ($screen['panels'] as $p) {
                    $first = array_column($p['options'], 'id');
                    $pick[] = $first[0];
                }

                return $pick;
            }, 14);
            $this->assertLessThanOrEqual(10, $s->screensShown, $type);
        }
    }

    public function test_preview_is_offered_after_three_screens_and_retries_do_not_count(): void
    {
        $s = $this->engine->start(null, null);
        $a = $this->engine->step($s);
        $b = $this->engine->step($s);   // same pending screen re-served
        $this->assertSame($a['screen']['screen_id'], $b['screen']['screen_id']);
        $this->assertSame(1, $s->screensShown);
        $this->assertFalse($b['preview_available']);

        $this->engine->answer($s, $a['screen']['screen_id'], $a['screen']['version'], ['Q1.goods']);
        for ($i = 0; $i < 2; $i++) {
            $st = $this->engine->step($s);
            $this->engine->answer($s, $st['screen']['screen_id'], $st['screen']['version'], [], false, true);
        }
        $this->assertTrue($this->engine->step($s)['preview_available']);
        $this->assertSame('Starting setup with assumptions', $this->engine->review($s)['label']);
    }

    public function test_skipping_the_first_question_asks_it_once_more_then_stops_without_guessing(): void
    {
        $s = $this->engine->start(null, null);
        $st = $this->engine->step($s);
        $this->engine->answer($s, $st['screen']['screen_id'], $st['screen']['version'], [], false, true);
        $again = $this->engine->step($s);
        $this->assertSame('Q1', $again['screen']['panels'][0]['id']);
        $this->assertTrue($again['screen']['reask']);
        $this->engine->answer($s, $again['screen']['screen_id'], $again['screen']['version'], [], false, true);
        $this->play($s, fn () => 'skip');
        $this->assertLessThanOrEqual(10, $s->screensShown);
        $this->assertSame([], array_values(array_filter($this->modules($s), fn ($m) => in_array($m, ['pos', 'products', 'services'], true))));
    }

    public function test_stale_answers_are_rejected(): void
    {
        $s = $this->engine->start(null, null);
        $st = $this->engine->step($s);
        $r = $this->engine->answer($s, $st['screen']['screen_id'], $st['screen']['version'] + 5, ['Q1.goods']);
        $this->assertSame('stale_screen', $r['error']);
    }

    public function test_launch_gate_report_lists_modules_still_unwalked(): void
    {
        // Not a failure today: it is the Phase 0 to-do list. Becomes a failure at launch.
        $left = (new CapabilityGate($this->policy))->unverified();
        fwrite(STDERR, "\n[launch gate] " . count($left) . " modules still registry_live (Phase 0 walk-through pending)\n");
        $this->assertIsArray($left);
    }
}
