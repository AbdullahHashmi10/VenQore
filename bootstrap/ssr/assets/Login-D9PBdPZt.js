import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { useForm, Head } from "@inertiajs/react";
import { Shield, Lock, AlertCircle, Delete, ArrowRight, Mail, EyeOff, Eye, Hash } from "lucide-react";
import { v as vq } from "./marketing-pages-CTBAvetE.js";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }

    @keyframes float-orb {
        0%, 100% { transform: scale(1) translate(0,0); opacity: 0.6; }
        33% { transform: scale(1.08) translate(20px,-30px); opacity: 1; }
        66% { transform: scale(0.95) translate(-15px,20px); opacity: 0.7; }
    }
    @keyframes float-particle {
        0%, 100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.3; }
        50% { transform: translateY(-28px) translateX(14px) scale(1.15); opacity: 0.7; }
    }
    @keyframes slide-up {
        from { opacity: 0; transform: translateY(28px); }
        to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes glow-pulse {
        0%,100% { opacity: 0.5; }
        50%      { opacity: 1; }
    }
    @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%     { transform: translateX(-8px); }
        40%     { transform: translateX(8px); }
        60%     { transform: translateX(-5px); }
        80%     { transform: translateX(5px); }
    }
    @keyframes pin-bounce {
        0%  { transform: scale(0.5); opacity: 0; }
        70% { transform: scale(1.2); }
        100%{ transform: scale(1); opacity: 1; }
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
    }

    .pin-card {
        padding: 24px 16px;
    }

    .logo-container {
        width: 52px;
        height: 52px;
    }

    .hq-input {
        width: 100%;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 14px;
        padding: 13px 16px 13px 48px;
        color: #f1f5f9;
        font-size: 15px;
        font-family: 'Inter', sans-serif;
        outline: none;
        transition: all 0.25s;
    }
    .hq-input::placeholder { color: rgba(148,163,184,0.75); }
    .hq-input:focus {
        border-color: rgba(99,102,241,0.7);
        background: rgba(99,102,241,0.07);
        box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
    }
    .hq-input.err { border-color: rgba(239,68,68,0.6); animation: shake 0.4s ease; }
    .hq-input.pr  { padding-right: 48px; }

    .hq-btn {
        width: 100%; padding: 14px;
        border-radius: 14px; border: none;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #7c3aed 100%);
        color: #fff; font-size: 15px; font-weight: 700;
        font-family: 'Inter', sans-serif;
        cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px;
        transition: all 0.25s; letter-spacing: 0.02em;
        box-shadow: 0 6px 28px rgba(99,102,241,0.4);
        position: relative; overflow: hidden;
    }
    .hq-btn:hover:not(:disabled) {
        box-shadow: 0 10px 36px rgba(99,102,241,0.55);
        transform: translateY(-1px);
    }
    .hq-btn:active:not(:disabled) { transform: scale(0.98); }
    .hq-btn:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
    .hq-btn::after {
        content: ''; position: absolute;
        top: -50%; left: -60%; width: 50%; height: 200%;
        background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
        transform: skewX(-20deg); transition: left 0.6s;
    }
    .hq-btn:hover::after { left: 120%; }

    .pin-key {
        height: 48px; border-radius: 14px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.09);
        color: #f1f5f9; font-size: 20px; font-weight: 700;
        font-family: 'Inter', sans-serif;
        cursor: pointer; transition: all 0.15s;
        display: flex; align-items: center; justify-content: center;
    }
    .pin-key:hover {
        background: rgba(99,102,241,0.18);
        border-color: rgba(99,102,241,0.4);
        transform: scale(1.04);
    }
    .pin-key:active { transform: scale(0.95); }
    .pin-key.del {
        background: rgba(239,68,68,0.06);
        border-color: rgba(239,68,68,0.15);
        color: rgba(239,68,68,0.7);
    }
    .pin-key.del:hover {
        background: rgba(239,68,68,0.14);
        border-color: rgba(239,68,68,0.35);
        color: #ef4444;
    }
    .pin-key.submit {
        background: linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.25));
        border-color: rgba(99,102,241,0.5);
        color: #a5b4fc;
    }
    .pin-key.submit:hover {
        background: linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4));
        color: #fff;
    }

    .toggle-mode {
        background: none; border: none; cursor: pointer;
        font-family: 'Inter', sans-serif;
        color: rgba(148,163,184,0.6); font-size: 12px; font-weight: 600;
        letter-spacing: 0.04em; transition: color 0.2s;
        display: flex; align-items: center; gap: 6px;
        padding: 6px 0;
    }
    .toggle-mode:hover { color: #a5b4fc; }

    .mode-tab {
        flex: 1; padding: 9px; border-radius: 10px; border: none;
        font-size: 13px; font-weight: 700; cursor: pointer;
        font-family: 'Inter', sans-serif;
        transition: all 0.2s;
    }
    .mode-tab.active {
        background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2));
        color: #a5b4fc; border: 1px solid rgba(99,102,241,0.35);
    }
    .mode-tab.inactive {
        background: transparent; color: rgba(148,163,184,0.7);
        border: 1px solid transparent;
    }
    .mode-tab.inactive:hover { color: rgba(148,163,184,0.8); }
