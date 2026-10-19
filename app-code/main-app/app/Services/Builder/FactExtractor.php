<?php

namespace App\Services\Builder;

/**
 * Turns the owner's own words into candidate facts.
 *
 * This is the deterministic keyword path — it is the AI-off fallback AND the
 * validator an AI extraction must pass through (FactStore rejects any key or
 * value outside the schema). The AI path (AiGateway, feature `config_ai`, AiFactReader)
 * plugs in via `$ai`; it may only return fact keys from config/builder/facts.php.
 *
 * Rules of the road (plan §1):
 *  - silence is never "no"; only an explicit negation writes a negative
 *  - facts written here are source `owner_text`, shown on the confirmation card
 *    and counted as confirmed only after the owner taps Correct
 */
class FactExtractor
{
    /** @var ?callable(string,string):array  AiFactReader, or any callable returning its shape (or a plain fact list) */
    private $ai;

    public function __construct(private BuilderPolicy $policy, ?callable $ai = null)
    {
        $this->ai = $ai;
    }

    /**
     * Trades that are the owner's CUSTOMERS, not what the owner does ("parts for repair shops").
     * Plural only: "my repair shop" is the owner's own business, "repair shops" are who they sell to.
     */
    private const CUSTOMER_TRADES = '(?:shops|garages|workshops|centres|centers|businesses|mechanics|companies|contractors|customers|clients)';

    /** Words that say the owner sells goods out of stock they bought (distributor, SKUs, dealer…). */
    private const STOCKIST = 'distribut(?:or|ors|ion|e|es|ing)|wholesal(?:e|er|ers|ing)|dealers?(?:hip)?|traders?|stockists?|resell(?:er|ers|ing)?|skus?';

