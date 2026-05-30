<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $sale->reference_number }}</title>
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
        $currencySymbol = $settings['currency_symbol'] ?? ($currencySymbols[$currency] ?? $currency);

        // Date format
        $dateFormat = match ($settings['date_format'] ?? 'DD/MM/YYYY') {
            'DD/MM/YYYY' => 'd/m/Y H:i',
            'MM/DD/YYYY' => 'm/d/Y H:i',
            'YYYY-MM-DD' => 'Y-m-d H:i',
            default => 'd/m/Y H:i',
        };

        // Margin & Font Logic
        $marginTop = ($settings['margin_top'] ?? 20) . 'mm';
        $marginRight = ($settings['margin_right'] ?? 20) . 'mm';
        $marginBottom = ($settings['margin_bottom'] ?? 20) . 'mm';
        $marginLeft = ($settings['margin_left'] ?? 20) . 'mm';
        
        $fontSize = match($settings['print_invoice_text_size'] ?? '2') {
            '1' => '10px',
            '2' => '12px',
            '3' => '14px',
            '4' => '16px',
            default => '12px',
        };
    @endphp
    <style>
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-weight: 600;
            font-size: {{ $fontSize }};
            line-height: 1.2;
            color: #000;
            margin: 0;
            padding-top: {{ $marginTop }};
            padding-bottom: {{ $marginBottom }};
            padding-left: {{ $marginLeft }};
            padding-right: {{ $marginRight }};
        }

        .receipt-header {
            text-align: center;
            margin-bottom: 20px;
        }

        .receipt-header h1 {
            margin: 0;
            font-size: 1.5em;
            text-transform: uppercase;
        }

        .receipt-info {
            margin-bottom: 15px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
        }

        .receipt-info div {
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
            font-size: 0.9em;
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
            font-size: 1.2em;
            margin-top: 5px;
            border-top: 1px solid #000;
            padding-top: 5px;
        }

        .fbr-section {
            margin-top: 20px;
            text-align: center;
            border: 1px solid #000;
            padding: 10px;
        }

        .qr-placeholder {
            width: 100px;
            height: 100px;
            border: 1px solid #000;
            margin: 10px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 0.8em;
        }

        .signature-section {
            margin-top: 40px;
            text-align: center;
        }

        .signature-line {
            border-top: 1px solid #000;
            width: 150px;
            margin: 0 auto 5px auto;
        }
    </style>
</head>

<body>
    <div class="receipt-header">
        <h1>{{ $settings['business_name'] ?? 'VENQORE System' }}</h1>
        <p>
            {{ $settings['business_address'] ?? '' }}<br>
            Phone: {{ $settings['business_phone'] ?? '' }}
            @if(!empty($settings['tax_number']))
                <br>NTN: {{ $settings['tax_number'] }}
            @endif
        </p>
    </div>

    <div class="receipt-info">
        <div><strong>Invoice:</strong> <span>{{ $sale->reference_number }}</span></div>
        <div><strong>Date:</strong> <span>{{ $sale->created_at->format($dateFormat) }}</span></div>
        <div><strong>Customer:</strong> <span>{{ $sale->customer->name ?? 'Walk-in Customer' }}</span></div>
        <div><strong>Cashier:</strong> <span>{{ $sale->user->name }}</span></div>
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
            @foreach($sale->items as $item)
                <tr>
                    <td>
                        {{ $item->product->name }}
                        @if($item->productVariant)
                            <br><small>({{ $item->productVariant->name }})</small>
                        @endif
                    </td>
                    <td class="text-right">{{ $item->quantity }}</td>
                    <td class="text-right">{{ number_format($item->unit_price, $decimals) }}</td>
                    <td class="text-right">{{ number_format($item->subtotal, $decimals) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <div>
            <span>Subtotal:</span>
            <span>{{ $currencySymbol }} {{ number_format($sale->subtotal, $decimals) }}</span>
        </div>
        @if($sale->discount > 0)
            <div>
                <span>Discount:</span>
                <span>- {{ $currencySymbol }} {{ number_format($sale->discount, $decimals) }}</span>
            </div>
        @endif
        @if($sale->tax > 0)
            <div>
                <span>Tax:</span>
                <span>+ {{ $currencySymbol }} {{ number_format($sale->tax, $decimals) }}</span>
            </div>
        @endif
        @if($sale->round_off != 0)
            <div>
                <span>Round Off:</span>
                <span>{{ $sale->round_off > 0 ? '+' : '' }} {{ $currencySymbol }} {{ number_format($sale->round_off, $decimals) }}</span>
            </div>
        @endif
        <div class="grand-total">
            <span>Grand Total:</span>
            <span>{{ $currencySymbol }} {{ number_format($sale->total, $decimals) }}</span>
        </div>
        <div>
            <span>Amount Paid:</span>
            <span>{{ $currencySymbol }} {{ number_format($sale->payments->sum('amount'), $decimals) }}</span>
        </div>
        <div>
            <span>Balance Due:</span>
            <span>{{ $currencySymbol }}
                {{ number_format($sale->total - $sale->payments->sum('amount'), $decimals) }}</span>
        </div>
    </div>

    @if(isset($settings['fbr_integration']) && $settings['fbr_integration'] == '1')
        <div class="fbr-section">
            <strong>FBR VERIFIED INVOICE</strong>
            <div class="qr-placeholder">
                @if($sale->fbr_qr_data)
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data={{ urlencode($sale->fbr_qr_data) }}"
                        alt="QR Code">
                @else
                    [FBR QR CODE]
                @endif
            </div>
            <div style="font-size: 10px;">
                FBR Invoice No: {{ $sale->fbr_invoice_number ?? ('FBR-' . $sale->id . '-' . time()) }}<br>
                Verify via FBR Tax Asaan App
            </div>
        </div>
    @endif

    <div class="signature-section">
        <div class="signature-line"></div>
        <span>{{ $settings['print_signature_text'] ?? 'Authorized Signatory' }}</span>
    </div>

    <div class="footer">
        <p>{!! nl2br(e($settings['print_terms'] ?? $settings['receipt_footer_message'] ?? 'Thank you for your business!')) !!}<br>Software by VENQORE</p>
    </div>
</body>
</html>