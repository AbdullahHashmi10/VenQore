<?php

use App\Engines\AccountingService;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

/** Tests the REAL ledger's early validation. No Laravel boot or database. */
final class JournalBalanceGuardTest extends TestCase
{
    public static function mismatches(): array
    {
        return [
            'reported journal totals (not recovered sale payload)' => [7725.64, 7725.65],
            'one paisa is still a defect' => [100.00, 100.01],
            'five paisa must not be automatically hidden' => [100.00, 100.05],
            'larger missing amount' => [100.00, 100.50],
        ];
    }

    #[DataProvider('mismatches')]
    public function test_unexplained_imbalance_is_rejected_before_any_database_access(float $debit, float $credit): void
    {
        // createEntry validates balance before reading dependencies. Skipping
        // construction ensures these cases cannot accidentally touch a database.
        $ledger = (new ReflectionClass(AccountingService::class))->newInstanceWithoutConstructor();
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Journal entry is unbalanced.');
        $ledger->createEntry([], [
            ['account_code' => '1000', 'debit' => $debit, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => $credit],
        ]);
    }

    public function test_synthetic_fractional_revenue_and_roundoff_reproduce_double_rounding(): void
    {
        $revenue = 7725 * (1 - 12.5 / 100);
        $invoice = round($revenue, 2);
        $roundOff = $invoice - $revenue;
        $this->assertSame(6759.375, $revenue);
        $this->assertSame(0.01, round($roundOff, 2));
        $ledger = (new ReflectionClass(AccountingService::class))->newInstanceWithoutConstructor();
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Journal entry is unbalanced.');
        $ledger->createEntry([], [
            ['account_code' => '1000', 'debit' => $invoice, 'credit' => 0],
            ['account_code' => '4000', 'debit' => 0, 'credit' => $revenue],
            ['account_code' => '4900', 'debit' => 0, 'credit' => $roundOff],
        ]);
    }
}
