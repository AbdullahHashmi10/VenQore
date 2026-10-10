<?php

namespace Tests\Unit\SaleReliability;

use App\Engines\AccountingService;
use PHPUnit\Framework\TestCase;

/**
 * The ledger validates exact decimals: strings are not routed through binary
 * floats, and balance is compared in integer paisa. No database: only cases
 * that must be refused before any read are asserted as refusals; balanced
 * cases are asserted NOT to be refused for balance.
 */
final class LedgerExactDecimalTest extends TestCase
{
    private function ledger(): AccountingService
    {
        return (new \ReflectionClass(AccountingService::class))->newInstanceWithoutConstructor();
    }

    private function balanceError(array $lines): ?string
    {
        try {
            $this->ledger()->createEntry([], $lines);
        } catch (\InvalidArgumentException $e) {
            return $e->getMessage();
        } catch (\Throwable $e) {
            return null; // got past validation (needs a database next)
        }
        return null;
    }

    public function test_decimal_strings_balance_exactly(): void
    {
        foreach ([['0.29', 0.29], ['1.005', '1.01'], ['99999999.99', 99999999.99], ['0.10', '0.1']] as [$d, $c]) {
            $msg = $this->balanceError([
                ['account_code' => '1000', 'debit' => $d, 'credit' => 0],
                ['account_code' => '4000', 'debit' => 0, 'credit' => $c],
            ]);
            $this->assertTrue($msg === null || !str_contains($msg, 'unbalanced'), "{$d} vs {$c}: {$msg}");
        }
    }

    public function test_one_paisa_large_amount_mismatch_is_refused(): void
    {
        $msg = $this->balanceError([
            ['account_code' => '1000', 'debit' => '123456789.12', 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => '123456789.13'],
        ]);
        $this->assertStringContainsString('unbalanced', (string) $msg);
    }

    public function test_negative_nan_and_malformed_amounts_are_refused(): void
    {
        foreach (['-1.00', NAN, INF, 'abc', '1,000'] as $bad) {
            $msg = $this->balanceError([
                ['account_code' => '1000', 'debit' => $bad, 'credit' => 0],
                ['account_code' => '4000', 'debit' => 0, 'credit' => '1.00'],
            ]);
            $this->assertNotNull($msg, 'accepted ' . var_export($bad, true));
        }
    }
}
