import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

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
        upgrade:        { icon: '⬆️', color: '#22c55e' },
        downgrade:      { icon: '⬇️', color: '#ef4444' },
        limit_increase: { icon: '↑',  color: '#22c55e', style: { fontWeight:900, color:'#22c55e' } },
        limit_decrease: { icon: '↓',  color: '#ef4444', style: { fontWeight:900, color:'#ef4444' } },
        feature_added:  { icon: '✓',  color: '#22c55e' },
        feature_removed:{ icon: '✗',  color: '#ef4444' },
        extension:      { icon: '📅', color: '#6366f1' },
        expiry_warning: { icon: '⚠️', color: '#f59e0b' },
        manual_override:{ icon: '🔧', color: '#8b5cf6' },
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/s/${storeSlug}/notifications/plan/unread`);
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
        await axios.post(`/s/${storeSlug}/notifications/plan/${id}/read`);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    };

    const markAllRead = async () => {
        await axios.post(`/s/${storeSlug}/notifications/plan/mark-all-read`);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
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
                    color: '#94a3b8',
                    fontSize:20,
                }}
                title="Plan notifications"
                aria-label="Plan notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position:'absolute', top:4, right:4,
                        background:'#ef4444', color:'#fff',
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
                    background:'#0f172a',
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
                            <div style={{ fontWeight:700, color:'#f1f5f9', fontSize:14 }}>Plan Updates</div>
                            <div style={{ fontSize:11, color:'#64748b' }}>Changes applied to your account</div>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                style={{ background:'none', border:'none', color:'#6366f1', fontSize:12, cursor:'pointer', fontWeight:700 }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div style={{ overflowY:'auto', flex:1 }}>
                        {loading && notifications.length === 0 ? (
                            <div style={{ padding:'32px', textAlign:'center', color:'#475569', fontSize:13 }}>Loading…</div>
                        ) : notifications.length === 0 ? (
                            <div style={{ padding:'32px', textAlign:'center', color:'#475569', fontSize:13 }}>
                                <div style={{ fontSize:28, marginBottom:8 }}>✓</div>
                                No plan notifications yet.
                            </div>
                        ) : notifications.map(n => {
                            const tc = typeConfig[n.type] || { icon:'ℹ', color:'#6366f1' };
                            return (
                                <div
                                    key={n.id}
                                    onClick={() => !n.is_read && markRead(n.id)}
                                    style={{
                                        padding:'12px 16px',
                                        borderBottom:'1px solid #131c2e',
                                        display:'flex',
                                        gap:12,
                                        background: n.is_read ? 'transparent' : '#1e293b33',
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
                                            color: n.is_read ? '#94a3b8' : '#f1f5f9',
                                            lineHeight:1.3, marginBottom:2,
                                        }}>
                                            {n.title}
                                        </div>
                                        <div style={{ fontSize:12, color:'#64748b', lineHeight:1.4 }}>
                                            {n.message}
                                        </div>
                                        <div style={{ fontSize:10, color:'#475569', marginTop:4 }}>
                                            {new Date(n.created_at).toLocaleDateString('en', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                                        </div>
                                    </div>
                                    {/* Unread dot */}
                                    {!n.is_read && (
                                        <div style={{ width:8, height:8, borderRadius:'50%', background:'#6366f1', flexShrink:0, marginTop:4 }} />
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
