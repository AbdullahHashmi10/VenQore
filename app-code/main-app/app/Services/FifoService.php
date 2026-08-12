<?php

namespace App\Services;

/**
 * REMOVED — 2026-08-11, Legacy → V3 migration (§02 Step 2).
 *
 * This class had zero live call sites (verified by full-repo scan of app/, routes/,
 * database/) before removal. The canonical FIFO engine is app\Services\V3\FifoService.
 *
 * This file could not be physically deleted in the session that performed the
 * migration (no shell/filesystem-delete access was available). It is intentionally
 * left as an inert stub that throws on use so nothing can silently resurrect the
 * legacy generation. Delete this file outright the next time you have shell access;
 * nothing depends on it existing.
 *
 * See extras/New Positioning/v3/02_LEGACY_TO_V3.md.
 *
 * @deprecated Use \App\Services\V3\FifoService instead.
 */
class FifoService
{
    public function __construct(...$args)
    {
        throw new \RuntimeException(
            'App\\Services\\FifoService is decommissioned (Legacy → V3 migration). ' .
            'Use App\\Services\\V3\\FifoService instead. This file should be physically ' .
            'deleted — see extras/New Positioning/v3/02_LEGACY_TO_V3.md.'
        );
    }
}
