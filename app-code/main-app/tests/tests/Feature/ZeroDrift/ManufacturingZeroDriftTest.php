<?php

namespace Tests\Feature\ZeroDrift;

use App\Engines\FifoService;
use App\Services\V3\ManufacturingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * ZeroDrift Ledger — set disassembly splits the set's cost over its
 * components by largest remainder: the parts always add back to exactly
 * what left the set, however awkward the percentages.
 */
class ManufacturingZeroDriftTest extends ZeroDriftTestCase
{
    private function disassemblyBom(string $setId, array $percents): array
    {
        $bomId = (string) Str::uuid();
        DB::table('disassembly_boms')->insert(['id' => $bomId, 'tenant_id' => $this->tenantId, 'product_id' => $setId, 'created_at' => now(), 'updated_at' => now()]);
        $components = [];
        foreach ($percents as $pct) {
            $c = $this->product();
            $components[] = $c;
            DB::table('disassembly_bom_items')->insert(['id' => (string) Str::uuid(), 'tenant_id' => $this->tenantId, 'disassembly_bom_id' => $bomId,
                'component_product_id' => $c, 'allocation_percent' => $pct, 'created_at' => now()]);
        }
        return $components;
    }

    public function test_awkward_component_percentages_conserve_the_set_cost_exactly(): void
    {
        $set = $this->product();
        app(FifoService::class)->receiveBatch($set, $this->warehouseId, 3.0, 33.3367, 'purchase'); // 3 × 33.3367 = 100.0101
        $this->disassemblyBom($set, [33.33, 33.33, 33.34]);

        app(ManufacturingService::class)->disassemble($set, 3.0, $this->warehouseId);

        $entry = DB::table('journal_entries')->where('tenant_id', $this->tenantId)->where('reference_type', 'disassembly')->value('id');
        $this->assertNotNull($entry);
        $dr = (int) round(((float) DB::table('journal_items')->where('journal_entry_id', $entry)->sum('debit')) * 100);
        $cr = (int) round(((float) DB::table('journal_items')->where('journal_entry_id', $entry)->sum('credit')) * 100);
        $this->assertSame(10001, $cr, 'the set leaves 1100 at its cost, quantized once');
        $this->assertSame($cr, $dr, 'the components come back to exactly that');
        $this->assertEveryEntryBalances();
    }
}
