<?php

namespace Tests\Feature\Hardening;

use App\Support\InventoryDbGuards;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * Production-migration rehearsal for the inventory CHECK guards (G07).
 *
 * Runs on its own throw-away schema (DDL can't live inside the suite's
 * per-test transaction): a "production" table with bad rows, the same
 * installIfClean() the migrations call, then the operator command.
 * Proves: no stock value is ever rewritten, a blocked guard is reported
 * (non-zero exit) instead of silently skipped, and after reconciliation the
 * guards install and the negative_stock policy still holds.
 */
class InventoryDbGuardsTest extends TestCase
{
    private string $scratch;

    protected function setUp(): void
    {
        parent::setUp();

        $default = config('database.default');
        $this->scratch = config("database.connections.{$default}.database") . '_guards';
        DB::statement("DROP DATABASE IF EXISTS `{$this->scratch}`");
        DB::statement("CREATE DATABASE `{$this->scratch}`");
        config(["database.connections.guards_scratch" => array_merge(config("database.connections.{$default}"), ['database' => $this->scratch])]);
        DB::purge('guards_scratch');

        Schema::connection('guards_scratch')->create('inventory_batches', function ($t) {
            $t->string('id')->primary();
            $t->unsignedBigInteger('tenant_id')->nullable();
            $t->string('product_id')->nullable();
            $t->string('batch_type');
            $t->decimal('remaining_qty', 15, 4);
            $t->decimal('unit_cost', 15, 4)->nullable();
        });
    }

    protected function tearDown(): void
    {
        DB::purge('guards_scratch');
        DB::statement("DROP DATABASE IF EXISTS `{$this->scratch}`");
        parent::tearDown();
    }

    private function rows(): \Illuminate\Database\Query\Builder
    {
        return DB::connection('guards_scratch')->table('inventory_batches');
    }

    #[Test]
    public function bad_rows_block_the_guards_without_touching_stock_and_are_reported(): void
    {
        $this->rows()->insert([
            ['id' => 'b-neg',       'tenant_id' => 1, 'product_id' => 'p1', 'batch_type' => 'purchase',       'remaining_qty' => -3, 'unit_cost' => 10],
            ['id' => 'b-negstock',  'tenant_id' => 1, 'product_id' => 'p1', 'batch_type' => 'negative_stock', 'remaining_qty' => -2, 'unit_cost' => 10],
            ['id' => 'b-open-zero', 'tenant_id' => 1, 'product_id' => 'p2', 'batch_type' => 'opening',        'remaining_qty' => 5,  'unit_cost' => 0],
            ['id' => 'b-ok',        'tenant_id' => 1, 'product_id' => 'p3', 'batch_type' => 'opening',        'remaining_qty' => 4,  'unit_cost' => 12],
        ]);
        $before = $this->rows()->orderBy('id')->get()->toArray();

        // What the migrations do on deploy:
        $this->assertSame('blocked', InventoryDbGuards::installIfClean('chk_remaining_qty_positive', 'guards_scratch'));
        $this->assertSame('blocked', InventoryDbGuards::installIfClean('chk_opening_batch_cost', 'guards_scratch'));
        $this->assertEquals($before, $this->rows()->orderBy('id')->get()->toArray(), 'Stock and costs must not be rewritten.');
        $this->assertFalse(InventoryDbGuards::exists('chk_remaining_qty_positive', 'guards_scratch'));

        // The operator check fails loudly and names the rows.
        $exit = Artisan::call('venqore:db-guards', ['--check' => true, '--connection' => 'guards_scratch']);
        $out = Artisan::output();
        $this->assertSame(1, $exit);
        $this->assertStringContainsString('b-neg', $out);
        $this->assertStringContainsString('b-open-zero', $out);
        $this->assertStringNotContainsString('b-negstock', $out, 'A negative_stock batch is allowed to be negative.');

        // --install still refuses while the data is unreconciled.
        $this->assertSame(1, Artisan::call('venqore:db-guards', ['--install' => true, '--connection' => 'guards_scratch']));
        $this->assertFalse(InventoryDbGuards::exists('chk_opening_batch_cost', 'guards_scratch'));
    }

    #[Test]
    public function after_reconciliation_the_guards_install_and_enforce_the_policy(): void
    {
        $this->rows()->insert([
            ['id' => 'b-neg',       'tenant_id' => 1, 'product_id' => 'p1', 'batch_type' => 'purchase',       'remaining_qty' => -3, 'unit_cost' => 10],
            ['id' => 'b-negstock',  'tenant_id' => 1, 'product_id' => 'p1', 'batch_type' => 'negative_stock', 'remaining_qty' => -2, 'unit_cost' => 10],
            ['id' => 'b-open-zero', 'tenant_id' => 1, 'product_id' => 'p2', 'batch_type' => 'opening',        'remaining_qty' => 5,  'unit_cost' => 0],
        ]);

        // The owner reconciles against real records (here: the shortfall was a
        // real oversell, so it becomes a negative_stock batch; the opening cost
        // is looked up). The tool never decides this.
        $this->rows()->where('id', 'b-neg')->update(['batch_type' => 'negative_stock']);
        $this->rows()->where('id', 'b-open-zero')->update(['unit_cost' => 8.5]);

        $this->assertSame(0, Artisan::call('venqore:db-guards', ['--install' => true, '--connection' => 'guards_scratch']));
        $this->assertTrue(InventoryDbGuards::exists('chk_remaining_qty_positive', 'guards_scratch'));
        $this->assertTrue(InventoryDbGuards::exists('chk_opening_batch_cost', 'guards_scratch'));
        $this->assertSame(0, Artisan::call('venqore:db-guards', ['--check' => true, '--connection' => 'guards_scratch']));
        $this->assertSame('-2.0000', (string) $this->rows()->where('id', 'b-negstock')->value('remaining_qty'));

        // Enforced from now on.
        $this->rows()->insert(['id' => 'ok-neg', 'tenant_id' => 1, 'batch_type' => 'negative_stock', 'remaining_qty' => -1, 'unit_cost' => 1]);
        $this->expectException(QueryException::class);
        $this->rows()->insert(['id' => 'bad', 'tenant_id' => 1, 'batch_type' => 'purchase', 'remaining_qty' => -1, 'unit_cost' => 1]);
    }
}
