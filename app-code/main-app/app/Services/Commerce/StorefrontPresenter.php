<?php

namespace App\Services\Commerce;

use App\Models\Commerce\Storefront;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/** Public projections: only allow-listed fields ever leave the server. Never serialize internal models. */
class StorefrontPresenter
{
    public static function publicUrl(Storefront $s): string
    {
        return url('/shop/' . $s->slug);
    }

    public static function mediaUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }
        return Storage::disk('public')->url($path);
    }

    public static function qrSvg(string $url): string
    {
        $writer = new Writer(new ImageRenderer(new RendererStyle(220, 1), new SvgImageBackEnd()));
        return $writer->writeString($url);
    }

    public static function cityLine(Storefront $s): ?string
    {
        if (! $s->city_id) {
            return null;
        }
        $r = DB::table('commerce_cities as c')->join('commerce_countries as k', 'k.id', '=', 'c.country_id')
            ->where('c.id', $s->city_id)->first(['c.name as city', 'k.name as country']);
        return $r ? $r->city . ', ' . $r->country : null;
    }

    public static function card(Storefront $s): array
    {
        return [
            'slug' => $s->slug,
            'name' => $s->display_name,
            'logo_url' => self::mediaUrl($s->logo_path),
            'address' => $s->address_line,
            'city' => self::cityLine($s),
            'open_now' => OpeningHours::isOpenNow($s->opening_hours, $s->timezone),
            'pickup' => (bool) $s->supports_pickup,
            'delivery' => (bool) $s->supports_delivery,
            'url' => self::publicUrl($s),
        ];
    }

    public static function publicStore(Storefront $s): array
    {
        return self::card($s) + [
            'description' => $s->description,
            'phone' => $s->phone,
            'email' => $s->email,
            'map_url' => $s->map_url,
            'opening_hours' => $s->opening_hours,
            'timezone' => $s->timezone,
            'currency_symbol' => $s->currency_symbol,
            'currency_code' => $s->currency_code,
            'delivery_charge' => (float) $s->delivery_charge,
            'delivery_note' => $s->delivery_note,
            'min_order_amount' => (float) $s->min_order_amount,
            'payments' => [
                'cod' => (bool) $s->accept_cod,
                'pickup' => (bool) $s->accept_pickup_payment,
                'bank' => (bool) $s->accept_bank_transfer,
                'bank_instructions' => $s->accept_bank_transfer ? $s->bank_instructions : null,
            ],
            'accepting_orders' => $s->isAcceptingOrders(),
        ];
    }
}
