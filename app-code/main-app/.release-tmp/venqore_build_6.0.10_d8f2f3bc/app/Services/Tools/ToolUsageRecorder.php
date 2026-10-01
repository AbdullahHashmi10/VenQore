<?php

namespace App\Services\Tools;

use App\Models\ToolUsage;

/**
 * ToolUsageRecorder — the only sanctioned writer to tool_usages.
 *
 * HARD RULE (plan §4.3 / §9.3): $metrics must be numeric/enum/count data
 * only. Never pass an email, IP address, name, or any fragment of an
 * uploaded file's content. This table is aggregated into the VenQore
 * Retail Index and is expected to be safe to publish in aggregate;
 * anything identifying written here is a data-handling bug, not a style
 * preference.
 */
class ToolUsageRecorder
{
    public function record(string $toolSlug, ?string $variant = null, ?string $country = null, array $metrics = []): ToolUsage
    {
        return ToolUsage::create([
            'tool_slug' => $toolSlug,
            'variant'   => $variant,
            'country'   => $country ? strtoupper(substr($country, 0, 2)) : null,
            'metrics'   => $metrics,
            'used_on'   => now()->toDateString(),
        ]);
    }
}
