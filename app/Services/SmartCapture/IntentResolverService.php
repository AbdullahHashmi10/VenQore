<?php

namespace App\Services\SmartCapture;

class IntentResolverService
{
    /**
     * Map a raw action string to a validated VenQore action type.
     */
    public function resolve(string $action): string
    {
        $normalized = strtolower(trim($action));

        switch ($normalized) {
            case 'purchase':
            case 'buy':
            case 'received':
                return 'purchase';

            case 'sale':
            case 'invoice':
            case 'checkout':
            case 'sold':
                return 'sale';

            case 'expense':
            case 'utility':
            case 'bill':
            case 'operating_expense':
                return 'expense';

            case 'return':
            case 'refund':
            case 'reversal':
            case 'credit_note':
                return 'return';

            case 'proposal':
            case 'quote':
            case 'estimate':
                return 'proposal';

            case 'pre_invoice':
            case 'sales_order':
                return 'pre_invoice';

            case 'pre_purchase':
            case 'purchase_order':
                return 'pre_purchase';

            case 'recurring_invoice':
            case 'recurring':
                return 'recurring_invoice';

            case 'purchase_return':
            case 'debit_note':
                return 'purchase_return';

            default:
                return 'sale'; // Default safe fallback
        }
    }
}
