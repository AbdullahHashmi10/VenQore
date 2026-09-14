<?php

namespace App\Services\AiBuilder;

use App\Support\BusinessTypes;

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  BusinessProfile — Canonical Business Identity and Discovery State         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Implements Section 6 & 10 of AI-BUILDER-AUDIT-AND-FIX-PLAN:
 * "One profile, multiple adapters. Use a small versioned profile rather than
 * duplicating an 85-business × capability matrix. Separate template confidence
 * from business understanding."
 */
class BusinessProfile
{
    public const VERSION = 'v1';

    public static function defaultPresetForSector(string $sector): ?string
    {
        return match ($sector) {
            'services' => 'professional_services',
            'retail' => 'retail_shop',
            'food' => 'food_counter',
            'wholesale' => 'wholesale',
            'manufacturing' => 'light_manufacturing',
            default => null,
        };
    }

    public function __construct(
        public ?string $businessType = null,
        public array $candidates = [],
        public ?string $preset = null,
        public ?string $sector = null,
        public bool $activityConfident = false,
        public bool $templateConfident = false,
        public ?string $sells = null,            // 'services' | 'goods' | 'both' | null
        public array $offerings = [],           // ['services', 'physical_goods', 'digital_goods']
        public ?string $billingCadence = null,   // 'monthly' | 'milestone' | 'hourly' | 'fixed_retainer' | 'variable' | 'on_spot'
        public ?bool $automatedRecurring = null,
        public ?bool $solo = null,
        public ?int $branches = null,
        public ?bool $multiBranch = null,
        public ?bool $hasStock = null,
        public ?bool $perishables = null,
        public ?bool $devices = null,
        public ?bool $dineIn = null,
        public ?bool $makesProducts = null,
        public array $goals = [],
        public array $unsupported = [],
        public array $facts = [],
        public array $diagnostics = [],
    ) {}

