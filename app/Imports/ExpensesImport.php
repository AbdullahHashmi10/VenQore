<?php
 
 namespace App\Imports;
 
 use Maatwebsite\Excel\Row;
 use Maatwebsite\Excel\Concerns\OnEachRow;
 use Maatwebsite\Excel\Concerns\WithMultipleSheets;
 use App\Models\Expense;
 use Illuminate\Support\Carbon;
 use Illuminate\Support\Str;
 
 class ExpensesImport implements WithMultipleSheets
 {
     protected array $mapping;
     public int $importedCount = 0;
     public int $updatedCount = 0;
     public array $warnings = [];
     protected bool $dryRun = false;
     protected array $overrides = [];
     protected array $ignoredRows = [];
 
     public function __construct(array $mapping = [], bool $dryRun = false, array $overrides = [], array $ignoredRows = [])
     {
         $this->mapping = $mapping;
         $this->dryRun = $dryRun;
         $this->overrides = $overrides;
         $this->ignoredRows = $ignoredRows;
     }
 
     public function sheets(): array
     {
         return [
             0 => new ExpensesDataSheetImport($this->mapping, $this, $this->dryRun, $this->overrides, $this->ignoredRows)
         ];
     }
 }
 
 class ExpensesDataSheetImport implements OnEachRow
 {
     protected array $mapping;
     protected ?ExpensesImport $parent;
     protected bool $dryRun = false;
     protected array $overrides = [];
     protected array $ignoredRows = [];
     protected array $seenRefs = [];
     protected array $seenData = [];
 
     public function __construct(array $mapping = [], ?ExpensesImport $parent = null, bool $dryRun = false, array $overrides = [], array $ignoredRows = [])
     {
         $this->parent = $parent;
         $this->dryRun = $dryRun;
         $this->overrides = $overrides;
         $this->ignoredRows = $ignoredRows;
         
         if (empty($mapping)) {
             $this->mapping = [
                 'date' => 0, 'category' => 1, 'amount' => 2, 'reference' => 3, 'description' => 4,
             ];
         } else {
             $this->mapping = $mapping;
         }
     }
 
     public function onRow(Row $row)
     {
         $index = $row->getIndex();
         if ($index <= 5) return;
         if (in_array($index, $this->ignoredRows)) return;
 
         $numericArray = $row->toArray();
         if (isset($numericArray[0]) && is_string($numericArray[0])) {
             $firstCell = $numericArray[0];
             if (str_contains($firstCell, 'VenQore ERP —')) return;
         }
 
         $data = [];
         foreach ($this->mapping as $expectedKey => $columnIndex) {
             $data[$expectedKey] = ($columnIndex !== null && isset($numericArray[$columnIndex])) ? $numericArray[$columnIndex] : null;
         }
 
         if (isset($this->overrides[$index])) {
             $data = array_merge($data, $this->overrides[$index]);
         }
 
         if (empty($data['date']) || empty($data['amount'])) return;
 
         $ref = trim((string)($data['reference'] ?? ''));
         $existing = null;
         $reason = null;
         $firstRowIndex = null;
 
         if (!empty($ref) && isset($this->seenRefs[$ref])) {
             $existing = true;
             $firstRowIndex = $this->seenRefs[$ref];
             $reason = "Reference [$ref] repeats in row $firstRowIndex";
         }
         if (!empty($ref)) $this->seenRefs[$ref] = $index;
         $this->seenData[$index] = $data;
 
         if (!$existing && !empty($ref)) {
             $dbExpense = Expense::where('reference_number', $ref)->first();
             if ($dbExpense) {
                 $existing = true;
                 $reason = "Expense Ref [$ref] already exists in DB";
             }
         }
 
         if ($this->dryRun) {
             if ($existing) {
                 $this->parent->warnings[] = [
                     'row' => $index, 'name' => $data['category'] ?? 'Expense', 'phone' => $ref,
                     'reason' => $reason, 'is_db' => str_contains($reason ?? '', 'DB'), 'data' => $data,
                     'first_row_index' => $firstRowIndex,
                     'first_row_data' => $firstRowIndex ? ($this->seenData[$firstRowIndex] ?? null) : null,
                 ];
                 if ($this->parent) $this->parent->updatedCount++;
             } else {
                 if ($this->parent) $this->parent->importedCount++;
             }
             return;
         }
 
         try {
             $date = Carbon::parse($data['date']);
         } catch (\Exception $e) {
             $date = Carbon::now();
         }
 
         Expense::create([
             'date' => $date,
             'category' => $data['category'] ?? 'Miscellaneous',
             'amount' => abs((float)$data['amount']),
             'reference_number' => $data['reference'] ?? null,
             'description' => $data['description'] ?? null,
             'user_id' => \Illuminate\Support\Facades\Auth::id() ?? 1,
         ]);
 
         if ($this->parent) $this->parent->importedCount++;
     }
 }
