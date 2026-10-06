import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/PlatformShell';
import {
    useT, PageHeader, Panel, Badge, Button,
    Input, Field, EmptyState
} from '@/Platform/ui';
import { BRAND } from '@/Platform/theme';
import { Boxes, Plus, Edit2, Database, Shield, Save, X, Layers } from 'lucide-react';

export default function PlatformIndex({ platforms = [] }) {
    const t = useT();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        slug: '',
        is_active: true,
    });

    const startAdd = () => {
        reset();
        setIsAdding(true);
        setEditingId(null);
    };

    const startEdit = (p) => {
        setData({
            name: p.name,
            slug: p.slug,
            is_active: !!p.is_active,
        });
        setEditingId(p.id);
        setIsAdding(false);
    };

    const cancel = () => {
        setIsAdding(false);
        setEditingId(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            put(route('platform.platforms.update', editingId), {
                onSuccess: () => cancel(),
            });
        } else {
            post(route('platform.platforms.store'), {
                onSuccess: () => cancel(),
            });
        }
    };

    return (
        <OneGlanceLayout title="System Platforms" mode="admin" activeMenu="Platforms">
            <Head title="Platform HQ | System Platforms" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <PageHeader
                    icon={Boxes}
                    accent={BRAND.indigo}
                    title="System Platforms"
                    subtitle="Define high-level product platforms (e.g. VenQore Cloud, VenQore On-Prem, Hardware POS)."
                    actions={
                        !isAdding && !editingId ? (
                            <Button variant="primary" icon={Plus} onClick={startAdd}>
                                Add Platform
                            </Button>
                        ) : null
                    }
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 380px)', gap: 24, alignItems: 'start' }}>
                    {/* Platforms list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {platforms.length === 0 ? (
                            <Panel pad={40}>
                                <EmptyState
                                    icon={Database}
                                    title="No platforms defined yet"
                                    message="Establish software platform groupings to categorize plans and license tiers."
                                    action={
                                        <Button variant="primary" icon={Plus} onClick={startAdd}>
                                            Add First Platform
                                        </Button>
                                    }
                                />
                            </Panel>
                        ) : (
                            platforms.map((p) => {
                                const isEditingThis = editingId === p.id;
                                return (
                                    <Panel
                                        key={p.id}
                                        pad={20}
                                        hover
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            border: isEditingThis ? `1px solid ${BRAND.indigo}` : `1px solid ${t.border}`,
                                            background: isEditingThis ? `${BRAND.indigo}10` : t.panel,
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 14,
                                                background: p.is_active ? `${BRAND.emerald}18` : t.inputBg,
                                                color: p.is_active ? BRAND.emerald : t.muted,
                                                border: `1px solid ${p.is_active ? `${BRAND.emerald}33` : t.border}`,
                                                display: 'grid',
                                                placeItems: 'center',
                                                flexShrink: 0,
                                            }}>
                                                <Database size={22} />
                                            </div>

                                            <div>
                                                <div style={{ fontSize: 16, fontWeight: 800, color: t.ink, letterSpacing: '-0.01em' }}>
                                                    {p.name}
                                                </div>
                                                <div style={{ fontSize: 12, fontFamily: 'monospace', color: t.muted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                                    {p.slug}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <Badge color={p.is_active ? BRAND.emerald : BRAND.slate} tone="soft">
                                                {p.is_active ? 'Active' : 'Disabled'}
                                            </Badge>

                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                icon={Edit2}
                                                onClick={() => startEdit(p)}
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </Panel>
                                );
                            })
                        )}
                    </div>

                    {/* Add/Edit Panel */}
                    <div>
                        {isAdding || editingId ? (
                            <Panel pad={24} style={{ position: 'sticky', top: 24 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: t.ink, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {editingId ? <Edit2 size={18} style={{ color: BRAND.indigo }} /> : <Plus size={18} style={{ color: BRAND.emerald }} />}
                                        {editingId ? 'Edit Platform' : 'New Platform'}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={cancel}
                                        style={{ background: 'none', border: 'none', color: t.muted, cursor: 'pointer', padding: 4 }}
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <Field label="Platform Name" error={errors.name}>
                                        <Input
                                            value={data.name}
                                            onChange={(e) => {
                                                setData('name', e.target.value);
                                                if (!editingId) {
                                                    setData('slug', e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
                                                }
                                            }}
                                            placeholder="e.g. VenQore Cloud"
                                            required
                                        />
                                    </Field>

                                    <Field label="Identifier Slug" hint="Internal alphanumeric key" error={errors.slug}>
                                        <Input
                                            value={data.slug}
                                            onChange={(e) => setData('slug', e.target.value)}
                                            placeholder="e.g. venqore-cloud"
                                            style={{ fontFamily: 'monospace' }}
                                            required
                                        />
                                    </Field>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px 14px',
                                        background: t.inputBg,
                                        border: `1px solid ${t.border}`,
                                        borderRadius: 12,
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: t.ink }}>Platform Active</div>
                                            <div style={{ fontSize: 11.5, color: t.muted }}>Available for assigning plans</div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(e) => setData('is_active', e.target.checked)}
                                            style={{ accentColor: BRAND.indigo, width: 18, height: 18, cursor: 'pointer' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            icon={Save}
                                            disabled={processing}
                                            style={{ flex: 1 }}
                                        >
                                            {editingId ? 'Update' : 'Save Platform'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={cancel}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </Panel>
                        ) : (
                            <Panel pad={32} style={{ textAlign: 'center', borderStyle: 'dashed' }}>
                                <Shield size={36} style={{ color: t.muted, margin: '0 auto 12px', opacity: 0.6 }} />
                                <div style={{ fontSize: 14, fontWeight: 700, color: t.ink }}>Select a Platform</div>
                                <div style={{ fontSize: 12.5, color: t.muted, marginTop: 4 }}>
                                    Click "Edit" on any platform to adjust parameters, or click "+ Add Platform" to establish a new one.
                                </div>
                            </Panel>
                        )}
                    </div>
                </div>
            </div>
        </OneGlanceLayout>
    );
}
