<?php

namespace App\Http\Controllers;

use App\Models\StaffAttendance;
use App\Models\StaffActivityGap;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class AttendanceController extends Controller
{
    public function status()
    {
        $user = Auth::user();
        if (!$user)
            return response()->json(['status' => 'offline']);

        $today = Carbon::today();
        $attendance = StaffAttendance::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->whereNull('check_out')
            ->first();

        return response()->json([
            'status' => $attendance ? 'checked_in' : 'checked_out',
            'attendance' => $attendance,
            'check_in_time' => $attendance ? $attendance->check_in->format('H:i') : null,
        ]);
    }

    public function checkIn(Request $request)
    {
        try {
            $user = Auth::user();
            if (!$user) {
                 // Should be caught by middleware, but just in case
                 return response()->json(['success' => false, 'message' => 'User not found'], 401);
            }
            $today = Carbon::today();

            // Check if already checked in
            $existing = StaffAttendance::where('user_id', $user->id)
                ->whereDate('created_at', $today)
                ->whereNull('check_out')
                ->first();

            if ($existing) {
                // Just update last active if already checked in
                $existing->update(['last_active_at' => now()]);
                return response()->json([
                    'success' => true,
                    'attendance' => $existing
                ]);
            }

            $attendance = StaffAttendance::create([
                'user_id' => $user->id,
                'check_in' => now(),
                'last_active_at' => now(),
                'status' => 'present',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Checked in successfully',
                'attendance' => $attendance
            ]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Check-in failed: ' . $e->getMessage());
            return response()->json([
                'success' => false, 
                'message' => 'Check-in failed: ' . $e->getMessage()
            ], 200); // Return 200 to prevent frontend crash loop, but indicate failure in message
        }
    }

    public function heartbeat(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::today();

        $attendance = StaffAttendance::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->whereNull('check_out')
            ->first();

        if ($attendance) {
            $attendance->update(['last_active_at' => now()]);
            return response()->json(['success' => true]);
        }

        return response()->json(['success' => false, 'message' => 'No active session']);
    }

    public function checkOut(Request $request)
    {
        $user = Auth::user();
        $today = Carbon::today();

        $attendance = StaffAttendance::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->whereNull('check_out')
            ->first();

        if (!$attendance) {
            return response()->json(['message' => 'Not checked in'], 400);
        }

        $attendance->update([
            'check_out' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Checked out successfully'
        ]);
    }

    public function logGap(Request $request)
    {
        $request->validate([
            'start_time' => 'required|date',
            'end_time' => 'required|date',
            // reason is optional now as it might be auto-generated
        ]);

        $start = Carbon::parse($request->start_time);
        $end = Carbon::parse($request->end_time);
        $durationMinutes = $start->diffInMinutes($end);

        $user = Auth::user();
        $today = Carbon::today();

        $attendance = StaffAttendance::where('user_id', $user->id)
            ->whereDate('created_at', $today)
            ->whereNull('check_out')
            ->first();

        if ($attendance) {
            StaffActivityGap::create([
                'staff_attendance_id' => $attendance->id,
                'start_time' => $start,
                'end_time' => $end,
                'reason' => $request->reason ?? 'Silent Inactivity (>1hr)',
                'description' => $request->description ?? 'Auto-detected gap',
            ]);

            $attendance->increment('total_gap_minutes', $durationMinutes);
        }

        return response()->json(['success' => true]);
    }
}
