<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/**
 * CanonicalHostMiddleware (2026-07-05 SEO/security fix).
 *
 * WHY: SEMrush's site audit found www.venqore.com serving 200 OK in parallel
 * with venqore.com — both fully crawlable, both indexable, with only a
 * <link rel="canonical"> tag (no HTTP redirect) telling search engines which
 * one to prefer. That is a soft signal; a 301 is the real fix, and it also
 * shrinks the crawl surface that was producing duplicate-title-tag reports
 * (e.g. /register was flagged as a duplicate of itself across both hosts).
 * It also found "No HSTS support" on the homepage — added below.
 *
 * SAFETY: this only matches the literal host "www.venqore.com". Tenant store
 * subdomains (e.g. acme.venqore.com) and local dev (127.0.0.1:8000) never
 * match this string, so multi-tenant subdomain resolution is untouched.
 */
class CanonicalHostMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        if (strtolower($request->getHost()) === 'www.venqore.com') {
            return redirect()->away(
                'https://venqore.com' . $request->getRequestUri(),
                301
            );
        }

        $response = $next($request);

        if ($request->isSecure() && !$response->headers->has('Strict-Transport-Security')) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        return $response;
    }
}
