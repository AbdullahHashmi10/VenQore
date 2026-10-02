<?php

namespace App\Http\Requests\InvoiceAssistant;

class ClarifyDraftRequest extends InvoiceAssistantRequest
{
    public function rules(): array
    {
        return [
            'expected_revision'              => ['required', 'integer', 'min:1'],
            'text'                           => ['nullable', 'string', 'max:' . (int) config('invoice_assistant.max_input_chars', 4000)],
            'selections'                     => ['nullable', 'array', 'max:20'],
            'selections.*.field'             => ['required', 'in:customer,product,unit'],
            'selections.*.line_key'          => ['nullable', 'string', 'regex:/^l\d{1,3}$/'],
            'selections.*.candidate_set_id'  => ['required', 'string', 'max:40'],
            'selections.*.selected_id'       => ['required', 'string', 'max:96'],
            'request_id'                     => $this->requestIdRule(),
        ];
    }
}
