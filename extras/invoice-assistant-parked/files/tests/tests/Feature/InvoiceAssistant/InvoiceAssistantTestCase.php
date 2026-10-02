<?php

namespace Tests\Feature\InvoiceAssistant;

use App\Models\Product;
use App\Models\Stock;
use App\Models\Tenant;
use App\Models\User;
use App\Services\InvoiceAssistant\IntentExtractor;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Feature\VenQoreTestCase;

/**
 * Shared fixtures for the conversational-invoice-assistant suite.
 *
 * No test here calls a real model: IntentExtractor (the only seam to AiGateway)
 * is replaced with a canned intent, so the suite exercises everything AROUND
 * the model — validation, resolution, state machine, concurrency, hand-off —
 * deterministically and for free.
 */
abstract class InvoiceAssistantTestCase extends VenQoreTestCase
{
    protected Tenant $tenant;
    protected Tenant $other;
    protected User $owner;
    protected string $customerId;
    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'invoice_assistant.enabled'         => true,
            'invoice_assistant.voice_enabled'   => true,
            'invoice_assistant.enabled_tenants' => [],
        ]);

        $this->tenant = $this->createTenant('ia-main', 'ltd_3', 'active');
        $this->other  = $this->createTenant('ia-other', 'ltd_3', 'active');
        $this->seedTenantDefaults($this->tenant);
        $this->seedTenantDefaults($this->other);

        $this->owner = $this->createTenantUser($this->tenant, 'owner');
        $this->createTenantUser($this->other, 'owner');

        $this->customerId = $this->party($this->tenant, 'Ali Traders', 'customer', '03001234567');
        $this->product = $this->product($this->tenant, 'ABC-101', 'Widget', 100.0, 10.0, 50);
    }

    // ── fixtures ────────────────────────────────────────────────────────────

    protected function party(Tenant $tenant, string $name, string $type = 'customer', ?string $phone = null): string
    {
        $id = (string) Str::uuid();
        DB::table('parties')->insert([
            'id' => $id, 'tenant_id' => $tenant->id, 'name' => $name, 'type' => $type,
            'phone' => $phone, 'created_at' => now(), 'updated_at' => now(),
        ]);

        return $id;
    }

    protected function product(Tenant $tenant, string $sku, string $name, float $price, float $cost, float $stock): Product
    {
        $p = Product::factory()->create([
            'tenant_id' => $tenant->id, 'sku' => $sku, 'name' => $name,
            'price' => $price, 'cost_price' => $cost, 'tax_rate' => 0,
        ]);
        $warehouse = (string) DB::table('warehouses')->where('tenant_id', $tenant->id)->value('id');
        Stock::updateOrCreate(['product_id' => $p->id, 'warehouse_id' => $warehouse], ['quantity' => $stock]);

        return $p;
    }

    // ── the model seam ──────────────────────────────────────────────────────

    /** A well-formed intent; override any key. */
    protected function intent(array $over = []): array
    {
        return array_replace([
            'schema_version'     => 1,
            'intent'             => 'create_sales_invoice',
            'customer_reference' => ['name' => 'Ali Traders', 'code' => null],
            'lines'              => [[
                'line_key' => 'l1', 'sku' => 'ABC-101', 'name' => null, 'quantity' => '3',
                'unit' => null, 'requested_unit_price' => null, 'discount_percent' => null,
            ]],
            'payment'            => ['method' => 'credit', 'amount_paid' => null],
            'invoice_date'       => null,
            'due_date'           => null,
            'notes'              => null,
        ], $over);
    }

    /** Replace the extractor: every call returns $value (or the ok=false envelope). */
    protected function fakeModel(array|string|null $value, ?int $times = null, bool $ok = true, string $code = 'provider_error'): void
    {
        $this->mock(IntentExtractor::class, function ($m) use ($value, $times, $ok, $code) {
            $expect = $m->shouldReceive('extract');
            if ($times !== null) {
                $expect->times($times);
            }
            $expect->andReturn($ok
                ? ['ok' => true, 'value' => $value, 'code' => null, 'message' => null, 'cost' => 0.0, 'model' => 'fake-model', 'provider' => 'fake']
                : ['ok' => false, 'value' => null, 'code' => $code, 'message' => 'failed', 'cost' => 0.0, 'model' => null, 'provider' => null]);
        });
    }

    // ── http helpers ────────────────────────────────────────────────────────

    protected function url(string $path, ?Tenant $tenant = null): string
    {
        return $this->storeUrl($tenant ?? $this->tenant, 'invoice-assistant/' . ltrim($path, '/'));
    }

    protected function reqId(): string
    {
        return 'req-' . Str::random(16);
    }

    /** Create a draft as the owner; returns the TestResponse. */
    protected function createDraft(string $text = 'invoice Ali Traders 3 ABC-101 on credit', ?string $reqId = null)
    {
        return $this->actingAsTenantUserModel($this->owner, $this->tenant)
            ->postJson($this->url('drafts'), ['text' => $text, 'input_mode' => 'text', 'request_id' => $reqId ?? $this->reqId()]);
    }

    protected function salesCount(Tenant $tenant): int
    {
        return (int) DB::table('sales')->where('tenant_id', $tenant->id)->count();
    }

    protected function journalCount(Tenant $tenant): int
    {
        return (int) DB::table('journal_entries')->where('tenant_id', $tenant->id)->count();
    }

    protected function stockTotal(Product $p): float
    {
        return (float) DB::table('stocks')->where('product_id', $p->id)->sum('quantity');
    }
}
