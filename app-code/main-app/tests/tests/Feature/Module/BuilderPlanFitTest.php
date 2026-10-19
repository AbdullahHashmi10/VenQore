<?php

namespace Tests\Feature\Module;

use App\Services\Builder\BuilderEngine;
use PHPUnit\Framework\Attributes\Test;
use Tests\Feature\VenQoreTestCase;

/**
 * The preview is built before a plan is picked; provisioning drops what the plan
 * locks. The plan step must say so per plan, so nothing silently disappears.
 */
class BuilderPlanFitTest extends VenQoreTestCase
{
    #[Test]
    public function the_plan_step_lists_what_each_plan_would_leave_out(): void
    {
        config(['venqore.builder_v2' => true]);
        $engine = app(BuilderEngine::class);
        $s = $engine->start('Auto parts distributor with 10,000 SKUs across two warehouses, counter sales for walk-ins, and tiered credit accounts for repair shops.');
        $engine->resolveConfirmCard($s, true);
        \Illuminate\Support\Facades\Cache::put('builder:v2:' . $s->id, $s->toArray(), now()->addHour());

        $this->assertContains('multi_location', $engine->modulesFor($s), 'two warehouses should ask for multi-location');

        $r = $this->postJson('/workspace/discover/plan-fit', ['session_id' => $s->id, 'plans' => ['core', 'scale']])->assertOk();
        $core = collect($r->json('held_back.core'))->pluck('key')->all();
        $this->assertContains('multi_location', $core, 'Core refuses a second warehouse, so the plan step must say it is left out');
        $this->assertSame('scale', collect($r->json('held_back.core'))->firstWhere('key', 'multi_location')['needs_plan']);
        $this->assertSame([], $r->json('held_back.scale'), 'Scale covers everything this owner described');
    }
}
