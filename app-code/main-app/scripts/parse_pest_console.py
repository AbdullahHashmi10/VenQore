#!/usr/bin/env python3
"""
Parse Pest console log (with ANSI stripping) to extract FAILED test list,
then compare against baseline JUnit XML to identify genuine regressions.
"""

import re, json, sys, xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict

# ── helpers ──────────────────────────────────────────────────────────────────

def strip_ansi(data: bytes) -> str:
    ansi = re.compile(rb'\x1b\[[0-9;]*[mGKHF]')
    stripped = ansi.sub(b'', data)
    stripped = re.sub(rb'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', b'', stripped)
    return stripped.decode('utf-8', errors='replace')


def normalize_class(cls: str) -> str:
    """Strip absolute path prefixes and normalise Tests.tests.X → Tests.X"""
    # Strip FQCN path prefix (baseline worktrees)
    cls = re.sub(r'^E[\.\\/].*?(?:mainapp|main.app)[\.\\/]?', '', cls, flags=re.IGNORECASE)
    cls = re.sub(r'^[A-Z][\.\\/][\w\.\\/]*(tests?|Tests?)[\.\\/]', 'Tests.', cls)
    # Normalise dots/backslashes
    cls = cls.replace('\\', '.').replace('/', '.')
    # Collapse Tests.tests.X → Tests.X
    cls = re.sub(r'^Tests\.tests\.', 'Tests.', cls)
    return cls.strip('.')


def parse_console_failures(text: str) -> list[dict]:
    """Extract all FAILED blocks from console output."""
    failures = []
    seen = set()

    # Pattern 1: "  FAILED  Tests\Feature\Foo > bar baz"  (with > separator)
    pat_full = re.compile(
        r'FAILED\s+(Tests[\\\/][\w\\\/]+)\s*>\s*(.+?)(?:\r?\n|$)'
    )
    for m in pat_full.finditer(text):
        cls = normalize_class(m.group(1))
        test = m.group(2).strip()
        identity = f"{cls}::{test}"
        if identity not in seen:
            seen.add(identity)
            failures.append({'class': cls, 'test': test, 'identity': identity})

    # Pattern 2: "  FAILED  Tests\Feature\Foo"  (no > separator — whole class failed)
    pat_cls = re.compile(r'FAILED\s+(Tests[\\\/][\w\\\/]+)\s*(?:\r?\n|$)')
    for m in pat_cls.finditer(text):
        cls = normalize_class(m.group(1))
        identity = f"{cls}::(class)"
        if identity not in seen:
            # Only add if no individual tests from this class already captured
            if not any(f['class'] == cls for f in failures):
                seen.add(identity)
                failures.append({'class': cls, 'test': '(class-level)', 'identity': identity})

    return failures


def load_baseline_identities(xml_path: Path) -> dict[str, dict]:
    """Load all test identities from baseline JUnit XML."""
    data = xml_path.read_bytes()
    data = re.sub(rb'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', b'', data)
    root = ET.fromstring(data)
    identities = {}
    for tc in root.iter('testcase'):
        cls = normalize_class(tc.get('classname') or tc.get('class') or '')
        name = tc.get('name', '')
        identity = f"{cls}::{name}"
        has_failure = tc.find('failure') is not None or tc.find('error') is not None
        identities[identity] = {
            'class': cls,
            'test': name,
            'failed_in_baseline': has_failure,
        }
    return identities


# ── main ─────────────────────────────────────────────────────────────────────

