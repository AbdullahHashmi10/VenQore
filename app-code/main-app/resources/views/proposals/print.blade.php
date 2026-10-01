<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Proposal #{{ $proposal->reference_number }}</title>
    @php
        $decimals = (int) ($settings['decimal_places'] ?? 2);
        $currency = $settings['currency'] ?? 'PKR';
        $currencySymbols = [
            'PKR' => 'Rs.',
            'USD' => '$',
            'EUR' => '€',
            'GBP' => '£',
            'AED' => 'AED',
            'SAR' => 'SAR',
            'INR' => '₹',
        ];
        $currencySymbol = $settings['currency_symbol'] ?? $currencySymbols[$currency] ?? $currency;

        $dateFormat = match ($settings['date_format'] ?? 'DD/MM/YYYY') {
            'DD/MM/YYYY' => 'd/m/Y',
            'MM/DD/YYYY' => 'm/d/Y',
            'YYYY-MM-DD' => 'Y-m-d',
            default => 'd/m/Y',
        };
    @endphp
    <style>
        body {
            font-family: 'Courier', sans-serif;
            font-size: 12px;
            line-height: 1.2;
            color: #000;
            margin: 0;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
        }

        .header h1 {
            margin: 0;
            font-size: 18px;
            text-transform: uppercase;
        }

        .info {
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
        }

        .info div {
            display: table;
            width: 100%;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        th {
            text-align: left;
            border-bottom: 1px solid #000;
            padding: 5px 0;
        }

        td {
            padding: 5px 0;
            vertical-align: top;
        }

        .text-right {
            text-align: right;
        }

        .totals {
            border-top: 1px dashed #000;
            padding-top: 10px;
        }

        .totals div {
            display: table;
            width: 100%;
            margin-bottom: 3px;
        }

        .grand-total {
            font-weight: bold;
            font-size: 14px;
            margin-top: 5px;
            border-top: 1px solid #000;
            padding-top: 5px;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 10px;
        }
        .info div > *, .totals div > * { display: table-cell; width: 50%; }
        .info div > :last-child, .totals div > :last-child { text-align: right; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
    </style>
</head>

<body>
    <div class="header">
        <h1>{{ $settings['business_name'] ?? $settings['store_name'] ?? 'Proposal' }}</h1>
        <p>{{ $settings['business_address'] ?? $settings['store_address'] ?? '' }}</p>
        <h2>PROPOSAL / QUOTATION</h2>
    </div>

    <div class="info">
        <div><strong>Order No:</strong> <span>{{ $proposal->reference_number }}</span></div>
        <div><strong>Date:</strong> <span>{{ \Carbon\Carbon::parse($proposal->created_at)->format($dateFormat) }}</span>
        </div>
        <div><strong>Customer:</strong> <span>{{ $proposal->customer->name ?? 'Walk-in' }}</span></div>
        <div><strong>Status:</strong> <span style="text-transform:uppercase">{{ $proposal->status }}</span></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($proposal->items as $item)
                <tr>
                    <td>
                        {{ $item->product->name ?? $item->name ?? 'Item' }}
                    </td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">{{ number_format($item->unit_price, $decimals) }}</td>
                    <td class="text-right">{{ number_format($item->total ?? $item->subtotal ?? ($item->quantity * $item->unit_price), $decimals) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <div class="grand-total">
            <span>Total Amount:</span>
            <span>{{ $currencySymbol }} {{ number_format($proposal->total_amount, $decimals) }}</span>
        </div>
    </div>

    <div class="footer">
        <p>This is a quotation, not a tax invoice.</p>
        <p style="margin-top: 4px;">Powered by <a href="https://venqore.com?utm_source=invoice_footer" target="_blank" rel="noopener" style="color: #4f46e5; text-decoration: none; font-weight: bold;">VenQore</a></p>
    </div>
</body>

</html>