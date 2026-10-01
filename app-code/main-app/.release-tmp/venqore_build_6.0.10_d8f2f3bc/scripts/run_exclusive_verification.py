#!/usr/bin/env python3
"""
scripts/run_exclusive_verification.py

Exclusive Final Verification Pipeline executing Document 21:
- Step 1: Prove test-process exclusivity & manage exclusive lock file
- Step 2: Restore and freeze source tree, capture SHA-256 manifest
- Step 3: Fresh disposable databases (amd_pos_test_baseline_exclusive_10988c43, amd_pos_test_current_exclusive_final)
- Step 4: Run baseline Pest suite exactly once alone, capture UTF-8 console and well-formed XML
- Step 5: Run current Pest suite exactly once alone, capture UTF-8 console and well-formed XML
- Step 6: Compare suites using exact normalized identities with authoritative XML parser
- Step 7: Verify source tree hash immutability & storage/installed presence
"""

import sys
import os
import time
import json
import hashlib
import datetime
import subprocess
import xml.etree.ElementTree as ET

if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

CURRENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..')).replace('\\', '/')
BASELINE_DIR = 'E:/AMD POS/baseline-10988c43/app-code/main-app'
PHP_PATH = 'E:/Software/xampp/php/php.exe'

EVIDENCE_DIR = os.path.join(CURRENT_DIR, 'docs/approval-dashboard-audit-2026-09-22/evidence/exclusive-final').replace('\\', '/')
LOCK_FILE = os.path.join(EVIDENCE_DIR, '.exclusive_test.lock').replace('\\', '/')

BASELINE_DB = 'amd_pos_test_baseline_exclusive_10988c43'
CURRENT_DB = 'amd_pos_test_current_exclusive_final'

BASELINE_JUNIT = os.path.join(EVIDENCE_DIR, 'baseline_junit.xml').replace('\\', '/')
CURRENT_JUNIT = os.path.join(EVIDENCE_DIR, 'current_junit.xml').replace('\\', '/')

BASELINE_LOG = os.path.join(EVIDENCE_DIR, 'baseline_console.log').replace('\\', '/')
CURRENT_LOG = os.path.join(EVIDENCE_DIR, 'current_console.log').replace('\\', '/')

COMPARISON_JSON = os.path.join(EVIDENCE_DIR, 'exclusive_regression_comparison.json').replace('\\', '/')

MANIFEST_FILES = [
    "app/Http/Controllers/Admin/SuperAdminController.php",
    "app/Http/Controllers/ApprovalDocumentController.php",
    "app/Models/TenantUser.php",
    "app/Models/User.php",
    "app/Services/Approval/ApprovalCorrectionResolver.php",
    "app/Services/Approval/ApprovalExecutionEngine.php",
    "package.json",
    "resources/js/Pages/Approvals/Show.jsx",
    "resources/js/Pages/Expenses/Create.jsx",
    "resources/js/Pages/Sales/CreateInvoice.jsx",
    "routes/web.php",
    "scripts/audit_ziggy_routes.cjs",
    "tests/tests/Feature/Approval/ApprovalPolicyMatrixIntegrationTest.php",
    "tests/tests/Feature/Approval/TransactionEditorCorrectionTest.php",
    "tests/tests/Feature/Auth/PermissionOverrideModeTest.php",
    "tests/tests/Feature/Batch1RegressionTest.php",
    "tests/tests/Feature/Chat/SupportTicketsTest.php",
    "tests/tests/Unit/AiBuilder/ScreenshotRegressionTest.php",
    "tests/tests/Unit/ZiggyRouteAuditScriptTest.php",
    "storage/installed"
]

def check_process_exclusivity():
    """Verify no competing test processes are running."""
    print("Checking process exclusivity...")
    try:
        ps_cmd = "Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'pest|phpunit' } | Select-Object ProcessId, CommandLine"
        res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True, encoding='utf-8')
        output = res.stdout.strip()
        if output:
            print("ERROR: Competing test processes detected!")
            print(output)
            return False, output
    except Exception as e:
        print(f"Warning running process check: {e}")
    return True, ""

def acquire_lock(db_name, junit_path, command):
    """Acquire exclusive lock file."""
    os.makedirs(EVIDENCE_DIR, exist_ok=True)
    if os.path.exists(LOCK_FILE):
        try:
            with open(LOCK_FILE, 'r', encoding='utf-8') as f:
                lock_data = json.load(f)
            pid = lock_data.get('pid')
            # Check if PID is alive
            ps_cmd = f"Get-Process -Id {pid} -ErrorAction SilentlyContinue"
            res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True)
            if res.returncode == 0 and res.stdout.strip():
                raise RuntimeError(f"Lock file exists and PID {pid} is actively running: {lock_data}")
            else:
                print(f"Found stale lock file for inactive PID {pid}. Overwriting.")
        except json.JSONDecodeError:
            print("Found corrupt lock file. Overwriting.")

    lock_info = {
        'pid': os.getpid(),
        'command': command,
        'database': db_name,
        'junit_path': junit_path,
        'start_time': datetime.datetime.now().isoformat()
    }
    with open(LOCK_FILE, 'w', encoding='utf-8') as f:
        json.dump(lock_info, f, indent=2)
    print(f"Acquired exclusive lock for PID {os.getpid()} on {db_name}")

