<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Helpers\SettingsHelper;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Schema;

class ConfigureSystem
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip database queries entirely for installer/updater API routes
        // These routes manage their own DB connections and must not be interfered with
        if ($request->is('api/installer/*') || $request->is('api/updater/*') || $request->is('installer*')) {
            return $next($request);
        }

        try {
            // Ensure database is accessible before trying to read settings
            // This prevents crashes during initial installation or migration
            if (Schema::hasTable('settings')) {
                
                // 1. Timezone Configuration
                $timezone = SettingsHelper::get('timezone');
                if ($timezone) {
                    Config::set('app.timezone', $timezone);
                    date_default_timezone_set($timezone);
                }

                // 2. Language/Locale Configuration
                $locale = SettingsHelper::get('language');
                if ($locale) {
                    app()->setLocale($locale);
                    Config::set('app.locale', $locale);
                }

                // 3. Other System Configs can be injected here
                // e.g., Mail settings, etc.
            }
        } catch (\Exception $e) {
            // Silently fail if database connection issue or table missing
            // This allows the installer or error handler to take over
        }

        return $next($request);
    }
}
