<?php

namespace App\Services\Builder;

use Illuminate\Support\Facades\DB;

/**
 * Plan §11 — builder events from the very first signup. Best effort: telemetry
 * must never break onboarding, so every failure is swallowed.
 *
 * Events: builder.started · screen.shown · screen.answered · screen.skipped ·
 * screen.unsure · confirm_card.result · fact.revised · preview.shown ·
 * stopped_early · readback.confirmed · readback.edited · missing.searched ·
 * missing.added · missing.requested · provisioned
 */
class BuilderTelemetry
{
    public static function record(string $event, ?BuilderSession $s = null, array $props = [], ?int $tenantId = null): void
    {
        try {
            DB::table('builder_events')->insert([
                'session_id' => $s?->id,
                'tenant_id' => $tenantId,
                'event' => $event,
                'type_key' => $s?->typeKey,
                'policy_version' => BuilderPolicy::VERSION,
                'props' => $props ? json_encode($props, JSON_UNESCAPED_UNICODE) : null,
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            // never block the owner
        }
    }
}
