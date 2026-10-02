<?php

namespace App\Services\InvoiceAssistant;

use Carbon\Carbon;

/**
 * Recursive allowlist validation of the model's invoice intent (v1).
 *
 * The model proposes intent ONLY. It may not supply database ids, totals or
 * any field outside the schema; anything extra is rejected, not ignored.
 * Quantities are decimal STRINGS. SKU spelling is preserved (trimmed only):
 * punctuation and leading zeros are significant.
 *
 * Returns:
 *   ok          false => structural failure, the output is unusable (-> 502)
 *   unsupported non-null => the model says this is not an invoice request
 *   intent      normalized intent (when ok and not unsupported)
 *   errors      structural problems  [{path, code}]
 *   issues      semantic problems the operator can fix [{field, code, message}]
 */
class InvoiceIntentValidator
{
    private const TOP_KEYS = [
        'schema_version', 'intent', 'customer_reference', 'lines', 'payment',
        'invoice_date', 'due_date', 'notes', 'unsupported_reason', 'clarification',
    ];
    private const LINE_KEYS = ['line_key', 'sku', 'name', 'quantity', 'unit', 'requested_unit_price', 'discount_percent'];
    private const CUSTOMER_KEYS = ['name', 'code'];
    private const PAYMENT_KEYS = ['method', 'amount_paid'];
    private const METHODS = ['credit', 'cash'];

