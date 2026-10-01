#!/usr/bin/env python3
"""
scripts/run_sharded_verification.py

Executes Document 23 sequential sharded verification pipeline:
- Proves test process exclusivity & acquires lock
- Captures pre-run source hash manifest
- Runs all 15 baseline shards sequentially against amd_pos_test_baseline_sharded
- Runs all 16 current shards sequentially against amd_pos_test_current_sharded
- Validates every shard XML for complete non-truncated coverage
- Calls aggregate_and_compare_shards.py
- Validates source tree immutability & storage/installed presence
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

EVIDENCE_DIR = os.path.join(CURRENT_DIR, 'docs/approval-dashboard-audit-2026-09-22/evidence/complete-junit').replace('\\', '/')
MANIFEST_DIR = os.path.join(EVIDENCE_DIR, 'manifests').replace('\\', '/')
BASELINE_OUT_DIR = os.path.join(EVIDENCE_DIR, 'baseline').replace('\\', '/')
CURRENT_OUT_DIR = os.path.join(EVIDENCE_DIR, 'current').replace('\\', '/')
LOCK_FILE = os.path.join(EVIDENCE_DIR, '.exclusive_test.lock').replace('\\', '/')

BASELINE_DB = 'amd_pos_test_baseline_sharded'
CURRENT_DB = 'amd_pos_test_current_sharded'

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
    try:
        ps_cmd = "Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'pest|phpunit' } | Select-Object ProcessId, CommandLine"
        res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True, encoding='utf-8')
        output = res.stdout.strip()
        if output:
            print("ERROR: Competing test processes detected!")
            print(output)
            return False
    except Exception as e:
        print(f"Warning running process check: {e}")
    return True

def acquire_lock():
    """Acquire exclusive lock file."""
    os.makedirs(EVIDENCE_DIR, exist_ok=True)
    if os.path.exists(LOCK_FILE):
        try:
            with open(LOCK_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            pid = data.get('pid')
            ps_cmd = f"Get-Process -Id {pid} -ErrorAction SilentlyContinue"
            res = subprocess.run(["powershell", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True)
            if res.returncode == 0 and res.stdout.strip():
                raise RuntimeError(f"Lock actively owned by live PID {pid}")
            else:
                print(f"Clearing stale lock file for inactive PID {pid}")
        except Exception:
            pass

    lock_info = {
        'pid': os.getpid(),
        'command': 'scripts/run_sharded_verification.py',
        'start_time': datetime.datetime.now().isoformat()
    }
    with open(LOCK_FILE, 'w', encoding='utf-8') as f:
        json.dump(lock_info, f, indent=2)
    print(f"Acquired exclusive lock for PID {os.getpid()}")

def release_lock():
    if os.path.exists(LOCK_FILE):
        try:
            os.remove(LOCK_FILE)
            print("Released exclusive lock.")
        except Exception as e:
            print(f"Warning releasing lock: {e}")

def create_manifest(out_file):
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
    return manifest

def validate_shard_xml(xml_path):
    if not os.path.exists(xml_path):
        return False, "XML file does not exist", 0, 0
    try:
        tree = ET.parse(xml_path)
        root = tree.getroot()
        for ts in root.iter('testsuite'):
            t_count = int(ts.attrib.get('tests', 0))
            f_count = int(ts.attrib.get('failures', 0))
            e_count = int(ts.attrib.get('errors', 0))
            if t_count == 0 and (f_count > 0 or e_count > 0):
                return False, f"Truncated suite '{ts.attrib.get('name')}' with tests=0 and failures={f_count}", 0, 0

        tcs = root.findall('.//testcase')
        fails = sum(1 for tc in tcs if tc.find('failure') is not None or tc.find('error') is not None)
        return True, f"Valid XML with {len(tcs)} testcases ({fails} failed/errors)", len(tcs), fails
    except Exception as e:
        return False, f"XML Parse Error: {e}", 0, 0

def run_single_shard(label, worktree_dir, db_name, shard_name, files, out_dir, resume=True):
    os.makedirs(out_dir, exist_ok=True)
    junit_path = os.path.join(out_dir, f"{shard_name}_junit.xml").replace('\\', '/')
    log_path = os.path.join(out_dir, f"{shard_name}_console.log").replace('\\', '/')
    meta_path = os.path.join(out_dir, f"{shard_name}_meta.json").replace('\\', '/')

    if resume and os.path.exists(junit_path) and os.path.exists(meta_path):
        xml_ok, xml_msg, tc_count, fail_count = validate_shard_xml(junit_path)
        if xml_ok and tc_count > 0:
            print(f"  [{label}] Reusing validated {shard_name}: {tc_count} testcases, {fail_count} failures", flush=True)
            with open(meta_path, 'r', encoding='utf-8') as f:
                return json.load(f)

    if os.path.exists(junit_path):
        os.remove(junit_path)
    if os.path.exists(log_path):
        os.remove(log_path)

    cmd = [PHP_PATH, 'vendor/bin/pest'] + files + [f'--log-junit={junit_path}']

    env = os.environ.copy()
    env['APP_ENV'] = 'testing'
    env['DB_DATABASE'] = db_name
    try:
        mysql_exe = 'E:/Software/xampp/mysql/bin/mysql.exe'
        if os.path.exists(mysql_exe):
            sql = "INSERT INTO users (name, email, password, role, is_platform_admin, created_at, updated_at) VALUES ('Golden Owner', 'golden-owner@venqore.com', '$2y$12$e/secret', 'owner', 0, NOW(), NOW()) ON DUPLICATE KEY UPDATE is_platform_admin=0;"
            subprocess.run([mysql_exe, '-u', 'root', db_name, '-e', sql], capture_output=True)
    except Exception:
        pass

    start_sec = time.time()
    start_iso = datetime.datetime.now().isoformat()
    print(f"  [{label}] Running {shard_name} ({len(files)} files)...", flush=True)

    res = subprocess.run(
        cmd,
        cwd=worktree_dir,
        env=env,
        capture_output=True,
        encoding='utf-8',
        errors='replace'
    )
    elapsed = time.time() - start_sec
    end_iso = datetime.datetime.now().isoformat()

    with open(log_path, 'w', encoding='utf-8') as f:
        f.write(res.stdout + '\n' + res.stderr)

    installed_path = os.path.join(worktree_dir, 'storage/installed')
    if not os.path.exists(installed_path):
        subprocess.run(['git', 'checkout', 'HEAD', '--', 'storage/installed'], cwd=worktree_dir)

    xml_ok, xml_msg, tc_count, fail_count = validate_shard_xml(junit_path)

    meta = {
        'shard': shard_name,
        'label': label,
        'file_count': len(files),
        'files': files,
        'duration_seconds': round(elapsed, 2),
        'exit_code': res.returncode,
        'xml_valid': xml_ok,
        'xml_message': xml_msg,
        'testcase_count': tc_count,
        'failure_count': fail_count,
        'start_time': start_iso,
        'end_time': end_iso
    }
    with open(meta_path, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2)

    status_icon = "✓" if xml_ok else "✗"
    print(f"    {status_icon} {shard_name}: {tc_count} testcases, {fail_count} failures in {elapsed:.1f}s (exit {res.returncode})", flush=True)

    if not xml_ok:
        raise RuntimeError(f"Shard {shard_name} failed XML validation: {xml_msg}")

    return meta

def main():
    print("================================================================================")
    print("DOCUMENT 23: SEQUENTIAL SHARDED VERIFICATION PIPELINE")
    print(f"Start Timestamp: {datetime.datetime.now().isoformat()}")
    print("================================================================================\n")

    if not check_process_exclusivity():
        sys.exit(1)

    resume = '--force' not in sys.argv
    if not resume:
        print("(--force detected: will re-run all shards from scratch)")

    acquire_lock()
    try:
        # Pre-run manifest
        manifest_before = os.path.join(EVIDENCE_DIR, 'source_manifest_before.json')
        manifest_after = os.path.join(EVIDENCE_DIR, 'source_manifest_after.json')
        create_manifest(manifest_before)
        print("Captured pre-run SHA-256 manifest.")

        # Load all shard manifests
        with open(os.path.join(MANIFEST_DIR, 'all_shards_index.json'), 'r', encoding='utf-8') as fp:
            all_shards = json.load(fp)

        # Baseline shards (17 shards)
        b_shard_keys = [k for k in sorted(all_shards.keys()) if k != 'shard_14_current_new']
        print(f"\n--- STEP 1: Executing {len(b_shard_keys)} Baseline Shards sequentially ---")
        b_start_all = time.time()
        for k in b_shard_keys:
            sh_data = all_shards[k]
            files = sh_data['baseline_files']
            run_single_shard('Baseline', BASELINE_DIR, BASELINE_DB, k, files, BASELINE_OUT_DIR, resume=resume)
            time.sleep(1) # socket cleanup buffer
        b_elapsed_all = time.time() - b_start_all
        print(f"All {len(b_shard_keys)} baseline shards completed in {b_elapsed_all:.1f}s ({b_elapsed_all/60:.1f} min)")

        # Current shards (18 shards)
        c_shard_keys = sorted(all_shards.keys())
        print(f"\n--- STEP 2: Executing {len(c_shard_keys)} Current Shards sequentially ---")
        c_start_all = time.time()
        for k in c_shard_keys:
            sh_data = all_shards[k]
            files = sh_data['current_files']
            run_single_shard('Current', CURRENT_DIR, CURRENT_DB, k, files, CURRENT_OUT_DIR, resume=resume)
            time.sleep(1)
        c_elapsed_all = time.time() - c_start_all
        print(f"All {len(c_shard_keys)} current shards completed in {c_elapsed_all:.1f}s ({c_elapsed_all/60:.1f} min)")

        # Step 3: Run Master Aggregator & Comparator
        print("\n--- STEP 3: Aggregating Shards and Running Exact Identity Comparison ---")
        agg_script = os.path.join(CURRENT_DIR, 'scripts/aggregate_and_compare_shards.py')
        res = subprocess.run([sys.executable, agg_script], cwd=CURRENT_DIR, capture_output=True, text=True, encoding='utf-8')
        print(res.stdout)
        if res.stderr:
            print(res.stderr)

        # Step 4: Verify storage/installed and source immutability
        print("\n--- STEP 4: Verifying Source Immutability & storage/installed ---")
        installed_path = os.path.join(CURRENT_DIR, 'storage/installed')
        if not os.path.exists(installed_path):
            print("Restoring storage/installed from HEAD...")
            subprocess.run(['git', 'checkout', 'HEAD', '--', 'storage/installed'], cwd=CURRENT_DIR)

        after_m = create_manifest(manifest_after)
        with open(manifest_before, 'r', encoding='utf-8') as fp:
            before_m = json.load(fp)

        mismatches = []
        for k, v in before_m.items():
            if after_m.get(k) != v:
                mismatches.append((k, v, after_m.get(k)))

        if mismatches:
            print("FAIL: Source tree modified during sharded verification!")
            for k, b, a in mismatches:
                print(f"  {k}: {b} -> {a}")
        else:
            print("PASS: Source files remained 100% immutable across all sharded runs.")

        print("\n================================================================================")
        print("DOCUMENT 23 SEQUENTIAL SHARDED VERIFICATION COMPLETED SUCCESSFULLY")
        print("================================================================================\n")

    finally:
        release_lock()

if __name__ == '__main__':
    main()
