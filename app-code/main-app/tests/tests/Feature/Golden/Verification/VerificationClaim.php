<?php

namespace Tests\Feature\Golden\Verification;

use Illuminate\Support\Str;

class VerificationClaim
{
    public string $id;
    public mixed $expectedValue;
    public mixed $actualValue;
    public mixed $ledgerValue;
    public string $surface;
    public string $metric;
    public ?string $clockPosition;
    public string $testClass;
    public string $testMethod;
    public array $metadata;
    public string $createdAt;

    public function __construct(
        mixed $expectedValue,
        mixed $actualValue,
        string $metric,
        string $surface = 'Test',
        mixed $ledgerValue = null,
        ?string $clockPosition = null,
        array $metadata = []
    ) {
        $this->id = Str::uuid()->toString();
        $this->expectedValue = $expectedValue;
        $this->actualValue = $actualValue;
        $this->metric = $metric;
        $this->surface = $surface;
        $this->ledgerValue = $ledgerValue;
        $this->clockPosition = $clockPosition;
        $this->metadata = $metadata;
        $this->createdAt = now()->toIso8601String();
        $this->resolveCaller();
    }

    private function resolveCaller(): void
    {
        $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS);
        $this->testClass = 'Unknown';
        $this->testMethod = 'Unknown';
        
        foreach ($backtrace as $trace) {
            if (isset($trace['class']) && str_ends_with($trace['class'], 'Test') && isset($trace['function'])) {
                if ($trace['function'] === 'assertMoney' || $trace['function'] === 'assertJournalLine' || str_starts_with($trace['function'], 'assert')) {
                    continue; // Skip the assertion wrapper itself
                }
                $this->testClass = $trace['class'];
                $this->testMethod = $trace['function'];
                break;
            }
        }
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'expected_value' => $this->expectedValue,
            'actual_value' => $this->actualValue,
            'ledger_value' => $this->ledgerValue,
            'surface' => $this->surface,
            'metric' => $this->metric,
            'clock_position' => $this->clockPosition,
            'test_class' => $this->testClass,
            'test_method' => $this->testMethod,
            'metadata' => $this->metadata,
            'created_at' => $this->createdAt,
        ];
    }
}
