"""
VenQore — Build All Import Templates
=====================================
Generates all premium import templates using the design system
defined in template_builder_base.py.
"""

from template_builder_base import build_template, COLORS

# ══════════════════════════════════════════════════════════════════════════════
# 1. PRODUCTS TEMPLATE
# ══════════════════════════════════════════════════════════════════════════════

def build_products():
    sheet1 = {
        'title': 'VenQore — Products Import Template',
        'columns': [
            {'label': 'Product Name *',      'required': True,  'guide': 'Full name (Max 191 chars)',               'width': 28},
            {'label': 'SKU / Barcode',       'required': False, 'guide': 'Unique ID or Barcode',                    'width': 18},
            {'label': 'Selling Price *',     'required': True,  'guide': 'Unit Selling Price\nNumbers only',        'width': 16},
            {'label': 'Cost Price',          'required': False, 'guide': 'Unit Purchase Cost\nNumbers only',        'width': 16},
            {'label': 'Base Unit *',         'required': True,  'guide': 'pcs, kg, box, etc.',                      'width': 14},
            {'label': 'Low Stock Alert Qty', 'required': False, 'guide': 'Default: 5',                              'width': 18},
            {'label': 'Category',            'required': False, 'guide': 'e.g. Beverages',                          'width': 18},
            {'label': 'Brand',               'required': False, 'guide': 'e.g. Nestle',                              'width': 18},
            {'label': 'Opening Stock',       'required': False, 'guide': 'Initial available qty',                    'width': 16},
        ],
        'examples': [
            ['Milky Bread Large', '75012345', 120, 95, 'pcs', 10, 'Bakery', 'Dawn', 50],
            ['Coca Cola 1.5L',    'COKE-15',  150, 130, 'pcs', 20, 'Drinks', 'Coke', 100],
        ]
    }

    sheet2 = {
        'title': 'How to Fill the Products Template',
        'instructions': [
            {'label': 'COLUMN',              'explanation': 'WHAT TO ENTER',                                          'bg': COLORS['section_hdr'], 'bold': True},
            {'label': 'Product Name ★',      'explanation': 'The name of your item. Must be unique.',                 'bg': COLORS['section_req'], 'bold': False},
            {'label': 'Selling Price ★',     'explanation': 'The price you sell for. No symbols (use 500, not Rs 500).','bg': COLORS['section_req'], 'bold': False},
            {'label': 'Base Unit ★',         'explanation': 'Unit of measurement. Common: pcs, kg, ltr, box.',        'bg': COLORS['section_req'], 'bold': False},
            {'label': 'Opening Stock',       'explanation': 'Current stock in hand. Will create an opening batch.',   'bg': COLORS['section_opt'], 'bold': False},
            {'label': '',                    'explanation': '',                                                        'bg': 'FFFFFF',              'bold': False},
            {'label': '✅  QUICK RULES',     'explanation': '',                                                        'bg': COLORS['section_ok'],  'bold': True},
            {'label': '★ = Required',        'explanation': 'Name, Selling Price, and Base Unit are mandatory.',      'bg': COLORS['section_ok'],  'bold': False},
        ]
    }

    sheet3 = {
        'title': 'Valid Options Reference',
        'options': [
            {'field': 'FIELD',      'value': 'EXAMPLES',  'note': 'NOTES',                                'bg': COLORS['section_hdr'], 'bold': True},
            {'field': 'Base Unit',  'value': 'pcs',       'note': 'Standard for items sold by count',      'bg': COLORS['section_req'], 'bold': False},
            {'field': '',           'value': 'kg',        'note': 'For items sold by weight',              'bg': COLORS['section_req'], 'bold': False},
            {'field': '',           'value': 'box',       'note': 'For wholesale/bulk packs',              'bg': COLORS['section_req'], 'bold': False},
        ]
    }

    validations = [
        {'col': 'C', 'type': 'decimal', 'operator': 'greaterThan', 'formula': '0', 'error_title': 'Invalid Price', 'error_msg': 'Price must be greater than 0.'},
        {'col': 'I', 'type': 'whole', 'operator': 'greaterThanOrEqual', 'formula': '0', 'error_title': 'Invalid Qty', 'error_msg': 'Stock cannot be negative.'},
    ]

    build_template('products_import_template.xlsx', sheet1, sheet2, sheet3, validations)


# ══════════════════════════════════════════════════════════════════════════════
# 2. SALES HISTORY TEMPLATE
# ══════════════════════════════════════════════════════════════════════════════

