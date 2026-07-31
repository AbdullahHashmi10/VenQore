<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Invoice {{ $meta['invoice_number'] ?? '' }}</title>
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
        .invoice-title { font-size: 26px; font-weight: bold; letter-spacing: 1px; }

        .meta-table td { padding: 1mm 0; }
        .meta-table .label { color: #6b6b7a; padding-right: 4mm; }

        .parties { width: 100%; margin: 8mm 0; }
        .parties td { vertical-align: top; width: 50%; }
        .parties .label { font-size: 8.5px; letter-spacing: 1px; text-transform: uppercase; color: #6b6b7a; margin-bottom: 1.5mm; }

        .items-table { margin-top: 6mm; }
        .items-table th {
            text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px;
            padding: 2.5mm 2mm; border-bottom: 1.5px solid #1c1c28; color: #6b6b7a;
        }
        .items-table td { padding: 2.8mm 2mm; border-bottom: 0.5px solid #e2e2e8; }
        .items-table .num { text-align: right; }

        .totals-table { width: 60mm; margin-left: auto; margin-top: 5mm; }
        .totals-table td { padding: 1.3mm 0; }
        .totals-table .grand td { border-top: 1.5px solid #1c1c28; padding-top: 2.5mm; font-size: 13px; font-weight: bold; }

        .notes { margin-top: 10mm; font-size: 9px; color: #6b6b7a; line-height: 1.5; }
        .notes .heading { font-weight: bold; color: #1c1c28; margin-bottom: 1mm; }

        .footer { margin-top: 14mm; padding-top: 4mm; border-top: 0.5px solid #e2e2e8; font-size: 8px; color: #9a9aa8; text-align: center; }

        /* ── Template variants ─────────────────────────────────────── */
        @if($template === 'modern')
            .band { background: {{ $meta['accent_color'] ?? '#4f46e5' }}; height: 3mm; width: 100%; margin-bottom: 6mm; }
            .invoice-title { color: {{ $meta['accent_color'] ?? '#4f46e5' }}; }
            .items-table th { background: #f4f4f8; }
        @endif

        @if($template === 'classic')
            .items-table th, .items-table td { border: 0.5px solid #c8c8d4; }
            .header { border-bottom: 2px solid #1c1c28; padding-bottom: 4mm; }
        @endif

        @if($template === 'compact')
            body { font-size: 9px; }
            .items-table td, .items-table th { padding: 1.6mm 1.5mm; }
            .header { margin-bottom: 5mm; }
            .parties { margin: 5mm 0; }
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
                @if(!empty($company['logo_base64']))
                    <img class="company-logo" src="{{ $company['logo_base64'] }}" />
                @endif
                <div class="company-name">{{ $company['name'] }}</div>
                @if(!empty($company['address']))
                    <div class="muted">{{ $company['address'] }}</div>
                @endif
                @if(!empty($company['email']) || !empty($company['phone']))
                    <div class="muted">{{ implode(' · ', array_filter([$company['email'] ?? null, $company['phone'] ?? null])) }}</div>
                @endif
                @if(!empty($company['tax_id']))
                    <div class="muted">Tax ID: {{ $company['tax_id'] }}</div>
                @endif
            </td>
            <td style="width:45%;" class="right">
                <div class="invoice-title">INVOICE</div>
                <table class="meta-table" style="margin-left:auto; margin-top:3mm;">
                    <tr><td class="label right">Invoice #</td><td class="bold">{{ $meta['invoice_number'] ?? '—' }}</td></tr>
                    <tr><td class="label right">Issue date</td><td>{{ $meta['issue_date'] ?? '—' }}</td></tr>
                    <tr><td class="label right">Due date</td><td>{{ $meta['due_date'] ?? '—' }}</td></tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="parties">
        <tr>
            <td>
                <div class="label">Bill To</div>
                <div class="bold">{{ $client['name'] }}</div>
                @if(!empty($client['address']))
                    <div class="muted">{{ $client['address'] }}</div>
                @endif
                @if(!empty($client['email']))
                    <div class="muted">{{ $client['email'] }}</div>
                @endif
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width:42%;">Description</th>
                <th class="num" style="width:10%;">Qty</th>
                <th class="num" style="width:16%;">Unit Price</th>
                <th class="num" style="width:10%;">Disc.</th>
                <th class="num" style="width:10%;">Tax</th>
                <th class="num" style="width:14%;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($lines as $line)
                <tr>
                    <td>{{ $line['description'] }}</td>
                    <td class="num">{{ rtrim(rtrim(number_format($line['quantity'], 2), '0'), '.') }}</td>
                    <td class="num">{{ $symbol }}{{ number_format($line['unit_price'], 2) }}</td>
                    <td class="num">{{ $line['discount_pct'] > 0 ? $line['discount_pct'].'%' : '—' }}</td>
                    <td class="num">{{ $line['tax_rate'] > 0 ? $line['tax_rate'].'%' : '—' }}</td>
                    <td class="num bold">{{ $symbol }}{{ number_format($line['line_total'], 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr><td class="muted">Subtotal</td><td class="right">{{ $symbol }}{{ number_format($subtotal, 2) }}</td></tr>
        @if($discount > 0)
            <tr><td class="muted">Discount</td><td class="right">-{{ $symbol }}{{ number_format($discount, 2) }}</td></tr>
        @endif
        @if($tax > 0)
            <tr><td class="muted">Tax</td><td class="right">{{ $symbol }}{{ number_format($tax, 2) }}</td></tr>
        @endif
        <tr class="grand"><td>Total Due</td><td class="right accent">{{ $symbol }}{{ number_format($total, 2) }}</td></tr>
    </table>

    @if(!empty($meta['notes']) || !empty($meta['terms']))
        <div class="notes">
            @if(!empty($meta['notes']))
                <div class="heading">Notes</div>
                <div>{{ $meta['notes'] }}</div>
            @endif
            @if(!empty($meta['terms']))
                <div class="heading" style="margin-top:3mm;">Payment Terms</div>
                <div>{{ $meta['terms'] }}</div>
            @endif
        </div>
    @endif

    <div class="footer">Generated free at venqore.com/tools — no signup, no watermark, no expiry.</div>
</body>
</html>
