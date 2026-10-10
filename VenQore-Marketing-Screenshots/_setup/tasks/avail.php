<?php
header('Content-Type: text/plain');
$keys = array_keys(App\Reckoner\ReckonerRegistry::all());
$av = app(App\Reckoner\Reckoner::class)->checkAvailability($keys, auth()->user(), App\Models\Tenant::orderBy('id')->first());
echo "available: ".implode(', ', array_keys(array_filter($av)))."\n";
