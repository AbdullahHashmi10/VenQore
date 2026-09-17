<?php

namespace Tests\Feature\Reckoner;

use App\Reckoner\CardRegistry;
use App\Reckoner\Measures;
use Tests\Fixtures\ReckonerGoldenStoreFixture;
use Tests\TestCase;

/**
 * Gate 2 Contract Validator Test per §7 Phase 2 of RECKONER_TRUTH_REBUILD_PLAN.md:
 * 1. 349 cards exist with unique keys in CardRegistry.
 * 2. Every card has a valid contract block with period_kind, unit, precision, tier, status.
 * 3. Every referenced measure exists in measures.json / Measures class.
 * 4. Unit vocabulary is strictly restricted to: currency | count | percent | ratio | days | hours | minutes | hour.
 * 5. Period kinds strictly: flow | as_of | live.
 * 6. Projection legality rules:
 *    - balance measure cannot be aggregated as a pure flow without closing balance.
 *    - distinct measure cannot be stored as a daily flow.
 * 7. Every verified card has a golden expected value in ReckonerGoldenStoreFixture::EXPECTED_VALUES.
 * 8. The matrix file can be regenerated cleanly from cards.json and measures.json with 0 diff.
 */
class CardContractValidatorTest extends TestCase
{
    public function test_catalogue_contains_exactly_349_unique_cards(): void
    {
        $cards = CardRegistry::all();
        $this->assertCount(349, $cards, 'CardRegistry must contain exactly 349 cards.');
        $this->assertCount(349, array_unique(array_keys($cards)), 'All 349 card keys must be unique.');
    }

    public function test_every_card_has_structured_contract_block(): void
    {
        $cards = CardRegistry::all();
        $requiredKeys = [
            'measures', 'projection', 'unit', 'precision',
            'period_kind', 'dims', 'tier', 'checks',
            'status', 'status_reason', 'definition_version',
        ];

        foreach ($cards as $key => $card) {
            $this->assertArrayHasKey('contract', $card, "Card '{$key}' must have a contract block.");
            $contract = $card['contract'];
            foreach ($requiredKeys as $rk) {
                $this->assertArrayHasKey($rk, $contract, "Card '{$key}' contract block missing '{$rk}'.");
            }
        }
    }

    public function test_every_referenced_measure_exists_in_measures_library(): void
    {
        $cards = CardRegistry::all();
        $allMeasures = Measures::all();
        $this->assertGreaterThanOrEqual(190, count($allMeasures), 'Measures catalogue should have >= 190 canonical measures.');

        foreach ($cards as $key => $card) {
            $measures = $card['contract']['measures'] ?? [];
            $this->assertNotEmpty($measures, "Card '{$key}' contract must reference at least one measure.");
            foreach ($measures as $mKey) {
                $this->assertTrue(
                    Measures::has($mKey),
                    "Card '{$key}' references non-existent measure '{$mKey}' in measures library."
                );
            }
        }
    }

    public function test_unit_vocabulary_is_strictly_canonical(): void
    {
        $allowedUnits = CardRegistry::ALLOWED_UNITS;
        $expectedVocabulary = ['currency', 'count', 'percent', 'ratio', 'days', 'hours', 'minutes', 'hour'];
        $this->assertSame($expectedVocabulary, $allowedUnits);

        foreach ($CardRegistry = CardRegistry::all() as $key => $card) {
            $cardUnit = $card['unit'];
            $contractUnit = $card['contract']['unit'];

            $this->assertContains(
                $cardUnit,
                $allowedUnits,
                "Card '{$key}' top-level unit '{$cardUnit}' is outside canonical vocabulary."
            );
            $this->assertContains(
                $contractUnit,
                $allowedUnits,
                "Card '{$key}' contract unit '{$contractUnit}' is outside canonical vocabulary."
            );
            $this->assertSame(
                $cardUnit,
                $contractUnit,
                "Card '{$key}' top-level unit must match contract unit."
            );
        }
    }

    public function test_projection_legality_rules(): void
    {
        $cards = CardRegistry::all();
        $measures = Measures::all();

        foreach ($cards as $key => $card) {
            $periodKind = $card['contract']['period_kind'];
            $this->assertContains(
                $periodKind,
                CardRegistry::ALLOWED_PERIOD_KINDS,
                "Card '{$key}' period_kind '{$periodKind}' is invalid."
            );

            foreach ($card['contract']['measures'] as $mKey) {
                $mKind = $measures[$mKey]['kind'] ?? 'flow';

                if ($mKind === 'balance') {
                    $this->assertNotSame(
                        'flow',
                        $periodKind,
                        "Legality violation: Card '{$key}' has flow period_kind but references balance measure '{$mKey}'."
                    );
                }

                if ($mKind === 'distinct') {
                    $this->assertNotSame(
                        'flow',
                        $periodKind,
                        "Legality violation: Card '{$key}' has flow period_kind but references distinct measure '{$mKey}'."
                    );
                }
            }
        }
    }

    public function test_every_verified_card_has_golden_expected_value(): void
    {
        $cards = CardRegistry::all();
        $expectedValues = ReckonerGoldenStoreFixture::EXPECTED_VALUES;

        $verifiedCount = 0;
        foreach ($cards as $key => $card) {
            $isVerified = ($card['contract_state'] ?? '') === 'verified'
                || ($card['contract']['status'] ?? '') === 'VERIFIED';

            if ($isVerified) {
                $verifiedCount++;
                $this->assertArrayHasKey(
                    $key,
                    $expectedValues,
                    "Verified card '{$key}' must have an expected value in ReckonerGoldenStoreFixture."
                );
                $this->assertNotNull($expectedValues[$key]);
            }
        }

        $this->assertGreaterThan(0, $verifiedCount, 'Must have at least one verified card.');
    }

    public function test_matrix_markdown_regenerates_cleanly_with_zero_diff(): void
    {
        $script = base_path('scripts/generate-matrix-markdown.php');
        $this->assertFileExists($script);

        $phpBinary = PHP_BINARY ?: 'E:\\Software\\Xampp\\php\\php.exe';
        $output = shell_exec("\"{$phpBinary}\" \"{$script}\" 2>&1");
        $this->assertNotNull($output);
        $this->assertStringContainsString('CLEAN: Regenerated matrix matches', $output);
        $this->assertStringContainsString('with 0 diff!', $output);
    }
}