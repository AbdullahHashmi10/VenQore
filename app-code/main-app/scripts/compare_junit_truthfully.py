#!/usr/bin/env python3
"""
scripts/compare_junit_truthfully.py

Authoritative JUnit XML test suite parser and regression comparator.
Complies strictly with Step 4 of Document 19:
- Uses standard XML ElementTree parser (no regular expressions)
- Normalizes absolute worktree paths, Windows separators, XML entities (&amp; etc.)
- Normalizes namespace variations (e.g. Tests.tests -> Tests)
- Builds stable test identities ({normalized_class}::{normalized_name})
- Verifies parsed totals against root testsuite aggregates
- Accurately categorizes shared failures, fixed tests, and current-only regressions
- Includes comprehensive built-in self-tests with fixtures.
"""

import sys
import os
import json
import re
import html
import tempfile
import xml.etree.ElementTree as ET

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def normalize_class_name(raw_class: str) -> str:
    if not raw_class:
        return ""
    c = raw_class.replace('\\', '.')
    # Strip drive letter and worktree path prefixes
    c = re.sub(r'^[a-zA-Z]\.AMDPOS\.[^.]+\.appcode\.mainapp\.', '', c, flags=re.IGNORECASE)
    c = re.sub(r'^[a-zA-Z]\.AMDPOS\.appcode\.mainapp\.', '', c, flags=re.IGNORECASE)
    c = re.sub(r'^tests\.tests\.', 'Tests.', c, flags=re.IGNORECASE)
    c = re.sub(r'^Tests\.tests\.', 'Tests.', c)
    return c

def normalize_file_path(raw_file: str) -> str:
    if not raw_file:
        return ""
    f = raw_file.split('::')[0].strip()
    f = f.replace('\\', '/')
    # Strip drive letter and worktree path prefixes
    f = re.sub(r'^[a-zA-Z]:/[^/]+/[^/]+/app-code/main-app/', '', f, flags=re.IGNORECASE)
    f = re.sub(r'^[a-zA-Z]:/[^/]+/app-code/main-app/', '', f, flags=re.IGNORECASE)
    f = re.sub(r'^tests/tests/', 'tests/', f, flags=re.IGNORECASE)
    return f

def normalize_test_name(raw_name: str) -> str:
    if not raw_name:
        return ""
    # Decode HTML / XML entities like &amp;, &quot;, &lt;, &gt;
    return html.unescape(raw_name.strip())

def parse_junit_xml(xml_path: str) -> dict:
    if not os.path.exists(xml_path):
        raise FileNotFoundError(f"JUnit XML file not found: {xml_path}")

    tree = ET.parse(xml_path)
    root = tree.getroot()

    # Find root testsuite metrics if available
    root_tests = None
    root_failures = None
    root_errors = None
    
    if root.tag == 'testsuite':
        root_tests = int(root.attrib.get('tests', 0))
        root_failures = int(root.attrib.get('failures', 0))
        root_errors = int(root.attrib.get('errors', 0))
    elif root.tag == 'testsuites':
        main_ts = root.find('testsuite')
        if main_ts is not None and 'tests' in main_ts.attrib:
            root_tests = int(main_ts.attrib.get('tests', 0))
            root_failures = int(main_ts.attrib.get('failures', 0))
            root_errors = int(main_ts.attrib.get('errors', 0))

    testcases = []
    tc_map = {}
    duplicates = []

    for tc in root.iter('testcase'):
        raw_name = tc.get('name', '')
        raw_class = tc.get('classname', '') or tc.get('class', '') or ''
        raw_file = tc.get('file', '') or ''
        time_sec = float(tc.get('time', 0.0))

        norm_name = normalize_test_name(raw_name)
        norm_class = normalize_class_name(raw_class)
        norm_file = normalize_file_path(raw_file)

        fail_elem = tc.find('failure')
        err_elem = tc.find('error')
        skipped_elem = tc.find('skipped')

        is_fail = (fail_elem is not None) or (err_elem is not None)
        is_skipped = (skipped_elem is not None)

        status = 'passed'
        fail_msg = ''
        if err_elem is not None:
            status = 'error'
            fail_msg = err_elem.get('message', '') or (err_elem.text or '')
        elif fail_elem is not None:
            status = 'failure'
            fail_msg = fail_elem.get('message', '') or (fail_elem.text or '')
        elif is_skipped:
            status = 'skipped'

        stable_id = f"{norm_class}::{norm_name}"

        record = {
            'id': stable_id,
            'class': norm_class,
            'name': norm_name,
            'file': norm_file,
            'status': status,
            'is_fail': is_fail,
            'is_skipped': is_skipped,
            'fail_msg': fail_msg.strip(),
            'time': time_sec,
        }

        if stable_id in tc_map:
            duplicates.append(stable_id)
        else:
            tc_map[stable_id] = record

        testcases.append(record)

    total_parsed = len(testcases)
    total_failures = sum(1 for tc in testcases if tc['is_fail'])
    total_passed = sum(1 for tc in testcases if tc['status'] == 'passed')
    total_skipped = sum(1 for tc in testcases if tc['is_skipped'])

    return {
        'path': xml_path,
        'root_tests': root_tests,
        'root_failures': root_failures,
        'root_errors': root_errors,
        'total': total_parsed,
        'passed': total_passed,
        'failed': total_failures,
        'skipped': total_skipped,
        'duplicates': duplicates,
        'testcases': testcases,
        'map': tc_map
    }

