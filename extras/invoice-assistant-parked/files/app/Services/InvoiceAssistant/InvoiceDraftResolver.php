<?php

namespace App\Services\InvoiceAssistant;

use App\Helpers\SettingsHelper;

/**
 * Turns a validated intent + the operator's choices into a resolved draft.
 *
 * Pure with respect to the draft row: it reads the store's own records (always
 * scoped to $tenantId) and returns data; it writes nothing and calls no model.
 * That is what lets it run again at handoff and at claim to re-validate
 * entities, prices and permissions that may have changed since review.
 *
 * Output:
 *   resolved   customer, lines, lines_pending, payment, dates, notes, warehouse,
 *              totals_preview, defaults_applied, warnings
 *   unresolved clarification objects {field, line_key?, reason, question,
 *              candidates[{id,label,secondary_label}], candidate_set_id}
 *   can_handoff true only when nothing is unresolved and every requested line resolved
 */
class InvoiceDraftResolver
{
    public function __construct(
        private int|string $tenantId,
        private string $draftId = '',
    ) {}

    public function resolve(array $intent, array $choices = [], bool $voice = false): array
    {
        $customers = new CustomerResolver($this->tenantId);
        $products  = new ProductResolver($this->tenantId);
        $pricing   = new DraftPricingResolver($this->tenantId);

        $unresolved = [];
        $warnings = [];
        $defaults = [];
        $resolvedLines = [];
        $pending = [];

        // ── customer ───────────────────────────────────────────────────────
        $customer = null;
        $cr = $customers->resolve($intent['customer_reference'] ?? [], $choices['customer'] ?? null);
        $partyModel = $cr['party'];
        if ($cr['status'] === 'resolved') {
            $customer = [
                'id' => (string) $partyModel->id,
                'name' => (string) $partyModel->name,
                'match_basis' => $cr['basis'],
            ];
        } elseif ($cr['status'] === 'missing') {
            $unresolved[] = $this->clar('customer', null, 'customer_missing', 'Which customer is this invoice for?', []);
        } elseif ($cr['status'] === 'ambiguous') {
            $label = $intent['customer_reference']['name'] ?? ($intent['customer_reference']['code'] ?? 'that customer');
            $unresolved[] = $this->clar('customer', null, 'ambiguous_customer', "More than one customer matches “{$label}”. Which one?", $cr['candidates']);
        } else {
            $label = $intent['customer_reference']['name'] ?? ($intent['customer_reference']['code'] ?? 'that customer');
            $q = $cr['candidates']
                ? "I couldn't find a customer called “{$label}”. Pick one of these, or tell me the exact name."
                : "I couldn't find a customer called “{$label}”. Tell me the exact name, or add the customer first.";
            $unresolved[] = $this->clar('customer', null, 'customer_not_found', $q, $cr['candidates']);
        }

        // ── lines ──────────────────────────────────────────────────────────
        $lines = $intent['lines'] ?? [];
        if (!$lines) {
            $unresolved[] = $this->clar('lines', null, 'no_lines', 'What should be on the invoice? Name the items and quantities.', []);
        }

        $needsStockWarehouse = false;
        foreach ($lines as $line) {
            $key = $line['line_key'];
            $lc  = $choices['lines'][$key] ?? [];
            $shown = $line['sku'] ?? $line['name'] ?? $key;

            $pr = $products->resolve($line, $lc['item'] ?? null, $voice);
            $lineOk = true;

            if ($pr['status'] === 'suggested') {
                $c = $pr['candidates'][0] ?? null;
                $unresolved[] = $this->clar('product', $key, 'confirm_sku',
                    'I heard “' . $shown . '”. Did you mean ' . ($c['label'] ?? 'this item') . ' (' . ($c['secondary_label'] ?? '') . ')?',
                    $pr['candidates']);
                $lineOk = false;
            } elseif ($pr['status'] === 'ambiguous') {
                $reason = $pr['basis'] === 'variant_required' ? 'variant_required' : 'ambiguous_product';
                $q = $reason === 'variant_required'
                    ? "“{$shown}” comes in several variants. Which one?"
                    : "More than one item matches “{$shown}”. Which one?";
                $unresolved[] = $this->clar('product', $key, $reason, $q, $pr['candidates']);
                $lineOk = false;
            } elseif ($pr['status'] === 'not_found') {
                $q = $pr['candidates']
                    ? "No item has the SKU “{$shown}”. Pick one of these, or tell me the right SKU."
                    : "No item matches “{$shown}”. Tell me the right SKU or name.";
                $unresolved[] = $this->clar('product', $key, 'product_not_found', $q, $pr['candidates']);
                $lineOk = false;
            }

            $qty = $line['quantity'] ?? null;
            if ($qty === null) {
                $unresolved[] = $this->clar('quantity', $key, 'quantity_missing', "How many of “{$shown}”?", []);
                $lineOk = false;
            }

            if (!$lineOk) {
                $pending[] = ['line_key' => $key, 'sku' => $line['sku'], 'name' => $line['name'], 'quantity' => $qty];
                continue;
            }

            /** @var \App\Models\Product $p */
            $p = $pr['product'];
            $v = $pr['variant'];

            $unit = $pricing->unitCheck($p, $line['unit'] ?? null, $qty, $lc['unit'] ?? null);
            if ($unit['status'] === 'mismatch') {
                $unresolved[] = $this->clar('unit', $key, 'unit_mismatch',
                    "“{$p->name}” is not sold by the {$line['unit']} here. How should I enter {$qty} {$line['unit']}?",
                    $unit['candidates']);
                $pending[] = ['line_key' => $key, 'sku' => $line['sku'], 'name' => $p->name, 'quantity' => $qty];
                continue;
            }
            $qty = $unit['quantity'];

            $catalog = $pricing->unitPrice($p, $v);
            $price = $catalog;
            $priceSource = 'store_policy';
            if (($line['requested_unit_price'] ?? null) !== null) {
                $price = $line['requested_unit_price'];
                $priceSource = 'requested_override';
                if ((float) $price !== (float) $catalog) {
                    $warnings[] = ['code' => 'price_override', 'line_key' => $key,
                        'message' => "You asked for {$price} per unit on “{$p->name}” (catalogue price {$catalog}). A changed price may need manager approval when you save."];
                }
            } elseif ((float) $catalog <= 0) {
                $warnings[] = ['code' => 'zero_price', 'line_key' => $key,
                    'message' => "“{$p->name}” has no selling price set. Enter one in the editor before saving."];
            }

            $disc = $line['discount_percent'] ?? null;
            if ($disc !== null && (float) $disc > 0) {
                $warnings[] = ['code' => 'discount_requested', 'line_key' => $key,
                    'message' => "A {$disc}% discount on “{$p->name}” is applied as asked. Discounts above your limit need manager approval when you save."];
            }

            $tax = $pricing->taxRate($p);
            $avail = $pricing->availability($p, $v, $qty);
            if ($avail['availability'] === 'insufficient') {
                $have = $avail['available'] !== null ? $pricing->num($avail['available'], 4) : '0';
                $warnings[] = ['code' => 'insufficient_stock', 'line_key' => $key,
                    'message' => "Only {$have} of “{$p->name}” available; this line needs {$qty}. " .
                        (SettingsHelper::shouldStopNegativeStock() ? 'Your store does not allow selling below zero, so Save will refuse it.' : 'Your store allows selling below zero.')];
            }
            if (($p->type ?? null) !== 'service') {
                $needsStockWarehouse = true;
            }

            $resolvedLines[] = [
                'line_key'         => $key,
                'product_id'       => (string) $p->id,
                'variant_id'       => $v ? (string) $v->id : null,
                'name'             => (string) $p->name,
                'sku'              => $v?->sku ?: $p->sku,
                'quantity'         => $qty,
                'sale_uom'         => $p->unit ?: null,
                'unit_price'       => $price,
                'catalog_price'    => $catalog,
                'tax_rate'         => $tax['rate'],
                'tax_source'       => $tax['source'],
                'price_source'     => $priceSource,
                'discount_percent' => $disc,
                'availability'     => $avail['availability'],
                'match_basis'      => $pr['basis'],
            ];
        }

        // ── warehouse ──────────────────────────────────────────────────────
        $warehouse = null;
        if ($needsStockWarehouse && SettingsHelper::isStockMaintenanceEnabled()) {
            $warehouse = $pricing->warehouse();
            if ($warehouse) {
                $defaults[] = 'warehouse';
            } else {
                $unresolved[] = $this->clar('warehouse', null, 'no_warehouse',
                    'This store has no active warehouse to take stock from. Set one up before invoicing stocked items.', []);
            }
        }

        // ── payment ────────────────────────────────────────────────────────
        $method = $intent['payment']['method'] ?? null;
        if ($method === null) {
            $method = SettingsHelper::get('cash_sale_default') === '1' ? 'cash' : 'credit';
            $defaults[] = 'payment_method';
        }
        // A payment METHOD is not a payment. Money received only if explicitly stated.
        $paid = $intent['payment']['amount_paid'] ?? null;
        $paidSource = 'explicit';
        if ($paid === null) {
            $paid = '0';
            $paidSource = 'default_zero';
            if ($method === 'cash') {
                $warnings[] = ['code' => 'cash_without_amount',
                    'message' => 'Marked as paid now, but no amount received was given. Enter the amount at Save, or switch it to “on account”.'];
            }
        } else {
            $warnings[] = ['code' => 'payment_stated',
                'message' => "A payment of {$paid} is filled in as you said. Confirm the account it goes into before you save."];
        }

        // ── dates, notes ───────────────────────────────────────────────────
        $date = $intent['invoice_date'] ?? null;
        if ($date === null) {
            $date = now()->toDateString();   // store-local: the store clock is applied by TenantMiddleware
            $defaults[] = 'invoice_date';
        }
        $due = $intent['due_date'] ?? null;

        foreach ($intent['issues'] ?? [] as $issue) {
            $unresolved[] = $this->clar($issue['field'], null, $issue['code'], $issue['message'], []);
        }
        if (!empty($intent['clarification']['question'])) {
            $unresolved[] = $this->clar('edit', $intent['clarification']['line_key'] ?? null, 'ambiguous_edit',
                $intent['clarification']['question'], []);
        }

        $unresolved = $this->withSets($unresolved);
        $canHandoff = !$unresolved && $customer && $lines && count($resolvedLines) === count($lines);

        return [
            'resolved' => [
                'customer'       => $customer,
                'lines'          => $resolvedLines,
                'lines_pending'  => $pending,
                'payment'        => ['method' => $method, 'amount_paid' => $paid, 'amount_source' => $paidSource],
                'invoice_date'   => $date,
                'due_date'       => $due,
                'notes'          => $intent['notes'] ?? null,
                'warehouse'      => $warehouse,
                'totals_preview' => $this->preview($resolvedLines),
                'defaults_applied' => $defaults,
                'warnings'       => $warnings,
            ],
            'unresolved'  => $unresolved,
            'can_handoff' => (bool) $canHandoff,
            'party'       => $partyModel,
        ];
    }

