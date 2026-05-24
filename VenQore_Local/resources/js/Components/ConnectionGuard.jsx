import { useState, useEffect, useCallback } from 'react';

/**
 * ConnectionGuard
 *
 * Wraps any financial form. When offline:
 *   - Shows a red banner
 *   - Disables the submit button via the `locked` prop passed to children
 *
 * Usage:
 *   <ConnectionGuard>
 *     {({ locked }) => (
 *       <button disabled={locked}>Post Sale</button>
 *     )}
 *   </ConnectionGuard>
 */
export default function ConnectionGuard({ children, pingUrl = '/ping' }) {
    const [online, setOnline] = useState(true);
    const [checking, setChecking] = useState(false);

    const checkConnection = useCallback(async () => {
        if (checking) return;
        setChecking(true);
        try {
            const res = await fetch(pingUrl, {
                method: 'GET',
                cache: 'no-store',
                signal: AbortSignal.timeout(4000),
            });
            setOnline(res.ok);
        } catch {
            setOnline(false);
        } finally {
            setChecking(false);
        }
    }, [pingUrl, checking]);

    useEffect(() => {
        // Initial check
        checkConnection();

        // Poll every 10 seconds
        const interval = setInterval(checkConnection, 10_000);

        // Browser online/offline events as a fast signal
        const goOnline = () => checkConnection();
        const goOffline = () => setOnline(false);

        window.addEventListener('online', goOnline);
        window.addEventListener('offline', goOffline);

        return () => {
            clearInterval(interval);
            window.removeEventListener('online', goOnline);
            window.removeEventListener('offline', goOffline);
        };
    }, []);

    return (
        <div>
            {!online && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    background: '#dc2626',
                    color: '#fff',
                    textAlign: 'center',
                    padding: '10px',
                    fontWeight: 'bold',
                    zIndex: 9999,
                }}>
                    ⚠ CONNECTION LOST — Financial transactions are locked.
                    Restore connection to continue.
                </div>
            )}
            {typeof children === 'function'
                ? children({ locked: !online })
                : children
            }
        </div>
    );
}
