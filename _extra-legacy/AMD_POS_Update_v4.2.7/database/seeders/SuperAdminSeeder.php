<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Remove the legacy 'God Admin' if it exists
        User::where('email', 'god@venqore.com')->delete();
        User::where('email', 'admin@amd.com')->delete();

        // Create the official Platform Administrator
        User::updateOrCreate(
            ['email' => 'platform@venqore.com'],
            [
                'name' => 'Platform Administrator',
                'password' => Hash::make('admin1234'),
                'is_platform_admin' => true,
                'email_verified_at' => now(),
            ]
        );

        $this->command->info('Platform Administrator created: platform@venqore.com / admin1234');
    }
}
