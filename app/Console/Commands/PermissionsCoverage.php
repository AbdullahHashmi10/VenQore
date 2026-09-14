<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Route;

class PermissionsCoverage extends Command
{
    protected $signature = 'permissions:coverage';
    protected $description = 'Analyze and print all routes missing the permission middleware, grouped by risk.';

    public function handle()
    {
        $this->info("Analyzing route permission coverage...");

        $routes = Route::getRoutes();
        $missing = [];

        foreach ($routes as $route) {
            $uri = $route->uri();
            $methods = $route->methods();
            $action = $route->getActionName();
            $middleware = $route->gatherMiddleware();

            // Skip internal/debug/public routes
            if (
                str_starts_with($uri, '_') || // Ignition, etc.
                str_starts_with($uri, 'sanctum/') ||
                str_starts_with($uri, 'api/installer') ||
                str_starts_with($uri, 'installer') ||
                str_starts_with($uri, 'api/webhooks') ||
                str_starts_with($uri, 'login') ||
                str_starts_with($uri, 'logout') ||
                str_starts_with($uri, 'register') ||
                str_starts_with($uri, 'password/') ||
                str_starts_with($uri, 'email/') ||
                str_starts_with($uri, 'gift/') ||
                str_starts_with($uri, 'gift')
            ) {
                continue;
            }

            // Check if permission middleware is present
            $hasPermission = false;
            foreach ($middleware as $mw) {
                if (is_string($mw) && ($mw === 'permission' || str_starts_with($mw, 'permission:'))) {
                    $hasPermission = true;
                    break;
                }
            }

            // Skip platform superadmin routes which are guarded differently
            $isSuperAdmin = in_array('superadmin', $middleware) || 
                            str_contains($action, 'SuperAdmin') || 
                            str_starts_with($uri, 'VenQore');

            if ($isSuperAdmin) {
                continue;
            }

            if (!$hasPermission) {
                // Determine HTTP Verb Risk
                $writeVerbs = array_intersect(['POST', 'PUT', 'PATCH', 'DELETE'], $methods);
                $isWrite = !empty($writeVerbs);

                $missing[] = [
                    'uri' => $uri,
                    'methods' => implode('|', $methods),
                    'action' => $action,
                    'is_write' => $isWrite,
                    'middleware' => implode(', ', array_map(fn($m) => is_string($m) ? $m : 'Closure', $middleware)),
                ];
            }
        }

        // Group by risk (write verbs first)
        $writeRoutes = array_filter($missing, fn($r) => $r['is_write']);
        $readRoutes = array_filter($missing, fn($r) => !$r['is_write']);

        $this->newLine();
        $this->error("=== HIGH RISK: MISSING PERMISSION MIDDLEWARE (WRITE VERBS) ===");
        if (empty($writeRoutes)) {
            $this->info("None found! Excellent job.");
        } else {
            $headers = ['Methods', 'URI', 'Action', 'Middleware'];
            $rows = array_map(fn($r) => [$r['methods'], $r['uri'], $r['action'], $r['middleware']], $writeRoutes);
            $this->table($headers, $rows);
        }

        $this->newLine();
        $this->warn("=== LOW RISK: MISSING PERMISSION MIDDLEWARE (READ VERBS) ===");
        if (empty($readRoutes)) {
            $this->info("None found!");
        } else {
            $headers = ['Methods', 'URI', 'Action', 'Middleware'];
            $rows = array_map(fn($r) => [$r['methods'], $r['uri'], $r['action'], $r['middleware']], $readRoutes);
            $this->table($headers, $rows);
        }

        $this->newLine();
        $this->info("Total unprotected routes: " . count($missing) . " (High Risk: " . count($writeRoutes) . ", Low Risk: " . count($readRoutes) . ")");

        return 0;
    }
}
