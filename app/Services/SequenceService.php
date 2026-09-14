<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Models\Terminal;
use Carbon\Carbon;
use Illuminate\Support\Str;

class SequenceService
{
    /**
     * Generate a unique sequential transaction number.
     * Format: [PREFIX]-[REGISTER/USER]-[DDMMYY]-[SEQUENCE]
     *
     * @param string $prefix E.g., SAL, PUR, SRET, PRET
     * @param string|null $registerId Optional terminal/register ID. Defaults to 'R1' if null.
     * @return string
     */
    public static function generateTransactionNumber(string $prefix, ?string $registerId = null): string
    {
        $tenantId = null;
        if (function_exists('tenant') && tenant('id')) {
            $tenantId = tenant('id');
        }
        if (!$tenantId && app()->bound('current.tenant')) {
            $tenant = app('current.tenant');
            $tenantId = $tenant ? $tenant->id : null;
        }
        if (!$tenantId && auth()->check()) {
            $user = auth()->user();
            $tenantId = $user->last_store_id ?? null;
        }

        // Determine Register ID
        if (!$registerId) {
            // Check if user has an active terminal session, or fallback
            // For now, default to R1 or U{user_id}
            if (auth()->check()) {
                $registerId = 'R1'; // Future: $registerId = auth()->user()->current_terminal_id ?? 'R1';
            } else {
                $registerId = 'SYS'; // System generated
            }
        }

        $dateStr = Carbon::now()->format('dmy'); // DDMMYY

        // Perform the sequence increment within a locked transaction to prevent collisions
        $sequence = DB::transaction(function () use ($tenantId, $prefix, $registerId, $dateStr) {
            $record = DB::table('transaction_sequences')
                ->where('tenant_id', $tenantId)
                ->where('prefix', $prefix)
                ->where('register_id', $registerId)
                ->where('date', $dateStr)
                ->lockForUpdate()
                ->first();

            if ($record) {
                $nextSequence = $record->last_sequence + 1;
                DB::table('transaction_sequences')
                    ->where('id', $record->id)
                    ->update(['last_sequence' => $nextSequence, 'updated_at' => now()]);
            } else {
                $nextSequence = 1;
                DB::table('transaction_sequences')->insert([
                    'tenant_id' => $tenantId,
                    'prefix' => $prefix,
                    'register_id' => $registerId,
                    'date' => $dateStr,
                    'last_sequence' => $nextSequence,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            return $nextSequence;
        });

        // Format sequence to 4 digits (e.g., 0001)
        $formattedSequence = str_pad($sequence, 4, '0', STR_PAD_LEFT);

        return sprintf('%s-%s-%s-%s', $prefix, $registerId, $dateStr, $formattedSequence);
    }
}
