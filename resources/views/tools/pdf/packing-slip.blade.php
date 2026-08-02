<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Packing Slip {{ $meta['order_number'] ?? '' }}</title>
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

        .header { width: 100%; margin-bottom: 6mm; }
        .header td { vertical-align: top; }
        .company-logo { max-height: 18mm; max-width: 45mm; margin-bottom: 3mm; }
        .company-name { font-size: 15px; font-weight: bold; }
        .doc-title { font-size: 24px; font-weight: bold; letter-spacing: 1px; }

        .meta-table td { padding: 1mm 0; }
        .meta-table .label { color: #6b6b7a; padding-right: 4mm; }

        .partial-notice {
            background: #fff8e6; border: 1px solid #f59e0b; color: #b45309;
            padding: 2.5mm 3.5mm; border-radius: 4px; font-size: 9.5px; font-weight: bold;
            margin-bottom: 5mm; text-align: center;
        }

        .parties { width: 100%; margin: 5mm 0 7mm 0; }
        .parties td { vertical-align: top; width: 33.33%; }
        .parties .label { font-size: 8.5px; letter-spacing: 1px; text-transform: uppercase; color: #6b6b7a; margin-bottom: 1.5mm; font-weight: bold; }

        .items-table { margin-top: 4mm; }
        .items-table th {
            text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px;
            padding: 2.5mm 2mm; border-bottom: 1.5px solid #1c1c28; color: #6b6b7a;
        }
        .items-table td { padding: 2.8mm 2mm; border-bottom: 0.5px solid #e2e2e8; }
        .items-table .num { text-align: right; }

        .totals-summary { margin-top: 4mm; text-align: right; font-size: 9.5px; }

        .notes-block { margin-top: 8mm; font-size: 9px; color: #1c1c28; line-height: 1.5; }
        .notes-card { background: #f8f8fc; border: 0.5px solid #e2e2e8; border-radius: 4px; padding: 3mm 4mm; margin-bottom: 3mm; }
        .notes-card .heading { font-weight: bold; color: #6b6b7a; text-transform: uppercase; font-size: 8px; letter-spacing: 0.5px; margin-bottom: 1mm; }

        .footer { margin-top: 12mm; padding-top: 4mm; border-top: 0.5px solid #e2e2e8; font-size: 8px; color: #9a9aa8; text-align: center; }

        /* ── Template variants ─────────────────────────────────────── */
        @if($template === 'modern')
            .band { background: {{ $meta['accent_color'] ?? '#4f46e5' }}; height: 3mm; width: 100%; margin-bottom: 6mm; }
            .doc-title { color: {{ $meta['accent_color'] ?? '#4f46e5' }}; }
            .items-table th { background: #f4f4f8; }
        @endif

        @if($template === 'classic')
            .items-table th, .items-table td { border: 0.5px solid #c8c8d4; }
            .header { border-bottom: 2px solid #1c1c28; padding-bottom: 4mm; }
        @endif

        @if($template === 'compact')
            body { font-size: 9px; }
            .items-table td, .items-table th { padding: 1.6mm 1.5mm; }
            .header { margin-bottom: 4mm; }
            .parties { margin: 3mm 0 5mm 0; }
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
                @if(!empty($shipFrom['logo_base64']))
                    <img class="company-logo" src="{{ $shipFrom['logo_base64'] }}" />
                @endif
                <div class="company-name">{{ $shipFrom['name'] }}</div>
                @if(!empty($shipFrom['address']))
                    <div class="muted">{{ $shipFrom['address'] }}</div>
                @endif
                @if(!empty($shipFrom['email']) || !empty($shipFrom['phone']))
                    <div class="muted">{{ implode(' · ', array_filter([$shipFrom['email'] ?? null, $shipFrom['phone'] ?? null])) }}</div>
                @endif
            </td>
            <td style="width:45%;" class="right">
                <div class="doc-title">PACKING SLIP</div>
                <table class="meta-table" style="margin-left:auto; margin-top:3mm;">
                    <tr><td class="label right">Order #</td><td class="bold">{{ $meta['order_number'] ?? '—' }}</td></tr>
                    <tr><td class="label right">Pack Date</td><td>{{ $meta['pack_date'] ?? '—' }}</td></tr>
                    @if(!empty($meta['carrier']))
                        <tr><td class="label right">Carrier</td><td>{{ $meta['carrier'] }}</td></tr>
                    @endif
                    @if(!empty($meta['tracking_number']))
                        <tr><td class="label right">Tracking #</td><td class="bold">{{ $meta['tracking_number'] }}</td></tr>
                    @endif
                </table>
            </td>
        </tr>
    </table>

    @if($hasPartialShipment)
        <div class="partial-notice">
            NOTICE: This is a PARTIAL SHIPMENT. Remaining ordered items will ship separately.
        </div>
    @endif

    <table class="parties">
        <tr>
            <td>
                <div class="label">Ship To (Recipient)</div>
                <div class="bold">{{ $shipTo['name'] }}</div>
                @if(!empty($shipTo['address']))
                    <div class="muted">{{ $shipTo['address'] }}</div>
                @endif
                @if(!empty($shipTo['phone']) || !empty($shipTo['email']))
                    <div class="muted">{{ implode(' · ', array_filter([$shipTo['email'] ?? null, $shipTo['phone'] ?? null])) }}</div>
                @endif
            </td>
            <td>
                <div class="label">Bill To</div>
                @if(!empty($billTo['name']))
                    <div class="bold">{{ $billTo['name'] }}</div>
                    @if(!empty($billTo['address']))
                        <div class="muted">{{ $billTo['address'] }}</div>
                    @endif
                    @if(!empty($billTo['email']) || !empty($billTo['phone']))
                        <div class="muted">{{ implode(' · ', array_filter([$billTo['email'] ?? null, $billTo['phone'] ?? null])) }}</div>
                    @endif
                @else
                    <div class="muted">Same as Ship To</div>
                @endif
            </td>
            <td>
                <div class="label">Ship From</div>
                <div class="bold">{{ $shipFrom['name'] }}</div>
                @if(!empty($shipFrom['address']))
                    <div class="muted">{{ $shipFrom['address'] }}</div>
                @endif
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width:16%;">SKU</th>
                <th style="width:40%;">Description / Item</th>
                <th style="width:14%;">Box / Pkg</th>
                <th class="num" style="width:15%;">Ordered</th>
                <th class="num" style="width:15%;">Shipped</th>
            </tr>
        </thead>
        <tbody>
            @foreach($lines as $line)
                <tr>
                    <td>{{ $line['sku'] ?: '—' }}</td>
                    <td>
                        {{ $line['description'] }}
                        @if(!empty($line['notes']))
                            <div class="muted" style="font-size: 8.5px;">Note: {{ $line['notes'] }}</div>
                        @endif
                    </td>
                    <td>{{ $line['package_number'] ?: 'Box 1' }}</td>
                    <td class="num">{{ rtrim(rtrim(number_format($line['quantity_ordered'], 2), '0'), '.') }}</td>
                    <td class="num bold">{{ rtrim(rtrim(number_format($line['quantity_shipped'], 2), '0'), '.') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals-summary">
        Total Items Ordered: <strong>{{ rtrim(rtrim(number_format($totalOrdered, 2), '0'), '.') }}</strong> &nbsp;|&nbsp; Total Items Shipped: <strong>{{ rtrim(rtrim(number_format($totalShipped, 2), '0'), '.') }}</strong>
    </div>

    @if(!empty($meta['gift_message']) || !empty($meta['special_instructions']))
        <div class="notes-block">
            @if(!empty($meta['gift_message']))
                <div class="notes-card">
                    <div class="heading">🎁 Gift Message / Special Notes</div>
                    <div>"{!! nl2br(e($meta['gift_message'])) !!}"</div>
                </div>
            @endif
            @if(!empty($meta['special_instructions']))
                <div class="notes-card">
                    <div class="heading">Special Handling & Delivery Instructions</div>
                    <div>{!! nl2br(e($meta['special_instructions'])) !!}</div>
                </div>
            @endif
        </div>
    @endif

    <div class="footer">Powered by <a href="https://venqore.com?utm_source=invoice_footer" target="_blank" rel="noopener" style="color: #4f46e5; text-decoration: none; font-weight: bold;">VenQore</a> &mdash; Free Online Invoicing &amp; Business Tools</div>
</body>
</html>
