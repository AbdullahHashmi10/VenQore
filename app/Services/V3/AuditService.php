<?php

namespace App\Services\V3;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class AuditService
{
    /**
     * Log any significant action to the audit_log table.
     * Called automatically by AccountingService::createEntry()
     * and AccountingService::reverseEntry().
     */
    public function log(
        string  $event,
        string  $modelType,
        string  $modelId,
        ?array  $before = null,
        ?array  $after  = null
    ): void {
        try {
            DB::table('audit_logs')->insert([
                'id'         => Str::uuid()->toString(),
                'event'      => $event,
                'model_type' => $modelType,
                'model_id'   => $modelId,
                'user_id'    => Auth::id() ?? null,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'before'     => $before ? json_encode($before) : null,
                'after'      => $after  ? json_encode($after)  : null,
                'created_at' => now(),
            ]);
        } catch (\Exception $e) {
            // Audit logging should NEVER crash a primary financial transaction
            Log::warning("Audit logging failed: " . $e->getMessage());
        }
    }
}
