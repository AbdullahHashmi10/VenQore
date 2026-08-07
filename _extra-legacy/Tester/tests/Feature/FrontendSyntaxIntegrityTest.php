<?php

namespace Tests\Feature;

use Symfony\Component\Process\Process;
use Tests\Feature\VenQoreTestCase;

class FrontendSyntaxIntegrityTest extends VenQoreTestCase
{
    /** @test */
    public function frontend_codebase_has_no_eslint_errors(): void
    {
        // Execute ESLint across the React/JS files in resources/js
        $process = Process::fromShellCommandline('npx eslint "resources/js" --ext .js,.jsx -c "scratch/eslint-undef-only.json" --no-eslintrc --quiet');
        $process->setTimeout(90);
        $process->run();

        $exitCode = $process->getExitCode();
        $output = $process->getOutput();
        $errorOutput = $process->getErrorOutput();

        $this->assertEquals(
            0,
            $exitCode,
            sprintf(
                "ESLint discovered unresolved reference or syntax errors in the React codebase:\n\n%s\n%s",
                $output,
                $errorOutput
            )
        );
    }
}
