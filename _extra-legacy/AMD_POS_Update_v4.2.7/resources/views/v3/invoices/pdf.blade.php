<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    body {
        font-family: DejaVu Sans, sans-serif;
        font-size: 12px;
        color: #1a1a1a;
        margin: 0;
        padding: 0;
    }
    .page { padding: 40px; }

    /* Header */
    .header { display: table; width: 100%; margin-bottom: 32px; }
    .header-left {
        display: table-cell; width: 60%; vertical-align: top;
    }
    .header-right {
        display: table-cell; width: 40%; vertical-align: top;
        text-align: right;
    }
    .company-name { font-size: 22px; font-weight: bold; color: #111; }
    .invoice-title {
        font-size: 28px; font-weight: bold;
        color: #2563eb; margin-bottom: 4px;
    }
    .invoice-number { font-size: 14px; color: #555; }

    /* Bill To */
    .section-label {
        font-size: 10px; text-transform: uppercase;
        color: #888; letter-spacing: 1px; margin-bottom: 4px;
    }
    .bill-to { margin-bottom: 28px; }

    /* Line items table */
    table.items {
        width: 100%; border-collapse: collapse; margin-bottom: 24px;
    }
    table.items thead th {
        background: #f3f4f6; padding: 8px 10px;
        text-align: left; font-size: 11px;
        text-transform: uppercase; color: #555;
        border-bottom: 2px solid #e5e7eb;
    }
    table.items tbody td {
        padding: 8px 10px;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
    }
    table.items tbody tr:last-child td { border-bottom: none; }
    .text-right { text-align: right; }

    /* Totals */
    .totals-table {
        width: 280px; margin-left: auto; border-collapse: collapse;
    }
    .totals-table td { padding: 5px 10px; }
    .totals-table .grand-total td {
        font-size: 14px; font-weight: bold;
        border-top: 2px solid #1a1a1a; padding-top: 8px;
    }

    /* Badges */
    .promo-badge {
        font-size: 9px; color: #16a34a; font-weight: bold;
        background: #dcfce7; padding: 1px 5px; border-radius: 3px;
    }

    /* Footer */
    .footer {
        margin-top: 48px; font-size: 10px; color: #aaa;
        border-top: 1px solid #e5e7eb; padding-top: 12px;
        text-align: center;
    }
</style>
</head>
<body>
<div class="page">

    {{-- ── Header ─────────────────────────────────────────────── --}}
    <div class="header">
        <div class="header-left">
            <div class="company-name">VenQore ERP</div>
            <div style="color:#555; margin-top:4px;">
                {{ $sale->warehouse_name }}
            </div>
        </div>
        <div class="header-right">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">{{ $sale->reference_number }}</div>
            <div style="margin-top:8px; color:#555;">
                Date: {{ \Carbon\Carbon::parse($sale->posted_at)->format('d M Y') }}
            </div>
        </div>
    </div>

    {{-- ── Bill To ─────────────────────────────────────────────── --}}
    <div class="bill-to">
        <div class="section-label">Bill To</div>
        <div style="font-weight:bold; font-size:13px;">
            {{ $sale->customer_name }}
        </div>
        @if($sale->customer_address)
            <div style="color:#555; margin-top:2px;">
                {{ $sale->customer_address }}
            </div>
        @endif
        @if($sale->customer_phone)
            <div style="color:#555;">Ph: {{ $sale->customer_phone }}</div>
        @endif
        @if($sale->customer_tax_number)
            <div style="color:#555;">
                NTN/STRN: {{ $sale->customer_tax_number }}
            </div>
        @endif
    </div>

    {{-- ── Line Items ──────────────────────────────────────────── --}}
    <table class="items">
        <thead>
            <tr>
                <th>#</th>
                <th>Product</th>
                <th>UOM</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Unit Price</th>
                <th class="text-right">Discount</th>
                <th class="text-right">Tax %</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($items as $i => $item)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>
                    {{ $item->product_name }}
                    @if($item->free_quantity > 0)
                        <span class="promo-badge">FREE</span>
                    @endif
                    <div style="font-size:10px; color:#999;">
                        {{ $item->sku }}
                    </div>
                </td>
                <td>{{ $item->sale_uom }}</td>
                <td class="text-right">
                    {{ number_format($item->quantity, 2) }}
                </td>
                <td class="text-right">
                    {{ number_format($item->unit_price, 2) }}
                </td>
                <td class="text-right">
                    {{ $item->discount_amount > 0 && $item->gross_amount > 0
                        ? number_format(($item->discount_amount / $item->gross_amount) * 100, 1) . '%'
                        : '—' }}
                </td>
                <td class="text-right">
                    {{ $item->tax_rate > 0
                        ? number_format($item->tax_rate, 1) . '%'
                        : '—' }}
                </td>
                <td class="text-right">
                    {{ number_format($item->line_total, 2) }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- ── Totals ──────────────────────────────────────────────── --}}
    <table class="totals-table">
        <tr>
            <td>Subtotal (Gross)</td>
            <td class="text-right">
                {{ number_format($sale->subtotal_gross, 2) }}
            </td>
        </tr>
        @if($sale->total_item_discounts > 0)
        <tr>
            <td>Discounts</td>
            <td class="text-right" style="color:#dc2626;">
                ({{ number_format($sale->total_item_discounts, 2) }})
            </td>
        </tr>
        @endif
        <tr>
            <td>Net Sales</td>
            <td class="text-right">
                {{ number_format($sale->net_sales, 2) }}
            </td>
        </tr>
        @if($sale->tax_amount > 0)
        <tr>
            <td>Tax</td>
            <td class="text-right">
                {{ number_format($sale->tax_amount, 2) }}
            </td>
        </tr>
        @endif
        <tr class="grand-total">
            <td><strong>Total</strong></td>
            <td class="text-right">
                <strong>Rs. {{ number_format($sale->invoice_total, 2) }}</strong>
            </td>
        </tr>
        <tr>
            <td style="color:#888; font-size:11px;">Status</td>
            <td class="text-right">
                <span style="
                    font-weight: bold;
                    text-transform: uppercase;
                    font-size: 11px;
                    color: {{ $sale->payment_status === 'paid'
                        ? '#16a34a'
                        : ($sale->payment_status === 'partial'
                            ? '#d97706'
                            : '#dc2626') }};">
                    {{ $sale->payment_status }}
                </span>
            </td>
        </tr>
    </table>

    {{-- ── Footer ──────────────────────────────────────────────── --}}
    <div class="footer">
        Generated by VenQore ERP &nbsp;|&nbsp;
        {{ now()->format('d M Y, h:i A') }}
    </div>

</div>
</body>
</html>
