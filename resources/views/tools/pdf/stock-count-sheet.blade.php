<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Stock Count Sheet - {{ $store['name'] ?? 'Audit' }}</title>
    <style>
        @page { margin: 15mm 12mm; }
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

        .meta-table td { padding: 1mm 0; }
        .meta-table .label { color: #6b6b7a; padding-right: 3mm; }

        .category-header { background: #f1f1f5; font-weight: bold; padding: 2.5mm 2mm; font-size: 10px; border: 0.5px solid #c8c8d4; }

        .items-table { margin-top: 4mm; }
        .items-table th {
            text-align: left; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px;
            padding: 2.5mm 2mm; border: 0.5px solid #1c1c28; background: #e8e8ee; color: #1c1c28;
        }
        .items-table td { padding: 3mm 2mm; border: 0.5px solid #c8c8d4; }
        .items-table .num { text-align: right; }

        .write-box { height: 5mm; border-bottom: 1px dotted #999; }

        .sign-block { margin-top: 12mm; width: 100%; }
        .sign-line { border-top: 1px solid #1c1c28; width: 60mm; margin-top: 10mm; padding-top: 1.5mm; font-size: 9px; }

        .footer { margin-top: 10mm; padding-top: 3mm; border-top: 0.5px solid #e2e2e8; font-size: 8px; color: #9a9aa8; text-align: center; }
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
                @if(!empty($store['location']))
                    <div class="muted">Location / Section: {{ $store['location'] }}</div>
                @endif
            </td>
            <td style="width:45%;" class="right">
                <div class="sheet-title">STOCK COUNT SHEET</div>
                <table class="meta-table" style="margin-left:auto; margin-top:2mm;">
                    <tr><td class="label right">Ref #:</td><td class="bold">{{ $store['reference_no'] ?? '—' }}</td></tr>
                    <tr><td class="label right">Audit Date:</td><td>{{ $store['audit_date'] ?? date('Y-m-d') }}</td></tr>
                    <tr><td class="label right">Auditor:</td><td>{{ $store['auditor_name'] ?? '________________' }}</td></tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width:5%;">#</th>
                <th style="width:20%;">SKU / Barcode</th>
                <th style="width:38%;">Item Description</th>
                <th style="width:7%; text-align:center;">Unit</th>
                @if($showExpected)
                    <th style="width:10%; text-align:right;">System Qty</th>
                @endif
                <th style="width:12%; text-align:center;">Physical Count</th>
                <th style="width:15%; text-align:center;">Discrepancy / Notes</th>
            </tr>
        </thead>
        <tbody>
            @php $count = 1; @endphp
            @foreach($groupedItems as $groupName => $groupItems)
                @if(count($groupedItems) > 1 || $groupName !== 'All Items')
                    <tr>
                        <td colspan="{{ $showExpected ? 7 : 6 }}" class="category-header">
                            {{ $groupName }} ({{ count($groupItems) }} items)
                        </td>
                    </tr>
                @endif
                @foreach($groupItems as $item)
                    <tr>
                        <td class="center muted">{{ $count++ }}</td>
                        <td class="bold">{{ $item['sku'] ?: '—' }}</td>
                        <td>{{ $item['name'] }}</td>
                        <td class="center muted">{{ $item['unit'] }}</td>
                        @if($showExpected)
                            <td class="num bold">{{ $item['expected_qty'] !== null ? rtrim(rtrim(number_format($item['expected_qty'], 2), '0'), '.') : '—' }}</td>
                        @endif
                        <td></td>
                        <td></td>
                    </tr>
                @endforeach
            @endforeach
        </tbody>
    </table>

    <table class="sign-block">
        <tr>
            <td style="width:50%;">
                <div class="sign-line">
                    Auditor Signature
                    <div class="muted">Date: ____________________</div>
                </div>
            </td>
            <td style="width:50%;" class="right">
                <div style="display:inline-block; text-align:left;">
                    <div class="sign-line">
                        Manager Sign-off / Verification
                        <div class="muted">Date: ____________________</div>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="footer">Generated free at venqore.com/tools — Stock Count Sheet (Total Items: {{ $totalItems }})</div>
</body>
</html>
