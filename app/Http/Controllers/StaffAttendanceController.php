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
        
        $staff = User::where('role', '!=', 'platform_admin')->get();
        // Or all users if roles are not strictly defined
        if ($staff->isEmpty()) {
            $staff = User::query()->get();
        }

        $attendance = StaffAttendance::whereDate('check_in', $date)->get()
            ->map(function ($record) {
                $record->date = $record->check_in->toDateString();
                return $record;
            });
        
        // Fetch gaps for the selected date
        // Assuming gaps are linked to attendance records on that date
        $gaps = StaffActivityGap::whereHas('attendance', function($q) use ($date) {
            $q->whereDate('check_in', $date);
        })->with('attendance.user')->get();

        // Check if gaps have user_id access helper or we need to map it
        // StaffActivityGap belongsTo StaffAttendance belongsTo User
        // So we can access user via attendance.user
        $gaps = $gaps->map(function($gap) {
            $gap->user_id = $gap->attendance->user_id;
            $gap->user = $gap->attendance->user;
            return $gap;
        });

        return Inertia::render('StaffAttendance/StaffAttendance', [
            'staff' => $staff,
            'attendance' => $attendance,
            'gaps' => $gaps,
            'filters' => [
                'date' => $date
            ]
        ]);
    }

    public function show($id)
    {
        $user = User::findOrFail($id);
        
        // Fetch attendance history for this user
        $attendanceHistory = StaffAttendance::where('user_id', $id)
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
        $gap = StaffActivityGap::findOrFail($id);
        // Ensure status column exists or use meta if not
        $gap->status = 'approved';
        $gap->save();

        return redirect()->back()->with('success', 'Gap approved successfully');
    }

    public function rejectGap($id)
    {
        $gap = StaffActivityGap::findOrFail($id);
        $gap->status = 'rejected';
        $gap->save();

        return redirect()->back()->with('success', 'Gap rejected');
    }
}
