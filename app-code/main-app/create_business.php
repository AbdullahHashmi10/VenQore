<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use App\Http\Controllers\StoreController;
use Illuminate\Support\Facades\Hash;

try {
    $user = User::firstOrCreate(
        ['email' => 'business@venqore.com'],
        ['name' => 'Business User', 'password' => Hash::make('password123')]
    );
    
    Auth::login($user);
    
    // Simulate store creation request
    $request = Request::create('/new-store', 'POST', [
        'name' => 'My Business Store ' . rand(100, 999),
        'plan' => 'business',
        'interval' => 'monthly',
        'terms_consent' => true,
    ]);
    app()->instance('request', $request);
    
    $response = app(StoreController::class)->store($request);
    
    echo "Store creation triggered.\n";
    echo "Response status: " . $response->getStatusCode() . "\n";
    echo "Login Email: business@venqore.com\n";
    echo "Login Password: password123\n";
    
} catch (\Throwable $e) {
    echo 'ERROR: ' . $e->getMessage() . PHP_EOL;
    echo $e->getTraceAsString() . PHP_EOL;
}
