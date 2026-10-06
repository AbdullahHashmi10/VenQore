@php
$decimals = max(0, min(4, (int) ($settings['decimal_places'] ?? 2)));
$currencySymbol = $settings['currency_symbol'] ?? 'Rs';
@endphp
<x-mail::message>
# Thank you for your purchase!

Hi {{ $sale->customer->name ?? 'Customer' }},

Thank you for shopping at **{{ $settings['business_name'] ?? $settings['store_name'] ?? 'VENQORE' }}**.

Your order **#{{ $sale->reference_number }}** has been processed successfully. Please find your receipt attached to
this email.

**Order Summary:**
<x-mail::table>
    | Item | Qty | Price | Total |
    | :--- | :---: | :---: | :---: |
    @foreach($sale->items as $item)
        | {{ str_replace(['|', "\n", "\r"], ' ', ($item->product->name ?? $item->item_name ?? 'Item') . (!empty($item->modifiers) ? ' (' . collect($item->modifiers)->pluck('name')->filter()->implode(', ') . ')' : '')) }} | {{ number_format($item->quantity, $decimals) }} | {{ $currencySymbol }} {{ number_format($item->unit_price, $decimals) }} | {{ $currencySymbol }} {{ number_format($item->line_total ?? $item->subtotal ?? 0, $decimals) }} |
    @endforeach
    | **Total** | | | **{{ $currencySymbol }} {{ number_format($sale->invoice_total ?? $sale->total ?? 0, $decimals) }}** |
</x-mail::table>

If you have any questions, feel free to contact us at {{ $settings['business_phone'] ?? $settings['store_phone'] ?? '' }}.

Thanks,<br>
{{ $settings['business_name'] ?? $settings['store_name'] ?? config('app.name') }}
</x-mail::message>