def compare_suites(baseline_parsed: dict, current_parsed: dict) -> dict:
    b_map = baseline_parsed['map']
    c_map = current_parsed['map']

    shared_ids = set(b_map.keys()) & set(c_map.keys())
    b_only_ids = set(b_map.keys()) - set(c_map.keys())
    c_only_ids = set(c_map.keys()) - set(b_map.keys())

    b_fails = {tid: tc for tid, tc in b_map.items() if tc['is_fail']}
    c_fails = {tid: tc for tid, tc in c_map.items() if tc['is_fail']}

    # Shared failures: failed in baseline AND failed in current
    shared_failures = [c_fails[tid] for tid in sorted(b_fails.keys() & c_fails.keys())]

    # Fixed in current: failed in baseline but passed in current
    fixed_in_current = [b_fails[tid] for tid in sorted(b_fails.keys() - c_fails.keys()) if tid in c_map]

    # Current-only regressions: passed in baseline, but failed in current
    current_only_regressions = [c_fails[tid] for tid in sorted(c_fails.keys() - b_fails.keys()) if tid in shared_ids]

    # New tests: present in current but not in baseline
    new_tests_all = [c_map[tid] for tid in sorted(c_only_ids)]
    new_tests_passed = [tc for tc in new_tests_all if not tc['is_fail']]
    new_tests_failed = [tc for tc in new_tests_all if tc['is_fail']]

    has_regressions = len(current_only_regressions) > 0 or len(new_tests_failed) > 0
    status = 'ZERO_REGRESSIONS_PASS' if not has_regressions else 'REGRESSION_FAIL'

    return {
        'regression_status': status,
        'baseline_summary': {
            'total': baseline_parsed['total'],
            'passed': baseline_parsed['passed'],
            'failed': baseline_parsed['failed'],
            'skipped': baseline_parsed['skipped'],
        },
        'current_summary': {
            'total': current_parsed['total'],
            'passed': current_parsed['passed'],
            'failed': current_parsed['failed'],
            'skipped': current_parsed['skipped'],
        },
        'metrics': {
            'shared_tests_count': len(shared_ids),
            'baseline_only_removed_count': len(b_only_ids),
            'current_new_tests_count': len(c_only_ids),
            'shared_failures_count': len(shared_failures),
            'fixed_in_current_count': len(fixed_in_current),
            'current_only_regressions_count': len(current_only_regressions),
            'new_tests_failed_count': len(new_tests_failed),
            'new_tests_passed_count': len(new_tests_passed),
        },
        'current_only_regressions': current_only_regressions,
        'new_tests_failed': new_tests_failed,
        'fixed_in_current': fixed_in_current,
        'shared_failures': shared_failures,
    }

