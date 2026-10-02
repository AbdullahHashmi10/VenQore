<?php

namespace App\Services\InvoiceAssistant;

use App\Models\Party;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Queries\PartyBalanceQuery;

/**
 * Resolved draft -> the contract the CURRENT invoice editor consumes
 * (Sales/CreateInvoice via the workspace tab + MoneyDocument line shape).
 *
 * Versioned (`version: 1`) and tagged `source: invoice_assistant` so the
 * scan-prefill path is untouched. Maps party, product, VARIANT, quantity,
 * per-line tax, explicit discount, dates, notes, payment defaults and source
 * metadata. Product cost is included only because the normal editor already
 * receives it for any sales user (margin sheet) — assistant API responses
 * never carry it.
 */
class InvoicePrefillAdapter
{
    public function __construct(private int|string $tenantId) {}

    /**
     * @param array $resolved the FRESH resolved payload (see InvoiceDraftResolver)
     * @param array $reviewed what the operator reviewed, to disclose changes
     */
    public function build(string $draftId, int $revision, array $resolved, ?Party $party, array $reviewed = []): array
    {
        $pricing = new DraftPricingResolver($this->tenantId);

        $items = [];
        foreach ($resolved['lines'] as $l) {
            $product = Product::query()->where('tenant_id', $this->tenantId)->where('id', $l['product_id'])->first();
            if (!$product) {
                continue;
            }
            $variant = $l['variant_id']
                ? ProductVariant::query()->where('tenant_id', $this->tenantId)->where('product_id', $product->id)->where('id', $l['variant_id'])->first()
                : null;

            $editorProduct = $pricing->editorProduct($product, $variant, true);
            $hasDiscount = $l['discount_percent'] !== null && (float) $l['discount_percent'] > 0;

            $items[] = [
                'product'         => $editorProduct,
                'variant'         => $variant ? ['id' => (string) $variant->id, 'sku' => $variant->sku] : null,
                'quantity'        => (float) $l['quantity'],
                'price'           => (float) $l['unit_price'],
                'discount'        => $hasDiscount ? (float) $l['discount_percent'] : 0,
                'discountType'    => $hasDiscount ? 'percent' : 'fixed',
                // The rate this line is charged at: the product's own, else null
                // so the editor applies the invoice-level rate — never both.
                'tax_rate'        => $l['tax_source'] === 'product' ? (float) $l['tax_rate'] : null,
                'available_stock' => $editorProduct['available_stock'],
                'sale_uom'        => $l['sale_uom'],
                'assistant_line_key' => $l['line_key'],
            ];
        }

        $partyPayload = null;
        if ($party) {
            $net = 0.0;
            try {
                $net = (float) PartyBalanceQuery::partyNetBalance($party->id, $party->tenant_id, $party->type);
            } catch (\Throwable) {
                // The editor can still work without a live balance.
            }
            $partyPayload = [
                'id'               => (string) $party->id,
                'name'             => $party->name,
                'phone'            => $party->phone,
                'email'            => $party->email,
                'type'             => $party->type,
                'credit_limit'     => $party->credit_limit,
                'default_discount' => $party->default_discount,
                'payment_terms'    => $party->payment_terms,
                'current_balance'  => $net,
            ];
        }

        $notices = [];
        $oldByKey = collect($reviewed['lines'] ?? [])->keyBy('line_key');
        foreach ($resolved['lines'] as $l) {
            $old = $oldByKey->get($l['line_key']);
            if ($old && ((float) $old['unit_price'] !== (float) $l['unit_price'])) {
                $notices[] = "Price of {$l['name']} changed since review: {$old['unit_price']} → {$l['unit_price']}.";
            }
        }

        return [
            'version'          => 1,
            'source'           => 'invoice_assistant',
            'draft_id'         => $draftId,
            'revision'         => $revision,
            'party'            => $partyPayload,
            'notes'            => $resolved['notes'],
            'payment_method'   => $resolved['payment']['method'],
            // Never auto-settled: 0 unless the operator STATED an amount.
            'amount_paid'      => (float) ($resolved['payment']['amount_paid'] ?? 0),
            'amount_source'    => $resolved['payment']['amount_source'] ?? 'default_zero',
            'date'             => $resolved['invoice_date'],
            'due_date'         => $resolved['due_date'],
            'items'            => $items,
            'warehouse'        => $resolved['warehouse'],
            'defaults_applied' => $resolved['defaults_applied'],
            'warnings'         => $resolved['warnings'],
            'notices'          => $notices,
        ];
    }
}
