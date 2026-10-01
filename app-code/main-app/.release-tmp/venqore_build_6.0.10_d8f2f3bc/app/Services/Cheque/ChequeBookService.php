<?php

namespace App\Services\Cheque;

use App\Models\BankAccount;
use App\Models\ChequeBook;
use App\Models\ChequeLeaf;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use RuntimeException;

class ChequeBookService
{
    public const MAX_LEAVES_PER_BOOK = 500;

    /**
     * Register a new chequebook and generate all its leaves atomically.
     */
    public function registerChequeBook(Tenant $tenant, array $data, ?User $user = null): ChequeBook
    {
        $bankAccountId = $data['bank_account_id'] ?? null;
        if (!$bankAccountId) {
            throw ValidationException::withMessages(['bank_account_id' => 'A bank account is required.']);
        }

        // Validate bank account belongs to current tenant and is of type 'bank'
        $bankAccount = BankAccount::where('tenant_id', $tenant->id)
            ->where('id', $bankAccountId)
            ->first();

        if (!$bankAccount) {
            throw ValidationException::withMessages(['bank_account_id' => 'The selected bank account does not belong to this store.']);
        }

        if ($bankAccount->type !== 'bank' && $bankAccount->account_type === 'cash') {
            throw ValidationException::withMessages(['bank_account_id' => 'Chequebooks can only be registered for bank accounts, not cash drawers or mobile wallets.']);
        }

        $serialStart = (int) ($data['serial_start'] ?? 0);
        $serialEnd   = (int) ($data['serial_end'] ?? 0);

        if ($serialStart <= 0) {
            throw ValidationException::withMessages(['serial_start' => 'Starting serial number must be greater than zero.']);
        }

        if ($serialEnd <= 0) {
            throw ValidationException::withMessages(['serial_end' => 'Ending serial number must be greater than zero.']);
        }

        if ($serialStart > $serialEnd) {
            throw ValidationException::withMessages(['serial_end' => 'Starting serial number cannot be greater than ending serial number.']);
        }

        $totalLeaves = ($serialEnd - $serialStart) + 1;
        if ($totalLeaves > self::MAX_LEAVES_PER_BOOK) {
            throw ValidationException::withMessages([
                'serial_end' => "A chequebook cannot contain more than " . self::MAX_LEAVES_PER_BOOK . " leaves (requested: {$totalLeaves})."
            ]);
        }

        $prefix = !empty($data['prefix']) ? strtoupper(trim($data['prefix'])) : null;
        $padding = isset($data['serial_padding']) ? max(1, min(12, (int) $data['serial_padding'])) : 6;
        $receivedDate = $data['received_date'] ?? now()->toDateString();
        $bookNumber = !empty($data['book_number']) ? trim($data['book_number']) : null;
        $notes = $data['notes'] ?? null;

        return DB::transaction(function () use (
            $tenant, $bankAccount, $prefix, $serialStart, $serialEnd,
            $padding, $totalLeaves, $receivedDate, $bookNumber, $notes, $user
        ) {
            // Check for range overlap on the same bank account
            $overlap = ChequeBook::where('tenant_id', $tenant->id)
                ->where('bank_account_id', $bankAccount->id)
                ->where('status', '!=', ChequeBook::STATUS_CANCELLED)
                ->where(function ($query) use ($prefix) {
                    if ($prefix) {
                        $query->where('prefix', $prefix);
                    } else {
                        $query->whereNull('prefix')->orWhere('prefix', '');
                    }
                })
                ->where(function ($query) use ($serialStart, $serialEnd) {
                    $query->where(function ($q) use ($serialStart, $serialEnd) {
                        $q->where('serial_start', '<=', $serialEnd)
                          ->where('serial_end', '>=', $serialStart);
                    });
                })
                ->lockForUpdate()
                ->first();

            if ($overlap) {
                throw ValidationException::withMessages([
                    'serial_start' => "Serial range {$serialStart}–{$serialEnd} overlaps with existing chequebook '{$overlap->book_number}' ({$overlap->serial_start}–{$overlap->serial_end})."
                ]);
            }

            // Create the chequebook record
            $book = ChequeBook::create([
                'tenant_id'       => $tenant->id,
                'bank_account_id' => $bankAccount->id,
                'book_number'     => $bookNumber,
                'prefix'          => $prefix,
                'serial_start'    => $serialStart,
                'serial_end'      => $serialEnd,
                'serial_padding'  => $padding,
                'total_leaves'    => $totalLeaves,
                'received_date'   => $receivedDate,
                'status'          => ChequeBook::STATUS_ACTIVE,
                'notes'           => $notes,
                'created_by'      => $user?->id ?? auth()->id(),
            ]);

            // Generate individual cheque leaves
            $leaves = [];
            $now = now();
            $userId = $user?->id ?? auth()->id();

            for ($num = $serialStart; $num <= $serialEnd; $num++) {
                $displaySerial = ChequeNumberNormalizer::formatDisplay($num, $prefix, $padding);
                $normalizedSerial = ChequeNumberNormalizer::normalize($displaySerial);

                // Secondary check for normalized serial existence on this bank account
                $leafExists = ChequeLeaf::where('tenant_id', $tenant->id)
                    ->where('bank_account_id', $bankAccount->id)
                    ->where('normalized_serial_number', $normalizedSerial)
                    ->exists();

                if ($leafExists) {
                    throw ValidationException::withMessages([
                        'serial_start' => "Cheque leaf '{$displaySerial}' already exists for this bank account."
                    ]);
                }

                $leaves[] = [
                    'id'                       => (string) \Illuminate\Support\Str::uuid(),
                    'tenant_id'                => $tenant->id,
                    'cheque_book_id'           => $book->id,
                    'bank_account_id'          => $bankAccount->id,
                    'normalized_serial_number' => $normalizedSerial,
                    'display_serial_number'    => $displaySerial,
                    'numeric_serial'           => $num,
                    'status'                   => ChequeLeaf::STATUS_AVAILABLE,
                    'created_by'               => $userId,
                    'updated_by'               => $userId,
                    'created_at'               => $now,
                    'updated_at'               => $now,
                ];
            }

            ChequeLeaf::insert($leaves);

            return $book->fresh(['bankAccount', 'leaves']);
        });
    }

