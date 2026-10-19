<?php

namespace App\Services\Builder;

/**
 * Writes the "Is this you?" paragraph from CONFIRMED facts only (§8).
 * Assumptions are listed separately by the composer, never woven in here.
 */
class SummaryWriter
{
    public function __construct(private BuilderPolicy $policy)
    {
    }

    /** @return array{text:string,html:string,chips:array<int,array{fact:string,text:string}>} */
    public function write(BuilderSession $s): array
    {
        $cond = new Condition($s->facts, $this->policy, $s->typeKey, 'confirmed');
        // Catalogue labels ("Grocery & kiryana stores") do not read as a noun, so the sentence uses the
        // generic word after `|`. The picked type is shown separately on the read-back.
        $typeNoun = '';

        $parts = [];
        $chips = [];
        foreach ((array) $this->policy->summary['fragments'] as $f) {
            if (! $cond->test($f['when'])) {
                continue;
            }
            $text = preg_replace_callback('/\{type\|([^}]*)\}/', fn ($m) => $typeNoun !== '' ? $typeNoun : $m[1], $f['text']);
            $parts[] = $text;
            $chips[] = ['fact' => $f['fact'], 'text' => trim(str_replace('*', '', $text))];
        }
        if (! $parts) {
            return ['text' => '', 'html' => '', 'chips' => []];
        }

        $sentence = $this->join($parts);
        $plain = str_replace('**', '', $sentence);

        return ['text' => $plain, 'html' => $this->html($sentence), 'chips' => $chips];
    }

    /** "A, b, c and d." — a following fragment that begins "from" attaches without a comma. */
    private function join(array $parts): string
    {
        $out = '';
        $last = count($parts) - 1;
        foreach ($parts as $i => $p) {
            if ($i === 0) {
                $out = $p;
            } elseif (str_starts_with($p, 'from ')) {
                $out .= ' ' . $p;
            } elseif ($i === $last) {
                $out .= ' and ' . $p;
            } else {
                $out .= ', ' . $p;
            }
        }

        return $out . '.';
    }

    private function html(string $markdown): string
    {
        $safe = htmlspecialchars($markdown, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        return preg_replace('/\*\*(.+?)\*\*/', '<strong>$1</strong>', $safe);
    }
}
