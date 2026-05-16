<?php

namespace App\Http\Controllers\V3;

use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QuotationController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id'  => ['required', 'string', 'exists:parties,id'],
            'quotation_date'=> ['required', 'date'],
            'valid_until'  => ['nullable', 'date', 'after_or_equal:quotation_date'],
            'notes'        => ['nullable', 'string', 'max:1000'],
            'items'        => ['required', 'array', 'min:1'],
            'items.*.product_id'       => ['required', 'string', 'exists:products,id'],
            'items.*.qty'              => ['required', 'numeric', 'min:0.0001'],
            'items.*.sale_uom'         => ['required', 'string', 'max:20'],
            'items.*.unit_price'       => ['required', 'numeric', 'min:0'],
            'items.*.discount_percent' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'items.*.tax_rate'         => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        DB::transaction(function () use ($validated) {

            $quotationId     = Str::uuid()->toString();
            $quotationNumber = 'QUO-' . strtoupper(Str::random(8));
            $total           = 0.00;

            foreach ($validated['items'] as $item) {
                $line   = round($item['qty'] * $item['unit_price'], 2);
                $disc   = round($line * ($item['discount_percent'] ?? 0) / 100, 2);
                $total += $line - $disc;
            }

            $quotation = Quotation::create([
                'id'               => $quotationId,
                'quotation_number' => $quotationNumber,
                'party_id'         => $validated['customer_id'],
                'quotation_date'   => $validated['quotation_date'],
                'valid_until'      => $validated['valid_until'] ?? null,
                'status'           => 'draft',
                'total_amount'     => $total,
                'notes'            => $validated['notes'] ?? null,
                'created_by'       => auth()->id() ?? 1,
            ]);

            foreach ($validated['items'] as $item) {
                $line = round($item['qty'] * $item['unit_price'], 2);
                $disc = round($line * ($item['discount_percent'] ?? 0) / 100, 2);

                QuotationItem::create([
                    'quotation_id'    => $quotation->id,
                    'product_id'      => $item['product_id'],
                    'qty'             => $item['qty'],
                    'sale_uom'        => $item['sale_uom'],
                    'unit_price'      => $item['unit_price'],
                    'discount_percent'=> $item['discount_percent'] ?? 0,
                    'tax_rate'        => $item['tax_rate']         ?? 0,
                    'line_total'      => $line - $disc,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Quotation created.');
    }

    public function convertToOrder(Request $request, string $id)
    {
        $quotation = Quotation::findOrFail($id);

        if (!in_array($quotation->status, ['draft', 'sent', 'accepted'])) {
            return back()->withErrors([
                'quotation' => "Quotation status '{$quotation->status}' cannot be converted.",
            ]);
        }

        $validated = $request->validate([
            'warehouse_id'  => ['required', 'string', 'exists:warehouses,id'],
            'delivery_date' => ['nullable', 'date'],
        ]);

        $items = $quotation->items;

        // Create the sales order using quotation prices
        $total = $items->sum('line_total');

        DB::transaction(function () use (
            $quotation, $items, $validated, $id, $total
        ) {
            $order = SalesOrder::create([
                'party_id'      => $quotation->party_id,
                'warehouse_id'  => $validated['warehouse_id'],
                'order_date'    => now()->toDateString(),
                'delivery_date' => $validated['delivery_date'] ?? null,
                'status'        => 'open',
                'total_amount'  => $total,
                'notes'         => "Converted from quotation {$quotation->quotation_number}",
                'created_by'    => auth()->id() ?? 1,
            ]);

            foreach ($items as $item) {
                SalesOrderItem::create([
                    'sales_order_id'   => $order->id,
                    'product_id'       => $item->product_id,
                    'qty'              => $item->qty,
                    'sale_uom'         => $item->sale_uom,
                    'unit_price'       => $item->unit_price,
                    'discount_percent' => $item->discount_percent,
                    'tax_rate'         => $item->tax_rate,
                    'line_total'       => $item->line_total,
                ]);
            }

            $quotation->update([
                'status'     => 'accepted',
            ]);
        });

        return redirect()->back()->with('success', 'Quotation converted to sales order.');
    }
}
