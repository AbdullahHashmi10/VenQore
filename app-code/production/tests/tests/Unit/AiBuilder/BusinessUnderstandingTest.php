<?php

namespace Tests\Unit\AiBuilder;

use App\Services\Ai\AiGateway;
use App\Services\Ai\AiRequest;
use App\Services\Ai\AiResult;
use App\Services\AiBuilder\BusinessUnderstanding;
use App\Services\AiBuilder\ModuleManifest;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * A gateway that answers with whatever the test decides, and remembers what it
 * was asked. No network, no spend, no model — what is under test is the
 * boundary around the model, not the model.
 */
class FakeAiGateway extends AiGateway
{
    /** @var AiRequest[] */
    public array $seen = [];

    /** @var AiResult|\Closure */
    private $answer;

    public function __construct(AiResult|\Closure $answer)
    {
        $this->answer = $answer;
    }

    public function resolve(AiRequest $request): AiResult
    {
        $this->seen[] = $request;

        return $this->answer instanceof \Closure ? ($this->answer)($request) : $this->answer;
    }
}

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  The model proposes; the manifest disposes.                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * The builder used to understand a business by running str_contains() over
 * hand-written phrase lists. These tests cover what replaced it — and, more
 * importantly, the guarantees around it: an invented module key never reaches a
 * workspace, a refusal degrades to the deterministic path rather than a broken
 * page, and one sentence is paid for once.
 */
class BusinessUnderstandingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function reader(AiResult|\Closure $answer): array
    {
        $gateway = new FakeAiGateway($answer);

        return [new BusinessUnderstanding($gateway, new ModuleManifest()), $gateway];
    }

    private function answers(array $payload): AiResult
    {
        return AiResult::success($payload);
    }

    public function test_it_reads_a_sentence_into_modules_with_reasons(): void
    {
        [$reader] = $this->reader($this->answers([
            'trade'   => 'plumbing services',
            'sells'   => 'services',
            'scale'   => 'solo',
            'modules' => [
                ['key' => 'services', 'why' => 'you do plumbing jobs rather than sell goods'],
                ['key' => 'expenses', 'why' => 'you said you want to track what you spend'],
            ],
            'confidence' => 0.9,
        ]));

        $understanding = $reader->read('I am a plumber, I work alone, I want to track expenses');

        $this->assertNotNull($understanding);
        $this->assertSame(['services', 'expenses'], $understanding['modules']);
        $this->assertArrayHasKey('services', $understanding['reasons']);
        $this->assertSame('solo', $understanding['scale']);
        $this->assertSame('plumbing services', $understanding['trade']);
    }

    /** Scale becomes a fact the rest of the builder speaks — with no phrase list. */
    public function test_solo_becomes_a_structured_fact(): void
    {
        [$reader] = $this->reader($this->answers([
            'scale'   => 'solo',
            'modules' => [['key' => 'services', 'why' => 'the work you do']],
        ]));

        $facts = $reader->toFacts($reader->read('there is only me, no staff at all'));

        $this->assertTrue($facts['solo']['value']);
        $this->assertSame('understanding', $facts['solo']['source']);
    }

    public function test_invented_module_keys_never_survive(): void
    {
        [$reader] = $this->reader($this->answers([
            'modules' => [
                ['key' => 'expenses', 'why' => 'real'],
                ['key' => 'crypto_wallet', 'why' => 'invented'],
                ['key' => 'expenses', 'why' => 'duplicate'],
            ],
        ]));

        $this->assertSame(['expenses'], $reader->read('a shop')['modules']);
    }

    public function test_a_reason_cannot_carry_markup_or_a_link(): void
    {
        [$reader] = $this->reader($this->answers([
            'modules' => [['key' => 'reports', 'why' => 'see https://evil.tld <script>alert(1)</script> **now**']],
        ]));

        $why = $reader->read('a shop')['reasons']['reports'];

        $this->assertStringNotContainsString('http', $why);
        $this->assertStringNotContainsString('<', $why);
        $this->assertStringNotContainsString('alert(1)', $why);
    }

    public function test_enums_and_confidence_are_clamped(): void
    {
        [$reader] = $this->reader($this->answers([
            'modules'    => [['key' => 'pos', 'why' => 'counter sales']],
            'sells'      => 'unicorns',
            'scale'      => 'enormous',
            'confidence' => 7.5,
        ]));

        $understanding = $reader->read('a shop');

        $this->assertSame(1.0, $understanding['confidence']);
        $this->assertNull($understanding['sells'], 'an out-of-range enum is an unknown, not a value');
        $this->assertNull($understanding['scale']);
    }

    /** Understanding improves the builder; it is never allowed to break it. */
    public function test_a_refusal_returns_null_so_the_caller_falls_back(): void
    {
        foreach (['rate_limited', 'spend_capped', 'scope_rejected'] as $code) {
            Cache::flush();
            [$reader] = $this->reader(AiResult::failure($code, 'refused', 'test'));
            $this->assertNull($reader->read('a bakery in Lahore'), "failure code {$code} must fall back");
        }
    }

    public function test_a_thrown_gateway_does_not_take_the_page_down(): void
    {
        [$reader] = $this->reader(fn () => throw new \RuntimeException('upstream on fire'));

        $this->assertNull($reader->read('a corner shop'));
    }

    public function test_a_reading_that_proposes_nothing_is_not_a_reading(): void
    {
        [$reader] = $this->reader($this->answers(['modules' => [], 'confidence' => 0]));

        $this->assertNull($reader->read('what is the weather today'));
    }

    /** The landing page asks more than once per visit. It pays once. */
    public function test_the_same_sentence_is_read_once(): void
    {
        [$reader, $gateway] = $this->reader($this->answers([
            'modules' => [['key' => 'pos', 'why' => 'counter sales']],
        ]));

        $reader->read('a corner shop');
        $reader->read('A Corner Shop');
        $reader->read('a corner shop');

        $this->assertCount(1, $gateway->seen, 'the same sentence reached the model more than once');
    }

    /** Every line of the instructions is paid for on every call. */
    public function test_the_instructions_stay_small_and_fence_untrusted_text(): void
    {
        [$reader, $gateway] = $this->reader($this->answers([
            'modules' => [['key' => 'pos', 'why' => 'counter sales']],
        ]));

        $reader->read('a corner shop');
        $request = $gateway->seen[0];

        // Roughly 3.7 characters per token — the whole product plus its rules.
        $this->assertLessThan(2000, mb_strlen((string) $request->systemPrompt) / 3.7);

        // Alias lists are for str_contains(), not for a model that reads.
        $this->assertStringNotContainsString('Also called', (string) $request->systemPrompt);

        // Every live module must be offerable, or the model cannot choose it.
        $this->assertStringContainsString('expenses:', (string) $request->systemPrompt);

        $this->assertStringContainsString('<business_description>', (string) $request->prompt);
    }

    /** The catalogue is generated from the registry, so the two cannot drift. */
    public function test_the_manifest_only_ever_offers_live_modules(): void
    {
        $manifest = new ModuleManifest();
        $catalogue = $manifest->catalogue();

        foreach (config('modules', []) as $key => $module) {
            if (($module['status'] ?? null) === 'live') {
                continue;
            }
            $this->assertStringNotContainsString("\n{$key}:", "\n" . $catalogue, "{$key} is not live but is offered to the model");
        }

        $this->assertSame([], $manifest->validate(['not_a_module', 'also_not_one']));
    }
}
