#!/usr/bin/env python3
"""
scripts/compare_eslint_truthfully.py

Runs identical ESLint against baseline (10988c43) and current repair tree,
generates stable diagnostic identities, and produces an authentic diff.
"""

import sys
import os
import json
import subprocess

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

def run_eslint(cwd):
    cmd = ['npx', 'eslint', 'resources/js', '--format', 'json']
    res = subprocess.run(cmd, cwd=cwd, capture_output=True, encoding='utf-8', errors='replace', shell=True)
    try:
        return json.loads(res.stdout)
    except Exception as e:
        print(f"Error parsing eslint JSON from {cwd}: {e}")
        return []

def extract_diagnostics(data):
    diags = []
    for file_obj in data:
        fpath = file_obj.get('filePath', '').replace('\\', '/')
        idx = fpath.find('resources/js')
        rel_path = fpath[idx:] if idx != -1 else fpath
        for msg in file_obj.get('messages', []):
            rule = msg.get('ruleId') or 'syntax-error'
            line = msg.get('line')
            message = msg.get('message', '').strip()
            diags.append({
                'file': rel_path,
                'rule': rule,
                'line': line,
                'message': message,
                'id': f"{rel_path}:{rule}:{message}"
            })
    return diags

def main():
    baseline_dir = 'E:/AMD POS/baseline-10988c43/app-code/main-app'
    current_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')).replace('\\', '/')

    print(f"Running ESLint on Baseline: {baseline_dir}")
    b_data = run_eslint(baseline_dir)
    print(f"Running ESLint on Current:  {current_dir}")
    c_data = run_eslint(current_dir)

    b_diags = extract_diagnostics(b_data)
    c_diags = extract_diagnostics(c_data)

    b_map = {d['id']: d for d in b_diags}
    c_map = {d['id']: d for d in c_diags}

    added = [d for d in c_diags if d['id'] not in b_map]
    removed = [d for d in b_diags if d['id'] not in c_map]

    # Check touched files
    touched_files = [
        'resources/js/Pages/Approvals/Show.jsx',
        'resources/js/Pages/Expenses/Create.jsx',
        'resources/js/Pages/Sales/CreateInvoice.jsx'
    ]
    added_in_touched = [d for d in added if d['file'] in touched_files]

    summary = {
        'baseline_total': len(b_diags),
        'current_total': len(c_diags),
        'net_delta': len(c_diags) - len(b_diags),
        'removed_count': len(removed),
        'added_count': len(added),
        'added_in_touched_files_count': len(added_in_touched),
        'added_diagnostics': added,
        'removed_diagnostics': removed,
        'added_in_touched_files': added_in_touched,
        'touched_files_evaluated': touched_files
    }

    out_dir = os.path.join(current_dir, 'docs/approval-dashboard-audit-2026-09-22/evidence/final-handoff')
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, 'lint_comparison.json')

    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, indent=2)

    print("\n================ ESLINT COMPARISON REPORT ================")
    print(f"Baseline Diagnostics: {len(b_diags)}")
    print(f"Current Diagnostics:  {len(c_diags)}")
    print(f"Net Change:           {len(c_diags) - len(b_diags):+d}")
    print(f"Removed (Fixed):      {len(removed)}")
    print(f"Added (New):          {len(added)}")
    print(f"Added in Touched:     {len(added_in_touched)}")
    print(f"Detailed report:      {out_file}")
    print("==========================================================\n")

    if added:
        print("=== NEW DIAGNOSTICS INTRODUCED ===")
        for d in added:
            print(f"  {d['file']}:{d['line']} [{d['rule']}] {d['message']}")

    if removed:
        print("\n=== DIAGNOSTICS FIXED ===")
        for d in removed:
            print(f"  {d['file']}:{d['line']} [{d['rule']}] {d['message']}")

if __name__ == '__main__':
    main()
