<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

\Illuminate\Support\Facades\Schedule::command('amd:sync-stock')->everyFiveMinutes();
\Illuminate\Support\Facades\Schedule::command('parked-sales:cleanup')->hourly();
\Illuminate\Support\Facades\Schedule::command('staff:generate-daily-summaries')->dailyAt('00:05');
\Illuminate\Support\Facades\Schedule::command('growth:analyze')->dailyAt('09:00');
\Illuminate\Support\Facades\Schedule::command('finance:audit')->hourly();

