<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Product Labels</title>
    <style>
        body {
            font-family: sans-serif;
            margin: 0;
            padding: 0;
        }

        .label-container {
            width: 100%;
        }

        .label {
            float: left;
            width:
                {{ $settings['width'] }}
                mm;
            height:
                {{ $settings['height'] }}
                mm;
            border: 1px dotted #ddd;
            margin: 1mm;
            padding: 2mm;
            box-sizing: border-box;
            text-align: center;
            overflow: hidden;
            page-break-inside: avoid;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        }

        .product-name {
            font-size: 9pt;
            font-weight: bold;
            margin-bottom: 4px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
        }

        .price {
            font-size: 11pt;
            font-weight: bold;
            margin-top: 4px;
        }

        .barcode-container {
            margin-top: 2px;
            width: 100%;
            text-align: center;
        }

        .barcode-img {
            max-width: 90%;
            height: 25px;
        }

        .sku {
            font-size: 7pt;
            color: #555;
            margin-top: 2px;
        }
    </style>
</head>

<body>
    @php
        $generator = new \Picqer\Barcode\BarcodeGeneratorPNG();
    @endphp

    <div class="label-container">
        @foreach($items as $item)
            @for($i = 0; $i < $item['quantity']; $i++)
                <div class="label">
                    @if($settings['show_name'])
                        <div class="product-name">{{ $item['product']->name }}</div>
                    @endif

                    @if($settings['show_barcode'])
                        <div class="barcode-container">
                            <img class="barcode-img"
                                src="data:image/png;base64,{{ base64_encode($generator->getBarcode($item['barcode'], $generator::TYPE_CODE_128)) }}">
                            <div class="sku">{{ $item['barcode'] }}</div>
                        </div>
                    @endif

                    @if($settings['show_price'])
                        <div class="price">${{ number_format($item['product']->price, 2) }}</div>
                    @endif
                </div>
            @endfor
        @endforeach
    </div>
</body>

</html>