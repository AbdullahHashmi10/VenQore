{{--
    Barcode inventory-label print sheet — VenQore free tools.

    Same thermal-vs-grid split as barcode-sheet.blade.php / price-tag-sheet.blade.php.
    Unlike price-tag-sheet, the barcode is the PRIMARY content here (always
    rendered, human-readable value included) and price is a small optional
    secondary line.
--}}
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Barcode Labels Sheet</title>
    <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; font-family: sans-serif; }

        .label-card {
            box-sizing: border-box;
            overflow: hidden;
            background: #ffffff;
            text-align: center;
        }

        .prod-name {
            font-size: 7.5pt;
            font-weight: bold;
            color: #1e293b;
            line-height: 1.1;
            margin-bottom: 0.5mm;
            word-wrap: break-word;
            max-height: 2.2em;
            overflow: hidden;
        }

        .barcode-container { margin-top: 0.5mm; }
        .barcode-container svg { max-width: 100%; max-height: 10mm; }

        .price-line {
            font-size: 8pt;
            font-weight: 900;
            color: #0f172a;
            margin-top: 0.5mm;
        }

        @if($isThermal)
            .label {
                width: {{ $config['label_w'] }}mm;
                height: {{ $config['label_h'] }}mm;
                box-sizing: border-box;
                padding: 1.5mm;
                page-break-after: always;
                overflow: hidden;
            }
            .label:last-child { page-break-after: auto; }
        @else
            .sheet {
                padding-top: {{ $config['margin_top'] ?? 0 }}mm;
                padding-left: {{ $config['margin_left'] ?? 0 }}mm;
                box-sizing: border-box;
            }
            .label {
                width: {{ $config['label_w'] }}mm;
                height: {{ $config['label_h'] }}mm;
                float: left;
                box-sizing: border-box;
                padding: 1.2mm;
                border: 0.2mm dashed #e2e8f0;
                overflow: hidden;
                page-break-inside: avoid;
            }
            .row-break { clear: both; }
        @endif
    </style>
</head>
<body>
@php
    $perPage = $isThermal ? 1 : (($config['cols'] ?? 1) * ($config['rows'] ?? 1));
    $cols    = $config['cols'] ?? 1;
    $total   = count($labels);
@endphp

@php
    $renderLabel = function ($label) use ($symbol) {
        echo '<div class="label-card">';
        echo '<div class="prod-name">' . e($label['name']) . '</div>';
        if (!empty($label['svg'])) {
            echo '<div class="barcode-container">' . $label['svg'] . '</div>';
        }
        if ($label['price'] !== null) {
            $sym = $symbol ?: '';
            echo '<div class="price-line">' . e($sym) . number_format($label['price'], 2) . '</div>';
        }
        echo '</div>';
    };
@endphp

@if($isThermal)
    @foreach($labels as $label)
        <div class="label">@php $renderLabel($label); @endphp</div>
    @endforeach
@else
    @php
        $printed = 0;
        while ($printed < $total) {
            echo '<div class="sheet">';
            for ($i = 0; $i < $perPage && $printed < $total; $i++) {
                echo '<div class="label">';
                $renderLabel($labels[$printed]);
                echo '</div>';
                $printed++;
                if (($i + 1) % $cols === 0) {
                    echo '<div class="row-break"></div>';
                }
            }
            echo '</div>';
            if ($printed < $total) {
                echo '<div style="page-break-after: always;"></div>';
            }
        }
    @endphp
@endif
</body>
</html>
