<?php

namespace App\Services\Dashboard;

use App\Models\Tenant;
use App\Models\User;
use App\Reckoner\CardRegistry;
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
            $key = is_array($entry) ? ($entry['key'] ?? null) : (is_string($entry) ? $entry : null);
            if (! is_string($key) || ! in_array($key, $availableKeys, true)) {
                continue;
            }
            $definition = ReckonerRegistry::find($key);
            if ($definition === null) {
                continue;
            }
            $shape = $definition['shape'];
            $class = (is_array($entry) && isset($entry['class'])) ? $entry['class'] : CardClass::forShape($shape);
            $chart = LayoutLaw::defaultChartForShape(strtoupper($shape->value));
            $period = (is_array($entry) && isset($entry['period'])) ? $entry['period'] : match ($shape->value) {
                'scalar' => 'today',
                'series', 'multi_series' => 'this_year',
                'ranking', 'breakdown' => 'this_month',
                default => 'live'
            };
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
            $cardDef = CardRegistry::find($key);
            $weight = (int) ($cardDef['weight'] ?? 50);
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
                'weight' => $weight,
            ];
        }
        usort($secondaryCandidates, fn (array $a, array $b) => $b['weight'] <=> $a['weight']);

        $usedKeys = [];
        $slotCards = [];

        // Pass 1: Match slots with unused primary pool / default12 candidates matching accepted classes
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

        // Note: Slots that cannot be filled with a unique available reading remain empty slots.
        // They render as dashed "Add a card" placeholder slots on the frontend without collapsing grid geometry.

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

        $cards = self::applyColourRhythm($cards);
        $cards = self::applyChartRhythm($cards);

        return DashboardSanitizer::sanitize(LayoutLaw::enforceAccentBudget($cards), $availableKeys);
    }

    private function pool(string $role, Tenant $tenant): array
    {
        $roles = config('dashboard_pool.roles', []);
        if (isset($roles[$role]) && ! in_array($role, ['owner', 'admin', 'superadmin'], true)) {
            return $roles[$role];
        }

        $type = strtolower((string) ($tenant->business_type ?? ''));
        $businesses = CardRegistry::businesses();
        if (isset($businesses[$type]['default12']) && is_array($businesses[$type]['default12'])) {
            return $businesses[$type]['default12'];
        }

        $presets = CardRegistry::presets();
        $presetKey = $businesses[$type]['preset'] ?? BusinessTypes::presetFor($type) ?? $type;
        if (isset($presets[$presetKey]['default12']) && is_array($presets[$presetKey]['default12'])) {
            return $presets[$presetKey]['default12'];
        }

        $businessPool = config('dashboard_pool.business', []);
        $aliases = config('dashboard_pool.aliases', []);
        $resolvedKey = isset($businessPool[$presetKey]) ? $presetKey : ($aliases[$presetKey] ?? $presetKey);

        if (isset($businessPool[$resolvedKey])) {
            return $businessPool[$resolvedKey];
        }

        if (isset($roles[$role])) {
            return $roles[$role];
        }

        return $businessPool['default'] ?? [];
    }

    /**
     * A first dashboard should not be a wall of white. Besides the one mint
     * accent card, one roomy card is Obsidian and one is Aurora Mesh; the rest
     * stay on the page surface. Only the first board is seeded this way — every
     * card stays editable, and a saved choice is never touched again.
     */
    private static function applyColourRhythm(array $cards): array
    {
        $candidates = [];
        foreach ($cards as $i => $card) {
            if (! empty($card['style']['accent'])) {
                continue;
            }
            if (((int) ($card['w'] ?? 0)) * ((int) ($card['h'] ?? 0)) >= 6) {
                $candidates[] = $i;
            }
        }
        if (count($candidates) >= 2) {
            $cards[$candidates[1]]['style']['tone'] = 'ink';
        }
        if (count($candidates) >= 4) {
            $cards[$candidates[min(4, count($candidates) - 1)]]['style']['tone'] = 'mesh';
        }

        return $cards;
    }

    /**
     * A first dashboard should not be a wall of numbers. A roomy card whose
     * reading keeps a day-by-day history opens as a chart — an area, then
     * columns, alternating — instead of a bare figure. Only readings that
     * really have a history are drawn this way, so nothing is invented.
     */
    private static function applyChartRhythm(array $cards): array
    {
        $n = 0;
        foreach ($cards as $i => $card) {
            if (! empty($card['style']['family'])) {
                continue;
            }
            $w = (int) ($card['w'] ?? 0);
            $h = (int) ($card['h'] ?? 0);
            if ($w < 4 || $h < 3) {
                continue;
            }
            $def = ReckonerRegistry::find($card['reading_key']);
            $isScalar = $def !== null && ($def['shape']->value ?? null) === 'scalar';
            if (! $isScalar || CardRegistry::find($card['reading_key'].'_trend') === null) {
                continue;
            }
            $cards[$i]['style']['family'] = ($n++ % 2 === 0) ? 'area' : 'bar';
        }

        return $cards;
    }
}
