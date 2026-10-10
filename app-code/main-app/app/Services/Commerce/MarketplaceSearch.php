<?php

namespace App\Services\Commerce;

/**
 * Turns what a shopper types ("restaurants near me", "fastest delivery", "free delivery pharmacy open now")
 * into filters, a sort order and a leftover text to match against shop and product names.
 * Pure: no database, no request. Includes common Roman-Urdu words.
 */
class MarketplaceSearch
{
    /** Kinds of business shoppers look for. `sectors` + `words` decide which shop types belong to a kind. */
    public const KINDS = [
        'restaurants' => ['label' => 'Restaurants', 'sectors' => ['food'], 'words' => ['restaurant', 'restaurants', 'food', 'eat', 'eatery', 'dinner', 'lunch', 'breakfast', 'cafe', 'café', 'cafes', 'pizza', 'burger', 'biryani', 'bbq', 'karahi', 'dhaba', 'bakery', 'sweets', 'mithai', 'tea', 'coffee', 'juice', 'fast food', 'khana', 'hotel']],
        'groceries' => ['label' => 'Groceries', 'sectors' => [], 'words' => ['grocery', 'groceries', 'kiryana', 'karyana', 'kirana', 'supermarket', 'mart', 'ration', 'vegetables', 'fruit', 'fruits', 'milk', 'provision']],
        'pharmacy' => ['label' => 'Pharmacy', 'sectors' => [], 'words' => ['pharmacy', 'pharmacies', 'chemist', 'medicine', 'medicines', 'medical', 'dawai', 'dawakhana']],
        'fashion' => ['label' => 'Fashion', 'sectors' => [], 'words' => ['clothes', 'clothing', 'boutique', 'garments', 'fashion', 'apparel', 'kapray', 'shoes', 'abaya']],
        'electronics' => ['label' => 'Electronics', 'sectors' => [], 'words' => ['electronics', 'mobile', 'mobiles', 'phone', 'phones', 'laptop', 'laptops', 'appliances', 'gadgets']],
    ];

    /** Phrases checked first (longest first), then single words. Each sets part of the intent. */
    private const PHRASES = [
        'free delivery' => ['delivery' => true, 'free_delivery' => true],
        'cheapest delivery' => ['delivery' => true, 'sort' => 'cheapest'],
        'low delivery charges' => ['delivery' => true, 'sort' => 'cheapest'],
        'fast delivery' => ['delivery' => true, 'sort' => 'fastest'],
        'fastest delivery' => ['delivery' => true, 'sort' => 'fastest'],
        'quick delivery' => ['delivery' => true, 'sort' => 'fastest'],
        'home delivery' => ['delivery' => true],
        'open now' => ['open' => true],
        'open right now' => ['open' => true],
        'near me' => ['sort' => 'nearest', 'near' => true],
        'close to me' => ['sort' => 'nearest', 'near' => true],
        'around me' => ['sort' => 'nearest', 'near' => true],
        'nearby' => ['sort' => 'nearest', 'near' => true],
        'top rated' => ['sort' => 'rating'],
        'highest rated' => ['sort' => 'rating'],
        'best rated' => ['sort' => 'rating'],
        'take away' => ['pickup' => true],
        'take-away' => ['pickup' => true],
        'percent off' => ['offers' => true],
        '% off' => ['offers' => true],
        'fastest' => ['delivery' => true, 'sort' => 'fastest'],
        'quickest' => ['delivery' => true, 'sort' => 'fastest'],
        'closest' => ['sort' => 'nearest', 'near' => true],
        'nearest' => ['sort' => 'nearest', 'near' => true],
        'cheapest' => ['sort' => 'cheapest'],
        'deals' => ['offers' => true], 'deal' => ['offers' => true],
        'discounts' => ['offers' => true], 'discount' => ['offers' => true],
        'offers' => ['offers' => true], 'offer' => ['offers' => true],
        'sale' => ['offers' => true], 'sasta' => ['sort' => 'cheapest'],
        'pickup' => ['pickup' => true], 'takeaway' => ['pickup' => true], 'collect' => ['pickup' => true],
        'delivery' => ['delivery' => true], 'deliver' => ['delivery' => true],
        'open' => ['open' => true],
        'best' => ['sort' => 'rating'], 'popular' => ['sort' => 'rating'],
        'near' => ['sort' => 'nearest', 'near' => true],
    ];

    private const FILLER = ['in', 'the', 'a', 'an', 'for', 'to', 'me', 'my', 'shops', 'shop', 'stores', 'store', 'places', 'place', 'find', 'show', 'get', 'order', 'from', 'with', 'and', 'any', 'best'];

    /**
     * @return array{open:bool,delivery:bool,pickup:bool,offers:bool,free_delivery:bool,near:bool,sort:?string,kind:?string,text:string}
     */
    public static function parse(string $q): array
    {
        $out = ['open' => false, 'delivery' => false, 'pickup' => false, 'offers' => false, 'free_delivery' => false, 'near' => false, 'sort' => null, 'kind' => null, 'kind_words' => [], 'text' => ''];
        $s = ' ' . preg_replace('/\s+/u', ' ', mb_strtolower(trim($q))) . ' ';

        // Longest phrases first so "free delivery" wins over "delivery".
        $phrases = self::PHRASES;
        uksort($phrases, fn ($a, $b) => strlen($b) <=> strlen($a));
        foreach ($phrases as $p => $effect) {
            $needle = ' ' . $p . ' ';
            if (str_contains($s, $needle)) {
                foreach ($effect as $k => $v) {
                    if ($k === 'sort' && $out['sort'] !== null && $out['sort'] !== $v && in_array($out['sort'], ['fastest', 'cheapest'], true)) {
                        continue;   // the more specific earlier sort stays
                    }
                    $out[$k] = $v;
                }
                $s = str_replace($needle, ' ', $s);
            }
        }

        // Business kind: a kind word sets the kind and is removed from the free text.
        foreach (self::KINDS as $key => $kind) {
            foreach ($kind['words'] as $w) {
                $needle = ' ' . $w . ' ';
                if (str_contains($s, $needle)) {
                    $out['kind'] ??= $key;
                    if ($out['kind'] === $key) {
                        $out['kind_words'][] = $w;
                        $s = str_replace($needle, ' ', $s);
                    }
                }
            }
        }

        $words = array_values(array_filter(preg_split('/\s+/u', trim($s)) ?: [], fn ($w) => $w !== '' && ! in_array($w, self::FILLER, true)));
        $out['text'] = mb_substr(implode(' ', $words), 0, 60);
        return $out;
    }

    /** Shop types (business_types keys) that belong to a kind, resolved from the one business-type catalogue. */
    public static function typesFor(?string $kind): array
    {
        if (! $kind || ! isset(self::KINDS[$kind])) {
            return [];
        }
        $def = self::KINDS[$kind];
        $keys = [];
        foreach (\App\Support\BusinessTypes::all() as $key => $t) {
            if (in_array($t['sector'] ?? '', $def['sectors'], true)) {
                $keys[] = $key;
                continue;
            }
            $hay = ' ' . mb_strtolower(($t['label'] ?? '') . ' ' . $key . ' ' . implode(' ', $t['aliases'] ?? [])) . ' ';
            foreach ($def['words'] as $w) {
                if (str_contains($hay, ' ' . $w . ' ')) {
                    $keys[] = $key;
                    break;
                }
            }
        }
        return array_values(array_unique($keys));
    }
}
