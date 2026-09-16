<?php

namespace App\Services\Dashboard;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\DashboardSanitizer;
use App\Reckoner\LayoutLaw;
use App\Reckoner\Reckoner;
use App\Reckoner\ReckonerRegistry;
use App\Support\BusinessTypes;
use Illuminate\Support\Facades\Log;

final class FrameFiller
{
    public function __construct(private readonly FrameRepository $frames)
    {
    }

    public function fill(string $frameKey, User $user, Tenant $tenant, string $role): array
    {
        $frame = $this->frames->find($frameKey, $tenant);
        if ($frame === null) {
            Log::warning('Unknown dashboard frame; falling back to classic.', [
                'frame_key' => $frameKey,
                'tenant_id' => $tenant->id,
            ]);
            $frame = $this->frames->find('classic', $tenant);
        }

        $allRegistryKeys = array_keys(ReckonerRegistry::all());
        $availability = app(Reckoner::class)->checkAvailability($allRegistryKeys, $user, $tenant);
        $availableKeys = array_keys(array_filter($availability));

        $pool = $this->pool($role, $tenant);
        $primaryCandidates = [];
        foreach ($pool as $entry) {
            $key = $entry['key'];
            if (! in_array($key, $availableKeys, true)) {
                continue;
            }
            $definition = ReckonerRegistry::find($key);
            if ($definition === null) {
                continue;
            }
            $shape = $definition['shape'];
            $class = $entry['class'] ?? CardClass::forShape($shape);
            $chart = LayoutLaw::defaultChartForShape(strtoupper($shape->value));
            $period = $entry['period'] ?? ($shape->value === 'scalar' ? 'today' : 'this_month');
            $primaryCandidates[] = [
                'key' => $key,
                'class' => $class,
                'chart' => $chart,
                'period' => $period,
            ];
        }

        $secondaryCandidates = [];
        foreach ($availableKeys as $key) {
            $definition = ReckonerRegistry::find($key);
            if ($definition === null) {
                continue;
            }
            $shape = $definition['shape'];
            $class = CardClass::forShape($shape);
            $chart = LayoutLaw::defaultChartForShape(strtoupper($shape->value));
            $period = match ($shape->value) {
                'scalar' => 'today',
                'series', 'multi_series' => 'this_year',
                'ranking', 'breakdown' => 'this_month',
                default => 'live'
            };
            $secondaryCandidates[] = [
                'key' => $key,
                'class' => $class,
                'chart' => $chart,
                'period' => $period,
            ];
        }

        $usedKeys = [];
        $slotCards = [];

        // Pass 1: Match slots with unused primary pool candidates matching accepted classes
        foreach ($frame['slots'] as $slot) {
            $match = null;
            foreach ($slot['accepts'] as $acceptedClass) {
                foreach ($primaryCandidates as $cand) {
                    if (in_array($cand['key'], $usedKeys, true) || $cand['class'] !== $acceptedClass) {
                        continue;
                    }
                    if (! LayoutLaw::isCategoryLegal($cand['chart'], $slot['category'])) {
                        continue;
                    }
                    $match = $cand;
                    break 2;
                }
            }
            if ($match !== null) {
                $usedKeys[] = $match['key'];
                $slotCards[$slot['slot']] = [
                    'slot' => $slot,
                    'cand' => $match,
                ];
            }
        }

        // Pass 2: Fill remaining slots with unused secondary module-enabled readings matching accepted classes
        foreach ($frame['slots'] as $slot) {
            if (isset($slotCards[$slot['slot']])) {
                continue;
            }
            $match = null;
            foreach ($slot['accepts'] as $acceptedClass) {
                foreach ($secondaryCandidates as $cand) {
                    if (in_array($cand['key'], $usedKeys, true) || $cand['class'] !== $acceptedClass) {
                        continue;
                    }
                    if (! LayoutLaw::isCategoryLegal($cand['chart'], $slot['category'])) {
                        continue;
                    }
                    $match = $cand;
                    break 2;
                }
            }
            if ($match !== null) {
                $usedKeys[] = $match['key'];
                $slotCards[$slot['slot']] = [
                    'slot' => $slot,
                    'cand' => $match,
                ];
            }
        }

        // Pass 3: Fill remaining slots with ANY unused secondary reading legal for the slot's category
        foreach ($frame['slots'] as $slot) {
            if (isset($slotCards[$slot['slot']])) {
                continue;
            }
            $match = null;
            foreach ($secondaryCandidates as $cand) {
                if (in_array($cand['key'], $usedKeys, true)) {
                    continue;
                }
                if (! LayoutLaw::isCategoryLegal($cand['chart'], $slot['category'])) {
                    continue;
                }
                $match = $cand;
                break;
            }
            if ($match !== null) {
                $usedKeys[] = $match['key'];
                $slotCards[$slot['slot']] = [
                    'slot' => $slot,
                    'cand' => $match,
                ];
            }
        }

        // Pass 4: If any slot is still unfilled (edge case: very few enabled readings), reuse legal candidates
        foreach ($frame['slots'] as $slot) {
            if (isset($slotCards[$slot['slot']])) {
                continue;
            }
            $match = null;
            foreach ($secondaryCandidates as $cand) {
                if (! LayoutLaw::isCategoryLegal($cand['chart'], $slot['category'])) {
                    continue;
                }
                $match = $cand;
                break;
            }
            if ($match !== null) {
                $slotCards[$slot['slot']] = [
                    'slot' => $slot,
                    'cand' => $match,
                ];
            }
        }

        $cards = [];
        foreach ($frame['slots'] as $slot) {
            if (! isset($slotCards[$slot['slot']])) {
                continue;
            }
            $entry = $slotCards[$slot['slot']]['cand'];
            $cards[] = [
                'tenant_id' => $tenant->id,
                'reading_key' => $entry['key'],
                'period' => $entry['period'],
                'chart' => $entry['chart'],
                'category' => $slot['category'],
                'fit' => $slot['fit'],
                'frame_slot' => $slot['slot'],
                'x' => $slot['x'],
                'y' => $slot['y'],
                'w' => $slot['w'],
                'h' => $slot['h'],
                'style' => ['accent' => (int) $slot['slot'] === (int) ($frame['accent_slot'] ?? 0)],
            ];
        }

        if (! collect($cards)->contains(fn (array $card) => ! empty($card['style']['accent']))) {
            foreach ($cards as &$card) {
                $slot = collect($frame['slots'])->firstWhere('slot', $card['frame_slot']);
                if (in_array($slot['role'] ?? null, ['metric', 'metric-wide', 'strip'], true)) {
                    $card['style']['accent'] = true;
                    break;
                }
            }
            unset($card);
        }

        return DashboardSanitizer::sanitize(LayoutLaw::enforceAccentBudget($cards), $availableKeys);
    }

    private function pool(string $role, Tenant $tenant): array
    {
        $roles = config('dashboard_pool.roles', []);
        if (isset($roles[$role])) {
            return $roles[$role];
        }

        $business = config('dashboard_pool.business', []);
        $aliases = config('dashboard_pool.aliases', []);
        $type = strtolower((string) ($tenant->business_type ?? ''));
        $key = BusinessTypes::presetFor($type) ?? $type;
        $key = isset($business[$key]) ? $key : ($aliases[$key] ?? $key);

        return $business[$key] ?? $business['default'] ?? [];
    }
}
