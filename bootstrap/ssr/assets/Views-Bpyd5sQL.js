import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { router } from "@inertiajs/react";
import { RefreshCw, Monitor, Zap, Globe, RotateCcw, Play, Activity, Users, TrendingUp, Package, ShoppingCart, FileText, CheckCircle2, AlertTriangle as AlertTriangle$1, Tag, CircleDot, ToggleRight, HardDrive, Database, Upload, Camera, Server, XCircle, Settings, Percent, BadgeCheck, ScanFace, FileCheck2, UserCog, Inbox, DollarSign, ShieldCheck, CreditCard, Banknote } from "lucide-react";
import axios from "axios";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from "recharts";
import { u as useT, B as BRAND, C as ComingSoon, K as KpiCard, P as Panel, c as Button, S as Spinner, E as EmptyState, F as Field, I as Input, D as DataTable, d as StatusBadge$1, b as Badge, e as Select, g as Drawer, G as GRADIENTS, f as fmtCurrency, a as fmtNumber } from "./ui-Dd6dJcJr.js";
import "../ssr.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "@headlessui/react";
import "laravel-echo";
import "pusher-js";
const STATUS$1 = {
  IDLE: "idle",
  RUNNING: "running",
  PASSED: "passed",
  FAILED: "failed"
};
const POLL_INTERVAL_MS$1 = 800;
function parseLine$1(raw) {
  const line = raw.trim();
  if (!line || line === "STARTED") return null;
  if (line.startsWith("EXIT_CODE:")) return null;
  if (line.includes("✓") || line.match(/^\s*PASS\s/)) return { type: "pass", text: line };
  if (line.includes("⨯") || line.includes("✗")) return { type: "fail", text: line };
  if (line.match(/^\s*-\s/)) return { type: "skip", text: line };
  if (line.match(/^\s*(PASS|FAIL)\s+/)) return { type: "suite", text: line };
  if (line.startsWith("Tests:")) return { type: "summary", text: line };
  if (line.startsWith("Duration:")) return { type: "duration", text: line };
  if (line.startsWith("●") || line.includes("FAILED")) return { type: "error", text: line };
  if (line.match(/^\s+at\s+/) || line.match(/^\s+\d+\s/)) return { type: "trace", text: line };
  if (line.match(/^[─━═]+$/)) return { type: "divider", text: line };
  return { type: "info", text: line };
}
const LINE_COLORS$1 = {
  pass: "#10b981",
  // emerald
  fail: "#ef4444",
  // red
  skip: "#f59e0b",
  // amber
  suite: "#a78bfa",
  // violet — suite-level PASS/FAIL header
  summary: "#f1f5f9",
  // near-white
  duration: "#475569",
  // muted
  error: "#f87171",
  // light red
  trace: "#64748b",
  // slate
  divider: "#1e293b",
  // barely visible
  info: "#94a3b8"
  // default slate
};
function StatusBadge({ status }) {
  const configs = {
    [STATUS$1.IDLE]: { color: "#64748b", bg: "rgba(100,116,139,0.1)", label: "Idle" },
    [STATUS$1.RUNNING]: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Running…" },
    [STATUS$1.PASSED]: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "All Passed" },
    [STATUS$1.FAILED]: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Failed" }
  };
  const c = configs[status];
  return /* @__PURE__ */ jsxs("span", { style: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 10px",
    borderRadius: "20px",
    background: c.bg,
    color: c.color,
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.04em"
  }, children: [
    /* @__PURE__ */ jsx("span", { style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: c.color,
      animation: status === STATUS$1.RUNNING ? "smokeRunnerPulse 1.2s infinite" : "none"
    } }),
    c.label
  ] });
}
function LineRow({ item, index }) {
  const color = LINE_COLORS$1[item.type] || LINE_COLORS$1.info;
  const isHighlight = item.type === "pass" || item.type === "fail" || item.type === "summary";
  return /* @__PURE__ */ jsxs("div", { style: {
    color,
    padding: isHighlight ? "1px 0" : "0",
    lineHeight: "1.65",
    wordBreak: "break-all",
    opacity: item.type === "divider" ? 0.3 : 1
  }, children: [
    item.type === "pass" && /* @__PURE__ */ jsx("span", { style: { color: "#10b981", marginRight: 4 }, children: "✓" }),
    item.type === "fail" && /* @__PURE__ */ jsx("span", { style: { color: "#ef4444", marginRight: 4 }, children: "✗" }),
    item.type === "skip" && /* @__PURE__ */ jsx("span", { style: { color: "#f59e0b", marginRight: 4 }, children: "–" }),
    item.text.replace(/^[✓✗⨯]\s*/, "")
  ] });
}
function SmokeTestRunner({ category = "all", onComplete }) {
  const [status, setStatus] = useState(STATUS$1.IDLE);
  const [lines, setLines] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [counts, setCounts] = useState({ pass: 0, fail: 0, skip: 0 });
  const pollRef = useRef(null);
  const timerRef = useRef(null);
  const jobRef = useRef(null);
  const termRef = useRef(null);
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [lines]);
  useEffect(() => () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
  }, []);
  const startElapsedTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1e3);
  };
  const stopAll = () => {
    clearInterval(pollRef.current);
    clearInterval(timerRef.current);
  };
  const countLines = (parsed) => ({
    pass: parsed.filter((l) => l.type === "pass").length,
    fail: parsed.filter((l) => l.type === "fail").length,
    skip: parsed.filter((l) => l.type === "skip").length
  });
  const poll = useCallback(async (jobId) => {
    try {
      const { data } = await axios.get(`/VenQore/smoke-tests/${jobId}`);
      const parsed = (data.lines || []).map(parseLine$1).filter(Boolean);
      setLines(parsed);
      setCounts(countLines(parsed));
      if (data.done) {
        stopAll();
        setStatus(data.passed ? STATUS$1.PASSED : STATUS$1.FAILED);
        onComplete?.(data.passed);
        setTimeout(() => {
          axios.delete(`/VenQore/smoke-tests/${jobId}`).catch(() => {
          });
        }, 6e4);
      }
    } catch {
      stopAll();
      setStatus(STATUS$1.FAILED);
      setLines((prev) => [...prev, { type: "error", text: "Lost connection to test runner." }]);
      onComplete?.(false);
    }
  }, [onComplete]);
  const runTests = async () => {
    setStatus(STATUS$1.RUNNING);
    setLines([]);
    setCounts({ pass: 0, fail: 0, skip: 0 });
    startElapsedTimer();
    try {
      const { data } = await axios.post("/VenQore/smoke-tests/run", { category });
      jobRef.current = data.job_id;
      pollRef.current = setInterval(() => poll(data.job_id), POLL_INTERVAL_MS$1);
    } catch (e) {
      stopAll();
      setStatus(STATUS$1.FAILED);
      setLines([{
        type: "error",
        text: `Failed to start test runner: ${e?.response?.data?.message ?? e.message}`
      }]);
    }
  };
  const reset = () => {
    stopAll();
    setStatus(STATUS$1.IDLE);
    setLines([]);
    setCounts({ pass: 0, fail: 0, skip: 0 });
    setElapsed(0);
    jobRef.current = null;
  };
  const copyToClipboard = () => {
    const textToCopy = lines.map((l) => l.text).join("\n");
    navigator.clipboard.writeText(textToCopy);
  };
  const borderColor = {
    [STATUS$1.IDLE]: "#334155",
    [STATUS$1.RUNNING]: "#f59e0b",
    [STATUS$1.PASSED]: "#10b981",
    [STATUS$1.FAILED]: "#ef4444"
  }[status];
  const isRunning = status === STATUS$1.RUNNING;
  const isDone = status === STATUS$1.PASSED || status === STATUS$1.FAILED;
  const formatElapsed = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "rgba(255,255,255,0.02)",
    border: `1px solid ${borderColor}`,
    borderRadius: "16px",
    padding: "20px 24px",
    transition: "border-color 0.4s ease"
  }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          width: 38,
          height: 38,
          borderRadius: "10px",
          background: "rgba(99,102,241,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.1rem"
        }, children: "🧪" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
            /* @__PURE__ */ jsx("h3", { style: { color: "#f1f5f9", margin: 0, fontSize: "0.9rem", fontWeight: 700 }, children: "Production Smoke Tests" }),
            /* @__PURE__ */ jsx(StatusBadge, { status })
          ] }),
          /* @__PURE__ */ jsx("p", { style: { color: "#475569", margin: "2px 0 0", fontSize: "0.75rem" }, children: "38 read-only checks · safe to run on live server" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
        isRunning && /* @__PURE__ */ jsxs("span", { style: { color: "#64748b", fontSize: "0.78rem", fontVariantNumeric: "tabular-nums" }, children: [
          "⏱ ",
          formatElapsed(elapsed)
        ] }),
        isDone && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("button", { onClick: copyToClipboard, style: {
            background: "transparent",
            border: "1px solid #334155",
            color: "#94a3b8",
            padding: "6px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.78rem",
            transition: "all 0.2s"
          }, children: "📋 Copy Logs" }),
          /* @__PURE__ */ jsx("button", { onClick: reset, style: {
            background: "transparent",
            border: "1px solid #334155",
            color: "#94a3b8",
            padding: "6px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.78rem",
            transition: "all 0.2s"
          }, children: "Reset" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            id: "smoke-test-run-btn",
            onClick: status === STATUS$1.IDLE ? runTests : void 0,
            disabled: isRunning,
            style: {
              background: isRunning ? "transparent" : isDone ? "transparent" : "#6366f1",
              border: `1px solid ${isRunning ? "#f59e0b" : status === STATUS$1.PASSED ? "#10b981" : status === STATUS$1.FAILED ? "#ef4444" : "#6366f1"}`,
              color: isRunning ? "#f59e0b" : status === STATUS$1.PASSED ? "#10b981" : status === STATUS$1.FAILED ? "#ef4444" : "#fff",
              padding: "8px 18px",
              borderRadius: "10px",
              cursor: isRunning ? "not-allowed" : "pointer",
              fontSize: "0.82rem",
              fontWeight: 600,
              transition: "all 0.25s",
              whiteSpace: "nowrap"
            },
            children: [
              status === STATUS$1.IDLE && "▶ Run Smoke Tests",
              status === STATUS$1.RUNNING && "⟳ Running…",
              status === STATUS$1.PASSED && "✓ All Passed",
              status === STATUS$1.FAILED && "✗ Tests Failed"
            ]
          }
        )
      ] })
    ] }),
    (isRunning || isDone) && /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "12px", marginBottom: "12px" }, children: [
      { label: "Passed", count: counts.pass, color: "#10b981" },
      { label: "Failed", count: counts.fail, color: "#ef4444" },
      { label: "Skipped", count: counts.skip, color: "#f59e0b" }
    ].map(({ label, count, color }) => /* @__PURE__ */ jsxs("div", { style: {
      padding: "5px 14px",
      borderRadius: "8px",
      background: `${color}15`,
      border: `1px solid ${color}30`,
      color,
      fontSize: "0.76rem",
      fontWeight: 600
    }, children: [
      count,
      " ",
      label
    ] }, label)) }),
    lines.length > 0 && /* @__PURE__ */ jsxs(
      "div",
      {
        ref: termRef,
        style: {
          background: "#080d17",
          border: "1px solid #1e293b",
          borderRadius: "10px",
          padding: "14px 16px",
          maxHeight: "340px",
          overflowY: "auto",
          fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
          fontSize: "0.74rem",
          lineHeight: 1.7,
          scrollbarWidth: "thin",
          scrollbarColor: "#1e293b #080d17"
        },
        children: [
          lines.map((line, i) => /* @__PURE__ */ jsx(LineRow, { item: line, index: i }, i)),
          isRunning && /* @__PURE__ */ jsx("span", { style: {
            color: "#f59e0b",
            animation: "smokeRunnerBlink 1s step-end infinite",
            fontSize: "0.9rem"
          }, children: "▌" })
        ]
      }
    ),
    status === STATUS$1.IDLE && lines.length === 0 && /* @__PURE__ */ jsxs("div", { style: {
      border: "1px dashed #1e293b",
      borderRadius: "10px",
      padding: "24px",
      textAlign: "center",
      color: "#334155",
      fontSize: "0.8rem"
    }, children: [
      "Click ",
      /* @__PURE__ */ jsx("strong", { style: { color: "#6366f1" }, children: "Run Smoke Tests" }),
      " to verify the production environment is healthy.",
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("span", { style: { fontSize: "0.72rem", color: "#1e293b", marginTop: 6, display: "block" }, children: "Checks DB · Tables · Cache · Storage · Routes · API · Logs" })
    ] }),
    isDone && /* @__PURE__ */ jsxs("div", { style: {
      marginTop: "14px",
      padding: "12px 18px",
      borderRadius: "10px",
      background: status === STATUS$1.PASSED ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
      border: `1px solid ${status === STATUS$1.PASSED ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
      display: "flex",
      alignItems: "center",
      gap: "10px"
    }, children: [
      /* @__PURE__ */ jsx("span", { style: { fontSize: "1.1rem" }, children: status === STATUS$1.PASSED ? "✅" : "🔴" }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: {
          color: status === STATUS$1.PASSED ? "#10b981" : "#ef4444",
          fontSize: "0.84rem",
          fontWeight: 600
        }, children: status === STATUS$1.PASSED ? "All checks passed — production environment is healthy." : "One or more checks failed — do not deploy until resolved." }),
        /* @__PURE__ */ jsxs("div", { style: { color: "#475569", fontSize: "0.72rem", marginTop: "2px" }, children: [
          counts.pass,
          " passed · ",
          counts.fail,
          " failed · ",
          counts.skip,
          " skipped · ",
          formatElapsed(elapsed),
          " total"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                @keyframes smokeRunnerPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.4; transform: scale(0.85); }
                }
                @keyframes smokeRunnerBlink {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0; }
                }
            ` })
  ] });
}
const STATUS = {
  IDLE: "idle",
  RUNNING: "running",
  PASSED: "passed",
  FAILED: "failed"
};
const POLL_INTERVAL_MS = 800;
const LINE_COLORS = {
  pass: "#10b981",
  // emerald
  fail: "#ef4444",
  // red
  skip: "#f59e0b",
  // amber
  suite: "#a78bfa",
  // violet
  summary: "#f1f5f9",
  // near-white
  duration: "#475569",
  // muted
  error: "#f87171",
  // light red
  trace: "#64748b",
  // slate
  divider: "#1e293b",
  // divider
  info: "#94a3b8"
  // default slate
};
function parseLine(raw) {
  const line = raw.trim();
  if (!line || line === "STARTED") return null;
  if (line.startsWith("EXIT_CODE:")) return null;
  if (line.includes("✓") || line.match(/^\s*PASS\s/)) return { type: "pass", text: line };
  if (line.includes("⨯") || line.includes("✗")) return { type: "fail", text: line };
  if (line.match(/^\s*-\s/)) return { type: "skip", text: line };
  if (line.match(/^\s*(PASS|FAIL)\s+/)) return { type: "suite", text: line };
  if (line.startsWith("Tests:")) return { type: "summary", text: line };
  if (line.startsWith("Duration:")) return { type: "duration", text: line };
  if (line.startsWith("●") || line.includes("FAILED")) return { type: "error", text: line };
  if (line.match(/^\s+at\s+/) || line.match(/^\s+\d+\s/)) return { type: "trace", text: line };
  if (line.match(/^[─━═]+$/)) return { type: "divider", text: line };
  return { type: "info", text: line };
}
function RunnerStatusBadge({ status }) {
  const configs = {
    [STATUS.IDLE]: { color: "#64748b", bg: "rgba(100,116,139,0.1)", label: "Idle" },
    [STATUS.RUNNING]: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Running…" },
    [STATUS.PASSED]: { color: "#10b981", bg: "rgba(16,185,129,0.1)", label: "All Passed" },
    [STATUS.FAILED]: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Failed" }
  };
  const c = configs[status];
  return /* @__PURE__ */ jsxs("span", { style: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 10px",
    borderRadius: "20px",
    background: c.bg,
    color: c.color,
    fontSize: "0.72rem",
    fontWeight: 600,
    letterSpacing: "0.04em"
  }, children: [
    /* @__PURE__ */ jsx("span", { style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: c.color,
      animation: status === STATUS.RUNNING ? "demoRunnerPulse 1.2s infinite" : "none"
    } }),
    c.label
  ] });
}
function RunnerLineRow({ item, index }) {
  const color = LINE_COLORS[item.type] || LINE_COLORS.info;
  const isHighlight = item.type === "pass" || item.type === "fail" || item.type === "summary";
  return /* @__PURE__ */ jsxs("div", { style: {
    color,
    padding: isHighlight ? "1px 0" : "0",
    lineHeight: "1.65",
    wordBreak: "break-all",
    opacity: item.type === "divider" ? 0.3 : 1
  }, children: [
    item.type === "pass" && /* @__PURE__ */ jsx("span", { style: { color: "#10b981", marginRight: 4 }, children: "✓" }),
    item.type === "fail" && /* @__PURE__ */ jsx("span", { style: { color: "#ef4444", marginRight: 4 }, children: "✗" }),
    item.type === "skip" && /* @__PURE__ */ jsx("span", { style: { color: "#f59e0b", marginRight: 4 }, children: "–" }),
    item.text.replace(/^[✓✗⨯]\s*/, "")
  ] });
}
const ROLE_COLORS = {
  owner: "#f59e0b",
  admin: "#6366f1",
  manager: "#8b5cf6",
  cashier: "#10b981",
  accountant: "#3b82f6",
  purchasing_officer: "#ec4899",
  viewer: "#64748b"
};
function StatCard({ label, value, icon: Icon, color = "#6366f1", sub }) {
  return /* @__PURE__ */ jsxs("div", { style: {
    background: "linear-gradient(135deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.45) 100%)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: 14,
    backdropFilter: "blur(12px)",
    boxShadow: "0 4px 16px 0 rgba(0, 0, 0, 0.15)"
  }, children: [
    /* @__PURE__ */ jsx("div", { style: {
      width: 40,
      height: 40,
      borderRadius: 10,
      background: color + "18",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0
    }, children: /* @__PURE__ */ jsx(Icon, { size: 18, style: { color } }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 22, fontWeight: 700, color: "#f8fafc", lineHeight: 1 }, children: value ?? "—" }),
      /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: "#94a3b8", marginTop: 3 }, children: label }),
      sub && /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: "#64748b", marginTop: 2 }, children: sub })
    ] })
  ] });
}
function DemoStoreTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [selectedModules, setSelectedModules] = useState({
    products: true,
    sales: true,
    purchases: true,
    expenses: true,
    parties: true,
    proposals: true
  });
  const [runnerStatus, setRunnerStatus] = useState(STATUS.IDLE);
  const [runnerLines, setRunnerLines] = useState([]);
  const [runnerElapsed, setRunnerElapsed] = useState(0);
  const [runnerCounts, setRunnerCounts] = useState({ pass: 0, fail: 0, skip: 0 });
  const [activeTestTab, setActiveTestTab] = useState("page-health");
  const runnerPollRef = useRef(null);
  const runnerTimerRef = useRef(null);
  const runnerJobRef = useRef(null);
  const runnerTermRef = useRef(null);
  const [deployStatus, setDeployStatus] = useState(STATUS.IDLE);
  const [deployLines, setDeployLines] = useState([]);
  const [deployElapsed, setDeployElapsed] = useState(0);
  const deployPollRef = useRef(null);
  const deployTimerRef = useRef(null);
  const deployJobRef = useRef(null);
  const deployTermRef = useRef(null);
  useEffect(() => {
    if (runnerTermRef.current) {
      runnerTermRef.current.scrollTop = runnerTermRef.current.scrollHeight;
    }
  }, [runnerLines]);
  useEffect(() => {
    if (deployTermRef.current) {
      deployTermRef.current.scrollTop = deployTermRef.current.scrollHeight;
    }
  }, [deployLines]);
  useEffect(() => () => {
    clearInterval(runnerPollRef.current);
    clearInterval(runnerTimerRef.current);
    clearInterval(deployPollRef.current);
    clearInterval(deployTimerRef.current);
  }, []);
  const fetchStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(route("platform.demo-store.status"), {
        headers: { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" }
      });
      const json = await res.json();
      setData(json);
    } catch (e) {
      setMsg({ type: "error", text: "Failed to load demo store status." });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);
  const handleReset = async () => {
    if (!confirm("Quick reset the demo store? This will re-run seeders (~15 seconds).")) return;
    setResetting(true);
    try {
      await fetch(route("platform.demo-store.reset"), {
        method: "POST",
        headers: {
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      });
      setMsg({ type: "success", text: "✅ Demo store reset initiated. Data will refresh in ~15 seconds." });
      setTimeout(fetchStatus, 16e3);
    } catch {
      setMsg({ type: "error", text: "Reset failed. Check server logs." });
    } finally {
      setResetting(false);
    }
  };
  const startDeployElapsedTimer = () => {
    setDeployElapsed(0);
    deployTimerRef.current = setInterval(() => setDeployElapsed((s) => s + 1), 1e3);
  };
  const stopDeployAll = () => {
    clearInterval(deployPollRef.current);
    clearInterval(deployTimerRef.current);
  };
  const pollDeploy = useCallback(async (jobId) => {
    try {
      const res = await fetch(route("platform.demo-store.deploy.status", { jobId }), {
        headers: { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" }
      });
      const resData = await res.json();
      const parsed = (resData.lines || []).map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "STARTED" || trimmed.startsWith("EXIT_CODE:")) return null;
        let type = "info";
        if (trimmed.includes("✓") || trimmed.includes("✅") || trimmed.includes("complete") || trimmed.includes("Complete")) type = "pass";
        if (trimmed.includes("failed") || trimmed.includes("⚠️")) type = "fail";
        return { type, text: trimmed };
      }).filter(Boolean);
      setDeployLines(parsed);
      if (resData.done) {
        stopDeployAll();
        setDeployStatus(resData.passed ? STATUS.PASSED : STATUS.FAILED);
        setDeploying(false);
        fetchStatus();
        setTimeout(() => {
          fetch(route("platform.demo-store.deploy.cleanup", { jobId }), {
            method: "DELETE",
            headers: {
              "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
              "Accept": "application/json",
              "X-Requested-With": "XMLHttpRequest"
            }
          }).catch(() => {
          });
        }, 6e4);
      }
    } catch {
      stopDeployAll();
      setDeployStatus(STATUS.FAILED);
      setDeploying(false);
      setDeployLines((prev) => [...prev, { type: "error", text: "Lost connection to deploy process." }]);
    }
  }, [fetchStatus]);
  const handleDeploy = async () => {
    const activeModules = data?.exists ? Object.keys(selectedModules).filter((k) => selectedModules[k]) : Object.keys(selectedModules);
    if (activeModules.length === 0) {
      alert("Please select at least one module to seed!");
      return;
    }
    const isFull = activeModules.length === Object.keys(selectedModules).length;
    const confirmMsg = isFull ? "🚀 Run FULL DEPLOY? This wipes all demo data and re-seeds 5 years of history.\nThis takes 60–120 seconds." : `🚀 Run SELECTIVE DEPLOY? This will seed: ${activeModules.join(", ")}.
This takes 10–30 seconds.`;
    if (!confirm(confirmMsg)) return;
    setDeploying(true);
    setDeployStatus(STATUS.RUNNING);
    setDeployLines([]);
    startDeployElapsedTimer();
    setMsg({
      type: "info",
      text: isFull ? "🚀 Full deploy started. Streaming logs below..." : `🚀 Selective deploy started for: ${activeModules.join(", ")}. Streaming logs below...`
    });
    try {
      const queryParams = isFull ? "" : `?only=${activeModules.join(",")}`;
      const res = await fetch(route("platform.demo-store.deploy") + queryParams, {
        method: "POST",
        headers: {
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      });
      const resJson = await res.json();
      deployJobRef.current = resJson.job_id;
      deployPollRef.current = setInterval(() => pollDeploy(resJson.job_id), 1e3);
    } catch {
      stopDeployAll();
      setDeploying(false);
      setDeployStatus(STATUS.FAILED);
      setDeployLines([{ type: "error", text: "Failed to start demo deploy process." }]);
    }
  };
  const startElapsedTimer = () => {
    setRunnerElapsed(0);
    runnerTimerRef.current = setInterval(() => setRunnerElapsed((s) => s + 1), 1e3);
  };
  const stopAll = () => {
    clearInterval(runnerPollRef.current);
    clearInterval(runnerTimerRef.current);
  };
  const countLines = (parsed) => ({
    pass: parsed.filter((l) => l.type === "pass").length,
    fail: parsed.filter((l) => l.type === "fail").length,
    skip: parsed.filter((l) => l.type === "skip").length
  });
  const poll = useCallback(async (jobId) => {
    try {
      const res = await fetch(route("platform.demo-store.tests.status", { jobId }), {
        headers: { "Accept": "application/json", "X-Requested-With": "XMLHttpRequest" }
      });
      const data2 = await res.json();
      const parsed = (data2.lines || []).map(parseLine).filter(Boolean);
      setRunnerLines(parsed);
      setRunnerCounts(countLines(parsed));
      if (data2.done) {
        stopAll();
        setRunnerStatus(data2.passed ? STATUS.PASSED : STATUS.FAILED);
        setTimeout(() => {
          fetch(route("platform.demo-store.tests.cleanup", { jobId }), {
            method: "DELETE",
            headers: {
              "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
              "Accept": "application/json",
              "X-Requested-With": "XMLHttpRequest"
            }
          }).catch(() => {
          });
        }, 6e4);
      }
    } catch {
      stopAll();
      setRunnerStatus(STATUS.FAILED);
      setRunnerLines((prev) => [...prev, { type: "error", text: "Lost connection to page health test runner." }]);
    }
  }, []);
  const runPageTests = async () => {
    setRunnerStatus(STATUS.RUNNING);
    setRunnerLines([]);
    setRunnerCounts({ pass: 0, fail: 0, skip: 0 });
    startElapsedTimer();
    try {
      const res = await fetch(route("platform.demo-store.tests.run"), {
        method: "POST",
        headers: {
          "X-CSRF-TOKEN": document.querySelector('meta[name="csrf-token"]')?.content ?? "",
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      });
      const data2 = await res.json();
      if (!res.ok || !data2.job_id) {
        stopAll();
        setRunnerStatus(STATUS.FAILED);
        setRunnerLines([{ type: "error", text: data2.error || "Failed to start page health test runner." }]);
        return;
      }
      runnerJobRef.current = data2.job_id;
      runnerPollRef.current = setInterval(() => poll(data2.job_id), POLL_INTERVAL_MS);
    } catch (e) {
      stopAll();
      setRunnerStatus(STATUS.FAILED);
      setRunnerLines([{
        type: "error",
        text: "Failed to start page health test runner."
      }]);
    }
  };
  const resetRunner = () => {
    stopAll();
    setRunnerStatus(STATUS.IDLE);
    setRunnerLines([]);
    setRunnerCounts({ pass: 0, fail: 0, skip: 0 });
    setRunnerElapsed(0);
    runnerJobRef.current = null;
  };
  const copyLogsToClipboard = () => {
    const textToCopy = runnerLines.map((l) => l.text).join("\n");
    navigator.clipboard.writeText(textToCopy);
  };
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", height: 240, gap: 10, color: "#94a3b8" }, children: [
      /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "animate-spin" }),
      /* @__PURE__ */ jsx("span", { children: "Loading demo store status..." })
    ] });
  }
  if (!data?.exists) {
    return /* @__PURE__ */ jsxs("div", { style: { maxWidth: "600px", margin: "40px auto", display: "flex", flexDirection: "column", gap: 20 }, children: [
      /* @__PURE__ */ jsxs("div", { style: {
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.6) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 16,
        padding: "32px",
        textAlign: "center",
        color: "#64748b",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.25)",
        backdropFilter: "blur(16px)"
      }, children: [
        /* @__PURE__ */ jsx(Monitor, { size: 40, style: { margin: "0 auto 16px", color: "#6366f1", opacity: 0.8 } }),
        /* @__PURE__ */ jsx("h3", { style: { fontWeight: 700, fontSize: "1.25rem", color: "#f8fafc", marginBottom: 8 }, children: "No Demo Store Found" }),
        /* @__PURE__ */ jsxs("p", { style: { fontSize: 14, color: "#94a3b8", marginBottom: 24 }, children: [
          "No tenant with ",
          /* @__PURE__ */ jsx("code", { children: "is_demo = true" }),
          " exists yet."
        ] }),
        deployStatus === STATUS.IDLE ? /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleDeploy,
            disabled: deploying,
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 28px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: "#6366f1",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s",
              margin: "0 auto"
            },
            children: [
              /* @__PURE__ */ jsx(Zap, { size: 14 }),
              "Create & Deploy Demo Store"
            ]
          }
        ) : /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "#cbd5e1", fontSize: 14, fontWeight: 600 }, children: [
          /* @__PURE__ */ jsx(RefreshCw, { size: 16, className: "animate-spin", style: { color: "#6366f1" } }),
          /* @__PURE__ */ jsx("span", { children: "Deploying Demo Store..." }),
          /* @__PURE__ */ jsxs("span", { style: { color: "#64748b", fontWeight: 400, marginLeft: 6 }, children: [
            "⏱ ",
            deployElapsed < 60 ? `${deployElapsed}s` : `${Math.floor(deployElapsed / 60)}m ${deployElapsed % 60}s`
          ] })
        ] })
      ] }),
      deployLines.length > 0 && /* @__PURE__ */ jsxs("div", { style: {
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(12px)",
        border: `1px solid ${deployStatus === STATUS.RUNNING ? "#f59e0b" : deployStatus === STATUS.PASSED ? "#10b981" : "#ef4444"}`,
        borderRadius: "16px",
        padding: "20px 24px",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        gap: 12
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 700, color: "#f8fafc" }, children: "🛠️ Seeding Logs" }),
          /* @__PURE__ */ jsxs("span", { style: {
            fontSize: 11,
            fontWeight: 600,
            color: deployStatus === STATUS.RUNNING ? "#f59e0b" : deployStatus === STATUS.PASSED ? "#10b981" : "#ef4444",
            display: "inline-flex",
            alignItems: "center",
            gap: 4
          }, children: [
            /* @__PURE__ */ jsx("span", { style: {
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: deployStatus === STATUS.RUNNING ? "#f59e0b" : deployStatus === STATUS.PASSED ? "#10b981" : "#ef4444",
              animation: deployStatus === STATUS.RUNNING ? "demoRunnerPulse 1.2s infinite" : "none"
            } }),
            deployStatus === STATUS.RUNNING ? "Running..." : deployStatus === STATUS.PASSED ? "Complete" : "Failed"
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: deployTermRef,
            style: {
              background: "#080d17",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "14px 16px",
              maxHeight: "300px",
              overflowY: "auto",
              fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
              fontSize: "0.74rem",
              lineHeight: 1.7,
              scrollbarWidth: "thin",
              scrollbarColor: "#1e293b #080d17",
              textAlign: "left"
            },
            children: [
              deployLines.map((line, i) => /* @__PURE__ */ jsx(RunnerLineRow, { item: line, index: i }, i)),
              deployStatus === STATUS.RUNNING && /* @__PURE__ */ jsx("span", { style: {
                color: "#f59e0b",
                animation: "demoRunnerBlink 1s step-end infinite",
                fontSize: "0.9rem"
              }, children: "▌" })
            ]
          }
        )
      ] })
    ] });
  }
  const totalRoles = data.role_breakdown?.reduce((s, r) => s + r.total, 0) || 1;
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 24 }, children: [
    msg && /* @__PURE__ */ jsxs("div", { style: {
      padding: "12px 16px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 500,
      background: msg.type === "error" ? "#fef2f2" : msg.type === "success" ? "#f0fdf4" : "#eff6ff",
      color: msg.type === "error" ? "#dc2626" : msg.type === "success" ? "#16a34a" : "#2563eb",
      border: `1px solid ${msg.type === "error" ? "#fca5a5" : msg.type === "success" ? "#86efac" : "#93c5fd"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }, children: [
      /* @__PURE__ */ jsx("span", { children: msg.text }),
      /* @__PURE__ */ jsx("button", { onClick: () => setMsg(null), style: { background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: 18 }, children: "×" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 12,
      padding: "16px 20px",
      borderRadius: 14,
      background: "linear-gradient(135deg, rgba(30, 41, 59, 0.45) 0%, rgba(15, 23, 42, 0.6) 100%)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.25)"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12 }, children: [
        /* @__PURE__ */ jsx("div", { style: { width: 44, height: 44, borderRadius: 12, background: "#6366f118", display: "flex", alignItems: "center", justifyContent: "center" }, children: /* @__PURE__ */ jsx(Monitor, { size: 20, style: { color: "#6366f1" } }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 16, color: "#f8fafc" }, children: [
            "🎭 Demo Store",
            /* @__PURE__ */ jsxs("span", { style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 20,
              background: data.status === "active" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
              color: data.status === "active" ? "#10b981" : "#f59e0b",
              border: `1px solid ${data.status === "active" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)"}`
            }, children: [
              /* @__PURE__ */ jsx("span", { style: { width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" } }),
              data.status === "active" ? "LIVE" : data.status?.toUpperCase()
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: "#94a3b8", marginTop: 2 }, children: [
            "venqore.com/demo · Last reset: ",
            data.last_reset_at
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "/demo",
            target: "_blank",
            rel: "noreferrer",
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 9,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "#cbd5e1",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              cursor: "pointer"
            },
            children: [
              /* @__PURE__ */ jsx(Globe, { size: 13 }),
              " View Demo"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleReset,
            disabled: resetting || deploying || runnerStatus === STATUS.RUNNING,
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 9,
              border: "1px solid rgba(255, 255, 255, 0.08)",
              background: "rgba(255, 255, 255, 0.04)",
              color: "#cbd5e1",
              fontSize: 13,
              fontWeight: 600,
              cursor: resetting || deploying || runnerStatus === STATUS.RUNNING ? "not-allowed" : "pointer",
              opacity: resetting || deploying || runnerStatus === STATUS.RUNNING ? 0.6 : 1
            },
            children: [
              /* @__PURE__ */ jsx(RotateCcw, { size: 13, className: resetting ? "animate-spin" : "" }),
              resetting ? "Resetting..." : "Quick Reset"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleDeploy,
            disabled: deploying || resetting || runnerStatus === STATUS.RUNNING,
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 9,
              border: "none",
              background: deploying ? "#818cf8" : "#6366f1",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: deploying || resetting || runnerStatus === STATUS.RUNNING ? "not-allowed" : "pointer",
              opacity: deploying || resetting || runnerStatus === STATUS.RUNNING ? 0.6 : 1,
              boxShadow: "0 2px 8px #6366f140"
            },
            children: [
              /* @__PURE__ */ jsx(Zap, { size: 13, className: deploying ? "animate-pulse" : "" }),
              deploying ? "Deploying..." : Object.values(selectedModules).every((v) => v) ? "🚀 Full Deploy (5-Year Data)" : "🚀 Deploy Selected Data"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: runPageTests,
            disabled: runnerStatus === STATUS.RUNNING || deploying || resetting || data?.pest_available === false,
            title: data?.pest_available === false ? "Unavailable: vendor/bin/pest not installed on this server (expected on production --no-dev deploys)." : void 0,
            style: {
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 9,
              border: "none",
              background: data?.pest_available === false ? "#475569" : runnerStatus === STATUS.RUNNING ? "#f59e0b" : "#10b981",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: runnerStatus === STATUS.RUNNING || deploying || resetting || data?.pest_available === false ? "not-allowed" : "pointer",
              opacity: runnerStatus === STATUS.RUNNING || deploying || resetting || data?.pest_available === false ? 0.6 : 1,
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)"
            },
            children: [
              /* @__PURE__ */ jsx(Play, { size: 13, className: runnerStatus === STATUS.RUNNING ? "animate-spin" : "" }),
              data?.pest_available === false ? "🧪 Tests Unavailable" : runnerStatus === STATUS.RUNNING ? "Testing..." : "🧪 Run Page Tests"
            ]
          }
        )
      ] })
    ] }),
    deployStatus !== STATUS.IDLE && /* @__PURE__ */ jsxs("div", { style: {
      background: "rgba(15, 23, 42, 0.65)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: `1px solid ${deployStatus === STATUS.RUNNING ? "#f59e0b" : deployStatus === STATUS.PASSED ? "#10b981" : "#ef4444"}`,
      borderRadius: "16px",
      padding: "20px 24px",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)"
    }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: 12 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
          /* @__PURE__ */ jsx("div", { style: {
            width: 38,
            height: 38,
            borderRadius: "10px",
            background: "rgba(99, 102, 241, 0.12)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.1rem"
          }, children: "🚀" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { style: { color: "#f8fafc", margin: 0, fontSize: "0.95rem", fontWeight: 700 }, children: "Demo Store Seeding & Deploy Logs" }),
            /* @__PURE__ */ jsx("p", { style: { color: "#94a3b8", margin: "2px 0 0", fontSize: "0.75rem" }, children: "Wiping and seeding data modules in real-time" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
          deployStatus === STATUS.RUNNING && /* @__PURE__ */ jsxs("span", { style: { color: "#64748b", fontSize: "0.78rem", fontVariantNumeric: "tabular-nums" }, children: [
            "⏱ ",
            deployElapsed < 60 ? `${deployElapsed}s` : `${Math.floor(deployElapsed / 60)}m ${deployElapsed % 60}s`
          ] }),
          deployStatus !== STATUS.RUNNING && /* @__PURE__ */ jsx("button", { onClick: () => setDeployStatus(STATUS.IDLE), style: {
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "#cbd5e1",
            padding: "6px 14px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "0.78rem",
            fontWeight: 500,
            transition: "all 0.2s"
          }, children: "Dismiss" }),
          /* @__PURE__ */ jsxs("span", { style: {
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "5px 12px",
            borderRadius: "20px",
            background: deployStatus === STATUS.RUNNING ? "rgba(245,158,11,0.1)" : deployStatus === STATUS.PASSED ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
            color: deployStatus === STATUS.RUNNING ? "#f59e0b" : deployStatus === STATUS.PASSED ? "#10b981" : "#ef4444",
            fontSize: "0.72rem",
            fontWeight: 600
          }, children: [
            /* @__PURE__ */ jsx("span", { style: {
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: deployStatus === STATUS.RUNNING ? "#f59e0b" : deployStatus === STATUS.PASSED ? "#10b981" : "#ef4444",
              animation: deployStatus === STATUS.RUNNING ? "demoRunnerPulse 1.2s infinite" : "none"
            } }),
            deployStatus === STATUS.RUNNING ? "Deploying..." : deployStatus === STATUS.PASSED ? "Completed" : "Failed"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "div",
        {
          ref: deployTermRef,
          style: {
            background: "#080d17",
            border: "1px solid #1e293b",
            borderRadius: "10px",
            padding: "14px 16px",
            maxHeight: "300px",
            overflowY: "auto",
            fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
            fontSize: "0.74rem",
            lineHeight: 1.7
          },
          children: [
            deployLines.map((line, i) => /* @__PURE__ */ jsx(RunnerLineRow, { item: line, index: i }, i)),
            deployStatus === STATUS.RUNNING && /* @__PURE__ */ jsx("span", { style: {
              color: "#f59e0b",
              animation: "demoRunnerBlink 1s step-end infinite",
              fontSize: "0.9rem"
            }, children: "▌" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 12 }, children: [
      /* @__PURE__ */ jsx(StatCard, { label: "Live Right Now", value: data.live_now, icon: Activity, color: "#10b981", sub: "Active demo sessions" }),
      /* @__PURE__ */ jsx(StatCard, { label: "Visitors Today", value: data.today?.toLocaleString(), icon: Users, color: "#6366f1" }),
      /* @__PURE__ */ jsx(StatCard, { label: "This Month", value: data.this_month?.toLocaleString(), icon: TrendingUp, color: "#8b5cf6" }),
      /* @__PURE__ */ jsx(StatCard, { label: "All Time", value: data.total_all?.toLocaleString(), icon: Globe, color: "#f59e0b" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }, children: [
      /* @__PURE__ */ jsxs("div", { style: {
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.55) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 14,
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.25)",
        padding: 20,
        color: "#f8fafc"
      }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: 14, color: "#f1f5f9", marginBottom: 16 }, children: "Daily Visitors — Last 30 Days" }),
        /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 180, children: /* @__PURE__ */ jsxs(BarChart, { data: data.visitor_chart, margin: { top: 4, right: 4, left: -20, bottom: 0 }, children: [
          /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255, 255, 255, 0.05)" }),
          /* @__PURE__ */ jsx(XAxis, { dataKey: "date", tick: { fontSize: 10, fill: "#94a3b8" }, interval: 4 }),
          /* @__PURE__ */ jsx(YAxis, { tick: { fontSize: 10, fill: "#94a3b8" } }),
          /* @__PURE__ */ jsx(Tooltip, { contentStyle: { borderRadius: 8, border: "1px solid rgba(255, 255, 255, 0.08)", background: "#0f172a", color: "#f8fafc", fontSize: 12 } }),
          /* @__PURE__ */ jsx(Bar, { dataKey: "total", fill: "#6366f1", radius: [3, 3, 0, 0], name: "Visitors" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: {
        background: "linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.55) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: 14,
        backdropFilter: "blur(16px)",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.25)",
        padding: 20,
        color: "#f8fafc"
      }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: 14, color: "#f1f5f9", marginBottom: 16 }, children: "Role Breakdown (30d)" }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
          (data.role_breakdown ?? []).map((r) => {
            const pct = Math.round(r.total / totalRoles * 100);
            const color = ROLE_COLORS[r.role] ?? "#6366f1";
            return /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }, children: [
                /* @__PURE__ */ jsx("span", { style: { fontWeight: 600, color: "#cbd5e1", textTransform: "capitalize" }, children: r.role.replace("_", " ") }),
                /* @__PURE__ */ jsxs("span", { style: { color: "#94a3b8" }, children: [
                  r.total,
                  " (",
                  pct,
                  "%)"
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { height: 6, borderRadius: 3, background: "rgba(255, 255, 255, 0.06)", overflow: "hidden" }, children: /* @__PURE__ */ jsx("div", { style: { height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.5s" } }) })
            ] }, r.role);
          }),
          (!data.role_breakdown || data.role_breakdown.length === 0) && /* @__PURE__ */ jsx("p", { style: { fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "20px 0" }, children: "No visitor data yet. Role breakdown will appear after the first demo login." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: {
      background: "linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.55) 100%)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      borderRadius: 14,
      backdropFilter: "blur(16px)",
      boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.25)",
      padding: 20,
      color: "#f8fafc"
    }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, fontSize: 14, color: "#f1f5f9", marginBottom: 16 }, children: "📦 Data Population Coverage" }),
      /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }, children: [
        { key: "products", label: "Products", icon: Package, color: "#6366f1" },
        { key: "sales", label: "Sales (5yr)", icon: TrendingUp, color: "#10b981" },
        { key: "purchases", label: "Purchases (5yr)", icon: ShoppingCart, color: "#f59e0b" },
        { key: "expenses", label: "Expenses (5yr)", icon: FileText, color: "#ef4444" },
        { key: "parties", label: "Customers/Suppliers", icon: Users, color: "#8b5cf6" },
        { key: "proposals", label: "Proposals", icon: FileText, color: "#ec4899" }
      ].map(({ key, label, icon: Icon, color }) => {
        const count = data.data_counts?.[key] ?? 0;
        const populated = count > 0;
        return /* @__PURE__ */ jsxs("div", { style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 14px",
          borderRadius: 10,
          background: populated ? color + "15" : "rgba(255, 255, 255, 0.02)",
          border: `1px solid ${populated ? color + "30" : "rgba(255, 255, 255, 0.06)"}`
        }, children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              checked: selectedModules[key],
              onChange: (e) => setSelectedModules({ ...selectedModules, [key]: e.target.checked }),
              style: {
                marginRight: 6,
                width: 14,
                height: 14,
                cursor: "pointer",
                accentColor: color
              },
              title: "Include this module in seeding"
            }
          ),
          populated ? /* @__PURE__ */ jsx(CheckCircle2, { size: 14, style: { color: "#10b981", flexShrink: 0 } }) : /* @__PURE__ */ jsx(AlertTriangle$1, { size: 14, style: { color: "#f59e0b", flexShrink: 0 } }),
          /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 12, fontWeight: 600, color: "#cbd5e1" }, children: label }),
            /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: "#94a3b8" }, children: count > 0 ? `${count.toLocaleString()} records` : "Not seeded yet" })
          ] })
        ] }, key);
      }) }),
      Object.values(data.data_counts ?? {}).every((v) => v === 0) && /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "20px 0 4px", fontSize: 13, color: "#64748b" }, children: [
        "Run ",
        /* @__PURE__ */ jsx("strong", { children: "Full Deploy" }),
        " to populate all modules with 5-year data."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 12 }, children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveTestTab("page-health"),
            style: {
              background: activeTestTab === "page-health" ? "rgba(16, 185, 129, 0.12)" : "transparent",
              color: activeTestTab === "page-health" ? "#10b981" : "#94a3b8",
              border: `1px solid ${activeTestTab === "page-health" ? "rgba(16, 185, 129, 0.2)" : "transparent"}`,
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            },
            children: "🧪 Page Health Tests"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setActiveTestTab("smoke"),
            style: {
              background: activeTestTab === "smoke" ? "rgba(99, 102, 241, 0.12)" : "transparent",
              color: activeTestTab === "smoke" ? "#818cf8" : "#94a3b8",
              border: `1px solid ${activeTestTab === "smoke" ? "rgba(99, 102, 241, 0.2)" : "transparent"}`,
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s"
            },
            children: "⚙️ Platform Smoke Tests"
          }
        )
      ] }),
      activeTestTab === "page-health" ? /* @__PURE__ */ jsxs("div", { style: {
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${runnerStatus === STATUS.RUNNING ? "#f59e0b" : runnerStatus === STATUS.PASSED ? "#10b981" : runnerStatus === STATUS.FAILED ? "#ef4444" : "rgba(255, 255, 255, 0.08)"}`,
        borderRadius: "16px",
        padding: "20px 24px",
        boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.1)",
        transition: "border-color 0.4s ease, box-shadow 0.4s ease"
      }, children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexWrap: "wrap", gap: 12 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "12px" }, children: [
            /* @__PURE__ */ jsx("div", { style: {
              width: 38,
              height: 38,
              borderRadius: "10px",
              background: "rgba(16, 185, 129, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem"
            }, children: "🧪" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }, children: [
                /* @__PURE__ */ jsx("h3", { style: { color: "#f8fafc", margin: 0, fontSize: "0.95rem", fontWeight: 700 }, children: "Demo Store Page Health Tests" }),
                /* @__PURE__ */ jsx(RunnerStatusBadge, { status: runnerStatus })
              ] }),
              /* @__PURE__ */ jsx("p", { style: { color: "#94a3b8", margin: "2px 0 0", fontSize: "0.75rem" }, children: "35+ Authenticated GET checks across all active module sections" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
            runnerStatus === STATUS.RUNNING && /* @__PURE__ */ jsxs("span", { style: { color: "#64748b", fontSize: "0.78rem", fontVariantNumeric: "tabular-nums" }, children: [
              "⏱ ",
              runnerElapsed < 60 ? `${runnerElapsed}s` : `${Math.floor(runnerElapsed / 60)}m ${runnerElapsed % 60}s`
            ] }),
            runnerStatus !== STATUS.IDLE && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx("button", { onClick: copyLogsToClipboard, style: {
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#cbd5e1",
                padding: "6px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: 500,
                transition: "all 0.2s"
              }, children: "📋 Copy Logs" }),
              /* @__PURE__ */ jsx("button", { onClick: resetRunner, style: {
                background: "transparent",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: "#cbd5e1",
                padding: "6px 14px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.78rem",
                fontWeight: 500,
                transition: "all 0.2s"
              }, children: "Reset" })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: runnerStatus === STATUS.IDLE ? runPageTests : void 0,
                disabled: runnerStatus === STATUS.RUNNING || deploying || resetting,
                style: {
                  background: runnerStatus === STATUS.RUNNING ? "transparent" : runnerStatus !== STATUS.IDLE ? "transparent" : "#10b981",
                  border: `1px solid ${runnerStatus === STATUS.RUNNING ? "#f59e0b" : runnerStatus === STATUS.PASSED ? "#10b981" : runnerStatus === STATUS.FAILED ? "#ef4444" : "#10b981"}`,
                  color: runnerStatus === STATUS.RUNNING ? "#f59e0b" : runnerStatus === STATUS.PASSED ? "#10b981" : runnerStatus === STATUS.FAILED ? "#ef4444" : "#fff",
                  padding: "8px 18px",
                  borderRadius: "10px",
                  cursor: runnerStatus === STATUS.RUNNING ? "not-allowed" : "pointer",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  transition: "all 0.25s",
                  whiteSpace: "nowrap"
                },
                children: [
                  runnerStatus === STATUS.IDLE && "▶ Run Page Tests",
                  runnerStatus === STATUS.RUNNING && "⟳ Running…",
                  runnerStatus === STATUS.PASSED && "✓ All Healthy",
                  runnerStatus === STATUS.FAILED && "✗ Issues Found"
                ]
              }
            )
          ] })
        ] }),
        (runnerStatus === STATUS.RUNNING || runnerStatus !== STATUS.IDLE) && /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }, children: [
          { label: "Passed", count: runnerCounts.pass, color: "#10b981" },
          { label: "Failed", count: runnerCounts.fail, color: "#ef4444" },
          { label: "Skipped", count: runnerCounts.skip, color: "#f59e0b" }
        ].map(({ label, count, color }) => /* @__PURE__ */ jsxs("div", { style: {
          padding: "5px 14px",
          borderRadius: "8px",
          background: `${color}15`,
          border: `1px solid ${color}30`,
          color,
          fontSize: "0.76rem",
          fontWeight: 600
        }, children: [
          count,
          " ",
          label
        ] }, label)) }),
        runnerLines.length > 0 && /* @__PURE__ */ jsxs(
          "div",
          {
            ref: runnerTermRef,
            style: {
              background: "#080d17",
              border: "1px solid #1e293b",
              borderRadius: "10px",
              padding: "14px 16px",
              maxHeight: "300px",
              overflowY: "auto",
              fontFamily: '"JetBrains Mono", "Fira Code", "Courier New", monospace',
              fontSize: "0.74rem",
              lineHeight: 1.7,
              scrollbarWidth: "thin",
              scrollbarColor: "#1e293b #080d17"
            },
            children: [
              runnerLines.map((line, i) => /* @__PURE__ */ jsx(RunnerLineRow, { item: line, index: i }, i)),
              runnerStatus === STATUS.RUNNING && /* @__PURE__ */ jsx("span", { style: {
                color: "#f59e0b",
                animation: "demoRunnerBlink 1s step-end infinite",
                fontSize: "0.9rem"
              }, children: "▌" })
            ]
          }
        ),
        runnerStatus === STATUS.IDLE && runnerLines.length === 0 && /* @__PURE__ */ jsxs("div", { style: {
          border: "1px dashed #cbd5e1",
          borderRadius: "10px",
          padding: "24px",
          textAlign: "center",
          color: "#64748b",
          fontSize: "0.8rem"
        }, children: [
          "Click ",
          /* @__PURE__ */ jsx("strong", { style: { color: "#10b981" }, children: "Run Page Tests" }),
          " to initiate a live health scan of all frontend routes.",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("span", { style: { fontSize: "0.72rem", color: "#64748b", marginTop: 6, display: "block" }, children: "Simulates full Owner authentication · Scans P&L, POS, Staff, Inventory, Sales, CRM and 30+ pages" })
        ] }),
        runnerStatus !== STATUS.IDLE && runnerStatus !== STATUS.RUNNING && /* @__PURE__ */ jsxs("div", { style: {
          marginTop: "14px",
          padding: "12px 18px",
          borderRadius: "10px",
          background: runnerStatus === STATUS.PASSED ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
          border: `1px solid ${runnerStatus === STATUS.PASSED ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: "1.1rem" }, children: runnerStatus === STATUS.PASSED ? "✅" : "🔴" }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { style: {
              color: runnerStatus === STATUS.PASSED ? "#10b981" : "#ef4444",
              fontSize: "0.84rem",
              fontWeight: 600
            }, children: runnerStatus === STATUS.PASSED ? "All page checks passed — the platform is 100% stable." : "Page issues detected — some sections returned non-200 responses." }),
            /* @__PURE__ */ jsxs("div", { style: { color: "#64748b", fontSize: "0.72rem", marginTop: "2px" }, children: [
              runnerCounts.pass,
              " passed · ",
              runnerCounts.fail,
              " failed · ",
              runnerCounts.skip,
              " skipped · ",
              runnerElapsed < 60 ? `${runnerElapsed}s` : `${Math.floor(runnerElapsed / 60)}m ${runnerElapsed % 60}s`,
              " total"
            ] })
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsx(SmokeTestRunner, {})
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                @keyframes demoRunnerPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%       { opacity: 0.4; transform: scale(0.85); }
                }
                @keyframes demoRunnerBlink {
                    0%, 100% { opacity: 1; }
                    50%       { opacity: 0; }
                }
            ` })
  ] });
}
function RevenueView({ revenue = {}, stats = {}, payout_pool = {} }) {
  const t = useT();
  const planMrr = revenue.plan_mrr || [];
  const [partnerName, setPartnerName] = useState("");
  const [partnerRole, setPartnerRole] = useState("");
  const [partnerEquity, setPartnerEquity] = useState("");
  const [drawPartnerId, setDrawPartnerId] = useState("");
  const [drawAmount, setDrawAmount] = useState("");
  const [drawDescription, setDrawDescription] = useState("");
  const [months, setMonths] = useState(payout_pool.months || 1);
  const handleMonthsChange = (val) => {
    const m = Math.max(1, parseInt(val) || 1);
    setMonths(m);
    router.visit(window.route("platform.dashboard"), {
      data: { view: "revenue", months: m },
      preserveState: true,
      preserveScroll: true
    });
  };
  const addPartner = (e) => {
    e.preventDefault();
    router.post(window.route("platform.partners.store"), {
      name: partnerName,
      role: partnerRole,
      equity_pct: partnerEquity
    }, {
      onSuccess: () => {
        setPartnerName("");
        setPartnerRole("");
        setPartnerEquity("");
      },
      preserveScroll: true
    });
  };
  const removePartner = (id) => {
    if (confirm("Are you sure you want to remove this partner?")) {
      router.delete(window.route("platform.partners.destroy", id), {
        preserveScroll: true
      });
    }
  };
  const logDrawing = (e) => {
    e.preventDefault();
    router.post(window.route("platform.drawings.store"), {
      partner_id: drawPartnerId,
      amount: drawAmount,
      description: drawDescription
    }, {
      onSuccess: () => {
        setDrawPartnerId("");
        setDrawAmount("");
        setDrawDescription("");
      },
      preserveScroll: true
    });
  };
  const clearAllDrawings = () => {
    const passcode = prompt("Enter your action passcode to confirm clearing drawings:");
    if (passcode) {
      router.post(window.route("platform.drawings.clear-history"), { passcode }, {
        preserveScroll: true
      });
    }
  };
  const totalEquityAllocated = payout_pool.total_equity_allocated || 0;
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
    /* @__PURE__ */ jsx(Header, { icon: DollarSign, accent: BRAND.emerald, title: "Revenue & Dividends", subtitle: "Real paid-subscription income — computed server-side, internal & demo excluded." }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,210px),1fr))", gap: 14 }, children: [
      /* @__PURE__ */ jsx(KpiCard, { label: "MRR", value: fmtCurrency(revenue.mrr), icon: DollarSign, accent: BRAND.emerald, gradient: GRADIENTS.revenue, footnote: "Monthly recurring revenue" }),
      /* @__PURE__ */ jsx(KpiCard, { label: "ARR", value: fmtCurrency(revenue.arr), icon: TrendingUp, accent: BRAND.indigo, footnote: "Annual run-rate" }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Net Revenue", value: fmtCurrency(revenue.net_revenue), icon: Banknote, accent: BRAND.violet, footnote: "After est. gateway fees" }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Paid Subscribers", value: fmtNumber(revenue.paid_count), icon: CreditCard, accent: BRAND.sky, footnote: "Active paying stores" })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,300px),1fr))", gap: 20 }, children: [
      /* @__PURE__ */ jsxs(Panel, { pad: 0, children: [
        /* @__PURE__ */ jsx("div", { style: { padding: "16px 18px", borderBottom: `1px solid ${t.border}`, fontSize: 15, fontWeight: 800, color: t.ink }, children: "MRR by Plan" }),
        planMrr.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: DollarSign, title: "No paid subscriptions yet", message: "Once stores subscribe to a paid plan, their MRR contribution appears here." }) : /* @__PURE__ */ jsx("div", { style: { padding: 12 }, children: planMrr.map((p) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 10px", borderRadius: 11 }, className: "vq-row", children: [
          /* @__PURE__ */ jsx("span", { style: { flex: 1, fontSize: 13.5, fontWeight: 700, color: t.ink, textTransform: "capitalize" }, children: p.plan }),
          /* @__PURE__ */ jsxs("span", { style: { fontSize: 12.5, color: t.muted }, children: [
            p.count,
            " subs"
          ] }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 800, color: BRAND.emerald, minWidth: 80, textAlign: "right" }, children: fmtCurrency(p.mrr) })
        ] }, p.plan)) })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
          /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, color: t.ink, fontSize: 15 }, children: "Cumulative Dividends Pool" }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }, children: [
            /* @__PURE__ */ jsx("span", { style: { color: t.muted, fontWeight: 700 }, children: "Months:" }),
            /* @__PURE__ */ jsx("input", { type: "number", min: "1", max: "24", value: months, onChange: (e) => handleMonthsChange(e.target.value), style: { width: 55, padding: "6px 8px", borderRadius: 8, background: t.inputBg, border: `1px solid ${t.border}`, color: BRAND.indigo2, fontWeight: 800, textAlign: "center", outline: "none" } })
          ] })
        ] }),
        totalEquityAllocated > 100 && /* @__PURE__ */ jsxs("div", { style: { padding: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#f87171", fontSize: 12, display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }, children: [
          /* @__PURE__ */ jsx(AlertTriangle, { size: 15, style: { flexShrink: 0 } }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("strong", { children: "Warning:" }),
            " Total equity allocation is ",
            /* @__PURE__ */ jsxs("strong", { children: [
              totalEquityAllocated,
              "%"
            ] }),
            ", which exceeds 100%! Payout projects will exceed net profit pool."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: t.panel2, borderRadius: 10 }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: t.muted, fontWeight: 700, textTransform: "uppercase" }, children: "Monthly Net Pool" }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 900, color: BRAND.emerald }, children: fmtCurrency(payout_pool.net_mrr_pkr || 0, "PKR") })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: t.panel2, borderRadius: 10 }, children: [
            /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, color: t.muted, fontWeight: 700, textTransform: "uppercase" }, children: [
              "Cumulative Pot (",
              months,
              " mo)"
            ] }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 900, color: BRAND.indigo }, children: fmtCurrency(payout_pool.cumulative_payout_pot || 0, "PKR") })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: t.panel2, borderRadius: 10 }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: t.muted, fontWeight: 700, textTransform: "uppercase" }, children: "Unallocated Surplus" }),
            /* @__PURE__ */ jsxs("span", { style: { fontSize: 14, fontWeight: 900, color: t.ink }, children: [
              Math.max(0, 100 - totalEquityAllocated),
              "%"
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,320px),1fr))", gap: 20 }, children: [
      /* @__PURE__ */ jsxs(Panel, { pad: 18, children: [
        /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, color: t.ink, fontSize: 15, marginBottom: 14 }, children: "Equity Partner Profiles" }),
        !payout_pool.profiles || payout_pool.profiles.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: DollarSign, title: "No partners registered", message: "Add partners on the right to build the equity distribution list." }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: payout_pool.profiles.map((p) => /* @__PURE__ */ jsxs("div", { style: { background: t.panel2, borderRadius: 14, padding: 14, border: `1px solid ${t.border}`, position: "relative" }, children: [
          /* @__PURE__ */ jsx("button", { onClick: () => removePartner(p.id), style: { position: "absolute", top: 14, right: 14, background: "none", border: "none", color: BRAND.rose, cursor: "pointer" }, "aria-label": "Delete partner", children: /* @__PURE__ */ jsx(X, { size: 15 }) }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }, children: [
            /* @__PURE__ */ jsx("div", { style: { width: 32, height: 32, borderRadius: "50%", background: `${BRAND.indigo}1f`, color: BRAND.indigo2, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12 }, children: p.name.charAt(0).toUpperCase() }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, color: t.ink, fontSize: 13.5 }, children: p.name }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: t.muted }, children: p.role })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, borderTop: `1px solid ${t.border}`, paddingTop: 10, fontSize: 11.5, fontFamily: "monospace" }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("span", { style: { color: t.muted, fontSize: 10, display: "block", marginBottom: 2 }, children: [
                "Share (",
                p.equity_pct,
                "%)"
              ] }),
              /* @__PURE__ */ jsx("span", { style: { fontWeight: 800, color: t.ink }, children: fmtCurrency(p.total_share, "PKR") })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { style: { color: t.muted, fontSize: 10, display: "block", marginBottom: 2 }, children: "Amount Drawn" }),
              /* @__PURE__ */ jsx("span", { style: { fontWeight: 800, color: BRAND.amber }, children: fmtCurrency(p.total_drawn, "PKR") })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { style: { color: t.muted, fontSize: 10, display: "block", marginBottom: 2 }, children: "Remaining" }),
              /* @__PURE__ */ jsx("span", { style: { fontWeight: 900, color: p.remaining >= 0 ? BRAND.emerald : BRAND.rose }, children: fmtCurrency(p.remaining, "PKR") })
            ] })
          ] })
        ] }, p.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
        /* @__PURE__ */ jsxs(Panel, { children: [
          /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, color: t.ink, fontSize: 14, marginBottom: 12 }, children: "Register New Partner" }),
          /* @__PURE__ */ jsxs("form", { onSubmit: addPartner, style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
            /* @__PURE__ */ jsx(Field, { label: "Full Name", children: /* @__PURE__ */ jsx(Input, { value: partnerName, onChange: (e) => setPartnerName(e.target.value), placeholder: "Full Name", required: true }) }),
            /* @__PURE__ */ jsx(Field, { label: "Role", children: /* @__PURE__ */ jsx(Input, { value: partnerRole, onChange: (e) => setPartnerRole(e.target.value), placeholder: "e.g. VP Marketing", required: true }) }),
            /* @__PURE__ */ jsx(Field, { label: "Equity Share (%)", children: /* @__PURE__ */ jsx(Input, { type: "number", step: "0.1", value: partnerEquity, onChange: (e) => setPartnerEquity(e.target.value), placeholder: "Equity Share Percentage", required: true }) }),
            /* @__PURE__ */ jsx(Button, { type: "submit", children: "Add Partner" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(Panel, { children: [
          /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, color: t.ink, fontSize: 14, marginBottom: 12 }, children: "Log Partner Drawing" }),
          /* @__PURE__ */ jsxs("form", { onSubmit: logDrawing, style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
            /* @__PURE__ */ jsx(Field, { label: "Select Partner", children: /* @__PURE__ */ jsx(
              Select,
              {
                value: drawPartnerId,
                onChange: (e) => setDrawPartnerId(e.target.value),
                options: [
                  { value: "", label: "Select Partner..." },
                  ...(payout_pool.profiles || []).map((p) => ({ value: String(p.id), label: `${p.name} (${p.equity_pct}%)` }))
                ],
                required: true
              }
            ) }),
            /* @__PURE__ */ jsx(Field, { label: "Draw Amount (PKR)", children: /* @__PURE__ */ jsx(Input, { type: "number", value: drawAmount, onChange: (e) => setDrawAmount(e.target.value), placeholder: "Draw Amount", required: true }) }),
            /* @__PURE__ */ jsx(Field, { label: "Description", children: /* @__PURE__ */ jsx(Input, { value: drawDescription, onChange: (e) => setDrawDescription(e.target.value), placeholder: "e.g. Q1 Dividend" }) }),
            /* @__PURE__ */ jsx(Button, { type: "submit", variant: "secondary", style: { color: BRAND.amber, borderColor: BRAND.amber }, children: "Record Payout" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { pad: 0, children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: `1px solid ${t.border}` }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontWeight: 800, color: t.ink, fontSize: 15 }, children: "Drawing Transaction Logs" }),
        payout_pool.drawings && payout_pool.drawings.length > 0 && /* @__PURE__ */ jsx("button", { onClick: clearAllDrawings, style: { background: "none", border: "none", color: BRAND.rose, fontSize: 11, fontWeight: 800, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }, children: "Clear History" })
      ] }),
      /* @__PURE__ */ jsx(
        DataTable,
        {
          columns: [
            { header: "Date", cell: (r) => r.date },
            { header: "Partner Name", cell: (r) => /* @__PURE__ */ jsx("span", { style: { fontWeight: 700, color: t.ink }, children: r.partner_name }) },
            { header: "Amount (PKR)", cell: (r) => /* @__PURE__ */ jsx("span", { style: { fontWeight: 800, color: BRAND.amber }, children: fmtCurrency(r.amount, "PKR") }) },
            { header: "Description", cell: (r) => r.description || "—" }
          ],
          rows: payout_pool.drawings || [],
          emptyTitle: "No drawings logged yet",
          emptyMessage: "All dividends logged for partners will be listed here."
        }
      )
    ] }),
    /* @__PURE__ */ jsxs(Note, { t, children: [
      "This page reads only from ",
      /* @__PURE__ */ jsx("code", { children: "PlatformRevenueService" }),
      " and persists equity configurations to SQL. There is no financial math in the browser, and no ",
      /* @__PURE__ */ jsx("code", { children: "localStorage" }),
      " ledger."
    ] })
  ] });
}
function GmvView({ revenue = {}, stats = {} }) {
  const t = useT();
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Header, { icon: TrendingUp, accent: BRAND.sky, title: "Merchant GMV", subtitle: "Gross merchant volume — what your customers sell to their customers. This is not VenQore revenue." }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,210px),1fr))", gap: 14, marginBottom: 18 }, children: [
      /* @__PURE__ */ jsx(KpiCard, { label: "Total GMV", value: fmtCurrency(revenue.gmv ?? stats.total_volume), icon: TrendingUp, accent: BRAND.sky, gradient: GRADIENTS.gmv, big: true }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Active Stores", value: fmtNumber(stats.active_stores), icon: Database, accent: BRAND.indigo }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Avg per Store", value: fmtCurrency((revenue.gmv || 0) / Math.max(1, stats.active_stores || 1)), icon: Activity, accent: BRAND.violet })
    ] }),
    /* @__PURE__ */ jsx(Panel, { children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 14, alignItems: "flex-start" }, children: [
      /* @__PURE__ */ jsx("div", { style: { width: 44, height: 44, borderRadius: 13, background: `${BRAND.sky}1f`, color: BRAND.sky, display: "grid", placeItems: "center", flexShrink: 0 }, children: /* @__PURE__ */ jsx(Globe, { size: 22 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 15, fontWeight: 800, color: t.ink }, children: "Why GMV ≠ Revenue" }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: 13.5, color: t.sub, lineHeight: 1.65, margin: "6px 0 0" }, children: "GMV is the total value of sales processed through every merchant's store. VenQore earns subscription revenue (see the Revenue page), not a cut of merchant sales. Showing these separately keeps the platform's true income honest." })
      ] })
    ] }) })
  ] });
}
function TestingView() {
  const t = useT();
  const initialCategories = [
    { key: "financial", name: "Financial Integrity", desc: "Ledger balance · FIFO · revenue rules", icon: DollarSign, count: 14 },
    { key: "isolation", name: "Tenant Isolation", desc: "No cross-tenant data leakage", icon: ShieldCheck, count: 9 },
    { key: "billing", name: "Billing & Coupons", desc: "Subscriptions · coupon redemption", icon: CreditCard, count: 11 },
    { key: "auth", name: "Auth & Permissions", desc: "Login · PIN · role gates", icon: UserCog, count: 8 },
    { key: "infra", name: "Infrastructure", desc: "Queue · mail · webhooks", icon: Server, count: 6 },
    { key: "smoke", name: "Smoke (live, read-only)", desc: "Production health · never mutates", icon: Activity, count: 5 }
  ];
  const [activeCategory, setActiveCategory] = useState(null);
  const [statuses, setStatuses] = useState(
    initialCategories.reduce((acc, cat) => ({ ...acc, [cat.key]: "idle" }), {})
  );
  const handleRunCategory = (key) => {
    setStatuses((prev) => ({ ...prev, [key]: "running" }));
    setActiveCategory(key);
  };
  const handleRunAll = () => {
    setStatuses((prev) => {
      const next = { ...prev };
      initialCategories.forEach((c) => {
        next[c.key] = "running";
      });
      return next;
    });
    setActiveCategory("all");
  };
  const handleTestComplete = (key, passed) => {
    setStatuses((prev) => ({ ...prev, [key]: passed ? "passed" : "failed" }));
  };
  const handleRunAllComplete = (passed) => {
    setStatuses((prev) => {
      const next = { ...prev };
      initialCategories.forEach((c) => {
        next[c.key] = passed ? "passed" : "failed";
      });
      return next;
    });
  };
  const runKeys = Object.keys(statuses);
  const passedCount = runKeys.filter((k) => statuses[k] === "passed").length;
  const failedCount = runKeys.filter((k) => statuses[k] === "failed").length;
  let verdictType = "initial";
  if (runKeys.some((k) => statuses[k] === "running")) {
    verdictType = "running";
  } else if (failedCount > 0) {
    verdictType = "attention";
  } else if (passedCount > 0) {
    verdictType = "healthy";
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      Header,
      {
        icon: ShieldCheck,
        accent: BRAND.emerald,
        title: "Testing Center",
        subtitle: "One-click categorized health check. Green across the board means you're cleared to ship.",
        actions: /* @__PURE__ */ jsx(Button, { icon: Play, onClick: handleRunAll, disabled: verdictType === "running", children: verdictType === "running" ? /* @__PURE__ */ jsx(Spinner, { color: "#fff" }) : "Run full health check" })
      }
    ),
    /* @__PURE__ */ jsx(Panel, { style: {
      marginBottom: 18,
      background: verdictType === "healthy" ? `${BRAND.emerald}11` : verdictType === "attention" ? `${BRAND.rose}11` : verdictType === "running" ? `${BRAND.amber}11` : GRADIENTS.brandSoft,
      border: `1px solid ${verdictType === "healthy" ? BRAND.emerald : verdictType === "attention" ? BRAND.rose : verdictType === "running" ? BRAND.amber : "transparent"}`
    }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 14 }, children: [
      /* @__PURE__ */ jsx("div", { style: {
        width: 52,
        height: 52,
        borderRadius: 14,
        background: verdictType === "healthy" ? `${BRAND.emerald}22` : verdictType === "attention" ? `${BRAND.rose}22` : `${BRAND.indigo}22`,
        color: verdictType === "healthy" ? BRAND.emerald : verdictType === "attention" ? BRAND.rose : BRAND.indigo,
        display: "grid",
        placeItems: "center"
      }, children: verdictType === "healthy" ? /* @__PURE__ */ jsx(CheckCircle2, { size: 26 }) : /* @__PURE__ */ jsx(XCircle, { size: 26 }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 17, fontWeight: 900, color: t.ink }, children: [
          verdictType === "healthy" && "Platform Healthy",
          verdictType === "attention" && "Attention Required",
          verdictType === "running" && "Running Verification Suites…",
          verdictType === "initial" && "Testing Center Ready"
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, color: t.muted }, children: [
          verdictType === "healthy" && `All ${passedCount} suites verification checks passed. Ready to deploy.`,
          verdictType === "attention" && `${failedCount} suites failed verification tests. Check logs below.`,
          verdictType === "running" && "Executing verification checks in background...",
          verdictType === "initial" && "No tests run yet in this session. Start verification above."
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,300px),1fr))", gap: 14 }, children: initialCategories.map((c) => {
      const status = statuses[c.key];
      return /* @__PURE__ */ jsx(Panel, { hover: true, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: 12 }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          width: 40,
          height: 40,
          borderRadius: 11,
          background: status === "passed" ? `${BRAND.emerald}1f` : status === "failed" ? `${BRAND.rose}1f` : `${BRAND.indigo}1f`,
          color: status === "passed" ? BRAND.emerald : status === "failed" ? BRAND.rose : BRAND.indigo2,
          display: "grid",
          placeItems: "center",
          flexShrink: 0
        }, children: /* @__PURE__ */ jsx(c.icon, { size: 19 }) }),
        /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 800, color: t.ink }, children: c.name }),
            status === "passed" && /* @__PURE__ */ jsx(Badge, { color: BRAND.emerald, children: "Passed" }),
            status === "failed" && /* @__PURE__ */ jsx(Badge, { color: BRAND.rose, children: "Failed" }),
            status === "running" && /* @__PURE__ */ jsx(Badge, { color: BRAND.amber, children: "Running" }),
            status === "idle" && /* @__PURE__ */ jsx(Badge, { color: BRAND.slate, children: "Idle" })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, color: t.muted, marginTop: 3 }, children: c.desc }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, marginTop: 12 }, children: [
            /* @__PURE__ */ jsxs("span", { style: { fontSize: 11.5, color: t.faint }, children: [
              c.count,
              " checks"
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { marginLeft: "auto", display: "flex", gap: 6 }, children: [
              (status === "passed" || status === "failed") && /* @__PURE__ */ jsx(Button, { size: "sm", variant: "secondary", onClick: () => setActiveCategory(c.key), children: "View Logs" }),
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "secondary", icon: Play, onClick: () => handleRunCategory(c.key), disabled: verdictType === "running", children: status === "running" ? /* @__PURE__ */ jsx(Spinner, { size: 13 }) : "Run" })
            ] })
          ] })
        ] })
      ] }) }, c.key);
    }) }),
    activeCategory && /* @__PURE__ */ jsx(
      Drawer,
      {
        open: !!activeCategory,
        onClose: () => setActiveCategory(null),
        title: activeCategory === "all" ? "Full Health Check" : `${initialCategories.find((c) => c.key === activeCategory)?.name} Suite`,
        subtitle: "Pest test suite execution terminal logs",
        width: 600,
        children: /* @__PURE__ */ jsx("div", { style: { background: "#09090e", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: 10 }, children: /* @__PURE__ */ jsx(
          SmokeTestRunner,
          {
            category: activeCategory,
            onComplete: (passed) => {
              if (activeCategory === "all") {
                handleRunAllComplete(passed);
              } else {
                handleTestComplete(activeCategory, passed);
              }
            }
          }
        ) })
      }
    ),
    /* @__PURE__ */ jsxs(Note, { t, children: [
      "Built on the existing live Smoke suite (read-only against ",
      /* @__PURE__ */ jsx("code", { children: "venqore_pos" }),
      "). Additional categories tag Pest suites; a single banner summarizes ship-readiness."
    ] })
  ] });
}
function DemoView() {
  return /* @__PURE__ */ jsx(DemoStoreTab, {});
}
function SupportView({ tickets = {}, ticket_filters = {} }) {
  const t = useT();
  const activeFilters = ticket_filters || { status: "open", source: "all" };
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyBody, setReplyBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rows = tickets.data || [];
  const handleFilterChange = (newSource, newStatus) => {
    router.visit(window.route("platform.dashboard"), {
      data: {
        view: "support",
        ticket_source: newSource,
        ticket_status: newStatus
      },
      preserveState: true,
      preserveScroll: true
    });
  };
  const handleRowClick = (row) => {
    fetch(window.route("platform.ticket.show", row.id)).then((res) => res.json()).then((data) => setSelectedTicket(data)).catch((err) => alert("Failed to fetch ticket: " + err.message));
  };
  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setIsSubmitting(true);
    router.post(window.route("platform.ticket.reply", selectedTicket.id), {
      body: replyBody
    }, {
      onSuccess: () => {
        setReplyBody("");
        setIsSubmitting(false);
        fetch(window.route("platform.ticket.show", selectedTicket.id)).then((res) => res.json()).then((data) => setSelectedTicket(data));
      },
      onError: () => {
        setIsSubmitting(false);
      },
      preserveScroll: true
    });
  };
  const handleStatusUpdate = (newStatus) => {
    const routeName = selectedTicket.source === "vena_chat" ? "platform.vena.ticket.status" : "platform.ticket.status";
    router.post(window.route(routeName, selectedTicket.id), {
      status: newStatus
    }, {
      onSuccess: () => {
        fetch(window.route("platform.ticket.show", selectedTicket.id)).then((res) => res.json()).then((data) => setSelectedTicket(data));
      },
      preserveScroll: true
    });
  };
  const getSourceLabel = (src) => {
    if (src === "vena_chat") return "Vena Chat";
    if (src === "digital_hub") return "Digital Hub";
    return "V1 Ticket";
  };
  const getSourceColor = (src) => {
    if (src === "vena_chat") return BRAND.fuchsia;
    if (src === "digital_hub") return BRAND.sky;
    return BRAND.indigo;
  };
  const transcript = selectedTicket ? selectedTicket.source === "vena_chat" ? (() => {
    const message = selectedTicket.message || "";
    const transcriptStart = message.indexOf("--- CHAT TRANSCRIPT ---");
    if (transcriptStart === -1) {
      return { header: message, lines: [] };
    }
    const header = message.slice(0, transcriptStart).trim();
    const transcriptRaw = message.slice(transcriptStart + "--- CHAT TRANSCRIPT ---".length).trim();
    const lines = transcriptRaw.split("\n").filter(Boolean).map((line) => {
      const match = line.match(/^\[([^\]]+)\]\s+(\w+):\s+(.+)$/);
      if (match) {
        return { time: match[1], sender: match[2], body: match[3] };
      }
      return { time: "", sender: "", body: line };
    });
    return { header, lines };
  })() : null : null;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Header, { icon: Inbox, accent: BRAND.indigo, title: "Support Inbox", subtitle: "One triage queue across V1 tickets, Vena chats and Digital-Hub conversations." }),
    /* @__PURE__ */ jsx(
      DataTable,
      {
        columns: [
          {
            header: "Subject / Requester",
            cell: (r) => /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, color: t.ink }, children: r.subject || `Support Ticket #${r.id}` }),
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: t.muted }, children: [
                "by ",
                r.submitted_by?.name || r.requester_name || "Anonymous",
                " · ",
                r.submitted_by?.email || r.requester_email || ""
              ] })
            ] })
          },
          {
            header: "Store",
            cell: (r) => r.tenant ? /* @__PURE__ */ jsx("span", { style: { fontWeight: 600 }, children: r.tenant.name }) : /* @__PURE__ */ jsx("span", { style: { color: t.faint }, children: "—" })
          },
          {
            header: "Source",
            cell: (r) => /* @__PURE__ */ jsx(Badge, { color: getSourceColor(r.source), children: getSourceLabel(r.source) })
          },
          {
            header: "Status",
            cell: (r) => /* @__PURE__ */ jsx(StatusBadge$1, { status: r.status })
          },
          {
            header: "Created",
            cell: (r) => new Date(r.created_at).toLocaleDateString()
          }
        ],
        rows: rows.map((row) => ({
          ...row,
          __onClick: () => handleRowClick(row)
        })),
        filters: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10 }, children: [
          /* @__PURE__ */ jsx(
            Select,
            {
              value: activeFilters.source,
              onChange: (e) => handleFilterChange(e.target.value, activeFilters.status),
              style: { width: 140 },
              options: [
                { value: "all", label: "All Sources" },
                { value: "portal", label: "V1 Portal" },
                { value: "vena_chat", label: "Vena Chat" },
                { value: "digital_hub", label: "Digital Hub" }
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            Select,
            {
              value: activeFilters.status,
              onChange: (e) => handleFilterChange(activeFilters.source, e.target.value),
              style: { width: 140 },
              options: [
                { value: "all", label: "All Statuses" },
                { value: "open", label: "Open" },
                { value: "in_progress", label: "In Progress" },
                { value: "resolved", label: "Resolved" },
                { value: "closed", label: "Closed" }
              ]
            }
          )
        ] }),
        pagination: {
          current_page: tickets.current_page || 1,
          last_page: tickets.last_page || 1,
          total: tickets.total || 0,
          onPage: (p) => {
            router.visit(window.route("platform.dashboard"), {
              data: {
                view: "support",
                ticket_source: activeFilters.source,
                ticket_status: activeFilters.status,
                tickets_page: p
              },
              preserveState: true,
              preserveScroll: true
            });
          }
        },
        emptyTitle: "Inbox zero",
        emptyMessage: "No tickets match this filter. Beautiful."
      }
    ),
    selectedTicket && /* @__PURE__ */ jsx(
      Drawer,
      {
        open: !!selectedTicket,
        onClose: () => setSelectedTicket(null),
        title: selectedTicket.subject || `Support Ticket #${selectedTicket.id}`,
        subtitle: `${getSourceLabel(selectedTicket.source)} · Status: ${selectedTicket.status.toUpperCase()}`,
        width: 520,
        footer: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, width: "100%" }, children: [
          /* @__PURE__ */ jsx(
            Select,
            {
              value: selectedTicket.status,
              onChange: (e) => handleStatusUpdate(e.target.value),
              style: { width: 150 },
              options: [
                { value: "open", label: "Open" },
                { value: "in_progress", label: "In Progress" },
                { value: "resolved", label: "Resolved" },
                { value: "closed", label: "Closed" }
              ]
            }
          ),
          /* @__PURE__ */ jsx(Button, { variant: "secondary", style: { marginLeft: "auto" }, onClick: () => setSelectedTicket(null), children: "Close Pane" })
        ] }),
        children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12.5, color: t.muted, borderBottom: `1px solid ${t.border}`, paddingBottom: 12 }, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("strong", { children: "From:" }),
              " ",
              selectedTicket.submitted_by?.name || selectedTicket.requester_name || "Anonymous",
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsx("strong", { children: "Email:" }),
              " ",
              selectedTicket.submitted_by?.email || selectedTicket.requester_email || "—"
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { textAlign: "right" }, children: [
              /* @__PURE__ */ jsx("strong", { children: "Store:" }),
              " ",
              selectedTicket.tenant?.name || "—",
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsx("strong", { children: "Date:" }),
              " ",
              new Date(selectedTicket.created_at).toLocaleString()
            ] })
          ] }),
          selectedTicket.source === "vena_chat" && transcript ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: t.ink }, children: "Vena Escalation Transcript:" }),
            /* @__PURE__ */ jsx("div", { style: { background: t.panel2, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12, fontSize: 12, fontFamily: "monospace", maxHeight: 250, overflowY: "auto" }, className: "vq-scroll", children: transcript.lines.map((line, idx) => /* @__PURE__ */ jsxs("div", { style: { marginBottom: 6 }, children: [
              /* @__PURE__ */ jsxs("span", { style: { color: t.muted }, children: [
                "[",
                line.time,
                "]"
              ] }),
              " ",
              /* @__PURE__ */ jsxs("strong", { style: { color: line.sender === "Bot" ? BRAND.indigo2 : BRAND.emerald }, children: [
                line.sender,
                ":"
              ] }),
              " ",
              /* @__PURE__ */ jsx("span", { style: { color: t.ink }, children: line.body })
            ] }, idx)) })
          ] }) : /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: t.ink }, children: "Description:" }),
            /* @__PURE__ */ jsx("div", { style: { background: t.panel2, border: `1px solid ${t.border}`, borderRadius: 12, padding: 14, fontSize: 13, color: t.sub, whiteSpace: "pre-wrap" }, children: selectedTicket.message || "No description provided." })
          ] }),
          selectedTicket.source !== "vena_chat" && /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12, borderTop: `1px solid ${t.border}`, paddingTop: 16 }, children: [
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 13.5, fontWeight: 800, color: t.ink }, children: [
              "Replies (",
              selectedTicket.replies?.length || 0,
              ")"
            ] }),
            /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 10, maxHeight: 200, overflowY: "auto" }, className: "vq-scroll", children: !selectedTicket.replies || selectedTicket.replies.length === 0 ? /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, color: t.muted, fontStyle: "italic" }, children: "No replies logged yet." }) : selectedTicket.replies.map((r) => /* @__PURE__ */ jsxs("div", { style: { background: r.is_platform_owner ? `${BRAND.indigo}0a` : t.panel2, border: `1px solid ${r.is_platform_owner ? `${BRAND.indigo}22` : t.border}`, borderRadius: 10, padding: 10 }, children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 11, fontWeight: 700, color: r.is_platform_owner ? BRAND.indigo2 : t.ink, marginBottom: 4 }, children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  r.author?.name || "Customer",
                  " ",
                  r.is_platform_owner && "(Agent)"
                ] }),
                /* @__PURE__ */ jsx("span", { style: { fontWeight: "normal", color: t.muted }, children: new Date(r.created_at).toLocaleString() })
              ] }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 12.5, color: t.sub, whiteSpace: "pre-wrap" }, children: r.body })
            ] }, r.id)) }),
            selectedTicket.status !== "closed" && /* @__PURE__ */ jsxs("form", { onSubmit: handleReplySubmit, style: { display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }, children: [
              /* @__PURE__ */ jsx(Field, { label: "Send Response", children: /* @__PURE__ */ jsx(
                "textarea",
                {
                  value: replyBody,
                  onChange: (e) => setReplyBody(e.target.value),
                  placeholder: "Write your response to the customer...",
                  required: true,
                  rows: "3",
                  style: {
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 13,
                    borderRadius: 10,
                    background: t.inputBg,
                    color: t.ink,
                    fontFamily: "inherit",
                    border: `1px solid ${t.inputBorder}`,
                    outline: "none"
                  }
                }
              ) }),
              /* @__PURE__ */ jsx(Button, { type: "submit", disabled: isSubmitting, children: isSubmitting ? "Sending..." : "Send Reply" })
            ] })
          ] })
        ] })
      }
    )
  ] });
}
function ImpersonationView() {
  const t = useT();
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Header, { icon: UserCog, accent: BRAND.amber, title: "Impersonation", subtitle: "Audited, time-boxed session takeover. Every start and end is logged." }),
    /* @__PURE__ */ jsx(
      ComingSoon,
      {
        title: "Impersonation Audit Log",
        status: "Backend Pending",
        icon: UserCog,
        description: "Start impersonation from any store or user, with a reversible, time-boxed session. Every action is recorded in the platform audit log. The interface below shows the intended experience.",
        preview: /* @__PURE__ */ jsx(
          DataTable,
          {
            columns: [
              { header: "Actor", cell: () => /* @__PURE__ */ jsx("span", { style: { fontWeight: 700, color: t.ink }, children: "Hashmi Dashboard" }) },
              { header: "Target store", cell: () => "—" },
              { header: "Started", cell: () => "—" },
              { header: "Duration", cell: () => "—" },
              { header: "Status", cell: () => /* @__PURE__ */ jsx(Badge, { color: BRAND.slate, children: "Ended" }) }
            ],
            rows: [],
            emptyTitle: "No impersonation sessions yet",
            emptyMessage: "When you impersonate a store, an auditable row is created here."
          }
        )
      }
    )
  ] });
}
function PkVerificationsView({ stats = {}, pk_verifications = [] }) {
  const t = useT();
  const [rejectingVerification, setRejectingVerification] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const counts = stats.monetization?.pk_verifications || { pending: 0, approved: 0, rejected: 0 };
  const handleApprove = (v) => {
    if (confirm(`Approve CNIC verification for store "${v.tenant_name}"?`)) {
      router.post(window.route("platform.pk-verifications.approve", v.id), {}, {
        preserveScroll: true
      });
    }
  };
  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    router.post(window.route("platform.pk-verifications.reject", rejectingVerification.id), {
      reason: rejectReason
    }, {
      onSuccess: () => {
        setRejectingVerification(null);
        setRejectReason("");
      },
      preserveScroll: true
    });
  };
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
    /* @__PURE__ */ jsx(Header, { icon: BadgeCheck, accent: BRAND.fuchsia, title: "PK Verifications", subtitle: "CNIC review queue — gate PKR pricing behind verified identity. One account per ID card." }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,200px),1fr))", gap: 14 }, children: [
      /* @__PURE__ */ jsx(KpiCard, { label: "Pending Review", value: counts.pending, icon: ScanFace, accent: BRAND.amber }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Approved", value: counts.approved, icon: FileCheck2, accent: BRAND.emerald }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Rejected", value: counts.rejected, icon: XCircle, accent: BRAND.rose })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { pad: 0, children: [
      /* @__PURE__ */ jsx("div", { style: { padding: "16px 18px", borderBottom: `1px solid ${t.border}`, fontSize: 15, fontWeight: 800, color: t.ink }, children: "Verification Queue" }),
      /* @__PURE__ */ jsx(
        DataTable,
        {
          columns: [
            { header: "Submitted", cell: (r) => r.created_at },
            {
              header: "Store",
              cell: (r) => /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, color: t.ink }, children: r.tenant_name }),
                /* @__PURE__ */ jsxs("div", { style: { fontSize: 11, color: t.muted }, children: [
                  "slug: ",
                  r.tenant_slug
                ] })
              ] })
            },
            {
              header: "Owner / Contact",
              cell: (r) => /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontWeight: 700, color: t.ink }, children: r.user_name }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: t.muted }, children: r.user_email }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: t.muted }, children: r.phone })
              ] })
            },
            {
              header: "Status",
              cell: (r) => /* @__PURE__ */ jsx(StatusBadge$1, { status: r.status })
            },
            {
              header: "Documents (Private)",
              cell: (r) => /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: window.route("platform.pk-verifications.download", { verification: r.id, side: "front" }),
                    target: "_blank",
                    rel: "noopener noreferrer",
                    style: { fontSize: 12, color: BRAND.indigo, fontWeight: 700, textDecoration: "none" },
                    children: "Front Image"
                  }
                ),
                /* @__PURE__ */ jsx("span", { style: { color: t.border }, children: "|" }),
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: window.route("platform.pk-verifications.download", { verification: r.id, side: "back" }),
                    target: "_blank",
                    rel: "noopener noreferrer",
                    style: { fontSize: 12, color: BRAND.indigo, fontWeight: 700, textDecoration: "none" },
                    children: "Back Image"
                  }
                )
              ] })
            },
            {
              header: "Actions",
              align: "right",
              cell: (r) => {
                if (r.status !== "pending") {
                  if (r.status === "rejected" && r.rejection) {
                    return /* @__PURE__ */ jsxs("span", { style: { fontSize: 11.5, color: t.muted }, children: [
                      "Reason: ",
                      r.rejection
                    ] });
                  }
                  return /* @__PURE__ */ jsx("span", { style: { fontSize: 11.5, color: t.muted }, children: "—" });
                }
                return /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, justifyContent: "flex-end" }, children: [
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      size: "sm",
                      variant: "success",
                      icon: CheckCircle2,
                      onClick: () => handleApprove(r),
                      children: "Approve"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    Button,
                    {
                      size: "sm",
                      variant: "danger",
                      icon: XCircle,
                      onClick: () => setRejectingVerification(r),
                      children: "Reject"
                    }
                  )
                ] });
              }
            }
          ],
          rows: pk_verifications,
          emptyTitle: "No verifications logged",
          emptyMessage: "Verification requests submitted by tenants from Pakistan will appear here."
        }
      )
    ] }),
    rejectingVerification && /* @__PURE__ */ jsxs("div", { style: { position: "fixed", inset: 0, zIndex: 1100, display: "grid", placeItems: "center", padding: 20 }, children: [
      /* @__PURE__ */ jsx("div", { onClick: () => setRejectingVerification(null), style: { position: "absolute", inset: 0, background: "rgba(2,4,10,0.6)", backdropFilter: "blur(4px)" } }),
      /* @__PURE__ */ jsxs(Panel, { style: { position: "relative", width: "min(440px,100%)", background: t.panelSolid, border: `1px solid ${t.border2}`, borderRadius: 20, padding: 26, boxShadow: t.shadow }, children: [
        /* @__PURE__ */ jsx("h3", { style: { margin: 0, fontSize: 19, fontWeight: 900, color: t.ink, marginBottom: 12 }, children: "Reject Verification Request" }),
        /* @__PURE__ */ jsxs("p", { style: { margin: 0, fontSize: 13.5, color: t.sub, marginBottom: 16 }, children: [
          "Provide a reason for rejecting the verification request for ",
          /* @__PURE__ */ jsx("strong", { children: rejectingVerification.tenant_name }),
          "."
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleRejectSubmit, children: [
          /* @__PURE__ */ jsx(Field, { label: "Rejection Reason", children: /* @__PURE__ */ jsx(
            Input,
            {
              value: rejectReason,
              onChange: (e) => setRejectReason(e.target.value),
              placeholder: "e.g. Blurry front card image",
              required: true,
              autoFocus: true
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }, children: [
            /* @__PURE__ */ jsx(Button, { type: "button", variant: "secondary", onClick: () => setRejectingVerification(null), children: "Cancel" }),
            /* @__PURE__ */ jsx(Button, { type: "submit", variant: "danger", children: "Confirm Rejection" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Note, { t, children: "CNIC images are stored privately on secure disk. Only the cryptographic hash of the CNIC is queryable for uniqueness checks." })
  ] });
}
function SettingsView({ stats = {}, settings = {} }) {
  const t = useT();
  const [usdPkrRate, setUsdPkrRate] = useState(settings.usd_pkr_rate || "278.50");
  const [gatewayFeePct, setGatewayFeePct] = useState(settings.gateway_fee_pct || "5");
  const [defaultGraceDays, setDefaultGraceDays] = useState(settings.default_grace_days || "7");
  const [publicSignups, setPublicSignups] = useState(settings.public_signups_enabled === "1");
  const [maintenanceMode, setMaintenanceMode] = useState(settings.maintenance_mode_enabled === "1");
  const [appsumoEnabled, setAppsumoEnabled] = useState(settings.appsumo_enabled === "1");
  const [vensynqEnabled, setVensynqEnabled] = useState(settings.vensynq_enabled === "1");
  const handleSaveFinancials = (e) => {
    e.preventDefault();
    router.post(window.route("platform.settings.save"), {
      usd_pkr_rate: usdPkrRate,
      gateway_fee_pct: gatewayFeePct,
      default_grace_days: defaultGraceDays
    }, {
      preserveScroll: true
    });
  };
  const handleToggleVensynq = (val) => {
    setVensynqEnabled(val);
    router.post(window.route("platform.vensynq.toggle"), { enabled: val }, {
      preserveScroll: true
    });
  };
  const handleToggleSetting = (key, val, setter) => {
    setter(val);
    router.post(window.route("platform.settings.save"), {
      [key]: val ? 1 : 0
    }, {
      preserveScroll: true
    });
  };
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 20 }, children: [
    /* @__PURE__ */ jsx(Header, { icon: Settings, accent: BRAND.slate, title: "Platform Settings", subtitle: "Server-persisted platform configuration — FX rates, fees, grace defaults & feature flags." }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,320px),1fr))", gap: 20 }, children: [
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }, children: [
          /* @__PURE__ */ jsx(Percent, { size: 18, color: BRAND.indigo2 }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 800, color: t.ink }, children: "Financial Settings" })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveFinancials, style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
          /* @__PURE__ */ jsx(Field, { label: "USD → PKR Exchange Rate", hint: "Used by revenue conversions (MRR, GMV)", children: /* @__PURE__ */ jsx(Input, { value: usdPkrRate, onChange: (e) => setUsdPkrRate(e.target.value), type: "number", step: "0.01", required: true }) }),
          /* @__PURE__ */ jsx(Field, { label: "Gateway Fee Rate (%)", hint: "Subtracted to compute estimated net revenue", children: /* @__PURE__ */ jsx(Input, { value: gatewayFeePct, onChange: (e) => setGatewayFeePct(e.target.value), type: "number", step: "0.1", required: true }) }),
          /* @__PURE__ */ jsx(Field, { label: "Default Grace Period (Days)", hint: "Days a store remains active after plan expiry before view-only mode", children: /* @__PURE__ */ jsx(Input, { value: defaultGraceDays, onChange: (e) => setDefaultGraceDays(e.target.value), type: "number", required: true }) }),
          /* @__PURE__ */ jsx(Button, { type: "submit", children: "Save Financial Policies" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Panel, { children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }, children: [
          /* @__PURE__ */ jsx(ToggleRight, { size: 18, color: BRAND.violet }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 14, fontWeight: 800, color: t.ink }, children: "Module Control Switches" })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 16 }, children: [
          /* @__PURE__ */ jsx(
            ToggleRow,
            {
              t,
              label: "VenSynQ Multichannel Sync",
              sub: "Persists to global settings (survives updates)",
              active: vensynqEnabled,
              onChange: handleToggleVensynq
            }
          ),
          /* @__PURE__ */ jsx(
            ToggleRow,
            {
              t,
              label: "Public Signups",
              sub: "Allow new store registrations on the web",
              active: publicSignups,
              onChange: (val) => handleToggleSetting("public_signups_enabled", val, setPublicSignups)
            }
          ),
          /* @__PURE__ */ jsx(
            ToggleRow,
            {
              t,
              label: "AppSumo codes module",
              sub: "Allow generation and redemption of AppSumo codes",
              active: appsumoEnabled,
              onChange: (val) => handleToggleSetting("appsumo_enabled", val, setAppsumoEnabled)
            }
          ),
          /* @__PURE__ */ jsx(
            ToggleRow,
            {
              t,
              label: "Maintenance Mode",
              sub: "Locks POS platform access for scheduled updates",
              active: maintenanceMode,
              onChange: (val) => handleToggleSetting("maintenance_mode_enabled", val, setMaintenanceMode)
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(Note, { t, children: [
      "Settings persist to the global ",
      /* @__PURE__ */ jsx("code", { children: "settings" }),
      " table (",
      /* @__PURE__ */ jsx("code", { children: "tenant_id = null" }),
      ") — the same deploy-safe pattern VenSynQ already uses."
    ] })
  ] });
}
function JobsView() {
  const t = useT();
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const fetchMetrics = React.useCallback(() => {
    setLoading(true);
    fetch(window.route("platform.jobs.metrics")).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).then((d) => {
      setData(d);
      setError(null);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);
  React.useEffect(() => {
    fetchMetrics();
    const timer = setInterval(fetchMetrics, 15e3);
    return () => clearInterval(timer);
  }, [fetchMetrics]);
  const doAction = (url, method = "POST") => {
    setBusy(true);
    fetch(url, { method, headers: { "X-CSRF-TOKEN": document.querySelector("meta[name=csrf-token]")?.content, "Content-Type": "application/json", "Accept": "application/json" } }).then((r) => r.json()).then((d) => {
      if (d.success) fetchMetrics();
      else alert(d.message || "Action failed.");
    }).catch((e) => alert(e.message)).finally(() => setBusy(false));
  };
  const horizonColor = data?.horizon_status === "running" ? BRAND.emerald : data?.horizon_status === "paused" ? BRAND.amber : BRAND.rose;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Header, { icon: Server, accent: BRAND.indigo, title: "Jobs & Queues", subtitle: "Live queue depth, workers, and failed jobs — auto-refreshes every 15 seconds." }),
    /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,200px),1fr))", gap: 14, marginBottom: 20 }, children: [
      /* @__PURE__ */ jsxs(Panel, { hover: true, pad: 18, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: t.muted, marginBottom: 6 }, children: "Horizon Status" }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
          /* @__PURE__ */ jsx("span", { style: { width: 10, height: 10, borderRadius: "50%", background: horizonColor, display: "inline-block", flexShrink: 0 } }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 20, fontWeight: 800, color: horizonColor, textTransform: "capitalize" }, children: loading ? "…" : data?.horizon_status?.replace("_", " ") ?? "Unknown" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Pending Jobs", value: loading ? "…" : data?.total_pending ?? 0, icon: CircleDot, accent: BRAND.amber }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Failed Jobs", value: loading ? "…" : data?.total_failed ?? 0, icon: XCircle, accent: BRAND.rose }),
      /* @__PURE__ */ jsx(KpiCard, { label: "Workers", value: loading ? "…" : data?.horizon_workers ?? "N/A", icon: Server, accent: BRAND.indigo })
    ] }),
    data?.pending?.length > 0 && /* @__PURE__ */ jsxs(Panel, { style: { marginBottom: 20 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 800, color: t.ink, marginBottom: 12 }, children: "Pending by Queue" }),
      /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 10 }, children: data.pending.map((q) => /* @__PURE__ */ jsxs("div", { style: { padding: "6px 14px", borderRadius: 10, background: `${BRAND.amber}18`, border: `1px solid ${BRAND.amber}33`, display: "flex", gap: 8, alignItems: "center" }, children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 12, fontWeight: 700, color: BRAND.amber }, children: q.queue }),
        /* @__PURE__ */ jsx("span", { style: { fontSize: 13, fontWeight: 900, color: t.ink }, children: q.count })
      ] }, q.queue)) })
    ] }),
    /* @__PURE__ */ jsxs(Panel, { children: [
      /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }, children: [
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 13, fontWeight: 800, color: t.ink }, children: [
          "Failed Jobs ",
          /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, fontWeight: 500, color: t.muted }, children: [
            "(",
            data?.total_failed ?? "…",
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
          /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: fetchMetrics, disabled: loading, children: [
            /* @__PURE__ */ jsx(RotateCcw, { size: 13 }),
            " Refresh"
          ] }),
          data?.total_failed > 0 && /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "danger", disabled: busy, onClick: () => {
            if (confirm("Flush ALL failed jobs? This cannot be undone."))
              doAction(window.route("platform.jobs.flush-failed"));
          }, children: [
            /* @__PURE__ */ jsx(XCircle, { size: 13 }),
            " Flush All"
          ] })
        ] })
      ] }),
      loading && !data ? /* @__PURE__ */ jsx("div", { style: { textAlign: "center", padding: 40 }, children: /* @__PURE__ */ jsx(Spinner, {}) }) : error ? /* @__PURE__ */ jsxs("div", { style: { color: BRAND.rose, padding: 20, textAlign: "center", fontSize: 13 }, children: [
        "⚠ ",
        error
      ] }) : data?.failed?.length === 0 ? /* @__PURE__ */ jsx(EmptyState, { icon: CheckCircle2, title: "No failed jobs", sub: "Your queues are healthy." }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 10 }, children: data.failed.map((job) => /* @__PURE__ */ jsxs("div", { style: {
        padding: "14px 16px",
        borderRadius: 12,
        border: `1px solid ${selected?.id === job.id ? BRAND.rose + "66" : t.border}`,
        background: selected?.id === job.id ? `${BRAND.rose}08` : t.card,
        cursor: "pointer",
        transition: "all 0.15s"
      }, onClick: () => setSelected(selected?.id === job.id ? null : job), children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }, children: [
          /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: t.ink, marginBottom: 3 }, children: job.payload?.displayName ?? "Unknown Job" }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 11.5, color: t.muted }, children: [
              "Queue: ",
              /* @__PURE__ */ jsx("strong", { children: job.queue }),
              " · Failed: ",
              job.failed_at,
              " · Attempts: ",
              job.payload?.attempts ?? 0
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6, flexShrink: 0 }, children: [
            /* @__PURE__ */ jsxs(Button, { size: "xs", onClick: (e) => {
              e.stopPropagation();
              doAction(window.route("platform.jobs.retry", job.id));
            }, disabled: busy, children: [
              /* @__PURE__ */ jsx(RotateCcw, { size: 11 }),
              " Retry"
            ] }),
            /* @__PURE__ */ jsx(Button, { size: "xs", variant: "danger", onClick: (e) => {
              e.stopPropagation();
              if (confirm("Delete this failed job?")) doAction(window.route("platform.jobs.delete-failed", job.id), "DELETE");
            }, disabled: busy, children: /* @__PURE__ */ jsx(XCircle, { size: 11 }) })
          ] })
        ] }),
        selected?.id === job.id && job.exception && /* @__PURE__ */ jsx("pre", { style: { marginTop: 12, fontSize: 11, color: BRAND.rose, background: `${BRAND.rose}0a`, padding: "10px 12px", borderRadius: 8, whiteSpace: "pre-wrap", wordBreak: "break-all", border: `1px solid ${BRAND.rose}22`, maxHeight: 200, overflowY: "auto" }, children: job.exception })
      ] }, job.id)) })
    ] })
  ] });
}
function StorageView() {
  useT();
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Header, { icon: HardDrive, accent: BRAND.sky, title: "Storage", subtitle: "Per-tenant and total storage usage, with cleanup actions." }),
    /* @__PURE__ */ jsx(
      ComingSoon,
      {
        title: "Storage Usage & Cleanup",
        status: "Coming Soon",
        icon: HardDrive,
        description: "See uploads, backups and demo snapshots per tenant and platform-wide, with reclaim actions for orphaned files.",
        preview: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,200px),1fr))", gap: 14 }, children: [
          /* @__PURE__ */ jsx(KpiCard, { label: "Total Used", value: "—", icon: Database, accent: BRAND.sky }),
          /* @__PURE__ */ jsx(KpiCard, { label: "Uploads", value: "—", icon: Upload, accent: BRAND.indigo }),
          /* @__PURE__ */ jsx(KpiCard, { label: "Backups", value: "—", icon: Camera, accent: BRAND.violet })
        ] })
      }
    )
  ] });
}
function FlagsView() {
  const t = useT();
  const flags = ["variants", "serials", "batches", "manufacturing", "multichannel sync", "AI assistant"];
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Header, { icon: ToggleRight, accent: BRAND.emerald, title: "Feature Flags", subtitle: "A central hub for per-store capability switches." }),
    /* @__PURE__ */ jsx(
      ComingSoon,
      {
        title: "Feature Flag Hub",
        status: "Backend Pending",
        icon: ToggleRight,
        description: "The per-store feature-flag route exists; this gives it a real management hub to flip capabilities per tenant or globally.",
        preview: /* @__PURE__ */ jsx(Panel, { children: flags.map((f, i) => /* @__PURE__ */ jsx(ToggleRow, { t, label: f.charAt(0).toUpperCase() + f.slice(1), sub: "Global default", on: i % 2 === 0, last: i === flags.length - 1 }, f)) })
      }
    )
  ] });
}
function AppSumoView() {
  useT();
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Header, { icon: Tag, accent: BRAND.amber, title: "AppSumo / LTD Codes", subtitle: "Lifetime-deal code generation, import and redemption." }),
    /* @__PURE__ */ jsx(
      ComingSoon,
      {
        title: "AppSumo Lifetime Deals",
        status: "Coming Soon",
        icon: Tag,
        description: "The generator/import/export already exists in code but is currently route-disabled. Re-enable behind a feature flag to manage LTD codes, or keep it parked here until your next campaign.",
        preview: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%,180px),1fr))", gap: 14 }, children: [
          /* @__PURE__ */ jsx(KpiCard, { label: "Total Codes", value: "—", icon: Tag, accent: BRAND.amber }),
          /* @__PURE__ */ jsx(KpiCard, { label: "Redeemed", value: "—", icon: CheckCircle2, accent: BRAND.emerald }),
          /* @__PURE__ */ jsx(KpiCard, { label: "Available", value: "—", icon: CircleDot, accent: BRAND.indigo })
        ] })
      }
    )
  ] });
}
function Header({ icon: Icon, title, subtitle, accent = BRAND.indigo, actions }) {
  const t = useT();
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }, children: [
    /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 14, alignItems: "center", minWidth: 0 }, children: [
      /* @__PURE__ */ jsx("div", { style: { width: 48, height: 48, borderRadius: 14, background: `${accent}1f`, color: accent, display: "grid", placeItems: "center", border: `1px solid ${accent}33`, flexShrink: 0 }, children: /* @__PURE__ */ jsx(Icon, { size: 24 }) }),
      /* @__PURE__ */ jsxs("div", { style: { minWidth: 0 }, children: [
        /* @__PURE__ */ jsx("h1", { style: { margin: 0, fontSize: 25, fontWeight: 900, letterSpacing: "-0.03em", color: t.ink }, children: title }),
        subtitle && /* @__PURE__ */ jsx("p", { style: { margin: "4px 0 0", fontSize: 13.5, color: t.muted, maxWidth: 720 }, children: subtitle })
      ] })
    ] }),
    actions && /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 10, flexWrap: "wrap" }, children: actions })
  ] });
}
function Note({ children, t }) {
  return /* @__PURE__ */ jsx("div", { style: { marginTop: 18, padding: "13px 16px", borderRadius: 13, background: `${BRAND.indigo}10`, border: `1px solid ${BRAND.indigo}26`, fontSize: 12.5, color: t.sub, lineHeight: 1.6 }, children });
}
function ToggleRow({ t, label, sub, active, onChange, last }) {
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 12, padding: "12px 4px", borderBottom: last ? "none" : `1px solid ${t.rowBorder}` }, children: [
    /* @__PURE__ */ jsxs("div", { style: { flex: 1 }, children: [
      /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 700, color: t.ink }, children: label }),
      sub && /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, color: t.muted }, children: sub })
    ] }),
    /* @__PURE__ */ jsx("button", { onClick: () => onChange?.(!active), className: "vq-press", style: { width: 44, height: 26, borderRadius: 999, border: "none", cursor: "pointer", background: active ? BRAND.emerald : t.border2, position: "relative", transition: "background .2s" }, children: /* @__PURE__ */ jsx("span", { style: { position: "absolute", top: 3, left: active ? 21 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.3)" } }) })
  ] });
}
export {
  AppSumoView,
  DemoView,
  FlagsView,
  GmvView,
  ImpersonationView,
  JobsView,
  PkVerificationsView,
  RevenueView,
  SettingsView,
  StorageView,
  SupportView,
  TestingView
};