    /**
     * Create a profile from initial user text and matcher / understanding signals.
     */
    public static function fromInitialInput(
        string $prompt,
        array $fastFacts = [],
        ?array $understanding = null,
        ?string $presetOverride = null
    ): self {
        $profile = new self();
        $profile->facts = $fastFacts;

        // 1. Deterministic BusinessTypes matching (Section 10: correct return contract)
        $match = BusinessTypes::match($prompt);
        if ($match['key']) {
            $profile->businessType = $match['key'];
            $profile->candidates = $match['candidates'] ?? [$match['key']];
            $profile->templateConfident = (bool) ($match['template_confident'] ?? $match['confident']);
            $profile->activityConfident = (bool) ($match['activity_confident'] ?? false);

            $typeData = BusinessTypes::get($match['key']);
            $profile->sector = $typeData['sector'] ?? null;
            $profile->preset = BusinessTypes::presetFor($match['key']) ?: $presetOverride;

            $profile->recordDiagnostic('match', [
                'key'                => $match['key'],
                'score'              => $match['score'] ?? 0,
                'activity_confident' => $profile->activityConfident,
                'template_confident' => $profile->templateConfident,
                'candidates'         => $profile->candidates,
                'preset'             => $profile->preset,
                'sector'             => $profile->sector,
            ]);

            // Carry activity identity into facts
            $profile->facts["type:{$match['key']}"] = [
                'value'      => true,
                'confidence' => $profile->activityConfident ? 0.90 : 0.65,
                'source'     => 'catalogue_match',
                'evidence'   => $prompt,
            ];

            if ($profile->sector) {
                // Section 10: "Do not assign a blanket 0.95 factual confidence to every sector-derived inference"
                $profile->facts["sector:{$profile->sector}"] = [
                    'value'      => true,
                    'confidence' => 0.75,
                    'source'     => 'sector_default',
                    'evidence'   => "sector from {$match['key']}",
                ];
            }

            $profile->reconcileKeywordTrades($prompt);
        } else {
            $profile->preset = $presetOverride;
            $profile->recordDiagnostic('match', ['key' => null, 'score' => 0]);

            // A broad sector can be known even when the exact catalogue type is
            // not. Keep "retail store" generic: calling it a grocery would make
            // expiry/batch behavior look relevant without any such evidence.
            foreach (['retail', 'services', 'food', 'wholesale', 'manufacturing'] as $sector) {
                if (!empty($fastFacts["trade:{$sector}"]['value'])) {
                    $profile->sector = $sector;
                    $profile->templateConfident = true;
                    $profile->facts["sector:{$sector}"] = [
                        'value' => true, 'confidence' => 0.9,
                        'source' => 'user_keyword', 'evidence' => "explicit {$sector} description",
                    ];
                    break;
                }
            }
        }

        // 2. Infer offerings and operational boundaries from sector / catalogue defaults
        if ($profile->sector === 'services') {
            $profile->sells = 'services';
            $profile->offerings = ['services'];
            $isRepair = in_array($profile->businessType, ['phone_repair', 'computer_repair', 'auto_repair', 'appliance_repair', 'bike_service'], true)
                || !empty($fastFacts['trade:repairs']['value']);
            // Services do not imply "no stock". Repair and field-service trades
            // commonly consume parts; other services remain unknown unless the
            // visitor or a reliable understanding explicitly settles it.
            $profile->hasStock = $isRepair ? true : null;
        } elseif ($profile->sector === 'retail' || $profile->sector === 'wholesale' || !empty($fastFacts['trade:retail']['value'])) {
            $profile->sells = 'goods';
            $profile->offerings = ['physical_goods'];
            $profile->hasStock = true;
            if (!$profile->preset) {
                $profile->preset = 'retail_shop';
            }
            if (!$profile->sector) {
                $profile->sector = 'retail';
            }
        } elseif ($profile->sector === 'food') {
            $profile->sells = 'goods';
            $profile->offerings = ['physical_goods'];
            $profile->dineIn = str_contains($profile->preset ?? '', 'restaurant') || str_contains($profile->preset ?? '', 'cafe');
            $profile->perishables = true;
        } elseif ($profile->sector === 'manufacturing') {
            $profile->sells = 'goods';
            $profile->offerings = ['physical_goods'];
            $profile->makesProducts = true;
            $profile->hasStock = true;
        }

        // Check if devices are involved (phone repair, electronics)
        if (in_array($profile->businessType, ['phone_repair', 'computer_repair', 'electronics', 'mobile_electronics', 'appliance_repair'], true)) {
            $profile->devices = true;
        }

        // 3. Fast extraction facts override priors
        if (!empty($fastFacts['solo']['value'])) {
            $profile->solo = true;
        }
        if (!empty($fastFacts['branches']['value'])) {
            $profile->branches = (int) $fastFacts['branches']['value'];
        }
        if (!empty($fastFacts['multi_branch']['value'])) {
            $profile->multiBranch = (bool) $fastFacts['multi_branch']['value'];
        }
        if (isset($fastFacts['has_stock']['value'])) {
            $profile->hasStock = (bool) $fastFacts['has_stock']['value'];
        }

        // Detect billing cadence clues in prompt
        $lowerPrompt = mb_strtolower($prompt);
        if (preg_match('/\b(month|monthly|retainer|subscription|ماهانہ)\b/u', $lowerPrompt)) {
            $profile->billingCadence = 'monthly';
            $profile->facts['billing_cadence'] = [
                'value'      => 'monthly',
                'confidence' => 0.90,
                'source'     => 'user_explicit',
                'evidence'   => 'monthly billing mention',
            ];
        } elseif (preg_match('/\b(hourly|per hour|hours|گھنٹہ)\b/u', $lowerPrompt)) {
            $profile->billingCadence = 'hourly';
            $profile->facts['billing_cadence'] = [
                'value'      => 'hourly',
                'confidence' => 0.90,
                'source'     => 'user_explicit',
                'evidence'   => 'hourly billing mention',
            ];
        }

        // 4. Model BusinessUnderstanding overlay (if present)
        if ($understanding) {
            if (!empty($understanding['sells'])) {
                $profile->sells = $understanding['sells'];
            }
            if (!empty($understanding['scale'])) {
                if ($understanding['scale'] === 'solo') {
                    $profile->solo = true;
                } elseif ($understanding['scale'] === 'multi_site') {
                    $profile->multiBranch = true;
                }
            }
            if (!empty($understanding['goals'])) {
                $profile->goals = $understanding['goals'];
            }
            if (!empty($understanding['unsupported'])) {
                $profile->unsupported = $understanding['unsupported'];
            }
        }

        // Reflect resolved sells to structured facts
        if ($profile->sells) {
            $profile->facts['sells'] = [
                'value'      => $profile->sells,
                'confidence' => 0.90,
                'source'     => 'profile_resolution',
                'evidence'   => 'offerings resolution',
            ];
        }

        return $profile;
    }

