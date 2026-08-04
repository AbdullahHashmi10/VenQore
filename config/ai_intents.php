<?php

return [
    'intents' => [
        'sales_today' => [
            'phrases' => ['sales today', 'todays sales', 'how much did we sell today', 'today revenue'],
            'handler' => 'App\Services\Reports\SalesReportService@salesToday',
        ],
        'low_stock' => [
            'phrases' => ['low stock', 'stock alert', 'out of stock', 'replenish list'],
            'handler' => 'App\Services\Reports\StockReportService@lowStock',
        ],
        'receivables' => [
            'phrases' => ['who owes me money', 'receivables', 'pending payments from customers', 'unpaid sales'],
            'handler' => 'App\Services\Reports\PartyReportService@receivables',
        ],
        'payables' => [
            'phrases' => ['who do i owe', 'payables', 'pending supplier bills', 'unpaid purchases'],
            'handler' => 'App\Services\Reports\PartyReportService@payables',
        ],
        'top_sellers' => [
            'phrases' => ['top seller', 'best selling products', 'most popular items'],
            'handler' => 'App\Services\Reports\SalesReportService@topSellers',
        ],
    ],
];
