<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\Feature\VenQoreTestCase;

/**
 * ZiggyRouteIntegrityTest
 *
 * Verifies that every route() call in the frontend (JSX/JS files) has a
 * corresponding registered Laravel route. Run this test to catch any future
 * Ziggy "route not found" errors before deployment.
 *
 * HOW TO RUN:
 *   vendor/bin/pest Tester/tests/Feature/ZiggyRouteIntegrityTest.php
 *   OR via triple-run.bat
 */
class ZiggyRouteIntegrityTest extends VenQoreTestCase
{
    private function extractRouteNamesFromFrontend(): array
    {
        $jsPath = base_path('resources/js');
        $routeNames = [];

        if (!is_dir($jsPath)) {
            return [];
        }

        $directory = new \RecursiveDirectoryIterator($jsPath);
        $iterator = new \RecursiveIteratorIterator($directory);

        // Regex to match route('name') or route("name") or route(`name`)
        // Also supports route('name', { params }) etc.
        $patterns = [
            '/\broute\(\s*\'([a-zA-Z0-9._-]+)\'/i',
            '/\broute\(\s*"([a-zA-Z0-9._-]+)"/i',
            '/\broute\(\s*`([a-zA-Z0-9._-]+)`/i',
            '/\bwindow\.route\(\s*\'([a-zA-Z0-9._-]+)\'/i',
            '/\bwindow\.route\(\s*"([a-zA-Z0-9._-]+)"/i',
            '/\bwindow\.route\(\s*`([a-zA-Z0-9._-]+)`/i',
            '/\broute\(\)\.has\(\s*\'([a-zA-Z0-9._-]+)\'/i',
            '/\broute\(\)\.has\(\s*"([a-zA-Z0-9._-]+)"/i',
            '/\broute\(\)\.current\(\s*\'([a-zA-Z0-9._-]+)\'/i',
            '/\broute\(\)\.current\(\s*"([a-zA-Z0-9._-]+)"/i',
        ];

        foreach ($iterator as $file) {
            if ($file->isFile() && preg_match('/\.(js|jsx)$/i', $file->getFilename())) {
                $filePath = $file->getPathname();
                if (str_contains($filePath, 'ziggy.js')) {
                    continue;
                }

                $content = file_get_contents($filePath);
                foreach ($patterns as $pattern) {
                    if (preg_match_all($pattern, $content, $matches)) {
                        foreach ($matches[1] as $name) {
                            $routeNames[$name] = $filePath; // Track name and where it was found
                        }
                    }
                }
            }
        }

        // Merge with known dynamic routes
        $dynamic = [
            'store.funds.add',
            'store.funds.remove',
            'store.funds.transfer',
            'store.funds.adjust',
            
            // Store Chatbot Routes
            'store.admin.chatbot.inbox',
            'store.admin.chatbot.sessions',
            'store.admin.chatbot.settings',
            'store.admin.chatbot.settings.update',
            'store.admin.chatbot.canned-responses',
            'store.admin.chatbot.claim',
            'store.admin.chatbot.handoff-to-ai',
            'store.admin.chatbot.log-learning',
            'store.admin.chatbot.refer',
            'store.admin.chatbot.release',
            'store.admin.chatbot.reply',
            'store.admin.chatbot.resolve',
            'store.admin.chatbot.set-status',
            'store.admin.chatbot.typing.agent',
            'store.admin.chatbot.destroy',
            'store.admin.chatbot.assist-suggestion',
            'store.admin.chatbot.ai.test',

            // Platform Chatbot Routes
            'platform.chatbot.inbox',
            'platform.chatbot.sessions',
            'platform.chatbot.settings',
            'platform.chatbot.settings.update',
            'platform.chatbot.canned-responses',
            'platform.chatbot.claim',
            'platform.chatbot.handoff-to-ai',
            'platform.chatbot.log-learning',
            'platform.chatbot.refer',
            'platform.chatbot.release',
            'platform.chatbot.reply',
            'platform.chatbot.resolve',
            'platform.chatbot.set-status',
            'platform.chatbot.typing.agent',
            'platform.chatbot.destroy',
            'platform.chatbot.assist',
            'platform.chatbot.assist-suggestion',
            'platform.chatbot.autonomy-stats',
            'platform.chatbot.autonomy-stats.promote',

            'store.customers.index',
            'store.suppliers.index',
            'store.staff',
            'store.payments.index',
            'store.expenses.index',
            'store.bank-accounts.index',
            'store.finance.accounts',
            'store.finance.journal',
            'store.finance.payables',
            'store.finance.receivables',
            'store.funds.index',
        ];

        foreach ($dynamic as $name) {
            if (!isset($routeNames[$name])) {
                $routeNames[$name] = 'Dynamic Route (Template String)';
            }
        }

        return $routeNames;
    }

