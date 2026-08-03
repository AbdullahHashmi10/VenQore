import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, useCallback } from "react";
import { router } from "@inertiajs/react";
import { r as role, v as vq } from "./marketing-pages-CTBAvetE.js";
import { KeyRound, ShieldCheck, Store, CheckCircle2, ChevronRight, ExternalLink, Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const STEPS = [
  { key: "client", title: "LWA Application", icon: KeyRound, hint: "From Seller Central → Develop Apps" },
  { key: "token", title: "Refresh Token", icon: ShieldCheck, hint: "Generated when you authorize your app" },
  { key: "seller", title: "Seller ID", icon: Store, hint: "Your Merchant Token" }
];
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  background: "#0a1220",
  border: "1px solid #1e3a5f",
  color: vq.slate[100],
  fontSize: 13,
  outline: "none",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace"
};
const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: vq.slate[400],
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: 6
};
function AmazonSetupWizard({ storeSlug, onClose }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    client_id: "",
    client_secret: "",
    refresh_token: "",
    seller_id: "",
    name: ""
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setTestResult(null);
  };
  const canAdvance = useCallback(() => {
    if (step === 0) return form.client_id.trim() !== "" && form.client_secret.trim() !== "";
    if (step === 1) return form.refresh_token.trim() !== "";
    return form.seller_id.trim() !== "";
  }, [step, form]);
  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(route("store.vensynq.amazon.test", { store_slug: storeSlug }), {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content ?? ""
        },
        body: JSON.stringify({
          client_id: form.client_id,
          client_secret: form.client_secret,
          refresh_token: form.refresh_token
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (e) {
      setTestResult({ ok: false, message: "Could not reach the server. Check your connection and retry." });
    } finally {
      setTesting(false);
    }
  }, [form, storeSlug]);
  const handleSave = useCallback(() => {
    setSaving(true);
    setErrors({});
    router.post(
      route("store.vensynq.amazon.store", { store_slug: storeSlug }),
      form,
      {
        preserveScroll: true,
        onError: (errs) => setErrors(errs),
        onFinish: () => setSaving(false)
      }
    );
  }, [form, storeSlug]);
  const StepIcon = STEPS[step].icon;
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "linear-gradient(135deg, #0d1e36 0%, #091220 100%)",
    border: "1px solid #1e3a5f",
    borderRadius: 14,
    padding: 22,
    display: "flex",
    flexDirection: "column",
    gap: 18
  }, children: [
    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }, children: STEPS.map((s, i) => {
      const done = i < step;
      const active = i === step;
      return /* @__PURE__ */ jsxs(React.Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 12px",
          borderRadius: 999,
          background: active ? "#12233f" : "transparent",
          border: `1px solid ${active ? "#2f5c96" : done ? role.success[800] : vq.slate[800]}`,
          minWidth: 0
        }, children: [
          /* @__PURE__ */ jsx("span", { style: {
            width: 20,
            height: 20,
            borderRadius: "50%",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: done ? role.success[600] : active ? "#3b82f6" : vq.slate[800],
            color: "#fff",
            fontSize: 10,
            fontWeight: 700
          }, children: done ? /* @__PURE__ */ jsx(CheckCircle2, { size: 12 }) : i + 1 }),
          /* @__PURE__ */ jsx("span", { style: {
            fontSize: 12,
            fontWeight: 600,
            color: active ? vq.slate[100] : done ? role.success[400] : vq.slate[500],
            whiteSpace: "nowrap"
          }, children: s.title })
        ] }),
        i < STEPS.length - 1 && /* @__PURE__ */ jsx(ChevronRight, { size: 13, color: vq.slate[700] })
      ] }, s.key);
    }) }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 14 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 9 }, children: [
        /* @__PURE__ */ jsx(StepIcon, { size: 16, color: "#60a5fa" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 700, color: vq.slate[100] }, children: STEPS[step].title }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: vq.slate[500] }, children: STEPS[step].hint })
        ] })
      ] }),
      step === 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { style: labelStyle, htmlFor: "amz-client-id", children: "LWA Client ID" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "amz-client-id",
              style: inputStyle,
              value: form.client_id,
              onChange: set("client_id"),
              placeholder: "amzn1.application-oa2-client.…",
              autoComplete: "off",
              spellCheck: false
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { style: labelStyle, htmlFor: "amz-client-secret", children: "LWA Client Secret" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "amz-client-secret",
              style: inputStyle,
              type: "password",
              value: form.client_secret,
              onChange: set("client_secret"),
              placeholder: "amzn1.oa2-cs.v1.…",
              autoComplete: "new-password",
              spellCheck: false
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "https://sellercentral.amazon.com/sellingpartner/developerconsole",
            target: "_blank",
            rel: "noopener noreferrer",
            style: { display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: "#60a5fa", textDecoration: "none" },
            children: [
              "Open Amazon Developer Console ",
              /* @__PURE__ */ jsx(ExternalLink, { size: 11 })
            ]
          }
        )
      ] }),
      step === 1 && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { style: labelStyle, htmlFor: "amz-refresh", children: "Refresh Token" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            id: "amz-refresh",
            style: { ...inputStyle, minHeight: 84, resize: "vertical", lineHeight: 1.5 },
            value: form.refresh_token,
            onChange: set("refresh_token"),
            placeholder: "Atzr|IwEBI…",
            autoComplete: "off",
            spellCheck: false
          }
        ),
        /* @__PURE__ */ jsx("p", { style: { margin: "7px 0 0", fontSize: 11, color: vq.slate[500], lineHeight: 1.5 }, children: "This is issued once when you authorize your application. VenQore encrypts it at rest and rotates the short-lived access token automatically every 10 minutes." })
      ] }),
      step === 2 && /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { style: labelStyle, htmlFor: "amz-seller", children: "Seller ID (Merchant Token)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "amz-seller",
              style: inputStyle,
              value: form.seller_id,
              onChange: set("seller_id"),
              placeholder: "A1BCDEFGHIJKLM",
              autoComplete: "off",
              spellCheck: false
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { style: labelStyle, htmlFor: "amz-name", children: "Channel Name (optional)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "amz-name",
              style: { ...inputStyle, fontFamily: "inherit" },
              value: form.name,
              onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })),
              placeholder: "Amazon UK — Main Store"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleTest,
            disabled: testing || !form.client_id || !form.client_secret || !form.refresh_token,
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              padding: "10px 16px",
              borderRadius: 9,
              border: "1px solid #2f5c96",
              background: testing ? vq.slate[800] : "#12233f",
              color: testing ? vq.slate[500] : "#93c5fd",
              fontSize: 13,
              fontWeight: 600,
              cursor: testing ? "wait" : "pointer",
              width: "100%"
            },
            children: [
              testing ? /* @__PURE__ */ jsx(Loader2, { size: 14, className: "spin" }) : /* @__PURE__ */ jsx(ShieldCheck, { size: 14 }),
              testing ? "Contacting Amazon…" : "Test Connection"
            ]
          }
        ),
        testResult && /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "11px 13px",
          borderRadius: 9,
          background: testResult.ok ? role.success[950] : role.danger[950],
          border: `1px solid ${testResult.ok ? role.success[800] : role.danger[800]}`
        }, children: [
          testResult.ok ? /* @__PURE__ */ jsx(CheckCircle2, { size: 14, color: role.success[400], style: { flexShrink: 0, marginTop: 1 } }) : /* @__PURE__ */ jsx(AlertCircle, { size: 14, color: role.danger[400], style: { flexShrink: 0, marginTop: 1 } }),
          /* @__PURE__ */ jsx("span", { style: {
            fontSize: 12,
            lineHeight: 1.5,
            color: testResult.ok ? role.success[300] : role.danger[300]
          }, children: testResult.message })
        ] }),
        Object.values(errors).length > 0 && /* @__PURE__ */ jsx("div", { style: {
          padding: "11px 13px",
          borderRadius: 9,
          background: role.danger[950],
          border: `1px solid ${role.danger[800]}`,
          color: role.danger[300],
          fontSize: 12,
          lineHeight: 1.5
        }, children: Object.values(errors).join(" ") })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center" }, children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => step === 0 ? onClose?.() : setStep((s) => s - 1),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "9px 15px",
            borderRadius: 8,
            background: "transparent",
            border: `1px solid ${vq.slate[800]}`,
            color: vq.slate[400],
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer"
          },
          children: [
            /* @__PURE__ */ jsx(ChevronLeft, { size: 13 }),
            " ",
            step === 0 ? "Cancel" : "Back"
          ]
        }
      ),
      step < STEPS.length - 1 ? /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setStep((s) => s + 1),
          disabled: !canAdvance(),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "9px 20px",
            borderRadius: 8,
            border: "none",
            background: canAdvance() ? "linear-gradient(135deg, #3b82f6, #1d4ed8)" : vq.slate[800],
            color: canAdvance() ? "#fff" : vq.slate[600],
            fontSize: 12,
            fontWeight: 700,
            cursor: canAdvance() ? "pointer" : "not-allowed"
          },
          children: [
            "Continue ",
            /* @__PURE__ */ jsx(ChevronRight, { size: 13 })
          ]
        }
      ) : /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleSave,
          disabled: saving || !canAdvance(),
          style: {
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 20px",
            borderRadius: 8,
            border: "none",
            background: saving || !canAdvance() ? vq.slate[800] : "linear-gradient(135deg, #059669, #047857)",
            color: saving || !canAdvance() ? vq.slate[600] : "#fff",
            fontSize: 12,
            fontWeight: 700,
            cursor: saving ? "wait" : canAdvance() ? "pointer" : "not-allowed"
          },
          children: [
            saving ? /* @__PURE__ */ jsx(Loader2, { size: 13, className: "spin" }) : /* @__PURE__ */ jsx(CheckCircle2, { size: 13 }),
            saving ? "Connecting…" : "Connect Amazon"
          ]
        }
      )
    ] })
  ] });
}
export {
  AmazonSetupWizard as default
};
