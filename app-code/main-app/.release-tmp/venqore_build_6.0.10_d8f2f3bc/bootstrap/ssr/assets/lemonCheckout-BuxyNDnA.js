const LEMON_JS_SRC = "https://app.lemonsqueezy.com/js/lemon.js";
const LOAD_TIMEOUT_MS = 12e3;
let loaderPromise = null;
let activeHandlers = null;
function toEmbeddableUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  try {
    const url = new URL(rawUrl, window.location.origin);
    if (url.searchParams.has("signature")) return rawUrl;
    url.searchParams.set("embed", "1");
    return url.toString();
  } catch {
    if (rawUrl.includes("signature=") || rawUrl.includes("embed=")) return rawUrl;
    return `${rawUrl}${rawUrl.includes("?") ? "&" : "?"}embed=1`;
  }
}
function handleLemonEvent(payload) {
  const name = payload?.event ?? payload;
  const handlers = activeHandlers;
  if (!handlers) return;
  if (name === "Checkout.Success") {
    handlers.onSuccess?.(payload?.data ?? null);
    return;
  }
  if (name === "Checkout.Closed" || name === "Checkout.Close") {
    activeHandlers = null;
    handlers.onClose?.();
  }
}
function loadLemonJs() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.reject(new Error("lemon.js requires a browser environment"));
  }
  if (window.LemonSqueezy?.Url?.Open) {
    return Promise.resolve(window.LemonSqueezy);
  }
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      loaderPromise = null;
      reject(new Error("lemon.js load timed out"));
    }, LOAD_TIMEOUT_MS);
    const finish = () => {
      if (settled) return;
      try {
        window.createLemonSqueezy?.();
      } catch {
      }
      if (!window.LemonSqueezy?.Url?.Open) {
        settled = true;
        clearTimeout(timer);
        loaderPromise = null;
        reject(new Error("lemon.js loaded but did not initialise"));
        return;
      }
      try {
        window.LemonSqueezy.Setup({ eventHandler: handleLemonEvent });
      } catch {
      }
      settled = true;
      clearTimeout(timer);
      resolve(window.LemonSqueezy);
    };
    const existing = document.querySelector(`script[src="${LEMON_JS_SRC}"]`);
    if (existing) {
      if (existing.dataset.loaded === "1") {
        finish();
      } else {
        existing.addEventListener("load", finish, { once: true });
        existing.addEventListener("error", () => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          loaderPromise = null;
          reject(new Error("lemon.js failed to load"));
        }, { once: true });
      }
      return;
    }
    const script = document.createElement("script");
    script.src = LEMON_JS_SRC;
    script.defer = true;
    script.addEventListener("load", () => {
      script.dataset.loaded = "1";
      finish();
    }, { once: true });
    script.addEventListener("error", () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      loaderPromise = null;
      script.remove();
      reject(new Error("lemon.js failed to load"));
    }, { once: true });
    document.head.appendChild(script);
  });
  return loaderPromise;
}
function preloadLemonCheckout() {
  loadLemonJs().catch(() => {
  });
}
async function openLemonCheckout(url, options = {}) {
  const {
    onSuccess,
    onClose,
    onError,
    redirectOnFailure = true
  } = options;
  if (!url) {
    onError?.(new Error("No checkout URL was provided."));
    return false;
  }
  const embedUrl = toEmbeddableUrl(url);
  try {
    const lemon = await loadLemonJs();
    activeHandlers = {
      onSuccess: (data) => {
        onSuccess?.(data);
      },
      onClose: () => {
        onClose?.();
      }
    };
    lemon.Url.Open(embedUrl);
    return true;
  } catch (error) {
    activeHandlers = null;
    onError?.(error);
    if (redirectOnFailure) {
      window.location.href = embedUrl;
    }
    return false;
  }
}
function closeLemonCheckout() {
  try {
    window.LemonSqueezy?.Url?.Close?.();
  } catch {
  }
  activeHandlers = null;
}
export {
  closeLemonCheckout as c,
  openLemonCheckout as o,
  preloadLemonCheckout as p
};
