<?php

namespace Tests\Feature\ZeroDrift;

use App\Engines\PurchaseService;
use Illuminate\Support\Facades\DB;

/**
 * ZeroDrift Ledger — purchases and purchase returns through the REAL
 * PurchaseService on MariaDB. Any entry off by a paisa is refused by the
 * ledger (a test error); stored totals must equal what was posted; a line
 * returned in pieces must give back exactly what it booked.
 */
class PurchasesZeroDriftTest extends ZeroDriftTestCase
{
    private function randomPurchase(): array
    {
        $items = [];
        for ($i = 0, $c = mt_rand(1, 4); $i < $c; $i++) {
            $items[] = [
                'product_id' => $this->product(),
                'qty' => mt_rand(0, 2) ? (string) mt_rand(1, 40) : number_format(mt_rand(1, 9999) / 1000, 3, '.', ''),
                'unit_cost' => number_format(mt_rand(1, 999999) / 10000, 4, '.', ''),
                'discount_amount' => mt_rand(0, 3) ? 0 : $this->amt(5),
                'tax_rate' => [0, 0, 5, 16, 17, 18][mt_rand(0, 5)],
                'business_pct' => [100, 100, 60, 33.33][mt_rand(0, 3)],
            ];
        }
        return [
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId, 'purchase_date' => now()->toDateString(),
            'items' => $items,
            'discount' => mt_rand(0, 2) ? 0 : $this->amt(3),
            'round_off' => mt_rand(0, 3) ? 0 : number_format(mt_rand(-49, 49) / 100, 2, '.', ''),
            'payment_method' => ['cash', 'credit', 'credit'][mt_rand(0, 2)],
            'amount_paid' => mt_rand(0, 2) ? null : $this->amt(200),
            'extras' => mt_rand(0, 3) ? [] : [['amount' => $this->amt(50), 'method' => ['value', 'quantity'][mt_rand(0, 1)], 'description' => 'Freight']],
        ];
    }

    public function test_seeded_purchases_post_exactly_and_balance(): void
    {
        mt_srand(910202601);
        $svc = app(PurchaseService::class);
        for ($n = 0; $n < 60; $n++) {
            $data = $this->randomPurchase();
            $p = $svc->store($data);
            $row = DB::table('purchases')->where('id', $p->id)->first();
            $entry = DB::table('journal_entries')->where('reference_type', 'purchase')->where('reference', $row->id)->value('id');
            $credits = DB::table('journal_items as ji')->join('accounts as a', 'a.id', '=', 'ji.account_id')->where('ji.journal_entry_id', $entry)
                ->whereIn('a.code', ['1000', '2000', '1010', '1020'])->sum('ji.credit');
            $landed = $data['extras'] ? $this->cents($data['extras'][0]['amount']) : 0;
            $this->assertSame($this->cents($row->total) + $landed, $this->cents($credits), "purchase {$n}: " . json_encode($data));
            $this->assertSame($this->cents($row->total), $this->cents($row->subtotal) - $this->cents($row->discount) + $this->cents($row->tax) + $this->cents($row->round_off), "purchase {$n} components");
        }
        $this->assertEveryEntryBalances();
    }

    public function test_returning_a_line_in_pieces_gives_back_exactly_what_it_booked(): void
    {
        $svc = app(PurchaseService::class);
        $p = $svc->store([
            'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId, 'purchase_date' => now()->toDateString(),
            'payment_method' => 'credit', 'discount' => '0.07',
            'items' => [['product_id' => $this->product(), 'qty' => 3, 'unit_cost' => '33.3333', 'tax_rate' => 17, 'business_pct' => 60]],
            'extras' => [['amount' => '10.01', 'method' => 'value', 'description' => 'Freight']],
        ]);
        $pi = DB::table('purchase_items')->where('purchase_id', $p->id)->first();
        foreach ([1, 1, 1] as $q) {
            $svc->createReturn($p->id, ['return_date' => now()->toDateString(), 'reason' => 'piece', 'items' => [['purchase_item_id' => $pi->id, 'qty_returned' => $q]]]);
        }
        $this->assertSame($this->sumCode('1100', 'debit', ['purchase']), $this->sumCode('1100', 'credit', ['purchase_return']), 'stock value back exactly');
        $this->assertSame($this->sumCode('2300', 'debit', ['purchase']), $this->sumCode('2300', 'credit', ['purchase_return']), 'input tax back exactly');
        // 6000: the purchase debited the non-recoverable tax; the returns credit it back, and debit the freight written off.
        $this->assertSame($this->sumCode('6000', 'debit', ['purchase']), $this->sumCode('6000', 'credit', ['purchase_return']), 'non-recoverable tax back exactly');
        $this->assertSame(1001, $this->sumCode('6000', 'debit', ['purchase_return']), 'all the freight written off, once');
        $this->assertSame($this->sumCode('2000', 'credit', ['purchase']) - 1001, $this->sumCode('2000', 'debit', ['purchase_return']), 'supplier owed nothing after a full return (freight stays owed to the carrier)');
        $this->assertEveryEntryBalances();

        $this->expectException(\InvalidArgumentException::class);
        $svc->createReturn($p->id, ['return_date' => now()->toDateString(), 'reason' => 'too many', 'items' => [['purchase_item_id' => $pi->id, 'qty_returned' => 1]]]);
    }

    public function test_seeded_partial_returns_give_back_exactly_what_was_booked(): void
    {
        mt_srand(910202602);
        $svc = app(PurchaseService::class);
        for ($n = 0; $n < 15; $n++) {
            $qty = mt_rand(2, 12);
            $p = $svc->store([
                'supplier_id' => $this->supplierId, 'warehouse_id' => $this->warehouseId, 'purchase_date' => now()->toDateString(), 'payment_method' => 'credit',
                'discount' => mt_rand(0, 1) ? '0' : $this->amt(2),
                'items' => [['product_id' => $this->product(), 'qty' => $qty, 'unit_cost' => number_format(mt_rand(100, 99999) / 1000, 3, '.', ''),
                    'tax_rate' => [5, 16, 17, 18][mt_rand(0, 3)], 'business_pct' => [100, 60, 33.33][mt_rand(0, 2)]]],
            ]);
            $pi = DB::table('purchase_items')->where('purchase_id', $p->id)->first();
            for ($left = $qty; $left > 0; $left -= $q) {
                $q = mt_rand(1, $left);
                $svc->createReturn($p->id, ['return_date' => now()->toDateString(), 'reason' => 'r', 'items' => [['purchase_item_id' => $pi->id, 'qty_returned' => $q]]]);
            }
        }
        foreach (['1100', '2300'] as $code) {
            $this->assertSame($this->sumCode($code, 'debit', ['purchase']), $this->sumCode($code, 'credit', ['purchase_return']), "account {$code}");
        }
        $this->assertSame($this->sumCode('2000', 'credit', ['purchase']), $this->sumCode('2000', 'debit', ['purchase_return']));
        $this->assertEveryEntryBalances();
    }
}
