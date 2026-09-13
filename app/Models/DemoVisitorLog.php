<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DemoVisitorLog extends Model
{
    protected $fillable = ['log_date', 'role', 'visit_count'];

    protected $casts = [
        'log_date' => 'date',
    ];

    /**
     * Record a visit for the given role today.
     */
    public static function recordVisit(string $role): void
    {
        static::upsert(
            [
                'log_date'    => now()->toDateString(),
                'role'        => $role,
                'visit_count' => 1,
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            ['log_date', 'role'],
            ['visit_count' => \Illuminate\Support\Facades\DB::raw('visit_count + 1'), 'updated_at' => now()]
        );
    }

    /**
     * Get last N days of visitor data, summed across all roles.
     */
    public static function lastDays(int $days = 30): \Illuminate\Support\Collection
    {
        $start = now()->subDays($days - 1)->toDateString();

        return static::where('log_date', '>=', $start)
            ->selectRaw('log_date, SUM(visit_count) as total')
            ->groupBy('log_date')
            ->orderBy('log_date')
            ->get();
    }

    /**
     * Get role breakdown for the last N days.
     */
    public static function roleBreakdown(int $days = 30): \Illuminate\Support\Collection
    {
        $start = now()->subDays($days - 1)->toDateString();

        return static::where('log_date', '>=', $start)
            ->selectRaw('role, SUM(visit_count) as total')
            ->groupBy('role')
            ->orderByDesc('total')
            ->get();
    }
}
