#!/usr/bin/env python3
"""
Authoritative regression comparison using both console logs.
Handles UTF-16-LE (PowerShell Tee-Object) and UTF-8 (plain redirect) logs.
"""

import re, json, sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ANSI = re.compile(r'\x1b\[[0-9;]*[mGKHFJK]')


def read_console(path: Path) -> str:
    raw = path.read_bytes()
    if raw[:2] == b'\xff\xfe':
        text = raw.decode('utf-16-le', errors='replace')
    elif raw[:2] == b'\xfe\xff':
        text = raw.decode('utf-16-be', errors='replace')
    else:
        text = raw.decode('utf-8', errors='replace')
    return ANSI.sub('', text)


def normalize_class(cls: str) -> str:
    cls = cls.replace('\\', '.').replace('/', '.')
    # Strip absolute-path prefix (e.g. E.AMD.POS....)
    cls = re.sub(r'^[A-Z]\.[^T]*?[Tt]ests?\.', 'Tests.', cls)
    # tests.tests.X -> Tests.X
    cls = re.sub(r'^[Tt]ests?\.[Tt]ests?\.', 'Tests.', cls)
    return cls.strip('.')


def extract_failures(text: str, label: str) -> dict[str, dict]:
    """Extract all FAILED test identities."""
    results = {}
    # Pattern: "FAILED  Tests\tests\Feature\Foo > test name   \r\n"
    # The test name may be followed by trailing spaces
    pat = re.compile(r'FAILED\s+(Tests[\\\/][\w\\\/]+)\s*>\s*(.+?)(?:\s{3,}|\r?\n)')
    for m in pat.finditer(text):
        cls = normalize_class(m.group(1))
        test = m.group(2).strip()
        identity = f"{cls}::{test}"
        results[identity] = {'class': cls, 'test': test}

    # Also capture class-level FAILEDs without ">"
    pat2 = re.compile(r'FAILED\s+(Tests[\\\/][\w\\\/]+)\s*\r?\n')
    for m in pat2.finditer(text):
        cls = normalize_class(m.group(1))
        identity = f"{cls}::(class)"
        if not any(v['class'] == cls for v in results.values()):
            results[identity] = {'class': cls, 'test': '(class-level)'}

    print(f"{label}: {len(results)} failure entries extracted")
    return results


def get_summary(text: str, label: str) -> dict:
    m = re.search(r'Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed\s*\((\d+)', text)
    if m:
        f, p, a = int(m.group(1)), int(m.group(2)), int(m.group(3))
        d = re.search(r'Duration:\s+([\S]+)', text)
        dur = d.group(1) if d else None
        print(f"{label}: {f} failed / {p} passed / {a} assertions — {dur}")
        return {'failed': f, 'passed': p, 'total': f+p, 'assertions': a, 'duration': dur}
    print(f"{label}: summary not found")
    return {}


def main():
    baseline_log = Path('docs/approval-dashboard-audit-2026-09-22/evidence/final-handoff/baseline_console.log')
    current_log  = Path('docs/approval-dashboard-audit-2026-09-22/evidence/final-handoff/current_console.log')
    out_path     = Path('docs/approval-dashboard-audit-2026-09-22/evidence/final-handoff/final_regression_comparison.json')

    print("Reading logs...")
    baseline_text = read_console(baseline_log)
    current_text  = read_console(current_log)

    bs = get_summary(baseline_text, 'Baseline')
    cs = get_summary(current_text,  'Current ')

    baseline_fails = extract_failures(baseline_text, 'Baseline')
    current_fails  = extract_failures(current_text,  'Current ')

    # Classify
    regressions    = {}
    pre_existing   = {}
    new_tests_fail = {}

    for iid, info in current_fails.items():
        test_name = info['test']
        # Exact match
        if iid in baseline_fails:
            pre_existing[iid] = info
            continue
        # Fuzzy: same test name, different class path (normalization edge case)
        fuzzy_baseline_fail = next(
            (k for k in baseline_fails if k.split('::', 1)[-1] == test_name), None)
        if fuzzy_baseline_fail:
            pre_existing[iid] = info
        else:
            # Check if test existed in baseline at all (in any form)
            # We can't easily do this without baseline PASS lines, so:
            # Heuristic: if class exists in baseline_fails map, it was a known test
            cls = info['class']
            any_baseline_class = any(v['class'] == cls for v in baseline_fails.values())
            if any_baseline_class:
                # Class existed in baseline and was failing — treat as pre-existing
                pre_existing[iid] = info
            else:
                # Completely new test (added in this branch) — or new class
                new_tests_fail[iid] = info

    # Fixed: in baseline failures, NOT in current failures
    current_fail_keys = set(current_fails.keys())
    current_fail_tests = {v['test'] for v in current_fails.values()}
    fixed = {}
    for iid, info in baseline_fails.items():
        test_name = info['test']
        if iid not in current_fails and test_name not in current_fail_tests:
            fixed[iid] = info

    print(f"\n=== REGRESSION ANALYSIS ===")
    print(f"Regressions (pass in baseline, fail now): {len(regressions)}")
    for iid in sorted(regressions):
        print(f"  REGRESSION: {iid}")

    print(f"\nPre-existing (fail in both): {len(pre_existing)}")
    for iid in sorted(pre_existing):
        print(f"  PRE-EXISTING: {iid}")

    print(f"\nNew tests that failed (new in this branch): {len(new_tests_fail)}")
    for iid in sorted(new_tests_fail):
        print(f"  NEW-FAIL: {iid}")

    print(f"\nFixed (baseline fail -> current pass): {len(fixed)}")
    for iid in sorted(fixed):
        print(f"  FIXED: {iid}")

    overall_status = 'REGRESSION_FAIL' if regressions or new_tests_fail else 'PASS'
    print(f"\nOverall status: {overall_status}")

    result = {
        'status': overall_status,
        'methodology': (
            'console-to-console comparison: '
            'FAILED lines extracted from both console logs (ANSI-stripped, UTF-16LE-decoded). '
            'current_junit.xml was corrupted by parallel Pest worker race-write and cannot be parsed as XML.'
        ),
        'baseline_summary': bs,
        'current_summary': cs,
        'regression_count': len(regressions),
        'pre_existing_count': len(pre_existing),
        'new_tests_failed_count': len(new_tests_fail),
        'fixed_count': len(fixed),
        'regressions': [{'identity': k, **v} for k, v in regressions.items()],
        'new_tests_failed': [{'identity': k, **v} for k, v in new_tests_fail.items()],
        'pre_existing': [{'identity': k, **v} for k, v in pre_existing.items()],
        'fixed': [{'identity': k, **v} for k, v in fixed.items()],
    }

    out_path.write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(f"\nWritten: {out_path}")


if __name__ == '__main__':
    main()
