<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        try {
            User::updateOrCreate(
                ['email' => 'admin@amd.com'],
                [
                    'name' => 'VenQore Admin',
                    'password' => Hash::make('password'),
                    'passcode' => Hash::make('1234'), // Default passcode
                    'role' => 'admin',
                    'email_verified_at' => now(),
                ]
            );
            $this->command->info('Admin user created successfully.');
        } catch (\Exception $e) {
            $this->command->error('Error creating admin user: ' . $e->getMessage());
        }
    }
}
