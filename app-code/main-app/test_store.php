<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\StoreController;

try {
    $user = User::where('email', 'test@venqore.com')->first();
    Auth::login($user);
    $request = Request::create('/new-store', 'GET');
    app()->instance('request', $request);
    $response = app(StoreController::class)->create($request);
    echo "SUCCESS: " . get_class($response) . PHP_EOL;
} catch (\Throwable $e) {
    echo 'ERROR: ' . $e->getMessage() . PHP_EOL;
    echo $e->getTraceAsString() . PHP_EOL;
}
