export const FEATURE_METADATA = {
    // Inventory & Manufacturing
    product_variants:           { icon: '📦', label: 'Product Variants', plan: 'starter' },
    fifo_costing:               { icon: '🧮', label: 'FIFO Costing', plan: 'starter' },
    stock_transfer:             { icon: '🚚', label: 'Stock Transfers', plan: 'growth' },
    barcode_label_factory:      { icon: '🏷️', label: 'Barcode Label Factory', plan: 'growth' },
    batch_tracking:             { icon: '📦', label: 'Batch Tracking', plan: 'growth' },
    batch_expiry:               { icon: '📅', label: 'Batch Expiry Tracking', plan: 'growth' },
    bill_of_materials:          { icon: '📋', label: 'Bill of Materials & Recipes', plan: 'growth' },
    cookbook:                   { icon: '📖', label: 'Cookbook / Production', plan: 'growth' },
    production:                 { icon: '🏭', label: 'Manufacturing & Production', plan: 'growth' },
    stock_take_audit:           { icon: '🔍', label: 'Stock Take Audits', plan: 'business' },
    imei_lifecycle:             { icon: '📱', label: 'IMEI / Serial Lifecycle Tracking', plan: 'business' },
    auto_assembly_logic:        { icon: '⚙️', label: 'Automated Assembly Logic', plan: 'business' },

    // E-Commerce & Channels
    woocommerce:              { icon: '🛒', label: 'WooCommerce Sync', plan: 'addon' },
    woocommerce_customer_reg:   { icon: '👤', label: 'WooCommerce Customer Registry', plan: 'addon' },
    woocommerce_stock_sync:     { icon: '🔄', label: 'WooCommerce Stock Sync', plan: 'addon' },
    woocommerce_orders_bridge:  { icon: '🌉', label: 'WooCommerce Orders Bridge', plan: 'addon' },

    // Marketing & Growth
    growth_engine:            { icon: '✨', label: 'AI Growth Engine', plan: 'growth' },
    marketing_campaigns:        { icon: '📢', label: 'SMS & Email Campaigns', plan: 'growth' },
    email_marketing:            { icon: '✉️', label: 'Email Marketing', plan: 'growth' },
    sms_marketing:              { icon: '💬', label: 'SMS Marketing', plan: 'growth' },
    campaigns:                  { icon: '📣', label: 'Promotion Campaigns', plan: 'growth' },

    // Accounting & Finance
    double_entry_ledger:        { icon: '📓', label: 'Double-Entry Ledger', plan: 'starter' },
    loan_ledger:                { icon: '💳', label: 'Loan Ledger', plan: 'growth' },
    bank_reconciliation:        { icon: '🏦', label: 'Bank Reconciliation', plan: 'growth' },
    e_invoicing:                { icon: '⚡', label: 'E-Invoicing integration', plan: 'growth' },
    fund_management:            { icon: '💰', label: 'Fund Management', plan: 'growth' },
    fixed_asset_depreciation:   { icon: '📉', label: 'Asset Depreciation', plan: 'business' },
    fiscal_year_closing:        { icon: '🔒', label: 'Fiscal Year Closing', plan: 'business' },

    // Reports
    discount_report:            { icon: '📊', label: 'Discount Report', plan: 'growth' },
    cash_flow_report:           { icon: '📈', label: 'Cash Flow Statement', plan: 'growth' },
    stock_valuation:            { icon: '📊', label: 'Stock Valuation Report', plan: 'growth' },
    stock_aging:                { icon: '⏳', label: 'Stock Aging Analysis', plan: 'growth' },
    point_in_time_inventory:    { icon: '🕒', label: 'Point-in-Time Inventory', plan: 'growth' },
    customer_insights:          { icon: '👥', label: 'Customer Insights', plan: 'growth' },
    supplier_insights:          { icon: '🤝', label: 'Supplier Insights', plan: 'growth' },
    report_sales_aging:         { icon: '📊', label: 'Sales Aging Report', plan: 'business' },
    report_trial_balance:       { icon: '⚖️', label: 'Trial Balance Report', plan: 'business' },

    // Customer & Support
    chat_support:             { icon: '💬', label: 'Live Chat Support', plan: 'growth' },
    live_chat_widget:         { icon: '💬', label: 'Live Chat Widget', plan: 'growth' },

    // Limits
    sku_limit:                { icon: '📦', label: 'Product Limit', plan: 'growth' },
    staff_limit:              { icon: '👤', label: 'Staff Limit', plan: 'growth' },
    locations:                { icon: '🏪', label: 'Warehouse Limit', plan: 'growth' },
    transactions_per_month:   { icon: '📈', label: 'Transaction Limit', plan: 'growth' },
    smart_capture:            { icon: '📸', label: 'Smart Capture Limit', plan: 'growth' },
};

export const PLAN_LABELS = {
    trial:    'Trial',
    starter:  'Starter',
    growth:   'Growth',
    business: 'Business',
    ltd:      'Lifetime Deal',
    addon:    'Add-on Purchase',
};
