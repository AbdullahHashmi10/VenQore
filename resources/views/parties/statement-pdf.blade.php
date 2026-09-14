<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <title>Statement - {{ $party->name }}</title>
    <style>
        body {
            font-family: sans-serif;
            font-size: 12px;
            color: #333;
        }

        .header {
            width: 100%;
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
        }

        .company-info {
            float: left;
        }

        .party-info {
            float: right;
            text-align: right;
        }

        h1 {
            margin: 0;
            color: #1a1a1a;
            font-size: 24px;
        }

        h2 {
            margin: 0 0 10px 0;
            color: #4a4a4a;
            font-size: 16px;
        }

        p {
            margin: 2px 0;
            color: #666;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th {
            background-color: #f8f9fa;
            padding: 10px;
            text-align: left;
            border-bottom: 2px solid #ddd;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
            color: #666;
        }

        td {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .font-bold {
            font-weight: bold;
        }

        .text-red {
            color: #dc2626;
        }

        .text-green {
            color: #16a34a;
        }

        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 10px;
            color: #999;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }

        .summary {
            margin-top: 20px;
            float: right;
            width: 300px;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #eee;
        }

        .summary-row.total {
            border-top: 2px solid #ddd;
            border-bottom: none;
            font-weight: bold;
            font-size: 14px;
            margin-top: 10px;
            padding-top: 10px;
        }
    </style>
</head>

<body>
    <div class="header">
        <div class="company-info">
            <h1>VENQORE</h1>
            <p>123 Business Street</p>
            <p>Lahore, Pakistan</p>
            <p>+92 300 1234567</p>
        </div>
        <div class="party-info">
            <h2>{{ $party->name }}</h2>
            <p>{{ $party->phone }}</p>
            <p>{{ $party->email }}</p>
            <p><strong>Statement Period:</strong></p>
            <p>{{ \Carbon\Carbon::parse($from)->format('d M Y') }} - {{ \Carbon\Carbon::parse($to)->format('d M Y') }}
            </p>
        </div>
        <div style="clear: both;"></div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Description</th>
                <th class="text-right">Debit</th>
                <th class="text-right">Credit</th>
                <th class="text-right">Balance</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $txn)
                <tr>
                    <td>{{ \Carbon\Carbon::parse($txn['date'])->format('d M Y') }}</td>
                    <td>{{ $txn['reference'] }}</td>
                    <td>{{ $txn['description'] }}</td>
                    <td class="text-right">{{ $txn['debit'] > 0 ? number_format($txn['debit'], 2) : '-' }}</td>
                    <td class="text-right">{{ $txn['credit'] > 0 ? number_format($txn['credit'], 2) : '-' }}</td>
                    <td class="text-right font-bold {{ $txn['balance'] >= 0 ? 'text-green' : 'text-red' }}">
                        {{ number_format($txn['balance'], 2) }}
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary">
        <div class="summary-row total">
            <span>Closing Balance:</span>
            <span class="{{ $party->current_balance >= 0 ? 'text-green' : 'text-red' }}">
                {{ number_format($party->current_balance, 2) }}
            </span>
        </div>
    </div>
    <div style="clear: both;"></div>

    <div class="footer">
        <p>This is a computer-generated document and does not require a signature.</p>
        <p>Generated on {{ now()->format('d M Y h:i A') }}</p>
    </div>
</body>

</html>