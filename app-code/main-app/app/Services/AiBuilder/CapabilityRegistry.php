<?php

namespace App\Services\AiBuilder;

/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║  CapabilityRegistry — The VenQore Business Capability Graph & Hierarchy   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 *
 * Full multi-level hierarchy:
 *   DOMAINS -> CAPABILITIES -> CONFIGURATION CONSEQUENCES & MODULE MAPPINGS
 *
 * The system determines WHAT to ask through impact scores & trade affinity filtering.
 * Gemini determines HOW to phrase it naturally in the merchant's native tongue.
 */
class CapabilityRegistry
{
    /**
     * Trade Affinity and Domain Compatibility Matrix.
     * Guarantees that the discovery engine never asks out-of-domain questions
     * (e.g., asking a Pharmacy about repair tickets or restaurant dining tables).
     */
    public function tradeMatrix(): array
    {
        return [
            'pharmacy' => [
                'allowed_domains'   => ['inventory_supply', 'wholesale_b2b', 'retail_operations'],
                'forbidden_domains' => ['service_repairs', 'hospitality_dining', 'manufacturing_production', 'services_appointments'],
                'priority_caps'     => ['batch_expiry_tracking', 'multi_branch_warehouses', 'customer_khata_credit', 'supplier_purchasing'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom', 'appointment_scheduling', 'product_variants', 'serial_imei_tracking'],
            ],
            'grocery' => [
                'allowed_domains'   => ['inventory_supply', 'wholesale_b2b', 'retail_operations'],
                'forbidden_domains' => ['service_repairs', 'hospitality_dining', 'manufacturing_production', 'services_appointments'],
                'priority_caps'     => ['multi_branch_warehouses', 'customer_khata_credit', 'batch_expiry_tracking'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'table_and_kot_management', 'food_delivery_dispatch', 'appointment_scheduling', 'serial_imei_tracking'],
            ],
            'clothing' => [
                'allowed_domains'   => ['inventory_supply', 'retail_operations', 'wholesale_b2b'],
                'forbidden_domains' => ['service_repairs', 'hospitality_dining', 'manufacturing_production', 'services_appointments'],
                'priority_caps'     => ['product_variants', 'multi_branch_warehouses', 'customer_khata_credit'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom', 'appointment_scheduling', 'batch_expiry_tracking', 'serial_imei_tracking'],
            ],
            'electronics' => [
                'allowed_domains'   => ['inventory_supply', 'service_repairs', 'retail_operations', 'wholesale_b2b'],
                'forbidden_domains' => ['hospitality_dining', 'manufacturing_production', 'services_appointments'],
                'priority_caps'     => ['serial_imei_tracking', 'repair_job_tracking', 'customer_khata_credit'],
                'auto_reject'       => ['table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom', 'appointment_scheduling', 'batch_expiry_tracking'],
            ],
            'repairs' => [
                'allowed_domains'   => ['service_repairs', 'inventory_supply', 'retail_operations'],
                'forbidden_domains' => ['hospitality_dining', 'manufacturing_production', 'services_appointments', 'wholesale_b2b'],
                'priority_caps'     => ['repair_job_tracking', 'spare_parts_and_labour'],
                'auto_reject'       => ['table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom', 'appointment_scheduling', 'batch_expiry_tracking', 'product_variants'],
            ],
            'restaurant' => [
                'allowed_domains'   => ['hospitality_dining', 'inventory_supply', 'manufacturing_production'],
                'forbidden_domains' => ['service_repairs', 'services_appointments', 'wholesale_b2b'],
                'priority_caps'     => ['table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'appointment_scheduling', 'serial_imei_tracking', 'product_variants', 'customer_khata_credit'],
            ],
            'bakery' => [
                'allowed_domains'   => ['manufacturing_production', 'inventory_supply', 'hospitality_dining', 'retail_operations'],
                'forbidden_domains' => ['service_repairs', 'services_appointments'],
                'priority_caps'     => ['recipe_and_bom', 'batch_expiry_tracking', 'multi_branch_warehouses'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'appointment_scheduling', 'serial_imei_tracking'],
            ],
            'salon' => [
                'allowed_domains'   => ['services_appointments', 'inventory_supply', 'retail_operations'],
                'forbidden_domains' => ['service_repairs', 'hospitality_dining', 'manufacturing_production', 'wholesale_b2b'],
                'priority_caps'     => ['appointment_scheduling', 'product_variants'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'table_and_kot_management', 'food_delivery_dispatch', 'recipe_and_bom', 'batch_expiry_tracking', 'serial_imei_tracking'],
            ],
            'wholesale' => [
                'allowed_domains'   => ['wholesale_b2b', 'inventory_supply'],
                'forbidden_domains' => ['service_repairs', 'hospitality_dining', 'services_appointments'],
                'priority_caps'     => ['customer_khata_credit', 'quotations_and_orders', 'multi_branch_warehouses'],
                'auto_reject'       => ['repair_job_tracking', 'spare_parts_and_labour', 'table_and_kot_management', 'food_delivery_dispatch', 'appointment_scheduling'],
            ],
        ];
    }

    /**
     * Complete domain & capability graph.
     *
     * @return array<string, array<string, array{name: string, impact: int, triggers: string[], requires_caps: string[], implies_modules: string[], consequences: string[], question_template: string, options: array<array{key: string, label: string, implies: string}>}>>
     */
    public function catalog(): array
    {
        return [
            'service_repairs' => [
                'repair_job_tracking' => [
                    'name'              => 'Repair & Job Status Tracking',
                    'impact'            => 100,
                    'triggers'          => ['repair', 'fixing', 'workshop', 'technician', 'service', 'phone fix', 'mobile repair', 'auto repair', 'مرمت', 'ورکشاپ'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['repairs', 'pos', 'customers'],
                    'consequences'      => ['Enables repair ticket intake, diagnostic notes, stage updates (Received, In Progress, Ready, Delivered) and SMS notification.'],
                    'question_template' => 'Do you take in customer items/devices for repair and need stage-by-stage status tracking (Received -> Diagnosing -> Ready -> Delivered)?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, track repair jobs', 'implies' => 'repair_job_tracking'],
                        ['key' => 'no', 'label' => 'No, sales only', 'implies' => 'sales_only'],
                        ['key' => 'custom', 'label' => 'Let me explain', 'implies' => 'custom'],
                    ],
                ],
                'spare_parts_and_labour' => [
                    'name'              => 'Spare Parts & Service Labour Billing',
                    'impact'            => 85,
                    'triggers'          => ['repair', 'technician', 'parts', 'labour', 'service charges', 'اسپیئر پارٹس'],
                    'requires_caps'     => ['repair_job_tracking'],
                    'implies_modules'   => ['repairs', 'inventory', 'expenses'],
                    'consequences'      => ['Deducts replacement parts from inventory while billing labor charges as service line items on the repair invoice.'],
                    'question_template' => 'When completing a repair, do you bill for replacement parts and labor/service charges separately on the customer invoice?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, parts and labor', 'implies' => 'spare_parts_and_labour'],
                        ['key' => 'parts_only', 'label' => 'Flat fee / parts only', 'implies' => 'flat_repair_fee'],
                        ['key' => 'no', 'label' => 'No parts needed', 'implies' => 'labour_only'],
                    ],
                ],
            ],

            'inventory_supply' => [
                'multi_branch_warehouses' => [
                    'name'              => 'Multi-Branch & Inter-Store Transfers',
                    'impact'            => 95,
                    'triggers'          => ['branches', 'outlets', 'stores', 'locations', 'warehouses', 'chain', 'برانچ', 'گودام'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['branches', 'stock_transfers', 'inventory'],
                    'consequences'      => ['Enables isolated branch inventories, central warehouse management, inter-store transfer requests, and branch-level analytics.'],
                    'question_template' => 'Do you operate across multiple shops, branches, or separate warehouses that need stock transfers between them?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, multiple branches', 'implies' => 'multi_branch_warehouses'],
                        ['key' => 'no', 'label' => 'Single location', 'implies' => 'single_location'],
                        ['key' => 'planning', 'label' => 'Opening soon', 'implies' => 'multi_branch_warehouses'],
                    ],
                ],
                'batch_expiry_tracking' => [
                    'name'              => 'Batch Numbers & Expiry Date Management',
                    'impact'            => 95,
                    'triggers'          => ['pharmacy', 'medicine', 'drugstore', 'food', 'bakery', 'cosmetics', 'perishables', 'dairy', 'meat', 'فارمیسی', 'میڈیکل'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['batches_expiry', 'inventory'],
                    'consequences'      => ['Enables batch/lot number tracking, automated FEFO (First-Expired-First-Out) dispatch, and near-expiry alerts.'],
                    'question_template' => 'Do your products have batch/lot numbers or expiry dates that need automatic tracking and expiration warnings?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, track batches & expiry', 'implies' => 'batch_expiry_tracking'],
                        ['key' => 'no', 'label' => 'No expiry dates', 'implies' => 'no_expiry'],
                        ['key' => 'some', 'label' => 'Only specific items', 'implies' => 'batch_expiry_tracking'],
                    ],
                ],
                'supplier_purchasing' => [
                    'name'              => 'Supplier Purchase Orders & Low Stock Reordering',
                    'impact'            => 85,
                    'triggers'          => ['suppliers', 'distributors', 'vendors', 'purchases', 'restock', 'reorder', 'سپلائر', 'ڈسٹری بیوٹر'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['purchases', 'suppliers', 'inventory'],
                    'consequences'      => ['Automates supplier bills, low-stock reorder triggers, and purchase order tracking.'],
                    'question_template' => 'Do you order stock from suppliers/distributors and want automated low-stock reordering and purchase bills?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, track supplier orders & bills', 'implies' => 'supplier_purchasing'],
                        ['key' => 'cash_only', 'label' => 'Direct cash purchase only', 'implies' => 'cash_purchases'],
                    ],
                ],
                'serial_imei_tracking' => [
                    'name'              => 'Individual Serial / IMEI Device Tracking',
                    'impact'            => 90,
                    'triggers'          => ['electronics', 'mobile', 'phones', 'computers', 'hardware', 'appliances', 'machinery', 'موبائل', 'الیکٹرانکس'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['serial_numbers', 'inventory'],
                    'consequences'      => ['Tracks unique serial numbers or IMEIs per unit from purchase through sale, warranty claims, and returns.'],
                    'question_template' => 'Do you need to record individual Serial Numbers or IMEIs for every single device bought and sold (for warranty and tracking)?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, track serials/IMEIs', 'implies' => 'serial_imei_tracking'],
                        ['key' => 'no', 'label' => 'Standard SKU quantity', 'implies' => 'standard_inventory'],
                        ['key' => 'custom', 'label' => 'Only for phones/laptops', 'implies' => 'serial_imei_tracking'],
                    ],
                ],
                'product_variants' => [
                    'name'              => 'Size, Color & Style Matrix (Variants)',
                    'impact'            => 75,
                    'triggers'          => ['clothing', 'apparel', 'garments', 'fashion', 'shoes', 'boutique', 'fabric', 'textiles', 'کپڑے', 'گارمنٹس'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['variants', 'products', 'inventory'],
                    'consequences'      => ['Allows creating master items with color, size, material, and barcode variants with individual stock counts.'],
                    'question_template' => 'Do your items come in multiple sizes, colors, or styles that need distinct stock counts per variant?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, sizes & colors', 'implies' => 'product_variants'],
                        ['key' => 'no', 'label' => 'Uniform items only', 'implies' => 'simple_products'],
                    ],
                ],
            ],

            'hospitality_dining' => [
                'table_and_kot_management' => [
                    'name'              => 'Dine-In Table Layout & Kitchen Printing (KOT)',
                    'impact'            => 95,
                    'triggers'          => ['restaurant', 'cafe', 'food', 'dining', 'bistro', 'eatery', 'bar', 'pizzeria', 'ریسٹورنٹ', 'کھانا'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['tables', 'kitchen_display', 'pos'],
                    'consequences'      => ['Configures table floorplans, table booking, split bills, and kitchen order ticket (KOT) routing.'],
                    'question_template' => 'Do you provide dine-in seating with tables and require kitchen order tickets (KOT) sent to your kitchen?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, dine-in & kitchen tickets', 'implies' => 'table_and_kot_management'],
                        ['key' => 'counter_only', 'label' => 'Counter / Takeaway only', 'implies' => 'counter_dining'],
                        ['key' => 'delivery_only', 'label' => 'Cloud kitchen / Delivery', 'implies' => 'delivery_management'],
                    ],
                ],
                'food_delivery_dispatch' => [
                    'name'              => 'Home Delivery & Rider Dispatch',
                    'impact'            => 70,
                    'triggers'          => ['delivery', 'riders', 'dispatch', 'home delivery', 'ڈلیوری', 'رائڈر'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['delivery_orders', 'pos'],
                    'consequences'      => ['Assigns orders to riders, records delivery charges, and tracks dispatch to customer doorsteps.'],
                    'question_template' => 'Do you manage your own home deliveries and rider assignments?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, own riders & delivery', 'implies' => 'food_delivery_dispatch'],
                        ['key' => 'no', 'label' => 'Takeaway/Dine-in only', 'implies' => 'no_delivery'],
                    ],
                ],
            ],

            'wholesale_b2b' => [
                'customer_khata_credit' => [
                    'name'              => 'Customer Khata, Credit Ledger & Terms',
                    'impact'            => 85,
                    'triggers'          => ['wholesale', 'distribution', 'credit', 'khata', 'terms', 'installments', 'pharmacy', 'grocery', 'کھاتہ', 'ادھار', 'ہول سیل'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['credit_sales', 'customers', 'sales_orders'],
                    'consequences'      => ['Manages customer credit limits, aging balances, partial payments, payment reminders, and statements.'],
                    'question_template' => 'Do regular customers or patients buy on credit / monthly Khata terms, or is it strictly immediate cash/card checkout?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, offer credit / Khata', 'implies' => 'customer_khata_credit'],
                        ['key' => 'cash_only', 'label' => 'Immediate cash/card only', 'implies' => 'cash_only'],
                        ['key' => 'some', 'label' => 'Only trusted regular clients', 'implies' => 'customer_khata_credit'],
                    ],
                ],
                'quotations_and_orders' => [
                    'name'              => 'Formal Quotations & B2B Sales Orders',
                    'impact'            => 70,
                    'triggers'          => ['quotations', 'estimates', 'b2b', 'corporate', 'purchase orders', 'کوٹیشن'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['quotations', 'sales_orders', 'customers'],
                    'consequences'      => ['Allows issuing formal quotes/estimates to clients and converting approved quotes directly into sales invoices.'],
                    'question_template' => 'Do you issue price quotes/estimates to corporate or wholesale clients before confirming an order?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, send quotes first', 'implies' => 'quotations_and_orders'],
                        ['key' => 'no', 'label' => 'Direct POS sales only', 'implies' => 'pos_only'],
                    ],
                ],
            ],

            'manufacturing_production' => [
                'recipe_and_bom' => [
                    'name'              => 'Recipes, Bill of Materials & Production',
                    'impact'            => 85,
                    'triggers'          => ['bakery', 'manufacturing', 'assembly', 'production', 'recipe', 'crafting', 'raw materials', 'پروڈکشن', 'بیکری'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['cookbook', 'production_runs', 'inventory'],
                    'consequences'      => ['Defines Bill of Materials (BOM)/recipes and auto-deducts ingredients while stocking the finished goods.'],
                    'question_template' => 'Do you manufacture or bake finished goods from raw materials/ingredients and need recipe-based deduction?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, recipe/production tracking', 'implies' => 'recipe_and_bom'],
                        ['key' => 'no', 'label' => 'Buy & resell ready goods', 'implies' => 'trading_only'],
                    ],
                ],
            ],

            'services_appointments' => [
                'appointment_scheduling' => [
                    'name'              => 'Staff Booking & Client Appointments',
                    'impact'            => 85,
                    'triggers'          => ['salon', 'spa', 'clinic', 'barber', 'consultant', 'appointments', 'سلیون', 'بکنگ'],
                    'requires_caps'     => [],
                    'implies_modules'   => ['appointments', 'staff_roster', 'customers'],
                    'consequences'      => ['Enables calendar appointment scheduling, staff shift roster, and service commission allocation.'],
                    'question_template' => 'Do clients book appointments in advance for specific staff members, stylists, or treatment rooms?',
                    'options'           => [
                        ['key' => 'yes', 'label' => 'Yes, appointment calendar', 'implies' => 'appointment_scheduling'],
                        ['key' => 'walkin', 'label' => 'Walk-ins only', 'implies' => 'walkins_only'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Flattens all capabilities into a key-indexed list.
     *
     * @return array<string, array{domain: string, name: string, impact: int, triggers: string[], requires_caps: string[], implies_modules: string[], consequences: string[], question_template: string, options: array}>
     */
    public function allCapabilities(): array
    {
        $flattened = [];
        foreach ($this->catalog() as $domain => $caps) {
            foreach ($caps as $key => $cap) {
                $flattened[$key] = array_merge($cap, ['domain' => $domain]);
            }
        }

        return $flattened;
    }

    /**
     * Fast 0-Token Deterministic Fact Extractor.
     *
     * @return array{facts: array<string, array{value: mixed, confidence: float, source: string, evidence: string}>, detected_preset: ?string}
     */
    public function detectStructuredFacts(string $text): array
    {
        $normalized = strtolower($text);
        $facts = [];
        $detectedPreset = null;

        // 1. Branch Count — matches "2 branches", "2 برانچز", "2 برانچ", "دو برانچ" etc.
        // The Urdu plural 'برانچز' has extra 'ز' — use partial match with 'برانچ' prefix
        $branchPatterns = [
            '/(\d+)\s*(branches|branch|stores?|outlets?|locations?|shops?)/iu',
            '/(\d+)\s*(برانچ\w*|دکانیں|شاخیں|لوکیشن)/u',
        ];
        $branchMatched = false;
        foreach ($branchPatterns as $bp) {
            if (preg_match($bp, $text, $m)) {
                $count = (int) $m[1];
                $facts['branches'] = [
                    'value'      => $count,
                    'confidence' => 1.0,
                    'source'     => 'user_explicit',
                    'evidence'   => $m[0],
                ];
                $facts['multi_branch'] = [
                    'value'      => $count > 1,
                    'confidence' => 1.0,
                    'source'     => 'user_explicit',
                    'evidence'   => $m[0],
                ];
                $branchMatched = true;
                break;
            }
        }

        if (!$branchMatched) {
            // Written number variants
            $twoAliases = ['two branch', '2 branch', 'دو برانچ', '2 برانچ', 'two stores', 'two shops'];
            foreach ($twoAliases as $alias) {
                if (str_contains($normalized, $alias)) {
                    $facts['branches']    = ['value' => 2, 'confidence' => 1.0, 'source' => 'user_explicit', 'evidence' => $alias];
                    $facts['multi_branch'] = ['value' => true, 'confidence' => 1.0, 'source' => 'user_explicit', 'evidence' => $alias];
                    break;
                }
            }
        }

        // 2. Domain & Trade Triggers
        $domainKeywords = [
            'pharmacy'    => ['pharmacy', 'medicine', 'drugstore', 'میڈیکل', 'فارمیسی', 'chemist', 'medical store', 'دوا', 'صيدلية', 'أدوية'],
            'repairs'     => ['repair', 'fixing', 'مرمت', 'technician', 'phone fix', 'mobile repair', 'workshop'],
            'clothing'    => ['clothing', 'garment', 'apparel', 'boutique', 'کپڑے', 'fashion', 'shoes', 'بوتیک'],
            'restaurant'  => ['restaurant', 'cafe', 'food', 'dining', 'کھانا', 'bistro', 'burger', 'pizza', 'ریسٹورنٹ', 'ہوٹل'],
            'bakery'      => ['bakery', 'bread', 'cakes', 'pastry', 'بیکری'],
            'grocery'     => ['grocery', 'supermarket', 'mart', 'کرانہ', 'جنرل اسٹور'],
            'wholesale'   => ['wholesale', 'distributor', 'ہول سیل', 'bulk supply'],
            'salon'       => ['salon', 'spa', 'beauty', 'سلیون', 'barber', 'haircut', 'پارلر'],
            'electronics' => ['electronics', 'mobile shop', 'computers', 'موبائل شاپ', 'موبائل کی دکان', 'الیکٹرانکس'],
        ];

        foreach ($domainKeywords as $trade => $keywords) {
            foreach ($keywords as $kw) {
                if (str_contains($normalized, $kw)) {
                    $facts["trade:{$trade}"] = [
                        'value'      => true,
                        'confidence' => 0.95,
                        'source'     => 'user_keyword',
                        'evidence'   => $kw,
                    ];
                    $detectedPreset = $trade;
                    break;
                }
            }
        }

        return [
            'facts'           => $facts,
            'detected_preset' => $detectedPreset,
        ];
    }

    /**
     * DETERMINISTIC QUESTION SELECTION ENGINE.
     * The system decides WHAT candidate question to ask based on highest impact score,
     * trade affinity filtering, satisfied prerequisites, and contextual domain relevance.
     *
     * @param array<string, array> $knownFacts
     * @param string[] $confirmedCaps
     * @param string[] $rejectedCaps
     * @return array{key: string, name: string, impact: int, consequences: string[], question_template: string, options: array}|null
     */
    public function selectNextCandidateQuestion(array $knownFacts, array $confirmedCaps, array $rejectedCaps): ?array
    {
        $all = $this->allCapabilities();
        $tradeMatrix = $this->tradeMatrix();
        $candidates = [];

        // Combined profile of every trade in the known facts
        $tradeConfig = $this->combinedTradeConfig($knownFacts, $tradeMatrix);

        // Build context string from all known facts
        $factKeys = array_keys($knownFacts);
        $contextString = strtolower(implode(' ', $factKeys));

        foreach ($all as $key => $cap) {
            // Already resolved? Skip
            if (in_array($key, $confirmedCaps, true) || in_array($key, $rejectedCaps, true)) {
                continue;
            }

            // Prerequisite capabilities satisfied?
            foreach ($cap['requires_caps'] as $req) {
                if (!in_array($req, $confirmedCaps, true)) {
                    continue 2; // prerequisite not confirmed yet
                }
            }

            // Trade domain affinity filtering
            if ($tradeConfig) {
                // If capability is forbidden for this trade and was not explicitly mentioned by user, reject it
                if (in_array($cap['domain'], $tradeConfig['forbidden_domains'] ?? [], true)) {
                    $hasExplicitTrigger = false;
                    foreach ($cap['triggers'] as $t) {
                        if (str_contains($contextString, $t)) {
                            $hasExplicitTrigger = true;
                            break;
                        }
                    }
                    if (!$hasExplicitTrigger) {
                        continue;
                    }
                }

                // If capability is explicitly in auto_reject for this trade, skip
                if (in_array($key, $tradeConfig['auto_reject'] ?? [], true)) {
                    continue;
                }
            }

            // Calculate relevance score boost
            $relevanceBoost = 0;
            if ($tradeConfig && in_array($key, $tradeConfig['priority_caps'] ?? [], true)) {
                $relevanceBoost += 60;
            }

            foreach ($cap['triggers'] as $trigger) {
                if (str_contains($contextString, $trigger)) {
                    $relevanceBoost += 40;
                }
            }

            $score = $cap['impact'] + $relevanceBoost;

            $candidates[] = [
                'key'               => $key,
                'name'              => $cap['name'],
                'impact'            => $score,
                'consequences'      => $cap['consequences'],
                'question_template' => $cap['question_template'],
                'options'           => $cap['options'],
            ];
        }

        if (empty($candidates)) {
            return null;
        }

        // Sort descending by calculated priority score
        usort($candidates, fn ($a, $b) => $b['impact'] <=> $a['impact']);

        return $candidates[0];
    }

    /**
     * Every trade the owner described counts (a phone shop that also does
     * repairs is both): priority questions are the UNION of those trades',
     * and a domain or capability is ruled out only when EVERY detected trade
     * rules it out. Before 2026-09-10 only the first trade was used, so the
     * second trade's priority questions were never asked or counted.
     *
     * @return array{priority_caps: string[], forbidden_domains: string[], auto_reject: string[]}|null
     */
    private function combinedTradeConfig(array $facts, array $tradeMatrix): ?array
    {
        $trades = [];
        foreach ($facts as $factKey => $fact) {
            if (!str_starts_with((string) $factKey, 'trade:')) {
                continue;
            }
            if (is_array($fact) && array_key_exists('value', $fact) && !$fact['value']) {
                continue;
            }
            $trade = substr((string) $factKey, 6);
            if (isset($tradeMatrix[$trade])) {
                $trades[] = $tradeMatrix[$trade];
            }
        }

        if (!$trades) {
            return null;
        }

        $pick = fn (string $field) => array_map(fn ($t) => $t[$field] ?? [], $trades);
        $intersect = fn (array $lists) => count($lists) === 1 ? $lists[0] : array_values(array_intersect(...$lists));

        return [
            'priority_caps'     => array_values(array_unique(array_merge(...$pick('priority_caps')))),
            'forbidden_domains' => $intersect($pick('forbidden_domains')),
            'auto_reject'       => $intersect($pick('auto_reject')),
        ];
    }

    /**
     * CALCULATES SYSTEM READINESS CONFIDENCE (Deterministic).
     *
     * @param array<string, array> $facts
     * @param string[] $confirmedCaps
     * @param string[] $rejectedCaps
     * @return float 0.0 to 1.0
     */
    public function calculateReadinessConfidence(array $facts, array $confirmedCaps, array $rejectedCaps): float
    {
        if (empty($facts)) {
            return 0.2;
        }

        $all = $this->allCapabilities();
        $tradeMatrix = $this->tradeMatrix();

        $tradeConfig = $this->combinedTradeConfig($facts, $tradeMatrix);

        $totalHighImpactPoints = 0;
        $resolvedHighImpactPoints = 0;
        $factKeys = strtolower(implode(' ', array_keys($facts)));

        foreach ($all as $key => $cap) {
            // If trade config exists, evaluate only allowed domain / priority capabilities
            if ($tradeConfig) {
                if (in_array($cap['domain'], $tradeConfig['forbidden_domains'] ?? [], true)) {
                    continue;
                }
                if (in_array($key, $tradeConfig['auto_reject'] ?? [], true)) {
                    continue;
                }
                $isPriority = in_array($key, $tradeConfig['priority_caps'] ?? [], true);
                if ($isPriority) {
                    $totalHighImpactPoints += $cap['impact'];
                    if (in_array($key, $confirmedCaps, true) || in_array($key, $rejectedCaps, true)) {
                        $resolvedHighImpactPoints += $cap['impact'];
                    }
                }
            } else {
                $isRelevant = false;
                foreach ($cap['triggers'] as $trigger) {
                    if (str_contains($factKeys, $trigger)) {
                        $isRelevant = true;
                        break;
                    }
                }

                if ($isRelevant || $cap['impact'] >= 90) {
                    $totalHighImpactPoints += $cap['impact'];
                    if (in_array($key, $confirmedCaps, true) || in_array($key, $rejectedCaps, true)) {
                        $resolvedHighImpactPoints += $cap['impact'];
                    }
                }
            }
        }

        if ($totalHighImpactPoints === 0) {
            return count($confirmedCaps) > 0 ? 0.90 : 0.60;
        }

        $resolutionRatio = $resolvedHighImpactPoints / $totalHighImpactPoints;
        $baseConfidence = 0.55 + ($resolutionRatio * 0.40);

        return round(min(0.98, $baseConfidence), 2);
    }

    /**
     * Final live module resolver.
     *
     * @param string[] $confirmedCaps
     * @param string|null $presetKey
     * @return string[]
     */
    public function resolveModules(array $confirmedCaps, ?string $presetKey = null): array
    {
        $all = $this->allCapabilities();

        // Baseline essential modules
        $modules = ['products', 'pos', 'inventory', 'sales_orders', 'customers', 'suppliers', 'expenses', 'reports'];

        if ($presetKey && isset(config('ai_builder.presets', [])[$presetKey]['modules'])) {
            $modules = array_merge($modules, config('ai_builder.presets')[$presetKey]['modules']);
        }

        foreach ($confirmedCaps as $capKey) {
            if (isset($all[$capKey]['implies_modules'])) {
                $modules = array_merge($modules, $all[$capKey]['implies_modules']);
            }
        }

        // Intersect strictly with live modules in config/modules.php
        $liveRegistry = array_keys(array_filter(config('modules', []), fn ($m) => ($m['status'] ?? null) === 'live'));

        return array_values(array_unique(array_intersect($modules, $liveRegistry)));
    }
}
