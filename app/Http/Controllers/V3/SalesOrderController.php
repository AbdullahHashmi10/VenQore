<?php

namespace App\Http\Controllers\V3;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SalesOrderController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id'   => ['required', 'string', 'exists:parties,id'],
            'warehouse_id'  => ['required', 'string', 'exists:warehouses,id'],
            'order_date'    => ['required', 'date'],
            'delivery_date' => ['nullable', 'date', 'after_or_equal:order_date'],
            'notes'         => ['nullable', 'string', 'max:1000'],
            'items'         => ['required', 'array', 'min:1'],
            'items.*.product_id'       => ['required', 'string', 'exists:products,id'],
            'items.*.qty'              => ['required', 'numeric', 'min:0.0001'],
            'items.*.sale_uom'         => ['required', 'string', 'max:20'],
            'items.*.unit_price'       => ['required', 'numeric', 'min:0'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.tax_rate'         => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::transaction(function () use ($validated) {
            $orderId = Str::uuid()->toString();
            $total   = 0.00;

            foreach ($validated['items'] as $item) {
                $line   = round($item['qty'] * $item['unit_price'], 2);
                $disc   = round($line * ($item['discount_percent'] ?? 0) / 100, 2);
                $total += $line - $disc;
            }

            $order = SalesOrder::create([
                'id'            => $orderId,
                'party_id'      => $validated['customer_id'],
                'warehouse_id'  => $validated['warehouse_id'],
                'order_date'    => $validated['order_date'],
                'delivery_date' => $validated['delivery_date'] ?? null,
                'status'        => 'open',
                'total_amount'  => $total,
                'notes'         => $validated['notes'] ?? null,
                'created_by'    => auth()->id() ?? 1,
            ]);

            foreach ($validated['items'] as $item) {
                $line = round($item['qty'] * $item['unit_price'], 2);
                $disc = round($line * ($item['discount_percent'] ?? 0) / 100, 2);

                SalesOrderItem::create([
                    'sales_order_id'  => $order->id,
                    'product_id'      => $item['product_id'],
                    'qty'             => $item['qty'],
                    'sale_uom'        => $item['sale_uom'],
                    'unit_price'      => $item['unit_price'], // LOCKED here
                    'discount_percent'=> $item['discount_percent'] ?? 0,
                    'tax_rate'        => $item['tax_rate'] ?? 0,
                    'line_total'      => $line - $disc,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Sales order created.');
    }

    public function cancel(Request $request, string $id)
    {
        $order = SalesOrder::findOrFail($id);

        if ($order->status === 'converted') {
            return back()->withErrors([
                'order' => 'Cannot cancel a sales order that has already been converted to an invoice.',
            ]);
        }

        $order->update([
            'status'     => 'cancelled',
        ]);

        return redirect()->back()->with('success', 'Sales order cancelled.');
    }

    public function convert(Request $request, string $id)
    {
        $validated = $request->validate([
            'payment_method'  => ['required', 'in:cash,bank,credit,split'],
            'amount_received' => ['nullable', 'numeric', 'min:0'],
            'sale_date'       => ['required', 'date', 'before_or_equal:today'],
            'approved_by'     => ['nullable', 'string', 'exists:users,id'],
        ]);

        $order = SalesOrder::findOrFail($id);

        if ($order->status !== 'open') {
            return back()->withErrors([
                'order' => "Sales order is {$order->status} and cannot be converted.",
            ]);
        }

        $orderItems = $order->items;

        // Build sale payload using LOCKED prices from the order
        $saleData = [
            'customer_id'     => $order->party_id,
            'warehouse_id'    => $order->warehouse_id,
            'sale_date'       => $validated['sale_date'],
            'payment_method'  => $validated['payment_method'],
            'amount_received' => $validated['amount_received'] ?? null,
            'approved_by'     => $validated['approved_by']     ?? null,
            'source_order_id' => $id,
            'items'           => $orderItems->map(fn($item) => [
                'product_id'       => $item->product_id,
                'qty'              => $item->qty,
                'sale_uom'         => $item->sale_uom,
                'unit_price'       => $item->unit_price, // LOCKED price — not current
                'discount_percent' => $item->discount_percent,
                'tax_rate'         => $item->tax_rate,
                'is_promotional'   => false,
            ])->toArray(),
        ];

        $sale = app(\App\Services\V3\SaleService::class)->post($saleData);

        // Mark order as converted — cannot be converted again
        $order->update([
            'status'     => 'converted',
        ]);

        // Link the sale back to the source order
        DB::table('sales')->where('id', $sale->id)->update([
            'source_order_id' => $id,
            'updated_at'      => now(),
        ]);

        return redirect()->back()->with([
            'success'    => 'Sales order converted to invoice.',
            'invoice_id' => $sale->id,
            'invoice_no' => $sale->reference_number,
            'status'     => 'success',
        ]);
    }
}
