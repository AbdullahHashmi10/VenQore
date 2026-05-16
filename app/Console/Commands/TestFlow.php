<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class TestFlow extends Command
{
    protected $signature = 'test:flow';
    public function handle()
    {
        require base_path('test_flow.php');
    }
}
