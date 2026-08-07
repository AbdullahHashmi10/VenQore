import React from 'react';
import { router, usePage } from '@inertiajs/react';
import { Eye, AlertTriangle, LogOut } from 'lucide-react';

/**
 * ImpersonationBanner — Layer 3 of the 3-Layer Safety Protocol
 *
 * Shown at the top of every page when a Platform Owner is impersonating a store user.
 * Clicking "Exit" POSTs to /admin/impersonate/end which restores the Platform Owner session.
 *
 * Auto-mounted in OneGlanceLayout — no manual import needed anywhere else.
 */
export default function ImpersonationBanner() {
    const { impersonation } = usePage().props;

    if (!impersonation?.active) return null;

    function exit() {
        router.post(impersonation.exit_url);
    }

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
            background: 'linear-gradient(135deg, #7c3aed, #dc2626)',
            padding: '10px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 16,
            boxShadow: '0 2px 20px rgba(220,38,38,0.4)',
            animation: 'slideDown 0.3s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Eye size={14} color="#fff" />
                </div>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <AlertTriangle size={13} />
                        IMPERSONATION MODE — READ ONLY
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
                        Viewing as <strong>{impersonation.target_name}</strong> ({impersonation.target_email}) · All write operations are blocked
                    </div>
                </div>
            </div>

            <button
                onClick={exit}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 16px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'background 0.15s', flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
            >
                <LogOut size={13} /> Exit Impersonation
            </button>

            <style>{`
                @keyframes slideDown {
                    from { transform: translateY(-100%); opacity: 0; }
                    to   { transform: translateY(0);     opacity: 1; }
                }
            `}</style>
        </div>
    );
}
