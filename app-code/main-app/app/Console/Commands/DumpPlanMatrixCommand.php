<?php

namespace App\Console\Commands;

use Database\Seeders\PlanFeatureMatrixSeeder;
use Illuminate\Console\Command;

class DumpPlanMatrixCommand extends Command
{
    protected $signature = 'venqore:dump-plan-matrix {--check : Check if config/plans.php matches seeder without writing}';
    protected $description = 'Dump canonical plan matrix from PlanFeatureMatrixSeeder into config/plans.php';

    public function handle(): int
    {
        $planSlugs = ['solo', 'starter', 'core', 'scale', 'custom', 'trial', 'ltd_1', 'ltd_2', 'ltd_3'];
        $matrix = PlanFeatureMatrixSeeder::getMatrix();

        $numericKeys = [
            'sku_limit', 'staff_limit', 'locations', 'location_limit', 'registers',
            'devices_per_seat', 'visible_history_days', 'transactions_per_month',
            'service_jobs_per_month', 'ai_credits_monthly', 'ai_scans_monthly',
            'ai_credits_annual', 'free_trial_days', 'cart_tabs_limit',
        ];

        $dump = [];

        foreach ($planSlugs as $slug) {
            $dump[$slug] = [];

            foreach ($matrix as $key => $values) {
                // Under V11 §1.1 / F4, reports are universal and excluded from tier-specific config fallback
                if (str_starts_with($key, 'report_') && $key !== 'reports') {
                    continue;
                }

                $val = PlanFeatureMatrixSeeder::resolveLimitValue($slug, $key, $values);

                if ($val === null) {
                    $typedVal = null;
                } elseif (in_array($key, $numericKeys, true) && is_numeric($val)) {
                    $typedVal = (int) $val;
                } elseif ($val === '1') {
                    $typedVal = true;
                } elseif ($val === '0') {
                    $typedVal = false;
                } else {
                    $typedVal = $val;
                }

                $dump[$slug][$key] = $typedVal;
            }
        }

        $code = "<?php\n\n/**\n * Plan Limits & Feature Registry — Generated Reference & Last-Resort Fallback\n *\n * Generated from database/seeders/PlanFeatureMatrixSeeder.php via:\n * php artisan venqore:dump-plan-matrix\n *\n * Do NOT edit by hand. Re-generate with the artisan command.\n */\n\nreturn " . $this->exportArray($dump) . ";\n";

        $targetPath = config_path('plans.php');

        if ($this->option('check')) {
            $current = file_exists($targetPath) ? file_get_contents($targetPath) : '';
            if ($current !== $code) {
                $this->error('config/plans.php does not match canonical PlanFeatureMatrixSeeder matrix!');
                return 1;
            }
            $this->info('config/plans.php matches canonical PlanFeatureMatrixSeeder matrix.');
            return 0;
        }

        file_put_contents($targetPath, $code);
        $this->info("Successfully dumped canonical plan matrix to {$targetPath}.");
        return 0;
    }

    private function exportArray(array $array, int $indent = 1): string
    {
        $spaces = str_repeat('    ', $indent);
        $closeSpaces = str_repeat('    ', $indent - 1);
        $lines = ["[\n"];

        foreach ($array as $key => $value) {
            $formattedKey = var_export($key, true);
            if (is_array($value)) {
                $lines[] = "{$spaces}{$formattedKey} => " . $this->exportArray($value, $indent + 1) . ",\n";
            } elseif ($value === null) {
                $lines[] = "{$spaces}{$formattedKey} => null,\n";
            } elseif ($value === true) {
                $lines[] = "{$spaces}{$formattedKey} => true,\n";
            } elseif ($value === false) {
                $lines[] = "{$spaces}{$formattedKey} => false,\n";
            } elseif (is_int($value) || is_float($value)) {
                $lines[] = "{$spaces}{$formattedKey} => {$value},\n";
            } else {
                $lines[] = "{$spaces}{$formattedKey} => " . var_export($value, true) . ",\n";
            }
        }

        $lines[] = "{$closeSpaces}]";
        return implode('', $lines);
    }
}
