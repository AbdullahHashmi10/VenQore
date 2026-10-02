<?php

namespace App\Http\Requests\InvoiceAssistant;

class CreateDraftRequest extends InvoiceAssistantRequest
{
    public function rules(): array
    {
        return [
            'text'       => ['required', 'string', 'min:2', 'max:' . (int) config('invoice_assistant.max_input_chars', 4000)],
            'input_mode' => ['required', 'in:text,voice'],
            'request_id' => $this->requestIdRule(),
        ];
    }
}
