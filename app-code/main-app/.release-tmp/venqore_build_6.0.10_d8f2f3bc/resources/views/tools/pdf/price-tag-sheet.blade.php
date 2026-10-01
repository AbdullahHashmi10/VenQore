{{--
    Price tag print sheet — VenQore free tools.

    Two layouts driven by $isThermal:
      - Thermal: one shelf tag per page, page size == label size.
      - Sheet: a fixed grid of tags on A4/Letter at exact mm offsets.
--}}
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Price Tags Sheet</title>
    <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; font-family: sans-serif; }

        .tag-card {
            position: relative;
            box-sizing: border-box;
            overflow: hidden;
            background: #ffffff;
        }

        .badge-pill {
            position: absolute;
            top: 1.5mm;
            right: 1.5mm;
            background: #ef4444;
            color: #ffffff;
            font-size: 7pt;
            font-weight: bold;
            padding: 0.5mm 1.5mm;
            border-radius: 2mm;
            text-transform: uppercase;
            line-height: 1;
            z-index: 10;
        }

        .prod-name {
            font-size: 8.5pt;
            font-weight: bold;
            color: #1e293b;
            line-height: 1.1;
            margin-bottom: 1mm;
            word-wrap: break-word;
            max-height: 2.3em;
            overflow: hidden;
        }

        .price-box {
            margin-top: 1mm;
        }

        .was-price {
            font-size: 8pt;
            color: #64748b;
            text-decoration: line-through;
            margin-right: 2mm;
            display: inline-block;
        }

        .now-price {
            font-size: 14pt;
            font-weight: 900;
            color: #0f172a;
            display: inline-block;
        }

        .sale-active .now-price {
            color: #dc2626;
        }

        .barcode-container {
            margin-top: 1mm;
            text-align: center;
        }

        .barcode-container svg {
            max-width: 100%;
            max-height: 8mm;
        }

        @if($isThermal)
            .label {
                width: {{ $config['label_w'] }}mm;
                height: {{ $config['label_h'] }}mm;
                box-sizing: border-box;
                padding: 2mm;
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
                padding: 1.5mm;
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
    $totalTags = count($tags);
@endphp

@if($isThermal)
    @foreach($tags as $tag)
        <div class="label">
            <div class="tag-card {{ !empty($tag['was_price']) ? 'sale-active' : '' }}">
                @if(!empty($tag['badge']))
                    <div class="badge-pill">{{ $tag['badge'] }}</div>
                @endif
                <div class="prod-name" style="{{ !empty($tag['badge']) ? 'padding-right: 14mm;' : '' }}">
                    {{ $tag['name'] }}
                </div>
                <div class="price-box">
                    @if(!empty($tag['was_price']))
                        <span class="was-price">{{ $currencySymbol }}{{ $tag['was_price'] }}</span>
                    @endif
                    <span class="now-price">{{ $currencySymbol }}{{ $tag['price'] }}</span>
                </div>
                @if(!empty($tag['svg']))
                    <div class="barcode-container">
                        {!! $tag['svg'] !!}
                    </div>
                @endif
            </div>
        </div>
    @endforeach
@else
    @php $printed = 0; @endphp
    @while($printed < $totalTags)
        <div class="sheet">
            @for($i = 0; $i < $perPage && $printed < $totalTags; $i++)
                @php $tag = $tags[$printed]; @endphp
                <div class="label">
                    <div class="tag-card {{ !empty($tag['was_price']) ? 'sale-active' : '' }}">
                        @if(!empty($tag['badge']))
                            <div class="badge-pill">{{ $tag['badge'] }}</div>
                        @endif
                        <div class="prod-name" style="{{ !empty($tag['badge']) ? 'padding-right: 14mm;' : '' }}">
                            {{ $tag['name'] }}
                        </div>
                        <div class="price-box">
                            @if(!empty($tag['was_price']))
                                <span class="was-price">{{ $currencySymbol }}{{ $tag['was_price'] }}</span>
                            @endif
                            <span class="now-price">{{ $currencySymbol }}{{ $tag['price'] }}</span>
                        </div>
                        @if(!empty($tag['svg']))
                            <div class="barcode-container">
                                {!! $tag['svg'] !!}
                            </div>
                        @endif
                    </div>
                </div>
                @php $printed++; @endphp
                @if(($i + 1) % $cols === 0)
                    <div class="row-break"></div>
                @endif
            @endfor
        </div>
        @if($printed < $totalTags)
            <div style="page-break-after: always;"></div>
        @endif
    @endwhile
@endif
</body>
</html>
