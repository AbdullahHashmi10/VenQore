<?php

namespace App\Http\Requests\InvoiceAssistant;

class HandoffDraftRequest extends InvoiceAssistantRequest
{
    public function rules(): array
    {
        return [
            'expected_revision' => ['required', 'integer', 'min:1'],
            'request_id'        => $this->requestIdRule(),
        ];
    }
}
