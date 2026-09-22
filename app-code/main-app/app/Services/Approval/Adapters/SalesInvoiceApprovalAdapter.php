<?php

namespace App\Services\Approval\Adapters;

use App\Engines\SaleService;
use App\Models\ApprovalDocument;
use App\Models\Party;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class SalesInvoiceApprovalAdapter implements ApprovalAdapterInterface
{
    public function __construct(
        private SaleService $saleService
    ) {}

    public function documentType(): string
    {
        return ApprovalDocument::TYPE_SALES_INVOICE;
    }

    public function validatePayload(array $payload, Tenant $tenant, User $maker): array
    {
        $customerId = $payload['customer_id'] ?? $payload['party_id'] ?? null;
        if ($customerId) {
            $partyExists = Party::where('tenant_id', $tenant->id)->where('id', $customerId)->exists();
            if (!$partyExists) {
                throw ValidationException::withMessages(['customer_id' => 'Invalid or cross-tenant customer selected.']);
            }
        }

        $items = (array)($payload['items'] ?? []);
        if (empty($items)) {
            throw ValidationException::withMessages(['items' => 'At least one line item is required.']);
        }

        $calcSubtotal = 0.0;
        foreach ($items as $i => $item) {
            $productId = $item['product_id'] ?? null;
            $qty = (float)($item['quantity'] ?? $item['qty'] ?? 0);
            $unitPrice = (float)($item['unit_price'] ?? $item['price'] ?? 0);

            if ($qty <= 0) {
                throw ValidationException::withMessages(["items.{$i}.quantity" => 'Item quantity must be greater than zero.']);
            }
            if ($unitPrice < 0) {
                throw ValidationException::withMessages(["items.{$i}.unit_price" => 'Item price cannot be negative.']);
            }

            if ($productId) {
                $product = Product::where('tenant_id', $tenant->id)->where('id', $productId)->first();
                if (!$product) {
                    throw ValidationException::withMessages(["items.{$i}.product_id" => 'Product does not belong to the current store.']);
                }
            }

            $calcSubtotal += ($qty * $unitPrice);
        }

        $discount = (float)($payload['discount'] ?? $payload['discount_amount'] ?? 0);
        $tax = (float)($payload['tax'] ?? $payload['tax_amount'] ?? 0);
        $total = round(max(0, $calcSubtotal - $discount + $tax), 2);

        return [
            'party_id'        => $customerId,
            'customer_id'     => $customerId,
            'items'           => $items,
            'subtotal'        => round($calcSubtotal, 2),
            'discount_amount' => $discount,
            'tax_amount'      => $tax,
            'total'           => $total,
            'notes'           => $payload['notes'] ?? null,
            'payment_method'  => $payload['payment_method'] ?? 'credit',
            'paid_amount'     => (float)($payload['paid_amount'] ?? 0),
            'idempotency_key' => $payload['idempotency_key'] ?? null,
            'source'          => 'admin_invoice',
        ];
    }

    public function revalidate(ApprovalDocument $doc, Tenant $tenant, User $reviewer): void
    {
        $revision = $doc->currentRevision;
        if (!$revision) {
            throw new RuntimeException("Missing revision for approval document #{$doc->id}.");
        }

        $this->validatePayload($revision->payload, $tenant, $reviewer);
    }

    public function post(ApprovalDocument $doc, Tenant $tenant, User $reviewer): array
    {
        $payload = $doc->currentRevision->payload;

        $formattedItems = array_map(fn($item) => [
            'product_id'       => $item['product_id'],
            'qty'              => (float)($item['quantity'] ?? $item['qty'] ?? 1),
            'unit_price'       => (float)($item['unit_price'] ?? $item['price'] ?? 0),
            'discount_percent' => (float)($item['discount_percent'] ?? 0),
            'tax_rate'         => (float)($item['tax_rate'] ?? 0),
            'sale_uom'         => $item['sale_uom'] ?? 'pcs',
        ], $payload['items']);

        $saleData = [
            'customer_id'     => $payload['customer_id'] ?? $payload['party_id'] ?? null,
            'user_id'         => $doc->maker_id ?? $reviewer->id,
            'items'           => $formattedItems,
            'payment_method'  => $payload['payment_method'] ?? 'credit',
            'amount_received' => (float)($payload['paid_amount'] ?? 0),
            'approved_by'     => $reviewer->id,
            'idempotency_key' => $payload['idempotency_key'] ?? ('APP-SALE-' . $doc->id),
        ];

        // Post through SaleService to generate inventory batches, COGS, and GL journal
        $sale = $this->saleService->post($saleData);

        return [
            'type'            => 'sale',
            'id'              => $sale->id,
            'reference'       => $sale->reference_number ?? ($sale->invoice_number ?? null),
            'invoice_number'  => $sale->reference_number ?? ($sale->invoice_number ?? null),
            'total'           => (float)($sale->net_sales ?? ($sale->total ?? ($sale->invoice_total ?? 0))),
        ];
    }
}
