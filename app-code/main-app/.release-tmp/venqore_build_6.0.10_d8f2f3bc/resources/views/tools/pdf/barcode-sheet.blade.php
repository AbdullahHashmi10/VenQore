{{--
    Barcode print sheet — VenQore free tools.

    Two layouts driven by $isThermal:
      - Thermal: one label per page, page size == label size. The printer
        feeds one label per page. No margins, no grid.
      - Sheet:  a fixed grid of labels on A4/Letter at exact mm offsets.

    All dimensions are in mm and dompdf is given the paper size explicitly
    so nothing is scaled. Print at 100% / "Actual size" — never "Fit to page".
--}}
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Barcode Labels — {{ $value }}</title>
    <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; font-family: sans-serif; }

        @if($isThermal)
            .label {
                width: {{ $config['label_w'] }}mm;
                height: {{ $config['label_h'] }}mm;
                box-sizing: border-box;
                padding: 1.5mm;
                text-align: center;
                page-break-after: always;
                overflow: hidden;
            }
            .label:last-child { page-break-after: auto; }
            .label svg { max-width: 100%; max-height: 100%; }
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
                padding: 1mm;
                text-align: center;
                overflow: hidden;
                page-break-inside: avoid;
            }
            .label svg { max-width: 100%; max-height: 100%; }
            .row-break { clear: both; }
        @endif
    </style>
</head>
<body>
@php
    $perPage = $isThermal ? 1 : (($config['cols'] ?? 1) * ($config['rows'] ?? 1));
    $cols    = $config['cols'] ?? 1;
@endphp

@if($isThermal)
    @for($i = 0; $i < $quantity; $i++)
        <div class="label">{!! $svg !!}</div>
    @endfor
@else
    @php $printed = 0; @endphp
    @while($printed < $quantity)
        <div class="sheet">
            @for($i = 0; $i < $perPage && $printed < $quantity; $i++)
                <div class="label">{!! $svg !!}</div>
                @php $printed++; @endphp
                @if(($i + 1) % $cols === 0)
                    <div class="row-break"></div>
                @endif
            @endfor
        </div>
        @if($printed < $quantity)
            <div style="page-break-after: always;"></div>
        @endif
    @endwhile
@endif
</body>
</html>
