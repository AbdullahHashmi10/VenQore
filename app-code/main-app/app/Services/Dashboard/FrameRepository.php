<?php

namespace App\Services\Dashboard;

use App\Models\DashboardFrame;
use App\Models\Tenant;
use App\Models\User;

final class FrameRepository
{
    /** @return array<int,array<string,mixed>> */
    public function allFor(Tenant $tenant, ?User $user = null): array
    {
        $frames = collect(config('dashboard_frames', []))
            ->map(fn (array $frame, string $key) => ['key' => $key, ...$frame, 'custom' => false])
            ->keyBy('key');

        DashboardFrame::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->get()
            ->each(function (DashboardFrame $custom) use ($frames): void {
                $slots = is_array($custom->slots) ? $custom->slots : [];
                $frames->put($custom->key, [
                    'key' => $custom->key,
                    'name' => $custom->name,
                    'rows' => collect($slots)->max(fn (array $slot) => (int) $slot['y'] + (int) $slot['h']) ?? 0,
                    'accent_slot' => $custom->accent_slot,
                    'slots' => $slots,
                    'custom' => true,
                ]);
            });

        return $frames->values()->all();
    }

    public function find(string $key, Tenant $tenant): ?array
    {
        $custom = DashboardFrame::withoutTenantScope()
            ->where('tenant_id', $tenant->id)
            ->where('key', $key)
            ->first();

        if ($custom !== null) {
            return [
                'key' => $custom->key,
                'name' => $custom->name,
                'rows' => collect($custom->slots)->max(fn (array $slot) => (int) $slot['y'] + (int) $slot['h']),
                'accent_slot' => $custom->accent_slot,
                'slots' => $custom->slots,
                'custom' => true,
            ];
        }

        $frame = config("dashboard_frames.{$key}");
        if (! is_array($frame)) {
            return null;
        }

        return ['key' => $key, ...$frame, 'custom' => false];
    }
}
