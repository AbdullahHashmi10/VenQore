<?php

namespace Tests\Unit\SaleReliability;

use App\Exceptions\MoneyException;
use App\Services\Sales\PaymentAllocation;
use PHPUnit\Framework\TestCase;

/** Payment identities, amounts in minor units. Pure — no Laravel, no DB. */
final class PaymentAllocationTest extends TestCase
{
    private function alloc(array $over): array
    {
        return PaymentAllocation::allocate($over + [
            'invoice' => 10000, 'payments' => null, 'payment_method' => 'cash', 'amount_paid' => null,
            'tendered_amount' => null, 'add_to_ledger' => false, 'has_customer' => false,
            'walk_in_must_pay' => true, 'strict' => true,
        ]);
    }

    public function test_exact_cash(): void
    {
        $r = $this->alloc(['payments' => [['method' => 'cash', 'amount' => '100.00']]]);
        $this->assertSame([10000, 0, 0, 0, 10000, 'paid'], [$r['applied'], $r['receivable'], $r['change'], $r['advance'], $r['tendered'], $r['payment_status']]);
    }

    public function test_cash_change_is_not_revenue_or_payment(): void
    {
        $r = $this->alloc(['payments' => [['method' => 'cash', 'amount' => '150']]]);
        $this->assertSame(10000, $r['applied']);
        $this->assertSame(5000, $r['change']);
        $this->assertSame(15000, $r['tendered']);
        $this->assertSame(10000, $r['lines'][0]['amount']);
    }

    public function test_v2_till_reports_tender_separately_from_clamped_lines(): void
    {
        $r = $this->alloc(['payments' => [['method' => 'cash', 'amount' => '100']], 'tendered_amount' => '120']);
        $this->assertSame([10000, 2000, 12000], [$r['applied'], $r['change'], $r['tendered']]);
    }

    public function test_split_payment_result_does_not_depend_on_order(): void
    {
        $a = $this->alloc(['invoice' => 25000, 'payments' => [
            ['method' => 'card', 'amount' => '100', 'account_id' => 'b1'],
            ['method' => 'cash', 'amount' => '100'],
            ['method' => 'cash', 'amount' => '80'],
        ]]);
        $b = $this->alloc(['invoice' => 25000, 'payments' => [
            ['method' => 'cash', 'amount' => '80'],
            ['method' => 'cash', 'amount' => '100'],
            ['method' => 'card', 'amount' => '100', 'account_id' => 'b1'],
        ]]);
        $sum = fn ($r, $m) => array_sum(array_map(fn ($l) => $l['method'] === $m ? $l['amount'] : 0, $r['lines']));
        foreach ([$a, $b] as $r) {
            $this->assertSame(3000, $r['change']);
            $this->assertSame(15000, $sum($r, 'cash'));
            $this->assertSame(10000, $sum($r, 'card'));
        }
    }

    public function test_bank_overpayment_without_advance_is_refused(): void
    {
        try {
            $this->alloc(['payments' => [['method' => 'card', 'amount' => '120']]]);
            $this->fail('expected refusal');
        } catch (MoneyException $e) {
            $this->assertSame('overpayment_not_cash', $e->errorCode);
        }
    }

    public function test_named_customer_overpayment_kept_as_advance(): void
    {
        $r = $this->alloc(['payments' => [['method' => 'bank', 'amount' => '130']], 'add_to_ledger' => true, 'has_customer' => true]);
        $this->assertSame([10000, 3000, 0, 13000], [$r['applied'], $r['advance'], $r['change'], $r['tendered']]);
    }

    public function test_walk_in_one_paisa_short_is_refused_no_tolerance(): void
    {
        try {
            $this->alloc(['payments' => [['method' => 'cash', 'amount' => '99.99']]]);
            $this->fail('expected refusal');
        } catch (MoneyException $e) {
            $this->assertSame('walk_in_unpaid', $e->errorCode);
        }
    }

    public function test_named_customer_part_payment_is_receivable(): void
    {
        $r = $this->alloc(['payments' => [['method' => 'cash', 'amount' => '40'], ['method' => 'credit', 'amount' => '60']], 'has_customer' => true]);
        $this->assertSame([4000, 6000, 6000, 'paid', 'partial', 0], [$r['applied'], $r['receivable'], $r['declared_credit'], $r['payment_status'], $r['money_status'], $r['undeclared_receivable']]);
    }

    public function test_legacy_single_payment_paths(): void
    {
        $credit = $this->alloc(['payment_method' => 'credit', 'has_customer' => true, 'walk_in_must_pay' => false]);
        $this->assertSame([0, 10000, 'unpaid', 10000], [$credit['applied'], $credit['receivable'], $credit['payment_status'], $credit['undeclared_receivable']]);
        $cashDefault = $this->alloc([]);
        $this->assertSame(10000, $cashDefault['applied']);
        $over = $this->alloc(['amount_paid' => '120']);
        $this->assertSame([10000, 2000], [$over['applied'], $over['change']]);
    }

    public function test_zero_invoice(): void
    {
        $r = $this->alloc(['invoice' => 0, 'payments' => [['method' => 'cash', 'amount' => '0']]]);
        $this->assertSame([0, 0, 'paid'], [$r['applied'], $r['receivable'], $r['payment_status']]);
    }

    public function test_negative_and_malformed_amounts_are_refused(): void
    {
        foreach (['-1', '1,000', 'abc'] as $bad) {
            try {
                $this->alloc(['payments' => [['method' => 'cash', 'amount' => $bad]]]);
                $this->fail("accepted {$bad}");
            } catch (MoneyException $e) {
                $this->assertContains($e->errorCode, ['negative_amount', 'invalid_amount']);
            }
        }
    }
}
