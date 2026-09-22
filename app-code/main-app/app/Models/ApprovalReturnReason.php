<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ApprovalReturnReason extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'requires_notes' => 'boolean',
        'applies_to'     => 'array',
        'is_active'      => 'boolean',
    ];

    public static function seedDefaultReasons(?int $tenantId = null): void
    {
        $defaults = [
            [
                'code'           => 'INCORRECT_AMOUNT',
                'label'          => 'Incorrect amount or calculation discrepancy',
                'requires_notes' => false,
                'applies_to'     => ['all'],
            ],
            [
                'code'           => 'MISSING_ATTACHMENT',
                'label'          => 'Missing supporting document, receipt, or bill image',
                'requires_notes' => false,
                'applies_to'     => ['all'],
            ],
            [
                'code'           => 'WRONG_ACCOUNT_OR_PARTY',
                'label'          => 'Wrong customer, supplier, or ledger account selected',
                'requires_notes' => true,
                'applies_to'     => ['all'],
            ],
            [
                'code'           => 'INSUFFICIENT_STOCK_OR_TERMS',
                'label'          => 'Payment terms, credit limit, or inventory terms invalid',
                'requires_notes' => true,
                'applies_to'     => ['sales_invoice', 'supplier_payment'],
            ],
            [
                'code'           => 'OTHER_CLARIFICATION',
                'label'          => 'Other explanation or correction required',
                'requires_notes' => true,
                'applies_to'     => ['all'],
            ],
        ];

        foreach ($defaults as $reason) {
            static::updateOrCreate(
                ['tenant_id' => $tenantId, 'code' => $reason['code']],
                [
                    'label'          => $reason['label'],
                    'requires_notes' => $reason['requires_notes'],
                    'applies_to'     => $reason['applies_to'],
                    'is_active'      => true,
                ]
            );
        }
    }
}
