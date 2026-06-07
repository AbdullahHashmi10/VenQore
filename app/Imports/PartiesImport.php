<?php
 
 namespace App\Imports;
 
 use App\Models\Party;
 use Maatwebsite\Excel\Row;
 use Maatwebsite\Excel\Concerns\OnEachRow;
 use Maatwebsite\Excel\Concerns\WithMultipleSheets;
 
 /**
  * Premium Parties Importer
  * Targeted at the first sheet of the VenQore ERP template.
  */
 class PartiesImport implements WithMultipleSheets
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
            0 => new PartiesDataSheetImport($this->mapping, $this, $this->dryRun, $this->overrides, $this->ignoredRows)
        ];
    }
}

class PartiesDataSheetImport implements OnEachRow
{
    protected array $mapping;
    protected ?PartiesImport $parent;
    protected bool $dryRun = false;
    protected array $seenPhones = []; // phone => first_row_index
    protected array $seenNames = [];  // name  => first_row_index
    protected array $seenData = [];   // row_index => data
    protected array $overrides = [];
    protected array $ignoredRows = [];

    public function __construct(array $mapping = [], ?PartiesImport $parent = null, bool $dryRun = false, array $overrides = [], array $ignoredRows = [])
    {
        $this->parent = $parent;
        $this->dryRun = $dryRun;
        $this->overrides = $overrides;
        $this->ignoredRows = $ignoredRows;
        $this->mapping = empty($mapping) ? [
            'name'              => 0,
            'type'              => 1,
            'opening_balance'   => 2,
            'balance_direction' => 3,
            'phone'             => 4,
            'email'             => 5,
            'address'           => 6,
            'credit_limit'      => 7,
            'notes'             => 8,
        ] : $mapping;
    }

    public function onRow(Row $row)
    {
        $index = $row->getIndex();
        if ($index <= 3) return;
        if (in_array($index, $this->ignoredRows)) return; // Skip ignored rows

        $numericArray = $row->toArray();
        if (isset($numericArray[0]) && is_string($numericArray[0])) {
            $firstCell = $numericArray[0];
            if (str_contains($firstCell, 'VenQore ERP —') || str_contains($firstCell, 'Contact Name') ||
                str_contains($firstCell, 'Contact Type') || str_contains($firstCell, '* Required') || 
                str_contains($firstCell, 'Ahmed Traders')) return;
        }

        $data = [];
        foreach ($this->mapping as $expectedKey => $columnIndex) {
            $data[$expectedKey] = ($columnIndex !== null && isset($numericArray[$columnIndex])) ? $numericArray[$columnIndex] : null;
        }

        // Apply manual overrides from frontend
        if (isset($this->overrides[$index])) {
            $data = array_merge($data, $this->overrides[$index]);
        }

        $name = trim($data['name'] ?? '');
        if (empty($name)) return;
        
        $type = strtolower(trim($data['type'] ?? 'customer'));
        if (!in_array($type, ['customer', 'supplier'])) $type = 'customer';

        $phone = $data['phone'] ? trim((string)$data['phone']) : null;
        
        // --- Duplicates/Updates Logic ---
        $existing = null;
        $reason = null;
        $firstRowIndex = null;

        // A. Check INTERNAL duplicates (within this file)
        $lowerName = strtolower($name);
        if ($phone && isset($this->seenPhones[$phone])) {
            $existing = true;
            $firstRowIndex = $this->seenPhones[$phone];
            $reason = "Duplicate phone [$phone] (first seen in row $firstRowIndex)";
        } elseif (isset($this->seenNames[$lowerName])) {
            $existing = true;
            $firstRowIndex = $this->seenNames[$lowerName];
            $reason = "Duplicate name [$name] (first seen in row $firstRowIndex)";
        }
        
        // Store for future duplicate checks
        if (!isset($this->seenPhones[$phone])) $this->seenPhones[$phone] = $index;
        if (!isset($this->seenNames[$lowerName])) $this->seenNames[$lowerName] = $index;
        $this->seenData[$index] = $data;

        // B. Check EXTERNAL duplicates (already in database)
        $dbData = null;
        if (!$existing) {
            $dbParty = $phone ? Party::where('phone', $phone)->first() : null;
            if (!$dbParty) $dbParty = Party::where('name', $name)->first();
            
            if ($dbParty) {
                $existing = true;
                $reason = "Existing contact in database (ID: " . $dbParty->id . ")";
                $dbData = [
                    'name' => $dbParty->name,
                    'phone' => $dbParty->phone,
                    'email' => $dbParty->email,
                    'address' => $dbParty->address,
                    'is_db' => true
                ];
            }
        }

        if ($this->dryRun) {
            if ($existing) {
                $this->parent->warnings[] = [
                    'row' => $index,
                    'name' => $name,
                    'phone' => $phone,
                    'reason' => $reason,
                    'is_db' => $dbData !== null,
                    'data' => $data,
                    'first_row_index' => $firstRowIndex,
                    'first_row_data' => $firstRowIndex ? ($this->seenData[$firstRowIndex] ?? null) : null,
                    'db_data' => $dbData
                ];
                if ($this->parent) $this->parent->updatedCount++;
            } else {
                if ($this->parent) $this->parent->importedCount++;
            }
            return;
        }

        // --- Actual Save/Update Logic (NOT dry run) ---
        $dbParty = $phone ? Party::where('phone', $phone)->first() : null;
        if (!$dbParty) $dbParty = Party::where('name', $name)->first();

        $openingBalance = isset($data['opening_balance']) && is_numeric($data['opening_balance']) ? abs((float)$data['opening_balance']) : 0;
        $dir = strtolower(trim($data['balance_direction'] ?? ''));
        $isReceivable = empty($dir) ? ($type === 'customer') : (strpos($dir, 'receive') !== false);

        if ($dbParty) {
            $dbParty->update([
                'name' => $name, 'type' => $type, 'email' => $data['email'] ?? $dbParty->email,
                'address' => $data['address'] ?? $dbParty->address, 'phone' => $phone ?? $dbParty->phone,
                'opening_balance' => $openingBalance, 'opening_balance_type' => $isReceivable ? 'receivable' : 'payable',
            ]);
            if ($this->parent) $this->parent->updatedCount++;
        } else {
            $curVal = $openingBalance;
            if (($type === 'customer' && !$isReceivable) || ($type === 'supplier' && $isReceivable)) $curVal = -$openingBalance;
            
            Party::create([
                'name' => $name, 'type' => $type, 'phone' => $phone, 'email' => $data['email'] ?? null,
                'address' => $data['address'] ?? null, 'opening_balance' => $openingBalance,
                'opening_balance_type' => $isReceivable ? 'receivable' : 'payable', 'current_balance' => $curVal,
            ]);
            if ($this->parent) $this->parent->importedCount++;
        }
    }
}