def build_sales():
    sheet1 = {
        'title': 'VenQore — Sales History Import Template',
        'columns': [
            {'label': 'Invoice Number *',   'required': True,  'guide': 'Unique ID for the sale',               'width': 18},
            {'label': 'Date *',             'required': True,  'guide': 'YYYY-MM-DD',                           'width': 14},
            {'label': 'Customer Phone',     'required': False, 'guide': 'Mobile No (Max 15 digits)',            'width': 18},
            {'label': 'Customer Name',      'required': False, 'guide': 'Full Name',                            'width': 22},
            {'label': 'Product SKU',        'required': False, 'guide': 'Optional — helps matching',            'width': 16},
            {'label': 'Product Name *',     'required': True,  'guide': 'Matches your product list',            'width': 24},
            {'label': 'Quantity *',         'required': True,  'guide': 'Numeric only',                          'width': 14},
            {'label': 'Unit Price *',       'required': True,  'guide': 'Selling price at time of sale',         'width': 14},
            {'label': 'Total Amount *',      'required': True,  'guide': 'Subtotal (Qty x Price)',               'width': 16},
        ],
        'examples': [
            ['INV-001', '2026-03-01', '03001234567', 'John Doe', 'PROD-001', 'Milky Bread', 2, 120, 240],
            ['INV-001', '2026-03-01', '03001234567', 'John Doe', 'PROD-002', 'Egg (Dozen)', 1, 300, 300],
        ]
    }

    sheet2 = {
        'title': 'How to Fill Sales History',
        'instructions': [
            {'label': 'Date Format', 'explanation': 'Use YYYY-MM-DD. Example: 2026-03-25.', 'bg': COLORS['section_hdr'], 'bold': True},
            {'label': 'Same Invoice', 'explanation': 'Multiple products in one sale? Use the SAME Invoice Number for all rows.', 'bg': COLORS['section_ok'], 'bold': False},
        ]
    }

    build_template('sales_import_template.xlsx', sheet1, sheet2, {}, [])


# ══════════════════════════════════════════════════════════════════════════════
# 3. PURCHASES TEMPLATE
# ══════════════════════════════════════════════════════════════════════════════

def build_purchases():
    sheet1 = {
        'title': 'VenQore — Purchases Import Template',
        'columns': [
            {'label': 'Bill Number *',      'required': True,  'guide': 'Supplier Bill/Invoice ID',             'width': 18},
            {'label': 'Date *',             'required': True,  'guide': 'YYYY-MM-DD',                           'width': 14},
            {'label': 'Supplier Phone',     'required': False, 'guide': 'Mobile No',                            'width': 18},
            {'label': 'Supplier Name',      'required': False, 'guide': 'Full Name',                            'width': 22},
            {'label': 'Product SKU',        'required': False, 'guide': 'Optional',                             'width': 16},
            {'label': 'Product Name *',     'required': True,  'guide': 'Matches your product list',            'width': 24},
            {'label': 'Quantity *',         'required': True,  'guide': 'Numeric only',                          'width': 14},
            {'label': 'Cost Price *',       'required': True,  'guide': 'Purchase price per unit',               'width': 14},
            {'label': 'Total Amount *',      'required': True,  'guide': 'Subtotal (Qty x Cost)',                'width': 16},
        ],
        'examples': [
            ['PUR-99', '2026-03-05', '03331112233', 'Nestle Pakistan', 'MILK-1L', 'Milk Pack 1L', 100, 180, 18000],
        ]
    }

    build_template('purchases_import_template.xlsx', sheet1, {}, {}, [])


# ══════════════════════════════════════════════════════════════════════════════
# 4. EXPENSES TEMPLATE
# ══════════════════════════════════════════════════════════════════════════════

def build_expenses():
    sheet1 = {
        'title': 'VenQore — Expenses Import Template',
        'columns': [
            {'label': 'Date *',             'required': True,  'guide': 'YYYY-MM-DD',                           'width': 14},
            {'label': 'Category *',         'required': True,  'guide': 'e.g. Rent, Electricity',               'width': 20},
            {'label': 'Amount *',           'required': True,  'guide': 'Numeric only',                          'width': 14},
            {'label': 'Ref / Bill No',      'required': False, 'guide': 'Optional tracking ID',                 'width': 18},
            {'label': 'Description',        'required': False, 'guide': 'Details about the expense',            'width': 30},
        ],
        'examples': [
            ['2026-03-01', 'Utility Bills', 5000, 'REF-123', 'Electricity for March'],
            ['2026-03-02', 'Shop Rent',     25000, '',        'Monthly rent for main branch'],
        ]
    }

    build_template('expenses_import_template.xlsx', sheet1, {}, {}, [])

# ══════════════════════════════════════════════════════════════════════════════
# MAIN RUN
# ══════════════════════════════════════════════════════════════════════════════

if __name__ == '__main__':
    build_products()
    build_sales()
    build_purchases()
    build_expenses()
    print("\n🚀 All premium templates generated successfully!")
