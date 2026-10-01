import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { RefreshCw, Plus, Monitor, Copy, Trash2 } from "lucide-react";
import { S as SectionHeader } from "./SectionHeader-CPHLUsd1.js";
function TerminalPairingSection({ storeSlug }) {
  const [tokens, setTokens] = useState([]);
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(null);
  const [terminals, setTerminals] = useState([]);
  const load = useCallback(async () => {
    try {
      const res = await axios.get(route("store.terminal-pairing.index", { store_slug: storeSlug }));
      setError("");
      setTokens(res.data?.tokens || []);
      const t = await axios.get(route("store.terminals.index", { store_slug: storeSlug }));
      setTerminals(t.data?.terminals || []);
    } catch (e) {
      setError(e.response?.status === 403 ? "Only owners and admins can pair terminals." : "Could not load pairing codes.");
    }
  }, [storeSlug]);
  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);
  const create = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.post(route("store.terminal-pairing.store", { store_slug: storeSlug }), {
        label: label.trim() || null,
        ttl_minutes: 60
      });
      setLabel("");
      await load();
    } catch (e) {
      setError(e.response?.data?.message || "Could not create a pairing code.");
    } finally {
      setLoading(false);
    }
  };
  const revoke = async (id) => {
    try {
      await axios.delete(route("store.terminal-pairing.destroy", { store_slug: storeSlug, id }));
      await load();
    } catch (e) {
      setError("Could not cancel that code.");
    }
  };
  const disconnect = async (id) => {
    if (!window.confirm("Disconnect this terminal? It will need a new pairing code.")) return;
    try {
      await axios.post(route("store.terminals.revoke", { store_slug: storeSlug, id }));
      await load();
    } catch (e) {
      setError("Could not disconnect that terminal.");
    }
  };
  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      window.setTimeout(() => setCopied(null), 1500);
    } catch (e) {
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6", children: [
    /* @__PURE__ */ jsx(
      SectionHeader,
      {
        title: "Pair New Station Terminal",
        description: "Create a one-time code, then enter it on the Station setup screen. Each code works once and expires after 60 minutes."
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-end mb-5", children: [
      /* @__PURE__ */ jsxs("label", { className: "flex-1 text-sm text-ink-secondary", children: [
        "Terminal name (optional)",
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: label,
            maxLength: 100,
            onChange: (e) => setLabel(e.target.value),
            placeholder: "Front counter",
            className: "mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: create,
          disabled: loading,
          className: "inline-flex items-center justify-center gap-2 rounded-md bg-accent-fill px-4 py-2 text-sm font-semibold text-white disabled:opacity-60",
          children: [
            loading ? /* @__PURE__ */ jsx(RefreshCw, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsx(Plus, { size: 16 }),
            "Create pairing code"
          ]
        }
      )
    ] }),
    error && /* @__PURE__ */ jsx("p", { role: "alert", className: "mb-4 text-sm text-danger-700", children: error }),
    tokens.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No active pairing codes." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y divide-line rounded-md border border-line", children: tokens.map((t) => /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-center gap-3 px-4 py-3", children: [
      /* @__PURE__ */ jsx(Monitor, { size: 16, className: "text-ink-muted", "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("code", { className: "font-numeric text-base tracking-widest text-ink select-all", children: t.token }),
      /* @__PURE__ */ jsx("span", { className: "text-sm text-ink-muted", children: t.label || "Unnamed terminal" }),
      /* @__PURE__ */ jsx("span", { className: "ml-auto text-xs text-ink-muted", children: t.expires_at ? `expires ${new Date(t.expires_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "" }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => copy(t.token), className: "rounded-md p-2 hover:bg-interactive-hover", "aria-label": "Copy code", children: [
        /* @__PURE__ */ jsx(Copy, { size: 16 }),
        copied === t.token && /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Copied" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => revoke(t.id), className: "rounded-md p-2 hover:bg-interactive-hover", "aria-label": "Cancel code", children: /* @__PURE__ */ jsx(Trash2, { size: 16 }) })
    ] }, t.id)) }),
    /* @__PURE__ */ jsx("h4", { className: "mt-6 mb-2 text-sm font-semibold text-ink", children: "Paired terminals" }),
    terminals.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No terminals paired yet." }) : /* @__PURE__ */ jsx("ul", { className: "divide-y divide-line rounded-md border border-line", children: terminals.map((t) => /* @__PURE__ */ jsxs("li", { className: "flex flex-wrap items-center gap-3 px-4 py-3", children: [
      /* @__PURE__ */ jsx(Monitor, { size: 16, className: "text-ink-muted", "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("span", { className: "text-sm text-ink", children: t.name }),
      /* @__PURE__ */ jsx("span", { className: "text-xs text-ink-muted", children: t.last_heartbeat_at ? `last seen ${new Date(t.last_heartbeat_at).toLocaleString()}` : "never seen" }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => disconnect(t.id), className: "ml-auto rounded-md px-3 py-1 text-sm text-danger-700 hover:bg-interactive-hover", children: "Disconnect" })
    ] }, t.id)) })
  ] });
}
export {
  TerminalPairingSection as T
};
