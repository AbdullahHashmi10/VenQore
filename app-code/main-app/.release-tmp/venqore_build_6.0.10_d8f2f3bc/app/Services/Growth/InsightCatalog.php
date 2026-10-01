<?php

namespace App\Services\Growth;

/**
 * InsightCatalog — the registry of every insight the Growth Engine can produce.
 * ────────────────────────────────────────────────────────────────────────────
 *
 * V1 had four hardcoded types (retention, forecast, churn, recovery) baked
 * into a database ENUM and scattered `if` statements. Adding a fifth meant a
 * migration plus edits in five files, so nobody ever added one — which is why
 * the engine felt thin.
 *
 * V2 declares everything in one place. Each entry carries:
 *
 *   brain           which of the four brains owns it
 *   label           human name shown in the UI and in accuracy reports
 *   category        grouping for the dashboard filter rail
 *   default_horizon how many days until the prediction can be graded
 *   gradeable       whether an outcome can be objectively verified at all
 *   cooldown_days   how long a dismissal suppresses the same signal
 *   base_priority   starting urgency before impact/confidence adjust it
 *   actionable      the concrete next step offered to the owner
 *
 * `gradeable` is the important one. Honest engines separate PREDICTIONS
 * ("this customer will churn") from OBSERVATIONS ("this product has not sold
 * in 90 days"). Only predictions can be right or wrong, so only predictions
 * count toward precision. Grading an observation would inflate the accuracy
 * number into meaninglessness.
 */
class InsightCatalog
{
    public const BRAIN_CUSTOMER  = 'customer';
    public const BRAIN_INVENTORY = 'inventory';
    public const BRAIN_PROFIT    = 'profit';
    public const BRAIN_CASH      = 'cash';

