<?php

namespace App\Services\AiBuilder;

use App\Models\Tenant;
use App\Services\ModuleService;

/*
|==============================================================================
| STEP 12 — ModificationParser
|==============================================================================
|
| "add manufacturing" · "remove suppliers" · "call inventory Stock"
|
| EXACTLY FOUR INTENTS. They cover roughly 90% of what people actually ask for,
| and each maps to one trivial, already-tested write. Anything else gets an
| honest "not yet" and a line in the demand log.
|
| WHY THIS IS DETERMINISTIC AND NOT A MODEL CALL
| ----------------------------------------------
| "Add inventory" does not need a language model. It needs the alias table you
| already wrote in config/modules.php — where 'godown', 'maal', 'stock' and
| 'inventry' all point at the same module. Matching against those aliases is
| free, instant, works offline, and is testable with a fixture list.
|
| A model call here would cost money per sentence, add latency to a click, and
| introduce a failure mode ("the AI is down, you cannot rename your menu") for
| an operation that is fundamentally a lookup.
|
| Fall back to the model ONLY when the deterministic pass finds nothing — and
| even then, its answer comes back through this same intent list.
|==============================================================================
*/
class ModificationParser
{
    /**
     * @return array{
     *     intent: string,          ENABLE|DISABLE|RENAME|ADD_CARD|UNKNOWN
     *     module: ?string,
     *     term: ?string,
     *     value: ?string,
     *     card: ?string,
     *     confidence: float,
     *     message: string
     * }
     */
    public function parse(string $input, ?Tenant $tenant = null): array
    {
        $text = strtolower(trim($input));

        if ($text === '') {
            return $this->unknown($input);
        }

        // RENAME first: "call inventory Stock" contains the word "inventory",
        // so an ENABLE matcher would claim it. Order matters, and this is the
        // only place it does.
        if ($rename = $this->matchRename($input, $text)) {
            return $rename;
        }

        if ($card = $this->matchCard($text)) {
            return $card;
        }

        if ($toggle = $this->matchToggle($text, $tenant)) {
            return $toggle;
        }

        return $this->unknown($input);
    }

    /**
     * "call inventory Stock" · "rename customers to patients"
     * The NEW word keeps the user's capitalisation — they typed "Patients",
     * they should see "Patients", not "patients".
     */
    private function matchRename(string $original, string $text): ?array
    {
        $patterns = [
            '/\b(?:call|rename|change)\s+(?:the\s+)?(.+?)\s+(?:to|as)\s+(.+)$/i',
            '/\b(?:call|rename)\s+(?:the\s+)?(.+?)\s+(.+)$/i',
        ];

        foreach ($patterns as $pattern) {
            if (!preg_match($pattern, $original, $m)) {
                continue;
            }

            $subject = strtolower(trim($m[1]));
            $newWord = trim($m[2], " \t\n\r\0\x0B\"'.");

            if ($newWord === '' || mb_strlen($newWord) > 80) {
                continue;
            }

            $term = $this->matchTerm($subject);

            if (!$term) {
                continue;
            }

            return [
                'intent'     => 'RENAME',
                'module'     => null,
                'term'       => $term,
                'value'      => $newWord,
                'card'       => null,
                'confidence' => 0.9,
                'message'    => "I'll call it \"{$newWord}\" from now on.",
            ];
        }

        return null;
    }

    /** "show me daily sales on the dashboard" */
    private function matchCard(string $text): ?array
    {
        if (!preg_match('/\b(show|add|put|display)\b.*\b(dashboard|home ?screen|overview)\b/', $text)) {
            return null;
        }

        try {
            $cards = array_keys(\App\Services\Dashboard\DashboardRegistry::all());
        } catch (\Throwable) {
            return null;
        }

        // Card keys are engineering words. Customers use their own, so each
        // key carries the phrases a person would actually type. Without this,
        // "show me daily sales" matches nothing, because no card is called
        // 'daily_sales'.
        $synonyms = [
            'revenue_today'    => ['daily sales', 'today', "today's sales", 'sales today', 'daily revenue', 'aaj'],
            'revenue_trend'    => ['sales trend', 'trend', 'graph', 'chart', 'over time'],
            'sales_summary'    => ['sales summary', 'summary', 'sales'],
            'net_profit'       => ['profit', 'net profit', 'earnings', 'munafa'],
            'low_stock'        => ['low stock', 'running out', 'reorder', 'shortage'],
            'inventory_value'  => ['stock value', 'inventory value', 'stock worth'],
            'receivables'      => ['receivables', 'owed to me', 'udhaar', 'khata balance', 'outstanding'],
            'payables'         => ['payables', 'i owe', 'supplier balance'],
            'cash_position'    => ['cash', 'cash in hand', 'galla', 'cash position'],
            'top_products'     => ['top products', 'best sellers', 'popular items'],
            'top_customers'    => ['top customers', 'best customers'],
            'expenses'         => ['expenses', 'kharcha', 'spending'],
            'active_staff'     => ['staff', 'who is working', 'attendance'],
            'open_orders'      => ['open orders', 'pending orders'],
            'production_output' => ['production', 'output', 'made today'],
        ];

        foreach ($cards as $card) {
            $words = str_replace('_', ' ', $card);

            foreach ($synonyms[$card] ?? [] as $phrase) {
                if (str_contains($text, $phrase)) {
                    return [
                        'intent'     => 'ADD_CARD',
                        'module'     => null,
                        'term'       => null,
                        'value'      => null,
                        'card'       => $card,
                        'confidence' => 0.85,
                        'message'    => 'Added to your dashboard.',
                    ];
                }
            }

            if (str_contains($text, $words) || str_contains($text, $card)) {
                return [
                    'intent'     => 'ADD_CARD',
                    'module'     => null,
                    'term'       => null,
                    'value'      => null,
                    'card'       => $card,
                    'confidence' => 0.85,
                    'message'    => 'Added to your dashboard.',
                ];
            }
        }

        return null;
    }

