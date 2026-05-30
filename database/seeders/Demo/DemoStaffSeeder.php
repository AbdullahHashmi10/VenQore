<?php

namespace Database\Seeders\Demo;

use Illuminate\Database\Seeder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoStaffSeeder extends Seeder
{
    public function run($tenantId = null): void
    {
        if (!$tenantId) {
            $this->command?->error("Tenant ID required for DemoStaffSeeder.");
            return;
        }

        $roles = [
            ['email' => 'demo-owner@venqore-demo.internal',            'name' => 'Ahmad Raza',        'role' => 'owner',              'salary' => 0],
            ['email' => 'demo-admin@venqore-demo.internal',            'name' => 'Sara Ahmed',        'role' => 'admin',              'salary' => 65000],
            ['email' => 'demo-manager@venqore-demo.internal',          'name' => 'Bilal Khan',        'role' => 'manager',            'salary' => 55000],
            ['email' => 'demo-cashier@venqore-demo.internal',          'name' => 'Fatima Malik',      'role' => 'cashier',            'salary' => 35000],
            ['email' => 'demo-accountant@venqore-demo.internal',       'name' => 'Usman Tariq',       'role' => 'accountant',         'salary' => 50000],
            ['email' => 'demo-purchasing_officer@venqore-demo.internal','name' => 'Ayesha Siddiqui',  'role' => 'purchasing_officer', 'salary' => 45000],
            ['email' => 'demo-viewer@venqore-demo.internal',           'name' => 'Ali Hassan',        'role' => 'viewer',             'salary' => 30000],
        ];

        // Seed attendance for the last 30 days
        $statusOptions    = ['present', 'present', 'present', 'present', 'absent', 'late'];
        $attendanceCount  = 0;

        foreach ($roles as $roleData) {
            $user = User::where('email', $roleData['email'])->first();
            if (!$user) continue;

            // Update user name to realistic name
            $user->update(['name' => $roleData['name']]);

            // Seed 30 days of attendance
            for ($d = 29; $d >= 0; $d--) {
                $dayCarbon = now()->subDays($d);
                $date      = $dayCarbon->toDateString();

                // No attendance on Sundays
                if ($dayCarbon->dayOfWeek === 0) continue;

                $status = $statusOptions[rand(0, count($statusOptions) - 1)];
                if ($status === 'absent') continue;

                $checkIn  = "$date " . ($status === 'late' ? '09:45:00' : '08:' . rand(55, 59) . ':00');
                $checkOut = "$date 18:" . rand(0, 30) . ":00";

                DB::table('staff_attendances')->insert([
                    'id'         => Str::uuid()->toString(),
                    'tenant_id'  => $tenantId,
                    'user_id'    => $user->id,
                    'check_in'   => $checkIn,
                    'check_out'  => $checkOut,
                    'status'     => 'completed',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $attendanceCount++;
            }
        }

        $this->command?->info("✅ Staff attendance seeded: {$attendanceCount} records over 30 days.");
    }
}
