<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $invoice->invoice_number }}</title>
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
            justify-between;
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
            justify-between;
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
            justify-between;
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
        <div class="logo">VENQORE</div>
        <div class="company-info">
            The Retail Operating System<br>
            Phone: +92 XXX XXXXXXX<br>
            www.venqore.com
        </div>
    </div>

    <div class="invoice-info">
        <div>
            <span>Invoice #:</span>
            <span><strong>{{ $invoice->invoice_number }}</strong></span>
        </div>
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
                <span class="item-qty">{{ $item->quantity }}</span>
                <span class="item-price">${{ number_format($item->unit_price, 2) }}</span>
                <span class="item-total">${{ number_format($item->total, 2) }}</span>
            </div>
        @endforeach
    </div>

    <div class="totals">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>${{ number_format($invoice->subtotal, 2) }}</span>
        </div>

        @if($invoice->discount_amount > 0)
            <div class="total-row">
                <span>Discount:</span>
                <span>-${{ number_format($invoice->discount_amount, 2) }}</span>
            </div>
        @endif

        @if($invoice->tax_amount > 0)
            <div class="total-row">
                <span>Tax:</span>
                <span>${{ number_format($invoice->tax_amount, 2) }}</span>
            </div>
        @endif

        <div class="total-row grand-total">
            <span>GRAND TOTAL:</span>
            <span>${{ number_format($invoice->total_amount, 2) }}</span>
        </div>
    </div>

    <div class="footer">
        <div class="thank-you">THANK YOU FOR YOUR BUSINESS!</div>
        <div style="margin-top: 10px;">
            Powered by VENQORE<br>
            Visit us: www.venqore.com
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