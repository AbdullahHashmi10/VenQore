import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import OneGlanceLayout from '@/Layouts/OneGlanceLayout';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Sparkles,
    User,
    Calendar,
    Clock,
    Wrench,
    MapPin,
    DollarSign,
    CheckCircle2,
    Layers,
    Shield
} from 'lucide-react';
import { formatCurrency } from '@/Utils/format';
import { useTermText } from '@/lib/terms';

const PRIORITIES = [
    { key: 'low', label: 'Low' },
    { key: 'normal', label: 'Normal' },
    { key: 'high', label: 'High' },
    { key: 'urgent', label: 'Urgent' },
];

const emptyLine = () => ({ kind: 'service', product_id: '', description: '', quantity: 1, unit_price: 0 });

export default function CreateServiceJob({ parties = [], services = [], employees = [], tools = [] }) {
    const tt = useTermText();
    const { store } = usePage().props;
    const storeSlug = store?.slug || (typeof window !== 'undefined' ? window.location.pathname.split('/')[2] : '');

    const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const initialPartyId = params?.get('party_id') || '';
    const initialTitle = params?.get('title') || '';
    const initialTotal = parseFloat(params?.get('estimated_total') || '0') || 0;
    const initialSite = params?.get('site_address') || '';

    const { data, setData, post, processing, errors } = useForm({
        party_id: initialPartyId,
        title: initialTitle,
        description: params?.get('description') || '',
        site_address: initialSite,
        priority: params?.get('priority') || 'normal',
        technician_id: params?.get('technician_id') || '',
        scheduled_for: params?.get('scheduled_for') || new Date().toISOString().split('T')[0],
        scheduled_start_at: params?.get('scheduled_start_at') || '',
        scheduled_end_at: params?.get('scheduled_end_at') || '',
        estimated_total: initialTotal,
        lines: [emptyLine()],
        tools: [], // array of { id, quantity }
    });

    const [selectedServiceId, setSelectedServiceId] = useState('');

    const updateLine = (index, patch) => {
        const lines = data.lines.map((line, i) => (i === index ? { ...line, ...patch } : line));
        const total = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);
        setData((prev) => ({
            ...prev,
            lines,
            estimated_total: total,
        }));
    };

    const addLine = () => setData('lines', [...data.lines, emptyLine()]);
    const removeLine = (index) => {
        const lines = data.lines.filter((_, i) => i !== index);
        const total = lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);
        setData((prev) => ({
            ...prev,
            lines: lines.length > 0 ? lines : [emptyLine()],
            estimated_total: total,
        }));
    };

    // When selecting a catalog service from the quick dropdown
    const handlePickService = (svcId) => {
        setSelectedServiceId(svcId);
        if (!svcId) return;

        const svc = services.find((s) => String(s.id) === String(svcId));
        if (!svc) return;

        // Auto set title if blank
        const updatedTitle = data.title ? data.title : svc.name;

        // Auto append or replace first line
        const newLine = {
            kind: 'service',
            product_id: svc.id,
            description: svc.name,
            quantity: 1,
            unit_price: parseFloat(svc.price) || 0,
        };

        const existingLines = data.lines.filter((l) => l.description.trim() !== '');
        const updatedLines = [...existingLines, newLine];
        const total = updatedLines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);

        // Auto-check required tools for this service
        let updatedTools = [...data.tools];
        if (svc.required_tools && Array.isArray(svc.required_tools)) {
            svc.required_tools.forEach((reqTool) => {
                if (!updatedTools.some((t) => t.id === reqTool.id)) {
                    updatedTools.push({ id: reqTool.id, quantity: 1, name: reqTool.name });
                }
            });
        }

        setData((prev) => ({
            ...prev,
            title: updatedTitle,
            lines: updatedLines,
            estimated_total: total,
            tools: updatedTools,
        }));
    };

    // Tool toggle
    const toggleTool = (tool) => {
        const exists = data.tools.some((t) => t.id === tool.id);
        let updatedTools;
        if (exists) {
            updatedTools = data.tools.filter((t) => t.id !== tool.id);
        } else {
            updatedTools = [...data.tools, { id: tool.id, quantity: 1, name: tool.name }];
        }
        setData('tools', updatedTools);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('store.service-jobs.store', { store_slug: storeSlug }));
    };

    const inputClass =
        'w-full rounded-lg border border-line bg-app px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent';
    const labelClass = 'mb-1.5 block text-2xs font-semibold uppercase tracking-widest text-ink-muted';

    const subtotal = data.lines.reduce((sum, l) => sum + (Number(l.quantity) || 0) * (Number(l.unit_price) || 0), 0);

    return (
        <OneGlanceLayout title={tt('New Service Job')} activeMenu="Sell">
            <Head title={tt('New Service Job & Work Order')} />

            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
                <Link
                    href={route('store.service-jobs.index', { store_slug: storeSlug })}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-ink transition-colors"
                >
                    <ArrowLeft size={14} />
                    {tt('Back to Work Orders')}
                </Link>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
                            {tt('Create Service Work Order')}
                        </h1>
                        <p className="mt-1 text-xs text-ink-secondary">
                            {tt('Define the customer scope, dispatch a technician, and assign required equipment.')}
                        </p>
                    </div>

                    {services.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-2xs font-semibold uppercase tracking-wider text-ink-muted">
                                Catalog Preset:
                            </span>
                            <select
                                value={selectedServiceId}
                                onChange={(e) => handlePickService(e.target.value)}
                                className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:border-accent focus:outline-none"
                            >
                                <option value="">{tt('+ Choose Catalog Service...')}</option>
                                {services.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name} ({formatCurrency(s.price || 0)})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <form onSubmit={submit} className="mt-6 space-y-6">
                    {/* Customer & Priority */}
                    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4">
                            <User size={16} className="text-accent-text" />
                            {tt('Customer & Order Details')}
                        </h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label className={labelClass}>{tt('Customer')} *</label>
                                <select
                                    required
                                    value={data.party_id}
                                    onChange={(e) => {
                                        setData('party_id', e.target.value);
                                        const party = parties.find((p) => String(p.id) === String(e.target.value));
                                        if (party?.address && !data.site_address) {
                                            setData((prev) => ({ ...prev, party_id: e.target.value, site_address: party.address }));
                                        }
                                    }}
                                    className={inputClass}
                                >
                                    <option value="">{tt('Select a customer...')}</option>
                                    {parties.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} {p.phone ? `(${p.phone})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {errors.party_id && <p className="mt-1 text-xs text-rose-500">{errors.party_id}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>Priority</label>
                                <select
                                    value={data.priority}
                                    onChange={(e) => setData('priority', e.target.value)}
                                    className={inputClass}
                                >
                                    {PRIORITIES.map((p) => (
                                        <option key={p.key} value={p.key}>{p.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-2">
                                <label className={labelClass}>{tt('Job Title / Scope Summary')} *</label>
                                <input
                                    type="text"
                                    required
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Master Bedroom AC Installation & Duct Inspection"
                                    className={inputClass}
                                />
                                {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
                            </div>

                            <div className="sm:col-span-2">
                                <label className={labelClass}>Description & Special Instructions</label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    rows={3}
                                    placeholder={tt('Add any specific instructions, gate codes, or customer requests...')}
                                    className={inputClass}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className={labelClass}>{tt('Site / Service Location Address')}</label>
                                <div className="relative">
                                    <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
                                    <input
                                        type="text"
                                        value={data.site_address}
                                        onChange={(e) => setData('site_address', e.target.value)}
                                        placeholder="Street address for on-site visit..."
                                        className={`${inputClass} pl-9`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dispatch & Scheduling */}
                    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                        <h2 className="text-sm font-semibold text-ink flex items-center gap-2 mb-4">
                            <Calendar size={16} className="text-accent-text" />
                            Dispatch & Scheduling
                        </h2>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div>
                                <label className={labelClass}>{tt('Assigned Technician')}</label>
                                <select
                                    value={data.technician_id}
                                    onChange={(e) => setData('technician_id', e.target.value)}
                                    className={inputClass}
                                >
                                    <option value="">Unassigned Queue</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className={labelClass}>Scheduled Date</label>
                                <input
                                    type="date"
                                    value={data.scheduled_for}
                                    onChange={(e) => setData('scheduled_for', e.target.value)}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Appointment Start Time</label>
                                <input
                                    type="time"
                                    value={data.scheduled_start_at ? data.scheduled_start_at.split('T')[1]?.substring(0, 5) || '' : ''}
                                    onChange={(e) => {
                                        const time = e.target.value;
                                        if (time) {
                                            setData('scheduled_start_at', `${data.scheduled_for}T${time}:00`);
                                        }
                                    }}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Billable Lines */}
                    <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-ink flex items-center gap-2">
                                    <DollarSign size={16} className="text-accent-text" />
                                    Billable Items & Labor
                                </h2>
                                <p className="text-2xs text-ink-muted">{tt('Services, replacement parts, or hourly labor fees.')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={addLine}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-app px-3 py-1.5 text-xs font-semibold text-accent-text hover:bg-sunken transition-colors"
                            >
                                <Plus size={14} />
                                Add Custom Line
                            </button>
                        </div>

                        <div className="space-y-3">
                            {data.lines.map((line, i) => (
                                <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-app p-3">
                                    <select
                                        value={line.kind}
                                        onChange={(e) => updateLine(i, { kind: e.target.value })}
                                        className="h-9 rounded-md border border-line bg-surface px-2.5 text-xs font-semibold text-ink"
                                    >
                                        <option value="service">{tt('Service')}</option>
                                        <option value="part">Part</option>
                                        <option value="ad_hoc">Ad hoc</option>
                                    </select>

                                    <input
                                        type="text"
                                        value={line.description}
                                        onChange={(e) => updateLine(i, { description: e.target.value })}
                                        placeholder={tt('Service item / Part description...')}
                                        className="h-9 flex-1 min-w-[160px] rounded-md border border-line bg-surface px-3 text-xs text-ink placeholder:text-ink-faint"
                                    />

                                    <div className="flex items-center gap-1">
                                        <span className="text-2xs text-ink-muted">Qty</span>
                                        <input
                                            type="number"
                                            min="0.0001"
                                            step="any"
                                            value={line.quantity}
                                            onChange={(e) => updateLine(i, { quantity: e.target.value })}
                                            className="h-9 w-16 rounded-md border border-line bg-surface px-2 text-center text-xs font-medium text-ink"
                                        />
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <span className="text-2xs text-ink-muted">Rate</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="any"
                                            value={line.unit_price}
                                            onChange={(e) => updateLine(i, { unit_price: e.target.value })}
                                            className="h-9 w-24 rounded-md border border-line bg-surface px-2 text-right text-xs font-mono font-medium text-ink"
                                        />
                                    </div>

                                    <div className="w-20 text-right font-mono text-xs font-semibold text-ink">
                                        {formatCurrency((Number(line.quantity) || 0) * (Number(line.unit_price) || 0))}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeLine(i)}
                                        disabled={data.lines.length === 1}
                                        className="h-9 w-9 shrink-0 rounded-md text-ink-muted transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 disabled:opacity-30"
                                    >
                                        <Trash2 size={14} className="mx-auto" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Subtotal Banner */}
                        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm">
                            <span className="font-semibold text-ink-secondary">{tt('Estimated Work Order Total')}</span>
                            <span className="font-mono text-lg font-bold text-ink">{formatCurrency(subtotal)}</span>
                        </div>
                    </div>

                    {/* Tools & Equipment Checklist */}
                    {tools.length > 0 && (
                        <div className="rounded-xl border border-line bg-surface p-5 shadow-sm">
                            <h2 className="text-sm font-semibold text-ink flex items-center gap-2 mb-1">
                                <Wrench size={16} className="text-accent-text" />
                                Tool Checkout & Equipment Needed
                            </h2>
                            <p className="text-2xs text-ink-muted mb-4">
                                Check the tools to automatically reserve & checkout for this dispatch.
                            </p>

                            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                                {tools.map((tool) => {
                                    const isChecked = data.tools.some((t) => t.id === tool.id);
                                    return (
                                        <button
                                            key={tool.id}
                                            type="button"
                                            onClick={() => toggleTool(tool)}
                                            className={`flex items-center justify-between gap-2 rounded-lg border p-2.5 text-left transition-all ${
                                                isChecked
                                                    ? 'border-accent bg-accent-quiet/40 text-ink shadow-xs'
                                                    : 'border-line bg-app text-ink-secondary hover:bg-sunken'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <div
                                                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs ${
                                                        isChecked ? 'bg-accent-fill text-accent-on' : 'border border-line bg-surface'
                                                    }`}
                                                >
                                                    {isChecked ? <CheckCircle2 size={13} /> : null}
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-xs font-semibold text-ink truncate">{tool.name}</p>
                                                    <p className="text-3xs text-ink-muted truncate">{tool.category || 'Tool'}</p>
                                                </div>
                                            </div>
                                            <span className="text-3xs font-medium uppercase text-ink-muted">
                                                {tool.status}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <Link
                            href={route('store.service-jobs.index', { store_slug: storeSlug })}
                            className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-ink-secondary hover:bg-sunken transition-colors"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent-fill px-6 text-sm font-semibold text-accent-on shadow-glow transition-colors duration-normal ease-standard hover:bg-accent-fill-hover disabled:opacity-60"
                        >
                            <CheckCircle2 size={16} />
                            <span>{tt('Create Work Order')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </OneGlanceLayout>
    );
}
