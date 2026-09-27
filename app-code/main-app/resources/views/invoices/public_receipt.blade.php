<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt #{{ $sale->reference_number ?? $sale->invoice_no ?? $sale->id }}</title>
    <style>
        :root {
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text-ink: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --brand: #4f46e5;
            --brand-light: #eef2ff;
            --success: #10b981;
            --success-light: #ecfdf5;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --bg: #090d16;
                --card-bg: #131c2e;
                --text-ink: #f1f5f9;
                --text-muted: #94a3b8;
                --border: #1e293b;
                --brand: #6366f1;
                --brand-light: #1e1b4b;
                --success: #34d399;
                --success-light: #064e3b;
            }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg);
            color: var(--text-ink);
            padding: 16px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
        }
        .receipt-card {
            background: var(--card-bg);
            border: 1px solid var(--border);
            border-radius: 16px;
            max-width: 440px;
            width: 100%;
            padding: 24px;
            box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
        }
        .store-header {
            text-align: center;
            padding-bottom: 16px;
            border-bottom: 1px dashed var(--border);
        }
        .store-name {
            font-size: 20px;
            font-weight: 800;
            color: var(--text-ink);
            margin-bottom: 4px;
        }
        .store-address {
            font-size: 12px;
            color: var(--text-muted);
            line-height: 1.4;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 4px 10px;
            border-radius: 9999px;
            background: var(--success-light);
            color: var(--success);
            margin-top: 12px;
        }
        .meta-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            padding: 6px 0;
            color: var(--text-muted);
        }
        .meta-row span.val {
            font-weight: 600;
            color: var(--text-ink);
        }
        .meta-section {
            padding: 16px 0;
            border-bottom: 1px dashed var(--border);
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin: 16px 0;
        }
        .items-table th {
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
        }
        .items-table td {
            padding: 8px 0;
            border-bottom: 1px solid var(--border);
        }
        .item-qty {
            font-size: 11px;
            color: var(--text-muted);
        }
        .totals-section {
            padding-top: 12px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
            padding: 4px 0;
            color: var(--text-muted);
        }
        .grand-total {
            font-size: 18px;
            font-weight: 800;
            color: var(--text-ink);
            padding-top: 8px;
            border-top: 2px solid var(--border);
            margin-top: 6px;
        }
        .footer-note {
            text-align: center;
            font-size: 11px;
            color: var(--text-muted);
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px dashed var(--border);
        }
    </style>
</head>
<body>
    <div class="receipt-card">
        <div class="store-header">
            <h1 class="store-name">{{ $store->name ?? config('app.name') }}</h1>
            @if(!empty($store->address))
                <p class="store-address">{{ $store->address }}</p>
            @endif
            @if(!empty($store->phone))
                <p class="store-address">Tel: {{ $store->phone }}</p>
            @endif
            <div class="badge">
                ✓ Authentic Verified Receipt
            </div>
        </div>

        <div class="meta-section">
            <div class="meta-row">
                <span>Receipt Number</span>
                <span class="val">{{ $sale->reference_number ?? $sale->invoice_no ?? $sale->id }}</span>
            </div>
            <div class="meta-row">
                <span>Date & Time</span>
                <span class="val">{{ $sale->created_at ? $sale->created_at->format('M d, Y h:i A') : date('M d, Y h:i A') }}</span>
            </div>
            @if($customer)
                <div class="meta-row">
                    <span>Customer</span>
                    <span class="val">{{ $customer->name }}</span>
                </div>
            @endif
            <div class="meta-row">
                <span>Payment Status</span>
                <span class="val">{{ strtoupper($sale->payment_status ?? 'PAID') }}</span>
            </div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th style="text-align:center;">Qty</th>
                    <th style="text-align:right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($items as $item)
                    <tr>
                        <td>
                            <div>{{ $item->product->name ?? $item->item_name ?? 'Item' }}</div>
                            <div class="item-qty">@ {{ number_format((float)($item->unit_price ?? 0), 2) }}</div>
                        </td>
                        <td style="text-align:center; font-weight:600;">{{ (float)($item->quantity ?? 1) }}</td>
                        <td style="text-align:right; font-weight:600;">{{ number_format((float)(($item->quantity ?? 1) * ($item->unit_price ?? 0)), 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="totals-section">
            <div class="total-row">
                <span>Subtotal</span>
                <span>{{ number_format((float)($sale->subtotal ?? $sale->total ?? 0), 2) }}</span>
            </div>
            @if((float)($sale->tax ?? 0) > 0)
                <div class="total-row">
                    <span>Tax</span>
                    <span>{{ number_format((float)$sale->tax, 2) }}</span>
                </div>
            @endif
            @if((float)($sale->discount ?? 0) > 0)
                <div class="total-row">
                    <span>Discount</span>
                    <span>-{{ number_format((float)$sale->discount, 2) }}</span>
                </div>
            @endif
            <div class="total-row grand-total">
                <span>Total</span>
                <span>{{ number_format((float)($sale->total ?? 0), 2) }}</span>
            </div>
            <div class="total-row" style="margin-top: 4px;">
                <span>Paid</span>
                <span>{{ number_format((float)($sale->paid ?? $sale->total ?? 0), 2) }}</span>
            </div>
        </div>

        <div class="footer-note">
            Thank you for shopping with us!<br>
            <span style="font-size: 10px; opacity: 0.8;">Privacy Protected Digital Receipt</span>
        </div>
    </div>
</body>
</html>
