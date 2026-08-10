<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\StoreController;

try {
    $user = User::where('email', 'business@venqore.com')->first();
    Auth::login($user);
    
    $request = Request::create('/new-store', 'POST', [
        'name' => 'My Business Store ' . rand(100, 999),
        'plan' => 'business',
        'interval' => 'monthly',
        'terms_consent' => true,
    ]);
    
    // Start session to capture validation errors
    $session = app('session')->driver('array');
    $request->setLaravelSession($session);
    app()->instance('request', $request);
    
    $response = app(StoreController::class)->store($request);
    
    if ($response->isRedirection()) {
        echo "REDIRECT: " . $response->getTargetUrl() . "\n";
        $errors = session('errors');
        if ($errors) {
            echo "ERRORS: \n";
            print_r($errors->all());
        } else {
            echo "No validation errors.\n";
        }
    } else {
        echo "Response status: " . $response->getStatusCode() . "\n";
    }
} catch (\Throwable $e) {
    echo 'EXCEPTION: ' . $e->getMessage() . "\n";
}
