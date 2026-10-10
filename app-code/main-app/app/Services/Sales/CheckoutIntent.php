<?php

namespace App\Services\Sales;

use App\Models\Sale;
use App\Support\Money;
use Illuminate\Support\Facades\Schema;

/**
 * Checkout identity helpers: the business-payload hash bound to an
 * idempotency key, the canonical response a replay or status lookup returns,
 * and writing the intent columns only when the migration has run (so a code
 * rollout ahead of the migration cannot break checkout).
 */
final class CheckoutIntent
{
    /**
     * Fields that define WHAT was sold and HOW it was paid. Deliberately left
     * out: credentials/approval secrets (approval_pin, approved_by — an approval
     * is authorization, not content), and server-derived or volatile fields
     * (register_shift_id, register_id, source, order_taker_id, idempotency_key).
     */
    private const BUSINESS_FIELDS = [
        'items', 'customer_id', 'walk_in_name', 'payments', 'payment_method', 'amount_paid',
        'discount', 'tax_rate', 'tax_inclusive', 'tax_exempt', 'delivery_charge',
        'extra_charge_value', 'service_charge', 'tip_amount', 'add_to_ledger',
        'expected_total', 'bill_rounding', 'sale_date', 'date', 'warehouse_id',
        'occupancy_id', 'order_type', 'deliver_later', 'is_dropship', 'payment_account_id',
        'bank_account_id', 'calculation_version',
        // What was physically handed over and when the sale happened are part of
        // the sale: a resend that changes them is different content (409).
        'tendered_amount', 'cash_tendered', 'change_return', 'occurred_at',
        // V3 engine / online-order / sales-order / recurring payloads.
        'party_id', 'amount_received', 'advance_amount', 'source_order_id', 'sale_uom',
    ];

    private static ?bool $hasColumns = null;

    public static function requestHash(array $payload): string
    {
        $business = [];
        foreach (self::BUSINESS_FIELDS as $f) {
            if (array_key_exists($f, $payload)) {
                $business[$f] = $payload[$f];
            }
        }
        return hash('sha256', json_encode(self::canonical($business), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    }

    /** Sort keys recursively and render scalars as strings so 100 and "100" hash alike. */
    private static function canonical(mixed $v): mixed
    {
        if (is_array($v)) {
            if (!array_is_list($v)) {
                ksort($v);
            }
            return array_map([self::class, 'canonical'], $v);
        }
        if (is_bool($v)) {
            return $v ? '1' : '0';
        }
        if (is_float($v)) {
            return rtrim(rtrim(number_format($v, 6, '.', ''), '0'), '.');
        }
        if ($v === null) {
            return '';
        }
        if (is_string($v) && is_numeric($v) && str_contains($v, '.')) {
            return rtrim(rtrim($v, '0'), '.');
        }
        return (string) $v;
    }

    /** Max clock skew tolerated for a till timestamp in the future. */
    private const FUTURE_SKEW_SECONDS = 300;

    /** The till's occurrence time, parsed (null when missing or unparseable). */
    public static function occurredAt(mixed $value): ?\Carbon\Carbon
    {
        if (!$value || !is_string($value)) {
            return null;
        }
        try {
            return \Carbon\Carbon::parse($value)->setTimezone(config('app.timezone'));
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Accounting time for a till sale: when it was rung. A timestamp in the
     * future beyond a small skew means the device clock is wrong — then the
     * server time is used and the event recorded (the original value is still
     * stored in sales.occurred_at for review).
     */
    public static function accountingTimeFrom(mixed $value): ?\Carbon\Carbon
    {
        $at = self::occurredAt($value);
        if (!$at) {
            return null;
        }
        if ($at->greaterThan(now()->addSeconds(self::FUTURE_SKEW_SECONDS))) {
            \App\Support\SaleEvents::record('occurred_at_in_future', ['occurred_at' => (string) $value], 'warning');
            return null;
        }
        return $at->lessThan(now()) ? $at : now();
    }

    public static function intentColumnsAvailable(): bool
    {
        if (self::$hasColumns === null) {
            try {
                self::$hasColumns = Schema::hasColumn('sales', 'idempotency_request_hash')
                    && Schema::hasColumn('sales', 'calculation_version')
                    && Schema::hasColumn('sales', 'occurred_at');
            } catch (\Throwable) {
                self::$hasColumns = false;
            }
        }
        return self::$hasColumns;
    }

    private static ?bool $hasLineColumns = null;

    public static function lineColumnsAvailable(): bool
    {
        if (self::$hasLineColumns === null) {
            try {
                self::$hasLineColumns = Schema::hasColumn('sale_items', 'revenue_amount')
                    && Schema::hasColumn('sale_items', 'bill_discount_share');
            } catch (\Throwable) {
                self::$hasLineColumns = false;
            }
        }
        return self::$hasLineColumns;
    }

    /** sale_items attributes plus the booked-amount columns when they exist. */
    public static function withLineColumns(array $attributes, array $lineColumns): array
    {
        return self::lineColumnsAvailable() ? $attributes + $lineColumns : $attributes;
    }

    /** For tests that run migrations mid-process. */
    public static function forgetSchemaCache(): void
    {
        self::$hasColumns = null;
        self::$hasLineColumns = null;
    }

    public static function withIntentColumns(array $attributes, array $intentColumns): array
    {
        return self::intentColumnsAvailable() ? $attributes + $intentColumns : $attributes;
    }

    /** What every success, replay and status lookup returns for a committed sale. */
    public static function canonicalResponse(Sale $sale, array $extra = []): array
    {
        $total = (float) ($sale->invoice_total ?? $sale->total ?? 0);
        return array_merge([
            'success'             => true,
            'outcome'             => 'committed',
            'sale_id'             => $sale->id,
            'reference'           => $sale->reference_number,
            'idempotency_key'     => $sale->idempotency_key,
            'invoice_total'       => Money::toString((int) round($total * 100)),
            'payment_status'      => $sale->payment_status,
            'tendered_amount'     => $sale->tendered_amount !== null ? Money::toString((int) round(((float) $sale->tendered_amount) * 100)) : null,
            'change_return'       => $sale->change_return !== null ? Money::toString((int) round(((float) $sale->change_return) * 100)) : null,
            'calculation_version' => $sale->getAttribute('calculation_version'),
            'created_at'          => optional($sale->created_at)->toIso8601String(),
        ], $extra);
    }
}
