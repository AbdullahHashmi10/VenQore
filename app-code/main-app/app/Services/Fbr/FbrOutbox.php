<?php

namespace App\Services\Fbr;

use App\Models\Sale;
use App\Models\Tenant;
use App\Services\FbrService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * FBR outbox: report each sale to FBR AFTER its transaction commits, and keep
 * trying until FBR has it.
 *
 *  enqueue()  — inside the sale's transaction: one row per sale (idempotent).
 *  deliver()  — after commit: claim the row atomically, call FBR with no
 *               database transaction open, record the result.
 *  due()      — what `fbr:flush-outbox` retries.
 *
 * A claim is one UPDATE … WHERE status IN (pending, failed) AND due, so two
 * workers (the till's request and the scheduler) can never send the same row
 * at the same time. A row left in `sending` for more than STALE_MINUTES (the
 * process died mid-call) is retried; FBR may then have received it twice, so
 * the row records every attempt.
 */
class FbrOutbox
{
    public const MAX_ATTEMPTS  = 8;
    public const STALE_MINUTES = 5;
    /** minutes to wait after attempt n (1-based) */
    private const BACKOFF = [1, 5, 15, 30, 60, 120, 240, 480];

    public static function available(): bool
    {
        return Schema::hasTable('fbr_outbox');
    }

    /** Queue the sale's report. Call inside the sale's transaction. */
    public static function enqueue(Sale $sale): void
    {
        if (! self::available()) {
            return;
        }
        DB::table('fbr_outbox')->insertOrIgnore([
            'id'              => (string) Str::uuid(),
            'tenant_id'       => $sale->tenant_id,
            'sale_id'         => $sale->id,
            'status'          => 'pending',
            'attempts'        => 0,
            'next_attempt_at' => now(),
            'created_at'      => now(),
            'updated_at'      => now(),
        ]);
    }

    /**
     * Send one sale's report if it is due and nobody else is sending it.
     * Never call inside a transaction. Returns the row's status afterwards,
     * or null when there was nothing to send.
     */
    public static function deliverForSale(string $saleId): ?string
    {
        if (! self::available()) {
            return null;
        }
        $id = DB::table('fbr_outbox')->where('sale_id', $saleId)->value('id');
        return $id ? self::deliver($id) : null;
    }

    public static function deliver(string $outboxId): ?string
    {
        // Atomic claim (no transaction is held while FBR is called).
        $claimed = DB::table('fbr_outbox')
            ->where('id', $outboxId)
            ->where(function ($q) {
                $q->where(function ($q) {
                    $q->whereIn('status', ['pending', 'failed'])
                      ->where(fn ($q) => $q->whereNull('next_attempt_at')->orWhere('next_attempt_at', '<=', now()));
                })->orWhere(function ($q) {
                    $q->where('status', 'sending')->where('claimed_at', '<', now()->subMinutes(self::STALE_MINUTES));
                });
            })
            ->update(['status' => 'sending', 'claimed_at' => now(), 'attempts' => DB::raw('attempts + 1'), 'updated_at' => now()]);
        if ($claimed !== 1) {
            return null;
        }

        $row = DB::table('fbr_outbox')->where('id', $outboxId)->first();
        $tenant = Tenant::find($row->tenant_id);
        $previous = app()->bound('current.tenant') ? app('current.tenant') : null;
        app()->instance('current.tenant', $tenant);

        try {
            $sale = Sale::withoutGlobalScopes()->where('tenant_id', $row->tenant_id)->with(['items.product', 'customer'])->find($row->sale_id);
            if (! $sale) {
                return self::finish($row, 'dead', 'no_sale', 'The sale no longer exists.');
            }
            if ($sale->is_fbr_reported && $sale->fbr_invoice_number) {
                return self::finish($row, 'sent', '100', null, $sale->fbr_invoice_number);
            }

            // Built here, inside the sale's store, so it reads THIS store's
            // FBR settings (the controller-injected instance was built before
            // the store was known).
            $res = (new FbrService())->reportSale($sale);
            $code = (string) ($res['Code'] ?? '');

            if ($code === '100' && ! empty($res['InvoiceNumber'])) {
                Sale::withoutGlobalScopes()->where('id', $sale->id)->update([
                    'fbr_invoice_number' => $res['InvoiceNumber'],
                    'fbr_qr_data'        => $res['QRData'] ?? null,
                    'is_fbr_reported'    => true,
                ]);
                return self::finish($row, 'sent', $code, null, $res['InvoiceNumber']);
            }

            // A 4xx answer is FBR refusing this invoice: it needs a person,
            // and sending it again unchanged would only be refused again.
            // Everything else is retried: no answer, 5xx, timeouts, rate
            // limits, and credentials (0 = missing settings, 401/403 = token)
            // that the owner can fix while the report waits.
            $numeric = (int) $code;
            $rejected = $numeric >= 400 && $numeric < 500 && ! in_array($numeric, [401, 403, 408, 429], true);
            if ($rejected) {
                return self::finish($row, 'rejected', $code, (string) ($res['Response'] ?? 'Rejected by FBR'));
            }

            return self::retryLater($row, $code, (string) ($res['Response'] ?? 'FBR could not be reached'));
        } catch (\Throwable $e) {
            return self::retryLater($row, 'exception', $e->getMessage());
        } finally {
            if ($previous) {
                app()->instance('current.tenant', $previous);
            } else {
                app()->forgetInstance('current.tenant');
            }
        }
    }

    /** Rows the scheduler should try now. */
    public static function due(?int $tenantId = null, int $limit = 100)
    {
        return DB::table('fbr_outbox')
            ->when($tenantId, fn ($q, $t) => $q->where('tenant_id', $t))
            ->where(function ($q) {
                $q->where(function ($q) {
                    $q->whereIn('status', ['pending', 'failed'])
                      ->where(fn ($q) => $q->whereNull('next_attempt_at')->orWhere('next_attempt_at', '<=', now()));
                })->orWhere(function ($q) {
                    $q->where('status', 'sending')->where('claimed_at', '<', now()->subMinutes(self::STALE_MINUTES));
                });
            })
            ->orderBy('created_at')
            ->limit($limit)
            ->pluck('id');
    }

    private static function retryLater(object $row, string $code, string $error): string
    {
        $attempts = (int) $row->attempts;
        if ($attempts >= self::MAX_ATTEMPTS) {
            return self::finish($row, 'dead', $code, $error);
        }
        $wait = self::BACKOFF[min($attempts, count(self::BACKOFF)) - 1] ?? end(self::BACKOFF);
        DB::table('fbr_outbox')->where('id', $row->id)->update([
            'status' => 'failed', 'last_code' => substr($code, 0, 16), 'last_error' => mb_substr($error, 0, 2000),
            'next_attempt_at' => now()->addMinutes($wait), 'claimed_at' => null, 'updated_at' => now(),
        ]);
        \App\Support\SaleEvents::record('fbr_report_deferred', ['sale_id' => $row->sale_id, 'attempt' => $attempts, 'code' => $code, 'retry_in_minutes' => $wait], 'warning');
        return 'failed';
    }

    private static function finish(object $row, string $status, string $code, ?string $error, ?string $invoice = null): string
    {
        DB::table('fbr_outbox')->where('id', $row->id)->update([
            'status' => $status, 'last_code' => substr($code, 0, 16), 'last_error' => $error !== null ? mb_substr($error, 0, 2000) : null,
            'fbr_invoice_number' => $invoice, 'sent_at' => $status === 'sent' ? now() : null,
            'next_attempt_at' => null, 'claimed_at' => null, 'updated_at' => now(),
        ]);
        if ($status !== 'sent') {
            \App\Support\SaleEvents::record('fbr_report_' . $status, ['sale_id' => $row->sale_id, 'attempts' => (int) $row->attempts, 'code' => $code, 'error' => $error], 'error');
        }
        return $status;
    }
}
