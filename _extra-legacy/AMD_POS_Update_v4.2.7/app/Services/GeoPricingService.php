<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeoPricingService
{
    /**
     * Resolve the visitor's country code (e.g. 'PK', 'US')
     */
    public function resolveCountry(Request $request): string
    {
        // 1. Check for manual session override (e.g. user toggled region manually)
        if ($request->hasSession() && session()->has('geo_country_override')) {
            return strtoupper(session('geo_country_override'));
        }

        // 2. Read Cloudflare's secure edge geolocation header
        $cfCountry = $request->header('CF-IPCountry') ?: ($request->server('HTTP_CF_IPCOUNTRY') ?: null);
        if ($cfCountry && strlen($cfCountry) === 2 && $cfCountry !== 'XX') {
            return strtoupper($cfCountry);
        }

        // 3. Fallback: Parse request IP for local/development environments
        $ip = $request->ip();

        // Skip geo-lookup for local loopback IPs
        if (in_array($ip, ['127.0.0.1', '::1', 'localhost'])) {
            return 'US'; // Default to USD for local testing
        }

        // Cache the lookup for 30 days to avoid latency and API limits
        return Cache::remember('geo_ip_country_' . md5($ip), now()->addDays(30), function () use ($ip) {
            try {
                $response = Http::timeout(3)->get("http://ip-api.com/json/{$ip}");
                if ($response->successful() && $response->json('status') === 'success') {
                    $countryCode = $response->json('countryCode');
                    if ($countryCode && strlen($countryCode) === 2) {
                        return strtoupper($countryCode);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("GeoPricingService lookup failed for IP {$ip}: " . $e->getMessage());
            }

            return 'US'; // Ultimate fallback is USD
        });
    }

    /**
     * Get currency configurations for a country code
     */
    public function getCurrencyInfo(string $countryCode): array
    {
        if ($countryCode === 'PK') {
            return [
                'country' => 'PK',
                'currency' => 'PKR',
                'symbol' => 'Rs',
            ];
        }

        return [
            'country' => $countryCode,
            'currency' => 'USD',
            'symbol' => '$',
        ];
    }
}