def main():
    console_log = Path('docs/approval-dashboard-audit-2026-09-22/evidence/final-handoff/current_console.log')
    baseline_xml = Path('docs/approval-dashboard-audit-2026-09-22/evidence/final-handoff/baseline_junit.xml')
    out_path = Path('docs/approval-dashboard-audit-2026-09-22/evidence/final-handoff/final_regression_comparison.json')

    # Parse console
    print("Parsing console log…")
    text = strip_ansi(console_log.read_bytes())

    summary_m = re.search(r'Tests:\s+(\d+)\s+failed,\s+(\d+)\s+passed', text)
    if summary_m:
        console_failed = int(summary_m.group(1))
        console_passed = int(summary_m.group(2))
    else:
        console_failed = console_passed = None
        print("WARNING: console summary not found")

    dur_m = re.search(r'Duration:\s+([\S]+)', text)
    duration = dur_m.group(1) if dur_m else None
    print(f"Console: {console_failed} failed / {console_passed} passed — {duration}")

    current_failures = parse_console_failures(text)
    print(f"Extracted {len(current_failures)} FAILED test identities from console")

    # Parse baseline XML
    print("\nParsing baseline JUnit XML…")
    baseline_ids = load_baseline_identities(baseline_xml)
    baseline_failed = {k for k, v in baseline_ids.items() if v['failed_in_baseline']}
    baseline_passed = {k for k, v in baseline_ids.items() if not v['failed_in_baseline']}
    print(f"Baseline: {len(baseline_ids)} total, {len(baseline_failed)} failed, {len(baseline_passed)} passed")

    # Classify current failures
    regressions = []      # failed now, passed in baseline
    pre_existing = []     # failed now, also failed in baseline
    new_tests_failed = [] # failed now, not in baseline at all

    for f in current_failures:
        iid = f['identity']
        if iid in baseline_passed:
            regressions.append(f)
        elif iid in baseline_failed:
            pre_existing.append(f)
        else:
            # Check by class+test fuzzy match
            test_name = f['test']
            cls = f['class']
            # Try matching just the test name across baseline
            baseline_match = next(
                (k for k in baseline_ids if k.endswith(f'::{test_name}') or k.split('::')[-1] == test_name),
                None
            )
            if baseline_match:
                if baseline_ids[baseline_match]['failed_in_baseline']:
                    pre_existing.append(f)
                else:
                    regressions.append(f)
            else:
                new_tests_failed.append(f)

    print(f"\n=== REGRESSION ANALYSIS ===")
    print(f"Current-only regressions (FAIL now, PASS in baseline): {len(regressions)}")
    for r in regressions:
        print(f"  REGRESSION: {r['identity']}")
    print(f"\nPre-existing failures (FAIL in both): {len(pre_existing)}")
    print(f"New tests that failed (not in baseline): {len(new_tests_failed)}")
    for n in new_tests_failed:
        print(f"  NEW-FAIL: {n['identity']}")

    # Fixed tests (passed in baseline_failed → not in current failures)
    current_fail_ids = {f['identity'] for f in current_failures}
    fixed = [k for k in baseline_failed if k not in current_fail_ids]
    print(f"\nFixed (failed baseline, not in current failures): {len(fixed)}")

    status = 'REGRESSION_FAIL' if regressions or new_tests_failed else 'PASS'
    print(f"\nStatus: {status}")

    result = {
        'status': status,
        'console_summary': {
            'failed': console_failed,
            'passed': console_passed,
            'total': (console_failed or 0) + (console_passed or 0),
            'duration': duration,
        },
        'baseline_xml_summary': {
            'total': len(baseline_ids),
            'failed': len(baseline_failed),
            'passed': len(baseline_passed),
        },
        'regression_count': len(regressions),
        'pre_existing_failures': len(pre_existing),
        'new_tests_failed_count': len(new_tests_failed),
        'fixed_count': len(fixed),
        'regressions': regressions,
        'new_tests_failed': new_tests_failed,
        'pre_existing_sample': pre_existing[:10],
        'fixed_sample': fixed[:10],
        'note': (
            'current_junit.xml was corrupted (parallel worker race-write). '
            'Failure classification uses console FAILED lines vs baseline XML. '
            'Console totals are authoritative.'
        ),
    }

    out_path.write_text(json.dumps(result, indent=2), encoding='utf-8')
    print(f"\nWritten: {out_path}")


if __name__ == '__main__':
    main()
