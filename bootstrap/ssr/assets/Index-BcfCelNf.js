import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, Package, AlertTriangle, X, Server, RefreshCw, RotateCcw, FileArchive, Upload, Shield, ArrowRight, HardDrive, Zap, Database, Terminal, CheckCircle, Check, Loader, XCircle } from "lucide-react";
import { Head, Link } from "@inertiajs/react";
import axios from "axios";
const GlobalStyles = () => /* @__PURE__ */ jsx("style", { children: `
        @keyframes grid-move {
            0%   { background-position: 0 0;    transform: perspective(500px) rotateX(60deg) translateY(0);    }
            100% { background-position: 0 50px; transform: perspective(500px) rotateX(60deg) translateY(50px); }
        }
        @keyframes hologram-scan {
            0%   { top: 0%;   opacity: 0; }
            10%  { opacity: 1; }
            90%  { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.3); }
            50%       { box-shadow: 0 0 40px rgba(99,102,241,0.6); }
        }
        @keyframes slide-up {
            from { opacity: 0; transform: translateY(16px); }
            to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes spin-slow { to { transform: rotate(360deg); } }

        .glass-panel {
            background: rgba(10, 10, 15, 0.80);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8);
        }
        .tech-grid {
            background-image:
                linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
            background-size: 40px 40px;
            animation: grid-move 20s linear infinite;
            transform-origin: 50% 0%;
        }
        .hologram-line {
            position: absolute; left: 0; width: 100%; height: 2px;
            background: rgba(99,102,241,0.5);
            box-shadow: 0 0 10px rgba(99,102,241,0.8);
            animation: hologram-scan 2s linear infinite;
        }
        .drop-zone {
            border: 2px dashed rgba(99,102,241,0.3);
            transition: all 0.3s ease;
            cursor: pointer;
        }
        .drop-zone:hover, .drop-zone.drag-over {
            border-color: rgba(99,102,241,0.8);
            background: rgba(99,102,241,0.06);
            box-shadow: 0 0 30px rgba(99,102,241,0.1) inset;
        }
        .log-line { animation: slide-up 0.3s ease; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        .spin-slow { animation: spin-slow 2s linear infinite; }
        .pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .noise-bg {
            position: absolute; inset: 0; opacity: 0.04;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            pointer-events: none; z-index: 0;
        }
    ` });
