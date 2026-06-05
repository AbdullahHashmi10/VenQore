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

