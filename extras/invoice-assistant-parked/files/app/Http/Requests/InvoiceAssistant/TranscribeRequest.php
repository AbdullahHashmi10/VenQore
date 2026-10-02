<?php

namespace App\Http\Requests\InvoiceAssistant;

class TranscribeRequest extends InvoiceAssistantRequest
{
    public function rules(): array
    {
        $maxKb = (int) ceil(((int) config('invoice_assistant.speech.max_bytes', 10 * 1024 * 1024)) / 1024);

        return [
            // Declared type is advisory only; the bytes are inspected in the service.
            'audio'      => ['required', 'file', 'max:' . $maxKb],
            'locale'     => ['nullable', 'string', 'in:' . implode(',', (array) config('invoice_assistant.speech.locales', ['auto', 'en', 'ur']))],
            'request_id' => $this->requestIdRule(),
        ];
    }

    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        // An oversized upload is its own documented status (413), not a generic 422.
        if ($validator->errors()->has('audio') && $this->hasFile('audio')
            && $this->file('audio')->getSize() > (int) config('invoice_assistant.speech.max_bytes', 10 * 1024 * 1024)) {
            throw new \Illuminate\Http\Exceptions\HttpResponseException(response()->json([
                'code'       => 'audio_too_large',
                'message'    => 'That recording is too large. Keep it under 60 seconds.',
                'retryable'  => false,
                'request_id' => (string) ($this->input('request_id') ?: ''),
            ], 413));
        }

        parent::failedValidation($validator);
    }
}