    /** label = how the confirmation card reads it back. First matching rule per fact wins. */
    private const RULES = [
        // What they do. Generic "shop"/"store" are left out on purpose: a repair shop is a shop too.
        ['/\b(?:' . self::STOCKIST . '|retail(?:er|ers)?|spare\s+parts|auto\s+parts|car\s+parts|products?|merchandise|accessories|supermarket|grocery|kiryana|karyana|dukaan|dukan|pharmacy|boutique|electronics|cosmetics|chemicals|medicines|building\s+materials|(?:mobile|phone)\s+(?:phone\s+)?shop|hardware|tyres?|shoes|books?\s+shop|gift\s+shop)\b/i', 'activity.goods', true, 'you sell products', false],
        ['/\b(?:manufactur(?:e|er|ers|ing)|factory|bake(?:ry|s)?|bak(?:e|ing)|grind|produce|production|printing|print\s+press|cook(?:s|ing)?|kitchen|restaurant|cafe|café)\b/i', 'activity.making', true, 'you make what you sell', false],
        ['/\b(?:rent(?:s|ing)?\s+out|rentals?|on\s+hire|for\s+hire|hire\s+out)\b/i', 'activity.hire', true, 'you rent things out', false],
        ['/\b(?:plumb(?:er|ing)|electrician|designer|design\s+work|tuition|academy|school|freelance|jobs?\s+at|workshop|mechanic|service\s+centre|repair\s+cent(?:re|er))\b/i', 'activity.services', true, 'you do work for customers', false],
        ['/\b(?:we|i)\s+(?:suppl(?:y|ies)|provide)\b|\bsupplying\b|\b(?:materials|parts|medicines?|chemicals)\s+suppliers?\b|\bsuppliers?\s+of\b/i', 'activity.goods', true, 'you sell products', true],
        ['/\b(?:salon|barber|spa|clinic|consult(?:ant|ancy|ing)|cleaning(?!\s+(?:chemicals|products|supplies|equipment))|tutor(?:ing)?|agency|studio)\b/i', 'activity.services', true, 'you do work for customers', false],
        ['/\bsell(?:s|ing)?\b(?!\s+(?:our\s+|my\s+)?(?:services?|time)\b)/i', 'activity.goods', true, 'you sell products', true],
        ['/\b(?:' . self::STOCKIST . '|inventory)\b/i', 'items.resale_stock', true, 'you keep stock you buy to sell again', false],
        ['/\b(?:buy|buys|purchase|restock|order)\s+(?:my\s+|our\s+)?(?:stock|goods|from\s+(?:my\s+|our\s+)?suppliers?)\b/i', 'items.resale_stock', true, 'you buy stock from suppliers', false],

        // Places
        ['/\b(?:one|single|1)\s+(?:shop|store|branch|outlet|warehouse|location)\b/i', 'place.stock_counts', 'one', 'one place for stock', false],
        ['/\b(?:two|three|four|five|several|multiple|many|do|teen|[2-9]|\d{2,})\s+(?:warehouses?|godowns?|branch(?:es)?|shops|stores|outlets|locations|depots?)\b|\b(?:outlets?|branch(?:es)?|shops?)\s+and\s+a\s+(?:central\s+)?(?:warehouse|godown)\b/i', 'place.stock_counts', 'separate', 'stock kept in more than one place', false],

        // How a sale happens
        ['/\b(?:counter\s+sales?|over\s+the\s+counter|(?:from|at)\s+(?:our|my|the)\s+counter|walk[\s-]?ins?|cash\s+sales?|takeaway|take[\s-]away)\b/i', 'sale.counter', true, 'walk-in customers buy at the counter', true],
        ['/\b(?:deliver(?:y|ed)?\s+later|order\s+(?:first|ahead|in\s+advance)|customers?\s+order)\b/i', 'sale.order_later', true, 'customers order first and you deliver later', true],
        ['/\b(?:send|sends|give)\s+(?:them\s+|the\s+customer\s+|a\s+)?(?:a\s+)?bill\b|\bbill\s+(?:after|monthly|them)\b/i', 'work.bill', true, 'you send a bill after the work', true],
        ['/\btrack\s+each\s+job\b|\bjob\s+cards?\b|\buntil\s+the\s+customer\s+collects\b/i', 'work.job_tracked', true, 'you follow each job to the end', false],
        ['/\b(?:invoices?|invoicing|credit\s+accounts?|trade\s+accounts?|account\s+customers|on\s+account)\b/i', 'sale.bill', true, 'account customers get an invoice', true],

        // Money
        ['/\b(?:give|gives|giving|offer|allow)\s+credit\b/i', 'money.customer_later', true, 'some customers pay later', true],
        ['/\bpay\s+(?:our\s+|my\s+)?suppliers?\s+(?:in|after|later|within)\b|\bsuppliers?\s+(?:give|gives)\s+(?:us\s+)?credit\b/i', 'money.supplier_later', true, 'you pay some suppliers later', true],
        ['/\b(?:advance|deposit|booking\s+fee)\b/i', 'money.advances', true, 'customers pay part in advance', true],
        ['/\b(?:customers?|retailers?|clients?|they|shops)\s+pay\s+(?:us\s+)?(?:in|at|after|within)\s+(?:\d+|month|the\s+month)|\bmonth[\s-]?end\b|\bcredit\b(?!\s*cards?)|\budhaar\b/i', 'money.customer_later', true, 'some customers pay later', true],
        ['/\b(?:pay(?:s|ing)?\s+later|on\s+credit|credit\s+(?:customers?|accounts?|terms?|limits?)|trade\s+accounts?|account\s+customers|on\s+account|udhaar|khata|pay(?:s)?\s+in\s+(?:parts|instalments?|installments?))\b/i', 'money.customer_later', true, 'some customers pay later', true],
        // "Tiered accounts" is ambiguous (prices? credit terms? both?): record it so C2 asks, never guess which.
        ['/\btier(?:s|ed)?\b|\b(?:account|customer|credit)\s+(?:levels?|grades?|classes?)\b/i', 'money.tiered_accounts', true, 'your account customers are on tiers', false],
        ['/\b(?:different|special|separate|trade|wholesale)\s+prices?\b|\bprice\s+(?:lists?|levels?|groups?)\b/i', 'repeat.group_prices', true, 'some customers get different prices', true],

        ['/\b(?:expiry|expiration|expire[sd]?|batch\s+numbers?)\b/i', 'id.batch_expiry', true, 'you track expiry dates', true],
        ['/\bsizes?\s+and\s+colou?rs?\b|\bvariants?\b/i', 'id.variants', true, 'you track sizes and colours', true],
        ['/\b(?:imei|serial\s+numbers?)\b/i', 'id.serial_owned', true, 'each item has its own serial number', true],
        ['/\b(?:barcodes?|scan(?:ner|s|ning)?)\b/i', 'id.scan_labels', true, 'you scan barcodes', true],
        ['/\b(?:by\s+the\s+(?:litre|liter|kg|kilo|metre|meter|foot|feet|yard)|per\s+(?:kg|litre|metre|foot))\b/i', 'id.measured', true, 'you sell by weight or length', true],
        ['/\bcost\s+(?:per|of\s+each)\b|\bcosting\b/i', 'make.costing', true, 'you want to know what each item costs to make', false],
        ['/\b(?:daraz|amazon|marketplace|etsy|ebay)\b/i', 'channel.marketplace', true, 'you also sell on a marketplace', true],
        ['/\bno\s+(?:tax|gst|vat)(?:\s+registration)?\b|\bnot\s+(?:tax\s+)?registered\b/i', 'tax.mode', 'none', 'you do not charge tax', false],
        ['/\bdine[\s-]?in\b|\btables?\s+(?:for|and)\s+(?:customers|diners)\b/i', 'sale.tables', true, 'customers sit at tables', false],
        ['/\b(?:appointments?|bookings?)\b/i', 'work.booking', true, 'customers book times', false],
        // "repair shops", "repair garages" are who they sell TO; only their own repair work is a service.
        ['/\b(?:repairs?|repairing|fix(?:es|ing)?)\b(?!\s+' . self::CUSTOMER_TRADES . '\b)/i', 'activity.services', true, 'you do repairs or service work', false],
        ['/\bprices?\s+(?:already\s+)?includes?\s+(?:tax|vat|gst)\b/i', 'tax.mode', 'included', 'prices include tax', false],
        ['/\b(?:add|plus|extra)\s+(?:sales\s+)?(?:tax|vat|gst)\b/i', 'tax.mode', 'added', 'tax is added to prices', false],
        ['/\b(?:just\s+me|only\s+me|by\s+myself|solo)\b/i', 'people.users', 'solo', 'just you will use it', false],
    ];