    /**
     * A confident catalogue identity outranks broad keyword matches. Words such
     * as "workshop", "food" and "beauty" occur in valid businesses outside
     * the old trade matrix and must not veto their canonical capabilities.
     * Explicit mixed-business language keeps the additional trade active.
     */
    private function reconcileKeywordTrades(string $prompt): void
    {
        if (!$this->activityConfident || !$this->sector) {
            return;
        }

        $tradeSectors = [
            'pharmacy' => ['retail'],
            'repairs' => ['services'],
            'clothing' => ['retail'],
            'restaurant' => ['food'],
            'bakery' => ['food', 'manufacturing'],
            'grocery' => ['retail'],
            'retail' => ['retail'],
            'wholesale' => ['wholesale'],
            'salon' => ['services'],
            'electronics' => ['retail'],
            'professional_services' => ['services'],
            'freelance_creative' => ['services'],
        ];
        $explicitlyMixed = preg_match(
            '/\b(?:also|as well|alongside|in addition|plus we|and we (?:also )?(?:sell|make|repair|fix|serve|offer|provide))\b/iu',
            $prompt
        ) === 1;

        foreach ($tradeSectors as $trade => $allowedSectors) {
            $key = "trade:{$trade}";
            if (empty($this->facts[$key]['value']) || in_array($this->sector, $allowedSectors, true) || $explicitlyMixed) {
                continue;
            }
            $this->facts[$key] = [
                'value' => false,
                'confidence' => 1.0,
                'source' => 'catalogue_reconciliation',
                'evidence' => "conflicts with confident {$this->businessType} identity",
            ];
            $this->recordDiagnostic('keyword_trade_suppressed', [
                'trade' => $trade,
                'business_type' => $this->businessType,
                'sector' => $this->sector,
            ]);
        }
    }

    /**
     * Update profile from turn answers and new facts.
     */
    public function updateFromTurn(
        string $answer,
        array $newFacts = [],
        array $confirmedCaps = [],
        array $rejectedCaps = []
    ): void {
        foreach ($newFacts as $k => $f) {
            $this->facts[$k] = $f;
        }

        // A later free-text answer can provide the missing activity or correct
        // an earlier weak match. Only a confident catalogue match may replace
        // identity; vague mentions remain candidates for clarification.
        $match = BusinessTypes::match($answer);
        if (($match['key'] ?? null) && ($match['activity_confident'] ?? false)) {
            $type = BusinessTypes::get($match['key']);
            $this->businessType = $match['key'];
            $this->candidates = $match['candidates'] ?? [$match['key']];
            $this->activityConfident = true;
            $this->templateConfident = true;
            $this->sector = $type['sector'] ?? null;
            $this->preset = BusinessTypes::presetFor($match['key']);
            $this->sells = $this->sector === 'services' ? 'services' : 'goods';
            $this->hasStock = in_array($this->preset, ['repair_workshop', 'field_service'], true)
                || in_array($this->sector, ['retail', 'wholesale', 'manufacturing'], true);
            $this->facts["type:{$match['key']}"] = ['value' => true, 'confidence' => 0.9, 'source' => 'turn_match', 'evidence' => $answer];
            $this->facts['sells'] = ['value' => $this->sells, 'confidence' => 0.9, 'source' => 'turn_match', 'evidence' => $answer];
            if ($this->sector) {
                $this->facts["sector:{$this->sector}"] = ['value' => true, 'confidence' => 0.9, 'source' => 'turn_match', 'evidence' => $answer];
            }
        }

        // Update selling model if user provided information
        if (isset($newFacts['sells']['value']) && is_string($newFacts['sells']['value'])) {
            $this->sells = $newFacts['sells']['value'];
        }

        if (isset($newFacts['solo']['value'])) {
            $this->solo = (bool) $newFacts['solo']['value'];
        }

        if (isset($newFacts['billing_cadence']['value']) && is_string($newFacts['billing_cadence']['value'])) {
            $this->billingCadence = $newFacts['billing_cadence']['value'];
        }

        // Update from capability confirmations
        if (in_array('automated_recurring_invoicing', $confirmedCaps, true)) {
            $this->automatedRecurring = true;
        }
        if (in_array('counter_checkout', $confirmedCaps, true)) {
            $this->billingCadence = 'on_spot';
        }
    }

    /**
     * Check if the activity is ambiguous in a way that materially changes the setup.
     * Section 10: "Clarify only when the remaining ambiguity changes an eligible
     * question or configuration; do not ask merely to obtain a more precise label."
     */
    public function isAmbiguousActivity(): bool
    {
        if ($this->businessType === null) {
            // A broad, explicit sector such as "retail store" is sufficient
            // for safe universal questions; its subtype remains unknown.
            return $this->sector === null;
        }

        return !$this->activityConfident && count($this->candidates) > 1;
    }

