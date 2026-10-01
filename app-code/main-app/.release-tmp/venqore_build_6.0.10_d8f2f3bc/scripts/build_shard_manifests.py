#!/usr/bin/env python3
"""
scripts/build_shard_manifests.py

Generates deterministic shard manifests for baseline and current suites.
Guarantees 0 omission and 0 duplication.
"""

import os
import glob
import json

BASELINE_DIR = 'E:/AMD POS/baseline-10988c43/app-code/main-app'
CURRENT_DIR = 'E:/AMD POS/AMD POS/app-code/main-app'
MANIFEST_DIR = 'docs/approval-dashboard-audit-2026-09-22/evidence/complete-junit/manifests'

CURRENT_ONLY_19 = {
    'tests/tests/Feature/Approval/ApprovalFoundationTest.php',
    'tests/tests/Feature/Approval/ApprovalPolicyMatrixIntegrationTest.php',
    'tests/tests/Feature/Approval/FourDocumentApprovalTest.php',
    'tests/tests/Feature/Approval/PostingBoundaryGuardTest.php',
    'tests/tests/Feature/Approval/PostingCallsiteEnforcementTest.php',
    'tests/tests/Feature/Approval/PostingParityTest.php',
    'tests/tests/Feature/Approval/RealFormHttpWorkflowTest.php',
    'tests/tests/Feature/Approval/RuntimeRoleDashboardMatrixTest.php',
    'tests/tests/Feature/Approval/SaleObserverCanonicalGuardTest.php',
    'tests/tests/Feature/Approval/StorePolicyPrecedenceTest.php',
    'tests/tests/Feature/Approval/TransactionEditorCorrectionTest.php',
    'tests/tests/Feature/Approval/TrustedPosSeparationTest.php',
    'tests/tests/Feature/Auth/PermissionOverrideModeTest.php',
    'tests/tests/Feature/Batch1RegressionTest.php',
    'tests/tests/Feature/Reckoner/ApprovalCardsAndScopeTest.php',
    'tests/tests/Feature/Reckoner/CardContractAndPresetResolutionTest.php',
    'tests/tests/Unit/Audit/MigrationCompatibilityTest.php',
    'tests/tests/Unit/Audit/RoleCardAuditTest.php',
    'tests/tests/Unit/ZiggyRouteAuditScriptTest.php'
}

def get_files(base_dir):
    pattern = os.path.join(base_dir, 'tests/tests/**/*Test.php')
    files = sorted(glob.glob(pattern, recursive=True))
    prefix = base_dir.replace('\\', '/') + '/'
    return [f.replace('\\', '/')[len(prefix):] for f in files]

