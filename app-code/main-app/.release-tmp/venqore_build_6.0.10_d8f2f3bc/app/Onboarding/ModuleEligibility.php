<?php

namespace App\Onboarding;

use App\Support\BusinessTypes;

/**
 * The owner-facing module offer. Classification only decides which choices are
 * useful to show; this class never enables a module. ApplyConfigurationService
 * remains the single writer after the owner confirms their cart.
 */
final class ModuleEligibility
{
    public const ALWAYS_ON = ['customers', 'payments', 'expenses', 'reports'];

    /**
     * Rules that are genuinely impossible, not merely unlikely. Keep these
     * conservative: hiding a useful option is worse than showing an optional
     * one. Rules use a sector name or a concrete business-type key.
     */
    private const RULES = [
        'table_service' => [
            'only' => ['restaurant', 'pub_lounge'],
            'why' => 'Floor plans and kitchen tickets only make sense where guests sit at tables.',
        ],
        'serials' => [
            'only' => ['phone_repair', 'computer_repair', 'mobile_retail', 'electronics', 'jewellery', 'optical', 'auto_parts', 'tyre_battery'],
            'why' => 'Serial tracking is for individually identifiable units.',
        ],
        'cookbook' => [
            'only' => ['food', 'manufacturing'],
            'why' => 'Recipes and bills of materials are only useful when inputs become an output.',
        ],
        'production_runs' => [
            'only' => ['food', 'manufacturing'],
            'why' => 'Production runs are for making or preparing goods.',
        ],
        'landed_cost' => [
            'only' => ['wholesale', 'manufacturing', 'import_export'],
            'why' => 'Landed cost belongs to importing and distribution.',
        ],
        'batches_expiry' => [
            'only' => ['pharmacy', 'surgical_supplies', 'cosmetics', 'grocery', 'supermarket', 'food', 'chemicals', 'coffee_spice', 'soap_candle'],
            'why' => 'Batch and expiry tracking is for perishable or traceable goods.',
        ],
    ];

    /** @return array{offered:bool, reason:?string, needs:string[], needsAny:string[]} */
    public function evaluate(string $moduleKey, string $businessKey): array
    {
        $type = BusinessTypes::get($businessKey);
        $sector = $type['sector'] ?? null;
        $module = config("modules.{$moduleKey}", []);
        $rule = self::RULES[$moduleKey] ?? [];
        $only = (array) ($rule['only'] ?? []);

        $matches = fn (string $value): bool => $value === $businessKey || $value === $sector;
        $offered = $only === [] || (bool) array_filter($only, $matches);

        return [
            'offered' => $offered,
            'reason' => $offered ? null : ($rule['why'] ?? 'This module does not apply to this kind of business.'),
            'needs' => array_values($module['requires'] ?? []),
            // config/modules.php stores alternative prerequisite groups. The
            // UI only needs the flattened choices to explain the gate.
            'needsAny' => array_values(array_unique(array_merge(...array_map(
                fn ($group) => (array) $group,
                (array) ($module['requires_one'] ?? []),
            )))),
        ];
    }

    /**
     * Five compact questions, ordered so a likely preset is pre-ticked but
     * never silently selected. The client can render these directly.
     */
    public function plan(string $businessKey): array
    {
        $type = BusinessTypes::get($businessKey);
        if ($type === null) {
            throw new \InvalidArgumentException("Unknown business type '{$businessKey}'.");
        }

        $suggested = array_flip(BusinessTypes::modulesFor($businessKey));
        $offered = [];
        $hidden = [];

        foreach (config('modules', []) as $key => $module) {
            if (($module['status'] ?? null) !== 'live' || in_array($key, self::ALWAYS_ON, true)) {
                continue;
            }

            $eligibility = $this->evaluate($key, $businessKey);
            if (! $eligibility['offered']) {
                $hidden[$key] = $eligibility['reason'];
                continue;
            }

            $offered[] = [
                'key' => $key,
                'label' => $module['label'] ?? ucfirst(str_replace('_', ' ', $key)),
                'description' => $module['description'] ?? '',
                'group' => $module['group'] ?? 'G',
                'cardCount' => count($module['cards'] ?? []),
                'preselected' => isset($suggested[$key]),
                'needs' => $eligibility['needs'],
                'needsAny' => $eligibility['needsAny'],
            ];
        }

        // A stable sort makes a returning owner see the same five questions;
        // pre-ticked modules lead within each group, then registry order wins.
        usort($offered, fn (array $a, array $b) => [!$a['preselected'], $a['group'], $a['key']] <=> [!$b['preselected'], $b['group'], $b['key']]);
        $rounds = array_chunk($offered, max(1, (int) ceil(count($offered) / 5)));

        return [
            'business' => ['key' => $businessKey, 'label' => $type['label'], 'sector' => $type['sector']],
            'alwaysOn' => self::ALWAYS_ON,
            'neverOffered' => $hidden,
            'rounds' => array_values($rounds),
        ];
    }
}
