<?php

namespace App\Services\AiBuilder;

/**
 * ==============================================================================
 * DiscoveryResolver — discovery answers in, module keys out.
 * ==============================================================================
 *
 * The onboarding screens ask the questions in `config/ai_builder.php → discovery`
 * and apply each answer's `implies` map to the stack the visitor watches being
 * built. This class is the server's copy of that arithmetic, and it exists so
 * there is exactly ONE rule about what an answer means rather than two that
 * drift.
 *
 * That drift is not hypothetical. The screen this replaces asked three questions
 * — industry, sales method, team size — of which the server read one. The other
 * two were not even in the validator. A visitor answered them, watched nothing
 * happen, and was right to conclude the questions were decoration.
 *
 * ------------------------------------------------------------------------------
 * THE RULES
 * ------------------------------------------------------------------------------
 *
 *  1. `implies` may only ADD. A yes/no answer never removes a module the matched
 *     preset asked for, because the preset came from the visitor's own sentence
 *     and outranks a tick box. Removing is the user's job on the proposal
 *     screen, where they can see what they are removing.
 *
 *  2. A HIDDEN question contributes nothing. `show_if` is evaluated here, not
 *     just in the UI, because a visitor who answers "a real catalogue", answers
 *     the batch-tracking follow-up, then goes back and changes their mind to
 *     "no stock" leaves a stale answer behind. Honouring it would switch on a
 *     module whose question is no longer on screen.
 *
 *  3. Unknown module keys are dropped SILENTLY, against `config/modules.php`.
 *     Same rule as step 4 of the pipeline in ai_builder.php: the registry is the
 *     only thing that says what exists, and a config typo must never become a
 *     module a customer is promised and cannot find.
 *
 *  4. Non-live modules are dropped too. Enabling a `beta` or `building` module
 *     during onboarding is how a new tenant lands on a 404 in their first
 *     session. Three shipping presets name `services` and `quotations`, which
 *     are still `building` — this is what stops those reaching a customer.
 *
 *  5. Nothing here guesses. An answer that is not a key in that question's
 *     `options` contributes nothing, rather than being fuzzy-matched into the
 *     nearest one.
 */
class DiscoveryResolver
{
    /**
     * The question set, as the screens should render it. Handed over whole so
     * the client never restates a question, an option, a branch or an implies
     * map.
     *
     * @return list<array<string,mixed>>
     */
    public function questionSet(): array
    {
        return array_values(config('ai_builder.discovery', []));
    }

    /**
     * The house recommendations, with the reason shown to the user. Returned
     * separately from the implied set so the proposal screen can put them in
     * their own labelled band — see the note in config/ai_builder.php §3b about
     * why they are never merged in silently.
     *
     * @return array<string,array{why:string}>
     */
    public function recommendations(): array
    {
        $out = [];

        foreach (config('ai_builder.recommended', []) as $key => $meta) {
            if ($this->isLive($key)) {
                $out[$key] = ['why' => $meta['why'] ?? ''];
            }
        }

        return $out;
    }

    /**
     * Modules implied by a set of discovery answers.
     *
     * @param  array<string,string|list<string>>  $answers  question key => option key(s)
     * @return list<string>
     */
    public function impliedModules(array $answers): array
    {
        $implied = [];

        foreach ($this->visibleQuestions($answers) as $question) {
            foreach ($this->chosen($question, $answers) as $optionKey) {
                foreach ($question['implies'][$optionKey] ?? [] as $moduleKey) {
                    $implied[$moduleKey] = true;
                }
            }
        }

        return $this->onlyLive(array_keys($implied));
    }

