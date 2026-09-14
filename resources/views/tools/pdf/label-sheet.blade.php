{{--
    Label sheet print — VenQore free tools.

    General-purpose TEXT label sheet (address labels, warning labels,
    folder/binder tabs, name badges, jar labels) — NOT a barcode and NOT a
    price tag. Each entry in $labels is a fully expanded, distinct label
    (row repeats and whole-sheet copies are already flattened server-side
    by LabelSheetService::build()).

    Two layouts driven by $isThermal:
      - Thermal: one label per page, page size == label size.
      - Sheet: a fixed grid of labels on A4/Letter at exact mm offsets.

    All dimensions are in mm and dompdf is given the paper size explicitly
    so nothing is scaled. Print at 100% / "Actual size" — never "Fit to page".
--}}
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Label Sheet</title>
    <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; font-family: sans-serif; }

        .label-card {
            box-sizing: border-box;
            overflow: hidden;
            background: #ffffff;
        }

        .label-line {
            font-size: 8.5pt;
            color: #1e293b;
            line-height: 1.25;
            word-wrap: break-word;
        }

        .label-line.line1 { font-size: 10pt; margin-bottom: 0.5mm; }
        .label-line.line1.bold { font-weight: 900; }
        .label-line.line3 { font-size: 7.5pt; color: #64748b; }

        .align-center { text-align: center; }
        .align-left { text-align: left; }

        @if($isThermal)
            .label {
                width: {{ $config['label_w'] }}mm;
                height: {{ $config['label_h'] }}mm;
                box-sizing: border-box;
                padding: 2mm;
                page-break-after: always;
                overflow: hidden;
                display: table;
            }
            .label:last-child { page-break-after: auto; }
            .label-inner { display: table-cell; vertical-align: middle; }
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
                padding: 1.5mm 2mm;
                border: 0.2mm dashed #e2e8f0;
                overflow: hidden;
                page-break-inside: avoid;
                display: table;
            }
            .label-inner { display: table-cell; vertical-align: middle; }
            .row-break { clear: both; }
        @endif
    </style>
</head>
<body>
@php
    $perPage = $isThermal ? 1 : (($config['cols'] ?? 1) * ($config['rows'] ?? 1));
    $cols    = $config['cols'] ?? 1;
    $totalLabels = count($labels);
@endphp

@if($isThermal)
    @foreach($labels as $label)
        <div class="label">
            <div class="label-inner label-card align-{{ $label['align'] }}">
                @if($label['line1'] !== '')
                    <div class="label-line line1 {{ $label['bold_first'] ? 'bold' : '' }}">{{ $label['line1'] }}</div>
                @endif
                @if($label['line2'] !== '')
                    <div class="label-line line2">{{ $label['line2'] }}</div>
                @endif
                @if($label['line3'] !== '')
                    <div class="label-line line3">{{ $label['line3'] }}</div>
                @endif
            </div>
        </div>
    @endforeach
@else
    @php $printed = 0; @endphp
    @while($printed < $totalLabels)
        <div class="sheet">
            @for($i = 0; $i < $perPage && $printed < $totalLabels; $i++)
                @php $label = $labels[$printed]; @endphp
                <div class="label">
                    <div class="label-inner label-card align-{{ $label['align'] }}">
                        @if($label['line1'] !== '')
                            <div class="label-line line1 {{ $label['bold_first'] ? 'bold' : '' }}">{{ $label['line1'] }}</div>
                        @endif
                        @if($label['line2'] !== '')
                            <div class="label-line line2">{{ $label['line2'] }}</div>
                        @endif
                        @if($label['line3'] !== '')
                            <div class="label-line line3">{{ $label['line3'] }}</div>
                        @endif
                    </div>
                </div>
                @php $printed++; @endphp
                @if(($i + 1) % $cols === 0)
                    <div class="row-break"></div>
                @endif
            @endfor
        </div>
        @if($printed < $totalLabels)
            <div style="page-break-after: always;"></div>
        @endif
    @endwhile
@endif
</body>
</html>
