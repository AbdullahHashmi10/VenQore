import { useEffect, useRef, useState } from 'react';
import Echo from 'laravel-echo';

// Shared lazily-created Echo (window.Echo if the app already set one; else Reverb when VITE_REVERB_ENABLED=true).
function getEcho() {
  if (typeof window === 'undefined') return null;
  if (window.Echo) return window.Echo;
  if (import.meta.env.VITE_REVERB_ENABLED !== 'true') return null;
  try {
    window.Echo = new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY || 'venqore_chat',
      wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
      wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
      wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
      enabledTransports: ['ws', 'wss'],
    });
    return window.Echo;
  } catch (e) { return null; }
}

/** Returns { live, onEvent wiring }: live=true while the websocket is connected. */
export default function useOnlineOrderEcho(tenantId, enabled, onPlaced) {
  const [live, setLive] = useState(false);
  const cb = useRef(onPlaced);
  cb.current = onPlaced;
  useEffect(() => {
    if (!enabled || !tenantId) return undefined;
    const echo = getEcho();
    if (!echo) { setLive(false); return undefined; }
    const name = `tenant.${tenantId}.orders`;
    let conn = null;
    const sync = () => { try { setLive(echo.connector?.pusher?.connection?.state === 'connected'); } catch (e) { setLive(false); } };
    try {
      echo.private(name).listen('.OnlineOrderPlaced', (e) => cb.current && cb.current(e));
      conn = echo.connector?.pusher?.connection;
      conn?.bind('state_change', sync);
      sync();
    } catch (e) { setLive(false); }
    return () => {
      try { conn?.unbind('state_change', sync); echo.leave(name); } catch (e) { /* ignore */ }
    };
  }, [tenantId, enabled]);
  return live;
}
