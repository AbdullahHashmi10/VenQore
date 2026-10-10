<?php

namespace Tests\Feature\Commerce;

use App\Services\Commerce\CheckoutService;
use App\Services\Commerce\OrderService;
use Illuminate\Support\Facades\DB;

/** Phase A: a completed online order is a sale tagged `online`; the back-fill migration tags old ones. */
class OnlineSalesListTagTest extends CommerceTestCase
{
    private function completedOrder(): object
    {
        $pid = $this->makeProduct($this->tenant, $this->warehouseId, ['price' => 500, 'cost_price' => 100], 20, $this->store);
        $o = app(CheckoutService::class)->place($this->store->fresh(), $this->checkoutInput([['product_id' => $pid, 'quantity' => 2]]))['order'];
        $svc = app(OrderService::class);
        $svc->confirm($o->id, $this->tenant->id, $this->owner->id);
        $svc->advance($o->id, $this->tenant->id, $this->owner->id, 'ready');
        return $svc->complete($o->id, $this->tenant->id, $this->owner->id, true);
    }

    public function test_completed_online_order_posts_a_sale_tagged_online(): void
    {
        $o = $this->completedOrder();
        $this->assertSame('online', DB::table('sales')->where('id', $o->sale_id)->value('source'));
    }

    public function test_backfill_migration_tags_existing_online_sales(): void
    {
        $o = $this->completedOrder();
        DB::table('sales')->where('id', $o->sale_id)->update(['source' => 'manual']);
        (require database_path('migrations/2026_10_10_000001_tag_online_sales_source.php'))->up();
        $this->assertSame('online', DB::table('sales')->where('id', $o->sale_id)->value('source'));
    }
}
