<?php

namespace App\Services\Builder;

/**
 * Live is not ready (BUILDER_FINAL_PLAN.md §7).
 *
 * A module is offered only when: the registry says live, Phase 0 has not marked
 * it blocked, the plan entitles it, and every dependency passes the same checks.
 */
class CapabilityGate
{
    /** @var ?callable(string,?string):bool */
    private $entitled;

    /** @param ?callable(string,?string):bool $entitled fn(moduleKey, planKey) => bool; null = no plan restriction yet */
    public function __construct(private BuilderPolicy $policy, ?callable $entitled = null)
    {
        $this->entitled = $entitled;
    }

    /**
     * @return array{ok:bool,reason:?string,gap:?string,coming_soon:bool}
     */
    public function check(string $module, ?string $plan = null): array
    {
        $reg = $this->policy->modules[$module] ?? null;
        if (! $reg) {
            return $this->no('Not available.', null, false);
        }
        $cap = $this->policy->capabilities['modules'][$module] ?? null;

        if (($cap['state'] ?? null) === 'blocked') {
            return $this->no('Coming soon — we\'ll notify you.', $cap['gap'] ?? null, true);
        }
        if (($reg['status'] ?? null) !== 'live') {
            return $this->no('Coming soon — we\'ll notify you.', $cap['gap'] ?? null, true);
        }
        if ($this->entitled && ! ($this->entitled)($module, $plan)) {
            return $this->no('Available on a higher plan.', null, false);
        }

        return ['ok' => true, 'reason' => null, 'gap' => null, 'coming_soon' => false];
    }

    /** Modules whose own check fails, plus the reason. @param array<int,string> $modules */
    public function filter(array $modules, ?string $plan = null): array
    {
        $kept = [];
        $dropped = [];
        foreach ($modules as $m) {
            $r = $this->check($m, $plan);
            $r['ok'] ? $kept[] = $m : $dropped[$m] = $r;
        }

        return ['kept' => $kept, 'dropped' => $dropped];
    }

    /** Every composable module still in `registry_live` — the launch-gate report (§14). */
    public function unverified(): array
    {
        $out = [];
        foreach ($this->policy->capabilities['modules'] ?? [] as $m => $c) {
            if (($c['state'] ?? '') === 'registry_live') {
                $out[] = $m;
            }
        }

        return $out;
    }

    private function no(string $reason, ?string $gap, bool $soon): array
    {
        return ['ok' => false, 'reason' => $reason, 'gap' => $gap, 'coming_soon' => $soon];
    }
}
