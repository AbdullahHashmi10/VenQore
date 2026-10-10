<?php

use App\Services\Sales\PaymentAllocation;
use App\Services\Sales\CheckoutIntent;
use PHPUnit\Framework\TestCase;

final class PaymentContractReviewTest extends TestCase
{
    public function test_credit_leg_must_not_become_cash_change_from_client_total(): void
    {
        // Exact shape emitted by buildSalePayload for Rs100: Rs40 cash + Rs60 credit.
        $r = PaymentAllocation::allocate([
            'invoice' => 10000, 'payments' => [['method' => 'cash', 'amount' => 40], ['method' => 'credit', 'amount' => 60]],
            'amount_paid' => 40, 'tendered_amount' => 100, 'has_customer' => true, 'walk_in_must_pay' => true,
        ]);
        $this->assertSame(0, $r['change'], 'Rs60 credit is not Rs60 cash to give back.');
    }

    public function test_non_cash_payment_cannot_authorize_cash_change(): void
    {
        $r = PaymentAllocation::allocate([
            'invoice' => 10000, 'payments' => [['method' => 'card', 'amount' => 100]],
            'amount_paid' => 100, 'tendered_amount' => 150, 'has_customer' => false, 'walk_in_must_pay' => true,
        ]);
        $this->assertSame(0, $r['change'], 'No cash leg exists to justify cash change.');
    }

    public function test_changed_tender_is_different_business_content(): void
    {
        $body = ['items' => [['product_id' => 'p', 'quantity' => 1, 'price' => 100]],
            'payments' => [['method' => 'cash', 'amount' => 100]], 'tendered_amount' => 100, 'change_return' => 0];
        $changed = array_replace($body, ['tendered_amount' => 200, 'change_return' => 100]);
        $this->assertNotSame(CheckoutIntent::requestHash($body), CheckoutIntent::requestHash($changed));
    }
}