    public function validate(mixed $raw, ?string $today = null): array
    {
        $today = $today ?: now()->toDateString();
        $errors = [];
        $issues = [];

        if (is_string($raw)) {
            $decoded = json_decode(trim($raw), true);
            $raw = json_last_error() === JSON_ERROR_NONE ? $decoded : null;
        }
        if (!is_array($raw) || (array_is_list($raw) && $raw !== [])) {
            return $this->fail([['path' => '', 'code' => 'not_an_object']]);
        }

        foreach (array_keys($raw) as $k) {
            if (!in_array($k, self::TOP_KEYS, true)) {
                $errors[] = ['path' => (string) $k, 'code' => 'unexpected_field'];
            }
        }

        $version = $raw['schema_version'] ?? 1;
        if ((int) $version !== 1) {
            $errors[] = ['path' => 'schema_version', 'code' => 'unsupported_version'];
        }

        $intent = $raw['intent'] ?? null;
        if ($intent === 'unsupported') {
            $reason = $this->text($raw['unsupported_reason'] ?? null, 200) ?? 'This is not a sales invoice request.';

            return ['ok' => true, 'unsupported' => $reason, 'intent' => null, 'errors' => [], 'issues' => []];
        }
        if ($intent !== 'create_sales_invoice') {
            $errors[] = ['path' => 'intent', 'code' => 'unknown_intent'];
        }

        // customer_reference
        $customer = ['name' => null, 'code' => null];
        if (array_key_exists('customer_reference', $raw) && $raw['customer_reference'] !== null) {
            $c = $raw['customer_reference'];
            if (!is_array($c) || array_is_list($c) && $c !== []) {
                $errors[] = ['path' => 'customer_reference', 'code' => 'not_an_object'];
            } else {
                foreach (array_keys($c) as $k) {
                    if (!in_array($k, self::CUSTOMER_KEYS, true)) {
                        $errors[] = ['path' => "customer_reference.{$k}", 'code' => 'unexpected_field'];
                    }
                }
                $customer['name'] = $this->text($c['name'] ?? null, 120);
                $customer['code'] = $this->text($c['code'] ?? null, 64);
            }
        }

        // lines
        $lines = [];
        $max = (int) config('invoice_assistant.max_lines', 50);
        $rawLines = $raw['lines'] ?? [];
        if (!is_array($rawLines) || ($rawLines !== [] && !array_is_list($rawLines))) {
            $errors[] = ['path' => 'lines', 'code' => 'not_a_list'];
            $rawLines = [];
        }
        if (count($rawLines) > $max) {
            $errors[] = ['path' => 'lines', 'code' => 'too_many_lines'];
            $rawLines = array_slice($rawLines, 0, $max);
        }

        $usedKeys = [];
        foreach ($rawLines as $i => $line) {
            $path = "lines.{$i}";
            if (!is_array($line) || array_is_list($line) && $line !== []) {
                $errors[] = ['path' => $path, 'code' => 'not_an_object'];
                continue;
            }
            foreach (array_keys($line) as $k) {
                if (!in_array($k, self::LINE_KEYS, true)) {
                    $errors[] = ['path' => "{$path}.{$k}", 'code' => 'unexpected_field'];
                }
            }

            $key = $line['line_key'] ?? null;
            if ($key === null || $key === '') {
                $key = 'l' . ($i + 1);
            }
            if (!is_string($key) || !preg_match('/^l\d{1,3}$/', $key)) {
                $errors[] = ['path' => "{$path}.line_key", 'code' => 'bad_line_key'];
                $key = 'l' . ($i + 1);
            }
            if (isset($usedKeys[$key])) {
                $errors[] = ['path' => "{$path}.line_key", 'code' => 'duplicate_line_key'];
                continue;
            }
            $usedKeys[$key] = true;

            $sku  = $this->sku($line['sku'] ?? null, "{$path}.sku", $errors);
            $name = $this->text($line['name'] ?? null, 120);
            if ($sku === null && $name === null) {
                $errors[] = ['path' => $path, 'code' => 'line_without_item'];
                continue;
            }

            $qty = null;
            if (array_key_exists('quantity', $line) && $line['quantity'] !== null && $line['quantity'] !== '') {
                $qty = $this->decimal($line['quantity'], 4);
                $maxQty = (float) config('invoice_assistant.max_quantity', 1000000);
                if ($qty === null || (float) $qty <= 0 || (float) $qty > $maxQty) {
                    $errors[] = ['path' => "{$path}.quantity", 'code' => 'bad_quantity'];
                    $qty = null;
                }
            }

            $price = null;
            if (array_key_exists('requested_unit_price', $line) && $line['requested_unit_price'] !== null && $line['requested_unit_price'] !== '') {
                $price = $this->decimal($line['requested_unit_price'], 4);
                if ($price === null || (float) $price < 0 || (float) $price > 1e12) {
                    $errors[] = ['path' => "{$path}.requested_unit_price", 'code' => 'bad_price'];
                    $price = null;
                }
            }

            $disc = null;
            if (array_key_exists('discount_percent', $line) && $line['discount_percent'] !== null && $line['discount_percent'] !== '') {
                $disc = $this->decimal($line['discount_percent'], 2);
                if ($disc === null || (float) $disc < 0 || (float) $disc > 100) {
                    $errors[] = ['path' => "{$path}.discount_percent", 'code' => 'bad_discount'];
                    $disc = null;
                }
            }

            $lines[] = [
                'line_key'             => $key,
                'sku'                  => $sku,
                'name'                 => $name,
                'quantity'             => $qty,
                'unit'                 => $this->text($line['unit'] ?? null, 32),
                'requested_unit_price' => $price,
                'discount_percent'     => $disc,
            ];
        }

        // payment
        $payment = ['method' => null, 'amount_paid' => null];
        if (array_key_exists('payment', $raw) && $raw['payment'] !== null) {
            $p = $raw['payment'];
            if (!is_array($p) || array_is_list($p) && $p !== []) {
                $errors[] = ['path' => 'payment', 'code' => 'not_an_object'];
            } else {
                foreach (array_keys($p) as $k) {
                    if (!in_array($k, self::PAYMENT_KEYS, true)) {
                        $errors[] = ['path' => "payment.{$k}", 'code' => 'unexpected_field'];
                    }
                }
                $method = $p['method'] ?? null;
                if ($method !== null && !in_array($method, self::METHODS, true)) {
                    $errors[] = ['path' => 'payment.method', 'code' => 'bad_payment_method'];
                    $method = null;
                }
                $paid = null;
                if (array_key_exists('amount_paid', $p) && $p['amount_paid'] !== null && $p['amount_paid'] !== '') {
                    $paid = $this->decimal($p['amount_paid'], 2);
                    if ($paid === null || (float) $paid < 0) {
                        $errors[] = ['path' => 'payment.amount_paid', 'code' => 'bad_amount_paid'];
                        $paid = null;
                    }
                }
                $payment = ['method' => $method, 'amount_paid' => $paid];
            }
        }

        // dates
        $invoiceDate = $this->date($raw['invoice_date'] ?? null, 'invoice_date', $errors);
        $dueDate     = $this->date($raw['due_date'] ?? null, 'due_date', $errors);
        if ($invoiceDate && $invoiceDate > $today) {
            $issues[] = ['field' => 'invoice_date', 'code' => 'invoice_date_future',
                'message' => 'An invoice cannot be dated in the future. Which date should it carry?'];
            $invoiceDate = null;
        }
        if ($invoiceDate && $dueDate && $dueDate < $invoiceDate) {
            $issues[] = ['field' => 'due_date', 'code' => 'due_before_invoice',
                'message' => 'The due date is before the invoice date. What should the due date be?'];
            $dueDate = null;
        } elseif (!$invoiceDate && $dueDate && $dueDate < $today && ($raw['invoice_date'] ?? null) === null) {
            $issues[] = ['field' => 'due_date', 'code' => 'due_in_past',
                'message' => 'That due date has already passed. Which due date do you want?'];
            $dueDate = null;
        }

        // notes
        $notes = $this->text($raw['notes'] ?? null, (int) config('invoice_assistant.max_notes_chars', 500), true);

        // clarification (model flags an ambiguous edit)
        $clar = null;
        if (isset($raw['clarification']) && is_array($raw['clarification'])) {
            $q = $this->text($raw['clarification']['question'] ?? null, 240);
            $lk = $raw['clarification']['line_key'] ?? null;
            if ($q) {
                $clar = ['question' => $q, 'line_key' => is_string($lk) && preg_match('/^l\d{1,3}$/', $lk) ? $lk : null];
            }
        }

        if ($errors) {
            return $this->fail($errors);
        }

        return [
            'ok'          => true,
            'unsupported' => null,
            'errors'      => [],
            'issues'      => $issues,
            'intent'      => [
                'schema_version'     => 1,
                'intent'             => 'create_sales_invoice',
                'customer_reference' => $customer,
                'lines'              => $lines,
                'payment'            => $payment,
                'invoice_date'       => $invoiceDate,
                'due_date'           => $dueDate,
                'notes'              => $notes,
                'clarification'      => $clar,
            ],
        ];
    }