    /** What must be identical between review and handoff for "nothing changed". */
    public function fingerprint(array $resolved): string
    {
        $core = [
            'c' => $resolved['customer']['id'] ?? null,
            'l' => array_map(fn ($l) => [$l['line_key'], $l['product_id'], $l['variant_id'], $l['quantity'], $l['unit_price'], $l['tax_rate'], $l['discount_percent']], $resolved['lines'] ?? []),
            'p' => [$resolved['payment']['method'] ?? null, $resolved['payment']['amount_paid'] ?? null],
            'd' => [$resolved['invoice_date'] ?? null, $resolved['due_date'] ?? null],
            'w' => $resolved['warehouse']['id'] ?? null,
        ];

        return sha1(json_encode($core));
    }

    private function preview(array $lines): array
    {
        $gross = 0.0; $disc = 0.0; $tax = 0.0;
        foreach ($lines as $l) {
            $g = (float) $l['quantity'] * (float) $l['unit_price'];
            $d = $l['discount_percent'] !== null ? $g * ((float) $l['discount_percent'] / 100) : 0.0;
            $gross += $g;
            $disc += $d;
            $tax += round(max(0.0, $g - $d) * ((float) $l['tax_rate'] / 100), 2);
        }
        $net = max(0.0, $gross - $disc);

        return [
            'subtotal' => number_format($gross, 2, '.', ''),
            'discount' => number_format($disc, 2, '.', ''),
            'tax'      => number_format($tax, 2, '.', ''),
            'total'    => number_format($net + $tax, 2, '.', ''),
            'note'     => 'Preview only. The invoice editor and the server calculate the final amounts.',
        ];
    }

    private function clar(string $field, ?string $lineKey, string $reason, string $question, array $candidates): array
    {
        return array_filter([
            'field'      => $field,
            'line_key'   => $lineKey,
            'reason'     => $reason,
            'question'   => $question,
            'candidates' => array_values($candidates),
        ], fn ($v, $k) => $k === 'candidates' || $v !== null, ARRAY_FILTER_USE_BOTH);
    }

    /** candidate_set_id is deterministic: draft + field + line + the candidate ids. */
    private function withSets(array $unresolved): array
    {
        foreach ($unresolved as &$u) {
            $ids = array_map(fn ($c) => (string) $c['id'], $u['candidates']);
            sort($ids);
            $u['candidate_set_id'] = 'cs_' . substr(sha1($this->draftId . '|' . $u['field'] . '|' . ($u['line_key'] ?? '') . '|' . implode(',', $ids)), 0, 24);
        }

        return $unresolved;
    }
}
