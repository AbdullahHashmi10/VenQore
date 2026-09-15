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

        $pool = $this->pool($role, $tenant);
        $keys = array_values(array_unique(array_column($pool, 'key')));
        $availability = app(Reckoner::class)->checkAvailability($keys, $user, $tenant);
        $availableKeys = array_keys(array_filter($availability));

        $candidates = [];
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
            $candidates[] = [...$entry, 'class' => $class, 'chart' => $chart];
        }

        $used = [];
        $cards = [];
        foreach ($frame['slots'] as $slot) {
            $match = null;
            foreach ($slot['accepts'] as $acceptedClass) {
                foreach ($candidates as $index => $candidate) {
                    if (isset($used[$index]) || $candidate['class'] !== $acceptedClass) {
                        continue;
                    }
                    if (! LayoutLaw::isCategoryLegal($candidate['chart'], $slot['category'])) {
                        continue;
                    }
                    $match = $index;
                    break 2;
                }
            }

            if ($match === null) {
                continue;
            }

            $used[$match] = true;
            $entry = $candidates[$match];
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
