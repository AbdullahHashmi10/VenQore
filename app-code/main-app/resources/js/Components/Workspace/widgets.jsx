import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Package,
    Plus,
    ShoppingCart,
    UserPlus,
    Wallet,
} from 'lucide-react';

import { formatCurrency, formatNumber } from '@/Utils/format';
import { role } from '@/theme/runtime';
import { usePermission } from '@/Hooks/usePermission';

/**
 * How each dashboard card renders.
 *
 * ── What this file is NOT ───────────────────────────────────────────────────
 *
 * It is not the widget registry. The registry — what exists, who may see it,
 * which sizes it supports — lives in PHP, in WidgetRegistry, because a list the
 * browser owns is a list anyone can edit. This file only knows how to draw the
 * data the server chose to send. A widget id appearing here with no server
 * counterpart renders nothing; a widget the server allows with no renderer here
 * falls back to a readable placeholder rather than a blank card.
 *
 * ── Sizing ─────────────────────────────────────────────────────────────────
 *
 * Every renderer fills its container and nothing sets a pixel height. Card
 * height comes from the grid, and the grid's row height comes from the layout,
 * so a card that has been resized from Small to Large does not need a second
 * code path — the same renderer simply has more room. Charts use
 * ResponsiveContainer for the same reason.
 */

/* ------------------------------------------------------------------ *
 * Presentation primitives
 * ------------------------------------------------------------------ */

/**
 * The headline number treatment.
 *
 * `tabular-nums` and the numeric font are not decoration: a figure that changes
 * width as it counts up makes the whole card twitch, and in a column of money
 * it makes the decimal points fail to line up.
 */
