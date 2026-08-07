<?php

namespace App\Support;

use Illuminate\Http\RedirectResponse;

/**
 * InviteRedirect
 *
 * Centralises one rule shared by every auth entry point (email login,
 * registration, Google OAuth): a user who arrived via an invite magic-link
 * must finish ACCEPTING that invite — they must NOT be pushed into the
 * "create your own store / pick a plan" flow.
 *
 * How the token is preserved:
 *   1. A logged-out person opens /invite/accept?token=... (which is behind the
 *      `auth` middleware). Laravel's auth middleware stores that full URL as the
 *      "intended" URL and redirects them to /login.
 *   2. When the login/register page loads we lift the token out of the intended
 *      URL onto a durable session key (captureFromIntended()).
 *   3. Immediately after authentication each controller calls pending(), which
 *      returns a redirect to the invite-acceptance page and clears the token so
 *      it can never cause a stale redirect on a later login.
 */
class InviteRedirect
{
    private const KEY = 'pending_invite_token';

    /**
     * Capture an invite token from the intended URL (if the user is mid-invite).
     * Safe to call on every login/register page load; it no-ops otherwise.
     */
    public static function captureFromIntended(): void
    {
        if (session()->has(self::KEY)) {
            return; // already captured
        }

        $intended = session('url.intended');
        if (!is_string($intended) || !str_contains($intended, '/invite/accept')) {
            return;
        }

        parse_str((string) parse_url($intended, PHP_URL_QUERY), $params);
        if (!empty($params['token'])) {
            session([self::KEY => $params['token']]);
        }
    }

    /**
     * If an invite is pending, return a redirect to accept it and clear the
     * stored token. Returns null when there is no pending invite.
     */
    public static function pending(): ?RedirectResponse
    {
        $token = session(self::KEY);
        if (!$token) {
            return null;
        }

        session()->forget(self::KEY);

        return redirect()->route('invite.accept', ['token' => $token]);
    }
}