    /**
     * Merge a preset's modules with what the answers imply, and optionally with
     * the house recommendations.
     *
     * Preset first in its own order, then implied, then recommended. The order
     * is what the live panel animates in, so it is not cosmetic: rows that
     * reorder themselves break the link between the tap and the arrival.
     *
     * @param  list<string>  $presetModules
     * @param  array<string,string|list<string>>  $answers
     * @return list<string>
     */
    public function merge(array $presetModules, array $answers, bool $withRecommended = true): array
    {
        $merged = [];

        $sources = [$presetModules, $this->impliedModules($answers)];
        if ($withRecommended) {
            $sources[] = array_keys($this->recommendations());
        }

        foreach (array_merge(...$sources) as $key) {
            $merged[$key] = true;
        }

        return $this->onlyLive(array_keys($merged));
    }

    /**
     * The sentence the proposal is headed with, when the visitor answered the
     * question that carries one. Config owns the wording; this picks the row.
     *
     * @param  array<string,string|list<string>>  $answers
     */
    public function headline(array $answers): ?string
    {
        foreach ($this->visibleQuestions($answers) as $question) {
            if (empty($question['headline'])) {
                continue;
            }

            foreach ($this->chosen($question, $answers) as $optionKey) {
                if (isset($question['headline'][$optionKey])) {
                    return $question['headline'][$optionKey];
                }
            }
        }

        return null;
    }

    /**
     * Questions whose `show_if` passes for these answers. Rule 2.
     *
     * @param  array<string,string|list<string>>  $answers
     * @return list<array<string,mixed>>
     */
    public function visibleQuestions(array $answers): array
    {
        return array_values(array_filter(
            config('ai_builder.discovery', []),
            fn ($question) => ($question['type'] ?? null) !== 'text'
                && !empty($question['options'])
                && $this->isVisible($question, $answers),
        ));
    }

    /**
     * `show_if` => ['stock' => ['catalogue', 'deep']] means: only if `stock` was
     * answered 'catalogue' or 'deep'. Several keys are ANDed; `show_if_mode` of
     * 'any' ORs them. When the dependency is a multi question, the test passes
     * if ANY selected option is listed.
     *
     * @param  array<string,mixed>  $question
     * @param  array<string,string|list<string>>  $answers
     */
    private function isVisible(array $question, array $answers): bool
    {
        $rules = $question['show_if'] ?? null;
        if (empty($rules)) {
            return true;
        }

        $any = ($question['show_if_mode'] ?? 'all') === 'any';

        foreach ($rules as $depKey => $allowed) {
            $given = $this->normalise($answers[$depKey] ?? null);
            $hit   = count(array_intersect($given, (array) $allowed)) > 0;

            if ($any && $hit) {
                return true;
            }

            if (!$any && !$hit) {
                return false;
            }
        }

        return !$any;
    }

    /**
     * The option keys this visitor actually picked for one question, filtered to
     * real options. Rule 5.
     *
     * @param  array<string,mixed>  $question
     * @param  array<string,string|list<string>>  $answers
     * @return list<string>
     */
    private function chosen(array $question, array $answers): array
    {
        $given   = $this->normalise($answers[$question['key'] ?? ''] ?? null);
        $options = $question['options'] ?? [];

        return array_values(array_filter(
            $given,
            fn ($optionKey) => array_key_exists($optionKey, $options),
        ));
    }

    /**
     * Single answers are strings, multi answers are arrays. Everything downstream
     * treats both as a list.
     *
     * @return list<string>
     */
    private function normalise(mixed $answer): array
    {
        if (is_string($answer)) {
            return $answer === '' ? [] : [$answer];
        }

        if (is_array($answer)) {
            return array_values(array_filter($answer, fn ($v) => is_string($v) && $v !== ''));
        }

        return [];
    }

    private function isLive(string $key): bool
    {
        return (config("modules.{$key}.status") ?? null) === 'live';
    }

    /**
     * Rules 3 and 4, in one pass.
     *
     * @param  list<string>  $keys
     * @return list<string>
     */
    private function onlyLive(array $keys): array
    {
        return array_values(array_filter($keys, fn ($key) => $this->isLive($key)));
    }
}
