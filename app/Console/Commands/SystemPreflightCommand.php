<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class SystemPreflightCommand extends Command
{
    protected $signature = 'system:preflight';
    protected $description = 'Run a strict automated pre-flight checklist before deploying or generating a build.';

    public function handle()
    {
        $this->info("Starting VenQore Pre-Flight Verification...");
        $this->newLine();

        $steps = [
            'checkExtensions' => 'Checking PHP Extensions',
            'checkMigrations' => 'Checking Database Migrations',
            'checkRoutes'     => 'Validating Route Compilation',
            'checkConfig'     => 'Validating Config Compilation',
            'runTests'        => 'Running PHPUnit Test Suite',
        ];

        foreach ($steps as $method => $description) {
            $this->info("⏳ {$description}...");
            if (!$this->$method()) {
                $this->error("❌ Pre-flight failed at: {$description}");
                return 1; // Return non-zero exit code to halt build scripts
            }
            $this->info("✅ Passed.");
            $this->newLine();
        }

        $this->info("🎉 All pre-flight checks passed! The system is ready for deployment.");
        return 0;
    }

    private function checkExtensions(): bool
    {
        $required = ['zip', 'mbstring', 'pdo_mysql', 'gd', 'bcmath'];
        $missing = [];

        foreach ($required as $ext) {
            if (!extension_loaded($ext)) {
                $missing[] = $ext;
            }
        }

        if (!empty($missing)) {
            $this->error("Missing required PHP extensions: " . implode(', ', $missing));
            return false;
        }

        return true;
    }

    private function checkMigrations(): bool
    {
        try {
            // Check if there are any pending migrations
            $output = Artisan::call('migrate:status');
            $status = Artisan::output();
            
            if (str_contains($status, 'Pending')) {
                $this->error("There are pending database migrations. Please run 'php artisan migrate' first.");
                return false;
            }
            
            // Basic DB connectivity check
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            $this->error("Database connection failed: " . $e->getMessage());
            return false;
        }
    }

    private function checkRoutes(): bool
    {
        try {
            Artisan::call('route:cache');
            return true;
        } catch (\Exception $e) {
            $this->error("Route caching failed. You likely have a Closure route or duplicate route name. " . $e->getMessage());
            return false;
        }
    }

    private function checkConfig(): bool
    {
        try {
            Artisan::call('config:cache');
            return true;
        } catch (\Exception $e) {
            $this->error("Config caching failed. " . $e->getMessage());
            return false;
        }
    }

    private function runTests(): bool
    {
        $this->warn("Running test suite (this may take a moment)...");
        
        $exitCode = Artisan::call('test', [
            '--stop-on-failure' => true,
        ]);

        if ($exitCode !== 0) {
            $this->error("Test suite failed!");
            $this->line(Artisan::output());
            return false;
        }

        return true;
    }
}
