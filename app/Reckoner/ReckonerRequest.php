<?php

namespace App\Reckoner;

/**
 * One request for one reading. See §4.
 */
final class ReckonerRequest
{
    public function __construct(
        public string $key,
        public string $period = 'today',
        public ?array $custom = null,
        public ?string $granularity = null,
        public array $args = [],
    ) {
    }

    public function getCompositeId(): string
    {
        $argsHash = md5(json_encode($this->args));
        $periodStr = $this->period;
        if ($this->custom) {
            $periodStr .= '_' . md5(json_encode($this->custom));
        }
        return "{$this->key}|{$periodStr}|{$argsHash}";
    }
}
