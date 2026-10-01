<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class DiagnoseDashboard extends Command
{
    protected $signature   = 'diagnose:dashboard';
    protected $description = 'Diagnose dashboard Rs 0 issue';

    public function handle()
    {
        $this->info('--- User roles (direct from users table) ---');
        $users = User::all(['id', 'name', 'email', 'role', 'permissions']);
        foreach ($users as $u) {
            $this->line("  name={$u->name}  role={$u->role}  permissions=" . json_encode($u->permissions));
        }
        return 0;
    }
}
