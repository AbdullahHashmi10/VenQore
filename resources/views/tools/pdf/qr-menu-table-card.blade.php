{{--
    QR Menu table card — VenQore free tools.

    One card per page, repeated $copies times (one per table). Small
    flat table-card scale (100mm x 150mm), similar physical footprint to
    PriceTagService's thermal-preset cards.
--}}
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>{{ $menu->restaurant_name }} — Table Card</title>
    <style>
        @page { margin: 0; }
        body { margin: 0; padding: 0; font-family: sans-serif; }

        .card {
            width: 100mm;
            height: 150mm;
            box-sizing: border-box;
            padding: 8mm;
            page-break-after: always;
            text-align: center;
            border: 0.3mm solid #e2e8f0;
        }
        .card:last-child { page-break-after: auto; }

        .restaurant-name {
            font-size: 16pt;
            font-weight: 900;
            color: #0f172a;
            margin-top: 4mm;
            margin-bottom: 6mm;
        }

        .qr-wrap {
            padding: 6mm;
            border: 1mm solid {{ $menu->theme_color }};
            border-radius: 4mm;
            display: inline-block;
        }

        .qr-wrap svg {
            width: 55mm;
            height: 55mm;
        }

        .cta {
            font-size: 13pt;
            font-weight: 800;
            color: {{ $menu->theme_color }};
            margin-top: 6mm;
            text-transform: uppercase;
            letter-spacing: 0.5mm;
        }

        .sub {
            font-size: 8.5pt;
            color: #64748b;
            margin-top: 2mm;
        }
    </style>
</head>
<body>
@for($c = 0; $c < $copies; $c++)
    <div class="card">
        <div class="restaurant-name">{{ $menu->restaurant_name }}</div>
        <div class="qr-wrap">
            {!! $qrSvg !!}
        </div>
        <div class="cta">Scan for our menu</div>
        <div class="sub">Point your phone camera at the code — no app needed.</div>
    </div>
@endfor
</body>
</html>
