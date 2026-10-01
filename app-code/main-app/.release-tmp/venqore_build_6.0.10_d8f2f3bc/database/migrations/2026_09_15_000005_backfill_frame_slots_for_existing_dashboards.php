<?php

use App\Models\Dashboard;
use App\Models\DashboardCard;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Dashboard\FrameFiller;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        $frames = config('dashboard_frames', []);
        $dashboards = Dashboard::withoutGlobalScopes()->get();

        foreach ($dashboards as $dashboard) {
            $frameKey = $dashboard->frame_key ?: 'classic';
            $frame = $frames[$frameKey] ?? $frames['classic'] ?? null;
            if (!$frame) {
                continue;
            }

            $dashboardCards = DashboardCard::withoutGlobalScopes()
                ->where('dashboard_id', $dashboard->id)
                ->get();

            if ($dashboardCards->isEmpty()) {
                // Regenerate for zero-card dashboards
                $tenant = Tenant::find($dashboard->tenant_id);
                $user = User::find($dashboard->user_id) ?? ($tenant ? $tenant->users()->first() : null);
                if ($tenant && $user) {
                    $role = $dashboard->for_role ?: 'owner';
                    $filler = app(FrameFiller::class);
                    $filledCards = $filler->fill($frameKey, $user, $tenant, $role);
                    foreach ($filledCards as $cardData) {
                        DashboardCard::create([
                            'id' => (string) Str::uuid(),
                            'tenant_id' => $tenant->id,
                            'dashboard_id' => $dashboard->id,
                            'reading_key' => $cardData['reading_key'],
                            'period' => $cardData['period'] ?? 'this_month',
                            'chart' => $cardData['chart'] ?? 'stat',
                            'category' => $cardData['category'] ?? 'C3',
                            'fit' => $cardData['fit'] ?? 'standard',
                            'frame_slot' => $cardData['frame_slot'] ?? null,
                            'x' => $cardData['x'] ?? 0,
                            'y' => $cardData['y'] ?? 0,
                            'w' => $cardData['w'] ?? 3,
                            'h' => $cardData['h'] ?? 2,
                            'style' => $cardData['style'] ?? [],
                        ]);
                    }
                }
            } else {
                // Assign frame_slot to existing cards
                $usedSlots = [];
                // First pass: exact (x, y, w, h) matches
                foreach ($dashboardCards as $card) {
                    if ($card->frame_slot !== null) {
                        $usedSlots[$card->frame_slot] = true;
                        continue;
                    }
                    foreach ($frame['slots'] as $slot) {
                        if (isset($usedSlots[$slot['slot']])) {
                            continue;
                        }
                        if ((int)$card->x === (int)$slot['x'] && (int)$card->y === (int)$slot['y'] && (int)$card->w === (int)$slot['w'] && (int)$card->h === (int)$slot['h']) {
                            $card->update([
                                'frame_slot' => $slot['slot'],
                                'category' => $slot['category'],
                                'fit' => $slot['fit'],
                            ]);
                            $usedSlots[$slot['slot']] = true;
                            break;
                        }
                    }
                }

                // Second pass: match remaining cards to open slots by category/w/h
                foreach ($dashboardCards as $card) {
                    if ($card->frame_slot !== null) {
                        continue;
                    }
                    foreach ($frame['slots'] as $slot) {
                        if (isset($usedSlots[$slot['slot']])) {
                            continue;
                        }
                        if ($card->category === $slot['category'] || ((int)$card->w === (int)$slot['w'] && (int)$card->h === (int)$slot['h'])) {
                            $card->update([
                                'frame_slot' => $slot['slot'],
                                'category' => $slot['category'],
                                'fit' => $slot['fit'],
                                'x' => $slot['x'],
                                'y' => $slot['y'],
                                'w' => $slot['w'],
                                'h' => $slot['h'],
                            ]);
                            $usedSlots[$slot['slot']] = true;
                            break;
                        }
                    }
                }
            }

            // Ensure frame_key and frame_dirty are valid
            $dashboard->update([
                'frame_key' => $frameKey,
                'frame_dirty' => $dashboard->frame_dirty ?? false,
            ]);
        }
    }

    public function down(): void
    {
        // No-op rollback for data backfill
    }
};