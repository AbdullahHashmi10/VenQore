import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell';
import {
    useT, PageHeader, Panel, Badge, Button,
    Input, Drawer, Field, Select, EmptyState
} from '@/Platform/ui';
import { BRAND } from '@/Platform/theme';
import {
    Ticket, Plus, CheckCircle, XCircle, Clock,
    Tag, Percent, DollarSign, Calendar, AlertCircle
} from 'lucide-react';

// ── Coupon List Entry ─────────────────────────────────────────────────────────

function CouponRow({ coupon, i, t, toggle }) {
    const isValid = coupon.is_active &&
        (!coupon.valid_until || new Date(coupon.valid_until) > new Date()) &&
        (!coupon.max_uses || coupon.used_count < coupon.max_uses);

    return (
        <tr
            className="vq-row"
            style={{ borderBottom: `1px solid ${t.rowBorder}` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = t.hover; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14.5, color: t.ink, letterSpacing: '0.04em' }}>
                    {coupon.code}
                </div>
                <div style={{ fontSize: 12, color: t.muted, marginTop: 2 }}>{coupon.name}</div>
            </td>

            <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: t.ink, fontWeight: 700, fontSize: 13.5 }}>
                {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `$${coupon.discount_value}`}
                {coupon.max_discount && (
                    <span style={{ fontSize: 11.5, color: t.muted, fontWeight: 500, marginLeft: 4 }}>
                        (max ${coupon.max_discount})
                    </span>
                )}
            </td>

            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                <Badge color={coupon.applies_to === 'all' ? BRAND.indigo : BRAND.amber} tone="soft">
                    {coupon.applies_to}
                </Badge>
            </td>

            <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: t.sub, fontSize: 13, fontFamily: 'monospace' }}>
                <strong style={{ color: t.ink }}>{coupon.used_count}</strong> / {coupon.max_uses ?? '∞'}
            </td>

            <td style={{ padding: '14px 18px', verticalAlign: 'middle', color: t.sub, fontSize: 12 }}>
                <div>{coupon.valid_from ? new Date(coupon.valid_from).toLocaleDateString() : 'Now'}</div>
                <div style={{ color: t.muted }}>
                    {coupon.valid_until ? `→ ${new Date(coupon.valid_until).toLocaleDateString()}` : 'Perpetual (No End)'}
                </div>
            </td>

            <td style={{ padding: '14px 18px', verticalAlign: 'middle' }}>
                <Badge color={isValid ? BRAND.emerald : BRAND.rose} tone="soft">
                    {isValid ? 'Valid' : 'Expired / Limit'}
                </Badge>
            </td>

            <td style={{ padding: '14px 18px', verticalAlign: 'middle', textAlign: 'right' }}>
                <Button
                    size="sm"
                    variant={coupon.is_active ? 'secondary' : 'ghost'}
                    onClick={() => toggle(coupon)}
                    style={{
                        color: coupon.is_active ? BRAND.emerald : t.muted,
                        borderColor: coupon.is_active ? `${BRAND.emerald}44` : t.border,
                    }}
                >
                    {coupon.is_active ? 'Active' : 'Inactive'}
                </Button>
            </td>
        </tr>
    );
}

// ── New Coupon Drawer ─────────────────────────────────────────────────────────

