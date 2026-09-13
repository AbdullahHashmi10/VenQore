<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Cell\DataValidation;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

/**
 * Premium 3-Sheet Import Template System
 */
class BaseImportTemplate implements WithMultipleSheets
{
    protected $config;
    protected $colors;

    public function __construct(array $config, array $colors = [])
    {
        $this->config = $config;
        $this->colors = $colors;
    }

    public function sheets(): array
    {
        return [
            new MainDataSheet($this->config['sheet1'], $this->config['validations'] ?? [], $this->colors),
            new InstructionSheet($this->config['sheet2'], $this->colors),
            new OptionsSheet($this->config['sheet3'], $this->colors),
        ];
    }
}

class MainDataSheet implements FromArray, WithStyles, WithTitle, WithEvents
{
    protected $config;
    protected $validations;
    protected $colors;

    public function __construct($config, $validations, $colors = [])
    {
        $this->config = $config;
        $this->validations = $validations;
        $this->colors = $colors;
    }

    public function title(): string
    {
        return '📋 Import Data';
    }

    public function array(): array
    {
        $data = [];
        $data[] = [$this->config['title']]; // Row 1
        
        $headers = [];
        foreach ($this->config['columns'] as $col) {
            $headers[] = $col['label'];
        }
        $data[] = $headers; // Row 2

        $guides = [];
        foreach ($this->config['columns'] as $col) {
            $guides[] = $col['guide'] ?? '';
        }
        $data[] = $guides; // Row 3

        $data[] = ['▼ Enter your data below — Row 5 onwards ▼']; // Row 4 (Separator)

        foreach ($this->config['examples'] as $example) {
            $data[] = $example;
        }

        // Add 300 blank rows
        for ($i = 0; $i < 300; $i++) {
            $data[] = array_fill(0, count($headers), "");
        }

        return $data;
    }

    public function styles(Worksheet $sheet)
    {
        $n_cols = count($this->config['columns']);
        $last_col = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($n_cols);

        // Row 1: Title
        $sheet->mergeCells("A1:{$last_col}1");
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(32);

        // Row 2: Headers
        $sheet->getRowDimension(2)->setRowHeight(36);
        foreach ($this->config['columns'] as $i => $col) {
            $col_letter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($i + 1);
            $bg = $col['required'] ? 'FF2563EB' : 'FF64748B';
            $sheet->getStyle("{$col_letter}2")->applyFromArray([
                'font' => ['bold' => true, 'size' => 10, 'color' => ['argb' => 'FFFFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $bg]],
                'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFFFFFFF']]],
            ]);
            $sheet->getColumnDimension($col_letter)->setWidth($col['width'] ?? 20);
        }

