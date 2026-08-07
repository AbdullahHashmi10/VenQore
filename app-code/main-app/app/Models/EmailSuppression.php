<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * EmailSuppression — global do-not-send list.
 *
 * PLATFORM-LEVEL MODEL. No tenant scoping.
 * Checked before every outbound marketing send (tools AND newsletter).
 * See SEO/SEO Tools/VENQORE_FREE_TOOLS_IMPLEMENTATION_PLAN.md §6.5.
 */
class EmailSuppression extends Model
{
    protected $fillable = ['email', 'reason', 'source'];

    public static function isSuppressed(string $email): bool
    {
        return static::where('email', strtolower(trim($email)))->exists();
    }

    public static function suppress(string $email, string $reason, ?string $source = null): self
    {
        return static::updateOrCreate(
            ['email' => strtolower(trim($email))],
            ['reason' => $reason, 'source' => $source]
        );
    }

    /**
     * Clear a suppression created by a self-service unsubscribe only.
     * hard_bounce, complaint and manual suppressions are never auto-cleared —
     * those require manual review (plan §6.5).
     */
    public static function liftIfUnsubscribed(string $email): void
    {
        static::where('email', strtolower(trim($email)))
            ->where('reason', 'unsubscribed')
            ->delete();
    }
}
