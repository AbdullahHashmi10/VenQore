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
            | {{ $item->product->name }} | {{ $item->quantity }} | {{ number_format($item->unit_price, 2) }} |
            {{ number_format($item->subtotal, 2) }} |
        @endforeach
        | **Total** | | | **Rs {{ number_format($sale->total, 2) }}** |
    </x-mail::table>

    If you have any questions, feel free to contact us at {{ $settings['store_phone'] ?? '' }}.

    Thanks,<br>
    {{ $settings['store_name'] ?? config('app.name') }}
</x-mail::message>