<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Batch;
use App\Models\Party;
use App\Models\Payment;
use App\Models\PaymentAllocation;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;

class PurchaseService
{
    /**
     * Create a purchase bill
     */
    public function createPurchase(array $data): Invoice
    {
        DB::beginTransaction();

        try {
            // Calculate totals
            $subtotal = collect($data['items'])->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });

            // Create Purchase Invoice
            $invoice = Invoice::create([
                'invoice_number' => $this->generatePurchaseNumber(),
                'date' => $data['date'] ?? now(),
                'party_id' => $data['supplier_id'],
                'type' => 'purchase',
                'status' => $data['payment_status'] ?? 'unpaid',
                'subtotal' => $subtotal,
                'discount_amount' => $data['discount'] ?? 0,
                'tax_amount' => $data['tax'] ?? 0,
                'total_amount' => $subtotal - ($data['discount'] ?? 0) + ($data['tax'] ?? 0),
                'notes' => $data['notes'] ?? null,
                'user_id' => auth()->id(),
            ]);

            // Process Items
            foreach ($data['items'] as $itemData) {
                $this->addPurchaseItem($invoice, $itemData);
            }

            // Record Payment if paid
            if ($data['payment_status'] === 'paid' && isset($data['payment_method'])) {
                $this->recordPurchasePayment($invoice, $data['payment_method']);
            }

            // Update Supplier Balance (they are owed this amount if unpaid)
            if ($data['payment_status'] !== 'paid') {
                $supplier = Party::find($data['supplier_id']);
                $supplier->decrement('current_balance', $invoice->total_amount); // We owe them
            }

            // Log Activity
            ActivityLog::log(
                'purchase',
                auth()->user()->name . ' created Purchase ' . $invoice->invoice_number,
                $invoice,
                ['total' => $invoice->total_amount]
            );

            DB::commit();
            return $invoice;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Add item to purchase and update stock
     */
    private function addPurchaseItem(Invoice $invoice, array $itemData): InvoiceItem
    {
        $product = Product::findOrFail($itemData['product_id']);

        // Create Invoice Item
        $invoiceItem = InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'product_id' => $product->id,
            'quantity' => $itemData['quantity'],
            'unit_price' => $itemData['unit_price'],
            'discount_amount' => $itemData['discount'] ?? 0,
            'tax_amount' => $itemData['tax'] ?? 0,
            'total' => ($itemData['quantity'] * $itemData['unit_price']) - ($itemData['discount'] ?? 0) + ($itemData['tax'] ?? 0),
        ]);

        // Create/Update Batch if provided
        $batchId = null;
        if (isset($itemData['batch_number'])) {
            $batch = Batch::create([
                'product_id' => $product->id,
                'batch_number' => $itemData['batch_number'],
                'expiry_date' => $itemData['expiry_date'] ?? null,
                'mfg_date' => $itemData['mfg_date'] ?? null,
                'mrp' => $itemData['mrp'] ?? $product->price,
                'quantity' => $itemData['quantity'],
            ]);
            $batchId = $batch->id;
        }

        // Add to Stock
        Stock::create([
            'product_id' => $product->id,
            'quantity' => $itemData['quantity'],
            'status' => 'available',
        ]);

        // Update Product's Weighted Average Cost
        if ($itemData['update_cost_price'] ?? true) {
            $this->updateWeightedAverageCost($product, $itemData['quantity'], $itemData['unit_price']);
        }

        return $invoiceItem;
    }

    /**
     * Update product cost price using weighted average
     */
    private function updateWeightedAverageCost(Product $product, float $newQty, float $newPrice): void
    {
        $currentStock = $product->stocks()->where('status', 'available')->sum('quantity');
        $currentCost = $product->cost_price ?? 0;

        // Weighted Average = ((Old Qty * Old Price) + (New Qty * New Price)) / Total Qty
        $totalQty = $currentStock + $newQty;
        if ($totalQty > 0) {
            $weightedCost = (($currentStock * $currentCost) + ($newQty * $newPrice)) / $totalQty;
            $product->update(['cost_price' => round($weightedCost, 2)]);
        }
    }

    /**
     * Record payment for purchase
     */
    private function recordPurchasePayment(Invoice $invoice, string $method): void
    {
        $payment = Payment::create([
            'party_id' => $invoice->party_id,
            'amount' => $invoice->total_amount,
            'date' => now(),
            'method' => $method,
        ]);

        PaymentAllocation::create([
            'payment_id' => $payment->id,
            'invoice_id' => $invoice->id,
            'amount' => $invoice->total_amount,
        ]);
    }

    /**
     * Generate unique purchase number
     */
    private function generatePurchaseNumber(): string
    {
        $prefix = \App\Helpers\SettingsHelper::getPurchasePrefix();
        $count = Invoice::where('type', 'purchase')->whereDate('created_at', today())->count() + 1;
        return $prefix . now()->format('Ymd') . '-' . str_pad($count, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Create purchase return (Debit Note)
     */
    public function createPurchaseReturn(Invoice $originalPurchase, array $items, string $reason): Invoice
    {
        DB::beginTransaction();

        try {
            $returnTotal = 0;

            // Create Return Invoice
            $returnInvoice = Invoice::create([
                'invoice_number' => 'PRN-' . now()->format('Ymd') . '-' . str_pad(Invoice::where('type', 'purchase_return')->count() + 1, 5, '0', STR_PAD_LEFT),
                'date' => now(),
                'party_id' => $originalPurchase->party_id,
                'type' => 'purchase_return',
                'status' => 'paid',
                'subtotal' => 0, // Will calculate
                'total_amount' => 0,
                'notes' => "Return for {$originalPurchase->invoice_number}. Reason: {$reason}",
                'user_id' => auth()->id(),
            ]);

            // Process return items
            foreach ($items as $item) {
                $originalItem = InvoiceItem::find($item['invoice_item_id']);

                InvoiceItem::create([
                    'invoice_id' => $returnInvoice->id,
                    'product_id' => $originalItem->product_id,
                    'quantity' => -$item['quantity'], // Negative quantity
                    'unit_price' => $originalItem->unit_price,
                    'total' => -($item['quantity'] * $originalItem->unit_price),
                ]);

                // Reduce stock
                Stock::create([
                    'product_id' => $originalItem->product_id,
                    'quantity' => -$item['quantity'],
                    'status' => 'available',
                ]);

                $returnTotal += ($item['quantity'] * $originalItem->unit_price);
            }

            $returnInvoice->update([
                'subtotal' => $returnTotal,
                'total_amount' => $returnTotal,
            ]);

            // Reduce supplier debt (we owe them less now)
            $supplier = Party::find($originalPurchase->party_id);
            $supplier->increment('current_balance', $returnTotal);

            // Log Activity
            ActivityLog::log(
                'purchase_return',
                auth()->user()->name . ' created Purchase Return ' . $returnInvoice->invoice_number,
                $returnInvoice
            );

            DB::commit();
            return $returnInvoice;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
}
