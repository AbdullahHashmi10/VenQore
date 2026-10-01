<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A namespaced, JSON-valued preference belonging to a user, optionally scoped
 * to one store.
 *
 * Deliberately does NOT use the HasTenant trait. That trait's global scope
 * hard-blocks any query made without a bound tenant (`whereRaw('1 = 0')`), and
 * the account-wide rows here are exactly the rows with a null tenant_id —
 * they would become permanently unreadable. Scoping is done explicitly by
 * `forUser()` instead, which is narrower than the trait rather than looser:
 * every read is pinned to one user id.
 */
class UserPreference extends Model
{
    protected $guarded = [];

    protected $casts = [
        'value' => 'array',
    ];

    /* ------------------------------------------------------------------ *
     * Keys
     * ------------------------------------------------------------------ */

    /** Theme, mode, colours, font, density, radius. */
    public const KEY_APPEARANCE = 'appearance';

    /** 'classic' | 'new' — which shell the user is routed into. */
    public const KEY_EXPERIENCE = 'experience';

    /* ------------------------------------------------------------------ *
     * Reads
     * ------------------------------------------------------------------ */

    /**
     * Resolve a preference for a user, preferring the store-specific row and
     * falling back to their account-wide one.
     *
     * Both rows are fetched in a single query rather than two: this runs on
     * every authenticated page load, and a second round trip for a fallback
     * that is usually absent is not worth it.
     */
    public static function resolve(int $userId, ?int $tenantId, string $key): ?array
    {
        $rows = static::query()
            ->where('user_id', $userId)
            ->where('key', $key)
            ->when(
                $tenantId,
                fn ($q) => $q->where(fn ($w) => $w->where('tenant_id', $tenantId)->orWhereNull('tenant_id')),
                fn ($q) => $q->whereNull('tenant_id'),
            )
            ->get(['tenant_id', 'value']);

        if ($rows->isEmpty()) {
            return null;
        }

        $scoped = $rows->firstWhere('tenant_id', $tenantId);
        $global = $rows->firstWhere('tenant_id', null);

        $value = ($scoped ?? $global)?->value;

        return is_array($value) ? $value : null;
    }

    /**
     * Write a preference, replacing whatever was there.
     *
     * ── Why this is not `updateOrCreate(['tenant_id' => $tenantId, ...], ...)` ──
     *
     * That was the original implementation, and it was broken: `tenant_id` is
     * nullable, and in SQL `WHERE tenant_id = NULL` matches no rows — NULL is
     * never equal to anything, including itself. `updateOrCreate`'s lookup uses
     * plain `=` comparisons, so for an account-wide preference (`$tenantId ===
     * null`) it could never find the row it had just inserted. Every save from
     * the same account-wide scope therefore attempted an INSERT into a table
     * with a unique index on `(user_id, tenant_id, key)`, and the second save
     * collided with the first, throwing a QueryException that surfaced to the
     * user as a 500 — which their browser then reported as a stale-page 409 on
     * the next navigation, because the original error page was never seen.
     *
     * The fix is to build the lookup explicitly with `whereNull()` for a null
     * scope and `where()` for a real one, which is the only way to express
     * "match a NULL column" in SQL. Store-scoped saves (`$tenantId` is an int)
     * were never affected — this only broke the "apply to every store" option.
     */
    public static function put(int $userId, ?int $tenantId, string $key, array $value): void
    {
        $existing = static::query()
            ->where('user_id', $userId)
            ->where('key', $key)
            ->when(
                $tenantId === null,
                fn ($q) => $q->whereNull('tenant_id'),
                fn ($q) => $q->where('tenant_id', $tenantId),
            )
            ->first();

        if ($existing) {
            $existing->update(['value' => $value]);
            return;
        }

        static::create([
            'user_id' => $userId,
            'tenant_id' => $tenantId,
            'key' => $key,
            'value' => $value,
        ]);
    }
}
