<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>{{ $restaurantName }} — QR Menu</title>
    <style>
        @page {
            margin: 0;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: {{ $themeConfig['bg_color'] }};
            color: {{ $themeConfig['text_color'] }};
            box-sizing: border-box;
            width: 100%;
            height: 100%;
        }
        .container {
            width: 100%;
            height: 100%;
            padding: {{ $preset === 'sticker_3x3' ? '12px' : '24px' }};
            box-sizing: border-box;
            display: table;
            table-layout: fixed;
        }
        .card {
            background-color: {{ $themeConfig['card_bg'] }};
            border-radius: 16px;
            padding: {{ $preset === 'sticker_3x3' ? '16px 12px' : '28px 20px' }};
            text-align: center;
            box-sizing: border-box;
            border: 2px solid {{ $themeConfig['accent_color'] }};
        }
        .table-badge {
            display: inline-block;
            background-color: {{ $themeConfig['accent_color'] }};
            color: #ffffff;
            font-size: {{ $preset === 'sticker_3x3' ? '9pt' : '11pt' }};
            font-weight: bold;
            padding: 4px 14px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }
        .restaurant-name {
            font-size: {{ $preset === 'sticker_3x3' ? '16pt' : '22pt' }};
            font-weight: 800;
            margin: 0 0 4px 0;
            line-height: 1.2;
            color: {{ $themeConfig['text_color'] }};
        }
        .tagline {
            font-size: {{ $preset === 'sticker_3x3' ? '9pt' : '11pt' }};
            opacity: 0.85;
            margin: 0 0 16px 0;
            font-style: italic;
        }
        .qr-wrapper {
            background: #ffffff;
            padding: {{ $preset === 'sticker_3x3' ? '10px' : '16px' }};
            border-radius: 12px;
            display: inline-block;
            margin: 0 auto 14px auto;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .qr-image {
            width: {{ $preset === 'sticker_3x3' ? '110px' : ($preset === 'standee_5x7' ? '180px' : '150px') }};
            height: {{ $preset === 'sticker_3x3' ? '110px' : ($preset === 'standee_5x7' ? '180px' : '150px') }};
            display: block;
        }
        .instructions {
            font-size: {{ $preset === 'sticker_3x3' ? '8pt' : '10pt' }};
            font-weight: 600;
            margin: 0 0 6px 0;
            line-height: 1.3;
        }
        .menu-link {
            font-size: {{ $preset === 'sticker_3x3' ? '7pt' : '8.5pt' }};
            opacity: 0.7;
            word-break: break-all;
            margin: 0;
            font-family: monospace;
        }
        .menu-items-preview {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px dashed {{ $themeConfig['accent_color'] }};
            text-align: left;
        }
        .menu-item-row {
            margin-bottom: 6px;
            font-size: 8.5pt;
        }
        .item-name {
            font-weight: bold;
        }
        .item-price {
            float: right;
            font-weight: bold;
            color: {{ $themeConfig['accent_color'] }};
        }
        .item-desc {
            font-size: 7.5pt;
            opacity: 0.75;
            display: block;
        }
        .clear {
            clear: both;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="card">
            @if(!empty($tableNumber))
                <div class="table-badge">Table {{ $tableNumber }}</div>
            @endif

            <h1 class="restaurant-name">{{ $restaurantName }}</h1>
            @if(!empty($tagline))
                <p class="tagline">{{ $tagline }}</p>
            @endif

            <div class="qr-wrapper">
                @if($qrImageBase64)
                    <img src="{{ $qrImageBase64 }}" class="qr-image" alt="QR Code Menu" />
                @else
                    <div style="width: 140px; height: 140px; line-height: 140px; background: #eee; color: #333; font-size: 10px; border-radius: 8px;">
                        QR Preview
                    </div>
                @endif
            </div>

            @if(!empty($instructionText))
                <p class="instructions">{{ $instructionText }}</p>
            @endif
            <p class="menu-link">{{ $menuUrl }}</p>

            @if(!empty($menuItems) && count($menuItems) > 0 && $preset !== 'sticker_3x3')
                <div class="menu-items-preview">
                    @foreach(array_slice($menuItems, 0, 5) as $item)
                        <div class="menu-item-row">
                            @if(!empty($item['price']))
                                <span class="item-price">{{ $item['price'] }}</span>
                            @endif
                            <span class="item-name">{{ $item['name'] }}</span>
                            @if(!empty($item['description']))
                                <span class="item-desc">{{ $item['description'] }}</span>
                            @endif
                            <div class="clear"></div>
                        </div>
                    @endforeach
                </div>
            @endif
        </div>
    </div>
</body>
</html>
