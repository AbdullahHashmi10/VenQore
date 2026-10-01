<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ActivityLogController extends Controller
{
    public function index()
    {
        $logs = ActivityLog::with('user')
            ->latest()
            ->limit(500)
            ->get();

        return Inertia::render('Admin/Logs', [
            'logs' => $logs
        ]);
    }
}