    /**
     * Clarification question for ambiguous freelancer.
     * Section 5:
     * "Input: 'I freelance and charge monthly.'
     *  > What work do you do for your clients—for example design, software development, consulting, repairs, or something else?"
     */
    public function getClarificationQuestion(): array
    {
        $options = [];
        foreach (array_slice($this->candidates, 0, 3) as $candidate) {
            $type = BusinessTypes::get($candidate);
            if (!$type) continue;
            $options[] = [
                'key' => 'act:' . $candidate,
                'label' => $type['label'],
                'desc' => $type['note'] ?? 'Use the setup for this kind of business.',
                'implies' => 'type:' . $candidate,
            ];
        }
        if ($options === []) {
            foreach (BusinessTypes::sectors() as $sector => $labels) {
                $options[] = [
                    'key' => 'sector:' . $sector,
                    'label' => $labels['short'] ?? $labels['name'] ?? ucfirst($sector),
                    'desc' => $labels['name'] ?? 'Choose this broad kind of business.',
                    'implies' => 'sector:' . $sector,
                ];
            }
        } else {
            $options[] = ['key' => 'act:other', 'label' => 'Something else', 'desc' => 'Tell us what you sell or what work you do.', 'implies' => 'custom'];
        }

        return [
            'key'               => '__clarification:activity__',
            'is_multi'          => false,
            'name'              => 'Type of Work Clarification',
            'impact'            => 150, // Priority over all capabilities
            'domain'            => 'clarification',
            'triggers'          => [],
            'requires_caps'     => [],
            'implies_modules'   => [],
            'consequences'      => ['We tailor your workspace to your exact profession.'],
            'question_template' => 'Which description fits your business best? You can also explain what you sell or what work you do.',
            'options'           => $options,
        ];
    }

    public function recordDiagnostic(string $type, array $data): void
    {
        $this->diagnostics[] = [
            'timestamp' => microtime(true),
            'type'      => $type,
            'data'      => $data,
        ];
    }

    public function toArray(): array
    {
        return [
            'version'             => self::VERSION,
            'business_type'       => $this->businessType,
            'candidates'          => $this->candidates,
            'preset'              => $this->preset,
            'sector'              => $this->sector,
            'activity_confident'  => $this->activityConfident,
            'template_confident'  => $this->templateConfident,
            'sells'               => $this->sells,
            'offerings'           => $this->offerings,
            'billing_cadence'     => $this->billingCadence,
            'automated_recurring' => $this->automatedRecurring,
            'solo'                => $this->solo,
            'branches'            => $this->branches,
            'multi_branch'        => $this->multiBranch,
            'has_stock'           => $this->hasStock,
            'perishables'         => $this->perishables,
            'devices'             => $this->devices,
            'dine_in'             => $this->dineIn,
            'makes_products'      => $this->makesProducts,
            'goals'               => $this->goals,
            'unsupported'         => $this->unsupported,
            'facts'               => $this->facts,
            'diagnostics'         => $this->diagnostics,
        ];
    }

    public static function fromArray(array $data): self
    {
        $profile = new self(
            businessType: $data['business_type'] ?? null,
            candidates: $data['candidates'] ?? [],
            preset: $data['preset'] ?? null,
            sector: $data['sector'] ?? null,
            activityConfident: (bool) ($data['activity_confident'] ?? false),
            templateConfident: (bool) ($data['template_confident'] ?? false),
            sells: $data['sells'] ?? null,
            offerings: $data['offerings'] ?? [],
            billingCadence: $data['billing_cadence'] ?? null,
            automatedRecurring: isset($data['automated_recurring']) ? (bool) $data['automated_recurring'] : null,
            solo: isset($data['solo']) ? (bool) $data['solo'] : null,
            branches: isset($data['branches']) ? (int) $data['branches'] : null,
            multiBranch: isset($data['multi_branch']) ? (bool) $data['multi_branch'] : null,
            hasStock: isset($data['has_stock']) ? (bool) $data['has_stock'] : null,
            perishables: isset($data['perishables']) ? (bool) $data['perishables'] : null,
            devices: isset($data['devices']) ? (bool) $data['devices'] : null,
            dineIn: isset($data['dine_in']) ? (bool) $data['dine_in'] : null,
            makesProducts: isset($data['makes_products']) ? (bool) $data['makes_products'] : null,
            goals: $data['goals'] ?? [],
            unsupported: $data['unsupported'] ?? [],
            facts: $data['facts'] ?? [],
            diagnostics: $data['diagnostics'] ?? [],
        );

        return $profile;
    }
}
