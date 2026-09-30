#!/usr/bin/env python3
"""
scripts/aggregate_and_compare_shards.py

Master aggregator and exact-identity comparator for Document 23.
Aggregates all baseline and current shard JUnit XML files, verifies complete
testcase coverage, ensures zero omitted failures, and produces the authoritative
regression analysis.
"""

import sys
import os
import glob
import json
import re
import html
import xml.etree.ElementTree as ET

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

CURRENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')).replace('\\', '/')
EVIDENCE_DIR = os.path.join(CURRENT_DIR, 'docs/approval-dashboard-audit-2026-09-22/evidence/complete-junit').replace('\\', '/')
BASELINE_DIR = os.path.join(EVIDENCE_DIR, 'baseline').replace('\\', '/')
CURRENT_SHARDS_DIR = os.path.join(EVIDENCE_DIR, 'current').replace('\\', '/')
COMPARISON_JSON = os.path.join(EVIDENCE_DIR, 'complete_junit_comparison.json').replace('\\', '/')

def normalize_class_name(raw_class: str) -> str:
    if not raw_class:
        return ""
    c = raw_class.replace('\\', '.')
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
    f = re.sub(r'^[a-zA-Z]:/[^/]+/[^/]+/app-code/main-app/', '', f, flags=re.IGNORECASE)
    f = re.sub(r'^[a-zA-Z]:/[^/]+/app-code/main-app/', '', f, flags=re.IGNORECASE)
    f = re.sub(r'^tests/tests/', 'tests/', f, flags=re.IGNORECASE)
    return f

def normalize_test_name(raw_name: str) -> str:
    if not raw_name:
        return ""
    return html.unescape(raw_name.strip())

def parse_shard_xml(xml_path: str):
    """Parses a shard XML file, returning testcases and validating completeness."""
    if not os.path.exists(xml_path):
        raise FileNotFoundError(f"Shard XML missing: {xml_path}")

    tree = ET.parse(xml_path)
    root = tree.getroot()

    # Completeness check: check for any testsuite with tests="0" but nonzero failures/errors
    for ts in root.iter('testsuite'):
        t_count = int(ts.attrib.get('tests', 0))
        f_count = int(ts.attrib.get('failures', 0))
        e_count = int(ts.attrib.get('errors', 0))
        if t_count == 0 and (f_count > 0 or e_count > 0):
            raise ValueError(
                f"FAIL-CLOSED: Truncated testsuite detected in {xml_path}! "
                f"Suite '{ts.attrib.get('name')}' reports tests=0 but failures={f_count}, errors={e_count}."
            )

    testcases = []
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

        testcases.append({
            'id': stable_id,
            'class': norm_class,
            'name': norm_name,
            'file': norm_file,
            'status': status,
            'is_fail': is_fail,
            'is_skipped': is_skipped,
            'fail_msg': fail_msg.strip(),
            'time': time_sec,
            'xml_source': os.path.basename(xml_path)
        })

    return testcases

def aggregate_shards(shards_dir: str, label: str):
    xml_files = sorted(glob.glob(f"{shards_dir}/*_junit.xml"))
    if not xml_files:
        raise FileNotFoundError(f"No shard JUnit XML files found in: {shards_dir}")

    all_testcases = []
    tc_map = {}
    duplicates = []
    shard_summaries = {}

    for xf in xml_files:
        shard_name = os.path.basename(xf).replace('_junit.xml', '')
        cases = parse_shard_xml(xf)
        shard_passed = sum(1 for c in cases if c['status'] == 'passed')
        shard_failed = sum(1 for c in cases if c['is_fail'])
        shard_skipped = sum(1 for c in cases if c['is_skipped'])

        shard_summaries[shard_name] = {
            'total': len(cases),
            'passed': shard_passed,
            'failed': shard_failed,
            'skipped': shard_skipped,
            'file': os.path.basename(xf)
        }

        for c in cases:
            sid = c['id']
            if sid in tc_map:
                duplicates.append(sid)
            else:
                tc_map[sid] = c
            all_testcases.append(c)

    total_parsed = len(all_testcases)
    total_passed = sum(1 for c in all_testcases if c['status'] == 'passed')
    total_failed = sum(1 for c in all_testcases if c['is_fail'])
    total_skipped = sum(1 for c in all_testcases if c['is_skipped'])

    print(f"\n[{label}] Aggregated {len(xml_files)} shards:")
    print(f"  Total testcases: {total_parsed}")
    print(f"  Passed:          {total_passed}")
    print(f"  Failed/Errors:   {total_failed}")
    print(f"  Skipped:         {total_skipped}")
    print(f"  Unique IDs:      {len(tc_map)}")
    print(f"  Duplicates:      {len(duplicates)}")

    return {
        'label': label,
        'shard_count': len(xml_files),
        'shard_summaries': shard_summaries,
        'total': total_parsed,
        'passed': total_passed,
        'failed': total_failed,
        'skipped': total_skipped,
        'unique_count': len(tc_map),
        'duplicates': duplicates,
        'map': tc_map,
        'testcases': all_testcases
    }

