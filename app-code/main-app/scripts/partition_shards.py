#!/usr/bin/env python3
"""
scripts/partition_shards.py

Analyzes test files in baseline and current worktrees and creates
deterministic sequential shards targeting 300-500 tests per shard.
"""

import os
import glob
import re
import json

BASELINE_DIR = 'E:/AMD POS/baseline-10988c43/app-code/main-app'
CURRENT_DIR = 'E:/AMD POS/AMD POS/app-code/main-app'

def get_test_files(base_dir):
    pattern = os.path.join(base_dir, 'tests/tests/**/*Test.php')
    files = sorted(glob.glob(pattern, recursive=True))
    rel_files = []
    for f in files:
        f_norm = f.replace('\\', '/')
        prefix = base_dir.replace('\\', '/') + '/'
        rel = f_norm[len(prefix):]
        rel_files.append(rel)
    return rel_files

def estimate_tests_in_file(base_dir, rel_path):
    full_path = os.path.join(base_dir, rel_path)
    with open(full_path, 'r', encoding='utf-8', errors='ignore') as fp:
        c = fp.read()
    pest_tests = len(re.findall(r'(?:it|test)\s*\(\s*[\'\"]', c))
    pu_tests = len(re.findall(r'public\s+function\s+test[a-zA-Z0-9_]*\s*\(', c))
    return max(pest_tests, pu_tests) if (pest_tests == 0 or pu_tests == 0) else (pest_tests + pu_tests)

def main():
    b_files = get_test_files(BASELINE_DIR)
    c_files = get_test_files(CURRENT_DIR)

    print(f"Discovered baseline test files: {len(b_files)}")
    print(f"Discovered current test files:  {len(c_files)}")

    # Map each file to estimated test count
    b_counts = {f: estimate_tests_in_file(BASELINE_DIR, f) for f in b_files}
    total_b_est = sum(b_counts.values())
    print(f"Estimated baseline tests: {total_b_est}")

    # Let's inspect logical groups
    groups = {}
    for f in b_files:
        # e.g. tests/tests/Feature/Golden/... -> group key
        parts = f.replace('tests/tests/', '').split('/')
        if parts[0] == 'Unit':
            grp = 'Unit'
        elif parts[0] == 'Routes' or parts[0] == 'Performance':
            grp = 'Routes_Performance'
        elif len(parts) > 1 and parts[0] == 'Feature':
            sub = parts[1]
            if sub.endswith('.php'):
                grp = 'Feature_Root'
            else:
                grp = f"Feature_{sub}"
        else:
            grp = 'Other'
        groups.setdefault(grp, []).append(f)

    print(f"\nLogical groups ({len(groups)}):")
    for g, fl in sorted(groups.items()):
        tests_sum = sum(b_counts[f] for f in fl)
        print(f"  {g:30} : {len(fl):3} files, ~{tests_sum:4} tests")

if __name__ == '__main__':
    main()