function Metric({ value, caption, delta, deltaLabel }) {
    const hasDelta = typeof delta === 'number' && Number.isFinite(delta);
    const positive = hasDelta && delta >= 0;

    return (
        <div className="flex h-full flex-col justify-center">
            <p className="font-numeric text-3xl font-semibold tabular-nums tracking-tight text-ink">
                {value}
            </p>

            {(caption || hasDelta) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {hasDelta && (
                        <span
                            className={[
                                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-2xs font-semibold',
                                positive
                                    ? 'bg-success-500/12 text-success-600'
                                    : 'bg-danger-500/12 text-danger-600',
                            ].join(' ')}
                        >
                            {positive
                                ? <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                                : <ArrowDownRight className="h-3 w-3" aria-hidden="true" />}
                            {Math.abs(delta)}%
                        </span>
                    )}
                    {(deltaLabel || caption) && (
                        <span className="text-xs text-ink-muted">{deltaLabel || caption}</span>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * The quiet empty state.
 *
 * Deliberately without an icon or an illustration. A new store sees these on
 * most of its cards at once, and eight decorated empty states read as eight
 * problems rather than as a business that has not traded yet.
 */
function Empty({ children }) {
    return (
        <div className="flex h-full items-center justify-center px-2 text-center">
            <p className="text-sm text-ink-muted">{children}</p>
        </div>
    );
}

/** A scrollable list that never pushes its card wider than the grid cell. */
function Rows({ items, renderItem, empty }) {
    if (!items?.length) return <Empty>{empty}</Empty>;

    return (
        <ul className="-mx-1 h-full space-y-1 overflow-y-auto overscroll-contain px-1">
            {items.map((item, index) => (
                <li key={item.id ?? item.name ?? index}>{renderItem(item)}</li>
            ))}
        </ul>
    );
}

/** `name … value` — the shape most of these cards want. */
function RowLine({ label, sublabel, value, tone = 'ink' }) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-interactive-hover">
            <div className="min-w-0">
                <p className="truncate text-sm text-ink">{label}</p>
                {sublabel && <p className="truncate text-2xs text-ink-muted">{sublabel}</p>}
            </div>
            <p
                className={[
                    'shrink-0 font-numeric text-sm font-medium tabular-nums',
                    tone === 'danger' ? 'text-danger-600' : 'text-ink-secondary',
                ].join(' ')}
            >
                {value}
            </p>
        </div>
    );
}

/* ------------------------------------------------------------------ *
 * Renderers
 * ------------------------------------------------------------------ */

const money = (value) => formatCurrency(value ?? 0);

const renderers = {
    revenue_today: ({ data }) => (
        <Metric
            value={money(data.value)}
            delta={data.change_pct}
            deltaLabel={data.label}
        />
    ),

    net_profit: ({ data }) => (
        <Metric value={money(data.value)} caption={data.label} />
    ),

    expenses: ({ data }) => (
        <Metric
            value={money(data.value)}
            // Inverted on purpose: for expenses, up is the bad direction, and a
            // green arrow on a rising cost line is actively misleading.
            delta={typeof data.change_pct === 'number' ? -data.change_pct : null}
            deltaLabel={data.label}
        />
    ),

    cash_position: ({ data }) => (
        <div className="flex h-full flex-col justify-center">
            <Metric value={money(data.value)} />
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-sunken px-2 py-1.5">
                    <dt className="text-ink-muted">Cash</dt>
                    <dd className="font-numeric tabular-nums text-ink">{money(data.cash)}</dd>
                </div>
                <div className="rounded-lg bg-sunken px-2 py-1.5">
                    <dt className="text-ink-muted">Bank</dt>
                    <dd className="font-numeric tabular-nums text-ink">{money(data.bank)}</dd>
                </div>
            </dl>
        </div>
    ),

    receivables: ({ data }) => <Metric value={money(data.value)} caption="Owed to you" />,

    payables: ({ data }) => <Metric value={money(data.value)} caption="You owe" />,

    inventory_value: ({ data }) => <Metric value={money(data.value)} caption="Stock on hand" />,

    customer_count: ({ data }) => (
        <Metric
            value={formatNumber(data.value ?? 0)}
            caption={`${formatNumber(data.new_this_month ?? 0)} ${data.label}`}
        />
    ),

    open_orders: ({ data }) => (
        <Metric value={formatNumber(data.value ?? 0)} caption={data.label} />
    ),

    production_output: ({ data }) => (
        <Metric value={formatNumber(data.value ?? 0)} caption={data.label} />
    ),

    sales_summary: ({ data }) => (
        <div className="grid h-full grid-cols-3 items-center gap-2">
            {['today', 'month', 'year'].map((period) => (
                <div key={period} className="min-w-0">
                    <p className="text-2xs uppercase tracking-wide text-ink-muted">{period}</p>
                    <p className="truncate font-numeric text-base font-semibold tabular-nums text-ink">
                        {money(data[period]?.revenue)}
                    </p>
                    <p className="truncate text-2xs text-ink-muted">
                        {money(data[period]?.gross_profit)} profit
                    </p>
                </div>
            ))}
        </div>
    ),

    /**
     * The one chart.
     *
     * Colours come from `role` in theme/runtime rather than from classes,
     * because Recharts passes `stroke` and `fill` straight through as SVG
     * presentation attributes, where `var()` is not valid. This is the documented
     * escape hatch and the only place in this file that needs it.
     */
    revenue_trend: ({ data }) => {
        if (!data.series?.length) return <Empty>No revenue recorded yet.</Empty>;

        return (
            <div className="h-full min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.series} margin={{ top: 6, right: 4, left: -22, bottom: 0 }}>
                        <defs>
                            <linearGradient id="vqRevenueFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={role.brand[500]} stopOpacity={0.28} />
                                <stop offset="100%" stopColor={role.brand[500]} stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke={role.neutral[300]} strokeOpacity={0.35} vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: role.neutral[500] }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: role.neutral[500] }} tickLine={false} axisLine={false} width={54} />
                        <Tooltip
                            formatter={(value) => money(value)}
                            contentStyle={{
                                borderRadius: 12,
                                border: `1px solid ${role.neutral[300]}`,
                                fontSize: 12,
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke={role.brand[500]}
                            strokeWidth={2}
                            fill="url(#vqRevenueFill)"
                        />
                        <Area
                            type="monotone"
                            dataKey="profit"
                            stroke={role.success[500]}
                            strokeWidth={2}
                            fill="none"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    },

    low_stock: ({ data }) => (
        <Rows
            items={data.rows}
            empty="Everything is above its alert level."
            renderItem={(item) => (
                <RowLine
                    label={item.name}
                    sublabel={item.sku}
                    value={`${formatNumber(item.quantity)} / ${formatNumber(item.threshold)}`}
                    tone="danger"
                />
            )}
        />
    ),

    top_products: ({ data }) => (
        <Rows
            items={data.rows}
            empty="No sales this month yet."
            renderItem={(item) => (
                <RowLine
                    label={item.name}
                    sublabel={`${formatNumber(item.quantity)} sold`}
                    value={money(item.value)}
                />
            )}
        />
    ),

    top_customers: ({ data }) => (
        <Rows
            items={data.rows}
            empty="No customer sales this month yet."
            renderItem={(item) => <RowLine label={item.name} value={money(item.value)} />}
        />
    ),

    recent_purchases: ({ data }) => (
        <Rows
            items={data.rows}
            empty="No purchases recorded yet."
            renderItem={(item) => (
                <RowLine label={item.reference} sublabel={item.date} value={money(item.value)} />
            )}
        />
    ),

    active_staff: ({ data }) => (
        <Rows
            items={data.rows}
            empty="Nobody is clocked in."
            renderItem={(item) => (
                <RowLine
                    label={item.name}
                    value={item.since
                        ? new Date(item.since).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                />
            )}
        />
    ),

    ai_insights: ({ data }) => (
        <Rows
            items={data.rows}
            empty="No new insights right now."
            renderItem={(item) => (
                <RowLine label={item.title} sublabel={item.priority} value="" />
            )}
        />
    ),

    needs_attention: ({ data }) => {
        if (!data.items?.length) {
            return <Empty>Nothing needs you right now.</Empty>;
        }

        return (
            <ul className="h-full space-y-2 overflow-y-auto overscroll-contain">
                {data.items.map((item) => (
                    <li key={item.kind} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-warning-500/12 text-warning-600">
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <p className="text-sm text-ink-secondary">
                            <span className="font-semibold text-ink">
                                {item.amount !== undefined ? money(item.amount) : formatNumber(item.count ?? 0)}
                            </span>{' '}
                            {item.label}
                        </p>
                    </li>
                ))}
            </ul>
        );
    },

    /**
     * Quick actions.
     *
     * The server sends the candidate actions and the permission each one needs;
     * the client filters with the same `usePermission` hook the rest of the app
     * uses. Showing a button that leads to a 403 is worse than showing nothing.
     */
    quick_actions: ({ data }) => {
        const { hasPerm } = usePermission();
        const { props } = usePage();
        const storeSlug = props.store?.slug;

        const icons = {
            sale: ShoppingCart,
            expense: Wallet,
            customer: UserPlus,
            product: Package,
        };

        const routes = {
            sale: 'store.pos',
            expense: 'store.expenses.index',
            customer: 'store.parties.index',
            product: 'store.inventory.index',
        };

        const actions = (data.actions || []).filter((action) => {
            const [group] = action.permission.split('.');
            return hasPerm(action.permission) || hasPerm(group);
        });

        if (!actions.length) return <Empty>No quick actions available.</Empty>;

        const href = (key) => {
            try {
                return route(routes[key], { store_slug: storeSlug });
            } catch {
                // A route that has been renamed should cost one button, not the card.
                return null;
            }
        };

        return (
            <div className="grid h-full grid-cols-2 content-center gap-2 sm:grid-cols-4">
                {actions.map((action) => {
                    const Icon = icons[action.key] || Plus;
                    const target = href(action.key);
                    if (!target) return null;

                    return (
                        <Link
                            key={action.key}
                            href={target}
                            className="flex min-h-control-lg flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-app px-2 py-3 text-center transition-colors hover:bg-interactive-hover"
                        >
                            <Icon className="h-4 w-4 text-brand-500" aria-hidden="true" />
                            <span className="text-xs font-medium leading-tight text-ink">{action.label}</span>
                        </Link>
                    );
                })}
            </div>
        );
    },
};

/**
 * Render one card's body.
 *
 * The three states — loading, failed, ready — are handled here rather than in
 * every renderer, so a new widget only has to describe its happy path.
 */
export function WidgetBody({ id, state }) {
    if (!state) {
        return (
            <div className="flex h-full flex-col justify-center gap-2" aria-hidden="true">
                <div className="h-7 w-2/3 animate-pulse rounded-lg bg-sunken" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-sunken" />
            </div>
        );
    }

    if (!state.ok) {
        return <Empty>{state.error || 'This card could not be loaded.'}</Empty>;
    }

    const Renderer = renderers[id];

    if (!Renderer) {
        return <Empty>Nothing to show yet.</Empty>;
    }

    return <Renderer data={state.data || {}} />;
}

export const hasRenderer = (id) => Boolean(renderers[id]);
