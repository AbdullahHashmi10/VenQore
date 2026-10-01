import { useRef, useEffect, useCallback } from "react";
import { usePage } from "@inertiajs/react";
const SCRIPT_ID = "cf-turnstile-script";
function loadScript() {
  return new Promise((resolve) => {
    if (window.turnstile) return resolve(window.turnstile);
    let s = document.getElementById(SCRIPT_ID);
    if (!s) {
      s = document.createElement("script");
      s.id = SCRIPT_ID;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }
    s.addEventListener("load", () => resolve(window.turnstile));
    s.addEventListener("error", () => resolve(null));
  });
}
function useTurnstile() {
  const siteKey = usePage()?.props?.turnstile_site_key || "";
  const widgetId = useRef(null);
  const token = useRef(null);
  const waiters = useRef([]);
  const box = useRef(null);
  useEffect(() => {
    if (!siteKey || typeof window === "undefined") return void 0;
    let cancelled = false;
    const el = document.createElement("div");
    el.setAttribute("data-tone-ignore", "");
    el.style.cssText = "position:fixed;right:16px;bottom:16px;z-index:900;";
    document.body.appendChild(el);
    box.current = el;
    loadScript().then((ts) => {
      if (cancelled || !ts) return;
      widgetId.current = ts.render(el, {
        sitekey: siteKey,
        appearance: "interaction-only",
        callback: (t) => {
          token.current = t;
          waiters.current.splice(0).forEach((w) => w(t));
        },
        "expired-callback": () => {
          token.current = null;
        },
        "error-callback": () => {
          token.current = null;
        }
      });
    });
    return () => {
      cancelled = true;
      try {
        if (widgetId.current !== null) window.turnstile?.remove(widgetId.current);
      } catch (e) {
      }
      el.remove();
    };
  }, [siteKey]);
  return useCallback(() => {
    if (!siteKey) return Promise.resolve(null);
    const take = (t) => {
      token.current = null;
      try {
        if (widgetId.current !== null) window.turnstile?.reset(widgetId.current);
      } catch (e) {
      }
      return t;
    };
    if (token.current) return Promise.resolve(take(token.current));
    return new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), 15e3);
      waiters.current.push((t) => {
        clearTimeout(timer);
        resolve(take(t));
      });
    });
  }, [siteKey]);
}
export {
  useTurnstile as u
};