    private function fail(array $errors): array
    {
        return ['ok' => false, 'unsupported' => null, 'intent' => null, 'errors' => $errors, 'issues' => []];
    }

    /** Trimmed, control-character-free, length-bounded string. Null when empty/not scalar text. */
    private function text(mixed $v, int $max, bool $keepNewlines = false): ?string
    {
        if (!is_string($v) && !is_int($v) && !is_float($v)) {
            return null;
        }
        $s = (string) $v;
        $s = $keepNewlines
            ? preg_replace('/[^\P{C}\n]+/u', '', $s)
            : preg_replace('/\p{C}+/u', ' ', $s);
        $s = trim((string) $s);
        if ($s === '') {
            return null;
        }

        return mb_substr($s, 0, $max);
    }

    /** SKU: trim only. Punctuation and leading zeros are significant. */
    private function sku(mixed $v, string $path, array &$errors): ?string
    {
        if ($v === null || $v === '') {
            return null;
        }
        if (!is_string($v) && !is_int($v)) {
            $errors[] = ['path' => $path, 'code' => 'bad_sku'];

            return null;
        }
        $s = trim((string) $v);
        if ($s === '') {
            return null;
        }
        if (mb_strlen($s) > 64 || preg_match('/\p{C}/u', $s)) {
            $errors[] = ['path' => $path, 'code' => 'bad_sku'];

            return null;
        }

        return $s;
    }

    /**
     * Decimal string with at most $scale fraction digits. Rejects exponents,
     * NaN/INF, signs and thousands separators. Returns the canonical string.
     */
    public function decimal(mixed $v, int $scale): ?string
    {
        if (is_int($v)) {
            $v = (string) $v;
        } elseif (is_float($v)) {
            if (!is_finite($v)) {
                return null;
            }
            $v = rtrim(rtrim(number_format($v, $scale + 2, '.', ''), '0'), '.');
        }
        if (!is_string($v)) {
            return null;
        }
        $v = trim($v);
        if (!preg_match('/^\d{1,15}(?:\.\d+)?$/', $v)) {
            return null;
        }
        [$int, $frac] = array_pad(explode('.', $v, 2), 2, '');
        $frac = rtrim($frac, '0');
        if (strlen($frac) > $scale) {
            return null;
        }
        $int = ltrim($int, '0');
        $int = $int === '' ? '0' : $int;

        return $frac === '' ? $int : "{$int}.{$frac}";
    }

    private function date(mixed $v, string $path, array &$errors): ?string
    {
        if ($v === null || $v === '') {
            return null;
        }
        if (!is_string($v)) {
            $errors[] = ['path' => $path, 'code' => 'bad_date'];

            return null;
        }
        try {
            $d = Carbon::createFromFormat('!Y-m-d', trim($v));
            if ($d && $d->format('Y-m-d') === trim($v) && $d->year >= 2000 && $d->year <= 2100) {
                return $d->format('Y-m-d');
            }
        } catch (\Throwable) {
            // fall through
        }
        $errors[] = ['path' => $path, 'code' => 'bad_date'];

        return null;
    }
}
