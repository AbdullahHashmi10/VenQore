<?php

namespace App\Services\AiBuilder;

use App\Engines\ModuleDependencyResolver;
use App\Models\Tenant;

/*
|==============================================================================
| STEP 11 — ConfigurationValidator
|==============================================================================
|
| CONTAINS NO AI. That is the entire point.
|
| The build plan's acceptance criterion, verbatim:
|
|     "no AI output, however hostile, can produce an invalid configuration."
|
| That is not a promise about the model. It is a property of this file. The
| model proposes; this disposes. If a future model is smarter, more confident
| or actively adversarial, nothing here changes.
|
|------------------------------------------------------------------------------
| THE PIPELINE — steps 3 to 11, in this order, no exceptions
|------------------------------------------------------------------------------
|   3. schema           malformed -> fall back to the preset picker
|   4. unknown-key drop  not in config/modules.php -> gone, SILENTLY
|   5. Qore strip        on the denylist -> gone, SILENTLY
|   6. status filter     beta/building -> "coming soon", never enabled
|   7. resolve requires  cascade, with an explanation for each addition
|   8. requires_one      ASK; never guess
|   9. conflicts         reject
|  10. data safety       refuse silent disable of a module holding rows
|  11. normalize         dedupe, sort, cap
|
| WHY STEPS 4 AND 5 ARE SILENT
| ----------------------------
| A dropped hallucination should be invisible. Telling a shopkeeper "the AI
| suggested 'blockchain_ledger', which does not exist" teaches them the system
| is unreliable. Removing it and moving on teaches them nothing, which is
| correct — it was never real.
|
| Qore keys are stripped equally silently, and for a stronger reason: the user
| must never learn that "accounting" was ever a switchable thing.
|==============================================================================
*/
class ConfigurationValidator
{
    /** Hard ceiling. There are 46 modules; anything larger is not a proposal. */
    private const MAX_MODULES = 46;

    /** Refuse absurd payloads before doing any work on them. */
    private const MAX_INPUT_KEYS = 500;

    public function __construct(private ModuleDependencyResolver $resolver)
    {
    }

    /**
     * @param  mixed  $raw  whatever came back from the model — string or array
     * @return array{
     *     ok: bool,
     *     modules: string[],
     *     terminology: array,
     *     dashboard: string[],
     *     added: array,
     *     questions: array,
     *     suggestions: string[],
     *     coming_soon: string[],
     *     reasoning: string,
     *     unsupported: string[],
     *     confidence: float,
     *     preset: ?string,
     *     fallback_reason: ?string
     * }
     */
    public function validate($raw, ?Tenant $tenant = null): array
    {
        // ── STEP 3: schema ───────────────────────────────────────────────────
        $data = $this->decode($raw);

        if ($data === null) {
            return $this->fallback('The response was not valid JSON.');
        }

        if (!is_array($data['modules'] ?? null)) {
            return $this->fallback('The response contained no module list.');
        }

        if (count($data['modules']) > self::MAX_INPUT_KEYS) {
            // Not an error worth explaining — just refuse and show the picker.
            return $this->fallback('The response was implausibly large.');
        }

        $registry = config('modules', []);
        $denylist = config('qore.denylist', []);

        $comingSoon = [];
        $clean = [];

        foreach ($data['modules'] as $key) {
            // Anything that is not a plain string cannot be a module key. This
            // is also where nested arrays, objects and injection payloads die.
            if (!is_string($key)) {
                continue;
            }

            $key = strtolower(trim($key));

            // ── STEP 5: Qore strip (BEFORE the registry check, deliberately) ─
            // A Qore word must never be reported, logged as a near-miss, or
            // surfaced in any way. Checking it first means it cannot leak
            // through a future change to the registry lookup.
            if (in_array($key, $denylist, true)) {
                continue;
            }

            // ── STEP 4: unknown-key drop ─────────────────────────────────────
            if (!isset($registry[$key])) {
                continue;
            }

            // ── STEP 6: status filter ────────────────────────────────────────
            if (($registry[$key]['status'] ?? 'live') !== 'live') {
                $comingSoon[$key] = $registry[$key]['label'];
                continue;
            }

            $clean[] = $key;
        }

        if ($clean === []) {
            return $this->fallback('Nothing usable survived validation.');
        }

        // ── STEPS 7 & 8: dependencies and requires_one ───────────────────────
        $resolved = $this->resolver->resolve($clean);

        // ── STEP 9: conflicts ────────────────────────────────────────────────
        // No module declares a conflict today, which is a good sign — conflicts
        // usually mean two modules are really one. The check stays so that
        // adding one later is a config edit, not a code change.
        $conflicts = $this->conflicts($resolved['modules'], $registry);

        if ($conflicts !== []) {
            return $this->fallback('The proposal contained conflicting modules: '.implode(', ', $conflicts));
        }

        // ── STEP 11: normalize ───────────────────────────────────────────────
        $modules = array_slice(array_values(array_unique($resolved['modules'])), 0, self::MAX_MODULES);

        return [
            'ok'              => true,
            'modules'         => $modules,
            'terminology'     => $this->cleanTerminology($data['terminology'] ?? []),
            'dashboard'       => $this->cleanCards($data['dashboard'] ?? []),
            'added'           => $resolved['added'],
            'questions'       => $resolved['questions'],
            'suggestions'     => $resolved['suggestions'],
            'coming_soon'     => array_values($comingSoon),
            'reasoning'       => $this->cleanText($data['reasoning'] ?? '', 500),
            'unsupported'     => $this->cleanList($data['unsupported'] ?? [], 10, 120),
            'confidence'      => $this->cleanConfidence($data['confidence'] ?? 0),
            'preset'          => $this->cleanPreset($data['preset'] ?? null),
            'fallback_reason' => null,
        ];
    }

