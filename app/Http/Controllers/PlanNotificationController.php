<?php

namespace App\Http\Controllers;

use App\Models\PlanChangeNotification;
use Illuminate\Http\Request;

class PlanNotificationController extends Controller
{
    /** Return plan change notifications for the current tenant (most recent 20) */
    public function unread()
    {
        $tenant = app('current.tenant');

        $notifications = PlanChangeNotification::where('tenant_id', $tenant->id)
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        return response()->json($notifications);
    }

    /** Mark a single notification as read */
    public function markRead(int $id)
    {
        PlanChangeNotification::where('id', $id)
            ->where('tenant_id', app('current.tenant')->id)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }

    /** Mark all as read */
    public function markAllRead()
    {
        PlanChangeNotification::where('tenant_id', app('current.tenant')->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['ok' => true]);
    }
}