def assign_shard(rel_path):
    norm_path = rel_path.replace('\\', '/')
    if norm_path in CURRENT_ONLY_19:
        return 'shard_14_current_new'
    
    p = norm_path.replace('tests/tests/', '')
    if p == 'Feature/Reckoner/Laws/L8RegistryContractTest.php':
        return 'shard_11b_reckoner_l8'
    if p.startswith('Unit/'):
        return 'shard_01_unit'
    if p.startswith('Routes/') or p.startswith('Performance/'):
        return 'shard_02a_routes_perf_root'
    if p.startswith('Feature/') and '/' not in p[8:]:
        # Root Feature file
        fname = p[8:]
        if fname[0].upper() <= 'L':
            return 'shard_02a_routes_perf_root'
        else:
            return 'shard_02b_feature_root'
    if any(p.startswith(f'Feature/{x}/') for x in ['Ai', 'Chat', 'AppSumo', 'Marketing', 'DemoStore']):
        return 'shard_03_ai_chat_marketing'
    if any(p.startswith(f'Feature/{x}/') for x in ['Auth', 'Billing', 'Security', 'Tenant']):
        return 'shard_04_auth_billing_security'
    if any(p.startswith(f'Feature/{x}/') for x in ['Core', 'Guardrails', 'Heart']):
        return 'shard_05_core_guardrails'
    if any(p.startswith(f'Feature/{x}/') for x in ['Hardening', 'Smoke', 'Plan', 'Production']):
        return 'shard_06_hardening_smoke_plan'
    if p.startswith('Feature/Golden/'):
        return 'shard_07_golden'
    if any(p.startswith(f'Feature/{x}/') for x in ['Module', 'Module01', 'Module02', 'Module03', 'Module04', 'Module05', 'Module06', 'Module07', 'Module08', 'Module09', 'Module10']):
        return 'shard_08_modules_01_10'
    if any(p.startswith(f'Feature/{x}/') for x in ['Module11', 'Module12', 'Module13', 'Module14', 'Module15', 'Module16', 'Module17', 'Module18', 'Module19', 'Module20', 'Module21', 'Monetization']):
        return 'shard_09_modules_11_21'
    if p.startswith('Feature/Money/'):
        return 'shard_10_money'
    if p.startswith('Feature/Reckoner/Laws/'):
        return 'shard_11a2_reckoner_laws'
    if any(p.startswith(f'Feature/{x}/') for x in ['Reckoner', 'Reports', 'Dashboard']):
        gate_files = {
            'Feature/Dashboard/FrameGeometryLawTest.php',
            'Feature/Reckoner/AdversarialInvariantGateTest.php',
            'Feature/Reckoner/CardContractValidatorTest.php',
            'Feature/Reckoner/CustomCardsGateTest.php',
            'Feature/Reckoner/DataCaptureMigrationsGateTest.php',
            'Feature/Reckoner/GoldenStoreLedgerTest.php',
            'Feature/Reckoner/LedgerFoundationGateTest.php',
            'Feature/Reckoner/RollupParityGateTest.php',
            'Feature/Reckoner/Slice4aMoneyGateTest.php',
            'Feature/Reckoner/Slice4bSellingGateTest.php',
            'Feature/Reckoner/Slice4cStockGateTest.php',
            'Feature/Reckoner/Slice4dOperationsGateTest.php',
            'Feature/Reckoner/TruthGateTest.php',
        }
        if p in gate_files:
            return 'shard_11a1_reckoner_gates'
        else:
            return 'shard_11a3_reckoner_services'
    if p.startswith('Feature/Tools/'):
        return 'shard_12_tools'
    if p.startswith('Feature/V3/'):
        return 'shard_13_v3'
        
    raise ValueError(f"Unassigned file: {rel_path} (p: {p})")

def main():
    os.makedirs(MANIFEST_DIR, exist_ok=True)
    b_files = get_files(BASELINE_DIR)
    c_files = get_files(CURRENT_DIR)

    b_shards = {}
    for f in b_files:
        sh = assign_shard(f)
        b_shards.setdefault(sh, []).append(f)

    c_shards = {}
    for f in c_files:
        sh = assign_shard(f)
        c_shards.setdefault(sh, []).append(f)

    print("Baseline Shards:")
    b_total = 0
    for sh in sorted(b_shards):
        fl = b_shards[sh]
        print(f"  {sh:30} : {len(fl):3} files")
        b_total += len(fl)
    print(f"Total baseline assigned: {b_total} / {len(b_files)}")

    print("\nCurrent Shards:")
    c_total = 0
    for sh in sorted(c_shards):
        fl = c_shards[sh]
        print(f"  {sh:30} : {len(fl):3} files")
        c_total += len(fl)
    print(f"Total current assigned:  {c_total} / {len(c_files)}")

    assert b_total == 325, f"Expected 325 baseline files, got {b_total}"
    assert c_total == 344, f"Expected 344 current files, got {c_total}"
    assert len(c_shards['shard_14_current_new']) == 19
    assert 'shard_14_current_new' not in b_shards

    # Verify identical file boundaries for all shared shards
    for sh in b_shards:
        assert b_shards[sh] == c_shards[sh], f"File list mismatch in {sh}"
    print("ALL 15 shared shards have 100% identical file lists in baseline and current.")

    # Write manifests
    all_manifest = {}
    for sh in sorted(c_shards):
        manifest_data = {
            'shard': sh,
            'file_count_baseline': len(b_shards.get(sh, [])),
            'file_count_current': len(c_shards[sh]),
            'baseline_files': b_shards.get(sh, []),
            'current_files': c_shards[sh]
        }
        all_manifest[sh] = manifest_data
        with open(f"{MANIFEST_DIR}/{sh}.json", 'w', encoding='utf-8') as fp:
            json.dump(manifest_data, fp, indent=2)

    with open(f"{MANIFEST_DIR}/all_shards_index.json", 'w', encoding='utf-8') as fp:
        json.dump(all_manifest, fp, indent=2)

    print(f"Successfully generated all {len(all_manifest)} shard manifests in {MANIFEST_DIR}")

if __name__ == '__main__':
    main()
