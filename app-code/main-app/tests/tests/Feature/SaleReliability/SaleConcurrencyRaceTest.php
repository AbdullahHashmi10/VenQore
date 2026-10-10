<?php

namespace Tests\Feature\SaleReliability;

use App\Models\Category;
use App\Models\Product;
use App\Models\Register;
use App\Models\RegisterShift;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Tests\Feature\VenQoreTestCase;

/**
 * The same checkout intent sent at the same moment from separate processes,
 * each with its OWN database connection, through the real POST
 * /s/{store}/pos/sales (sale reliability plan: "concurrency proof on
 * separate DB connections"). The Feature tests elsewhere run inside one
 * transaction and cannot show this.
 *
 *  - same key, same content, 8 at once  → exactly one sale, one journal
 *    entry, one set of payment rows; every worker gets that same sale.
 *  - same key, different content         → still one sale; the others are
 *    refused as a conflict and write nothing.
 *
 * MariaDB/MySQL only. The fixture is committed (other processes must see
 * it) and removed afterwards, row by row, by its tenant id.
 */
class SaleConcurrencyRaceTest extends VenQoreTestCase
{
    private const WORKERS = 8;

    private Tenant $tenant;
    private User $cashier;
    private Register $register;
    private string $productId;

    protected function setUp(): void
    {
        parent::setUp();
        if (! in_array(DB::connection()->getDriverName(), ['mysql', 'mariadb'], true)) {
            $this->markTestSkipped('Separate-connection race test needs MariaDB/MySQL.');
        }
        $this->tenant = $this->createTenant('race-' . Str::lower(Str::random(6)), 'ltd_3', 'active');
        $this->cashier = $this->createTenantUser($this->tenant, 'cashier');
        $this->register = Register::create(['tenant_id' => $this->tenant->id, 'name' => 'Till 1', 'status' => 'active']);
        RegisterShift::create(['tenant_id' => $this->tenant->id, 'register_id' => $this->register->id, 'opened_by' => $this->cashier->id,
            'opening_balance' => 0, 'status' => 'open', 'opened_at' => now()]);
        $cat = Category::create(['tenant_id' => $this->tenant->id, 'name' => 'General']);
        $this->productId = Product::create(['tenant_id' => $this->tenant->id, 'name' => 'Race item', 'sku' => 'RACE-' . Str::random(6), 'unit' => 'pcs',
            'base_unit' => 'pcs', 'price' => '333.33', 'category_id' => $cat->id, 'type' => 'service', 'cost_price' => 0])->id;

        // Other processes must see the fixture.
        DB::commit();
    }

    protected function tearDown(): void
    {
        try {
            $this->removeTenantRows();
        } finally {
            $this->beginDatabaseTransaction();
            parent::tearDown();
        }
    }

    private function removeTenantRows(): void
    {
        if (! isset($this->tenant)) {
            return;
        }
        $id = $this->tenant->id;
        DB::statement('SET FOREIGN_KEY_CHECKS=0');
        try {
            $tables = DB::table('information_schema.columns')->where('table_schema', DB::connection()->getDatabaseName())
                ->where('column_name', 'tenant_id')->pluck('table_name');
            foreach ($tables as $table) {
                DB::table($table)->where('tenant_id', $id)->delete();
            }
            DB::table('users')->where('id', $this->cashier->id)->delete();
            DB::table('tenants')->where('id', $id)->delete();
        } finally {
            DB::statement('SET FOREIGN_KEY_CHECKS=1');
        }
    }

    private function payload(string $key, float $qty): string
    {
        $total = round(333.33 * $qty, 2);
        return json_encode([
            'register_id' => $this->register->id, 'items' => [['product_id' => $this->productId, 'quantity' => $qty, 'price' => 333.33, 'discount' => 0]],
            'payment_method' => 'split', 'payments' => [['method' => 'cash', 'amount' => $total]], 'expected_total' => $total,
            'discount' => 0, 'tax_rate' => 0, 'tax_inclusive' => false, 'tax_exempt' => true, 'delivery_charge' => 0, 'extra_charge_value' => 0,
            'bill_rounding' => false, 'calculation_version' => 2, 'source' => 'pos', 'idempotency_key' => $key,
        ]);
    }

