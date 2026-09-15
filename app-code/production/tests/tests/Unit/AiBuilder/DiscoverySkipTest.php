<?php

namespace Tests\Unit\AiBuilder;

use App\Services\AiBuilder\CapabilityRegistry;
use App\Services\AiBuilder\DiscoverySession;
use Tests\TestCase;

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  Skipping a discovery question — the regression this file exists for.     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * selectNextCandidateQuestion() picks the highest-scoring capability that is
 * neither confirmed nor rejected. A skip resolves NEITHER, so before the
 * `skipped` list existed a skip changed no input the selector reads: it
 * re-picked the same capability and the visitor was handed back the question
 * they had just declined. From the builder screen that is indistinguishable
 * from the skip button being dead, which is exactly how it was reported.
 */
class DiscoverySkipTest extends TestCase
{
    private CapabilityRegistry $registry;

    /** A trade with more than one open question, so "the next one" exists. */
    private array $facts = [
        'trade:electronics' => [
            'value'      => true,
            'confidence' => 0.95,
            'source'     => 'user_keyword',
            'evidence'   => 'electronics',
        ],
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->registry = new CapabilityRegistry();
    }

    /**
     * The selector is deterministic: asked twice with the same inputs it gives
     * the same answer. That is not a bug on its own — it is the property that
     * made a state-less skip loop, and it is what the skipped list works
     * against, so it is worth pinning down before the fix is tested.
     */
    public function test_the_selector_repeats_itself_when_nothing_is_resolved(): void
    {
        $first = $this->registry->selectNextCandidateQuestion($this->facts, [], []);
        $repeat = $this->registry->selectNextCandidateQuestion($this->facts, [], []);

        $this->assertNotNull($first);
        $this->assertSame($first['key'], $repeat['key']);
    }

    /**
     * The fix: a skipped capability is passed back in and must not be offered
     * again, even though it was never confirmed or rejected.
     */
    public function test_a_skipped_capability_is_not_offered_again(): void
    {
        $first = $this->registry->selectNextCandidateQuestion($this->facts, [], []);
        $this->assertNotNull($first);

        $next = $this->registry->selectNextCandidateQuestion($this->facts, [], [], [$first['key']]);

        $this->assertNotNull($next, 'Electronics has more than one open question; the next one should be offered.');
        $this->assertNotSame(
            $first['key'],
            $next['key'],
            'A skipped question was handed straight back — the skip does nothing.'
        );
    }

    /**
     * Skipping everything has to terminate. A null candidate is what lets
     * ConversationalBuilderService::processTurn() finalise the proposal, so
     * this is the guarantee that the conversation cannot be skipped forever.
     */
    public function test_skipping_every_candidate_exhausts_the_selector(): void
    {
        $skipped = [];

        // Bounded well above the registry's size — the loop is expected to end
        // by running out of candidates, not by hitting this ceiling.
        for ($i = 0; $i < 200; $i++) {
            $next = $this->registry->selectNextCandidateQuestion($this->facts, [], [], $skipped);
            if ($next === null) {
                break;
            }
            $this->assertNotContains($next['key'], $skipped, 'The selector offered an already-skipped capability.');
            $skipped[] = $next['key'];
        }

        $this->assertNotEmpty($skipped);
        $this->assertNull($this->registry->selectNextCandidateQuestion($this->facts, [], [], $skipped));
    }

    /**
     * A skip costs a turn exactly like an answer does, so it cannot be used to
     * walk past MAX_TURNS for free — but it resolves nothing.
     */
    public function test_record_skip_costs_a_turn_and_resolves_nothing(): void
    {
        $session = new DiscoverySession(sessionId: 'test-session');
        $before = $session->turnCount;

        $session->recordSkip('loyalty_points');

        $this->assertSame($before + 1, $session->turnCount);
        $this->assertContains('loyalty_points', $session->skipped);
        $this->assertNotContains('loyalty_points', $session->confirmed);
        $this->assertNotContains('loyalty_points', $session->rejected);
    }

    /** The transcript keeps the row, flagged, rather than inventing an answer. */
    public function test_record_skip_leaves_an_honest_transcript_row(): void
    {
        $session = new DiscoverySession(sessionId: 'test-session');
        $session->recordSkip('loyalty_points');

        $last = end($session->history);

        $this->assertIsArray($last);
        $this->assertTrue($last['skipped'] ?? false);
        $this->assertSame('user', $last['role']);
        $this->assertSame(1, $last['turn']);
    }

    /** Skipping the same capability twice must not double-count it. */
    public function test_record_skip_does_not_duplicate_a_capability(): void
    {
        $session = new DiscoverySession(sessionId: 'test-session');
        $session->recordSkip('loyalty_points');
        $session->recordSkip('loyalty_points');

        $this->assertSame(['loyalty_points'], $session->skipped);
        $this->assertSame(2, $session->turnCount);
    }

    /** A skip with no active question still costs a turn and records nothing. */
    public function test_record_skip_tolerates_a_missing_capability(): void
    {
        $session = new DiscoverySession(sessionId: 'test-session');
        $session->recordSkip(null);

        $this->assertSame(1, $session->turnCount);
        $this->assertSame([], $session->skipped);
    }
}