    private const NEGATION = '/\b(?:no|not|don\'t|dont|do\s+not|never|without|doesn\'t|isn\'t)\b[^.;,]{0,30}$/i';

    /** At most this many clarifying screens per run come from the model. */
    private const MAX_AI_PANELS = 2;

    /**
     * One reading of the owner's words: the AI (when wired and reachable), then the keyword rules
     * filling only what it left out. When the AI did read the text, the keyword rules stay out of
     * "what the business does" — that is a judgement (owner vs customer), not a word match.
     *
     * @return array{facts:array<int,array{fact:string,value:bool|string,evidence:string,label:string}>,heard:?string,ask:?array}
     */
    public function read(string $text, bool $useAi = true, string $context = ''): array
    {
        $out = [];
        $heard = null;
        $ask = null;
        if ($this->ai && $useAi) {
            $r = (array) ($this->ai)($text, $context);
            $rows = array_key_exists('facts', $r) ? (array) $r['facts'] : $r;   // plain list = facts only
            $heard = is_string($r['heard'] ?? null) ? $r['heard'] : null;
            $ask = is_array($r['ask'] ?? null) ? $r['ask'] : null;
            foreach ($rows as $c) {
                if (is_array($c) && isset($c['fact'], $c['value']) && $this->policy->validFact($c['fact'])) {
                    $evidence = (string) ($c['evidence'] ?? '');
                    $out[$c['fact']] = ['fact' => $c['fact'], 'value' => $c['value'], 'evidence' => $evidence, 'label' => $this->label($c['fact'], $evidence, $c['value'])];
                }
            }
        }
        $aiRead = $out !== [];

        foreach (self::RULES as [$re, $fact, $value, $label, $negatable]) {
            if (isset($out[$fact]) || ($aiRead && str_starts_with($fact, 'activity.')) || ! preg_match($re, $text, $m, PREG_OFFSET_CAPTURE)) {
                continue;
            }
            $before = substr($text, 0, (int) $m[0][1]);
            $negated = $negatable && preg_match(self::NEGATION, $before) === 1;
            $out[$fact] = [
                'fact' => $fact, 'value' => $negated ? false : $value,
                'evidence' => $m[0][0], 'label' => $negated ? 'not: ' . $label : $label,
            ];
        }

        return ['facts' => array_values($out), 'heard' => $heard, 'ask' => $ask];
    }

    /** @return array<int,array{fact:string,value:bool|string,evidence:string,label:string}> */
    public function extract(string $text, bool $useAi = true): array
    {
        return $this->read($text, $useAi)['facts'];
    }

    /** The plain read-back for a fact: the keyword rule's wording, else the owner's own quote. */
    public function label(string $fact, string $evidence, bool|string $value = true): string
    {
        foreach (self::RULES as [, $f, $v, $label]) {
            if ($f === $fact && ($v === $value || ($value === false && is_bool($v)))) {
                return $value === false ? 'not: ' . $label : $label;
            }
        }

        return $evidence !== '' ? $evidence : $fact;
    }

    /**
     * Write what the owner typed into the session. The opening description goes on the confirmation
     * card; a "let me explain" answer ($context = the question) counts as their answer straight away.
     * A clarifying question the model proposed becomes a screen only when it can still change something.
     */
    public function apply(BuilderSession $s, string $text, string $context = ''): array
    {
        $opening = $context === '';
        $read = $this->read($text, true, $context);
        $applied = [];
        $s->facts->nextTurn();
        foreach ($read['facts'] as $c) {
            try {
                $written = $s->facts->set($c['fact'], $c['value'], $opening ? 'owner_text' : 'answer', null, $c['evidence']);
            } catch (\InvalidArgumentException) {
                continue;   // an AI value of the wrong type never reaches the store
            }
            if ($written) {
                if ($opening) {
                    $s->facts->setPendingConfirm($c['fact'], true);
                }
                $applied[] = $c;
            }
        }
        if ($opening && $read['heard']) {
            $s->heard = $read['heard'];
        }
        if ($read['ask'] && count($s->aiPanels) < self::MAX_AI_PANELS) {
            $id = 'A' . (count($s->aiPanels) + 1);
            $s->aiPanels[$id] = [
                'band' => 1, 'kind' => 'single', 'clarifies' => 'ai', 'show_all' => true,
                'title' => $read['ask']['title'], 'ask_when' => [], 'options' => $read['ask']['options'],
            ];
        }

        return $applied;
    }
}