    /** @param string[] $payloads one per worker @return array<int, array> */
    private function race(array $payloads): array
    {
        $worker = dirname(__DIR__, 2) . '/Support/concurrency/sale_post_worker.php';
        $conn = DB::connection();
        $env = [
            'APP_ENV' => 'testing', 'DB_CONNECTION' => $conn->getName(), 'DB_HOST' => (string) $conn->getConfig('host'),
            'DB_PORT' => (string) $conn->getConfig('port'), 'DB_DATABASE' => $conn->getDatabaseName(),
            'DB_USERNAME' => (string) $conn->getConfig('username'), 'DB_PASSWORD' => (string) $conn->getConfig('password'),
            'CACHE_STORE' => 'array', 'SESSION_DRIVER' => 'array', 'QUEUE_CONNECTION' => 'sync',
        ];
        $startAt = microtime(true) + 4.0; // time for every worker to boot
        $procs = [];
        foreach ($payloads as $i => $json) {
            $file = tempnam(sys_get_temp_dir(), 'race');
            file_put_contents($file, $json);
            $p = new Process([PHP_BINARY, $worker, (string) $this->cashier->id, $this->tenant->slug, sprintf('%.6f', $startAt), $file], base_path(), $env, null, 120);
            $p->start();
            $procs[] = [$p, $file];
        }
        $out = [];
        foreach ($procs as $i => [$p, $file]) {
            $p->wait();
            @unlink($file);
            $line = json_decode(trim($p->getOutput()), true);
            $this->assertIsArray($line, "worker {$i} printed: " . $p->getOutput() . ' ' . $p->getErrorOutput());
            $out[] = $line;
        }
        // They really ran together: every request started before any finished.
        $lastStart = max(array_column($out, 'started'));
        $firstEnd = min(array_column($out, 'finished'));
        $this->assertLessThan($firstEnd, $lastStart, 'the workers did not overlap; the race proves nothing: ' . json_encode($out));
        return $out;
    }

    private function counts(string $key): array
    {
        $saleIds = DB::table('sales')->where('tenant_id', $this->tenant->id)->where('idempotency_key', $key)->pluck('id')->all();
        return [
            'sales'    => count($saleIds),
            'entries'  => DB::table('journal_entries')->where('tenant_id', $this->tenant->id)->where('reference_type', 'sale')->whereIn('reference', $saleIds)->count(),
            'payments' => DB::table('payments')->whereIn('sale_id', $saleIds)->count(),
            'items'    => DB::table('sale_items')->whereIn('sale_id', $saleIds)->count(),
            'ids'      => $saleIds,
        ];
    }

    public function test_the_same_intent_at_the_same_moment_from_separate_connections_posts_once(): void
    {
        $key = (string) Str::uuid();
        $results = $this->race(array_fill(0, self::WORKERS, $this->payload($key, 3)));

        $c = $this->counts($key);
        $this->assertSame(1, $c['sales'], 'sales: ' . json_encode($results));
        $this->assertSame(1, $c['entries']);
        $this->assertSame(1, $c['payments']);
        $this->assertSame(1, $c['items']);

        foreach ($results as $i => $r) {
            $this->assertContains($r['status'], [200, 201], "worker {$i}: " . json_encode($r));
            $this->assertSame($c['ids'][0], $r['sale_id'], "worker {$i} must get the one sale");
        }

        $entry = DB::table('journal_entries')->where('reference', $c['ids'][0])->value('id');
        $sum = DB::table('journal_items')->where('journal_entry_id', $entry)->selectRaw('SUM(debit) d, SUM(credit) c')->first();
        $this->assertSame('999.99', number_format((float) $sum->d, 2, '.', ''));
        $this->assertSame((string) $sum->d, (string) $sum->c);
    }

    public function test_the_same_key_with_different_content_at_the_same_moment_posts_one_and_refuses_the_rest(): void
    {
        $key = (string) Str::uuid();
        $payloads = [];
        for ($i = 0; $i < self::WORKERS; $i++) {
            $payloads[] = $this->payload($key, $i + 1); // every worker a different quantity
        }
        $results = $this->race($payloads);

        $c = $this->counts($key);
        $this->assertSame(1, $c['sales'], json_encode($results));
        $this->assertSame(1, $c['entries']);
        $this->assertSame(1, $c['payments']);

        $won = array_values(array_filter($results, fn ($r) => in_array($r['status'], [200, 201], true)));
        $this->assertCount(1, $won, json_encode($results));
        $this->assertSame($c['ids'][0], $won[0]['sale_id']);
        foreach ($results as $i => $r) {
            if (! in_array($r['status'], [200, 201], true)) {
                $this->assertSame(409, $r['status'], "worker {$i}: " . json_encode($r));
                $this->assertSame('idempotency_conflict', $r['code'], "worker {$i}: " . json_encode($r));
            }
        }
    }
}
