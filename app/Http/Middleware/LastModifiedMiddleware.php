<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Carbon\Carbon;

class LastModifiedMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only apply to GET and HEAD requests that are successful (status 200)
        if (!$request->isMethod('GET') && !$request->isMethod('HEAD')) {
            return $response;
        }

        if ($response->getStatusCode() !== 200) {
            return $response;
        }

        // Only apply to marketing routes
        $isMarketingRoute = $request->routeIs(
            'welcome',
            'marketing.*',
            'blog.*',
            'tools.*',
            'terms',
            'privacy',
            'demo.landing'
        );

        if (!$isMarketingRoute) {
            return $response;
        }

        // Determine Last-Modified time
        $lastModified = null;

        if ($request->routeIs('blog.show') && $slug = $request->route('slug')) {
            try {
                $post = \App\Models\BlogPost::where('slug', $slug)->first();
                if ($post && $post->updated_at) {
                    $lastModified = $post->updated_at;
                }
            } catch (\Throwable $e) {
                // Fail-safe
            }
        }

        if (!$lastModified) {
            // Default to the last modified time of the routes file (deploy-based)
            $routesPath = base_path('routes/web.php');
            if (file_exists($routesPath)) {
                $lastModified = Carbon::createFromTimestamp(filemtime($routesPath));
            } else {
                $lastModified = Carbon::parse('2026-08-01 00:00:00');
            }
        }

        // Format to RFC 7231 (HTTP-date format)
        $response->headers->set('Last-Modified', $lastModified->toRfc7231String());

        return $response;
    }
}
