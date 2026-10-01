@php
    $decimals = (int) \App\Helpers\SettingsHelper::getPrintDecimals(2);
    $currencySymbol = $settings['currency_symbol'] ?? \App\Helpers\SettingsHelper::get('currency_symbol') ?? 'Rs';
@endphp
<x-mail::message>
    # Thank you for your purchase!

    Hi {{ $sale->customer->name ?? 'Customer' }},

    Thank you for shopping at **{{ $settings['store_name'] ?? 'VENQORE' }}**.

    Your order **#{{ $sale->reference_number }}** has been processed successfully. Please find your receipt attached to
    this email.

    **Order Summary:**
    <x-mail::table>
        | Item | Qty | Price | Total |
        | :--- | :---: | :---: | :---: |
        @foreach($sale->items as $item)
            | {{ $item->product->name }} | {{ \App\Helpers\SettingsHelper::formatQuantity($item->quantity, $decimals) }} | {{ $currencySymbol }} {{ number_format($item->unit_price, $decimals) }} | {{ $currencySymbol }} {{ number_format($item->subtotal, $decimals) }} |
        @endforeach
        | **Total** | | | **{{ $currencySymbol }} {{ number_format($sale->total, $decimals) }}** |
    </x-mail::table>

    If you have any questions, feel free to contact us at {{ $settings['store_phone'] ?? '' }}.

    Thanks,<br>
    {{ $settings['store_name'] ?? config('app.name') }}
</x-mail::message>