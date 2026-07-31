<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Cash Drawer Count Sheet - {{ $store['shift_date'] ?? date('Y-m-d') }}</title>
    <style>
        @page { margin: 15mm 15mm; }
        body { margin: 0; font-family: 'Helvetica', Arial, sans-serif; font-size: 10px; color: #1c1c28; line-height: 1.4; }
        table { border-collapse: collapse; width: 100%; }
        .muted { color: #6b6b7a; }
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .uppercase { text-transform: uppercase; }

        .header { width: 100%; margin-bottom: 6mm; border-bottom: 2px solid #1c1c28; padding-bottom: 4mm; }
        .header td { vertical-align: top; }
        .title { font-size: 22px; font-weight: bold; letter-spacing: 0.5px; color: #1c1c28; }
        .store-name { font-size: 14px; font-weight: bold; margin-bottom: 1mm; }

        .meta-grid { width: 100%; margin-bottom: 6mm; background: #f8f8fc; border: 0.5px solid #e2e2e8; }
        .meta-grid td { padding: 2.5mm 3mm; vertical-align: top; width: 25%; }
        .meta-label { font-size: 8px; font-weight: bold; text-transform: uppercase; color: #6b6b7a; margin-bottom: 0.5mm; }
        .meta-value { font-size: 11px; font-weight: bold; color: #1c1c28; }

        .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #1c1c28; margin-bottom: 2mm; border-bottom: 1px solid #1c1c28; padding-bottom: 1mm; }

        .denom-table { margin-bottom: 6mm; }
        .denom-table th { text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px; padding: 2mm; background: #f1f1f5; border-bottom: 1px solid #1c1c28; color: #6b6b7a; }
        .denom-table td { padding: 2mm; border-bottom: 0.5px solid #e2e2e8; }
        .denom-table .num { text-align: right; }

        .summary-box { width: 100%; margin-bottom: 6mm; }
        .summary-box td { vertical-align: top; }

        .reconcile-table { width: 85mm; margin-left: auto; border: 1px solid #1c1c28; background: #fafafa; }
        .reconcile-table td { padding: 2mm 3mm; border-bottom: 0.5px solid #e2e2e8; }
        .reconcile-table .total-row td { border-top: 1px solid #1c1c28; font-size: 11px; font-weight: bold; background: #f1f1f5; }
        .reconcile-table .variance-row td { font-size: 12px; font-weight: bold; }
        .variance-exact { color: #047857; }
        .variance-over { color: #1d4ed8; }
        .variance-short { color: #b91c1c; }

        .signatures { margin-top: 10mm; width: 100%; }
        .signatures td { width: 50%; vertical-align: bottom; padding: 0 4mm; }
        .sig-line { border-bottom: 1px solid #1c1c28; margin-bottom: 2mm; height: 12mm; }
        .sig-label { font-size: 9px; font-weight: bold; text-transform: uppercase; color: #6b6b7a; }

        .footer { margin-top: 10mm; padding-top: 3mm; border-top: 0.5px solid #e2e2e8; font-size: 8px; color: #9a9aa8; text-align: center; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td style="width:60%;">
                <div class="store-name">{{ $store['name'] }}</div>
                @if(!empty($store['location']))
                    <div class="muted">{{ $store['location'] }}</div>
                @endif
                @if(!empty($store['register_id']))
                    <div class="muted">Register / Till: {{ $store['register_id'] }}</div>
                @endif
            </td>
            <td style="width:40%;" class="right">
                <div class="title">CASH DRAWER COUNT</div>
                <div class="muted" style="margin-top: 1mm;">Date: {{ $store['shift_date'] ?? date('Y-m-d') }}</div>
            </td>
        </tr>
    </table>

    <table class="meta-grid">
        <tr>
            <td>
                <div class="meta-label">Shift Date</div>
                <div class="meta-value">{{ $store['shift_date'] ?? date('Y-m-d') }}</div>
            </td>
            <td>
                <div class="meta-label">Register / Till ID</div>
                <div class="meta-value">{{ $store['register_id'] ?: 'Main Register' }}</div>
            </td>
            <td>
                <div class="meta-label">Cashier</div>
                <div class="meta-value">{{ $store['cashier_name'] ?: 'Unspecified' }}</div>
            </td>
            <td>
                <div class="meta-label">Supervisor</div>
                <div class="meta-value">{{ $store['supervisor_name'] ?: 'Unspecified' }}</div>
            </td>
        </tr>
    </table>

    <div class="section-title">Denomination Breakdown</div>

    <table class="denom-table">
        <thead>
            <tr>
                <th style="width: 35%;">Denomination</th>
                <th style="width: 20%;">Type</th>
                <th class="num" style="width: 15%;">Unit Value</th>
                <th class="num" style="width: 15%;">Count</th>
                <th class="num" style="width: 15%;">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($denoms as $d)
                <tr>
                    <td class="bold">{{ $d['name'] }}</td>
                    <td class="uppercase muted" style="font-size: 8px;">{{ $d['type'] }}</td>
                    <td class="num">{{ $symbol }}{{ number_format($d['value'], 2) }}</td>
                    <td class="num bold">{{ number_format($d['count']) }}</td>
                    <td class="num bold">{{ $symbol }}{{ number_format($d['subtotal'], 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="summary-box">
        <tr>
            <td style="width: 45%;">
                @if(!empty($store['notes']))
                    <div class="section-title">Notes / Audit Remarks</div>
                    <div style="font-size: 9px; color: #4b5563; padding: 2mm; background: #f9fafb; border: 0.5px solid #e5e7eb; border-radius: 2px;">
                        {{ $store['notes'] }}
                    </div>
                @endif
            </td>
            <td style="width: 55%;">
                <table class="reconcile-table">
                    <tr>
                        <td class="muted">Opening Float</td>
                        <td class="num">{{ $symbol }}{{ number_format($openingFloat, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="muted">Expected Cash Sales</td>
                        <td class="num">{{ $symbol }}{{ number_format($expectedSales, 2) }}</td>
                    </tr>
                    <tr class="total-row">
                        <td>Total Expected Cash</td>
                        <td class="num">{{ $symbol }}{{ number_format($expectedTotal, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="muted">Counted Bills Total</td>
                        <td class="num">{{ $symbol }}{{ number_format($totalBills, 2) }}</td>
                    </tr>
                    <tr>
                        <td class="muted">Counted Coins Total</td>
                        <td class="num">{{ $symbol }}{{ number_format($totalCoins, 2) }}</td>
                    </tr>
                    <tr class="total-row">
                        <td>Total Counted Cash</td>
                        <td class="num">{{ $symbol }}{{ number_format($totalCountedCash, 2) }}</td>
                    </tr>
                    <tr class="variance-row">
                        <td>Variance (Over / Short)</td>
                        <td class="num {{ $varianceStatus === 'exact' ? 'variance-exact' : ($varianceStatus === 'over' ? 'variance-over' : 'variance-short') }}">
                            @if($variance > 0)
                                +{{ $symbol }}{{ number_format($variance, 2) }} (OVER)
                            @elseif($variance < 0)
                                -{{ $symbol }}{{ number_format(abs($variance), 2) }} (SHORT)
                            @else
                                {{ $symbol }}0.00 (BALANCED)
                            @endif
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="signatures">
        <tr>
            <td>
                <div class="sig-line"></div>
                <div class="sig-label">Cashier Signature ({{ $store['cashier_name'] ?: 'Name' }})</div>
            </td>
            <td>
                <div class="sig-line"></div>
                <div class="sig-label">Supervisor Signature ({{ $store['supervisor_name'] ?: 'Name' }})</div>
            </td>
        </tr>
    </table>

    <div class="footer">Generated free at venqore.com/tools — Till Reconciliation & Cash Drawer Count Sheet</div>
</body>
</html>
