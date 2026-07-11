#!/usr/bin/env python3
"""Regenerate suites.yaml from the live filesystem (Phase B tooling).

Counts test methods across all styles (testX(), @test, #[Test], pest it/test) and
oracle-classifies each file. Preserves the header + verification_sources/headline tail.
Run from the project root:  python3 Tester/VerificationCenter/bin/generate_registry.py
"""
import glob, re, os, sys
from collections import defaultdict

ROOT = "Tester/tests"
REG = "Tester/VerificationCenter/registry/suites.yaml"

def count_tests(f):
    s = open(f, encoding="utf-8", errors="replace").read()
    return (len(re.findall(r'function\s+test[A-Za-z0-9_]*\s*\(', s))
            + len(re.findall(r'/\*\*[^*]*@test\b', s))
            + len(re.findall(r'#\[Test\]', s))
            + len(re.findall(r'^\s*(?:it|test)\(', s, re.M)))

def tier(rel):
    r = rel.replace("\\", "/"); base = os.path.basename(r)
    if r.startswith("Feature/Golden/"):
        t3 = {"LaunchGateTest.php", "ArchitecturalEnforcementTest.php", "SentinelAuditTest.php", "GoldenAuditTestsTest.php"}
        t2 = {"CrossSurfaceConsistencyTest.php", "DashboardOutputTest.php", "ReportOutputTest.php",
              "FormattingConsistencyTest.php", "ClockPositionConsistencyTest.php", "DatePeriodConsistencyTest.php",
              "FilterMatrixTest.php", "LedgerTruthSweepTest.php"}
        if base in t3: return "T3"
        if base in t2: return "T2"
        return "T1"
    if r.startswith("Feature/Money/"): return "T1"
    if r.startswith("Feature/Production/"): return "T1"   # production-path pinning = truth
    if r.startswith("Feature/Guardrails/") or r.startswith("Feature/Core/") or r.startswith("Feature/Smoke/"): return "T3"
    if r.startswith("Feature/V3/"): return "T1"
    if "Ledger" in r or "PaymentAllocation" in r or "Accounting" in r: return "T1"
    return "T2"

def main():
    files = sorted(f for f in glob.glob(ROOT + "/**/*Test.php", recursive=True) if "/_archive/" not in f)
    groups = defaultdict(lambda: {"files": [], "tests": 0})
    for f in files:
        n = count_tests(f)
        rel = f.replace(ROOT + "/", "")
        suite = os.path.dirname(rel) or "root"
        groups[suite]["files"].append((rel, n, tier(rel)))
        groups[suite]["tests"] += n
    total = sum(n for g in groups.values() for _, n, _ in g["files"])

    cur = open(REG, encoding="utf-8").read()
    header = cur[:cur.index("meta:")]
    header = re.sub(r'phpunit_test_methods_total: \d+', f'phpunit_test_methods_total: {total}', header)
    out = [header.rstrip("\n"), "meta:", "  schema_version: 1", "  generated_phase: B",
           f"  phpunit_test_methods_total: {total}",
           "  note: total = SUM of member test_methods (testX(), @test, #[Test], pest it/test).", "", "suites:"]
    for suite in sorted(groups):
        g = groups[suite]
        out += [f"  - id: {suite.replace('/', '.')}", f"    path: tests/{suite}",
                f"    test_methods: {g['tests']}", f"    files: {len(g['files'])}", "    members:"]
        for rel, n, t in sorted(g["files"]):
            out += [f"      - file: tests/{rel}", f"        test_methods: {n}", f"        oracle_tier: {t}"]
    tail = cur[cur.index("\n# ─── Non-PHPUnit"):] if "# ─── Non-PHPUnit" in cur else ""
    data = ("\n".join(out) + "\n" + tail)
    assert "\x00" not in data
    open(REG, "w", encoding="utf-8").write(data)
    print(f"regenerated: total={total} suites={len(groups)} files={len(files)}")

if __name__ == "__main__":
    main()
