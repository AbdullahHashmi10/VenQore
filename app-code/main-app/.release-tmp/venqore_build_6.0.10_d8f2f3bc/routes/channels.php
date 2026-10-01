<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('agent.inbox.{tenantId}', function ($user, $tenantId) {
    if ($user->is_platform_admin || $user->isPlatformStaff()) {
        return true;
    }
    return $user->memberships()
        ->where('tenant_id', (int) $tenantId)
        ->where('status', 'active')
        ->exists();
});

Broadcast::channel('agent.inbox.global', function ($user) {
    return (bool) $user->is_platform_admin || $user->isPlatformStaff();
});

Broadcast::channel('private-store.{storeId}.terminal', function ($user, $storeId) {
    \Illuminate\Support\Facades\Log::info('Channel callback private-store.{storeId}.terminal called', [
        'user' => $user->id,
        'storeId' => $storeId,
        'is_platform_admin' => $user->is_platform_admin,
        'is_platform_staff' => $user->isPlatformStaff(),
    ]);
    if ($user->is_platform_admin || $user->isPlatformStaff()) {
        return true;
    }
    return $user->memberships()
        ->where('tenant_id', (int) $storeId)
        ->where('status', 'active')
        ->exists();
});

use Illuminate\Support\Facades\Route;
Route::post('/broadcasting/auth', [\App\Http\Controllers\BroadcastingController::class, 'authenticate']);



