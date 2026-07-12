<?php

namespace App\Support;

use Illuminate\Http\RedirectResponse;

/**
 * GiftRedirect
 *
 * Same shape as InviteRedirect (see that class's docblock) but for gift
 * links: a logged-out visitor who opens /gift/{token} (behind `auth`) must,
 * after logging in or registering, land back on the gift-acceptance page —
 * not the normal "create or join a store" flow.
 *
 * How the token is preserved:
 *   1. A logged-out person opens /gift/{token}. Laravel's auth middleware
 *      stores that full URL as "intended" and redirects to /login.
 *   2. The login/register page load calls captureFromIntended(), lifting the
 *      token onto a durable session key.
 *   3. Immediately after authentication, the controller calls pending(),
 *      which redirects to the gift page and clears the token so it can't
 *      cause a stale redirect on a later, unrelated login.
 */
class GiftRedirect
{
    private const KEY = 'pending_gift_token';

    public static function captureFromIntended(): void
    {
        if (session()->has(self::KEY)) {
            return; // already captured
        }

        $intended = session('url.intended');
        if (!is_string($intended) || !str_contains($intended, '/gift/')) {
            return;
        }

        $path = (string) parse_url($intended, PHP_URL_PATH);
        $segments = explode('/', trim($path, '/'));
        $token = end($segments);

        if (!empty($token) && $token !== 'gift') {
            session([self::KEY => $token]);
        }
    }

    public static function pending(): ?RedirectResponse
    {
        $token = session(self::KEY);
        if (!$token) {
            return null;
        }

        session()->forget(self::KEY);

        return redirect()->route('gift.show', ['token' => $token]);
    }
}
