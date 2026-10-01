<?php

namespace App\Services\Ai;

class AiSchema
{
    public function __construct(
        public string $name,
        public array $schema = []
    ) {}

    public static function scanResult(): self
    {
        return new self('scan_result', [
            'type' => 'object',
            'required' => ['items'],
            'properties' => [
                'action' => ['type' => 'string'],
                'party' => ['type' => 'string'],
                'items' => ['type' => 'array'],
                'document_type' => ['type' => 'string'],
                'total' => ['type' => 'number'],
                'tax' => ['type' => 'number'],
                'date' => ['type' => 'string'],
            ]
        ]);
    }

    public static function catalogCopy(): self
    {
        return new self('catalog_copy', [
            'type' => 'object',
            'required' => ['ai_title'],
            'properties' => [
                'ai_title'             => ['type' => 'string'],
                'ai_description_short' => ['type' => 'string'],
                'ai_description_long'  => ['type' => 'string'],
                'ai_tags'              => ['type' => 'string'],
            ]
        ]);
    }

    public static function jsonObject(?array $schema = null, string $name = 'json_object'): self
    {
        return new self($name, $schema ?? ['type' => 'object']);
    }

    /**
     * Validate and normalize decoded JSON or raw string.
     * Returns ['valid' => bool, 'data' => mixed, 'errors' => array]
     */
    public function validate(mixed $data): array
    {
        if (is_string($data)) {
            $decoded = json_decode($data, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data = $decoded;
            }
        }

        if (!is_array($data)) {
            return [
                'valid'  => false,
                'data'   => $data,
                'errors' => ['Payload is not a valid JSON object or array'],
            ];
        }

        $errors = [];
        $required = $this->schema['required'] ?? [];
        foreach ($required as $field) {
            if (!array_key_exists($field, $data) || $data[$field] === null || $data[$field] === '') {
                $errors[] = "Missing required schema field: {$field}";
            }
        }

        return [
            'valid'  => empty($errors),
            'data'   => $data,
            'errors' => $errors,
        ];
    }
}
