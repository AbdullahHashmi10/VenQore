<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Delivery Challan {{ $number }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111; padding: 24px; }
        h1 { font-size: 20px; margin: 0 0 4px; }
        .muted { color: #555; }
        .row { width: 100%; margin: 14px 0; }
        .col { display: inline-block; width: 48%; vertical-align: top; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #999; padding: 6px 8px; text-align: left; }
        th { background: #eee; }
        td.n, th.n { text-align: right; }
        .sign { margin-top: 60px; }
        .sign div { display: inline-block; width: 30%; border-top: 1px solid #333; padding-top: 4px; margin-right: 3%; }
    </style>
</head>
<body>
    <h1>{{ $settings['business_name'] ?? $settings['store_name'] ?? 'Delivery Challan' }}</h1>
    <div class="muted">DELIVERY CHALLAN{{ str_starts_with((string) $number, 'PREVIEW') ? ' (preview — not dispatched yet)' : '' }}</div>

    <div class="row">
        <div class="col">
            <strong>Challan #:</strong> {{ $number }}<br>
            <strong>Date:</strong> {{ \Illuminate\Support\Carbon::parse($date)->format('d/m/Y') }}<br>
            <strong>Invoice #:</strong> {{ $sale->reference_number ?? '—' }}
        </div>
        <div class="col">
            <strong>Dispatched from:</strong> {{ $warehouse->name ?? '—' }}<br>
            <span class="muted">{{ $warehouse->location ?? '' }}</span><br>
            @if($warehouse && ($warehouse->phone ?? null)) <span class="muted">Tel: {{ $warehouse->phone }}</span> @endif
        </div>
    </div>

    <div class="row">
        <strong>Deliver to:</strong> {{ $customer->name ?? 'Walk-in customer' }}<br>
        <span class="muted">{{ $customer->address ?? '' }} {{ $customer->phone ?? '' }}</span>
        @if($challan && ($challan->carrier_name || $challan->tracking_number))
            <br><strong>Carrier:</strong> {{ $challan->carrier_name }} {{ $challan->tracking_number ? '· ' . $challan->tracking_number : '' }}
        @endif
    </div>

    <table>
        <thead><tr><th>#</th><th>Item</th><th>SKU</th><th class="n">Qty</th><th>Unit</th></tr></thead>
        <tbody>
        @foreach($lines as $i => $l)
            <tr>
                <td>{{ $i + 1 }}</td><td>{{ $l->name }}</td><td>{{ $l->sku }}</td>
                <td class="n">{{ rtrim(rtrim(number_format((float) $l->qty, 4, '.', ''), '0'), '.') }}</td>
                <td>{{ $l->base_unit }}</td>
            </tr>
        @endforeach
        </tbody>
    </table>

    @if($challan && $challan->notes)<p><strong>Notes:</strong> {{ $challan->notes }}</p>@endif

    <div class="sign"><div>Prepared by</div><div>Driver / carrier</div><div>Received by</div></div>
</body>
</html>
