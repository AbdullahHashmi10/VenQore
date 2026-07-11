<?php

namespace Tests\Support;

/**
 * Quarantine — the "honestly red" lane (blueprint Phase D / J, §19.9).
 *
 * Known production defects get REAL pinning tests that assert correct behavior and
 * therefore FAIL today. We do not weaken them to green. Instead they run in a visible
 * quarantine lane, each gated by a waiver with an approver and an EXPIRY. An expired
 * waiver fails the launch gate — so a known bug cannot be parked and forgotten.
 *
 * A pinning test calls Quarantine::guard('POS-003', $this) at its top. If the waiver
 * is still valid, the test is marked incomplete (visible, not a hard failure, not a
 * silent skip) with the waiver details. If the waiver is EXPIRED, the guard returns
 * false and the test proceeds to assert correct behavior — which fails loudly, exactly
 * as it should once the deadline passes.
 *
 * The waiver registry lives in Tester/VerificationCenter/registry/quarantine.yaml and is
 * the single source of truth the launch gate reads.
 */
final class Quarantine
{
    /** @var array<string,array>|null */
    private static ?array $waivers = null;

    private static function load(): array
    {
        if (self::$waivers !== null) {
            return self::$waivers;
        }
        $path = self::registryPath();
        if (! is_file($path)) {
            return self::$waivers = [];
        }
        // Minimal YAML read via Symfony if available; fall back to a tiny parser.
        if (class_exists(\Symfony\Component\Yaml\Yaml::class)) {
            $data = \Symfony\Component\Yaml\Yaml::parseFile($path);
        } else {
            $data = self::parseTinyYaml(file_get_contents($path));
        }
        $out = [];
        foreach (($data['waivers'] ?? []) as $w) {
            if (isset($w['id'])) {
                $out[$w['id']] = $w;
            }
        }
        return self::$waivers = $out;
    }

    public static function registryPath(): string
    {
        return dirname(__DIR__, 2) . '/VerificationCenter/registry/quarantine.yaml';
    }

    /**
     * Returns true if the test should SKIP its correctness assertions (waiver valid),
     * false if the waiver is expired/absent and the test must run for real.
     *
     * When it returns true it also marks the current test incomplete with context.
     */
    public static function guard(string $id, \PHPUnit\Framework\TestCase $test): bool
    {
        $waivers = self::load();
        $w = $waivers[$id] ?? null;

        if ($w === null) {
            // No waiver — the defect must be fixed or a waiver filed. Run for real.
            return false;
        }

        $expires = $w['expires'] ?? null;
        $expired = $expires !== null && strtotime((string) $expires) < time();

        if ($expired) {
            // Waiver lapsed: stop protecting the bug — let the pinning test fail.
            return false;
        }

        $test->markTestIncomplete(sprintf(
            'QUARANTINED [%s]: %s | waiver approver=%s expires=%s | %s',
            $id,
            $w['title'] ?? 'known defect',
            $w['approver'] ?? '(none)',
            $expires ?? '(no expiry!)',
            $w['note'] ?? ''
        ));
        return true;
    }

    /** Tiny YAML fallback for `waivers:` list-of-maps (no external dep). */
    private static function parseTinyYaml(string $text): array
    {
        $waivers = [];
        $cur = null;
        foreach (preg_split('/\R/', $text) as $line) {
            if (preg_match('/^\s*-\s*id:\s*(.+)$/', $line, $m)) {
                if ($cur !== null) {
                    $waivers[] = $cur;
                }
                $cur = ['id' => trim($m[1], " \"'")];
            } elseif ($cur !== null && preg_match('/^\s+(\w+):\s*(.+)$/', $line, $m)) {
                $cur[$m[1]] = trim($m[2], " \"'");
            }
        }
        if ($cur !== null) {
            $waivers[] = $cur;
        }
        return ['waivers' => $waivers];
    }
}
