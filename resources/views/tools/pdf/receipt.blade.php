<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Receipt {{ $meta['receipt_number'] ?? '' }}</title>
    <style>
        @if($paperPreset === 'thermal_80mm')
            @page { margin: 4mm 3mm; }
            body { margin: 0; font-family: 'Courier', 'Helvetica', monospace, sans-serif; font-size: 9px; color: #000; width: 100%; }
            .container { width: 100%; }
            .store-name { font-size: 13px; font-weight: bold; text-align: center; text-transform: uppercase; margin-bottom: 1mm; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 2.5mm 0; }
            .logo { max-height: 14mm; max-width: 35mm; display: block; margin: 0 auto 2mm auto; }
            table { width: 100%; border-collapse: collapse; }
            td, th { padding: 1mm 0; vertical-align: top; }
            .items-table th { text-align: left; border-bottom: 1px solid #000; font-size: 8px; text-transform: uppercase; }
            .totals-table td { padding: 0.8mm 0; }
            .totals-table .grand-total td { font-weight: bold; font-size: 11px; border-top: 1px solid #000; border-bottom: 1px double #000; padding: 1.5mm 0; }
            .footer-notes { text-align: center; font-size: 8px; margin-top: 3mm; }
        @else
            @page { margin: 15mm 15mm; }
            body { margin: 0; font-family: 'Helvetica', Arial, sans-serif; font-size: 10px; color: #1c1c28; }
            .container { width: 85mm; margin: 0 auto; border: 1px solid #e2e2e8; padding: 6mm; border-radius: 4px; }
            .store-name { font-size: 16px; font-weight: bold; text-align: center; margin-bottom: 1.5mm; }
            .center { text-align: center; }
            .right { text-align: right; }
            .bold { font-weight: bold; }
            .muted { color: #6b6b7a; }
            .divider { border-top: 1px dashed #c8c8d4; margin: 3mm 0; }
            .logo { max-height: 16mm; max-width: 45mm; display: block; margin: 0 auto 3mm auto; }
            table { width: 100%; border-collapse: collapse; }
            td, th { padding: 1.2mm 0; vertical-align: top; }
            .items-table th { text-align: left; border-bottom: 1px solid #1c1c28; font-size: 8.5px; text-transform: uppercase; color: #6b6b7a; }
            .totals-table td { padding: 1mm 0; }
            .totals-table .grand-total td { font-weight: bold; font-size: 12px; border-top: 1px solid #1c1c28; border-bottom: 1.5px solid #1c1c28; padding: 2mm 0; }
            .footer-notes { text-align: center; font-size: 8.5px; color: #6b6b7a; margin-top: 4mm; }
        @endif
    </style>
</head>
<body>
    <div class="container">
        @if(!empty($store['logo_base64']))
            <img class="logo" src="{{ $store['logo_base64'] }}" />
        @endif

        <div class="store-name">{{ $store['name'] }}</div>
        @if(!empty($store['address']))
            <div class="center muted">{{ $store['address'] }}</div>
        @endif
        @if(!empty($store['phone']))
            <div class="center muted">Tel: {{ $store['phone'] }}</div>
        @endif

        <div class="divider"></div>

        <table>
            <tr>
                <td>Receipt #: <span class="bold">{{ $meta['receipt_number'] ?? '—' }}</span></td>
                <td class="right">{{ $meta['date_time'] ?? now()->format('Y-m-d H:i') }}</td>
            </tr>
            @if(!empty($meta['cashier']))
                <tr>
                    <td colspan="2">Cashier: {{ $meta['cashier'] }}</td>
                </tr>
            @endif
        </table>

        <div class="divider"></div>

        <table class="items-table">
            <thead>
                <tr>
                    <th style="width:55%;">Item</th>
                    <th class="right" style="width:15%;">Qty</th>
                    <th class="right" style="width:30%;">Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($lines as $line)
                    <tr>
                        <td>
                            <div>{{ $line['name'] }}</div>
                            <div class="muted" style="font-size: 8px;">{{ rtrim(rtrim(number_format($line['quantity'], 2), '0'), '.') }} @ {{ $symbol }}{{ number_format($line['unit_price'], 2) }}</div>
                        </td>
                        <td class="right">{{ rtrim(rtrim(number_format($line['quantity'], 2), '0'), '.') }}</td>
                        <td class="right bold">{{ $symbol }}{{ number_format($line['amount'], 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="divider"></div>

        <table class="totals-table">
            <tr>
                <td>Subtotal</td>
                <td class="right">{{ $symbol }}{{ number_format($subtotal, 2) }}</td>
            </tr>
            @if($discount > 0)
                <tr>
                    <td>Discount</td>
                    <td class="right">-{{ $symbol }}{{ number_format($discount, 2) }}</td>
                </tr>
            @endif
            @if($tax > 0)
                <tr>
                    <td>Tax ({{ (float)($meta['tax_rate'] ?? 0) }}%)</td>
                    <td class="right">{{ $symbol }}{{ number_format($tax, 2) }}</td>
                </tr>
            @endif
            <tr class="grand-total">
                <td>TOTAL</td>
                <td class="right">{{ $symbol }}{{ number_format($total, 2) }}</td>
            </tr>
            <tr>
                <td style="padding-top: 1.5mm;">Payment Method</td>
                <td class="right" style="padding-top: 1.5mm;">{{ $paymentMethod }}</td>
            </tr>
            @if($paymentMethod === 'Cash')
                <tr>
                    <td>Amount Tendered</td>
                    <td class="right">{{ $symbol }}{{ number_format($tendered, 2) }}</td>
                </tr>
                <tr>
                    <td class="bold">Change Due</td>
                    <td class="right bold">{{ $symbol }}{{ number_format($changeDue, 2) }}</td>
                </tr>
            @endif
        </table>

        <div class="divider"></div>

        <div class="footer-notes">
            @if(!empty($meta['returns_policy_days']) && $meta['returns_policy_days'] > 0)
                <div style="margin-bottom: 1.5mm;">Returns accepted within {{ (int)$meta['returns_policy_days'] }} days with receipt.</div>
            @endif
            @if(!empty($store['footer_message']))
                <div style="margin-bottom: 1.5mm;">{{ $store['footer_message'] }}</div>
            @else
                <div style="margin-bottom: 1.5mm;">Thank you for your business!</div>
            @endif
            <div class="muted" style="font-size: 7.5px;">Generated free at venqore.com/tools</div>
        </div>
    </div>
</body>
</html>