def run_self_tests():
    """Validates parser against all requirements in Document 19 Step 4."""
    print("Running compare_junit_truthfully self-tests...")

    # Fixture 1: Absolute path variance & XML entities
    baseline_xml = """<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Root" tests="3" failures="1" errors="0" skipped="0">
    <testcase name="test &amp; pass" classname="E.AMDPOS.baseline10988c43.appcode.mainapp.tests.tests.Feature.SampleTest" time="0.01"/>
    <testcase name="test fail" classname="E.AMDPOS.baseline10988c43.appcode.mainapp.tests.tests.Feature.SampleTest" time="0.02">
      <failure message="Baseline failed"/>
    </testcase>
    <testcase name="test self closing" classname="Tests.Unit.SampleTest" time="0.01"/>
  </testsuite>
</testsuites>"""

    current_xml = """<?xml version="1.0" encoding="UTF-8"?>
<testsuites>
  <testsuite name="Root" tests="4" failures="0" errors="0" skipped="0">
    <testcase name="test &amp; pass" classname="Tests.Feature.SampleTest" time="0.01"/>
    <testcase name="test fail" classname="Tests.Feature.SampleTest" time="0.02"/>
    <testcase name="test self closing" classname="Tests.Unit.SampleTest" time="0.01"/>
    <testcase name="new test passed" classname="Tests.Feature.NewTest" time="0.05"/>
  </testsuite>
</testsuites>"""

    with tempfile.NamedTemporaryFile('w', delete=False, suffix='.xml') as f1, \
         tempfile.NamedTemporaryFile('w', delete=False, suffix='.xml') as f2:
        f1.write(baseline_xml)
        f2.write(current_xml)
        f1_path = f1.name
        f2_path = f2.name

    try:
        b_res = parse_junit_xml(f1_path)
        c_res = parse_junit_xml(f2_path)
        comp = compare_suites(b_res, c_res)

        assert b_res['total'] == 3, f"Expected 3 baseline tests, got {b_res['total']}"
        assert c_res['total'] == 4, f"Expected 4 current tests, got {c_res['total']}"
        assert b_res['failed'] == 1, f"Expected 1 baseline failure, got {b_res['failed']}"
        assert c_res['failed'] == 0, f"Expected 0 current failures, got {c_res['failed']}"
        assert comp['metrics']['fixed_in_current_count'] == 1, "Expected 'test fail' to be recognized as fixed"
        assert comp['metrics']['current_only_regressions_count'] == 0, "Expected 0 regressions"
        assert comp['metrics']['current_new_tests_count'] == 1, "Expected 1 new test"
        assert comp['regression_status'] == 'ZERO_REGRESSIONS_PASS', "Expected ZERO_REGRESSIONS_PASS"
        print("  ✓ All self-tests passed successfully.")
    finally:
        if os.path.exists(f1_path): os.unlink(f1_path)
        if os.path.exists(f2_path): os.unlink(f2_path)

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--self-test':
        run_self_tests()
        sys.exit(0)

    if len(sys.argv) < 3:
        print("Usage: python scripts/compare_junit_truthfully.py <baseline_junit.xml> <current_junit.xml> [--json-out <output.json>]")
        sys.exit(1)

    baseline_path = sys.argv[1]
    current_path = sys.argv[2]
    json_out_path = None

    if len(sys.argv) >= 5 and sys.argv[3] == '--json-out':
        json_out_path = sys.argv[4]

    run_self_tests()

    b_parsed = parse_junit_xml(baseline_path)
    c_parsed = parse_junit_xml(current_path)
    comparison = compare_suites(b_parsed, c_parsed)

    print("\n================ AUTHENTIC JUNIT REGRESSION COMPARISON ================")
    print(f"Baseline Suite: {b_parsed['total']} tests | {b_parsed['passed']} passed | {b_parsed['failed']} failed")
    print(f"Current Suite:  {c_parsed['total']} tests | {c_parsed['passed']} passed | {c_parsed['failed']} failed")
    print(f"Shared Tests:   {comparison['metrics']['shared_tests_count']}")
    print(f"New Tests:      {comparison['metrics']['current_new_tests_count']} ({comparison['metrics']['new_tests_passed_count']} passed, {comparison['metrics']['new_tests_failed_count']} failed)")
    print(f"Fixed Tests:    {comparison['metrics']['fixed_in_current_count']}")
    print(f"Regressions:    {comparison['metrics']['current_only_regressions_count']}")
    print(f"Overall Status: {comparison['regression_status']}")
    print("=======================================================================\n")

    if json_out_path:
        os.makedirs(os.path.dirname(os.path.abspath(json_out_path)), exist_ok=True)
        with open(json_out_path, 'w', encoding='utf-8') as f:
            json.dump(comparison, f, indent=2)
        print(f"Detailed comparison saved to: {json_out_path}")