    /**
     * Create a new chequebook with positional/named parameters and strict argument validation.
     */
    public function createChequeBook(
        Tenant $tenant,
        string $bankAccountId,
        int $startNumber,
        int $endNumber,
        ?string $seriesPrefix = null,
        int $paddingZeros = 6,
        ?string $description = null,
        ?User $user = null
    ): ChequeBook {
        if ($startNumber > $endNumber) {
            throw new InvalidArgumentException("Starting number ({$startNumber}) cannot be greater than ending number ({$endNumber}).");
        }

        $totalLeaves = ($endNumber - $startNumber) + 1;
        if ($totalLeaves > self::MAX_LEAVES_PER_BOOK) {
            throw new InvalidArgumentException("Chequebook range cannot exceed " . self::MAX_LEAVES_PER_BOOK . " leaves in a single book.");
        }

        try {
            return $this->registerChequeBook($tenant, [
                'bank_account_id' => $bankAccountId,
                'serial_start'    => $startNumber,
                'serial_end'      => $endNumber,
                'prefix'          => $seriesPrefix,
                'serial_padding'  => $paddingZeros,
                'notes'           => $description,
                'book_number'     => ($seriesPrefix ? $seriesPrefix . '-' : '') . $startNumber . '-' . $endNumber,
            ], $user);
        } catch (ValidationException $e) {
            $firstError = collect($e->errors())->flatten()->first();
            throw new InvalidArgumentException($firstError, 0, $e);
        }
    }

    /**
     * Find the next available cheque leaf for a bank account.
     */
    public function getNextAvailableLeaf(Tenant $tenant, string $bankAccountId): ?ChequeLeaf
    {
        return ChequeLeaf::where('tenant_id', $tenant->id)
            ->where('bank_account_id', $bankAccountId)
            ->where('status', ChequeLeaf::STATUS_AVAILABLE)
            ->orderBy('numeric_serial', 'asc')
            ->first();
    }

    /**
     * Close a chequebook.
     */
    public function closeChequeBook(Tenant $tenant, ChequeBook|string $book, ?User $user = null): ChequeBook
    {
        $bookModel = is_string($book)
            ? ChequeBook::where('tenant_id', $tenant->id)->where('id', $book)->firstOrFail()
            : $book;

        if ($bookModel->tenant_id != $tenant->id) {
            throw new RuntimeException("Chequebook does not belong to current tenant.");
        }

        $bookModel->update([
            'status' => ChequeBook::STATUS_CLOSED,
        ]);

        return $bookModel->fresh(['bankAccount', 'leaves']);
    }

    /**
     * Delete a chequebook. Only allowed if NONE of its leaves have been used, reserved, or audited.
     */
    public function deleteChequeBook(Tenant $tenant, ChequeBook|string $book, ?User $user = null): bool
    {
        $bookModel = is_string($book)
            ? ChequeBook::where('tenant_id', $tenant->id)->where('id', $book)->firstOrFail()
            : $book;

        if ($bookModel->tenant_id != $tenant->id) {
            throw new RuntimeException("Chequebook does not belong to current tenant.");
        }

        return DB::transaction(function () use ($bookModel) {
            $usedCount = $bookModel->leaves()
                ->where('status', '!=', ChequeLeaf::STATUS_AVAILABLE)
                ->count();

            if ($usedCount > 0) {
                throw new InvalidArgumentException("Cannot delete chequebook because {$usedCount} leaves have already been used or issued.");
            }

            $bookModel->leaves()->delete();
            return $bookModel->delete();
        });
    }

    /**
     * Check if all leaves of a chequebook have been used/exhausted and update its status.
     */
    public function checkAndUpdateExhaustion(Tenant $tenant, ChequeBook|string $book): ChequeBook
    {
        $bookModel = is_string($book)
            ? ChequeBook::where('tenant_id', $tenant->id)->where('id', $book)->firstOrFail()
            : $book;

        if ($bookModel->tenant_id != $tenant->id) {
            throw new RuntimeException("Chequebook does not belong to current tenant.");
        }

        $bookModel->updateStatusFromLeaves();

        return $bookModel->fresh(['bankAccount', 'leaves']);
    }
}
