<?php

return array (
  'roles' => 
  array (
    'cashier' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'sales.gross_margin_pct',
        'class' => 'kpi',
        'period' => 'today',
      ),
      2 => 
      array (
        'key' => 'staff.on_shift_count',
        'class' => 'kpi',
        'period' => 'today',
      ),
      3 => 
      array (
        'key' => 'party.customer_count',
        'class' => 'kpi',
        'period' => 'today',
      ),
      4 => 
      array (
        'key' => 'sales.live_feed',
        'class' => 'feed',
        'period' => 'live',
      ),
      5 => 
      array (
        'key' => 'sales.payment_breakdown',
        'class' => 'breakdown',
        'period' => 'today',
      ),
      6 => 
      array (
        'key' => 'sales.top_products',
        'class' => 'ranking',
        'period' => 'today',
      ),
    ),
    'accountant' => 
    array (
      0 => 
      array (
        'key' => 'finance.net_profit',
        'class' => 'headline',
        'period' => 'this_month',
      ),
      1 => 
      array (
        'key' => 'finance.total_liquidity',
        'class' => 'kpi',
        'period' => 'live',
      ),
      2 => 
      array (
        'key' => 'finance.receivables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'finance.payables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'finance.profit_trend',
        'class' => 'trend',
        'period' => 'this_year',
      ),
      5 => 
      array (
        'key' => 'finance.expenses_by_category',
        'class' => 'breakdown',
        'period' => 'this_month',
      ),
      6 => 
      array (
        'key' => 'finance.receivables_aging',
        'class' => 'breakdown',
        'period' => 'live',
      ),
      7 => 
      array (
        'key' => 'finance.balance_sheet_ok',
        'class' => 'status',
        'period' => 'live',
      ),
      8 => 
      array (
        'key' => 'finance.expenses_total',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
    ),
    'purchasing_officer' => 
    array (
      0 => 
      array (
        'key' => 'purchasing.spend',
        'class' => 'headline',
        'period' => 'this_month',
      ),
      1 => 
      array (
        'key' => 'purchasing.count',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      2 => 
      array (
        'key' => 'finance.payables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'finance.paid_to_suppliers',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      4 => 
      array (
        'key' => 'inventory.low_stock_list',
        'class' => 'ledger',
        'period' => 'live',
      ),
      5 => 
      array (
        'key' => 'inventory.low_stock_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      6 => 
      array (
        'key' => 'party.supplier_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
    ),
    'viewer' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'finance.net_profit',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      2 => 
      array (
        'key' => 'inventory.stock_value',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'party.customer_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'sales.top_products',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
    ),
  ),
  'business' => 
  array (
    'default' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'finance.net_profit',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      2 => 
      array (
        'key' => 'finance.receivables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'inventory.stock_value',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'sales.payment_breakdown',
        'class' => 'breakdown',
        'period' => 'today',
      ),
      6 => 
      array (
        'key' => 'sales.top_products',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
      7 => 
      array (
        'key' => 'inventory.low_stock_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      8 => 
      array (
        'key' => 'finance.expenses_total',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
    ),
    'pos_only' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'sales.gross_margin_pct',
        'class' => 'kpi',
        'period' => 'today',
      ),
      2 => 
      array (
        'key' => 'finance.expenses_total',
        'class' => 'kpi',
        'period' => 'today',
      ),
      3 => 
      array (
        'key' => 'party.customer_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'sales.top_products',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
      6 => 
      array (
        'key' => 'sales.payment_breakdown',
        'class' => 'breakdown',
        'period' => 'today',
      ),
    ),
    'retail_shop' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'finance.net_profit',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      2 => 
      array (
        'key' => 'finance.receivables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'inventory.stock_value',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'inventory.low_stock_list',
        'class' => 'ledger',
        'period' => 'live',
      ),
      6 => 
      array (
        'key' => 'sales.top_products',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
      7 => 
      array (
        'key' => 'finance.expenses_total',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      8 => 
      array (
        'key' => 'party.customer_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
    ),
    'grocery' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'inventory.low_stock_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      2 => 
      array (
        'key' => 'finance.receivables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'finance.payables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'inventory.low_stock_list',
        'class' => 'ledger',
        'period' => 'live',
      ),
      6 => 
      array (
        'key' => 'sales.payment_breakdown',
        'class' => 'breakdown',
        'period' => 'today',
      ),
      7 => 
      array (
        'key' => 'finance.total_liquidity',
        'class' => 'kpi',
        'period' => 'live',
      ),
      8 => 
      array (
        'key' => 'inventory.out_of_stock_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
    ),
    'pharmacy' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'inventory.low_stock_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      2 => 
      array (
        'key' => 'finance.receivables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'inventory.stock_value',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'inventory.low_stock_list',
        'class' => 'ledger',
        'period' => 'live',
      ),
      6 => 
      array (
        'key' => 'finance.expenses_by_category',
        'class' => 'breakdown',
        'period' => 'this_month',
      ),
    ),
    'cafe' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'sales.gross_margin_pct',
        'class' => 'kpi',
        'period' => 'today',
      ),
      2 => 
      array (
        'key' => 'finance.expenses_total',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      3 => 
      array (
        'key' => 'staff.on_shift_count',
        'class' => 'kpi',
        'period' => 'today',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'sales.top_products',
        'class' => 'ranking',
        'period' => 'today',
      ),
      6 => 
      array (
        'key' => 'sales.payment_breakdown',
        'class' => 'breakdown',
        'period' => 'today',
      ),
    ),
    'restaurant' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'restaurant.tables_occupied',
        'class' => 'kpi',
        'period' => 'live',
      ),
      2 => 
      array (
        'key' => 'restaurant.kitchen_orders_pending',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'staff.on_shift_count',
        'class' => 'kpi',
        'period' => 'today',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'sales.top_products',
        'class' => 'ranking',
        'period' => 'today',
      ),
      6 => 
      array (
        'key' => 'finance.expenses_by_category',
        'class' => 'breakdown',
        'period' => 'this_month',
      ),
    ),
    'bakery' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'production.run_count',
        'class' => 'kpi',
        'period' => 'today',
      ),
      2 => 
      array (
        'key' => 'operations.open_sales_orders',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'inventory.low_stock_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'sales.top_products',
        'class' => 'ranking',
        'period' => 'today',
      ),
      6 => 
      array (
        'key' => 'inventory.low_stock_list',
        'class' => 'ledger',
        'period' => 'live',
      ),
      7 => 
      array (
        'key' => 'production.total_cost',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
    ),
    'mobile_electronics' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'inventory.stock_value',
        'class' => 'kpi',
        'period' => 'live',
      ),
      2 => 
      array (
        'key' => 'finance.receivables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'sales.gross_margin_pct',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'sales.top_products',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
      6 => 
      array (
        'key' => 'sales.top_customers',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
    ),
    'clothing' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'sales.gross_margin_pct',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      2 => 
      array (
        'key' => 'inventory.low_stock_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'inventory.stock_value',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'sales.top_products',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
      6 => 
      array (
        'key' => 'sales.payment_breakdown',
        'class' => 'breakdown',
        'period' => 'today',
      ),
    ),
    'hardware_store' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'finance.receivables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      2 => 
      array (
        'key' => 'finance.payables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'inventory.low_stock_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'inventory.low_stock_list',
        'class' => 'ledger',
        'period' => 'live',
      ),
      6 => 
      array (
        'key' => 'sales.top_customers',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
    ),
    'wholesale' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'this_month',
      ),
      1 => 
      array (
        'key' => 'finance.receivables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      2 => 
      array (
        'key' => 'finance.payables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'inventory.stock_value',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'finance.profit_trend',
        'class' => 'trend',
        'period' => 'this_year',
      ),
      5 => 
      array (
        'key' => 'sales.top_customers',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
      6 => 
      array (
        'key' => 'finance.receivables_aging',
        'class' => 'breakdown',
        'period' => 'live',
      ),
      7 => 
      array (
        'key' => 'purchasing.spend',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      8 => 
      array (
        'key' => 'finance.net_profit',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
    ),
    'multi_branch_retail' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'finance.total_liquidity',
        'class' => 'kpi',
        'period' => 'live',
      ),
      2 => 
      array (
        'key' => 'staff.on_shift_count',
        'class' => 'kpi',
        'period' => 'today',
      ),
      3 => 
      array (
        'key' => 'inventory.low_stock_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'sales.payment_breakdown',
        'class' => 'breakdown',
        'period' => 'today',
      ),
      6 => 
      array (
        'key' => 'sales.top_products',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
    ),
    'manufacturing' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'this_month',
      ),
      1 => 
      array (
        'key' => 'production.run_count',
        'class' => 'kpi',
        'period' => 'today',
      ),
      2 => 
      array (
        'key' => 'production.total_cost',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      3 => 
      array (
        'key' => 'inventory.stock_value',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'inventory.low_stock_list',
        'class' => 'ledger',
        'period' => 'live',
      ),
      6 => 
      array (
        'key' => 'purchasing.spend',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
    ),
    'freelancer' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'this_month',
      ),
      1 => 
      array (
        'key' => 'finance.receivables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      2 => 
      array (
        'key' => 'finance.expenses_total',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      3 => 
      array (
        'key' => 'finance.net_profit',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      4 => 
      array (
        'key' => 'finance.profit_trend',
        'class' => 'trend',
        'period' => 'this_year',
      ),
      5 => 
      array (
        'key' => 'finance.receivables_aging',
        'class' => 'breakdown',
        'period' => 'live',
      ),
      6 => 
      array (
        'key' => 'sales.top_customers',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
    ),
    'salon' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'staff.on_shift_count',
        'class' => 'kpi',
        'period' => 'today',
      ),
      2 => 
      array (
        'key' => 'finance.expenses_total',
        'class' => 'kpi',
        'period' => 'this_month',
      ),
      3 => 
      array (
        'key' => 'party.customer_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'sales.top_customers',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
      6 => 
      array (
        'key' => 'sales.payment_breakdown',
        'class' => 'breakdown',
        'period' => 'today',
      ),
    ),
    'repair_workshop' => 
    array (
      0 => 
      array (
        'key' => 'sales.revenue',
        'class' => 'headline',
        'period' => 'today',
      ),
      1 => 
      array (
        'key' => 'operations.open_sales_orders',
        'class' => 'kpi',
        'period' => 'live',
      ),
      2 => 
      array (
        'key' => 'inventory.low_stock_count',
        'class' => 'kpi',
        'period' => 'live',
      ),
      3 => 
      array (
        'key' => 'finance.receivables',
        'class' => 'kpi',
        'period' => 'live',
      ),
      4 => 
      array (
        'key' => 'sales.revenue_trend',
        'class' => 'trend',
        'period' => 'this_month',
      ),
      5 => 
      array (
        'key' => 'inventory.low_stock_list',
        'class' => 'ledger',
        'period' => 'live',
      ),
      6 => 
      array (
        'key' => 'sales.top_customers',
        'class' => 'ranking',
        'period' => 'this_month',
      ),
    ),
  ),
  'aliases' => 
  array (
    'retail' => 'retail_shop',
    'generic' => 'default',
    'automotive' => 'hardware_store',
    'services' => 'freelancer',
    'kiryana' => 'grocery',
    'supermarket' => 'grocery',
    'cafe_bakery' => 'cafe',
    'distribution' => 'wholesale',
    'field_service' => 'repair_workshop',
    'professional_services' => 'freelancer',
    'membership_studio' => 'salon',
    'rental_hire' => 'repair_workshop',
    'food_counter' => 'cafe',
    'catering' => 'bakery',
    'light_manufacturing' => 'manufacturing',
    'tailoring' => 'manufacturing',
  ),
);
