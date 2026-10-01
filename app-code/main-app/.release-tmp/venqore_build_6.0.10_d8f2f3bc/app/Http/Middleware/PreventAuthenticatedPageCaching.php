<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Keeps authenticated pages out of the browser's back/forward cache.
 *
 * ── The bug this exists to kill ─────────────────────────────────────────────
 *
 * Chrome's bfcache restores a page from memory on back/forward navigation,
 * including the CSRF token that was embedded in its HTML. If the session has
 * rotated its token in the meantime, the restored page holds a dead one. The
 * next POST from that page fails CSRF with a 419, which the exception handler
 * converts into an Inertia redirect — and Inertia signals redirects to the
 * client as a 409. The browser console therefore reports "409 Conflict" for
 * what is actually an expired token, which sends anyone debugging it looking
 * for an Inertia asset-version mismatch that was never there.
 *
 * `no-store` is the specific directive that disqualifies a response from
 * bfcache. `no-cache` alone is not enough: it forces revalidation, but a
 * bfcache restore skips the network entirely, so there is nothing to
 * revalidate against.
 *
 * Applied only to authenticated, non-Inertia-XHR HTML responses. Marketing
 * pages stay cacheable — they carry no session state worth protecting, and
 * making them uncacheable would cost real page-load performance for logged-out
 * visitors.
 */
class PreventAuthenticatedPageCaching
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (! $request->user()) {
            return $response;
        }

        // Inertia XHR responses are JSON consumed by the client router and are
        // never bfcached themselves; it is the underlying HTML document that
        // gets restored. Tagging the XHR adds nothing.
        if ($request->header('X-Inertia')) {
            return $response;
        }

        $contentType = $response->headers->get('Content-Type', '');

        if ($contentType !== '' && ! str_contains($contentType, 'text/html')) {
            return $response;
        }

        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
        $response->headers->set('Pragma', 'no-cache');

        return $response;
    }
}
