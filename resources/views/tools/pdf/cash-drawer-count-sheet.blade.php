<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Cash Drawer Count Sheet - {{ $store['name'] ?? 'Till Reconciliation' }}</title>
    <style>
        @page { margin: 15mm 12mm 20mm 12mm; }
        body { margin: 0; font-family: 'Helvetica', Arial, sans-serif; font-size: 10px; color: #1c1c28; }
        table { border-collapse: collapse; width: 100%; }
        .muted { color: #6b6b7a; }
        .right { text-align: right; }
        .center { text-align: center; }
        .bold { font-weight: bold; }

        .header { width: 100%; margin-bottom: 6mm; border-bottom: 1.5px solid #1c1c28; padding-bottom: 4mm; }
        .header td { vertical-align: top; }
        .store-logo { max-height: 16mm; max-width: 40mm; margin-bottom: 2mm; }
        .store-name { font-size: 15px; font-weight: bold; }
        .sheet-title { font-size: 20px; font-weight: bold; letter-spacing: 1px; }

        .register-block { margin-top: 8mm; page-break-inside: avoid; }
        .register-block.first { margin-top: 0; }
        .register-title { font-size: 13px; font-weight: bold; background: #f1f1f5; border: 0.5px solid #c8c8d4; padding: 2.5mm 3mm; }

        .meta-table { margin-top: 3mm; }
        .meta-table td { padding: 1.2mm 2mm; border: 0.5px solid #c8c8d4; }
        .meta-table .label { color: #6b6b7a; width: 22%; }
        .meta-table .fill { border-bottom: 1px dotted #999; }

        .denom-table { margin-top: 4mm; }
        .denom-table th {
            text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px;
            padding: 2.2mm 2mm; border: 0.5px solid #1c1c28; background: #e8e8ee; color: #1c1c28;
        }
        .denom-table td { padding: 3mm 2mm; border: 0.5px solid #c8c8d4; height: 5.5mm; }
        .denom-table .num { text-align: right; }
        .denom-table .write { border-bottom: 1px dotted #999; }
        .denom-table .total-row td { font-weight: bold; background: #f7f7fa; }

        .variance-table { margin-top: 4mm; }
        .variance-table td { padding: 2.5mm 2mm; border: 0.5px solid #c8c8d4; }
        .variance-table .label { width: 45%; color: #333; }
        .variance-table .write-line { border-bottom: 1px dotted #999; height: 5mm; }
        .variance-table .formula { font-size: 8px; color: #9a9aa8; }

        .sign-block { margin-top: 5mm; width: 100%; }
        .sign-line { border-top: 1px solid #1c1c28; width: 60mm; margin-top: 9mm; padding-top: 1.5mm; font-size: 9px; }

        .notes-box { margin-top: 6mm; }
        .notes-box .heading { font-weight: bold; font-size: 10px; margin-bottom: 1.5mm; }
        .notes-lines div { border-bottom: 1px dotted #999; height: 6mm; }

        .footer-note { margin-top: 8mm; padding-top: 3mm; border-top: 0.5px solid #e2e2e8; font-size: 8px; color: #9a9aa8; text-align: center; }
    </style>
</head>
<body>
    <table class="header">
        <tr>
            <td style="width:55%;">
                @if(!empty($store['logo_base64']))
                    <img class="store-logo" src="{{ $store['logo_base64'] }}" />
                @endif
                <div class="store-name">{{ $store['name'] }}</div>
                <div class="muted">Currency: {{ $currency }} ({{ $currencySymbol }})</div>
            </td>
            <td style="width:45%;" class="right">
                <div class="sheet-title">CASH DRAWER COUNT SHEET</div>
                <div class="muted">End-of-Shift Till Reconciliation</div>
            </td>
        </tr>
    </table>

    @foreach($registers as $i => $register)
        <div class="register-block {{ $i === 0 ? 'first' : '' }}">
            <div class="register-title">{{ $register['name'] }}</div>

            <table class="meta-table">
                <tr>
                    <td class="label">Date</td>
                    <td class="fill">{{ $register['date'] ?: '________________' }}</td>
                    <td class="label">Shift</td>
                    <td class="fill">{{ $register['shift'] ?: '________________' }}</td>
                </tr>
                <tr>
                    <td class="label">Counted By</td>
                    <td class="fill">{{ $register['counted_by'] ?: '________________' }}</td>
                    <td class="label">Verified By (Manager)</td>
                    <td class="fill">{{ $register['verified_by'] ?: '________________' }}</td>
                </tr>
            </table>

            <table class="denom-table">
                <thead>
                    <tr>
                        <th style="width:34%;">Denomination</th>
                        <th style="width:16%; text-align:right;">Value</th>
                        <th style="width:20%; text-align:center;">Count</th>
                        <th style="width:30%; text-align:center;">Subtotal (Value &times; Count)</th>
                    </tr>
                </thead>
                <tbody>
                    @if($denominations)
                        @foreach($denominations as $row)
                            <tr>
                                <td>{{ $row['label'] }}</td>
                                <td class="num">{{ $currencySymbol }}{{ rtrim(rtrim(number_format($row['value'], 2), '0'), '.') }}</td>
                                <td class="center write">&nbsp;</td>
                                <td class="center write">&nbsp;</td>
                            </tr>
                        @endforeach
                    @else
                        {{-- Generic fallback for currencies without a verified denomination list --}}
                        <tr>
                            <td>Coins (all denominations)</td>
                            <td class="num muted">—</td>
                            <td class="center write">&nbsp;</td>
                            <td class="center write">&nbsp;</td>
                        </tr>
                        <tr>
                            <td>Notes / Bills (all denominations)</td>
                            <td class="num muted">—</td>
                            <td class="center write">&nbsp;</td>
                            <td class="center write">&nbsp;</td>
                        </tr>
                    @endif
                    <tr class="total-row">
                        <td colspan="3">Grand Total Counted</td>
                        <td class="center write">&nbsp;</td>
                    </tr>
                </tbody>
            </table>

            <table class="variance-table">
                <tr>
                    <td class="label">Expected Amount (from POS / register)</td>
                    <td class="write-line">&nbsp;</td>
                </tr>
                <tr>
                    <td class="label">Total Counted (carried from above)</td>
                    <td class="write-line">&nbsp;</td>
                </tr>
                <tr>
                    <td class="label">
                        Over / Short
                        <div class="formula">Formula: Total Counted &minus; Expected Amount. Positive = over, negative = short.</div>
                    </td>
                    <td class="write-line">&nbsp;</td>
                </tr>
            </table>

            <table class="sign-block">
                <tr>
                    <td style="width:50%;">
                        <div class="sign-line">
                            Counted By Signature
                            <div class="muted">Time: ____________________</div>
                        </div>
                    </td>
                    <td style="width:50%;" class="right">
                        <div style="display:inline-block; text-align:left;">
                            <div class="sign-line">
                                Verified By Signature (Manager)
                                <div class="muted">Time: ____________________</div>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>
    @endforeach

    <div class="notes-box">
        <div class="heading">Notes / Discrepancy Explanation</div>
        <div class="notes-lines">
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>

    <div class="footer-note">Generated free at venqore.com/tools — Cash Drawer Count Sheet ({{ count($registers) }} register{{ count($registers) === 1 ? '' : 's' }})</div>

    <script type="text/php">
        if (isset($pdf)) {
            $font = $fontMetrics->getFont("Helvetica", "normal");
            $pdf->page_text(270, 815, "Page {PAGE_NUM} of {PAGE_COUNT}", $font, 8, array(0.55, 0.55, 0.6));
        }
    </script>
</body>
</html>
