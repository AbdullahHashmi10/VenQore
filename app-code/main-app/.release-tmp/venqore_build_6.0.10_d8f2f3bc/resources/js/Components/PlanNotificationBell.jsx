import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

import { vq } from '@/theme/runtime';
/**
 * PlanNotificationBell
 *
 * Self-contained plan-change notification bell for store owners and admins.
 * Polls for unread plan-change notifications and shows a dropdown inbox.
 *
 * Usage: <PlanNotificationBell storeSlug={store_slug} />
 */
export default function PlanNotificationBell({ storeSlug }) {
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const ref = useRef(null);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const typeConfig = {
        upgrade:        { icon: '⬆️', color: vq.green[500] },
        downgrade:      { icon: '⬇️', color: vq.red[500] },
        limit_increase: { icon: '↑',  color: vq.green[500], style: { fontWeight:900, color:vq.green[500] } },
        limit_decrease: { icon: '↓',  color: vq.red[500], style: { fontWeight:900, color:vq.red[500] } },
        feature_added:  { icon: '✓',  color: vq.green[500] },
        feature_removed:{ icon: '✗',  color: vq.red[500] },
        extension:      { icon: '📅', color: vq.indigo[500] },
        expiry_warning: { icon: '⚠️', color: vq.amber[500] },
        manual_override:{ icon: '🔧', color: vq.violet[500] },
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/s/${storeSlug}/notifications/plan/unread`, { _skipGlobalErrorHandler: true });
            setNotifications(res.data);
        } catch (e) {
            // Silent fail — bell is non-critical
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [storeSlug]);

    // Close on click outside
    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markRead = async (id) => {
        try {
            await axios.post(`/s/${storeSlug}/notifications/plan/${id}/read`, {}, { _skipGlobalErrorHandler: true });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch {}
    };

    const markAllRead = async () => {
        try {
            await axios.post(`/s/${storeSlug}/notifications/plan/mark-all-read`, {}, { _skipGlobalErrorHandler: true });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch {}
    };

    return (
        <div ref={ref} style={{ position:'relative', display:'inline-flex' }}>
            {/* Bell Button */}
            <button
                onClick={() => { setOpen(o => !o); if (!open) fetchNotifications(); }}
                style={{
                    position:'relative',
                    background: open ? 'rgba(99,102,241,0.15)' : 'transparent',
                    border:'none',
                    padding:'8px',
                    borderRadius:10,
                    cursor:'pointer',
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center',
                    transition:'background 0.15s',
                    color: vq.slate[400],
                    fontSize:20,
                }}
                title="Plan notifications"
                aria-label="Plan notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position:'absolute', top:4, right:4,
                        background:vq.red[500], color:'#fff',
                        fontSize:10, fontWeight:800,
                        borderRadius:99, padding:'1px 5px',
                        minWidth:16, textAlign:'center',
                        lineHeight:'16px', height:16,
                        boxShadow:'0 2px 6px rgba(239,68,68,0.5)',
                    }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div style={{
                    position:'absolute', top:'calc(100% + 8px)', right:0,
                    width:380, maxHeight:460,
                    background:vq.slate[900],
                    border:'1px solid #1e293b',
                    borderRadius:14,
                    boxShadow:'0 20px 60px rgba(0,0,0,0.5)',
                    zIndex:9999,
                    overflow:'hidden',
                    display:'flex',
                    flexDirection:'column',
                }}>
                    {/* Header */}
                    <div style={{
                        padding:'14px 16px',
                        borderBottom:'1px solid #1e293b',
                        display:'flex',
                        justifyContent:'space-between',
                        alignItems:'center',
                    }}>
                        <div>
                            <div style={{ fontWeight:700, color:vq.slate[100], fontSize:14 }}>Plan Updates</div>
                            <div style={{ fontSize:11, color:vq.slate[500] }}>Changes applied to your account</div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{ background:'none', border:'none', color:vq.indigo[500], fontSize:12, cursor:'pointer', fontWeight:700 }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div style={{ overflowY:'auto', flex:1 }}>
                        {loading && notifications.length === 0 ? (
                            <div style={{ padding:'32px', textAlign:'center', color:vq.slate[600], fontSize:13 }}>Loading…</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding:'32px', textAlign:'center', color:vq.slate[600], fontSize:13 }}>
                                <div style={{ fontSize:28, marginBottom:8 }}>✓</div>
                                No plan notifications yet.
                            </div>
                        ) : notifications.map(n => {
                            const tc = typeConfig[n.type] || { icon:'ℹ', color:vq.indigo[500] };
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => !n.is_read && markRead(n.id)}
                                    style={{
                                        padding:'12px 16px',
                                        borderBottom:'1px solid #131c2e',
                                        display:'flex',
                                        gap:12,
                                        background: n.is_read ? 'transparent' : vq.slate[800],
                                        cursor: n.is_read ? 'default' : 'pointer',
                                        transition:'background 0.1s',
                                    }}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width:34, height:34, borderRadius:99,
                                        background: tc.color + '22',
                                        display:'flex', alignItems:'center', justifyContent:'center',
                                        flexShrink:0, fontSize:16,
                                    }}>
                                        {tc.icon}
                                    </div>
                                    {/* Content */}
                                    <div style={{ flex:1, minWidth:0 }}>
                                        <div style={{
                                            fontSize:13, fontWeight: n.is_read ? 500 : 700,
                                            color: n.is_read ? vq.slate[400] : vq.slate[100],
                                            lineHeight:1.3, marginBottom:2,
                                        }}>
                                            {n.title}
                                        </div>
                                        <div style={{ fontSize:12, color:vq.slate[500], lineHeight:1.4 }}>
                                            {n.message}
                                        </div>
                                        <div style={{ fontSize:10, color:vq.slate[600], marginTop:4 }}>
                                            {new Date(n.created_at).toLocaleDateString('en', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                                        </div>
                                    </div>
                                    {/* Unread dot */}
                                    {!n.is_read && (
                                        <div style={{ width:8, height:8, borderRadius:'50%', background:vq.indigo[500], flexShrink:0, marginTop:4 }} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
