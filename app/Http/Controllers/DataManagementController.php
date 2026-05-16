<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Log;

// Exports
use App\Exports\ProductsExport;
use App\Exports\PartiesExport;
use App\Exports\SalesExport;
use App\Exports\PurchasesExport;
use App\Exports\ExpensesExport;
use App\Exports\TransactionsExport;

// Imports
use App\Imports\ProductsImport;
use App\Imports\PartiesImport;
use App\Imports\SalesImport;
use App\Imports\PurchasesImport;
use App\Imports\ExpensesImport;

class DataManagementController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/DataManagement', [
            'mode' => 'admin'
        ]);
    }

    public function export(Request $request)
    {
        $type = $request->input('type');
        $format = $request->input('format', 'xlsx');

        $extension = $format;
        $writerType = \Maatwebsite\Excel\Excel::XLSX;

        if ($format === 'csv') {
            $writerType = \Maatwebsite\Excel\Excel::CSV;
        } else if ($format === 'pdf') {
            $writerType = \Maatwebsite\Excel\Excel::DOMPDF;
        }

        try {
            $filename = "{$type}_" . date('Y-m-d') . ".{$extension}";

            switch ($type) {
                case 'products':
                    return Excel::download(new ProductsExport, $filename, $writerType);
                case 'parties':
                    return Excel::download(new PartiesExport, $filename, $writerType);
                case 'sales':
                    return Excel::download(new SalesExport, $filename, $writerType);
                case 'purchases':
                    return Excel::download(new PurchasesExport, $filename, $writerType);
                case 'expenses':
                    return Excel::download(new ExpensesExport, $filename, $writerType);
                case 'transactions':
                    return Excel::download(new TransactionsExport, $filename, $writerType);
                default:
                    return back()->with('error', 'Export type [' . $type . '] not supported.');
            }

        } catch (\Exception $e) {
            Log::error('Export Error: ' . $e->getMessage());
            // If PDF fails specifically, it might be missing drivers
            if ($format === 'pdf' && str_contains($e->getMessage(), 'Driver')) {
                return back()->with('error', 'PDF export driver not installed. Please use XLSX or CSV.');
            }
            return back()->with('error', 'Export failed: ' . $e->getMessage());
        }
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv,txt,xls',
            'type' => 'required|string'
        ]);

        $type = $request->input('type');
        $file = $request->file('file');

        try {
            switch ($type) {
                case 'products':
                    Excel::import(new ProductsImport, $file);
                    return back()->with('success', 'Products imported successfully.');
                
                case 'parties':
                    Excel::import(new PartiesImport, $file);
                    return back()->with('success', 'Contacts (Parties) imported successfully.');

                case 'sales':
                    Excel::import(new SalesImport, $file);
                    return back()->with('success', 'Sales imported successfully.');

                case 'purchases':
                    Excel::import(new PurchasesImport, $file);
                    return back()->with('success', 'Purchases imported successfully.');

                case 'expenses':
                    Excel::import(new ExpensesImport, $file);
                    return back()->with('success', 'Expenses imported successfully.');

                default:
                    // For other types, check if we have a generic importer or fail gracefully
                    return back()->with('error', "Import for '{$type}' is not yet implemented.");
            }

        } catch (\Maatwebsite\Excel\Validators\ValidationException $e) {
             $failures = $e->failures();
             $msg = "Row " . $failures[0]->row() . ": " . $failures[0]->errors()[0];
             return back()->with('error', 'Validation failed: ' . $msg);
        } catch (\Exception $e) {
            Log::error('Import Error: ' . $e->getMessage());
            return back()->with('error', 'Error importing file. Please check the format.');
        }
    }

    public function template(Request $request)
    {
        $type = $request->input('type');
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
                                ['label' => 'Opening Stock',       'explanation' => 'Initial qty. Must be positive (+). Use 0 for no stock.', 'bg' => 'EFF6FF', 'bold' => false],
                            ]
                        ],
                        'sheet3' => [
                            'title' => 'Valid Options Reference',
                            'options' => array_merge(
                                [['field' => 'FIELD',      'value' => 'EXAMPLES',  'note' => 'NOTES',                                'bg' => '1E293B', 'bold' => true]],
                                [['field' => 'Base Unit',  'value' => 'pcs, kg, ltr, box, pkt, doz', 'note' => 'Standard units of measurement', 'bg' => 'EFF6FF', 'bold' => false]],
                                // Dynamically load categories
                                array_map(function($c) { 
                                    return ['field' => 'Category', 'value' => $c->name, 'note' => 'Available Category', 'bg' => 'F8FAFC', 'bold' => false];
                                }, \App\Models\Category::query()->get()->take(50)->all()),
                                // Dynamically load brands
                                array_map(function($b) { 
                                    return ['field' => 'Brand', 'value' => $b->name, 'note' => 'Available Brand', 'bg' => 'F8FAFC', 'bold' => false];
                                }, \App\Models\Brand::all()->take(50)->all())
                            )
                        ]
                    ];
                    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\BaseImportTemplate($config, $colors), $filename);

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
                    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\BaseImportTemplate($config, $colors), $filename);

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
                    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\BaseImportTemplate($config, $colors), $filename);

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
                    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\BaseImportTemplate($config, $colors), $filename);

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
                    return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\BaseImportTemplate($config, $colors), $filename);
                
                case 'transactions':
                    // The instruction did not provide a new config for transactions, so keep the old one
                    return \Maatwebsite\Excel\Facades\Excel::download(new class($colors['title_bg'], $colors['req_header_bg'], $colors['guide_bg'], $colors['separator_bg'], 'FFC0504D') implements \Maatwebsite\Excel\Concerns\FromArray, \Maatwebsite\Excel\Concerns\WithStyles {
                        public $mb; public $sb; public $p; public $g; public $dr;
                        public function __construct($mb, $sb, $p, $g, $dr) { $this->mb = $mb; $this->sb = $sb; $this->p = $p; $this->g = $g; $this->dr = $dr; }
                        public function array(): array {
                            return [
                                ['VenQore ERP — Journal Transactions Import Template', '', '', '', ''],
                                ['Date', 'Type (DR/CR)', 'Amount', 'Description', 'Account Code / Name'],
                                ['YYYY-MM-DD', 'DR (Debit) / CR (Credit)', 'Numeric only', 'Reason for entry', 'e.g. 1000 or Cash'],
                                ['▼ Enter your journal entries below — Row 5 onwards ▼', '', '', '', ''],
                                ['2026-03-01', 'DR', '1000', 'Sample Entry', '1000'],
                            ];
                        }
                        public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet) {
                            $sheet->mergeCells('A1:E1'); $sheet->mergeCells('A4:E4');
                            $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16)->getColor()->setARGB('FFFFFFFF');
                            $sheet->getStyle('A1')->getFill()->setFillType('solid')->getStartColor()->setARGB($this->mb);
                            $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');
                            
                            $sheet->getStyle('A2:E2')->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
                            $sheet->getStyle('A2:E2')->getFill()->setFillType('solid')->getStartColor()->setARGB($this->sb);
                            
                            $sheet->getStyle('A3:E3')->getFont()->setItalic(true)->getColor()->setARGB($this->dr);
                            $sheet->getStyle('A3:E3')->getFill()->setFillType('solid')->getStartColor()->setARGB($this->p);
                            
                            $sheet->getStyle('A4')->getFont()->setBold(true)->getColor()->setARGB('FFFFFFFF');
                            $sheet->getStyle('A4')->getFill()->setFillType('solid')->getStartColor()->setARGB($this->g);
                            $sheet->getStyle('A4')->getAlignment()->setHorizontal('center');
                            
                            foreach (range('A', 'E') as $col) { $sheet->getColumnDimension($col)->setAutoSize(true); }
                        }
                    }, $filename);
                
                default:
                    return back()->with('error', "Download for '{$type}' is not yet implemented.");
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Template Download Error: ' . $e->getMessage());
            return back()->with('error', 'Failed to generate template.');
        }
    }
}
