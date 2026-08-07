<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class AiSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'ai_enabled' => '1', // Globally enabled
            'ai_tier' => 'free', // free, trial, paid
            'ai_usage_limit' => '50', // queries per month
            'ai_restricted_roles' => json_encode(['cashier', 'stock_manager']), // Roles NOT allowed to use AI
        ];

        foreach ($settings as $key => $value) {
            Setting::firstOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}
