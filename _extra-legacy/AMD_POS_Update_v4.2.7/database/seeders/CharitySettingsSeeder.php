<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class CharitySettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            'charity_enabled' => '0',
            'charity_default_amount' => '10',
            'charity_today_total' => '0',
        ];

        foreach ($settings as $key => $value) {
            Setting::firstOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}