const Background = ({ active }) => /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 overflow-hidden bg-zinc-950 z-0", children: [
  /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950 to-slate-900" }),
  /* @__PURE__ */ jsx("div", { className: "absolute inset-0 tech-grid opacity-30 w-[200%] -ml-[50%] h-[200%] -mt-[20%]" }),
  /* @__PURE__ */ jsx("div", { className: `absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen transition-all duration-1000 ${active ? "opacity-80 scale-150" : "animate-pulse"}` }),
  /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-[100px] animate-pulse" })
] });
const StatusIcon = ({ status }) => {
  if (status === "running") return /* @__PURE__ */ jsx(Loader, { size: 16, className: "text-indigo-400 spin-slow" });
  if (status === "done") return /* @__PURE__ */ jsx(CheckCircle, { size: 16, className: "text-emerald-400" });
  if (status === "error") return /* @__PURE__ */ jsx(XCircle, { size: 16, className: "text-rose-400" });
  if (status === "pending") return /* @__PURE__ */ jsx("div", { className: "w-4 h-4 rounded-full border border-slate-600" });
  return null;
};
function Updater({ currentVersion, versionHistory = [] }) {
  const [phase, setPhase] = useState("select");
  const [zipFile, setZipFile] = useState(null);
  const [newVersion, setNewVersion] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const updateTokenRef = useRef(null);
  const [sysInfo, setSysInfo] = useState(null);
  const [infoLoading, setInfoLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [showLimitHelp, setShowLimitHelp] = useState(false);
  const termRef = useRef(null);
  const [steps, setSteps] = useState([
    { id: "upload", label: "Upload & Verify Package", status: "pending" },
    { id: "extract", label: "Extract & Overwrite Files", status: "pending" },
    { id: "migrate", label: "Apply Database Migrations", status: "pending" },
    { id: "cache", label: "Clear & Rebuild Caches", status: "pending" },
    { id: "version", label: "Record New Version", status: "pending" }
  ]);
  useEffect(() => {
    axios.get("/api/updater/info").then((r) => setSysInfo(r.data)).catch(() => setSysInfo(null)).finally(() => setInfoLoading(false));
  }, []);
  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [logs]);
  useEffect(() => {
    const handler = (e) => {
      if (phase === "updating") {
        e.preventDefault();
        e.returnValue = "An update is in progress! Closing this tab may leave your application in an inconsistent state.";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);
  const log = (text, type = "info") => setLogs((prev) => [...prev, { text, type, time: (/* @__PURE__ */ new Date()).toLocaleTimeString() }]);
  const setStepStatus = (id, status) => setSteps((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      alert("Please select a .zip update package.");
      return;
    }
    const serverMaxMB = sysInfo?.max_zip_mb || 300;
    const serverMaxBytes = serverMaxMB * 1024 * 1024;
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
    if (file.size > serverMaxBytes) {
      const phpLimit = Math.min(sysInfo?.php_upload_max_mb || 9999, sysInfo?.php_post_max_mb || 9999);
      if (phpLimit < (sysInfo?.app_max_mb || 300)) {
        setShowLimitHelp(true);
      } else {
        alert(`File too large (${fileSizeMB} MB). Maximum allowed is ${serverMaxMB} MB.`);
      }
      return;
    }
    setZipFile(file);
    const match = file.name.match(/v?(\d+\.\d+\.\d+)/);
    if (match) setNewVersion(match[1]);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };
  const runUpdate = async () => {
    setPhase("updating");
    setProgress(0);
    setLogs([]);
    setSteps((prev) => prev.map((s) => ({ ...s, status: "pending" })));
    const progressPerStep = 100 / steps.length;
    const runStep = async (stepId, formDataOrPayload) => {
      setStepStatus(stepId, "running");
      log(`▶ Starting: ${steps.find((s) => s.id === stepId)?.label}...`);
      if (!(formDataOrPayload instanceof FormData) && updateTokenRef.current) {
        formDataOrPayload = { ...formDataOrPayload, update_token: updateTokenRef.current };
      }
      try {
        let res;
        if (formDataOrPayload instanceof FormData) {
          res = await axios.post("/api/updater/run", formDataOrPayload, {
            headers: { "Content-Type": "multipart/form-data" },
            timeout: 6e5
            // 10 min per chunk (generous)
          });
        } else {
          res = await axios.post("/api/updater/run", formDataOrPayload, {
            timeout: 18e4
            // 3 minutes
          });
        }
        setStepStatus(stepId, "done");
        log(`  ✓ ${res.data.message || "Done."}`, "success");
        if (res.data.output) log(`  ${res.data.output}`, "dim");
        if (res.data.demo_warning) log(`  ⚠️ Demo store: ${res.data.demo_warning}`, "warning");
        setProgress((prev) => Math.min(prev + progressPerStep, 100));
        return true;
      } catch (e) {
        setStepStatus(stepId, "error");
        let msg = e.response?.data?.error || e.message || "Unknown error";
        if (e.code === "ECONNABORTED" || e.message?.includes("timeout")) {
          msg = "Request timed out. Your server may be too slow or the file too large. Try a smaller update package or contact your hosting provider.";
        } else if (e.code === "ERR_NETWORK" || !e.response) {
          msg = "Network error — lost connection to the server. The server may have restarted during the update. Check if the app is still running.";
        } else if (e.response?.status === 413) {
          msg = "File too large — your web server (Nginx/Apache) rejected the upload. Ask your hosting provider to increase the upload limit.";
        } else if (e.response?.status === 502 || e.response?.status === 504) {
          msg = "Gateway Timeout (504) — your web server (Nginx/Apache) timed out waiting for PHP to finish. The operation may still be running on the server. Ask your hosting provider to increase proxy_read_timeout (Nginx) or ProxyTimeout (Apache) to at least 300 seconds. Then refresh this page and try again.";
        } else if (e.response?.status === 419) {
          msg = "Session expired (CSRF token mismatch). Please refresh the page and try again.";
        }
        log(`  ✗ FAILED: ${msg}`, "error");
        setErrorMsg(msg);
        setPhase("error");
        return false;
      }
    };
    setStepStatus("upload", "running");
    log(`▶ Starting: ${steps.find((s) => s.id === "upload")?.label}...`);
    const CHUNK_SIZE = 5 * 1024 * 1024;
    const totalChunks = Math.ceil(zipFile.size / CHUNK_SIZE);
    const uploadId = `upd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    log(`  📦 File: ${(zipFile.size / 1024 / 1024).toFixed(1)} MB → ${totalChunks} chunks`, "dim");
    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, zipFile.size);
        const chunk = zipFile.slice(start, end);
        const fd = new FormData();
        fd.append("step", "upload");
        fd.append("chunk", chunk, "chunk");
        fd.append("chunk_index", i);
        fd.append("total_chunks", totalChunks);
        fd.append("upload_id", uploadId);
        fd.append("filename", zipFile.name);
        const res = await axios.post("/api/updater/run", fd, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 6e5
        });
        const pct = Math.round((i + 1) / totalChunks * 100);
        if (pct % 20 === 0 || i === totalChunks - 1) {
          log(`  ↑ Uploading: ${pct}%`, "dim");
        }
        if (res.data.complete) {
          log(`  ✓ ${res.data.message}`, "success");
          if (res.data.update_token) {
            updateTokenRef.current = res.data.update_token;
          }
        }
      }
      setStepStatus("upload", "done");
      setProgress((prev) => Math.min(prev + progressPerStep, 100));
    } catch (e) {
      setStepStatus("upload", "error");
      let msg = e.response?.data?.error || e.message || "Unknown error";
      if (e.response?.status === 413) {
        msg = "Chunk too large for server. Contact your hosting provider.";
      } else if (e.response?.status === 502 || e.response?.status === 504) {
        msg = "Server timed out during chunk upload. Please retry.";
      }
      log(`  ✗ FAILED: ${msg}`, "error");
      setErrorMsg(msg);
      setPhase("error");
      return;
    }
    if (!await runStep("extract", { step: "extract" })) return;
    if (!await runStep("migrate", { step: "migrate" })) return;
    if (!await runStep("cache", { step: "cache" })) return;
    if (!await runStep("version", { step: "version", new_version: newVersion || "unknown" })) return;
    log("");
    log("══════════════════════════════════════════", "dim");
    log("  UPDATE COMPLETE. System is now live.   ", "success");
    log("══════════════════════════════════════════", "dim");
    setProgress(100);
    setPhase("done");
  };
  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const mb = bytes / 1024 / 1024;
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "min-h-screen w-full flex items-center justify-center font-sans text-slate-200 overflow-hidden relative p-4", children: [
      /* @__PURE__ */ jsx(Head, { title: "System Updater | VENQORE" }),
      /* @__PURE__ */ jsx(GlobalStyles, {}),
      /* @__PURE__ */ jsx(Background, { active: phase === "updating" }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full max-w-4xl", children: [
        /* @__PURE__ */ jsxs("div", { className: "glass-panel rounded-2xl relative overflow-hidden border-t border-white/10", children: [
          /* @__PURE__ */ jsx("div", { className: "noise-bg" }),
          /* @__PURE__ */ jsxs("div", { className: "h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 relative", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: route("platform.dashboard"),
                  className: "flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors group mr-2",
                  title: "Back to Platform HQ",
                  children: [
                    /* @__PURE__ */ jsx(ChevronLeft, { size: 15, className: "group-hover:-translate-x-0.5 transition-transform" }),
                    /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "Platform HQ" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-white/10" }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-rose-500/80" }),
                /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-amber-500/80" }),
                /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500/80" })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-white/10" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-mono text-slate-400 tracking-wider", children: "VENQORE_UPDATER_V1.0" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxs("div", { className: "px-3 py-1 rounded text-2xs font-mono text-slate-500 bg-white/5 uppercase tracking-widest border border-white/5", children: [
                "Current: v",
                currentVersion || sysInfo?.current_version || "—"
              ] }),
              /* @__PURE__ */ jsxs(
                Link,
                {
                  href: "/dashboard",
                  className: "px-3 py-1.5 rounded-lg text-2xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 uppercase tracking-widest border border-white/5 hover:border-white/20 transition-all flex items-center gap-1.5",
                  children: [
                    /* @__PURE__ */ jsx(ChevronLeft, { size: 11 }),
                    " Back to App"
                  ]
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-8 md:p-12", children: [
            phase === "select" && /* @__PURE__ */ jsxs("div", { style: { animation: "slide-up 0.4s ease" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400", children: /* @__PURE__ */ jsx(Package, { size: 22 }) }),
                  /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-white tracking-tight", children: "System Update" })
                ] }),
                /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-500 leading-relaxed max-w-lg", children: [
                  "Upload the new version ZIP file you received. Your existing data, database, uploads, and configuration will ",
                  /* @__PURE__ */ jsx("strong", { className: "text-emerald-400", children: "never be touched" }),
                  "."
                ] })
              ] }),
              sysInfo?.update_in_progress && /* @__PURE__ */ jsxs("div", { className: "bg-rose-500/10 border border-rose-500/40 rounded-xl p-4 mb-6 flex gap-3", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 18, className: "text-rose-400 shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-rose-400 mb-1", children: "⚠ Update Already In Progress" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Another update is currently running on this server. Starting a second update simultaneously WILL corrupt your application. Wait for the current update to finish, or contact your server administrator if it appears stuck." })
                ] })
              ] }),
              sysInfo && !sysInfo.zip_extension && /* @__PURE__ */ jsxs("div", { className: "bg-rose-500/10 border border-rose-500/40 rounded-xl p-4 mb-6 flex gap-3", children: [
                /* @__PURE__ */ jsx(X, { size: 18, className: "text-rose-400 shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-rose-400 mb-1", children: "PHP ZIP Extension Missing" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400", children: [
                    "Your server does not have the PHP ",
                    /* @__PURE__ */ jsx("code", { className: "text-rose-300", children: "zip" }),
                    " extension enabled. Updates cannot be applied until this is fixed. Contact your hosting provider to enable ",
                    /* @__PURE__ */ jsx("code", { className: "text-rose-300", children: "php_zip" }),
                    "."
                  ] })
                ] })
              ] }),
              sysInfo && sysInfo.max_zip_mb < 200 && /* @__PURE__ */ jsxs("div", { className: "bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex gap-3", children: [
                /* @__PURE__ */ jsx(AlertTriangle, { size: 18, className: "text-amber-400 shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-amber-400 mb-1", children: [
                    "Low Upload Limit Detected: ",
                    sysInfo.max_zip_mb,
                    " MB"
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 mb-2", children: [
                    "Your server only allows uploads up to ",
                    /* @__PURE__ */ jsxs("strong", { className: "text-amber-300", children: [
                      sysInfo.max_zip_mb,
                      " MB"
                    ] }),
                    ". VENQORE update packages are typically 80–120 MB. If your ZIP file is larger than ",
                    sysInfo.max_zip_mb,
                    " MB, the upload will fail."
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => setShowLimitHelp(true),
                      className: "text-xs font-bold text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors",
                      children: "How to increase the upload limit →"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-10", children: [
                /* @__PURE__ */ jsxs("div", { className: "md:col-span-1 space-y-6", children: [
                  /* @__PURE__ */ jsxs("div", { className: "bg-black/30 rounded-xl border border-white/5 p-5 space-y-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-widest mb-4", children: [
                      /* @__PURE__ */ jsx(Server, { size: 13 }),
                      " System Info"
                    ] }),
                    infoLoading ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-slate-500", children: [
                      /* @__PURE__ */ jsx(RefreshCw, { size: 14, className: "spin-slow" }),
                      /* @__PURE__ */ jsx("span", { className: "text-xs", children: "Scanning..." })
                    ] }) : sysInfo ? /* @__PURE__ */ jsx(Fragment, { children: [
                      { label: "PHP", value: sysInfo.php_version },
                      { label: "Free Disk", value: `${sysInfo.disk_free_mb} MB` },
                      {
                        label: "Upload Limit",
                        value: `${sysInfo.max_zip_mb} MB`,
                        ok: sysInfo.max_zip_mb >= 200,
                        action: sysInfo.max_zip_mb < 200 ? () => setShowLimitHelp(true) : null
                      },
                      { label: "Pending DB", value: sysInfo.pending_migrations > 0 ? `${sysInfo.pending_migrations} migration(s)` : "None", ok: sysInfo.pending_migrations === 0 },
                      { label: "ZIP Extension", value: sysInfo.zip_extension ? "Available" : "Missing", ok: sysInfo.zip_extension },
                      { label: "Storage", value: sysInfo.storage_writable ? "Writable" : "Read Only", ok: sysInfo.storage_writable },
                      { label: "Base Dir", value: sysInfo.base_writable ? "Writable" : "Read Only", ok: sysInfo.base_writable }
                    ].map(({ label, value, ok, action }) => /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 ${action ? "cursor-pointer hover:bg-white/5 rounded px-1 -mx-1 transition-colors" : ""}`, onClick: action || void 0, children: [
                      /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500", children: label }),
                      /* @__PURE__ */ jsxs("span", { className: `text-xs font-mono ${ok === false ? "text-rose-400" : ok === true ? "text-emerald-400" : "text-slate-300"}`, children: [
                        value,
                        action && " ⚠"
                      ] })
                    ] }, label)) }) : /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Could not load system info." })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "bg-black/30 rounded-xl border border-white/5 p-5 space-y-3", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-widest mb-3", children: [
                      /* @__PURE__ */ jsx(RotateCcw, { size: 13 }),
                      " Update History"
                    ] }),
                    versionHistory.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 italic", children: "No update logs recorded yet." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto custom-scrollbar", children: versionHistory.map((h, i) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col py-1.5 border-b border-white/5 last:border-0", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                        /* @__PURE__ */ jsxs("span", { className: "text-xs font-bold text-white", children: [
                          "v",
                          h.version
                        ] }),
                        /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-500", children: new Date(h.updated_at).toLocaleDateString() })
                      ] }),
                      /* @__PURE__ */ jsxs("span", { className: "text-2xs text-slate-400 mt-0.5", children: [
                        "By ",
                        h.by
                      ] })
                    ] }, i)) })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-5", children: [
                  /* @__PURE__ */ jsxs(
                    "div",
                    {
                      className: `drop-zone rounded-xl p-8 text-center ${dragOver ? "drag-over" : ""}`,
                      onClick: () => fileInputRef.current?.click(),
                      onDragOver: (e) => {
                        e.preventDefault();
                        setDragOver(true);
                      },
                      onDragLeave: () => setDragOver(false),
                      onDrop: handleDrop,
                      children: [
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            ref: fileInputRef,
                            type: "file",
                            accept: ".zip",
                            className: "hidden",
                            onChange: (e) => handleFileSelect(e.target.files[0])
                          }
                        ),
                        zipFile ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3", children: [
                          /* @__PURE__ */ jsx("div", { className: "p-4 rounded-full bg-emerald-500/20 text-emerald-400 pulse-glow", children: /* @__PURE__ */ jsx(FileArchive, { size: 32 }) }),
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("p", { className: "text-white font-semibold text-sm", children: zipFile.name }),
                            /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 mt-1", children: [
                              formatBytes(zipFile.size),
                              " — Ready to deploy"
                            ] })
                          ] }),
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              onClick: (e) => {
                                e.stopPropagation();
                                setZipFile(null);
                                setNewVersion("");
                              },
                              className: "text-xs text-slate-500 hover:text-rose-400 transition-colors mt-1 flex items-center gap-1",
                              children: [
                                /* @__PURE__ */ jsx(X, { size: 12 }),
                                " Remove"
                              ]
                            }
                          )
                        ] }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-3 text-slate-500", children: [
                          /* @__PURE__ */ jsx(Upload, { size: 40, className: "text-indigo-500/40" }),
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-slate-400", children: "Drop your update ZIP here" }),
                            /* @__PURE__ */ jsx("p", { className: "text-xs mt-1", children: "or click to browse — .zip files only" })
                          ] })
                        ] })
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-3 items-end", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsx("label", { className: "block text-xs font-mono text-slate-500 uppercase tracking-widest mb-2", children: "New Version Number" }),
                      /* @__PURE__ */ jsx(
                        "input",
                        {
                          type: "text",
                          value: newVersion,
                          onChange: (e) => setNewVersion(e.target.value),
                          placeholder: "e.g. 2.0.0",
                          className: "w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-600 pb-3.5 font-mono", children: [
                      "from v",
                      currentVersion || "?"
                    ] })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-8 flex gap-3", children: [
                /* @__PURE__ */ jsx(Shield, { size: 18, className: "text-emerald-400 shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-emerald-400 mb-1", children: "Your Data is Safe — Always" }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-500 leading-relaxed", children: [
                    "The following are ",
                    /* @__PURE__ */ jsx("strong", { className: "text-slate-400", children: "never overwritten" }),
                    " during an update:",
                    /* @__PURE__ */ jsx("code", { className: "mx-1 text-emerald-300/70 text-1xs", children: ".env" }),
                    ",",
                    /* @__PURE__ */ jsx("code", { className: "mx-1 text-emerald-300/70 text-1xs", children: "storage/app/public/" }),
                    " (your uploads),",
                    /* @__PURE__ */ jsx("code", { className: "mx-1 text-emerald-300/70 text-1xs", children: "storage/logs/" }),
                    ", and your entire database. Only application code files are replaced."
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  id: "btn-proceed-to-confirm",
                  onClick: () => setPhase("confirm"),
                  disabled: !zipFile || sysInfo?.update_in_progress || sysInfo && !sysInfo.zip_extension,
                  className: `w-full py-4 rounded-xl font-bold text-sm uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-3 ${zipFile && !sysInfo?.update_in_progress && (!sysInfo || sysInfo.zip_extension) ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.35)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)]" : "bg-slate-800 text-slate-600 cursor-not-allowed"}`,
                  children: [
                    /* @__PURE__ */ jsx(ArrowRight, { size: 18 }),
                    sysInfo?.update_in_progress ? "Update In Progress — Please Wait" : "Review & Deploy Update"
                  ]
                }
              )
            ] }),
            phase === "confirm" && /* @__PURE__ */ jsxs("div", { style: { animation: "slide-up 0.4s ease" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "p-2.5 rounded-xl bg-amber-500/20 text-amber-400", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 22 }) }),
                  /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white", children: "Confirm Deployment" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Review what will happen before proceeding." })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "bg-black/30 rounded-xl border border-white/5 p-6 mb-6 space-y-4", children: [
                { icon: Package, label: "Update Package", value: zipFile?.name, color: "text-indigo-400", bg: "bg-indigo-500/10" },
                { icon: HardDrive, label: "Package Size", value: formatBytes(zipFile?.size), color: "text-sky-400", bg: "bg-sky-500/10" },
                { icon: Zap, label: "Upgrading From", value: `v${currentVersion || "?"} → v${newVersion || "unknown"}`, color: "text-amber-400", bg: "bg-amber-500/10" },
                { icon: Database, label: "DB Migrations", value: `${sysInfo?.pending_migrations || 0} pending migration(s) will run`, color: "text-emerald-400", bg: "bg-emerald-500/10" }
              ].map(({ icon: Icon, label, value, color, bg }) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                /* @__PURE__ */ jsx("div", { className: `p-2 rounded-lg ${bg} ${color} shrink-0`, children: /* @__PURE__ */ jsx(Icon, { size: 16 }) }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 flex items-center justify-between", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500", children: label }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-mono text-slate-300", children: value })
                ] })
              ] }, label)) }),
              /* @__PURE__ */ jsxs("div", { className: "bg-black/20 rounded-xl border border-white/5 p-5 mb-8", children: [
                /* @__PURE__ */ jsx("p", { className: "text-2xs font-mono text-slate-500 uppercase tracking-widest mb-4", children: "Deployment Steps" }),
                /* @__PURE__ */ jsx("div", { className: "space-y-2", children: steps.map((s, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-sm text-slate-400", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-2xs text-slate-500 font-bold shrink-0", children: i + 1 }),
                  /* @__PURE__ */ jsx("span", { children: s.label })
                ] }, s.id)) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    id: "btn-back-to-select",
                    onClick: () => setPhase("select"),
                    className: "flex-1 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    children: [
                      /* @__PURE__ */ jsx(RotateCcw, { size: 14 }),
                      " Go Back"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    id: "btn-run-update",
                    onClick: runUpdate,
                    className: "flex-[2] py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.15em] shadow-[0_0_25px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-2",
                    children: [
                      /* @__PURE__ */ jsx(Zap, { size: 16 }),
                      " Deploy Update Now"
                    ]
                  }
                )
              ] })
            ] }),
            (phase === "updating" || phase === "error") && /* @__PURE__ */ jsxs("div", { style: { animation: "slide-up 0.4s ease" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-8 flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: `p-2.5 rounded-xl ${phase === "error" ? "bg-rose-500/20 text-rose-400" : "bg-indigo-500/20 text-indigo-400"}`, children: phase === "error" ? /* @__PURE__ */ jsx(AlertTriangle, { size: 22 }) : /* @__PURE__ */ jsx(Terminal, { size: 22 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white", children: phase === "error" ? "Update Failed" : "Deploying Update..." }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: phase === "error" ? "An error occurred. See details below." : "Do not close this window." })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-mono text-slate-500", children: "Progress" }),
                  /* @__PURE__ */ jsxs("span", { className: "text-xs font-mono text-indigo-400", children: [
                    Math.round(progress),
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "h-2 bg-slate-800 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: "h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full transition-all duration-700",
                    style: { width: `${progress}%` }
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-5 gap-2 mb-6", children: steps.map((s) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: `w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-500 ${s.status === "done" ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : s.status === "running" ? "bg-indigo-500/20  border-indigo-500/50  text-indigo-400  pulse-glow" : s.status === "error" ? "bg-rose-500/20    border-rose-500/50    text-rose-400" : "bg-slate-800      border-slate-700      text-slate-600"}`, children: /* @__PURE__ */ jsx(StatusIcon, { status: s.status }) }),
                /* @__PURE__ */ jsx("span", { className: "text-3xs text-center text-slate-500 leading-tight font-mono", children: s.label })
              ] }, s.id)) }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  ref: termRef,
                  className: "bg-black/60 rounded-xl border border-white/5 p-4 h-52 overflow-y-auto custom-scrollbar font-mono text-xs space-y-0.5",
                  children: [
                    logs.map((l, i) => /* @__PURE__ */ jsxs("div", { className: `log-line flex gap-2 ${l.type === "error" ? "text-rose-400" : l.type === "warning" ? "text-amber-400" : l.type === "success" ? "text-emerald-400" : l.type === "dim" ? "text-slate-600" : "text-slate-400"}`, children: [
                      /* @__PURE__ */ jsx("span", { className: "text-slate-700 shrink-0", children: l.time }),
                      /* @__PURE__ */ jsx("span", { children: l.text })
                    ] }, i)),
                    logs.length === 0 && /* @__PURE__ */ jsx("span", { className: "text-slate-700", children: "Initializing update sequence..." })
                  ]
                }
              ),
              phase === "error" && /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-xs text-rose-300", children: [
                  /* @__PURE__ */ jsx("strong", { className: "block mb-1", children: "Error:" }),
                  " ",
                  errorMsg
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      id: "btn-back-from-error",
                      onClick: () => {
                        setPhase("select");
                        setZipFile(null);
                      },
                      className: "flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs uppercase tracking-widest transition-all",
                      children: "Start Over"
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "button",
                    {
                      id: "btn-retry-update",
                      onClick: runUpdate,
                      className: "flex-[2] py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                      children: [
                        /* @__PURE__ */ jsx(RotateCcw, { size: 14 }),
                        " Retry Update"
                      ]
                    }
                  )
                ] })
              ] })
            ] }),
            phase === "done" && /* @__PURE__ */ jsxs("div", { className: "text-center py-8", style: { animation: "slide-up 0.5s ease" }, children: [
              /* @__PURE__ */ jsxs("div", { className: "relative mb-8 flex justify-center", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" }) }),
                /* @__PURE__ */ jsx("div", { className: "relative p-8 rounded-full bg-emerald-500/20 border border-emerald-500/30", children: /* @__PURE__ */ jsx(CheckCircle, { size: 64, className: "text-emerald-400" }) })
              ] }),
              /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-white mb-3 tracking-tight", children: "Update Successful!" }),
              /* @__PURE__ */ jsxs("p", { className: "text-slate-500 text-sm mb-2", children: [
                "VENQORE has been updated to ",
                /* @__PURE__ */ jsxs("strong", { className: "text-emerald-400", children: [
                  "v",
                  newVersion || "the latest version"
                ] }),
                "."
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-600 text-xs mb-10", children: "All your data, customer records, and configurations remain intact." }),
              /* @__PURE__ */ jsx("div", { className: "flex flex-wrap justify-center gap-3 mb-10", children: steps.map((s) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400", children: [
                /* @__PURE__ */ jsx(Check, { size: 12 }),
                " ",
                s.label
              ] }, s.id)) }),
              /* @__PURE__ */ jsxs(
                "a",
                {
                  id: "btn-go-to-dashboard",
                  href: "/dashboard",
                  className: "inline-flex items-center gap-3 px-10 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-[0.15em] shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all",
                  children: [
                    /* @__PURE__ */ jsx(Zap, { size: 18 }),
                    " Go to Dashboard"
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-700 mt-4 font-mono", children: "VENQORE — Secure Update Channel. Protected by server-side validation." })
      ] })
    ] }),
    showLimitHelp && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4", onClick: () => setShowLimitHelp(false), children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-white/10 rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("div", { className: "sticky top-0 bg-slate-900 border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(AlertTriangle, { size: 18, className: "text-amber-400" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-white", children: "How to Increase Upload Limit" }),
            /* @__PURE__ */ jsxs("p", { className: "text-2xs text-slate-500", children: [
              "Currently: ",
              sysInfo?.max_zip_mb || "?",
              " MB — Recommended: 300 MB"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setShowLimitHelp(false), className: "text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10", children: /* @__PURE__ */ jsx(X, { size: 18 }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "px-6 py-5 space-y-6 text-xs text-slate-300", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-slate-400 leading-relaxed", children: [
          "Your server's PHP configuration limits how large a file you can upload. VENQORE update packages are typically ",
          /* @__PURE__ */ jsx("strong", { className: "text-white", children: "80–120 MB" }),
          ". Your current limit is ",
          /* @__PURE__ */ jsxs("strong", { className: "text-amber-400", children: [
            sysInfo?.max_zip_mb || "?",
            " MB"
          ] }),
          ", which may be too low. Choose the method that matches your server environment:"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4", children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-bold text-indigo-400 mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "w-5 h-5 rounded bg-indigo-500/30 flex items-center justify-center text-2xs font-bold", children: "1" }),
            "XAMPP / WAMP (Local Windows Server)"
          ] }),
          /* @__PURE__ */ jsxs("ol", { className: "space-y-2 text-slate-400 list-decimal list-inside", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              "Open ",
              /* @__PURE__ */ jsx("code", { className: "text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded", children: "php.ini" }),
              " file. In XAMPP it is usually at:",
              /* @__PURE__ */ jsx("code", { className: "block mt-1 text-slate-300 bg-black/40 px-3 py-1.5 rounded font-mono", children: "D:\\Software\\XAMPP\\php\\php.ini" })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              "Find and update these two lines:",
              /* @__PURE__ */ jsx("code", { className: "block mt-1 text-emerald-300 bg-black/40 px-3 py-1.5 rounded font-mono whitespace-pre", children: "upload_max_filesize = 300M\npost_max_size = 300M" })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Restart Apache" }),
              " from the XAMPP Control Panel (click Stop, then Start)."
            ] }),
            /* @__PURE__ */ jsx("li", { children: "Refresh this page to verify the new limit." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4", children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-bold text-emerald-400 mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "w-5 h-5 rounded bg-emerald-500/30 flex items-center justify-center text-2xs font-bold", children: "2" }),
            "cPanel / Shared Hosting"
          ] }),
          /* @__PURE__ */ jsxs("ol", { className: "space-y-2 text-slate-400 list-decimal list-inside", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              "Log in to your ",
              /* @__PURE__ */ jsx("strong", { className: "text-white", children: "cPanel" }),
              " dashboard."
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              "Search for ",
              /* @__PURE__ */ jsx("strong", { className: "text-white", children: '"MultiPHP INI Editor"' }),
              " or ",
              /* @__PURE__ */ jsx("strong", { className: "text-white", children: '"PHP Settings"' }),
              "."
            ] }),
            /* @__PURE__ */ jsx("li", { children: "Select your domain from the dropdown." }),
            /* @__PURE__ */ jsxs("li", { children: [
              "Set ",
              /* @__PURE__ */ jsx("code", { className: "text-emerald-300", children: "upload_max_filesize" }),
              " to ",
              /* @__PURE__ */ jsx("code", { className: "text-white", children: "300M" })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              "Set ",
              /* @__PURE__ */ jsx("code", { className: "text-emerald-300", children: "post_max_size" }),
              " to ",
              /* @__PURE__ */ jsx("code", { className: "text-white", children: "300M" })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              "Click ",
              /* @__PURE__ */ jsx("strong", { className: "text-white", children: "Apply / Save" }),
              "."
            ] }),
            /* @__PURE__ */ jsx("li", { children: "Refresh this page to verify." })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-2xs text-slate-500", children: "Note: Some shared hosts may have lower hard limits. Contact your hosting provider if the values don't change." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-purple-500/10 border border-purple-500/20 rounded-xl p-4", children: [
          /* @__PURE__ */ jsxs("h4", { className: "font-bold text-purple-400 mb-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "w-5 h-5 rounded bg-purple-500/30 flex items-center justify-center text-2xs font-bold", children: "3" }),
            "Linux Server (VPS / Dedicated)"
          ] }),
          /* @__PURE__ */ jsxs("ol", { className: "space-y-2 text-slate-400 list-decimal list-inside", children: [
            /* @__PURE__ */ jsxs("li", { children: [
              "Find your PHP config file:",
              /* @__PURE__ */ jsx("code", { className: "block mt-1 text-slate-300 bg-black/40 px-3 py-1.5 rounded font-mono", children: 'php -i | grep "php.ini"' })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              "Edit the file:",
              /* @__PURE__ */ jsx("code", { className: "block mt-1 text-slate-300 bg-black/40 px-3 py-1.5 rounded font-mono", children: "sudo nano /etc/php/8.2/fpm/php.ini" })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              "Update these values:",
              /* @__PURE__ */ jsx("code", { className: "block mt-1 text-emerald-300 bg-black/40 px-3 py-1.5 rounded font-mono whitespace-pre", children: "upload_max_filesize = 300M\npost_max_size = 300M" })
            ] }),
            /* @__PURE__ */ jsxs("li", { children: [
              "Restart PHP and your web server:",
              /* @__PURE__ */ jsx("code", { className: "block mt-1 text-slate-300 bg-black/40 px-3 py-1.5 rounded font-mono whitespace-pre", children: "sudo systemctl restart php8.2-fpm\nsudo systemctl restart nginx" })
            ] }),
            /* @__PURE__ */ jsx("li", { children: "Refresh this page to verify." })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "bg-slate-800/50 border border-white/5 rounded-xl p-4 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-slate-500 text-2xs", children: [
          "After changing the settings and restarting, refresh this page.",
          /* @__PURE__ */ jsx("br", {}),
          'The "Upload Limit" value in System Info should show ',
          /* @__PURE__ */ jsx("strong", { className: "text-emerald-400", children: "300 MB" }),
          "."
        ] }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "sticky bottom-0 bg-slate-900 border-t border-white/10 px-6 py-3 rounded-b-2xl", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setShowLimitHelp(false),
          className: "w-full py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors",
          children: "Got it, close"
        }
      ) })
    ] }) })
  ] });
}
export {
  Updater as default
};
