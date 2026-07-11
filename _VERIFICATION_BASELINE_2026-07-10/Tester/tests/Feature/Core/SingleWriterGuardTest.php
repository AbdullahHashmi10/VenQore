<?php

namespace Tester\Tests\Feature\Core;

use Tests\Feature\VenQoreTestCase;

class SingleWriterGuardTest extends VenQoreTestCase
{
    public function test_no_raw_journal_writes_allowed_outside_engine()
    {
        $appPath = base_path('app');
        $files = $this->rglob($appPath . '/*.php');

        $violations = [];

        foreach ($files as $file) {
            $relativePath = str_replace(base_path() . DIRECTORY_SEPARATOR, '', $file);
            $relativePathNormalized = str_replace('\\', '/', $relativePath);

            // Allowlist rules
            if ($relativePathNormalized === 'app/Services/V3/AccountingService.php') {
                continue;
            }
            if ($relativePathNormalized === 'app/Services/DataImportService.php') {
                continue;
            }
            if (str_starts_with($relativePathNormalized, 'app/Console/Commands/')) {
                continue;
            }

            $content = file_get_contents($file);

            if (preg_match('/JournalItem::create\(/i', $content) || preg_match('/JournalEntry::create\(/i', $content)) {
                $violations[] = $relativePathNormalized;
            }
        }

        $this->assertEmpty($violations, "Violations detected: raw journal writes found in: " . implode(', ', $violations));
    }

    private function rglob($pattern, $flags = 0) {
        $files = glob($pattern, $flags);
        foreach (glob(dirname($pattern).'/*', GLOB_ONLYDIR|GLOB_NOSORT) as $dir) {
            $files = array_merge($files, $this->rglob($dir.'/'.basename($pattern), $flags));
        }
        return $files;
    }
}