    /**
     * "add manufacturing" · "remove suppliers" · "I don't need the khata"
     *
     * The alias table does the work. A shopkeeper typing "godown" gets
     * multi_location without anybody writing a rule for the word "godown".
     */
    private function matchToggle(string $text, ?Tenant $tenant): ?array
    {
        $enable  = preg_match('/\b(add|enable|turn on|switch on|i (?:also )?(?:want|need)|start using|activate)\b/', $text);
        $disable = preg_match('/\b(remove|disable|turn off|switch off|hide|don\'?t (?:want|need)|delete|get rid of)\b/', $text);

        if (!$enable && !$disable) {
            return null;
        }

        $module = $this->matchModule($text);

        if (!$module) {
            return null;
        }

        $label = config("modules.{$module}.label", $module);

        if ($disable) {
            // Never a bare yes. Load-bearing modules produce a choice, and
            // modules holding data produce a "nothing will be deleted" note.
            $dependents = ModuleService::dependents($module);
            $enabled = $tenant ? ModuleService::allEnabled($tenant) : [];
            $active = array_values(array_intersect($dependents, $enabled));

            return [
                'intent'     => 'DISABLE',
                'module'     => $module,
                'term'       => null,
                'value'      => null,
                'card'       => null,
                'confidence' => 0.85,
                'message'    => $active === []
                    ? "I'll hide {$label}. Nothing is deleted — turning it back on restores everything."
                    : "{$label} is needed by ".implode(', ', array_map(
                        fn ($d) => config("modules.{$d}.label", $d),
                        $active
                    )).'. Shall I remove those too?',
            ];
        }

        return [
            'intent'     => 'ENABLE',
            'module'     => $module,
            'term'       => null,
            'value'      => null,
            'card'       => null,
            'confidence' => 0.85,
            'message'    => "I'll add {$label}.",
        ];
    }

    /**
     * Longest alias wins.
     *
     * Without that rule, "purchase orders" matches the alias "purchase" on
     * module #25 before it reaches "purchase order" on #26 — and the customer
     * who asked for POs gets the Purchases screen instead. Length ordering is
     * the whole fix.
     *
     * Only LIVE modules are matchable: promising an unfinished module is the
     * exact failure the status field exists to prevent.
     */
    public function matchModule(string $text): ?string
    {
        $candidates = [];

        foreach (config('modules', []) as $key => $module) {
            if (($module['status'] ?? 'live') !== 'live') {
                continue;
            }

            foreach (array_merge([$module['label'], $key], $module['aliases']) as $alias) {
                $alias = strtolower(str_replace('_', ' ', $alias));

                if ($alias !== '' && str_contains($text, $alias)) {
                    $candidates[$key] = max($candidates[$key] ?? 0, mb_strlen($alias));
                }
            }
        }

        if ($candidates === []) {
            return null;
        }

        // Longest alias wins. On a TIE, the module whose own LABEL contains the
        // phrase wins — "cash register" should reach #35 Cash Register, not #5
        // POS, even if both once listed it. Ties should be rare; when one
        // happens it is usually a sign two modules share an alias they should
        // not, so it is worth fixing in the registry rather than relying on
        // this rule.
        arsort($candidates);
        $topScore = reset($candidates);
        $tied = array_keys($candidates, $topScore, true);

        if (count($tied) > 1) {
            foreach ($tied as $key) {
                if (str_contains($text, strtolower(config("modules.{$key}.label", '')))) {
                    return $key;
                }
            }
        }

        return array_key_first($candidates);
    }

    /** Which Terms:: key is the user talking about? */
    private function matchTerm(string $subject): ?string
    {
        try {
            $terms = array_keys(
                (new \ReflectionClass(\App\Support\Terms::class))->getStaticPropertyValue('fallbacks')
            );
        } catch (\Throwable) {
            return null;
        }

        foreach ($terms as $term) {
            if (str_contains($subject, $term) || str_contains($subject, $term.'s')) {
                return $term;
            }
        }

        // Fall back to the module's own term keys — "call inventory Stock"
        // names a module, and Inventory provides the 'stock' term.
        $module = $this->matchModule($subject);

        if ($module) {
            return config("modules.{$module}.terms.0");
        }

        return null;
    }

    /**
     * The honest "no". Never a dead end, and always logged — this is the same
     * demand log the AI's `unsupported` field feeds, and it is your roadmap
     * ranked by real demand rather than opinion.
     */
    private function unknown(string $input): array
    {
        return [
            'intent'     => 'UNKNOWN',
            'module'     => null,
            'term'       => null,
            'value'      => null,
            'card'       => null,
            'confidence' => 0.0,
            'message'    => "I can't do that yet — I've noted it for the team.",
            'log'        => $input,
        ];
    }
}
