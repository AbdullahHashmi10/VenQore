export const FEATURE_METADATA = {
    // Universal Modules (ON for all including Solo)
    product_variants:           { icon: '📦', label: 'Product Variants', plan: 'solo' },
    fifo_costing:               { icon: '🧮', label: 'FIFO Costing', plan: 'solo' },
    barcode_label_factory:      { icon: '🏷️', label: 'Barcode Label Factory', plan: 'solo' },
    batch_tracking:             { icon: '📦', label: 'Batch Tracking', plan: 'solo' },
    batch_expiry:               { icon: '📅', label: 'Batch Expiry Tracking', plan: 'solo' },
    bill_of_materials:          { icon: '📋', label: 'Bill of Materials & Recipes', plan: 'solo' },
    cookbook:                   { icon: '📖', label: 'Cookbook / Production', plan: 'solo' },
    production:                 { icon: '🏭', label: 'Manufacturing & Production', plan: 'solo' },
    stock_take_audit:           { icon: '🔍', label: 'Stock Take Audits', plan: 'solo' },
    imei_lifecycle:             { icon: '📱', label: 'IMEI / Serial Lifecycle Tracking', plan: 'solo' },
    double_entry_ledger:        { icon: '📓', label: 'Double-Entry Ledger', plan: 'solo' },
    marketing_campaigns:        { icon: '📢', label: 'SMS & Email Campaigns', plan: 'solo' },
    email_marketing:            { icon: '✉️', label: 'Email Marketing', plan: 'solo' },
    sms_marketing:              { icon: '💬', label: 'SMS Marketing', plan: 'solo' },

    // Paid Universal (ON for Starter, Core, Scale)
    growth_engine:              { icon: '✨', label: 'AI Growth Engine', plan: 'starter' },
    recurring_invoices:         { icon: '🔄', label: 'Recurring Invoices', plan: 'starter' },
    bank_reconciliation:        { icon: '🏦', label: 'Bank Reconciliation', plan: 'starter' },
    e_invoicing:                { icon: '⚡', label: 'E-Invoicing integration', plan: 'starter' },
    fund_management:            { icon: '💰', label: 'Fund Management', plan: 'starter' },
    fixed_asset_depreciation:   { icon: '📉', label: 'Asset Depreciation', plan: 'starter' },
    fiscal_year_closing:        { icon: '🔒', label: 'Fiscal Year Closing', plan: 'starter' },

    // Scale Fences
    multi_branch:               { icon: '🚚', label: 'Multi-Branch & Transfers', plan: 'core' },
    stock_transfer:             { icon: '🚚', label: 'Stock Transfers', plan: 'core' },
    api_access:                 { icon: '🔌', label: 'API Access', plan: 'core' },
    webhooks:                   { icon: '🪝', label: 'Webhooks', plan: 'core' },
    security_activity_log:      { icon: '🛡️', label: 'Security Activity Log', plan: 'core' },
    custom_roles:               { icon: '👥', label: 'Custom Granular Roles', plan: 'core' },
    network_unlimited:          { icon: '🌐', label: 'B2B Network Unlimited', plan: 'core' },
    white_label:                { icon: '🏷️', label: 'White-Label Branding', plan: 'scale' },
    consolidated_reporting:     { icon: '🏢', label: 'Consolidated Multi-Entity Reporting', plan: 'scale' },

    // E-Commerce & Channels
    woocommerce:                { icon: '🛒', label: 'WooCommerce Sync', plan: 'addon' },
    amazon_sync:                { icon: '📦', label: 'Amazon Sync', plan: 'addon' },
    ebay_sync:                  { icon: '🏷️', label: 'eBay Sync', plan: 'addon' },
    tiktok_sync:                { icon: '📱', label: 'TikTok Shop Sync', plan: 'addon' },

    // Support & Limits
    chat_support:               { icon: '💬', label: 'Live Chat Support', plan: 'core' },
    sku_limit:                  { icon: '📦', label: 'Product Catalogue Limit', plan: 'starter' },
    staff_limit:                { icon: '👤', label: 'Staff Seat Limit', plan: 'starter' },
    locations:                  { icon: '🏪', label: 'Locations Limit', plan: 'starter' },
    transactions_per_month:     { icon: '📈', label: 'Transaction Limit', plan: 'solo' },
    smart_capture:              { icon: '📸', label: 'Smart Capture Limit', plan: 'starter' },
};

export const PLAN_LABELS = {
    solo:     'Solo',
    trial:    'Trial',
    starter:  'Starter',
    core:     'Core',
    scale:    'Scale',
    custom:   'Custom',
    growth:   'Core',
    business: 'Scale',
    ltd:      'Lifetime Deal',
    ltd_1:    'LTD Tier 1',
    ltd_2:    'LTD Tier 2',
    ltd_3:    'LTD Tier 3',
    addon:    'Add-on Purchase',
};
