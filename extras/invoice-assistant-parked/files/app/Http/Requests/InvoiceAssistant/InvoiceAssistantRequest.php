<?php

namespace App\Http\Requests\InvoiceAssistant;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

/**
 * Base for every assistant request: authorization is the route's
 * `permission:sales.create` middleware (and InvoiceAssistantAccess), so
 * authorize() is true; validation failures use the documented error body
 * {code,message,field_errors,retryable,request_id}.
 */
abstract class InvoiceAssistantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function failedValidation(Validator $validator): void
    {
        $fields = [];
        foreach ($validator->errors()->toArray() as $k => $msgs) {
            $fields[$k] = array_values($msgs);
        }

        throw new HttpResponseException(response()->json([
            'code'         => 'validation_failed',
            'message'      => 'Check the highlighted fields and try again.',
            'field_errors' => $fields,
            'retryable'    => false,
            'request_id'   => (string) ($this->input('request_id') ?: ''),
        ], 422));
    }

    /** request_id: a client-generated idempotency identity for ONE logical operation. */
    protected function requestIdRule(): array
    {
        return ['required', 'string', 'min:8', 'max:64', 'regex:/^[A-Za-z0-9_\-:.]+$/'];
    }
}
