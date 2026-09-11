<?php

namespace App\Support;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Gap sweep (2026-09-10): end a user's OTHER sessions after a credential change.
 *
 * - database sessions: delete every row for this user except the current one;
 * - remember-me: rotate remember_token so old "remember me" cookies stop working;
 * - API tokens: delete Sanctum personal access tokens if the model has them.
 *
 * Called on password change (profile + platform security) and password reset.
 */
class SessionRevoker
{
    public static function revokeOthers(Authenticatable $user, ?Request $request = null): void
    {
        try {
            $currentId = $request && $request->hasSession() ? $request->session()->getId() : null;

            if (config('session.driver') === 'database' && Schema::hasTable(config('session.table', 'sessions'))) {
                DB::table(config('session.table', 'sessions'))
                    ->where('user_id', $user->getAuthIdentifier())
                    ->when($currentId, fn ($q) => $q->where('id', '!=', $currentId))
                    ->delete();
            }

            if (method_exists($user, 'setRememberToken')) {
                $user->setRememberToken(Str::random(60));
                if (method_exists($user, 'saveQuietly')) {
                    $user->saveQuietly();
                }
            }

            if (method_exists($user, 'tokens')) {
                $user->tokens()->delete();
            }
        } catch (\Throwable $e) {
            Log::warning('Session revocation after credential change failed', ['user_id' => $user->getAuthIdentifier(), 'error' => $e->getMessage()]);
        }
    }
}