    /**
     * Memoised. `meta()` is called on every model serialisation (three
     * $appends accessors per row), so rebuilding this array each time would
     * cost thousands of array constructions per dashboard load.
     */
    private static ?array $catalog = null;

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function all(): array
    {
        return self::$catalog ??= self::define();
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private static function define(): array
    {
        return [

            // ═══════════════════════ BRAIN A — CUSTOMER ═══════════════════
            'customer_due_soon' => [
                'brain' => self::BRAIN_CUSTOMER, 'category' => 'retention',
                'label' => 'Customer due to reorder',
                'default_horizon' => 10, 'gradeable' => true, 'cooldown_days' => 7,
                'base_priority' => 'medium', 'action_type' => 'whatsapp',
                'actionable' => 'Message them before they buy elsewhere',
            ],
            'customer_overdue' => [
                'brain' => self::BRAIN_CUSTOMER, 'category' => 'retention',
                'label' => 'Customer is late ordering',
                'default_horizon' => 14, 'gradeable' => true, 'cooldown_days' => 10,
                'base_priority' => 'high', 'action_type' => 'whatsapp',
                'actionable' => 'Check in before the habit breaks',
            ],
            'customer_churn_risk' => [
                'brain' => self::BRAIN_CUSTOMER, 'category' => 'retention',
                'label' => 'Churn risk',
                'default_horizon' => 30, 'gradeable' => true, 'cooldown_days' => 21,
                'base_priority' => 'urgent', 'action_type' => 'whatsapp',
                'actionable' => 'Win them back with a personal offer',
            ],
            'customer_churned' => [
                'brain' => self::BRAIN_CUSTOMER, 'category' => 'retention',
                'label' => 'Lost customer',
                'default_horizon' => 45, 'gradeable' => true, 'cooldown_days' => 45,
                'base_priority' => 'high', 'action_type' => 'whatsapp',
                'actionable' => 'Run a win-back offer',
            ],
            'customer_spend_falling' => [
                'brain' => self::BRAIN_CUSTOMER, 'category' => 'retention',
                'label' => 'Spending is dropping',
                'default_horizon' => 30, 'gradeable' => true, 'cooldown_days' => 21,
                'base_priority' => 'high', 'action_type' => 'view_party',
                'actionable' => 'Find out what changed before they leave',
            ],
            'customer_rising_star' => [
                'brain' => self::BRAIN_CUSTOMER, 'category' => 'growth',
                'label' => 'Growing customer',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 30,
                'base_priority' => 'medium', 'action_type' => 'view_party',
                'actionable' => 'Give them your best terms and lock them in',
            ],
            'customer_vip' => [
                'brain' => self::BRAIN_CUSTOMER, 'category' => 'growth',
                'label' => 'Top customer',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 60,
                'base_priority' => 'medium', 'action_type' => 'view_party',
                'actionable' => 'Protect this relationship deliberately',
            ],
            'customer_first_repeat' => [
                'brain' => self::BRAIN_CUSTOMER, 'category' => 'growth',
                'label' => 'New customer, no second visit',
                'default_horizon' => 21, 'gradeable' => true, 'cooldown_days' => 21,
                'base_priority' => 'medium', 'action_type' => 'whatsapp',
                'actionable' => 'The second purchase decides if they stay',
            ],
            'customer_credit_risk' => [
                'brain' => self::BRAIN_CUSTOMER, 'category' => 'risk',
                'label' => 'Over credit limit',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 14,
                'base_priority' => 'urgent', 'action_type' => 'view_ledger',
                'actionable' => 'Pause further credit until they settle',
            ],
            'cross_sell_opportunity' => [
                'brain' => self::BRAIN_CUSTOMER, 'category' => 'growth',
                'label' => 'Frequently bought together',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 45,
                'base_priority' => 'low', 'action_type' => 'view_product',
                'actionable' => 'Shelve together or prompt at the counter',
            ],

            // ═══════════════════════ BRAIN B — INVENTORY ══════════════════
            'stockout_imminent' => [
                'brain' => self::BRAIN_INVENTORY, 'category' => 'stock',
                'label' => 'About to run out',
                'default_horizon' => 14, 'gradeable' => true, 'cooldown_days' => 5,
                'base_priority' => 'urgent', 'action_type' => 'purchase_order',
                'actionable' => 'Reorder now to avoid lost sales',
            ],
            'stockout_now' => [
                'brain' => self::BRAIN_INVENTORY, 'category' => 'stock',
                'label' => 'Out of stock and still selling',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 3,
                'base_priority' => 'urgent', 'action_type' => 'purchase_order',
                'actionable' => 'You are turning customers away today',
            ],
            'dead_stock' => [
                'brain' => self::BRAIN_INVENTORY, 'category' => 'stock',
                'label' => 'Dead stock',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 45,
                'base_priority' => 'high', 'action_type' => 'view_product',
                'actionable' => 'Discount, bundle or return it — it is costing you',
            ],
            'overstock_cash_trapped' => [
                'brain' => self::BRAIN_INVENTORY, 'category' => 'stock',
                'label' => 'Cash trapped in overstock',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 30,
                'base_priority' => 'high', 'action_type' => 'view_product',
                'actionable' => 'Stop reordering until this clears',
            ],
            'expiry_risk' => [
                'brain' => self::BRAIN_INVENTORY, 'category' => 'stock',
                'label' => 'Expiring soon',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 14,
                'base_priority' => 'urgent', 'action_type' => 'view_product',
                'actionable' => 'Move it now or write it off later',
            ],
            'demand_surge' => [
                'brain' => self::BRAIN_INVENTORY, 'category' => 'stock',
                'label' => 'Demand accelerating',
                'default_horizon' => 21, 'gradeable' => true, 'cooldown_days' => 14,
                'base_priority' => 'high', 'action_type' => 'purchase_order',
                'actionable' => 'Increase your order size while it lasts',
            ],
            'reorder_point_breached' => [
                'brain' => self::BRAIN_INVENTORY, 'category' => 'stock',
                'label' => 'Below your reorder level',
                'default_horizon' => 14, 'gradeable' => true, 'cooldown_days' => 7,
                'base_priority' => 'high', 'action_type' => 'purchase_order',
                'actionable' => 'Raise a purchase order',
            ],
            'high_return_rate' => [
                'brain' => self::BRAIN_INVENTORY, 'category' => 'quality',
                'label' => 'High return rate',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 30,
                'base_priority' => 'high', 'action_type' => 'view_product',
                'actionable' => 'Check quality or supplier before reordering',
            ],

            // ═══════════════════════ BRAIN C — PROFIT ═════════════════════
            'margin_erosion' => [
                'brain' => self::BRAIN_PROFIT, 'category' => 'margin',
                'label' => 'Margin is shrinking',
                'default_horizon' => 30, 'gradeable' => true, 'cooldown_days' => 21,
                'base_priority' => 'urgent', 'action_type' => 'view_product',
                'actionable' => 'Your cost rose but your price did not',
            ],
            'selling_below_cost' => [
                'brain' => self::BRAIN_PROFIT, 'category' => 'margin',
                'label' => 'Selling at a loss',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 7,
                'base_priority' => 'urgent', 'action_type' => 'view_product',
                'actionable' => 'Every unit sold loses you money',
            ],
            'discount_leakage' => [
                'brain' => self::BRAIN_PROFIT, 'category' => 'margin',
                'label' => 'Discounts eating profit',
                'default_horizon' => 30, 'gradeable' => true, 'cooldown_days' => 21,
                'base_priority' => 'high', 'action_type' => 'view_report',
                'actionable' => 'Set a discount ceiling at the till',
            ],
            'price_increase_opportunity' => [
                'brain' => self::BRAIN_PROFIT, 'category' => 'margin',
                'label' => 'Room to raise price',
                'default_horizon' => 45, 'gradeable' => true, 'cooldown_days' => 60,
                'base_priority' => 'medium', 'action_type' => 'view_product',
                'actionable' => 'Demand is strong and margin is thin',
            ],
            'unprofitable_customer' => [
                'brain' => self::BRAIN_PROFIT, 'category' => 'margin',
                'label' => 'Customer barely profitable',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 45,
                'base_priority' => 'medium', 'action_type' => 'view_party',
                'actionable' => 'Renegotiate terms or reduce servicing cost',
            ],
            'margin_mix_shift' => [
                'brain' => self::BRAIN_PROFIT, 'category' => 'margin',
                'label' => 'Sales mix moving to low-margin lines',
                'default_horizon' => 30, 'gradeable' => true, 'cooldown_days' => 30,
                'base_priority' => 'high', 'action_type' => 'view_report',
                'actionable' => 'Revenue is holding but profit is not',
            ],

            // ═══════════════════════ BRAIN D — CASH & OPS ═════════════════
            'receivable_overdue' => [
                'brain' => self::BRAIN_CASH, 'category' => 'cash',
                'label' => 'Overdue payment',
                'default_horizon' => 14, 'gradeable' => true, 'cooldown_days' => 7,
                'base_priority' => 'urgent', 'action_type' => 'send_reminder',
                'actionable' => 'Chase it before it ages further',
            ],
            'receivable_concentration' => [
                'brain' => self::BRAIN_CASH, 'category' => 'cash',
                'label' => 'Too much money with one customer',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 30,
                'base_priority' => 'high', 'action_type' => 'view_ledger',
                'actionable' => 'One default here would hurt badly',
            ],
            'cash_conversion_slowing' => [
                'brain' => self::BRAIN_CASH, 'category' => 'cash',
                'label' => 'Collections slowing down',
                'default_horizon' => 30, 'gradeable' => true, 'cooldown_days' => 21,
                'base_priority' => 'urgent', 'action_type' => 'view_report',
                'actionable' => 'Sales are fine but cash is not arriving',
            ],
            'payable_due' => [
                'brain' => self::BRAIN_CASH, 'category' => 'cash',
                'label' => 'Supplier payment due',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 7,
                'base_priority' => 'high', 'action_type' => 'view_ledger',
                'actionable' => 'Plan the payment to protect your terms',
            ],
            'revenue_anomaly_drop' => [
                'brain' => self::BRAIN_CASH, 'category' => 'trend',
                'label' => 'Sales below your normal',
                'default_horizon' => 14, 'gradeable' => true, 'cooldown_days' => 7,
                'base_priority' => 'urgent', 'action_type' => 'view_report',
                'actionable' => 'Something changed this week — find out what',
            ],
            'revenue_anomaly_spike' => [
                'brain' => self::BRAIN_CASH, 'category' => 'trend',
                'label' => 'Unusually strong week',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 14,
                'base_priority' => 'low', 'action_type' => 'view_report',
                'actionable' => 'Work out what caused it and repeat it',
            ],
            'peak_hour_understaffed' => [
                'brain' => self::BRAIN_CASH, 'category' => 'operations',
                'label' => 'Your busiest hours',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 45,
                'base_priority' => 'medium', 'action_type' => 'view_report',
                'actionable' => 'Staff and stock around this window',
            ],
            'staff_discount_outlier' => [
                'brain' => self::BRAIN_CASH, 'category' => 'operations',
                'label' => 'One cashier discounts far more',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 30,
                'base_priority' => 'high', 'action_type' => 'view_report',
                'actionable' => 'Review their authority level',
            ],
            'quiet_day_pattern' => [
                'brain' => self::BRAIN_CASH, 'category' => 'operations',
                'label' => 'Consistently quiet day',
                'default_horizon' => 0, 'gradeable' => false, 'cooldown_days' => 60,
                'base_priority' => 'low', 'action_type' => 'view_report',
                'actionable' => 'Run a promotion or cut hours on this day',
            ],
        ];
    }

    public static function get(string $type): ?array
    {
        return static::all()[$type] ?? null;
    }

    public static function meta(string $type, string $key, mixed $default = null): mixed
    {
        return static::all()[$type][$key] ?? $default;
    }

    public static function brainOf(string $type): string
    {
        return static::meta($type, 'brain', self::BRAIN_CUSTOMER);
    }

    /** Types whose truth can be objectively verified after the fact. */
    public static function gradeableTypes(): array
    {
        return array_keys(array_filter(static::all(), fn ($m) => $m['gradeable'] === true));
    }

    public static function types(): array
    {
        return array_keys(static::all());
    }

    public static function brains(): array
    {
        return [self::BRAIN_CUSTOMER, self::BRAIN_INVENTORY, self::BRAIN_PROFIT, self::BRAIN_CASH];
    }

    public static function brainLabel(string $brain): string
    {
        return [
            self::BRAIN_CUSTOMER  => 'Customer Brain',
            self::BRAIN_INVENTORY => 'Inventory Brain',
            self::BRAIN_PROFIT    => 'Profit Brain',
            self::BRAIN_CASH      => 'Cash & Operations Brain',
        ][$brain] ?? ucfirst($brain);
    }
}
