import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
    Calendar, Users, Phone, User, Clock, Check, X,
    Plus, AlertCircle, ArrowRight, UserCheck, XCircle,
} from 'lucide-react';

export default function ReservationModal({ storeSlug, positions = [], onClose }) {
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('list'); // 'list' | 'new'
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        customerName: '',
        phone: '',
        partySize: '2',
        reservedAt: '',
        positionId: '',
        isWaitlist: false,
        notes: '',
    });

    const r = useCallback((name, params = {}) => route(name, { store_slug: storeSlug, ...params }), [storeSlug]);

    const loadReservations = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(r('store.reservations.list'));
            setReservations(data?.reservations || []);
        } catch (err) {
            console.error('Failed to load reservations:', err);
        } finally {
            setLoading(false);
        }
    }, [r]);

    useEffect(() => {
        loadReservations();
    }, [loadReservations]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.customerName.trim()) return;
        setSaving(true);
        try {
            await axios.post(r('store.reservations.store'), {
                customer_name: form.customerName.trim(),
                phone: form.phone.trim() || null,
                party_size: Number(form.partySize) || 2,
                reserved_at: form.isWaitlist ? null : form.reservedAt || null,
                position_id: form.positionId ? Number(form.positionId) : null,
                status: form.isWaitlist ? 'waiting' : 'booked',
                notes: form.notes.trim() || null,
            });
            setTab('list');
            setForm({
                customerName: '',
                phone: '',
                partySize: '2',
                reservedAt: '',
                positionId: '',
                isWaitlist: false,
                notes: '',
            });
            await loadReservations();
        } catch (err) {
            console.error('Failed to create reservation:', err);
        } finally {
            setSaving(false);
        }
    };

    const handleSeat = async (id, positionId = null) => {
        try {
            await axios.post(r('store.reservations.seat', { id }), { position_id: positionId });
            await loadReservations();
        } catch (err) {
            console.error('Failed to seat reservation:', err);
        }
    };

    const handleCancel = async (id) => {
        try {
            await axios.post(r('store.reservations.cancel', { id }), { status: 'cancelled' });
            await loadReservations();
        } catch (err) {
            console.error('Failed to cancel reservation:', err);
        }
    };

    const activeList = reservations.filter(r => r.status === 'booked' || r.status === 'waiting');

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px',
        }} onClick={onClose}>
            <div style={{
                background: '#ffffff', borderRadius: '16px', padding: '24px',
                width: '100%', maxWidth: '640px', maxHeight: '85vh', overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid #e4e4e7',
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={20} className="text-brand-600" />
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#18181b', margin: 0 }}>
                            Reservations & Waitlist
                        </h2>
                    </div>
                    <button type="button" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                        <X size={20} className="text-zinc-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                    <button
                        type="button"
                        onClick={() => setTab('list')}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none',
                            background: tab === 'list' ? '#18181b' : '#f4f4f5',
                            color: tab === 'list' ? '#ffffff' : '#71717a',
                            fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                        }}
                    >
                        Active Queue ({activeList.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('new')}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', border: 'none',
                            background: tab === 'new' ? '#18181b' : '#f4f4f5',
                            color: tab === 'new' ? '#ffffff' : '#71717a',
                            fontWeight: 700, fontSize: '13px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px',
                        }}
                    >
                        <Plus size={14} /> New Reservation / Waitlist
                    </button>
                </div>

                {tab === 'new' ? (
                    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <label style={{ flex: 1 }}>
                                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#71717a', marginBottom: '4px' }}>Guest Name *</span>
                                <input
                                    required
                                    value={form.customerName}
                                    onChange={e => setForm({ ...form, customerName: e.target.value })}
                                    placeholder="Guest or company name"
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '14px' }}
                                />
                            </label>
                            <label style={{ width: '160px' }}>
                                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#71717a', marginBottom: '4px' }}>Phone</span>
                                <input
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    placeholder="Contact number"
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '14px' }}
                                />
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <label style={{ width: '120px' }}>
                                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#71717a', marginBottom: '4px' }}>Party Size</span>
                                <input
                                    type="number"
                                    min="1"
                                    value={form.partySize}
                                    onChange={e => setForm({ ...form, partySize: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '14px' }}
                                />
                            </label>

                            <label style={{ flex: 1 }}>
                                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#71717a', marginBottom: '4px' }}>Assign Table (Optional)</span>
                                <select
                                    value={form.positionId}
                                    onChange={e => setForm({ ...form, positionId: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '14px' }}
                                >
                                    <option value="">Any available table</option>
                                    {positions.map(p => (
                                        <option key={p.id} value={p.id}>{p.label || p.code} ({p.capacity} seats)</option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                                <input
                                    type="checkbox"
                                    checked={form.isWaitlist}
                                    onChange={e => setForm({ ...form, isWaitlist: e.target.checked })}
                                />
                                <span>Walk-in Waitlist (Party is waiting right now)</span>
                            </label>
                        </div>

                        {!form.isWaitlist && (
                            <label>
                                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#71717a', marginBottom: '4px' }}>Reservation Time</span>
                                <input
                                    type="datetime-local"
                                    value={form.reservedAt}
                                    onChange={e => setForm({ ...form, reservedAt: e.target.value })}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '14px' }}
                                />
                            </label>
                        )}

                        <label>
                            <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#71717a', marginBottom: '4px' }}>Notes & Requests</span>
                            <textarea
                                value={form.notes}
                                onChange={e => setForm({ ...form, notes: e.target.value })}
                                placeholder="High chair, window seat, anniversary..."
                                rows={2}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d4d4d8', fontSize: '14px' }}
                            />
                        </label>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                            <button
                                type="button"
                                onClick={() => setTab('list')}
                                style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e4e4e7', background: '#f4f4f5', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#18181b', color: '#ffffff', fontWeight: 700, cursor: 'pointer' }}
                            >
                                {saving ? 'Saving...' : 'Create Entry'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#71717a' }}>Loading queue...</div>
                        ) : activeList.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 16px', color: '#a1a1aa' }}>
                                <Calendar size={36} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                                <p style={{ margin: 0, fontWeight: 600 }}>No active reservations or waiting guests today.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {activeList.map(res => (
                                    <div
                                        key={res.id}
                                        style={{
                                            padding: '14px', borderRadius: '10px',
                                            border: '1px solid #e4e4e7', background: '#fafafa',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <b style={{ fontSize: '15px', color: '#18181b' }}>{res.customer_name}</b>
                                                <span style={{
                                                    fontSize: '11px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                                                    background: res.status === 'waiting' ? '#fef3c7' : '#dbeafe',
                                                    color: res.status === 'waiting' ? '#d97706' : '#2563eb',
                                                    textTransform: 'uppercase',
                                                }}>
                                                    {res.status === 'waiting' ? 'Waiting' : 'Booked'}
                                                </span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#71717a', marginTop: '4px' }}>
                                                <span>👥 {res.party_size} guests</span>
                                                {res.time_label && <span>🕒 {res.time_label}</span>}
                                                {res.table_name && <span>🪑 {res.table_name}</span>}
                                                {res.phone && <span>📞 {res.phone}</span>}
                                            </div>

                                            {res.notes && (
                                                <div style={{ fontSize: '12px', color: '#52525b', marginTop: '4px', fontStyle: 'italic' }}>
                                                    "{res.notes}"
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleSeat(res.id, res.position_id)}
                                                style={{
                                                    padding: '8px 12px', borderRadius: '6px', border: 'none',
                                                    background: '#10b981', color: '#ffffff', fontWeight: 700,
                                                    fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                }}
                                            >
                                                <UserCheck size={14} /> Seat
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleCancel(res.id)}
                                                style={{
                                                    padding: '8px', borderRadius: '6px', border: '1px solid #e4e4e7',
                                                    background: '#ffffff', color: '#ef4444', cursor: 'pointer',
                                                }}
                                                title="Cancel reservation"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
