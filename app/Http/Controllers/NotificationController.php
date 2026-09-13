<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $notifications = Auth::user()->notifications()->paginate(20);

        return Inertia::render('Notifications/NotificationCenter', [
            'notifications' => $notifications
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllRead()
    {
        Auth::user()->unreadNotifications->markAsRead();
        return back()->with('success', 'All notifications marked as read.');
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead($id)
    {
        $notification = Auth::user()->notifications()->findOrFail($id);
        $notification->markAsRead();
        return back();
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $notification = Auth::user()->notifications()->findOrFail($id);
        $notification->delete();
        return back()->with('success', 'Notification deleted.');
    }

    /**
     * Return summary of unread and critical notifications for AI Island.
     */
    public function summary()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['unread_count' => 0, 'critical_count' => 0, 'latest' => []]);
        }

        $notifications = $user->notifications()->take(10)->get();
        $unreadCount = $user->unreadNotifications()->count();

        $criticalCount = 0;
        $formatted = $notifications->map(function ($n) use (&$criticalCount) {
            $data = is_array($n->data) ? $n->data : (json_decode($n->data, true) ?? []);
            $severity = $data['severity'] ?? ($data['type'] ?? 'info');
            if (!in_array($severity, ['info', 'important', 'critical'])) {
                $severity = 'info';
            }
            if ($severity === 'critical' && is_null($n->read_at)) {
                $criticalCount++;
            }
            return [
                'id'         => $n->id,
                'title'      => $data['title'] ?? 'Notification',
                'message'    => $data['message'] ?? ($data['body'] ?? ''),
                'severity'   => $severity,
                'url'        => $data['url'] ?? ($data['action_url'] ?? null),
                'read_at'    => $n->read_at,
                'created_at' => $n->created_at?->diffForHumans() ?? '',
            ];
        });

        return response()->json([
            'unread_count'   => $unreadCount,
            'critical_count' => $criticalCount,
            'latest'         => $formatted,
        ]);
    }
}