    /** @test */
    public function all_frontend_route_calls_have_registered_routes(): void
    {
        $allRoutes = collect(Route::getRoutes())->mapWithKeys(function ($route) {
            return [$route->getName() => true];
        });

        $frontendRoutes = $this->extractRouteNamesFromFrontend();
        $missing = [];

        foreach ($frontendRoutes as $routeName => $filePath) {
            if (! $allRoutes->has($routeName)) {
                $relPath = is_string($filePath) ? str_replace(base_path(), '', $filePath) : 'Unknown';
                $missing[] = "{$routeName} (used in {$relPath})";
            }
        }

        $this->assertEmpty(
            $missing,
            sprintf(
                "The following %d route(s) are called in the frontend but NOT registered in Laravel:\n\n%s\n\nFix: Check routes/web.php and run `php artisan route:list | grep <name>`.",
                count($missing),
                implode("\n", array_map(fn($r) => "  ❌ {$r}", $missing))
            )
        );
    }

    /** @test */
    public function owner_daily_pulse_routes_are_all_registered(): void
    {
        $pulseRoutes = [
            'store.reports.owner-daily-pulse',
            'store.reports.owner-daily-pulse.verify',
            'store.reports.owner-daily-pulse.setup',
            'store.reports.owner-daily-pulse.lock',
            'store.reports.owner-daily-pulse.note',
        ];

        foreach ($pulseRoutes as $name) {
            $route = Route::getRoutes()->getByName($name);
            $this->assertNotNull(
                $route,
                "Owner's Daily Pulse route '{$name}' is not registered. Did you add it to web.php?"
            );
        }
    }

    /** @test */
    public function backup_routes_use_correct_store_prefix(): void
    {
        // These were previously using wrong names (backups.* without store. prefix)
        $correctRoutes = [
            'store.backups.store',
            'store.backups.delete',
            'store.backups.download',
            'store.backups.email',
            'store.backups.restore',
        ];

        $wrongRoutes = [
            'backups.store',
            'backups.delete',
            'backups.download',
            'backups.email',
            'backups.restore',
            'store.admin.backups.store',
            'store.admin.backups.delete',
            'store.admin.backups.download',
            'store.admin.backups.email',
            'store.admin.backups.restore',
        ];

        foreach ($correctRoutes as $name) {
            $route = Route::getRoutes()->getByName($name);
            $this->assertNotNull($route, "Correct backup route '{$name}' not found.");
        }

        // Wrong names should NOT be registered (they were the source of Ziggy errors)
        foreach ($wrongRoutes as $name) {
            $route = Route::getRoutes()->getByName($name);
            $this->assertNull(
                $route,
                "Wrong backup route '{$name}' is still registered. The frontend has been updated to not use this."
            );
        }
    }

    /** @test */
    public function recycle_bin_routes_use_admin_prefix(): void
    {
        $correctRoutes = [
            'store.admin.recycle-bin.index',
            'store.admin.recycle-bin.restore',
            'store.admin.recycle-bin.force-delete',
        ];

        foreach ($correctRoutes as $name) {
            $route = Route::getRoutes()->getByName($name);
            $this->assertNotNull($route, "Recycle bin route '{$name}' not registered.");
        }

        // Old wrong names (Ziggy errors source)
        $oldWrongRoutes = ['recycle-bin.restore', 'recycle-bin.force-delete'];
        foreach ($oldWrongRoutes as $name) {
            $route = Route::getRoutes()->getByName($name);
            $this->assertNull(
                $route,
                "Old route '{$name}' still registered — frontend no longer uses this name."
            );
        }
    }

    /** @test */
    public function migration_routes_use_store_legacy_prefix(): void
    {
        $route = Route::getRoutes()->getByName('store.legacy.admin.migration.analyze');
        $this->assertNotNull($route, "Migration analyze route not found with correct prefix.");

        $route2 = Route::getRoutes()->getByName('store.legacy.admin.migration.execute');
        $this->assertNotNull($route2, "Migration execute route not found with correct prefix.");

        // Old wrong names
        $this->assertNull(
            Route::getRoutes()->getByName('admin.migration.analyze'),
            "Old 'admin.migration.analyze' route is still registered without store. prefix."
        );
    }

    /** @test */
    public function returns_route_uses_history_suffix(): void
    {
        // store.returns.index does NOT exist — it was renamed to store.returns-history.index
        $correct = Route::getRoutes()->getByName('store.returns-history.index');
        $this->assertNotNull($correct, "Returns history index route not found.");
    }

    /** @test */
    public function no_route_registered_without_store_slug_parameter_when_expected(): void
    {
        // Critical store routes MUST have store_slug parameter
        $storeRoutes = [
            'store.dashboard',
            'store.sales.index',
            'store.inventory.index',
            'store.customers.search',
            'store.reports.owner-daily-pulse.verify',
        ];

        foreach ($storeRoutes as $name) {
            $route = Route::getRoutes()->getByName($name);
            if ($route === null) {
                $this->fail("Route '{$name}' not registered at all.");
            }

            $params = $route->parameterNames();
            $this->assertContains(
                'store_slug',
                $params,
                "Route '{$name}' is missing the 'store_slug' parameter — it will fail in multi-tenant context."
            );
        }
    }
}