    /**
     * STEP 10 — data safety.
     *
     * Called separately, because it needs the tenant and its answer is a
     * QUESTION, not a rejection: "You have 1,284 expenses recorded here.
     * Switching this off hides the screens — nothing is deleted."
     *
     * @return array<string, array> module key => table => row count
     */
    public function dataAtRisk(Tenant $tenant, array $currentlyEnabled, array $proposed): array
    {
        $atRisk = [];

        foreach (array_diff($currentlyEnabled, $proposed) as $moduleKey) {
            $counts = \App\Services\ModuleService::dataAtStake($tenant, $moduleKey);

            if ($counts !== []) {
                $atRisk[$moduleKey] = $counts;
            }
        }

        return $atRisk;
    }

    // ---------------------------------------------------------------- cleaners

    /**
     * Models wrap JSON in markdown fences, prose, or both. Strip the common
     * shapes rather than failing — being strict here costs a real onboarding
     * for a formatting habit.
     */
    private function decode($raw): ?array
    {
        if (is_array($raw)) {
            return $raw;
        }

        if (!is_string($raw)) {
            return null;
        }

        $text = trim($raw);
        $text = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', $text);

        $decoded = json_decode($text, true);

        if (is_array($decoded)) {
            return $decoded;
        }

        // Last resort: the first {...} block in a chatty response.
        if (preg_match('/\{.*\}/s', $text, $m)) {
            $decoded = json_decode($m[0], true);

            if (is_array($decoded)) {
                return $decoded;
            }
        }

        return null;
    }

    private function conflicts(array $modules, array $registry): array
    {
        $found = [];

        foreach ($modules as $key) {
            foreach ($registry[$key]['conflicts'] ?? [] as $other) {
                if (in_array($other, $modules, true)) {
                    $found[] = "{$key} + {$other}";
                }
            }
        }

        return array_unique($found);
    }

    /** Only real Terms keys survive, with lengths capped. */
    private function cleanTerminology($terminology): array
    {
        if (!is_array($terminology)) {
            return [];
        }

        try {
            $valid = array_keys(
                (new \ReflectionClass(\App\Support\Terms::class))->getStaticPropertyValue('fallbacks')
            );
        } catch (\Throwable) {
            return [];
        }

        $clean = [];

        foreach ($terminology as $key => $words) {
            if (!is_string($key) || !in_array($key, $valid, true) || !is_array($words)) {
                continue;
            }

            $singular = $this->cleanText($words['singular'] ?? '', 80);
            $plural   = $this->cleanText($words['plural'] ?? '', 80);

            if ($singular === '' || $plural === '') {
                continue;
            }

            $clean[$key] = ['singular' => $singular, 'plural' => $plural];
        }

        return $clean;
    }

    private function cleanCards($cards): array
    {
        if (!is_array($cards)) {
            return [];
        }

        try {
            $valid = array_keys(\App\Services\Dashboard\DashboardRegistry::all());
        } catch (\Throwable) {
            return [];
        }

        return array_values(array_intersect(
            array_filter($cards, 'is_string'),
            $valid
        ));
    }

    private function cleanPreset($preset): ?string
    {
        if (!is_string($preset)) {
            return null;
        }

        return array_key_exists($preset, config('ai_builder.presets', [])) ? $preset : null;
    }

    private function cleanConfidence($value): float
    {
        if (!is_numeric($value)) {
            return 0.0;
        }

        return max(0.0, min(1.0, (float) $value));
    }

    /**
     * Free text from a model is displayed to a user, so it is stripped of tags
     * and control characters. Not because it is likely to be hostile, but
     * because "unlikely" is not a security model.
     */
    private function cleanText($value, int $max): string
    {
        if (!is_string($value)) {
            return '';
        }

        $value = strip_tags($value);
        $value = preg_replace('/[\x00-\x1F\x7F]/u', '', $value);

        return trim(mb_substr($value, 0, $max));
    }

    private function cleanList($list, int $maxItems, int $maxLength): array
    {
        if (!is_array($list)) {
            return [];
        }

        $clean = [];

        foreach (array_slice($list, 0, $maxItems) as $item) {
            $text = $this->cleanText($item, $maxLength);

            if ($text !== '') {
                $clean[] = $text;
            }
        }

        return $clean;
    }

    /**
     * The fallback is never an error message to the user. It is the preset
     * picker, with a friendly line. Onboarding must not fail because a third
     * party had a bad minute.
     */
    private function fallback(string $reason): array
    {
        return [
            'ok'              => false,
            'modules'         => [],
            'terminology'     => [],
            'dashboard'       => [],
            'added'           => [],
            'questions'       => [],
            'suggestions'     => [],
            'coming_soon'     => [],
            'reasoning'       => '',
            'unsupported'     => [],
            'confidence'      => 0.0,
            'preset'          => null,
            'fallback_reason' => $reason,   // for YOUR logs, never for the screen
        ];
    }
}
