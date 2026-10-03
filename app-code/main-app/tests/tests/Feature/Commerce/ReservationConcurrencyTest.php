<?php

namespace Tests\Feature\Commerce;

use App\Services\Commerce\OrderService;
use Illuminate\Support\Facades\DB;

/**
 * Genuine concurrency: two separate PHP processes, two database connections, real row locks.
 * The data is COMMITTED (a second connection cannot see an open test transaction) and removed afterwards.
 */
class ReservationConcurrencyTest extends CommerceTestCase
{
    private function place(array $items): array
    {
        return app(\App\Services\Commerce\CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput($items));
    }

    private function spawn(string $scenario, array $ctx): mixed
    {
        $cmd = [PHP_BINARY, __DIR__ . '/concurrency_worker.php', $scenario, (string) $ctx['tenant'], $ctx['order'], $ctx['product'], $ctx['wh'], $ctx['flag']];
        $p = proc_open($cmd, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, base_path(), ['APP_ENV' => 'testing'] + getenv());
        return [$p, $pipes];
    }

    private function finish(array $h): string
    {
        [$p, $pipes] = $h;
        $out = stream_get_contents($pipes[1]) . stream_get_contents($pipes[2]);
        proc_close($p);
        return trim($out);
    }

    private function scenario(string $first, string $second, string $expectFirst, string $expectSecond, string $label): array
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, [], 3, $this->store);
        $order = $this->place([['product_id' => $pid, 'quantity' => 2]])['order'];
        $flag = sys_get_temp_dir() . '/vq_flag_' . uniqid();
        $ctx = ['tenant' => $this->tenant->id, 'order' => $order->id, 'product' => $pid, 'wh' => $this->warehouseId, 'flag' => $flag];
        DB::commit(); // make the fixtures visible to the other connections (framework rollback becomes a no-op)
        try {
            $a = $this->spawn($first, $ctx);
            $b = $this->spawn($second, $ctx);
            $outA = $this->finish($a);
            $outB = $this->finish($b);
            $remaining = (float) DB::table('inventory_batches')->where('product_id', $pid)->sum('remaining_qty');
            $holds = (float) DB::table('commerce_stock_holds')->where('order_id', $order->id)->where('status', 'active')->sum('quantity');
            $this->assertStringStartsWith($expectFirst, $outA, "$label first: $outA");
            $this->assertStringStartsWith($expectSecond, $outB, "$label second: $outB");
            return [$remaining, $holds];
        } finally {
            @unlink($flag);
            DB::table('commerce_stock_holds')->where('product_id', $pid)->delete();
            DB::table('commerce_order_events')->where('order_id', $order->id)->delete();
            DB::table('commerce_order_items')->where('order_id', $order->id)->delete();
            DB::table('commerce_orders')->where('id', $order->id)->delete();
            DB::table('storefront_products')->where('product_id', $pid)->delete();
            DB::table('sale_item_batches')->whereIn('inventory_batch_id', DB::table('inventory_batches')->where('product_id', $pid)->pluck('id'))->delete();
            DB::table('inventory_batches')->where('product_id', $pid)->delete();
            DB::table('stocks')->where('product_id', $pid)->delete();
            DB::table('products')->where('id', $pid)->delete();
            DB::table('commerce_notifications')->where('order_id', $order->id)->delete();
            DB::table('storefronts')->where('id', $this->store->id)->delete();
        }
    }

    public function test_sale_arriving_while_an_order_is_being_accepted_cannot_take_the_held_units(): void
    {
        [$remaining, $holds] = $this->scenario('confirm_holds_lock', 'sale', 'CONFIRMED', 'BLOCKED:ReservedStockException', 'confirm vs sale');
        $this->assertEquals(3.0, $remaining, 'the competing sale took nothing');
        $this->assertEquals(2.0, $holds, 'the order holds its 2 units');
    }

    public function test_order_acceptance_arriving_while_a_sale_is_in_flight_is_refused_not_double_booked(): void
    {
        [$remaining, $holds] = $this->scenario('sale_holds_lock', 'confirm', 'SOLD', 'BLOCKED:CommerceException:insufficient_stock', 'sale vs confirm');
        $this->assertEquals(1.0, $remaining, 'the sale of 2 stands');
        $this->assertEquals(0.0, $holds, 'no hold was created for stock that is gone');
    }
}
