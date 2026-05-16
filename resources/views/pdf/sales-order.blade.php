<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Order #{{ $order->order_number }}</title>
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
        $currencySymbol = $currencySymbols[$currency] ?? $currency;

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
            display: flex;
            justify-content: space-between;
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
            display: flex;
            justify-content: space-between;
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
    </style>
</head>

<body>
    <div class="header">
        <h1>{{ $settings['store_name'] ?? 'Pre-Order' }}</h1>
        <p>{{ $settings['store_address'] ?? '' }}</p>
        <h2>SALES PRE-ORDER</h2>
    </div>

    <div class="info">
        <div><strong>Order No:</strong> <span>{{ $order->order_number }}</span></div>
        <div><strong>Date:</strong> <span>{{ \Carbon\Carbon::parse($order->order_date)->format($dateFormat) }}</span>
        </div>
        <div><strong>Customer:</strong> <span>{{ $order->customer->name ?? 'Walk-in' }}</span></div>
        <div><strong>Status:</strong> <span style="text-transform:uppercase">{{ $order->status }}</span></div>
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
            @foreach($order->items as $item)
                <tr>
                    <td>
                        {{ $item->product->name }}
                    </td>
                    <td class="text-right">{{ $item->quantity_requested }}</td>
                    <td class="text-right">{{ number_format($item->unit_price, $decimals) }}</td>
                    <td class="text-right">{{ number_format($item->subtotal, $decimals) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <div class="grand-total">
            <span>Total Amount:</span>
            <span>{{ $currencySymbol }} {{ number_format($order->total_amount, $decimals) }}</span>
        </div>
    </div>

    <div class="footer">
        <p>This is a pre-order document. Not a valid tax invoice.</p>
    </div>
</body>

</html>