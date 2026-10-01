@php
    $decimals = (int) \App\Helpers\SettingsHelper::getPrintDecimals(2);
    $currencySymbol = \App\Helpers\SettingsHelper::get('currency_symbol') ?? '$';
    $showInvoiceNumber = \App\Helpers\SettingsHelper::isInvoiceNumberEnabled();
    $businessName = \App\Helpers\SettingsHelper::get('business_name') 
        ?? \App\Helpers\SettingsHelper::get('store_name') 
        ?? (app()->bound('current.tenant') ? app('current.tenant')->name : null)
        ?? 'Store';
    $businessAddress = \App\Helpers\SettingsHelper::get('business_address') 
        ?? \App\Helpers\SettingsHelper::get('address')
        ?? (app()->bound('current.tenant') ? app('current.tenant')->address : null)
        ?? '';
    $businessPhone = \App\Helpers\SettingsHelper::get('business_phone') 
        ?? \App\Helpers\SettingsHelper::get('phone')
        ?? (app()->bound('current.tenant') ? app('current.tenant')->phone : null)
        ?? '';
    $businessEmail = \App\Helpers\SettingsHelper::get('business_email') 
        ?? \App\Helpers\SettingsHelper::get('email')
        ?? (app()->bound('current.tenant') ? app('current.tenant')->email : null)
        ?? '';
@endphp
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $showInvoiceNumber ? 'Invoice ' . $invoice->invoice_number : 'Invoice' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            padding: 20px;
            max-width: 300px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
        }

        .logo {
            font-size: 24px;
            font-weight: bold;
            color: rgb(0, 212, 255);
            margin-bottom: 5px;
        }

        .company-info {
            font-size: 10px;
            margin-top: 5px;
        }

        .invoice-info {
            margin: 15px 0;
            font-size: 11px;
        }

        .invoice-info div {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
        }

        .items-table {
            width: 100%;
            margin: 15px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
        }

        .item-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }

        .item-name {
            flex: 1;
        }

        .item-qty,
        .item-price,
        .item-total {
            text-align: right;
            min-width: 50px;
        }

        .item-price {
            color: rgb(34, 197, 94);
            font-weight: bold;
        }

        .totals {
            margin-top: 15px;
            border-top: 2px solid #000;
            padding-top: 10px;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
            font-size: 13px;
        }

        .grand-total {
            font-size: 16px;
            font-weight: bold;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px solid #000;
        }

        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            border-top: 2px dashed #000;
            padding-top: 10px;
        }

        .thank-you {
            font-size: 14px;
            font-weight: bold;
            margin: 10px 0;
        }

        @media print {
            body {
                padding: 0;
            }

            .no-print {
                display: none;
            }
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="logo">{{ $businessName }}</div>
        <div class="company-info">
            @if($businessAddress){{ $businessAddress }}<br>@endif
            @if($businessPhone)Phone: {{ $businessPhone }}<br>@endif
            @if($businessEmail){{ $businessEmail }}@endif
        </div>
    </div>

    <div class="invoice-info">
        @if($showInvoiceNumber)
        <div>
            <span>Invoice #:</span>
            <span><strong>{{ $invoice->invoice_number }}</strong></span>
        </div>
        @endif
        <div>
            <span>Date:</span>
            <span>{{ $invoice->date->format('d/m/Y H:i') }}</span>
        </div>
        @if($invoice->party)
            <div>
                <span>Customer:</span>
                <span>{{ $invoice->party->name }}</span>
            </div>
        @endif
        @if($invoice->user)
            <div>
                <span>Cashier:</span>
                <span>{{ $invoice->user->name }}</span>
            </div>
        @endif
    </div>

    <div class="items-table">
        <div class="item-row" style="font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 5px;">
            <span class="item-name">ITEM</span>
            <span class="item-qty">QTY</span>
            <span class="item-price">PRICE</span>
            <span class="item-total">TOTAL</span>
        </div>

        @foreach($invoice->items as $item)
            <div class="item-row">
                <span class="item-name">{{ $item->product->name }}</span>
                <span class="item-qty">{{ \App\Helpers\SettingsHelper::formatQuantity($item->quantity, $decimals) }}</span>
                <span class="item-price">{{ $currencySymbol }}{{ number_format($item->unit_price, $decimals) }}</span>
                <span class="item-total">{{ $currencySymbol }}{{ number_format($item->total, $decimals) }}</span>
            </div>
        @endforeach
    </div>

    <div class="totals">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>{{ $currencySymbol }}{{ number_format($invoice->subtotal, $decimals) }}</span>
        </div>

        @if($invoice->discount_amount > 0)
            <div class="total-row">
                <span>Discount:</span>
                <span>-{{ $currencySymbol }}{{ number_format($invoice->discount_amount, $decimals) }}</span>
            </div>
        @endif

        @if($invoice->tax_amount > 0)
            <div class="total-row">
                <span>Tax:</span>
                <span>{{ $currencySymbol }}{{ number_format($invoice->tax_amount, $decimals) }}</span>
            </div>
        @endif

        <div class="total-row grand-total">
            <span>GRAND TOTAL:</span>
            <span>{{ $currencySymbol }}{{ number_format($invoice->total_amount, $decimals) }}</span>
        </div>
    </div>

    <div class="footer">
        <div class="thank-you">THANK YOU FOR YOUR BUSINESS!</div>
        <div style="margin-top: 10px; font-size: 11px; color: #64748b;">
            Powered by <a href="https://venqore.com?utm_source=invoice_footer" target="_blank" rel="noopener" style="color: #4f46e5; text-decoration: none; font-weight: bold;">VenQore</a>
        </div>
    </div>

    <div class="no-print" style="margin-top: 20px; text-align: center;">
        <button onclick="window.print()"
            style="background: rgb(0, 212, 255); color: white; border: none; padding: 10px 20px; font-size: 14px; cursor: pointer; border-radius: 5px;">
            Print Receipt
        </button>
        <button onclick="window.close()"
            style="background: #ccc; color: #000; border: none; padding: 10px 20px; font-size: 14px; cursor: pointer; border-radius: 5px; margin-left: 10px;">
            Close
        </button>
    </div>
</body>

</html>