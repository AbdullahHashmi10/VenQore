<?php

namespace Tests\Feature\Ai;

use App\Services\PlanAiAllowance;
use App\Services\Vena\VenaKnowledge;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * Vena's product knowledge must never point at something that does not exist.
 * These laws iterate every guide, so adding a guide needs no new test code.
 */
class VenaKnowledgeTest extends TestCase
{
    public function test_every_guide_points_at_real_routes_and_modules(): void
    {
        $guides = config('vena_guides');
        $this->assertNotEmpty($guides);

        $bad = [];
        foreach ($guides as $id => $g) {
            foreach (['title', 'aliases', 'summary', 'steps'] as $field) {
                if (empty($g[$field])) {
                    $bad[] = "{$id}: missing {$field}";
                }
            }
            if (!empty($g['module']) && config("modules.{$g['module']}") === null) {
                $bad[] = "{$id}: unknown module {$g['module']}";
            }
            if (!empty($g['route']) && !Route::has($g['route'])) {
                $bad[] = "{$id}: unknown route {$g['route']}";
            }
            foreach ((array) ($g['steps'] ?? []) as $i => $step) {
                if (is_array($step) && !empty($step['route']) && !Route::has($step['route'])) {
                    $bad[] = "{$id}: step {$i} unknown route {$step['route']}";
                }
            }
        }

        $this->assertSame([], $bad, implode("\n", $bad));
    }

    public function test_online_store_question_is_answered_without_a_model(): void
    {
        VenaKnowledge::flush();
        $out = app(VenaKnowledge::class)->consult('how do I turn on the online store', null, null);

        $this->assertNotNull($out['direct'], 'a how-to on the online store must resolve deterministically');
        $this->assertNotSame('', $out['direct']['text']);
    }

    public function test_unrelated_question_is_not_hijacked(): void
    {
        $out = app(VenaKnowledge::class)->consult('what is the weather like on mars', null, null);
        $this->assertNull($out['direct']);
    }

    public function test_trial_plan_is_not_auto_sized_onto_the_paid_key(): void
    {
        $tenant = new \App\Models\Tenant(['plan' => 'trial']);
        $tenant->id = 987654;

        $this->assertNull(PlanAiAllowance::allowanceFor($tenant));
    }
}
