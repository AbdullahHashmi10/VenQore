<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Exports\ProductsExport;
use App\Imports\ProductsImport;
use App\Exports\PartiesExport;
use App\Imports\PartiesImport;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

class ImportExportController extends Controller
{
    public function index()
    {
        return Inertia::render('ImportExport/DataManager');
    }

    public function export()
    {
        return Excel::download(new ProductsExport, 'products.xlsx');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv',
        ]);

        try {
            Excel::import(new ProductsImport, $request->file('file'));
            return back()->with('success', 'Products imported successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    // Parties
    public function exportParties()
    {
        return Excel::download(new PartiesExport, 'parties.xlsx');
    }

    public function importParties(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,csv',
        ]);

        try {
            Excel::import(new PartiesImport, $request->file('file'));

            // [V3 SWAP] Auto-trigger opening balance migration after import
            \Illuminate\Support\Facades\Artisan::call('migrate:opening-balances');

            return back()->with('success', 'Parties imported successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['file' => 'Import failed: ' . $e->getMessage()]);
        }
    }

    public function downloadTemplate($type)
    {
        $filename = "{$type}_template_" . date('Y-m-d') . ".xlsx";

        // DESIGN TOKENS (based on template_builder_base.py)
        $colors = [
            'title_bg'      => 'FF1E293B',
            'req_header_bg' => 'FF2563EB',
            'opt_header_bg' => 'FF64748B',
            'guide_bg'      => 'FFFFFBEB',
            'separator_bg'  => 'FF16A34A',
            'section_req'   => 'FFEFF6FF',
            'section_hdr'   => 'FF1E293B',
        ];

        try {
            switch ($type) {
                case 'products':
                    $config = [
                        'sheet1' => [
                            'title' => 'VenQore ERP — Products Import Template',
                            'columns' => [
                                ['label' => 'Product Name *',      'required' => true,  'guide' => 'Full name (Max 191 chars)',               'width' => 28],
                                ['label' => 'SKU / Barcode',       'required' => false, 'guide' => 'Unique ID or Barcode',                    'width' => 18],
                                ['label' => 'Selling Price *',     'required' => true,  'guide' => 'Unit Selling Price\nNumbers only',        'width' => 16],
                                ['label' => 'Cost Price',          'required' => false, 'guide' => 'Unit Purchase Cost\nNumbers only',        'width' => 16],
                                ['label' => 'Base Unit *',         'required' => true,  'guide' => 'pcs, kg, box, etc.',                      'width' => 14],
                                ['label' => 'Low Stock Alert Qty', 'required' => false, 'guide' => 'Default: 5',                              'width' => 18],
                                ['label' => 'Category',            'required' => false, 'guide' => 'e.g. Beverages',                          'width' => 18],
                                ['label' => 'Brand',               'required' => false, 'guide' => 'e.g. Nestle',                             'width' => 18],
                                ['label' => 'Opening Stock',       'required' => false, 'guide' => 'Initial available qty',                   'width' => 16],
                            ],
                            'examples' => [
                                ['Milky Bread Large', '75012345', 120, 95, 'pcs', 10, 'Bakery', 'Dawn', 50],
                                ['Coca Cola 1.5L',    'COKE-15',  150, 130, 'pcs', 20, 'Drinks', 'Coke', 100],
                            ]
                        ],
                        'validations' => [
                            ['col' => 'C', 'type' => 'decimal', 'operator' => 'greaterThan', 'formula' => '0', 'error_title' => 'Invalid Price', 'error_msg' => 'Price must be greater than 0.'],
                            ['col' => 'I', 'type' => 'whole', 'operator' => 'greaterThanOrEqual', 'formula' => '0', 'error_title' => 'Invalid Qty', 'error_msg' => 'Stock cannot be negative.'],
                        ],
                        'sheet2' => [
                            'title' => 'How to Fill the Products Template',
                            'instructions' => [
                                ['label' => 'COLUMN',              'explanation' => 'WHAT TO ENTER',                                          'bg' => '1E293B', 'bold' => true],
                                ['label' => 'Product Name ★',      'explanation' => 'The name of your item. Must be unique.',                 'bg' => 'EFF6FF', 'bold' => false],
                                ['label' => 'Selling Price ★',     'explanation' => 'The price you sell for. No symbols (use 500, not Rs 500).','bg' => 'EFF6FF', 'bold' => false],
                                ['label' => 'Base Unit ★',         'explanation' => 'Unit of measurement. Common: pcs, kg, ltr, box.',        'bg' => 'EFF6FF', 'bold' => false],
                            ]
                        ],
                        'sheet3' => [
                            'title' => 'Valid Options Reference',
                            'options' => [
                                ['field' => 'FIELD',      'value' => 'EXAMPLES',  'note' => 'NOTES',                                'bg' => '1E293B', 'bold' => true],
                                ['field' => 'Base Unit',  'value' => 'pcs',       'note' => 'Standard for items sold by count',      'bg' => 'EFF6FF', 'bold' => false],
                                ['field' => '',           'value' => 'kg',        'note' => 'For items sold by weight',              'bg' => 'EFF6FF', 'bold' => false],
                            ]
                        ]
                    ];
                    return Excel::download(new \App\Exports\BaseImportTemplate($config, $colors), $filename);

                case 'parties':
                    $config = [
                        'sheet1' => [
                            'title' => 'VenQore ERP — Contacts Import Template',
                            'columns' => [
                                ['label' => 'Contact Name *',                 'required' => true,  'guide' => 'Full name of person or business',              'width' => 28],
                                ['label' => 'Contact Type *',                 'required' => true,  'guide' => '"Customer" or "Supplier"',                    'width' => 16],
                                ['label' => 'Opening Balance',                'required' => false, 'guide' => 'Numbers only e.g. 5000',                       'width' => 18],
                                ['label' => 'Balance Direction *',            'required' => true,  'guide' => '"To Receive" or "To Pay"',                      'width' => 22],
                                ['label' => 'Phone Number',                   'required' => false, 'guide' => '+923001234567',                                'width' => 20],
                                ['label' => 'Email',                          'required' => false, 'guide' => 'email@example.com',                           'width' => 26],
                                ['label' => 'Address',                        'required' => false, 'guide' => 'City or full address',                        'width' => 24],
                                ['label' => 'Credit Limit',                   'required' => false, 'guide' => 'Max credit allowed',                          'width' => 16],
                                ['label' => 'Notes',                          'required' => false, 'guide' => 'Any extra notes',                             'width' => 24],
                            ],
                            'examples' => [
                                ['Ahmed Traders', 'Customer', 15000, 'To Receive', '+923001234567', 'ahmed@email.com', 'Lahore', 20000, 'Regular buyer'],
                            ]
                        ],
                        'validations' => [
                            ['col' => 'B', 'type' => 'list', 'formula' => '"Customer,Supplier"', 'error_title' => 'Invalid Type', 'error_msg' => 'Select Customer or Supplier.'],
                            ['col' => 'D', 'type' => 'list', 'formula' => '"To Receive,To Pay"', 'error_title' => 'Invalid Direction', 'error_msg' => 'Select To Receive or To Pay.'],
                        ],
                        'sheet2' => [
                            'title' => 'How to Fill the Contacts Template',
                            'instructions' => [
                                ['label' => 'COLUMN',              'explanation' => 'WHAT TO ENTER',                                          'bg' => '1E293B', 'bold' => true],
                                ['label' => 'Contact Type ★',      'explanation' => '"Customer" = buys from you.\n"Supplier" = you buy from them.', 'bg' => 'EFF6FF', 'bold' => false],
                            ]
                        ],
                        'sheet3' => [
                            'title' => 'Valid Options Reference',
                            'options' => [
                                ['field' => 'FIELD',      'value' => 'EXAMPLES',  'note' => 'NOTES',                                'bg' => '1E293B', 'bold' => true],
                                ['field' => 'Contact Type', 'value' => 'Customer', 'note' => 'Standard customer',                   'bg' => 'EFF6FF', 'bold' => false],
                            ]
                        ]
                    ];
                    return Excel::download(new \App\Exports\BaseImportTemplate($config, $colors), $filename);

                case 'sales':
                    $config = [
                        'sheet1' => [
                            'title' => 'VenQore ERP — Sales History Import Template',
                            'columns' => [
                                ['label' => 'Invoice Number *',   'required' => true,  'guide' => 'Unique ID for the sale',               'width' => 18],
                                ['label' => 'Date *',             'required' => true,  'guide' => 'YYYY-MM-DD',                           'width' => 14],
                                ['label' => 'Customer Phone',     'required' => false, 'guide' => 'Mobile No',                                  'width' => 18],
                                ['label' => 'Customer Name',      'required' => false, 'guide' => 'Full Name',                                  'width' => 22],
                                ['label' => 'Product SKU',        'required' => false, 'guide' => 'Optional',                                   'width' => 16],
                                ['label' => 'Product Name *',     'required' => true,  'guide' => 'Matches your product list',                  'width' => 24],
                                ['label' => 'Quantity *',         'required' => true,  'guide' => 'Numeric only',                          'width' => 14],
                                ['label' => 'Unit Price *',       'required' => true,  'guide' => 'Selling price',                            'width' => 14],
                                ['label' => 'Total Amount *',     'required' => true,  'guide' => 'Subtotal (Qty x Price)',               'width' => 16],
                            ],
                            'examples' => [
                                ['INV-001', '2026-03-01', '03001234567', 'John Doe', 'PROD-001', 'Milky Bread', 2, 120, 240],
                            ]
                        ],
                        'sheet2' => [ 'title' => 'How to Fill Sales History', 'instructions' => [ ['label' => 'Date Format', 'explanation' => 'Use YYYY-MM-DD.', 'bg' => 'EFF6FF'] ] ],
                        'sheet3' => [ 'title' => 'Valid Options', 'options' => [ ['field' => 'Date', 'value' => '2026-03-25', 'note' => 'Standard ISO format'] ] ]
                    ];
                    return Excel::download(new \App\Exports\BaseImportTemplate($config, $colors), $filename);

                case 'purchases':
                    $config = [
                        'sheet1' => [
                            'title' => 'VenQore ERP — Purchases Import Template',
                            'columns' => [
                                ['label' => 'Bill Number *',      'required' => true,  'guide' => 'Supplier Bill ID',                   'width' => 18],
                                ['label' => 'Date *',             'required' => true,  'guide' => 'YYYY-MM-DD',                           'width' => 14],
                                ['label' => 'Supplier Phone',     'required' => false, 'guide' => 'Mobile No',                                  'width' => 18],
                                ['label' => 'Supplier Name',      'required' => false, 'guide' => 'Full Name',                                  'width' => 22],
                                ['label' => 'Product SKU',        'required' => false, 'guide' => 'Optional',                                   'width' => 16],
                                ['label' => 'Product Name *',     'required' => true,  'guide' => 'Matches product list',                       'width' => 24],
                                ['label' => 'Quantity *',         'required' => true,  'guide' => 'Numeric only',                          'width' => 14],
                                ['label' => 'Cost Price *',       'required' => true,  'guide' => 'Purchase unit price',                      'width' => 14],
                                ['label' => 'Total Amount *',     'required' => true,  'guide' => 'Subtotal (Qty x Cost)',                'width' => 16],
                            ],
                            'examples' => [
                                ['PUR-99', '2026-03-05', '03331112233', 'Nestle Pakistan', 'MILK-1L', 'Milk Pack 1L', 100, 180, 18000],
                            ]
                        ],
                        'sheet2' => [ 'title' => 'How to Fill Purchases', 'instructions' => [ ['label' => 'Bill Number', 'explanation' => 'Enter supplier invoice ID.', 'bg' => 'EFF6FF'] ] ],
                        'sheet3' => [ 'title' => 'Valid Options', 'options' => [ ['field' => 'Date', 'value' => '2026-03-25', 'note' => 'Standard ISO format'] ] ]
                    ];
                    return Excel::download(new \App\Exports\BaseImportTemplate($config, $colors), $filename);

                case 'expenses':
                    $config = [
                        'sheet1' => [
                            'title' => 'VenQore ERP — Expenses Import Template',
                            'columns' => [
                                ['label' => 'Date *',             'required' => true,  'guide' => 'YYYY-MM-DD',                           'width' => 14],
                                ['label' => 'Category *',         'required' => true,  'guide' => 'e.g. Rent, Electricity',               'width' => 20],
                                ['label' => 'Amount *',           'required' => true,  'guide' => 'Numeric only',                          'width' => 14],
                                ['label' => 'Ref / Bill No',      'required' => false, 'guide' => 'Optional tracking ID',                 'width' => 18],
                                ['label' => 'Description',        'required' => false, 'guide' => 'Details about the expense',            'width' => 30],
                            ],
                            'examples' => [
                                ['2026-03-01', 'Utility Bills', 5000, 'REF-123', 'Electricity for March'],
                            ]
                        ],
                        'sheet2' => [ 'title' => 'How to Fill Expenses', 'instructions' => [ ['label' => 'Amount', 'explanation' => 'Numbers only — no Rs symbol.', 'bg' => 'EFF6FF'] ] ],
                        'sheet3' => [ 'title' => 'Valid Options', 'options' => [ ['field' => 'Date', 'value' => '2026-03-25', 'note' => 'Standard ISO format'] ] ]
                    ];
                    return Excel::download(new \App\Exports\BaseImportTemplate($config, $colors), $filename);

                default:
                    return back()->withErrors(['error' => 'Invalid template type']);
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Template Download Error: ' . $e->getMessage());
            return back()->with('error', 'Failed to generate template.');
        }
    }
}