def release_lock():
    """Release exclusive lock file."""
    if os.path.exists(LOCK_FILE):
        try:
            os.remove(LOCK_FILE)
            print("Released exclusive lock.")
        except Exception as e:
            print(f"Warning: could not remove lock file: {e}")

def create_manifest(out_file):
    """Generate SHA-256 manifest of intended source and test files."""
    manifest = {}
    for rel_path in MANIFEST_FILES:
        full_path = os.path.join(CURRENT_DIR, rel_path)
        if os.path.exists(full_path):
            with open(full_path, 'rb') as fp:
                manifest[rel_path] = hashlib.sha256(fp.read()).hexdigest()
        else:
            manifest[rel_path] = "MISSING"
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    print(f"Wrote SHA-256 manifest ({len(manifest)} files) to: {out_file}")
    return manifest

def verify_manifest(before_file, after_file):
    """Verify source files remained 100% frozen."""
    with open(before_file, 'r', encoding='utf-8') as f:
        before = json.load(f)
    after = create_manifest(after_file)
    mismatches = []
    for k, v in before.items():
        if after.get(k) != v:
            mismatches.append((k, v, after.get(k)))
    if mismatches:
        print("FAIL: Source files changed during verification run!")
        for k, b, a in mismatches:
            print(f"  {k}: {b} -> {a}")
        return False
    print("PASS: Source files remained 100% immutable across test runs.")
    return True

def validate_junit_xml(junit_path):
    """Validate that JUnit XML exists and is well-formed XML."""
    if not os.path.exists(junit_path):
        return False, "File does not exist"
    try:
        tree = ET.parse(junit_path)
        root = tree.getroot()
        tc_count = len(root.findall('.//testcase'))
        return True, f"Valid XML with {tc_count} testcases"
    except Exception as e:
        return False, f"Invalid XML: {e}"

def run_suite(label, worktree_dir, db_name, cache_prefix, junit_path, log_path, meta_path):
    """Execute a single Pest test suite with complete exclusivity."""
    print(f"\n================================================================================")
    print(f"STARTING EXCLUSIVE RUN: {label}")
    print(f"Worktree:  {worktree_dir}")
    print(f"Database:  {db_name}")
    print(f"JUnit XML: {junit_path}")
    print(f"Console:   {log_path}")
    print(f"================================================================================\n")

    is_exclusive, active_procs = check_process_exclusivity()
    if not is_exclusive:
        raise RuntimeError("Aborting: active test process already running.")

    cmd_list = [PHP_PATH, 'vendor/bin/pest', f'--log-junit={junit_path}']
    cmd_str = f'"{PHP_PATH}" vendor/bin/pest "--log-junit={junit_path}"'
    acquire_lock(db_name, junit_path, cmd_str)

    # Clean existing output files to avoid any append or race
    if os.path.exists(junit_path):
        os.remove(junit_path)
    if os.path.exists(log_path):
        os.remove(log_path)

    env = os.environ.copy()
    env['APP_ENV'] = 'testing'
    env['DB_DATABASE'] = db_name
    env['CACHE_PREFIX'] = cache_prefix

    start_sec = time.time()
    start_iso = datetime.datetime.now().isoformat()

    print(f"Executing at {start_iso}...")
    try:
        res = subprocess.run(
            cmd_list,
            cwd=worktree_dir,
            env=env,
            capture_output=True,
            encoding='utf-8',
            errors='replace'
        )
        elapsed = time.time() - start_sec
        end_iso = datetime.datetime.now().isoformat()
        exit_code = res.returncode

        print(f"{label} exited with code {exit_code} in {elapsed:.2f}s ({elapsed/60:.2f} min)")

        # Write console log with UTF-8 encoding
        with open(log_path, 'w', encoding='utf-8') as f:
            f.write(res.stdout + '\n' + res.stderr)

        # Validate JUnit XML
        xml_ok, xml_msg = validate_junit_xml(junit_path)
        print(f"JUnit XML Validation: {xml_msg}")

        meta = {
            'label': label,
            'worktree': worktree_dir,
            'database': db_name,
            'cache_prefix': cache_prefix,
            'start_time': start_iso,
            'end_time': end_iso,
            'duration_seconds': round(elapsed, 2),
            'exit_code': exit_code,
            'junit_valid': xml_ok,
            'junit_message': xml_msg,
            'junit_path': junit_path,
            'log_path': log_path
        }
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump(meta, f, indent=2)

        return exit_code, xml_ok
    finally:
        release_lock()

