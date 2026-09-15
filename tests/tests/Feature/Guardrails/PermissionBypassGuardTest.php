<?php

namespace Tests\Feature\Guardrails;

use Illuminate\Support\Facades\Route;
use Tests\Feature\VenQoreTestCase;

/**
 * PermissionBypassGuardTest — authorization guardrails.
 *
 * Two permanent guards:
 *
 *  1. No store-level role may be granted the '*' wildcard in
 *     config/permissions.php. The wildcard is a deliberate super-admin-only
 *     fast path inside CheckPermissions; if it ever leaks into a normal role's
 *     permission array, that role silently gains god-mode. This is a PREVENTION
 *     guard — it is green today and its job is to stay that way.
 *
 *  2. No NEW state-changing route (POST/PUT/PATCH/DELETE) may ship without
 *     `permission:` middleware. This mirrors the filters in the existing
 *     `php artisan permissions:coverage` command, but as an enforced test with
 *     a committed baseline: the set of currently-unprotected write routes is
 *     frozen in a baseline file on first run; thereafter any additional
 *     unprotected write route fails the build. Removing entries (protecting a
 *     route) is always allowed. This finds REAL new authorization holes at the
 *     moment they are introduced instead of in production.
 */
class PermissionBypassGuardTest extends VenQoreTestCase
{
    private const BASELINE = __DIR__ . '/baselines/unprotected_write_routes.json';

    public function test_no_store_role_is_granted_the_wildcard_permission(): void
    {
        $map = config('permissions', []);
        $this->assertIsArray($map);
        $this->assertNotEmpty($map, 'config/permissions.php returned no role map.');

        $offenders = [];
        foreach ($map as $role => $perms) {
            if (is_array($perms) && in_array('*', $perms, true)) {
                $offenders[] = $role;
            }
        }

        $this->assertSame(
            [],
            $offenders,
            "SECURITY: these roles are granted '*' (god-mode) in config/permissions.php: "
                . implode(', ', $offenders)
                . ". The wildcard must remain exclusive to the platform-admin fast path in CheckPermissions."
        );
    }

    public function test_no_new_state_changing_route_is_missing_permission_middleware(): void
    {
        $current = $this->unprotectedWriteRoutes();

        // Phase E (F-18): the baseline is CHECKSUM-PROTECTED and COMMITTED. The test
        // FAILS if it is absent — it must NEVER silently reseed (a deleted baseline used
        // to make this test pass with zero protection). Restore it from git.
        $this->assertFileExists(
            self::BASELINE,
            'Permission baseline missing. It is committed + checksum-locked and must NOT be '
                . 'reseeded. Restore Tester/tests/Feature/Guardrails/baselines/unprotected_write_routes.json from git.'
        );

        // Verify the baseline matches the checksum in the ratchet registry.
        //
        // This block used to be wrapped in `if (is_file($ratchetPath) && ...)`,
        // which meant BOTH the checksum lock and the ceiling check silently
        // no-op'd whenever the file was absent — which it always was when this
        // suite ran from FinalTester/ (permission_ratchet.yaml only existed
        // under Tester/VerificationCenter/registry, and sync.php never copied
        // it — fixed 2026-08-02, see FinalTester/Scripts/sync.php). A guard
        // that turns itself off when its own config is missing is not a guard.
        // Both checks below are now mandatory: no ratchet file, no
        // Symfony\Yaml, or a malformed YAML file are hard test failures.
        $ratchetPath = dirname(__DIR__, 3) . '/VerificationCenter/registry/permission_ratchet.yaml';

        $this->assertTrue(
            class_exists(\Symfony\Component\Yaml\Yaml::class),
            'symfony/yaml is required to enforce the permission ratchet and is expected to be '
                . 'present as a transitive Laravel dependency. If this fails, the ratchet cannot be '
                . 'verified at all — treat as a build environment defect, not something to code around.'
        );

        $this->assertFileExists(
            $ratchetPath,
            'Permission ratchet registry missing at ' . $ratchetPath . '. This file locks the '
                . 'baseline checksum and the unprotected-route ceiling — without it, both checks '
                . 'silently no-op and this guard protects nothing. Restore it from git, and if you '
                . 'run this suite from FinalTester/, confirm FinalTester/Scripts/sync.php has been '
                . 'run so the registry copy exists there too.'
        );

        $ratchet = \Symfony\Component\Yaml\Yaml::parseFile($ratchetPath);

        $expected = $ratchet['baseline_checksum_sha256'] ?? null;
        $this->assertNotNull(
            $expected,
            "permission_ratchet.yaml at {$ratchetPath} has no baseline_checksum_sha256 key."
        );
        $actual = hash('sha256', (string) file_get_contents(self::BASELINE));
        $this->assertSame(
            $expected,
            $actual,
            'Permission baseline checksum mismatch. The frozen route set changed without '
                . 'updating permission_ratchet.yaml. If you intentionally re-baselined, update the checksum.'
        );

        // Ratchet ceiling: the live unprotected count must not exceed max_unprotected.
        $ceiling = (int) ($ratchet['max_unprotected'] ?? PHP_INT_MAX);
        $this->assertLessThanOrEqual(
            $ceiling,
            count($current),
            'Permission debt ratchet BREACHED: ' . count($current) . ' unprotected write routes exceed '
                . "the ceiling of {$ceiling}. Protect routes or (deliberately) raise the ceiling — but the "
                . 'ceiling must only ever DECREASE across releases.'
        );

        $baseline = json_decode((string) file_get_contents(self::BASELINE), true) ?: [];
        $baselineSet = array_flip($baseline);

        $newlyUnprotected = array_values(array_filter(
            $current,
            fn (string $sig) => !isset($baselineSet[$sig])
        ));

        $this->assertSame(
            [],
            $newlyUnprotected,
            "NEW state-changing route(s) shipped WITHOUT permission: middleware — real authorization hole:\n  - "
                . implode("\n  - ", $newlyUnprotected)
                . "\n\nAdd `->middleware('permission:<key>')` to each, or (if truly public) add it to "
                . "Tester/tests/Feature/Guardrails/baselines/unprotected_write_routes.json with a review note."
        );
    }

    /**
     * Return signatures ("METHODS uri") of every write route that lacks
     * permission middleware, applying the same exclusions as the
     * permissions:coverage command.
     *
     * @return string[]
     */
    private function unprotectedWriteRoutes(): array
    {
        $out = [];

        foreach (Route::getRoutes() as $route) {
            $uri = $route->uri();
            $methods = $route->methods();
            $action = $route->getActionName();

            try {
                $middleware = $route->gatherMiddleware();
            } catch (\Throwable $e) {
                $middleware = [];
            }

            // Only state-changing verbs matter for this guard.
            $writeVerbs = array_intersect(['POST', 'PUT', 'PATCH', 'DELETE'], $methods);
            if (empty($writeVerbs)) {
                continue;
            }

            // Exclusions mirrored from PermissionsCoverage.
            if (
                str_starts_with($uri, '_') ||
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

            $isSuperAdmin = in_array('superadmin', $middleware, true)
                || str_contains($action, 'SuperAdmin')
                || str_starts_with($uri, 'VenQore');
            if ($isSuperAdmin) {
                continue;
            }

            $hasPermission = false;
            foreach ($middleware as $mw) {
                if (is_string($mw) && ($mw === 'permission' || str_starts_with($mw, 'permission:'))) {
                    $hasPermission = true;
                    break;
                }
            }
            if ($hasPermission) {
                continue;
            }

            $out[] = implode('|', $writeVerbs) . ' ' . $uri;
        }

        sort($out);
        return array_values(array_unique($out));
    }
}
