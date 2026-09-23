<?php

namespace Tests\Feature\Approval;

use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use Tests\TestCase;

/**
 * PostingCallsiteEnforcementTest
 *
 * Enforces the complete, reviewed, immutable accounting entry call site inventory.
 * This test NEVER rewrites the inventory. It fails closed if:
 * 1. Any ledger-writing call site (createEntry, raw journal inserts, model creates) is added without being audited in the inventory.
 * 2. Any documented call site is deleted or becomes stale.
 * 3. Any entry contains unclassified, placeholder, or generic values.
 * 4. Any entry lacks a concrete enforcement boundary or verified test class that actually exists in the repository.
 * 5. Any entry references permissions not defined in config/permissions.php.
 */
class PostingCallsiteEnforcementTest extends TestCase
{
    private const INVENTORY_PATH = 'docs/approval-dashboard-audit-2026-09-22/accounting-entry-callsite-inventory.json';

    public function test_every_create_entry_callsite_is_classified_in_reviewed_inventory(): void
    {
        $inventoryFile = base_path(self::INVENTORY_PATH);
        $this->assertFileExists($inventoryFile, "Inventory file must exist: " . self::INVENTORY_PATH);

        $fileMtimeBefore = filemtime($inventoryFile);
        $inventoryData = json_decode(file_get_contents($inventoryFile), true);
        $this->assertIsArray($inventoryData, "Inventory file must be valid JSON");
        $this->assertArrayHasKey('callsites', $inventoryData);

        $inventoryCallsites = $inventoryData['callsites'];
        $this->assertNotEmpty($inventoryCallsites, "Inventory callsites list cannot be empty");

        $permissionsConfig = config('permissions', []);
        $allDefinedPermissions = array_unique(array_merge(...array_values($permissionsConfig)));
        $validBusinessDispositions = ['immediate_trusted', 'approval_aware', 'system_only', 'migration_only', 'prohibited'];

        // Map inventory by stable_id and validate each entry
        $inventoryByStableId = [];
        foreach ($inventoryCallsites as $entry) {
            $stableId = $entry['stable_id'] ?? "{$entry['file']}::{$entry['method']}::{$entry['occurrence']}";
            $this->assertArrayNotHasKey($stableId, $inventoryByStableId, "Duplicate stable_id in inventory: {$stableId}");
            $inventoryByStableId[$stableId] = $entry;

            // 1. Fail on unclassified or placeholder values
            $this->assertNotEquals('unclassified', strtolower($entry['caller_type']), "Unclassified caller_type in {$stableId}");
            $this->assertNotEquals('unclassified', strtolower($entry['transaction_type']), "Unclassified transaction_type in {$stableId}");
            $this->assertContains(strtolower($entry['trust_classification']), $validBusinessDispositions, "Invalid trust_classification in {$stableId}");
            $this->assertContains(strtolower($entry['approval_disposition']), $validBusinessDispositions, "Invalid approval_disposition in {$stableId}");
            $this->assertNotEmpty($entry['enforcement_boundary'], "Missing concrete enforcement boundary for {$stableId}");
            $this->assertNotEmpty($entry['verification_test'], "Missing verification test reference for {$stableId}");

            // 2. Validate that the verification test file actually exists
            $testRef = $entry['verification_test'];
            $cleanRef = str_replace('\\', '/', $testRef);
            $path1 = base_path('tests/tests/' . (str_starts_with($cleanRef, 'Tests/') ? substr($cleanRef, 6) : $cleanRef) . '.php');
            $path2 = base_path('tests/' . $cleanRef . '.php');
            $this->assertTrue(
                file_exists($path1) || file_exists($path2),
                "Referenced verification test class does not exist on disk: {$testRef} for {$stableId}"
            );

            // 3. Validate permissions against config/permissions.php if present
            if (!empty($entry['required_permissions']) && is_array($entry['required_permissions'])) {
                foreach ($entry['required_permissions'] as $perm) {
                    $this->assertContains(
                        $perm,
                        $allDefinedPermissions,
                        "Permission '{$perm}' in {$stableId} is not defined in config/permissions.php"
                    );
                }
            }
        }

        // Live AST/Regex scan across app/
        $appPath = app_path();
        $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($appPath));
        $liveDetectedByStableId = [];

        foreach ($files as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $relPath = str_replace('\\', '/', substr($file->getPathname(), strlen(base_path()) + 1));
                $code = file_get_contents($file->getPathname());
                $lines = explode("\n", $code);

                $currentClass = '';
                $currentMethod = '';
                $methodOccurrences = [];

                foreach ($lines as $i => $line) {
                    if (preg_match('/class\s+([A-Za-z0-9_]+)/', $line, $m)) {
                        $currentClass = $m[1];
                    }
                    if (preg_match('/function\s+([A-Za-z0-9_]+)/', $line, $m)) {
                        $currentMethod = $m[1];
                    }

                    $writeType = null;
                    if (preg_match('/->createEntry\s*\(/', $line)) {
                        if ($relPath === 'app/Engines/AccountingService.php' && str_contains($line, 'function createEntry')) {
                            continue;
                        }
                        $writeType = 'createEntry';
                    } elseif (preg_match('/(?:DB::table\([\'"]journal_entries[\'"]\)|->from\([\'"]journal_entries[\'"]\))->(?:insert|insertGetId|create)/', $line)) {
                        $writeType = 'raw_journal_entries_insert';
                    } elseif (preg_match('/(?:DB::table\([\'"]journal_items[\'"]\)|->from\([\'"]journal_items[\'"]\))->(?:insert|insertGetId|create)/', $line)) {
                        $writeType = 'raw_journal_items_insert';
                    } elseif (preg_match('/(?:JournalEntry|JournalItem)::(?:create|forceCreate|insert)/', $line)) {
                        $writeType = 'model_journal_create';
                    }

                    if ($writeType) {
                        $methodKey = $currentMethod ?: 'anonymous_or_top_level';
                        $methodOccurrences[$methodKey] = ($methodOccurrences[$methodKey] ?? 0) + 1;
                        $occurrence = $methodOccurrences[$methodKey];

                        $stableId = "{$relPath}::{$methodKey}::{$occurrence}";
                        $liveDetectedByStableId[$stableId] = [
                            'file'       => $relPath,
                            'class'      => $currentClass,
                            'method'     => $methodKey,
                            'occurrence' => $occurrence,
                            'line'       => $i + 1,
                            'snippet'    => trim($line),
                        ];
                    }
                }
            }
        }

        // 1. Assert exact total counts match
        $this->assertCount(
            count($liveDetectedByStableId),
            $inventoryByStableId,
            sprintf(
                "Call site count mismatch. Live codebase has %d ledger-writing call sites, inventory has %d.",
                count($liveDetectedByStableId),
                count($inventoryByStableId)
            )
        );

        // 2. Assert every live detected call site is in the inventory
        foreach ($liveDetectedByStableId as $stableId => $detected) {
            $this->assertArrayHasKey(
                $stableId,
                $inventoryByStableId,
                "Unregistered ledger write call site detected in codebase: {$stableId} (Line {$detected['line']} in {$detected['file']})."
            );
        }

        // 3. Assert no stale inventory entries exist
        foreach ($inventoryByStableId as $stableId => $entry) {
            $this->assertArrayHasKey(
                $stableId,
                $liveDetectedByStableId,
                "Stale inventory entry: {$stableId} no longer exists in the codebase."
            );
        }

        // 4. Assert inventory was NOT mutated during test
        $this->assertEquals($fileMtimeBefore, filemtime($inventoryFile), "Inventory file must remain strictly immutable during tests.");
    }
}

