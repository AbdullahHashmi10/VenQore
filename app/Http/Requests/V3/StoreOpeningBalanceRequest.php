<?php

namespace App\Http\Requests\V3;

use Illuminate\Foundation\Http\FormRequest;

class StoreOpeningBalanceRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'entry_date'   => ['required', 'date', 'before_or_equal:today'],
            'entries'      => ['required', 'array', 'min:1'],
            'entries.*.account_code' => ['required', 'string',
                                         'exists:accounts,code'],
            'entries.*.amount'       => ['required', 'numeric'],
            'entries.*.side'         => ['required', 'in:debit,credit'],
            'entries.*.party_id'     => ['nullable', 'string',
                                         'exists:parties,id'],

            // Inventory opening stock entries
            'stock_entries'                      => ['nullable', 'array'],
            'stock_entries.*.product_id'         => ['required', 'string',
                                                     'exists:products,id'],
            'stock_entries.*.warehouse_id'       => ['required', 'string',
                                                     'exists:warehouses,id'],
            'stock_entries.*.qty'                => ['required', 'numeric',
                                                     'min:0.0001'],
            'stock_entries.*.unit_cost'          => ['required', 'numeric',
                                                     'min:0.01'],
            // min:0.01 enforces S-055 at app layer before DB constraint fires
        ];
    }

    public function messages(): array
    {
        return [
            'stock_entries.*.unit_cost.min' =>
                'Opening stock unit cost cannot be zero (S-055). ' .
                'Every opening batch must have a known cost.',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // Block account 7000 from being directly specified —
            // the controller posts to 7000 automatically as the balancing side
            $entries = $this->input('entries', []);
            foreach ($entries as $index => $entry) {
                if (($entry['account_code'] ?? '') === '7000') {
                    $validator->errors()->add(
                        "entries.{$index}.account_code",
                        'Account 7000 is managed automatically. ' .
                        'Do not include it in entries — it is posted as the balancing side.'
                    );
                }
            }
        });
    }
}
