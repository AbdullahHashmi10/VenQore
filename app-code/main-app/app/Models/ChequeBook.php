<?php

namespace App\Models;

use App\Traits\HasTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChequeBook extends Model
{
    use HasFactory, HasUuids, HasTenant;

    public const STATUS_ACTIVE    = 'active';
    public const STATUS_EXHAUSTED = 'exhausted';
    public const STATUS_CLOSED    = 'closed';
    public const STATUS_CANCELLED = 'cancelled';

    protected $table = 'cheque_books';

    protected $fillable = [
        'tenant_id',
        'bank_account_id',
        'book_number',
        'prefix',
        'serial_start',
        'serial_end',
        'serial_padding',
        'total_leaves',
        'received_date',
        'status',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'serial_start'   => 'integer',
        'serial_end'     => 'integer',
        'serial_padding' => 'integer',
        'total_leaves'   => 'integer',
        'received_date'  => 'date',
    ];

    protected $appends = [
        'series_prefix',
        'start_number',
        'end_number',
        'padding_zeros',
        'description',
    ];

    public function getSeriesPrefixAttribute(): ?string
    {
        return $this->attributes['prefix'] ?? null;
    }

    public function setSeriesPrefixAttribute(?string $value): void
    {
        $this->attributes['prefix'] = $value;
    }

    public function getStartNumberAttribute(): ?int
    {
        return isset($this->attributes['serial_start']) ? (int) $this->attributes['serial_start'] : null;
    }

    public function setStartNumberAttribute(?int $value): void
    {
        $this->attributes['serial_start'] = $value;
    }

    public function getEndNumberAttribute(): ?int
    {
        return isset($this->attributes['serial_end']) ? (int) $this->attributes['serial_end'] : null;
    }

    public function setEndNumberAttribute(?int $value): void
    {
        $this->attributes['serial_end'] = $value;
    }

    public function getPaddingZerosAttribute(): ?int
    {
        return isset($this->attributes['serial_padding']) ? (int) $this->attributes['serial_padding'] : null;
    }

    public function setPaddingZerosAttribute(?int $value): void
    {
        $this->attributes['serial_padding'] = $value;
    }

    public function getDescriptionAttribute(): ?string
    {
        return $this->attributes['notes'] ?? null;
    }

    public function setDescriptionAttribute(?string $value): void
    {
        $this->attributes['notes'] = $value;
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class, 'bank_account_id');
    }

    public function leaves(): HasMany
    {
        return $this->hasMany(ChequeLeaf::class, 'cheque_book_id')->orderBy('numeric_serial', 'asc');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updateStatusFromLeaves(): void
    {
        $hasAvailable = $this->leaves()->where('status', ChequeLeaf::STATUS_AVAILABLE)->exists();
        $hasReserved  = $this->leaves()->where('status', ChequeLeaf::STATUS_RESERVED)->exists();

        if (!$hasAvailable && !$hasReserved && $this->status === self::STATUS_ACTIVE) {
            $this->update(['status' => self::STATUS_EXHAUSTED]);
        } elseif (($hasAvailable || $hasReserved) && $this->status === self::STATUS_EXHAUSTED) {
            $this->update(['status' => self::STATUS_ACTIVE]);
        }
    }
}
