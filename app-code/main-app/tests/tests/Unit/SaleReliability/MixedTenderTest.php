<?php

namespace Tests\Unit\SaleReliability;

use App\Exceptions\MoneyException;
use App\Services\Sales\PaymentAllocation;
use PHPUnit\Framework\TestCase;

/** Cash change in mixed cash + non-cash payments (cross-check round 2). */
final class MixedTenderTest extends TestCase
{
    private function alloc(array $over): array
    {
        return PaymentAllocation::allocate($over + [
            'invoice' => 10000, 'payment_method' => 'split', 'amount_paid' => null, 'tendered_amount' => null,
            'add_to_ledger' => false, 'has_customer' => false, 'walk_in_must_pay' => true, 'strict' => true,
        ]);
    }

    public function test_inflated_total_tender_with_a_card_line_creates_no_change(): void
    {
        // Rs60 card + Rs40 cash; an inflated total of 500 must not invent change.
        $r = $this->alloc(['payments' => [['method' => 'card', 'amount' => 60], ['method' => 'cash', 'amount' => 40]], 'tendered_amount' => 500]);
        $this->assertSame([0, 10000, 500 * 100], [$r['change'], $r['tendered'], $r['tender_report_ignored']]);
    }

    public function test_explicit_cash_given_produces_exact_cash_change(): void
    {
        // Rs60 card + Rs40 cash part paid with a Rs50 note: Rs10 change.
        $r = $this->alloc(['payments' => [['method' => 'card', 'amount' => 60], ['method' => 'cash', 'amount' => 40]],
            'tendered_amount' => 110, 'cash_tendered' => 50]);
        $this->assertSame([1000, 11000, null], [$r['change'], $r['tendered'], $r['tender_report_ignored']]);
    }

    public function test_cash_given_cannot_be_less_than_the_cash_part(): void
    {
        $this->expectException(MoneyException::class);
        $this->alloc(['payments' => [['method' => 'card', 'amount' => 60], ['method' => 'cash', 'amount' => 40]], 'cash_tendered' => 30]);
    }

    public function test_card_only_cash_given_is_ignored(): void
    {
        $r = $this->alloc(['payments' => [['method' => 'card', 'amount' => 100]], 'tendered_amount' => 150, 'cash_tendered' => 50]);
        $this->assertSame(0, $r['change']);
        $this->assertSame(10000, $r['tendered']);
    }

    public function test_cash_with_credit_leg_never_gives_change(): void
    {
        $r = $this->alloc(['payments' => [['method' => 'cash', 'amount' => 40], ['method' => 'credit', 'amount' => 60]],
            'has_customer' => true, 'cash_tendered' => 100]);
        $this->assertSame(0, $r['change']);
    }

    public function test_all_cash_legacy_total_still_gives_change(): void
    {
        $r = $this->alloc(['payments' => [['method' => 'cash', 'amount' => 100]], 'tendered_amount' => 120]);
        $this->assertSame([2000, 12000], [$r['change'], $r['tendered']]);
    }

    public function test_unclamped_cash_lines_are_not_double_counted_with_cash_given(): void
    {
        $r = $this->alloc(['payments' => [['method' => 'cash', 'amount' => 150]], 'cash_tendered' => 150]);
        $this->assertSame([5000, 15000], [$r['change'], $r['tendered']]);
    }
}
