@php
    $decimals = max(0, min(4, (int) ($settings['decimal_places'] ?? 2)));
    $currSymbol = $settings['currency_symbol'] ?? $settings['currency'] ?? 'PKR';
    $showInvoiceNumber = !in_array($settings['invoice_number_enabled'] ?? '1', ['0', 0, false, 'false'], true);
@endphp
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @if(($theme ?? 'classic') === 'elegant')
    body {
        font-family: DejaVu Serif, Georgia, serif;
        font-size: 11px;
        color: #1a1a1a;
        margin: 0;
        padding: 0;
    }
    .page { padding: 40px; }
    .header { display: table; width: 100%; margin-bottom: 32px; }
    .header-left { display: table-cell; width: 60%; vertical-align: top; }
    .header-right { display: table-cell; width: 40%; vertical-align: top; text-align: right; }
    .company-name { font-size: 24px; font-weight: bold; color: {{ $primaryColor }}; letter-spacing: 0.5px; }
    .invoice-title { font-size: 26px; font-weight: bold; color: #333; margin-bottom: 4px; }
    .invoice-number { font-size: 13px; color: #666; font-style: italic; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    table.items thead th {
        background: transparent; padding: 8px 10px;
        text-align: left; font-size: 11px; text-transform: uppercase;
        color: {{ $primaryColor }}; border-top: 1px solid {{ $primaryColor }}; border-bottom: 2px solid {{ $primaryColor }};
    }
    table.items tbody td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    @elseif(($theme ?? 'classic') === 'modern')
    body {
        font-family: DejaVu Sans, sans-serif;
        font-size: 12px;
        color: #111;
        margin: 0;
        padding: 0;
    }
    .page { padding: 40px; }
    .header { display: table; width: 100%; margin-bottom: 32px; background: #f8fafc; padding: 16px; border-radius: 8px; }
    .header-left { display: table-cell; width: 60%; vertical-align: top; }
    .header-right { display: table-cell; width: 40%; vertical-align: top; text-align: right; }
    .company-name { font-size: 22px; font-weight: bold; color: #111; }
    .invoice-title { font-size: 28px; font-weight: bold; color: {{ $primaryColor }}; margin-bottom: 4px; }
    .invoice-number { font-size: 14px; color: #555; font-weight: bold; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    table.items thead th {
        background: {{ $primaryColor }}; padding: 9px 10px;
        text-align: left; font-size: 11px; text-transform: uppercase;
        color: #ffffff; font-weight: bold;
    }
    table.items tbody td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    @else
    body {
        font-family: DejaVu Sans, sans-serif;
        font-size: 12px;
        color: #1a1a1a;
        margin: 0;
        padding: 0;
    }
    .page { padding: 40px; }
    .header { display: table; width: 100%; margin-bottom: 32px; }
    .header-left { display: table-cell; width: 60%; vertical-align: top; }
    .header-right { display: table-cell; width: 40%; vertical-align: top; text-align: right; }
    .company-name { font-size: 22px; font-weight: bold; color: #111; }
    .invoice-title { font-size: 28px; font-weight: bold; color: {{ $primaryColor }}; margin-bottom: 4px; }
    .invoice-number { font-size: 14px; color: #555; }
    table.items { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    table.items thead th {
        background: #f3f4f6; padding: 8px 10px;
        text-align: left; font-size: 11px; text-transform: uppercase;
        color: #555; border-bottom: 2px solid #e5e7eb;
    }
    table.items tbody td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    @endif
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
thead { display: table-header-group; } tr { page-break-inside: avoid; }
</style>
</head>
<body>
<div class="page">

    {{-- ── Header ─────────────────────────────────────────────── --}}
    <div class="header">
        <div class="header-left">
            <div class="company-name">{{ $settings['business_name'] ?? $settings['store_name'] ?? 'Store' }}</div>
            <div style="color:#555; margin-top:4px;">
                {{ $sale->warehouse_name }}
            </div>
        </div>
        <div class="header-right">
            <div class="invoice-title" @if(!empty($isReturn)) style="color: #dc2626;" @endif>
                {{ $docTitle ?? (!empty($isReturn) ? 'CREDIT NOTE / SALE RETURN' : 'INVOICE') }}
            </div>
            @if($showInvoiceNumber)
            <div class="invoice-number">
                {{ !empty($isReturn) ? 'Credit Note #: ' : 'Invoice #: ' }}{{ $docRef ?? $sale->reference_number }}
            </div>
            @endif
            <div style="margin-top:8px; color:#555;">
                Date: {{ \Carbon\Carbon::parse($sale->posted_at ?? now())->format('d M Y') }}
            </div>
        </div>
    </div>

    {{-- ── Bill To ─────────────────────────────────────────────── --}}
    <div class="bill-to">
        <div class="section-label">{{ !empty($isReturn) ? 'Credit To / Party' : 'Bill To' }}</div>
        <div style="font-weight:bold; font-size:13px;">
            {{ $sale->customer_name ?: 'Walk-in Customer' }}
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
                @if($showMargin)
                <th class="text-right">Margin</th>
                @endif
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
                    {{ \App\Helpers\SettingsHelper::formatQuantity($item->quantity, $decimals) }}
                </td>
                <td class="text-right">
                    {{ number_format($item->unit_price, $decimals) }}
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
                @if($showMargin)
                <td class="text-right">
                    {{ $item->unit_price > 0
                        ? number_format((($item->unit_price - $item->cost_price) / $item->unit_price) * 100, 1) . '%'
                        : '0.0%' }}
                </td>
                @endif
                <td class="text-right">
                    {{ number_format($item->line_total, $decimals) }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- ── Totals ──────────────────────────────────────────────── --}}
    <table class="totals-table">
        @if(!empty($isReturn))
        <tr>
            <td>Return Gross</td>
            <td class="text-right">
                {{ number_format(abs($sale->subtotal_gross ?? $sale->total ?? 0), $decimals) }}
            </td>
        </tr>
        @if(!empty($sale->total_tax) && $sale->total_tax != 0)
        <tr>
            <td>Tax Adjustment</td>
            <td class="text-right">
                {{ number_format(abs($sale->total_tax), $decimals) }}
            </td>
        </tr>
        @endif
        <tr class="grand-total">
            <td><strong>Total Credit Amount</strong></td>
            <td class="text-right">
                <strong style="color: #dc2626;">{{ $currSymbol }} {{ number_format(abs($sale->invoice_total ?? $sale->total ?? 0), $decimals) }}</strong>
            </td>
        </tr>
        <tr>
            <td style="color:#888; font-size:11px;">Document Type</td>
            <td class="text-right">
                <span style="font-weight: bold; font-size: 11px; color: #dc2626; text-transform: uppercase;">
                    Credit Note / Return
                </span>
            </td>
        </tr>
        @else
        <tr>
            <td>Subtotal (Gross)</td>
            <td class="text-right">
                {{ number_format($sale->subtotal_gross ?? $sale->subtotal ?? 0, $decimals) }}
            </td>
        </tr>
        @if(($sale->total_item_discounts ?? $sale->discount ?? 0) > 0)
        <tr>
            <td>Discounts</td>
            <td class="text-right" style="color:#dc2626;">
                ({{ number_format($sale->total_item_discounts ?? $sale->discount ?? 0, $decimals) }})
            </td>
        </tr>
        @endif
        <tr>
            <td>Net Sales</td>
            <td class="text-right">
                {{ number_format($sale->net_sales ?? (($sale->subtotal ?? 0) - ($sale->discount ?? 0)), $decimals) }}
            </td>
        </tr>
        @if(($sale->total_tax ?? $sale->tax ?? 0) > 0)
        <tr>
            <td>Tax</td>
            <td class="text-right">
                {{ number_format($sale->total_tax ?? $sale->tax ?? 0, $decimals) }}
            </td>
        </tr>
        @endif
        <tr class="grand-total">
            <td><strong>Total</strong></td>
            <td class="text-right">
                <strong>{{ $currSymbol }} {{ number_format($sale->invoice_total ?? $sale->total ?? 0, $decimals) }}</strong>
            </td>
        </tr>
        <tr><td>Paid</td><td class="text-right">{{ $currSymbol }} {{ number_format($paid ?? 0, $decimals) }}</td></tr>
        <tr><td>Balance Due</td><td class="text-right">{{ $currSymbol }} {{ number_format(max(0, ($sale->invoice_total ?? $sale->total ?? 0) - ($paid ?? 0)), $decimals) }}</td></tr>
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
        @endif
    </table>

    {{-- ── Footer ──────────────────────────────────────────────── --}}
    <div class="footer">
        Generated by VenQore ERP &nbsp;|&nbsp;
        {{ now()->format('d M Y, h:i A') }}
    </div>

</div>
</body>
</html>
