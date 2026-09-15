<?php

namespace App\Http\Middleware;

use App\Services\GeoPricingService;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class GeoPricingMiddleware
{
    protected GeoPricingService $geoService;

    public function __construct(GeoPricingService $geoService)
    {
        $this->geoService = $geoService;
    }

    public function handle(Request $request, Closure $next): Response
    {
        // 1. Resolve country & currency information
        $country = $this->geoService->resolveCountry($request);
        $geoInfo = $this->geoService->getCurrencyInfo($country);

        // 2. Share with Inertia templates dynamically
        Inertia::share([
            'geo' => [
                'country'  => $geoInfo['country'],
                'currency' => $geoInfo['currency'],
                'symbol'   => $geoInfo['symbol'],
            ]
        ]);

        return $next($request);
    }
}
