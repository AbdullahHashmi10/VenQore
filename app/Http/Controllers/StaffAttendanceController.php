<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\StaffAttendance;
use App\Models\StaffActivityGap;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class StaffAttendanceController extends Controller
{
    public function index(Request $request)
    {
        $date = $request->input('date', now()->toDateString());
        
        $tenant = app('current.tenant');
        $staff = \App\Models\TenantUser::where('tenant_id', $tenant->id)
            ->where('status', 'active')
            ->with('user')
            ->get()
            ->map(function ($member) {
                $user = $member->user;
                if ($user) {
                    $user->role = $member->role;
                }
                return $user;
            })
            ->filter()
            ->values();

        $attendance = StaffAttendance::where('tenant_id', $tenant->id)
            ->whereDate('check_in', $date)
            ->get()
            ->map(function ($record) {
                $record->date = $record->check_in instanceof \Carbon\Carbon 
                    ? $record->check_in->toDateString() 
                    : ($record->check_in ? \Carbon\Carbon::parse($record->check_in)->toDateString() : null);
                return $record;
            });
        
        // Fetch gaps for the selected date
        // Assuming gaps are linked to attendance records on that date
        $gaps = StaffActivityGap::where('tenant_id', $tenant->id)
            ->whereHas('attendance', function($q) use ($date, $tenant) {
                $q->where('tenant_id', $tenant->id)->whereDate('check_in', $date);
            })->with('attendance.user')->get();

        // Check if gaps have user_id access helper or we need to map it
        // StaffActivityGap belongsTo StaffAttendance belongsTo User
        // So we can access user via attendance.user
        $gaps = $gaps->map(function($gap) {
            $gap->user_id = $gap->attendance?->user_id;
            $gap->user = $gap->attendance?->user;
            return $gap;
        })->filter(fn($gap) => $gap->user_id !== null);


        // Fetch terminal activity logs for the selected date
        $terminalActivities = \App\Models\TerminalActivity::where('tenant_id', $tenant->id)
            ->whereDate('away_at', $date)
            ->with('terminal')
            ->orderBy('away_at', 'desc')
            ->get();

        return Inertia::render('StaffAttendance/StaffAttendance', [
            'staff' => $staff,
            'attendance' => $attendance,
            'gaps' => $gaps,
            'terminalActivities' => $terminalActivities,
            'filters' => [
                'date' => $date
            ]
        ]);
    }

    public function show($id)
    {
        $tenant = app('current.tenant');
        
        // Verify user belongs to current tenant
        \App\Models\TenantUser::where('tenant_id', $tenant->id)
            ->where('user_id', $id)
            ->firstOrFail();

        $user = User::findOrFail($id);
        
        // Fetch attendance history for this user
        $attendanceHistory = StaffAttendance::where('tenant_id', $tenant->id)
            ->where('user_id', $id)
            ->with(['gaps'])
            ->orderBy('check_in', 'desc')
            ->paginate(30);

        return Inertia::render('StaffAttendance/Show', [
            'staffMember' => $user,
            'attendanceHistory' => $attendanceHistory
        ]);
    }

    public function approveGap($id)
    {
        $tenant = app('current.tenant');
        $gap = StaffActivityGap::where('tenant_id', $tenant->id)->findOrFail($id);
        // Ensure status column exists or use meta if not
        $gap->status = 'approved';
        $gap->save();

        return redirect()->back()->with('success', 'Gap approved successfully');
    }

    public function rejectGap($id)
    {
        $tenant = app('current.tenant');
        $gap = StaffActivityGap::where('tenant_id', $tenant->id)->findOrFail($id);
        $gap->status = 'rejected';
        $gap->save();

        return redirect()->back()->with('success', 'Gap rejected');
    }
}
