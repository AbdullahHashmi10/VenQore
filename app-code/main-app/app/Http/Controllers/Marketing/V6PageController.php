<?php

namespace App\Http\Controllers\Marketing;

use Illuminate\Http\Response;

/**
 * V6PageController — serves the static V6 marketing pages from public/v6.
 *
 * ── Why this exists instead of response()->file() ──────────────────────────
 *
 * The V6 site is hand-authored static HTML, but three of its forms post back
 * into the application: the waitlist/newsletter form (13 pages), the contact
 * form, and the homepage hero prompt. A file served with response()->file()
 * is a byte stream — there is nowhere to put a CSRF token, so those forms
 * could never post to a session-protected route.
 *
 * Serving the same file through here injects `<meta name="csrf-token">` into
 * the head, which public/v6/assets/venqore-forms.js reads before submitting.
 * CSRF protection stays fully on; the static pages simply gain a token.
 *
 * The pages are read from disk on each request (they are small and nginx is
 * not caching them). If that ever shows up in profiling, cache the injected
 * HTML per page + token rather than reverting to response()->file().
 */
class V6PageController
{
    /**
     * Render one page of the V6 marketing site.
     *
     * @param  string  $page  Page slug without the .html extension.
     */
    public static function render(string $page): Response
    {
        // Defence in depth: the routes already constrain the parameter, but
        // this method is also called with literals, so normalise regardless.
        $page = preg_replace('/[^a-z0-9\-]/', '', strtolower($page));

        if ($page === '') {
            $page = 'index';
        }

        $file = public_path("v6/{$page}.html");
        abort_unless(is_file($file), 404);

        $html = file_get_contents($file);

        if ($html === false) {
            abort(404);
        }

        // str_replace rather than preg_replace: a CSRF token is alphanumeric
        // today, but a regex replacement would treat any future "$" or "\" in
        // it as a backreference. Every V6 page opens its head with this exact
        // charset tag (they share one template), so one anchor covers all of
        // them; a page without it simply ships without the meta and its forms
        // fall back to the "please try again" path rather than breaking.
        $meta = '<meta name="csrf-token" content="' . e(csrf_token()) . '">';
        $html = str_replace(
            '<meta charset="UTF-8">',
            '<meta charset="UTF-8">' . "\n" . $meta,
            $html
        );

        return response($html, 200)
            ->header('Content-Type', 'text/html; charset=UTF-8')
            // These carry a per-session CSRF token — never let a shared cache
            // hold one and hand it to a different visitor.
            ->header('Cache-Control', 'private, no-store, max-age=0');
    }
}