function CouponDrawer({ open, onClose, plans }) {
    const t = useT();
    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        max_discount: '',
        applies_to: 'all',
        platform_id: '',
        max_uses: '',
        max_uses_per_user: 1,
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
        plan_ids: [],
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('platform.coupons.store'), {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    return (
        <Drawer
            open={open}
            onClose={onClose}
            title="Create Coupon"
            subtitle="Issue a new promotional code for subscriptions or lifetime licenses"
            width={520}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={submit}
                        icon={Ticket}
                        disabled={processing || !data.code || !data.discount_value}
                    >
                        {processing ? 'Creating…' : 'Create Coupon'}
                    </Button>
                </>
            }
        >
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Coupon Code" hint="Auto-uppercased" error={errors.code}>
                        <Input
                            value={data.code}
                            onChange={(e) => setData('code', e.target.value.toUpperCase())}
                            placeholder="e.g. SUMMER50"
                        />
                    </Field>
                    <Field label="Display Name" error={errors.name}>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Summer Special 50%"
                        />
                    </Field>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Discount Type" error={errors.discount_type}>
                        <Select
                            value={data.discount_type}
                            onChange={(e) => setData('discount_type', e.target.value)}
                            options={[
                                { value: 'percentage', label: 'Percentage (%)' },
                                { value: 'fixed', label: 'Fixed Amount ($)' },
                            ]}
                        />
                    </Field>
                    <Field label={data.discount_type === 'percentage' ? 'Discount %' : 'Discount $'} error={errors.discount_value}>
                        <Input
                            type="number"
                            step="0.01"
                            value={data.discount_value}
                            onChange={(e) => setData('discount_value', e.target.value)}
                            placeholder={data.discount_type === 'percentage' ? '25' : '10.00'}
                        />
                    </Field>
                </div>

                {data.discount_type === 'percentage' && (
                    <Field label="Maximum Cap (USD)" hint="Optional ceiling on discounted savings" error={errors.max_discount}>
                        <Input
                            type="number"
                            step="0.01"
                            value={data.max_discount}
                            onChange={(e) => setData('max_discount', e.target.value)}
                            placeholder="e.g. 50.00 or leave blank"
                        />
                    </Field>
                )}

                <Field label="Applicable Products" error={errors.applies_to}>
                    <Select
                        value={data.applies_to}
                        onChange={(e) => setData('applies_to', e.target.value)}
                        options={[
                            { value: 'all', label: 'All Plans & Products' },
                            { value: 'subscription', label: 'Subscriptions Only' },
                            { value: 'ltd', label: 'Lifetime Deals (LTD) Only' },
                            { value: 'specific_plans', label: 'Specific Plans (Selected below)' },
                        ]}
                    />
                </Field>

                {data.applies_to === 'specific_plans' && (
                    <Field label="Restrict to Selected Plans" error={errors.plan_ids}>
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            background: t.inputBg,
                            border: `1px solid ${t.border}`,
                            borderRadius: 12,
                            padding: 12,
                            maxHeight: 180,
                            overflowY: 'auto',
                        }}>
                            {plans.map((p) => (
                                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, color: t.ink, fontSize: 13, cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={data.plan_ids.includes(p.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setData('plan_ids', [...data.plan_ids, p.id]);
                                            else setData('plan_ids', data.plan_ids.filter((id) => id !== p.id));
                                        }}
                                        style={{ accentColor: BRAND.indigo }}
                                    />
                                    <span>{p.platform?.name} – {p.name}</span>
                                </label>
                            ))}
                        </div>
                    </Field>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Max Total Uses" hint="Leave blank for infinite" error={errors.max_uses}>
                        <Input
                            type="number"
                            value={data.max_uses}
                            onChange={(e) => setData('max_uses', e.target.value)}
                            placeholder="e.g. 500"
                        />
                    </Field>
                    <Field label="Max Per User" error={errors.max_uses_per_user}>
                        <Input
                            type="number"
                            value={data.max_uses_per_user}
                            onChange={(e) => setData('max_uses_per_user', +e.target.value)}
                        />
                    </Field>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Valid From" error={errors.valid_from}>
                        <Input
                            type="date"
                            value={data.valid_from}
                            onChange={(e) => setData('valid_from', e.target.value)}
                        />
                    </Field>
                    <Field label="Valid Until" hint="Leave blank for perpetual" error={errors.valid_until}>
                        <Input
                            type="date"
                            value={data.valid_until}
                            onChange={(e) => setData('valid_until', e.target.value)}
                        />
                    </Field>
                </div>
            </form>
        </Drawer>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CouponsIndex({ coupons = [], plans = [] }) {
    const t = useT();
    const [showForm, setShowForm] = useState(false);

    const toggle = (coupon) => {
        router.put(route('platform.coupons.update', { coupon: coupon.id }), { is_active: !coupon.is_active }, {
            preserveScroll: true,
        });
    };

    const activeCount = coupons.filter((c) => c.is_active).length;
    const totalRedemptions = coupons.reduce((s, c) => s + (c.redemptions_count || c.used_count || 0), 0);
    const expiringSoon = coupons.filter((c) => c.valid_until && new Date(c.valid_until) < new Date(Date.now() + 14 * 86400000)).length;

    return (
        <OneGlanceLayout title="Coupon Management" mode="admin" activeMenu="Coupons">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <PageHeader
                    icon={Ticket}
                    accent={BRAND.indigo}
                    title="Coupon Management"
                    subtitle="Create and manage discount codes for subscriptions, invoices, and lifetime deals."
                    actions={
                        <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
                            New Coupon
                        </Button>
                    }
                />

                {/* KPI stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Total Coupons
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: t.ink, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {coupons.length}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Configured campaigns</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Active Coupons
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.emerald, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {activeCount}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Live for redemption</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Total Redemptions
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.indigo, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {totalRedemptions}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Applied to checkouts</div>
                    </Panel>

                    <Panel pad={16}>
                        <div style={{ fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: t.muted }}>
                            Expiring Soon
                        </div>
                        <div style={{ fontSize: 26, fontWeight: 900, color: BRAND.amber, marginTop: 4, letterSpacing: '-0.02em' }}>
                            {expiringSoon}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Within next 14 days</div>
                    </Panel>
                </div>

                {/* Coupons Table */}
                <Panel pad={0} style={{ overflow: 'hidden' }}>
                    <div className="vq-scroll" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
                            <thead>
                                <tr>
                                    {['Code', 'Discount', 'Applies To', 'Uses', 'Validity', 'Validation', 'Status'].map((h, idx) => (
                                        <th
                                            key={h}
                                            style={{
                                                padding: '12px 18px',
                                                textAlign: idx === 6 ? 'right' : 'left',
                                                color: t.muted,
                                                fontWeight: 800,
                                                fontSize: 11,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.06em',
                                                background: t.panel2,
                                                borderBottom: `1px solid ${t.border}`,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '56px 20px', textAlign: 'center' }}>
                                            <EmptyState
                                                icon={Ticket}
                                                title="No coupons created yet"
                                                message="Create your first promotional discount code to share with potential subscribers."
                                                action={
                                                    <Button variant="primary" icon={Plus} onClick={() => setShowForm(true)}>
                                                        Create Coupon
                                                    </Button>
                                                }
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    coupons.map((c, i) => (
                                        <CouponRow key={c.id} coupon={c} i={i} t={t} toggle={toggle} />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            </div>

            {showForm && (
                <CouponDrawer
                    open={showForm}
                    onClose={() => setShowForm(false)}
                    plans={plans}
                />
            )}
        </OneGlanceLayout>
    );
}
