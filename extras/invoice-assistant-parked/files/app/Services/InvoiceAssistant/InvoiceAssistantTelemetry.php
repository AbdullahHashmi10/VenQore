<?php

namespace App\Services\InvoiceAssistant;

use Illuminate\Support\Facades\Log;

/**
 * Structured, content-free events for the invoice assistant.
 *
 * Only an ALLOWLIST of keys is ever written: ids, counts, durations, reasons,
 * provider/model and cost. Transcripts, prompts, customer or product text,
 * audio, PINs and keys can never reach the log through this class.
 *
 * Events: draft_created, intent_failed, clarification_required, draft_resolved,
 * draft_handed_off, transcription_started/completed/failed, invoice_posted,
 * invoice_pending_approval, duplicate_recovered.
 */
class InvoiceAssistantTelemetry
{
    private const ALLOWED = [
        'request_id', 'draft_id', 'revision', 'tenant_id', 'user_id', 'stage',
        'duration_ms', 'reason', 'provider', 'model', 'cost_usd', 'lines',
        'unresolved', 'input_mode', 'status', 'bytes', 'duration_s', 'outcome',
    ];

    public static function event(string $name, array $context = []): void
    {
        try {
            $safe = array_intersect_key($context, array_flip(self::ALLOWED));
            Log::info('invoice_assistant.' . $name, $safe);
        } catch (\Throwable) {
            // Telemetry must never break an invoice.
        }
    }
}