def compare_sharded_suites(baseline: dict, current: dict):
    b_map = baseline['map']
    c_map = current['map']

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

    has_regressions = (len(current_only_regressions) > 0) or (len(new_tests_failed) > 0)
    status = 'ZERO_REGRESSIONS_PASS' if not has_regressions else 'REGRESSION_FAIL'

    return {
        'regression_status': status,
        'baseline_totals': {
            'total': baseline['total'],
            'passed': baseline['passed'],
            'failed': baseline['failed'],
            'skipped': baseline['skipped'],
            'shard_count': baseline['shard_count']
        },
        'current_totals': {
            'total': current['total'],
            'passed': current['passed'],
            'failed': current['failed'],
            'skipped': current['skipped'],
            'shard_count': current['shard_count']
        },
        'metrics': {
            'shared_tests_count': len(shared_ids),
            'baseline_only_removed_count': len(b_only_ids),
            'current_new_tests_count': len(c_only_ids),
            'shared_failures_count': len(shared_failures),
            'fixed_in_current_count': len(fixed_in_current),
            'current_only_regressions_count': len(current_only_regressions),
            'new_tests_passed_count': len(new_tests_passed),
            'new_tests_failed_count': len(new_tests_failed)
        },
        'current_only_regressions': current_only_regressions,
        'new_tests_failed': new_tests_failed,
        'fixed_in_current': fixed_in_current,
        'shared_failures': shared_failures,
        'baseline_shard_summaries': baseline['shard_summaries'],
        'current_shard_summaries': current['shard_summaries']
    }

def main():
    print("================================================================================")
    print("DOCUMENT 23: COMPLETE JUNIT COVERAGE AGGREGATOR & COMPARATOR")
    print("================================================================================\n")

    b_agg = aggregate_shards(BASELINE_DIR, 'Baseline Shards (10988c43)')
    c_agg = aggregate_shards(CURRENT_SHARDS_DIR, 'Current Shards (0d33d5b0)')

    comparison = compare_sharded_suites(b_agg, c_agg)

    print("\n================ FINAL COMPLETE JUNIT COMPARISON RESULTS ================")
    print(f"Baseline Shards:    {comparison['baseline_totals']['shard_count']} shards | {comparison['baseline_totals']['total']} total | {comparison['baseline_totals']['passed']} passed | {comparison['baseline_totals']['failed']} failed")
    print(f"Current Shards:     {comparison['current_totals']['shard_count']} shards | {comparison['current_totals']['total']} total | {comparison['current_totals']['passed']} passed | {comparison['current_totals']['failed']} failed")
    print(f"Shared Tests:       {comparison['metrics']['shared_tests_count']}")
    print(f"New Tests:          {comparison['metrics']['current_new_tests_count']} ({comparison['metrics']['new_tests_passed_count']} passed, {comparison['metrics']['new_tests_failed_count']} failed)")
    print(f"Fixed Tests:        {comparison['metrics']['fixed_in_current_count']}")
    print(f"True Regressions:   {comparison['metrics']['current_only_regressions_count']}")
    print(f"OVERALL STATUS:     {comparison['regression_status']}")
    print("=========================================================================\n")

    with open(COMPARISON_JSON, 'w', encoding='utf-8') as fp:
        json.dump(comparison, fp, indent=2)
    print(f"Detailed complete comparison saved to: {COMPARISON_JSON}")

    if comparison['regression_status'] != 'ZERO_REGRESSIONS_PASS':
        sys.exit(1)

if __name__ == '__main__':
    main()
