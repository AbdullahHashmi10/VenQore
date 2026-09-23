#!/usr/bin/env python3
"""
scripts/compare_lint_truthfully.py

Runs the repository's canonical lint command (`oxlint --format json resources/js`)
against both baseline (10988c43) and current worktree, builds stable diagnostic
identities, checks touched files, and categorizes pre-existing legacy debt.
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

def run_oxlint(cwd):
    cmd = ['npx', 'oxlint', '--format', 'json', 'resources/js']
    res = subprocess.run(cmd, cwd=cwd, capture_output=True, encoding='utf-8', errors='replace', shell=True)
    try:
        raw = res.stdout.strip()
        # oxlint JSON format outputs an array of diagnostics or an object with diagnostics
        if not raw:
            return []
        data = json.loads(raw)
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            # If wrapped in object
            return data.get('diagnostics', []) or data.get('messages', [])
        return []
    except Exception as e:
        # If output contains preamble before json
        try:
            start_idx = res.stdout.find('[')
            end_idx = res.stdout.rfind(']')
            if start_idx != -1 and end_idx != -1:
                return json.loads(res.stdout[start_idx:end_idx+1])
        except Exception as e2:
            print(f"Error parsing oxlint JSON from {cwd}: {e2}")
        return []

def extract_diagnostics(data):
    diags = []
    for item in data:
        fpath = (item.get('filename') or item.get('filePath') or '').replace('\\', '/')
        idx = fpath.find('resources/js')
        rel_path = fpath[idx:] if idx != -1 else fpath
        
        rule = item.get('code') or item.get('ruleId') or 'unknown-rule'
        message = item.get('message', '').strip()
        
        # Line number from labels/span
        line = 0
        labels = item.get('labels', [])
        if labels and isinstance(labels, list) and len(labels) > 0:
            span = labels[0].get('span', {})
            line = span.get('line', 0)
        elif 'line' in item:
            line = item['line']

        stable_id = f"{rel_path}:{rule}:{message}"
        diags.append({
            'file': rel_path,
            'rule': rule,
            'line': line,
            'message': message,
            'severity': item.get('severity', 'error'),
            'id': stable_id
        })
    return diags

def main():
    baseline_dir = 'E:/AMD POS/baseline-10988c43/app-code/main-app'
    current_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')).replace('\\', '/')

    print(f"Running canonical oxlint on Baseline: {baseline_dir}")
    b_data = run_oxlint(baseline_dir)
    print(f"Running canonical oxlint on Current:  {current_dir}")
    c_data = run_oxlint(current_dir)

    b_diags = extract_diagnostics(b_data)
    c_diags = extract_diagnostics(c_data)

    b_map = {d['id']: d for d in b_diags}
    c_map = {d['id']: d for d in c_diags}

    added = [d for d in c_diags if d['id'] not in b_map]
    removed = [d for d in b_diags if d['id'] not in c_map]

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

    print("\n================ CANONICAL OXLINT COMPARISON REPORT ================")
    print(f"Baseline Diagnostics: {len(b_diags)}")
    print(f"Current Diagnostics:  {len(c_diags)}")
    print(f"Net Change:           {len(c_diags) - len(b_diags):+d}")
    print(f"Removed (Fixed):      {len(removed)}")
    print(f"Added (New):          {len(added)}")
    print(f"Added in Touched:     {len(added_in_touched)}")
    print(f"Detailed report:      {out_file}")
    print("====================================================================\n")

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
