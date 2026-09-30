#!/usr/bin/env python3
"""
scripts/run_final_authoritative_gates.py

Master execution script for Step 10 of Document 19:
1. Runs canonical baseline suite against amd_pos_test_baseline_10988c43
2. Runs canonical repaired current suite against amd_pos_test_current_0d33d5b0
3. Compares suites using authoritative JUnit parser
4. Verifies post-test production build
5. Verifies source hash manifest immutability and storage/installed presence
"""

import sys
import os
import time
import json
import hashlib
import subprocess

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

php_path = 'E:/Software/Xampp/php/php.exe'
baseline_dir = 'E:/AMD POS/baseline-10988c43/app-code/main-app'
current_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')).replace('\\', '/')
evidence_dir = os.path.join(current_dir, 'docs/approval-dashboard-audit-2026-09-22/evidence/final-handoff')
os.makedirs(evidence_dir, exist_ok=True)

baseline_junit = os.path.join(evidence_dir, 'baseline_junit.xml')
current_junit = os.path.join(evidence_dir, 'current_junit.xml')
baseline_log = os.path.join(evidence_dir, 'baseline_console.log')
current_log = os.path.join(evidence_dir, 'current_console.log')
comparison_json = os.path.join(evidence_dir, 'final_regression_comparison.json')
build_log = os.path.join(evidence_dir, 'build_console.log')

def run_suite(label, cwd, db_name, junit_path, log_path):
    print(f"\n================ STEP 10: Running {label} Pest Suite ================")
    print(f"Directory: {cwd}")
    print(f"Database:  {db_name}")
    print(f"JUnit Out: {junit_path}")
    start_time = time.time()
    
    env = os.environ.copy()
    env['DB_DATABASE'] = db_name

    cmd = [php_path, 'vendor/bin/pest', f'--log-junit={junit_path}']
    res = subprocess.run(cmd, cwd=cwd, capture_output=True, encoding='utf-8', errors='replace', env=env)
    
    elapsed = time.time() - start_time
    print(f"{label} completed in {elapsed:.1f}s with exit code {res.returncode}")
    
    with open(log_path, 'w', encoding='utf-8') as f:
        f.write(res.stdout + '\n' + res.stderr)
        
    return res.returncode

def verify_manifest():
    print("\n================ Verifying Source Tree Hash Immutability ================")
    before_file = os.path.join(evidence_dir, 'source_manifest_before.json')
    after_file = os.path.join(evidence_dir, 'source_manifest_after.json')
    
    if not os.path.exists(before_file):
        print("ERROR: source_manifest_before.json missing!")
        return False
        
    with open(before_file, 'r', encoding='utf-8') as f:
        before_manifest = json.load(f)
        
    after_manifest = {}
    mismatches = []
    for fpath, before_hash in before_manifest.items():
        if os.path.exists(fpath):
            with open(fpath, 'rb') as fp:
                cur_hash = hashlib.sha256(fp.read()).hexdigest()
            after_manifest[fpath] = cur_hash
            if cur_hash != before_hash:
                mismatches.append((fpath, before_hash, cur_hash))
        else:
            after_manifest[fpath] = 'MISSING'
            mismatches.append((fpath, before_hash, 'MISSING'))
            
    with open(after_file, 'w', encoding='utf-8') as f:
        json.dump(after_manifest, f, indent=2)
        
    if mismatches:
        print("FAIL: Source tree modified during test run!")
        for f, b, a in mismatches:
            print(f"  {f}: {b} -> {a}")
        return False
    else:
        print("PASS: Source tree remained 100% frozen and immutable across all test runs.")
        return True

def main():
    print("Starting Authoritative Final Verification Pipeline...")
    
    # 1. Run Baseline Suite
    b_code = run_suite('Baseline (10988c43)', baseline_dir, 'amd_pos_test_baseline_10988c43', baseline_junit, baseline_log)
    
    # 2. Run Current Repaired Suite
    c_code = run_suite('Current Repaired Tree', current_dir, 'amd_pos_test_current_0d33d5b0', current_junit, current_log)
    
    # 3. Authoritative JUnit Comparison
    print("\n================ Comparing Baseline and Current Results ================")
    cmp_cmd = [sys.executable, 'scripts/compare_junit_truthfully.py', baseline_junit, current_junit, '--json-out', comparison_json]
    cmp_res = subprocess.run(cmp_cmd, cwd=current_dir, capture_output=True, encoding='utf-8', errors='replace')
    print(cmp_res.stdout)
    if cmp_res.stderr:
        print(cmp_res.stderr)
        
    # 4. Production Build Verification
    print("\n================ Verifying Production Build ================")
    build_cmd = ['npm', 'run', 'build']
    bld_res = subprocess.run(build_cmd, cwd=current_dir, capture_output=True, encoding='utf-8', errors='replace', shell=True)
    with open(build_log, 'w', encoding='utf-8') as f:
        f.write(bld_res.stdout + '\n' + bld_res.stderr)
    print(f"Production build completed with exit code: {bld_res.returncode}")
    
    # 5. Clean generated build files safely
    print("\n================ Cleaning Transient Build Assets ================")
    subprocess.run(['git', 'checkout', 'HEAD', '--', 'public/build'], cwd=current_dir, capture_output=True)
    subprocess.run(['git', 'clean', '-fd', 'public/build'], cwd=current_dir, capture_output=True)
    
    # 6. Verify Manifest Immutability & storage/installed
    manifest_ok = verify_manifest()
    
    installed_ok = os.path.exists('storage/installed')
    print(f"storage/installed presence: {'PASS' if installed_ok else 'FAIL'}")
    
    print("\n================ AUTHORITATIVE PIPELINE SUMMARY ================")
    print(f"Baseline Exit Code:   {b_code}")
    print(f"Current Exit Code:    {c_code}")
    print(f"Production Build:     {'PASS' if bld_res.returncode == 0 else 'FAIL'}")
    print(f"Source Immutability:  {'PASS' if manifest_ok else 'FAIL'}")
    print(f"storage/installed:    {'PASS' if installed_ok else 'FAIL'}")
    print("================================================================\n")

if __name__ == '__main__':
    main()
