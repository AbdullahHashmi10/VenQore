<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Purchase Order {{ $meta['po_number'] ?? '' }}</title>
    <style>
        @page { margin: 18mm 16mm; }
        body { margin: 0; font-family: 'Helvetica', Arial, sans-serif; font-size: 10.5px; color: #1c1c28; }
        table { border-collapse: collapse; width: 100%; }
        .muted { color: #6b6b7a; }
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .accent { color: {{ $meta['accent_color'] ?? '#4f46e5' }}; }
        .bg-accent { background: {{ $meta['accent_color'] ?? '#4f46e5' }}; }

        .header { width: 100%; margin-bottom: 8mm; }
        .header td { vertical-align: top; }
        .company-logo { max-height: 18mm; max-width: 45mm; margin-bottom: 3mm; }
        .company-name { font-size: 15px; font-weight: bold; }
        .po-title { font-size: 24px; font-weight: bold; letter-spacing: 1px; }

        .meta-table td { padding: 1mm 0; }
        .meta-table .label { color: #6b6b7a; padding-right: 4mm; }

        .parties { width: 100%; margin: 6mm 0; }
        .parties td { vertical-align: top; width: 33.33%; }
        .parties .label { font-size: 8.5px; letter-spacing: 1px; text-transform: uppercase; color: #6b6b7a; margin-bottom: 1.5mm; font-weight: bold; }

        .items-table { margin-top: 6mm; }
        .items-table th {
            text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px;
            padding: 2.5mm 2mm; border-bottom: 1.5px solid #1c1c28; color: #6b6b7a;
        }
        .items-table td { padding: 2.8mm 2mm; border-bottom: 0.5px solid #e2e2e8; }
        .items-table .num { text-align: right; }

        .totals-table { width: 65mm; margin-left: auto; margin-top: 5mm; }
        .totals-table td { padding: 1.3mm 0; }
        .totals-table .grand td { border-top: 1.5px solid #1c1c28; padding-top: 2.5mm; font-size: 13px; font-weight: bold; }

        .signature-block { margin-top: 12mm; width: 100%; }
        .signature-line { border-top: 1px solid #1c1c28; width: 60mm; margin-top: 12mm; padding-top: 1.5mm; font-size: 9px; }

        .notes { margin-top: 8mm; font-size: 9px; color: #6b6b7a; line-height: 1.5; }
        .notes .heading { font-weight: bold; color: #1c1c28; margin-bottom: 1mm; }

        .footer { margin-top: 12mm; padding-top: 4mm; border-top: 0.5px solid #e2e2e8; font-size: 8px; color: #9a9aa8; text-align: center; }

        /* ── Template variants ─────────────────────────────────────── */
        @if($template === 'modern')
            .band { background: {{ $meta['accent_color'] ?? '#4f46e5' }}; height: 3mm; width: 100%; margin-bottom: 6mm; }
            .po-title { color: {{ $meta['accent_color'] ?? '#4f46e5' }}; }
            .items-table th { background: #f4f4f8; }
        @endif

        @if($template === 'classic')
            .items-table th, .items-table td { border: 0.5px solid #c8c8d4; }
            .header { border-bottom: 2px solid #1c1c28; padding-bottom: 4mm; }
        @endif
    </style>
</head>
<body>
    @if($template === 'modern')
        <div class="band"></div>
    @endif

    <table class="header">
        <tr>
            <td style="width:55%;">
                @if(!empty($buyer['logo_base64']))
                    <img class="company-logo" src="{{ $buyer['logo_base64'] }}" />
                @endif
                <div class="company-name">{{ $buyer['name'] }}</div>
                @if(!empty($buyer['address']))
                    <div class="muted">{{ $buyer['address'] }}</div>
                @endif
                @if(!empty($buyer['email']) || !empty($buyer['phone']))
                    <div class="muted">{{ implode(' · ', array_filter([$buyer['email'] ?? null, $buyer['phone'] ?? null])) }}</div>
                @endif
                @if(!empty($buyer['tax_id']))
                    <div class="muted">Tax ID: {{ $buyer['tax_id'] }}</div>
                @endif
            </td>
            <td style="width:45%;" class="right">
                <div class="po-title">PURCHASE ORDER</div>
                <table class="meta-table" style="margin-left:auto; margin-top:3mm;">
                    <tr><td class="label right">PO #</td><td class="bold">{{ $meta['po_number'] ?? '—' }}</td></tr>
                    <tr><td class="label right">Order Date</td><td>{{ $meta['order_date'] ?? '—' }}</td></tr>
                    <tr><td class="label right">Expected Date</td><td>{{ $meta['expected_date'] ?? '—' }}</td></tr>
                    @if(!empty($meta['payment_terms']))
                        <tr><td class="label right">Terms</td><td>{{ $meta['payment_terms'] }}</td></tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    <table class="parties">
        <tr>
            <td>
                <div class="label">Vendor / Supplier</div>
                <div class="bold">{{ $vendor['name'] }}</div>
                @if(!empty($vendor['contact_person']))
                    <div class="muted">Attn: {{ $vendor['contact_person'] }}</div>
                @endif
                @if(!empty($vendor['address']))
                    <div class="muted">{{ $vendor['address'] }}</div>
                @endif
                @if(!empty($vendor['email']) || !empty($vendor['phone']))
                    <div class="muted">{{ implode(' · ', array_filter([$vendor['email'] ?? null, $vendor['phone'] ?? null])) }}</div>
                @endif
            </td>
            <td>
                <div class="label">Ship To</div>
                @if(!empty($buyer['ship_to']))
                    <div class="muted">{!! nl2br(e($buyer['ship_to'])) !!}</div>
                @else
                    <div class="bold">{{ $buyer['name'] }}</div>
                    @if(!empty($buyer['address']))
                        <div class="muted">{{ $buyer['address'] }}</div>
                    @endif
                @endif
            </td>
            <td>
                <div class="label">Buyer Details</div>
                <div class="bold">{{ $buyer['name'] }}</div>
                @if(!empty($buyer['email']))
                    <div class="muted">{{ $buyer['email'] }}</div>
                @endif
                @if(!empty($buyer['phone']))
                    <div class="muted">{{ $buyer['phone'] }}</div>
                @endif
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width:18%;">SKU / Code</th>
                <th style="width:36%;">Description</th>
                <th class="num" style="width:10%;">Qty</th>
                <th class="num" style="width:14%;">Unit Cost</th>
                <th class="num" style="width:8%;">Tax</th>
                <th class="num" style="width:14%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($lines as $line)
                <tr>
                    <td>{{ $line['sku'] ?: '—' }}</td>
                    <td>{{ $line['description'] }}</td>
                    <td class="num">{{ rtrim(rtrim(number_format($line['quantity'], 2), '0'), '.') }}</td>
                    <td class="num">{{ $symbol }}{{ number_format($line['unit_cost'], 2) }}</td>
                    <td class="num">{{ $line['tax_rate'] > 0 ? $line['tax_rate'].'%' : '—' }}</td>
                    <td class="num bold">{{ $symbol }}{{ number_format($line['line_total'], 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr><td class="muted">Subtotal</td><td class="right">{{ $symbol }}{{ number_format($subtotal, 2) }}</td></tr>
        @if($tax > 0)
            <tr><td class="muted">Tax</td><td class="right">{{ $symbol }}{{ number_format($tax, 2) }}</td></tr>
        @endif
        @if($shipping > 0)
            <tr><td class="muted">Freight / Shipping</td><td class="right">{{ $symbol }}{{ number_format($shipping, 2) }}</td></tr>
        @endif
        <tr class="grand"><td>Grand Total</td><td class="right accent">{{ $symbol }}{{ number_format($total, 2) }}</td></tr>
    </table>

    <table class="signature-block">
        <tr>
            <td style="width:50%;">
                @if(!empty($meta['notes']))
                    <div class="notes">
                        <div class="heading">Special Instructions / Notes</div>
                        <div>{{ $meta['notes'] }}</div>
                    </div>
                @endif
            </td>
            <td style="width:50%;" class="right">
                <div style="display:inline-block; text-align:left;">
                    <div class="signature-line">
                        Authorized Signature
                        @if(!empty($meta['authorized_by']))
                            <div class="muted">({{ $meta['authorized_by'] }})</div>
                        @endif
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">Generated free at venqore.com/tools — no signup, no watermark.</div>
</body>
</html>