        // Row 3: Guides
        $sheet->getRowDimension(3)->setRowHeight(40);
        $sheet->getStyle("A3:{$last_col}3")->applyFromArray([
            'font' => ['italic' => true, 'size' => 9, 'color' => ['argb' => 'FF92400E']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFFFFBEB']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER, 'wrapText' => true],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFFCD34D']]],
        ]);

        // Row 4: Separator
        $sheet->mergeCells("A4:{$last_col}4");
        $sheet->getStyle('A4')->applyFromArray([
            'font' => ['bold' => true, 'size' => 9, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF16A34A']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
        ]);
        $sheet->getRowDimension(4)->setRowHeight(20);

        // Example Rows
        $ex_count = count($this->config['examples']);
        for ($i = 0; $i < $ex_count; $i++) {
            $row_idx = 5 + $i;
            $bg = ($i % 2 == 0) ? 'FFF0FDF4' : 'FFECFDF5';
            $sheet->getStyle("A{$row_idx}:{$last_col}{$row_idx}")->applyFromArray([
                'font' => ['size' => 10, 'color' => ['argb' => 'FF166534']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $bg]],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFBBF7D0']]],
            ]);
        }

        // Data Rows
        $data_start = 5 + $ex_count;
        $data_end = $data_start + 300;
        for ($i = $data_start; $i < $data_end; $i++) {
            $bg = ($i % 2 == 0) ? 'FFFFFFFF' : 'FFF8FAFC';
            $sheet->getStyle("A{$i}:{$last_col}{$i}")->applyFromArray([
                'font' => ['size' => 10],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $bg]],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
            ]);
        }

        $sheet->freezePane('A5');
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function(AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $data_end = 5 + count($this->config['examples']) + 300;
                
                foreach ($this->validations as $v) {
                    $col = $v['col'];
                    $dv = $sheet->getDataValidation("{$col}5:{$col}{$data_end}");
                    $dv->setType($v['type'] == 'list' ? DataValidation::TYPE_LIST : ($v['type'] == 'decimal' ? DataValidation::TYPE_DECIMAL : DataValidation::TYPE_WHOLE));
                    
                    if ($v['type'] == 'list') {
                        $dv->setFormula1($v['formula']);
                    } else {
                        $dv->setOperator($v['operator']);
                        $dv->setFormula1($v['formula']);
                    }
                    
                    $dv->setShowDropDown(true);
                    $dv->setShowErrorMessage(true);
                    $dv->setErrorTitle($v['error_title'] ?? 'Invalid Value');
                    $dv->setError($v['error_msg'] ?? 'Please enter a valid value.');
                    $dv->setPromptTitle($v['prompt_title'] ?? '');
                    $dv->setPrompt($v['prompt_msg'] ?? '');
                }
            },
        ];
    }
}

class InstructionSheet implements FromArray, WithStyles, WithTitle
{
    protected $config;
    protected $colors;

    public function __construct($config, $colors = [])
    {
        $this->config = $config;
        $this->colors = $colors;
    }

    public function title(): string
    {
        return '📖 How To Fill This';
    }

    public function array(): array
    {
        $data = [[$this->config['title']]];
        foreach ($this->config['instructions'] as $row) {
            $data[] = [$row['label'], $row['explanation']];
        }
        return $data;
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getColumnDimension('A')->setWidth(24);
        $sheet->getColumnDimension('B')->setWidth(72);
        $sheet->mergeCells('A1:B1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(32);

        foreach ($this->config['instructions'] as $i => $row) {
            $row_idx = $i + 2;
            $bg = str_replace('#', '', $row['bg'] ?? 'F8FAFC');
            if (strlen($bg) == 6) $bg = 'FF' . $bg;
            
            $lines = substr_count($row['explanation'], "\n") + 1;
            $sheet->getRowDimension($row_idx)->setRowHeight(max(20, $lines * 15 + 8));
        }

        $sheet->freezePane('A2');
    }
}

class OptionsSheet implements FromArray, WithStyles, WithTitle
{
    protected $config;
    protected $colors;

    public function __construct($config, $colors = [])
    {
        $this->config = $config;
        $this->colors = $colors;
    }

    public function title(): string
    {
        return '✅ Valid Options';
    }

    public function array(): array
    {
        $data = [[$this->config['title']]];
        foreach ($this->config['options'] as $row) {
            $data[] = [$row['field'], $row['value'], $row['note']];
        }
        return $data;
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getColumnDimension('A')->setWidth(22);
        $sheet->getColumnDimension('B')->setWidth(28);
        $sheet->getColumnDimension('C')->setWidth(46);
        $sheet->mergeCells('A1:C1');
        $sheet->getStyle('A1')->applyFromArray([
            'font' => ['bold' => true, 'size' => 14, 'color' => ['argb' => 'FFFFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF1E293B']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(32);

        foreach ($this->config['options'] as $i => $row) {
            $row_idx = $i + 2;
            $bg = str_replace('#', '', $row['bg'] ?? 'F8FAFC');
            if (strlen($bg) == 6) $bg = 'FF' . $bg;
            
            $sheet->getStyle("A{$row_idx}:C{$row_idx}")->applyFromArray([
                'font' => ['bold' => $row['bold'] ?? false, 'size' => 10],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => $bg]],
                'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['argb' => 'FFCBD5E1']]],
            ]);
        }

        $sheet->freezePane('A2');
    }
}