`;
function ParticleField() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size: Math.random() * 3 + 2,
    top: Math.random() * 100,
    left: Math.random() * 100,
    duration: Math.random() * 8 + 6,
    delay: -(Math.random() * 8),
    color: Math.random() > 0.5 ? "99,102,241" : "139,92,246"
  }));
  return /* @__PURE__ */ jsx(Fragment, { children: particles.map((p) => /* @__PURE__ */ jsx("div", { style: {
    position: "absolute",
    width: p.size + "px",
    height: p.size + "px",
    borderRadius: "50%",
    background: `rgba(${p.color},${Math.random() * 0.4 + 0.15})`,
    top: p.top + "%",
    left: p.left + "%",
    animation: `float-particle ${p.duration}s ease-in-out infinite`,
    animationDelay: `${p.delay}s`,
    filter: "blur(0.5px)",
    pointerEvents: "none"
  } }, p.id)) });
}
function PinDots({ value, maxLen = 8, hasError }) {
  const filled = Math.min(value.length, maxLen);
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "center", gap: 10, minHeight: 20 }, children: Array.from({ length: maxLen }, (_, i) => /* @__PURE__ */ jsx("div", { style: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: i < filled ? hasError ? vq.red[500] : vq.indigo[500] : "rgba(255,255,255,0.1)",
    border: i < filled ? hasError ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(99,102,241,0.5)" : "1px solid rgba(255,255,255,0.15)",
    transition: "all 0.2s",
    transform: i < filled ? "scale(1.15)" : "scale(1)",
    animation: i === filled - 1 && filled > 0 ? "pin-bounce 0.25s ease" : "none"
  } }, i)) });
}
function PlatformOwnerLogin({ status, has_pin_enabled = false, flash }) {
  const [mode, setMode] = useState(has_pin_enabled ? "pin" : "password");
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(null);
  const [mounted, setMounted] = useState(false);
  const emailRef = useRef(null);
  const pinInputRef = useRef(null);
  const submitPinRef = useRef(null);
  const pinValueRef = useRef("");
  const pwForm = useForm({ email: "", password: "", remember: true });
  const pinForm = useForm({ pin: "" });
  useEffect(() => {
    setMounted(true);
    if (mode === "password") {
      setTimeout(() => emailRef.current?.focus(), 600);
    }
  }, []);
  useEffect(() => {
    if (mode === "password") {
      setTimeout(() => emailRef.current?.focus(), 200);
    }
  }, [mode]);
  useEffect(() => {
    if (mode !== "pin") return;
    setTimeout(() => pinInputRef.current?.focus(), 150);
    const onKeyDown = (e) => {
      const current = pinValueRef.current;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        if (current.length < 8) pinForm.setData("pin", current + e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        pinForm.setData("pin", current.slice(0, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        submitPinRef.current?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode]);
  const submitPassword = (e) => {
    e.preventDefault();
    pwForm.post("/VenQore-login", {
      preserveState: true,
      preserveScroll: true
    });
  };
  const submitPin = () => {
    if (pinForm.data.pin.length < 4) return;
    pinForm.post("/VenQore-login/pin", {
      preserveState: true,
      preserveScroll: true,
      onError: () => pinForm.setData("pin", "")
    });
  };
  useEffect(() => {
    submitPinRef.current = submitPin;
    pinValueRef.current = pinForm.data.pin;
  });
  const handlePinKey = (key) => {
    if (key === "del") {
      pinForm.setData("pin", pinForm.data.pin.slice(0, -1));
    } else if (pinForm.data.pin.length < 8) {
      const next = pinForm.data.pin + key;
      pinForm.setData("pin", next);
    }
  };
  const hasError = pwForm.errors.email || pwForm.errors.password || pinForm.errors.pin;
  return /* @__PURE__ */ jsxs("div", { style: {
    minHeight: "100vh",
    width: "100%",
    background: "radial-gradient(ellipse at 20% 50%, rgba(25,15,55,0.95) 0%, #06080f 55%, #020304 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', system-ui, sans-serif",
    position: "relative",
    overflow: "hidden",
    padding: "20px"
  }, children: [
    /* @__PURE__ */ jsx(Head, { title: "VenQore — Secure Access" }),
    /* @__PURE__ */ jsx("style", { children: css }),
    /* @__PURE__ */ jsxs("div", { style: { position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }, children: [
      /* @__PURE__ */ jsx("div", { style: {
        position: "absolute",
        top: "-15%",
        left: "-10%",
        width: "55%",
        height: "55%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
        filter: "blur(60px)",
        animation: "float-orb 12s ease-in-out infinite"
      } }),
      /* @__PURE__ */ jsx("div", { style: {
        position: "absolute",
        bottom: "-15%",
        right: "-5%",
        width: "45%",
        height: "45%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)",
        filter: "blur(80px)",
        animation: "float-orb 16s ease-in-out infinite",
        animationDelay: "-5s"
      } }),
      /* @__PURE__ */ jsx("div", { style: {
        position: "absolute",
        inset: 0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)`,
        backgroundSize: "64px 64px"
      } }),
      /* @__PURE__ */ jsx(ParticleField, {})
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      position: "relative",
      width: "100%",
      maxWidth: 440,
      opacity: mounted ? 1 : 0,
      animation: mounted ? "slide-up 0.65s cubic-bezier(0.16,1,0.3,1) forwards" : "none"
    }, children: [
      /* @__PURE__ */ jsx("div", { style: {
        position: "absolute",
        inset: -1,
        borderRadius: 28,
        background: "linear-gradient(135deg, rgba(99,102,241,0.45), rgba(139,92,246,0.2), rgba(99,102,241,0.1))",
        filter: "blur(1px)",
        animation: "glow-pulse 4s ease-in-out infinite"
      } }),
      /* @__PURE__ */ jsxs("div", { className: "pin-card", style: {
        position: "relative",
        background: "rgba(8, 10, 24, 0.88)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        borderRadius: 28,
        border: "1px solid rgba(99,102,241,0.18)",
        boxShadow: "0 40px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)"
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", marginBottom: 32 }, children: [
          /* @__PURE__ */ jsxs("div", { className: "logo-container", style: {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 20,
            marginBottom: 20,
            background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))",
            border: "1px solid rgba(99,102,241,0.35)",
            boxShadow: "0 0 28px rgba(99,102,241,0.2)"
          }, children: [
            /* @__PURE__ */ jsx(
              "img",
              {
                src: "/images/logo.png",
                alt: "VenQore",
                style: { width: 32, height: 32, objectFit: "contain" },
                onError: (e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }
              }
            ),
            /* @__PURE__ */ jsx("div", { style: { display: "none", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(Shield, { size: 22, color: vq.indigo[500] }) })
          ] }),
          /* @__PURE__ */ jsx("div", { style: {
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "rgba(99,102,241,0.8)",
            marginBottom: 9
          }, children: "VenQore Platform HQ" }),
          /* @__PURE__ */ jsx("h1", { style: { fontSize: 24, fontWeight: 800, color: vq.slate[100], letterSpacing: "-0.02em", marginBottom: 6 }, children: "Welcome back, Abdullah" }),
          /* @__PURE__ */ jsx("p", { style: { fontSize: 13, color: "rgba(148,163,184,0.65)", lineHeight: 1.5 }, children: "Secure access to your command center" })
        ] }),
        has_pin_enabled && /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, marginBottom: 24, background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: 4, border: "1px solid rgba(255,255,255,0.06)" }, children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: `mode-tab ${mode === "pin" ? "active" : "inactive"}`,
              onClick: () => setMode("pin"),
              type: "button",
              children: "#  PIN Login"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              className: `mode-tab ${mode === "password" ? "active" : "inactive"}`,
              onClick: () => setMode("password"),
              type: "button",
              children: [
                /* @__PURE__ */ jsx(Lock, { style: { display: "inline", width: 12, height: 12, marginRight: 5 } }),
                "Password"
              ]
            }
          )
        ] }),
        status && /* @__PURE__ */ jsx("div", { style: {
          background: "rgba(16,185,129,0.1)",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: 12,
          padding: "11px 16px",
          marginBottom: 20,
          fontSize: 13,
          color: vq.emerald[400],
          display: "flex",
          alignItems: "center",
          gap: 8
        }, children: status }),
        flash?.error && /* @__PURE__ */ jsxs("div", { style: {
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.22)",
          borderRadius: 12,
          padding: "11px 16px",
          marginBottom: 20,
          fontSize: 13,
          color: vq.red[400],
          display: "flex",
          alignItems: "center",
          gap: 8,
          animation: "fade-in 0.3s ease"
        }, children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 15, style: { flexShrink: 0 } }),
          flash.error
        ] }),
        hasError && /* @__PURE__ */ jsxs("div", { style: {
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.22)",
          borderRadius: 12,
          padding: "11px 16px",
          marginBottom: 20,
          fontSize: 13,
          color: vq.red[400],
          display: "flex",
          alignItems: "center",
          gap: 8,
          animation: "fade-in 0.3s ease"
        }, children: [
          /* @__PURE__ */ jsx(AlertCircle, { size: 15, style: { flexShrink: 0 } }),
          pwForm.errors.email || pwForm.errors.password || pinForm.errors.pin
        ] }),
        mode === "pin" && /* @__PURE__ */ jsxs("div", { style: { animation: "fade-in 0.3s ease" }, children: [
          /* @__PURE__ */ jsxs("div", { style: { marginBottom: 24, textAlign: "center" }, children: [
            /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: vq.slate[400], marginBottom: 16, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700 }, children: "Enter your PIN" }),
            /* @__PURE__ */ jsx(PinDots, { value: pinForm.data.pin, hasError: !!pinForm.errors.pin }),
            /* @__PURE__ */ jsx(
              "input",
              {
                ref: pinInputRef,
                type: "text",
                inputMode: "numeric",
                autoComplete: "one-time-code",
                "aria-label": "Enter your PIN",
                value: pinForm.data.pin,
                onChange: (e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
                  pinForm.setData("pin", digits);
                },
                style: {
                  position: "absolute",
                  width: 1,
                  height: 1,
                  padding: 0,
                  margin: -1,
                  overflow: "hidden",
                  clip: "rect(0,0,0,0)",
                  border: 0,
                  opacity: 0
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }, children: [
            [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pin-key",
                onClick: () => handlePinKey(String(n)),
                children: n
              },
              n
            )),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pin-key del",
                onClick: () => handlePinKey("del"),
                children: /* @__PURE__ */ jsx(Delete, { size: 20 })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: "pin-key",
                onClick: () => handlePinKey("0"),
                children: "0"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                className: `pin-key submit ${pinForm.data.pin.length >= 4 ? "" : ""}`,
                onClick: submitPin,
                disabled: pinForm.data.pin.length < 4 || pinForm.processing,
                style: { opacity: pinForm.data.pin.length < 4 ? 0.35 : 1 },
                children: pinForm.processing ? /* @__PURE__ */ jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", style: { animation: "spin 0.8s linear infinite" }, children: /* @__PURE__ */ jsx("path", { d: "M21 12a9 9 0 11-6.219-8.56" }) }) : /* @__PURE__ */ jsx(ArrowRight, { size: 20 })
              }
            )
          ] }),
          !has_pin_enabled && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "toggle-mode",
              style: { width: "100%", justifyContent: "center" },
              onClick: () => setMode("password"),
              children: [
                /* @__PURE__ */ jsx(Lock, { size: 12 }),
                " Use password instead"
              ]
            }
          )
        ] }),
        mode === "password" && /* @__PURE__ */ jsxs("form", { onSubmit: submitPassword, style: { display: "flex", flexDirection: "column", gap: 16, animation: "fade-in 0.3s ease" }, children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { style: { display: "block", fontSize: 11, fontWeight: 800, color: "rgba(148,163,184,0.8)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }, children: "Email Address" }),
            /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ jsx("div", { style: {
                position: "absolute",
                left: 15,
                top: "50%",
                transform: "translateY(-50%)",
                color: focused === "email" ? vq.indigo[500] : "rgba(100,116,139,0.7)",
                transition: "color 0.2s",
                pointerEvents: "none"
              }, children: /* @__PURE__ */ jsx(Mail, { size: 17 }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: emailRef,
                  type: "email",
                  className: `hq-input ${pwForm.errors.email ? "err" : ""}`,
                  value: pwForm.data.email,
                  onChange: (e) => pwForm.setData("email", e.target.value),
                  onFocus: () => setFocused("email"),
                  onBlur: () => setFocused(null),
                  placeholder: "your@email.com",
                  autoComplete: "email"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { style: { display: "block", fontSize: 11, fontWeight: 800, color: "rgba(148,163,184,0.8)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }, children: "Password" }),
            /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
              /* @__PURE__ */ jsx("div", { style: {
                position: "absolute",
                left: 15,
                top: "50%",
                transform: "translateY(-50%)",
                color: focused === "password" ? vq.indigo[500] : "rgba(100,116,139,0.7)",
                transition: "color 0.2s",
                pointerEvents: "none"
              }, children: /* @__PURE__ */ jsx(Lock, { size: 17 }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: showPassword ? "text" : "password",
                  className: `hq-input pr ${pwForm.errors.password ? "err" : ""}`,
                  value: pwForm.data.password,
                  onChange: (e) => pwForm.setData("password", e.target.value),
                  onFocus: () => setFocused("password"),
                  onBlur: () => setFocused(null),
                  placeholder: "••••••••••••",
                  autoComplete: "current-password"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPassword((v) => !v),
                  style: {
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(100,116,139,0.65)",
                    padding: 4,
                    display: "flex",
                    alignItems: "center"
                  },
                  tabIndex: -1,
                  children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { size: 16 }) : /* @__PURE__ */ jsx(Eye, { size: 16 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { marginTop: 4 }, children: /* @__PURE__ */ jsx("button", { type: "submit", disabled: pwForm.processing, className: "hq-btn", children: pwForm.processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("svg", { width: "17", height: "17", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", style: { animation: "spin 0.8s linear infinite" }, children: /* @__PURE__ */ jsx("path", { d: "M21 12a9 9 0 11-6.219-8.56" }) }),
            "Authenticating…"
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            "Enter Command Center ",
            /* @__PURE__ */ jsx(ArrowRight, { size: 17 })
          ] }) }) }),
          has_pin_enabled && /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              className: "toggle-mode",
              style: { justifyContent: "center", width: "100%" },
              onClick: () => setMode("pin"),
              children: [
                /* @__PURE__ */ jsx(Hash, { size: 12 }),
                " Switch to PIN login"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { style: {
          marginTop: 28,
          paddingTop: 22,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8
        }, children: [
          /* @__PURE__ */ jsx(Shield, { size: 12, color: vq.slate[500] }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: vq.slate[500], letterSpacing: "0.02em" }, children: "Rate-limited · Session-encrypted · Platform-restricted" })
        ] })
      ] })
    ] })
  ] });
}
export {
  PlatformOwnerLogin as default
};