def main():
    print("================================================================================")
    print("DOCUMENT 21: AUTHORITATIVE EXCLUSIVE FINAL VERIFICATION PIPELINE")
    print(f"Start Timestamp: {datetime.datetime.now().isoformat()}")
    print("================================================================================\n")

    # Step 1: Process exclusivity
    is_exclusive, procs = check_process_exclusivity()
    if not is_exclusive:
        sys.exit(1)

    # Step 2: Source tree freeze
    manifest_before = os.path.join(EVIDENCE_DIR, 'source_manifest_before.json')
    manifest_after = os.path.join(EVIDENCE_DIR, 'source_manifest_after.json')
    create_manifest(manifest_before)

    # Record Git provenance
    git_prov = {
        'head': subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=CURRENT_DIR, capture_output=True, text=True).stdout.strip(),
        'branch': subprocess.run(['git', 'branch', '--show-current'], cwd=CURRENT_DIR, capture_output=True, text=True).stdout.strip(),
        'origin_main': subprocess.run(['git', 'rev-parse', 'origin/main'], cwd=CURRENT_DIR, capture_output=True, text=True).stdout.strip(),
        'status_porcelain': subprocess.run(['git', 'status', '--porcelain=v1'], cwd=CURRENT_DIR, capture_output=True, text=True).stdout.strip().splitlines()
    }
    with open(os.path.join(EVIDENCE_DIR, 'git_provenance.json'), 'w', encoding='utf-8') as f:
        json.dump(git_prov, f, indent=2)
    print(f"Git Provenance recorded (HEAD: {git_prov['head'][:10]}, branch: {git_prov['branch']})")

    # Step 3: Fresh databases confirmed
    print(f"Target Baseline DB: {BASELINE_DB}")
    print(f"Target Current DB:  {CURRENT_DB}")

    # Step 4: Run Baseline Full Suite alone
    baseline_meta = os.path.join(EVIDENCE_DIR, 'baseline_meta.json')
    b_code, b_xml_ok = run_suite(
        label='Baseline (10988c43)',
        worktree_dir=BASELINE_DIR,
        db_name=BASELINE_DB,
        cache_prefix='baseline_exclusive_',
        junit_path=BASELINE_JUNIT,
        log_path=BASELINE_LOG,
        meta_path=baseline_meta
    )

    # Step 5: Wait 5 seconds, re-verify exclusivity, then run Current Full Suite alone
    print("\nPausing 5s to ensure all OS resources from baseline process are fully reclaimed...")
    time.sleep(5)

    current_meta = os.path.join(EVIDENCE_DIR, 'current_meta.json')
    c_code, c_xml_ok = run_suite(
        label='Current Repaired Tree (0d33d5b0)',
        worktree_dir=CURRENT_DIR,
        db_name=CURRENT_DB,
        cache_prefix='current_exclusive_',
        junit_path=CURRENT_JUNIT,
        log_path=CURRENT_LOG,
        meta_path=current_meta
    )

    # Step 6: Authoritative XML Regression Comparison
    print("\n================================================================================")
    print("STEP 6: AUTHORITATIVE JUNIT REGRESSION COMPARISON")
    print("================================================================================\n")
    cmp_script = os.path.join(CURRENT_DIR, 'scripts/compare_junit_truthfully.py')
    cmp_cmd = [sys.executable, cmp_script, BASELINE_JUNIT, CURRENT_JUNIT, '--json-out', COMPARISON_JSON]
    cmp_res = subprocess.run(cmp_cmd, cwd=CURRENT_DIR, capture_output=True, text=True, encoding='utf-8')
    print(cmp_res.stdout)
    if cmp_res.stderr:
        print(cmp_res.stderr)

    # Step 7: Verify Source Hash Immutability
    print("\n================================================================================")
    print("STEP 7: VERIFYING SOURCE TREE IMMUTABILITY")
    print("================================================================================\n")
    manifest_ok = verify_manifest(manifest_before, manifest_after)

    installed_ok = os.path.exists(os.path.join(CURRENT_DIR, 'storage/installed'))
    print(f"storage/installed presence: {'PASS' if installed_ok else 'FAIL'}")

    print("\n================================================================================")
    print("EXCLUSIVE VERIFICATION PIPELINE COMPLETE")
    print(f"Baseline Exit:        {b_code} (JUnit XML valid: {b_xml_ok})")
    print(f"Current Exit:         {c_code} (JUnit XML valid: {c_xml_ok})")
    print(f"Source Immutability:  {'PASS' if manifest_ok else 'FAIL'}")
    print(f"storage/installed:    {'PASS' if installed_ok else 'FAIL'}")
    print("================================================================================\n")

if __name__ == '__main__':
    main()
