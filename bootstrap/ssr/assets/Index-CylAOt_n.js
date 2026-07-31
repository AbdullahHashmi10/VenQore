import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Database, RefreshCw, Cpu, VolumeX, Volume2, HelpCircle, X, Check, Server, AlertCircle, Key, Bug, ShieldCheck, AlertTriangle, Wifi, Shield, Rocket, Copy, RotateCcw, EyeOff, Eye, Zap, Download, ChevronRight, Gauge, MemoryStick } from "lucide-react";
import { Head, router } from "@inertiajs/react";
import axios from "axios";
const useSound = (muted) => {
  const playTone = (freq, type, duration, vol = 0.1) => {
    if (muted || typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
    }
  };
  return {
    click: () => playTone(1200, "sine", 0.1, 0.05),
    hover: () => playTone(800, "sine", 0.05, 0.02),
    success: () => {
      playTone(800, "sine", 0.1);
      setTimeout(() => playTone(1200, "sine", 0.2), 100);
    },
    error: () => playTone(150, "sawtooth", 0.3, 0.1),
    typing: () => playTone(1e3, "sine", 0.03, 0.02),
    warp: () => {
      if (muted) return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 2);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 2);
      } catch (e) {
      }
    }
  };
};
const GlobalStyles = () => /* @__PURE__ */ jsx("style", { children: `
        /* --- CORE ANIMATIONS --- */
        @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
        }
        @keyframes grid-move {
            0% { background-position: 0 0; transform: perspective(500px) rotateX(60deg) translateY(0); }
            100% { background-position: 0 50px; transform: perspective(500px) rotateX(60deg) translateY(50px); }
        }
        @keyframes warp-speed {
            0% { transform: scale(1); opacity: 0.2; }
            50% { opacity: 1; }
            100% { transform: scale(4); opacity: 0; }
        }
        @keyframes hologram-scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }

        /* --- UTILITIES --- */
        .glass-panel {
            background: rgba(10, 10, 15, 0.75);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
        }
        
        .noise-bg {
            position: absolute;
            inset: 0;
            opacity: 0.04;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            pointer-events: none;
            z-index: 0;
        }

        /* Standard Grid */
        .tech-grid {
            background-image: 
                linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 40px 40px;
            animation: grid-move 20s linear infinite;
            transform-origin: 50% 0%;
        }

        /* Warp Mode Grid */
        .warp-active .tech-grid {
            animation: grid-move 0.2s linear infinite; /* Extreme Speed */
            background-image: 
                linear-gradient(rgba(99, 102, 241, 0.2) 1px, transparent 1px),
                linear-gradient(90deg, rgba(99, 102, 241, 0.2) 1px, transparent 1px);
            box-shadow: 0 0 100px rgba(99, 102, 241, 0.3);
        }

        /* --- INPUT STYLES --- */
        .tech-input-group { position: relative; transition: all 0.3s ease; }
        .tech-input-group input:focus, .tech-input-group select:focus {
            background: rgba(99, 102, 241, 0.08);
            border-color: #6366f1;
        }

        /* --- TERMINAL --- */
        .scanline-overlay::before {
            content: " ";
            display: block;
            position: absolute;
            top: 0; left: 0; bottom: 0; right: 0;
            background: linear-gradient(to bottom, rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            z-index: 2;
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }

        /* --- STRENGTH METER --- */
        .strength-seg { height: 4px; border-radius: 2px; transition: all 0.3s ease; background: #1e293b; }
        .strength-weak .seg-1 { background: #f43f5e; }
        .strength-medium .seg-1, .strength-medium .seg-2 { background: #fbbf24; }
        .strength-strong .seg-1, .strength-strong .seg-2, .strength-strong .seg-3 { background: #10b981; }

        .hologram-line {
            position: absolute;
            left: 0; width: 100%; height: 2px;
            background: rgba(99, 102, 241, 0.5);
            box-shadow: 0 0 10px rgba(99, 102, 241, 0.8);
            animation: hologram-scan 2s linear infinite;
        }
    ` });
const Background = ({ isWarping }) => /* @__PURE__ */ jsxs("div", { className: `fixed inset-0 overflow-hidden bg-[#050508] z-0 transition-all duration-1000 ${isWarping ? "warp-active" : ""}`, children: [
  /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-tr from-[#0a0a0f] via-[#050508] to-[#0f172a]" }),
  /* @__PURE__ */ jsx("div", { className: "absolute inset-0 tech-grid opacity-30 w-[200%] -ml-[50%] h-[200%] -mt-[20%]" }),
  /* @__PURE__ */ jsx("div", { className: `absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen transition-all duration-1000 ${isWarping ? "opacity-80 scale-150 bg-indigo-500/20" : "animate-pulse"}` }),
  isWarping && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: [...Array(20)].map((_, i) => /* @__PURE__ */ jsx(
    "div",
    {
      className: "absolute w-1 h-40 bg-white/20 rounded-full blur-sm",
      style: {
        transform: `rotate(${i * 18}deg) translateY(${Math.random() * 200 + 100}px)`,
        animation: `warp-speed 0.5s linear infinite ${Math.random() * 0.5}s`
      }
    },
    i
  )) })
] });
function Installer() {
  const [step, setStep] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedFailedCheck, setSelectedFailedCheck] = useState(null);
  const sound = useSound(muted);
  const [scanned, setScanned] = useState(false);
  const [requirements, setRequirements] = useState({});
  const [summary, setSummary] = useState({ critical_passed: 0, critical_total: 0, all_critical_passed: false });
  const [serverInfo, setServerInfo] = useState({});
  const [dbRecommendations, setDbRecommendations] = useState([]);
  const [dbError, setDbError] = useState(null);
  const [licenseKey, setLicenseKey] = useState("");
  const [licenseStatus, setLicenseStatus] = useState("idle");
  const [dbConfig, setDbConfig] = useState({ host: "127.0.0.1", port: "3306", name: "venqore", user: "root", pass: "" });
  const [dbStatus, setDbStatus] = useState("idle");
  const [envMode, setEnvMode] = useState("production");
  const [loading, setLoading] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [installError, setInstallError] = useState(false);
  const [logs, setLogs] = useState([]);
  const [installOptions, setInstallOptions] = useState({ demo: false, clean: true });
  const [backupFile, setBackupFile] = useState(null);
  const backupInputRef = useRef(null);
  const [currentTip, setCurrentTip] = useState(0);
  const terminalEndRef = useRef(null);
  const [backupAnalysis, setBackupAnalysis] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [admin, setAdmin] = useState({ name: "", email: "", password: "", passcode: "", showPass: false });
  const [business, setBusiness] = useState({ name: "", currency: "USD", timezone: "UTC", logo: null });
  const [autoNuke, setAutoNuke] = useState(true);
  useEffect(() => {
    if (step === 1) {
      setTimeout(() => {
        setScanned(true);
        sound.success();
        const runChecks = async () => {
          try {
            const response = await axios.get("/api/installer/requirements");
            const data = response.data;
            setRequirements(data.requirements || {});
            setSummary(data.summary || { critical_passed: 0, critical_total: 0, all_critical_passed: false });
            setServerInfo(data.server_info || {});
            setDbRecommendations(data.db_recommendations || []);
            sound.click();
          } catch (e) {
            console.error("Requirements check failed", e);
            setRequirements({
              "critical_error": {
                label: "⚠️ Connection Issue",
                value: "Server Not Responding",
                passed: false,
                critical: true,
                description: "We couldn't connect to the server to check requirements. This is usually a simple fix!",
                fix: `📋 QUICK TROUBLESHOOTING GUIDE:

🔄 FIRST - TRY REFRESHING
   • Press F5 or click "Re-check" below
   • Sometimes the first load takes a moment

📂 CHECK FILE PERMISSIONS (Most Common Fix)
   • In your hosting File Manager, find these folders:
   • Right-click "storage" folder → Permissions → Set to 755
   • Right-click "bootstrap/cache" folder → Permissions → Set to 755

🔑 VERIFY .HTACCESS FILE
   • Make sure ".htaccess" file exists in the "public" folder
   • If missing, re-upload it from your backup

📝 CHECK PHP VERSION
   • Go to cPanel → "Select PHP Version"
   • Make sure PHP 8.2 or higher is selected

🆘 STILL STUCK?
   • Contact your hosting provider's support
   • Ask them to check if PHP is running correctly
   • Show them this URL and ask for help

💡 GOOD NEWS: Once this page loads, you'll enter your database details in Step 3 - no manual file editing required!`,
                required: "Connection OK"
              }
            });
            setSummary({ critical_passed: 0, critical_total: 1, all_critical_passed: false });
            sound.error();
          }
        };
        runChecks();
      }, 1500);
    }
  }, [step]);
  useEffect(() => {
    if (backupFile) {
      handleAnalyzeBackup();
    }
  }, [backupFile]);
  const handleAnalyzeBackup = async () => {
    setIsAnalyzing(true);
    setUploadProgress(0);
    const chunkSize = 1024 * 1024;
    const totalChunks = Math.ceil(backupFile.size / chunkSize);
    const MAX_RETRIES = 3;
    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(backupFile.size, start + chunkSize);
        const chunk = backupFile.slice(start, end);
        const formData = new FormData();
        formData.append("backup", chunk);
        formData.append("step", "analyze_backup");
        formData.append("chunk_number", i);
        formData.append("total_chunks", totalChunks);
        formData.append("filename", backupFile.name);
        let response = null;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
          try {
            response = await axios.post("/api/installer/run", formData);
            break;
          } catch (retryErr) {
            if (attempt === MAX_RETRIES) throw retryErr;
            await new Promise((r) => setTimeout(r, 1e3 * Math.pow(2, attempt - 1)));
          }
        }
        const percent = Math.round((i + 1) / totalChunks * 100);
        setUploadProgress(percent);
        if (i === totalChunks - 1 && response) {
          setBackupAnalysis(response.data);
          setShowPreview(true);
          sound.success();
        }
      }
    } catch (err) {
      console.error("Chunk Upload Failed after retries", err);
      alert("Upload Failed after 3 retries: " + (err.response?.data?.error || err.message));
      setBackupFile(null);
      sound.error();
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };
  const allChecksPassed = summary.all_critical_passed;
  const failedChecks = Object.entries(requirements).filter(([_, r]) => r.critical && !r.passed);
  const verifyLicense = async () => {
    setLicenseStatus("verifying");
    sound.typing();
    try {
      const res = await axios.post("/api/installer/check-license", { code: licenseKey });
      if (res.data.status === "success") {
        setLicenseStatus("success");
        sound.success();
      } else {
        setLicenseStatus("error");
        sound.error();
      }
    } catch (e) {
      setLicenseStatus("error");
      sound.error();
    }
  };
  const tips = [
    "Use the built-in AI Engine to forecast next month's sales trends.",
    "Press F11 on the POS screen for immersive mode.",
    "You can install the PWA to use the system offline.",
    "Configure automated backups in Settings > Maintenance.",
    "Create unlimited staff accounts with granular permissions."
  ];
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % tips.length);
      }, 4e3);
      return () => clearInterval(interval);
    }
  }, [loading]);
  const completedStepsRef = useRef(/* @__PURE__ */ new Set());
  const runInstallation = async (retry = false) => {
    if (retry) {
      setInstallError(false);
      setLogs((prev) => [...prev, { time: (/* @__PURE__ */ new Date()).toLocaleTimeString(), text: "--- RETRYING FROM LAST FAILURE ---" }]);
      setInstallProgress(completedStepsRef.current.size * 20);
    } else {
      completedStepsRef.current = /* @__PURE__ */ new Set();
      setLogs([]);
      setInstallProgress(0);
    }
    setLoading(true);
    sound.warp();
    const runStep = async (stepName, payload = {}, increment = 20) => {
      if (completedStepsRef.current.has(stepName)) {
        setLogs((prev) => [...prev, { time: (/* @__PURE__ */ new Date()).toLocaleTimeString(), text: `✓ ${stepName} (already done, skipping)` }]);
        setInstallProgress((prev) => Math.min(prev + increment, 100));
        return true;
      }
      try {
        if (payload instanceof FormData) {
          if (!payload.has("step")) {
            payload.append("step", stepName);
          }
          await axios.post("/api/installer/run", payload);
        } else {
          await axios.post("/api/installer/run", { step: stepName, data: payload });
        }
        completedStepsRef.current.add(stepName);
        setInstallProgress((prev) => Math.min(prev + increment, 100));
        return true;
      } catch (e) {
        if (stepName === "write_env" && (e.message === "Network Error" || e.code === "ERR_NETWORK")) {
          setLogs((prev) => [...prev, { time: (/* @__PURE__ */ new Date()).toLocaleTimeString(), text: `Server configuring... waiting for reboot...` }]);
          await new Promise((resolve) => setTimeout(resolve, 3e3));
          try {
            if (payload instanceof FormData) {
              await axios.post("/api/installer/run", payload);
            } else {
              await axios.post("/api/installer/run", { step: stepName, data: payload });
            }
            completedStepsRef.current.add(stepName);
            setInstallProgress((prev) => Math.min(prev + increment, 100));
            return true;
          } catch (retryError) {
            e = retryError;
          }
        }
        setInstallError(true);
        let errorMsg = e.message;
        if (e.response?.data) {
          if (typeof e.response.data === "object" && e.response.data.error) {
            errorMsg = e.response.data.error;
          } else if (typeof e.response.data === "object" && e.response.data.message) {
            errorMsg = e.response.data.message;
          } else if (typeof e.response.data === "string") {
            const htmlMatch = e.response.data.match(/<title>(.*?)<\/title>/i) || e.response.data.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i) || e.response.data.match(/<p[^>]*>(.*?)<\/p>/i);
            errorMsg = htmlMatch ? htmlMatch[1].replace(/<[^>]*>/g, "") : e.response.data.substring(0, 300);
          }
        }
        setLogs((prev) => [...prev, { time: (/* @__PURE__ */ new Date()).toLocaleTimeString(), text: `ERROR at "${stepName}": ${errorMsg}` }]);
        setLoading(false);
        sound.error();
        return false;
      }
    };
    const log = (text) => setLogs((prev) => [...prev, { time: (/* @__PURE__ */ new Date()).toLocaleTimeString(), text }]);
    log(`Environment Protocol: ${envMode.toUpperCase()}...`);
    if (!await runStep("write_env", dbConfig, 10)) return;
    log("Syncing configuration...");
    await new Promise((resolve) => setTimeout(resolve, 2e3));
    log("Initializing warp drive kernel...");
    if (!await runStep("migrate", { clean: installOptions.clean, ...dbConfig }, 30)) return;
    if (installOptions.demo && backupFile) {
      if (!completedStepsRef.current.has("restore_backup")) {
        log(`RECOVERY MODE: Restoring backup from ${backupFile.name}...`);
        const chunkSize = 1024 * 1024;
        const totalChunks = Math.ceil(backupFile.size / chunkSize);
        try {
          const MAX_RETRIES = 3;
          for (let i = 0; i < totalChunks; i++) {
            const start = i * chunkSize;
            const end = Math.min(backupFile.size, start + chunkSize);
            const chunk = backupFile.slice(start, end);
            const formData = new FormData();
            formData.append("backup", chunk);
            formData.append("step", "restore_backup");
            formData.append("chunk_number", i);
            formData.append("total_chunks", totalChunks);
            formData.append("filename", backupFile.name);
            for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
              try {
                await axios.post("/api/installer/run", formData);
                break;
              } catch (retryErr) {
                if (attempt === MAX_RETRIES) throw retryErr;
                log(`Chunk ${i + 1} failed, retrying (${attempt}/${MAX_RETRIES})...`);
                await new Promise((r) => setTimeout(r, 1e3 * Math.pow(2, attempt - 1)));
              }
            }
            const percent = Math.round((i + 1) / totalChunks * 100);
            log(`Restoring Data: ${percent}%...`);
          }
          completedStepsRef.current.add("restore_backup");
          setInstallProgress((prev) => Math.min(prev + 30, 100));
        } catch (e) {
          setInstallError(true);
          log(`RESTORE ERROR: ${e.response?.data?.error || e.message}`);
          setLoading(false);
          sound.error();
          return;
        }
      } else {
        log("✓ restore_backup (already done, skipping)");
        setInstallProgress((prev) => Math.min(prev + 30, 100));
      }
    } else {
      log("Configuring initial system data...");
      if (!await runStep("seed", { demo: installOptions.demo }, 30)) return;
    }
    log("Linking storage crystals...");
    if (!await runStep("symlink", {}, 20)) return;
    log("DEPLOYMENT SUCCESSFUL.");
    setInstallProgress(100);
    sound.success();
    setTimeout(() => {
      setLoading(false);
      setStep(5);
    }, 800);
  };
  const downloadCredentials = () => {
    const content = `
MISSION BRIEFING: VenQore SYSTEM ACCESS
-----------------------------------
Login URL: ${window.location.origin}/login
Admin Email: ${admin.email || "admin@venqore.com"}
Password Hint: ${admin.password ? admin.password.slice(0, 2) + "****" : "****"}
Database: ${dbConfig.name}
Environment: ${envMode}

KEEP THIS FILE SECURE. DELETE AFTER USE.
        `.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "VenQore_Mission_Briefing.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    sound.click();
  };
  const testConnection = async () => {
    setDbStatus("testing");
    setDbError(null);
    sound.click();
    try {
      const res = await axios.post("/api/installer/test-db", dbConfig);
      if (res.data.status === "success") {
        setDbStatus("success");
        setDbError(null);
        sound.success();
      } else {
        setDbStatus("error");
        setDbError(res.data.message || "Connection failed");
        sound.error();
      }
    } catch (error) {
      setDbStatus("error");
      setDbError(error.response?.data?.message || error.message || "Unable to connect to database");
      sound.error();
    }
  };
  const handleFinalize = async () => {
    try {
      await axios.post("/api/installer/run", { step: "create_admin", data: admin });
      await axios.post("/api/installer/run", { step: "finalize" });
      setStep(6);
      sound.success();
    } catch (e) {
      alert("Setup Failed: " + e.message);
      sound.error();
    }
  };
  const getStrength = (pass) => {
    if (!pass) return "";
    if (pass.length < 6) return "weak";
    if (pass.length < 10) return "medium";
    return "strong";
  };
  const strength = getStrength(admin.password);
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen w-full flex items-center justify-center font-sans text-slate-200 selection:bg-indigo-500/30 overflow-hidden relative", children: [
    /* @__PURE__ */ jsx(Head, { title: "System Installer | VenQore" }),
    /* @__PURE__ */ jsx(GlobalStyles, {}),
    showPreview && backupAnalysis && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-300", children: /* @__PURE__ */ jsxs("div", { className: "glass-panel w-full max-w-2xl rounded-2xl border border-indigo-500/30 overflow-hidden animate-in zoom-in-95 duration-300", children: [
      /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-r from-indigo-900/40 to-black p-8 border-b border-indigo-500/20", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-2", children: [
        /* @__PURE__ */ jsx("div", { className: "p-3 bg-indigo-500/20 rounded-lg text-indigo-400", children: /* @__PURE__ */ jsx(Database, { size: 24 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white uppercase tracking-wider", children: backupAnalysis.summary.title }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: backupAnalysis.type === "vyapar_backup" ? "Vyapar Database Decoded" : "VENQORE Backup Detected" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-8", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-indigo-500/5 p-4 rounded-lg border border-indigo-500/10", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-300 leading-relaxed italic", children: [
          '"',
          backupAnalysis.summary.description,
          '"'
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4", children: Object.entries(backupAnalysis.summary.counts).map(([label, count]) => /* @__PURE__ */ jsxs("div", { className: "p-4 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between group hover:border-indigo-500/30 transition-all", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-mono", children: label }),
          /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-indigo-400 group-hover:text-indigo-300", children: count })
        ] }, label)) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 pt-4", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setShowPreview(false);
                setBackupFile(null);
                setBackupAnalysis(null);
                sound.click();
              },
              className: "flex-1 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold text-xs uppercase tracking-widest transition-all",
              children: "Cancel Import"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => {
                setShowPreview(false);
                sound.warp();
              },
              className: "flex-[2] py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all",
              children: "Confirm & Integrate"
            }
          )
        ] })
      ] })
    ] }) }),
    isAnalyzing && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsx(RefreshCw, { className: "w-10 h-10 text-indigo-400 animate-spin" }),
      /* @__PURE__ */ jsx("span", { className: "text-xs font-mono text-indigo-400 uppercase tracking-widest animate-pulse", children: "Scanning Transmission Data..." })
    ] }) }),
    serverInfo.optimizing && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[200] bg-black/90 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-indigo-500 blur-3xl opacity-20 animate-pulse" }),
        /* @__PURE__ */ jsx(Cpu, { className: "text-indigo-400 relative z-10 w-24 h-24 animate-pulse" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-2", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white tracking-widest uppercase", children: "Preparing High-Performance Installer" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 max-w-md", children: "Optimizing server engine for unlimited backup restoration..." })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-64 h-1 bg-slate-800 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "h-full bg-indigo-500 animate-pulse w-full" }) })
    ] }),
    /* @__PURE__ */ jsx(Background, { isWarping: loading }),
    /* @__PURE__ */ jsxs("div", { className: "fixed top-6 right-6 z-50 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => {
        setMuted(!muted);
        sound.click();
      }, className: "p-3 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md text-slate-400 hover:text-white", children: muted ? /* @__PURE__ */ jsx(VolumeX, { size: 18 }) : /* @__PURE__ */ jsx(Volume2, { size: 18 }) }),
      /* @__PURE__ */ jsx("button", { onClick: () => {
        setShowHelp(!showHelp);
        sound.click();
      }, className: "p-3 rounded-full bg-black/40 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md text-slate-400 hover:text-white", children: /* @__PURE__ */ jsx(HelpCircle, { size: 18 }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `fixed inset-y-0 right-0 w-96 bg-[#0c0c12]/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-40 transform transition-transform duration-300 ease-out p-8 ${showHelp ? "translate-x-0" : "translate-x-full"}`, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-8 mt-12", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-xl font-bold text-white flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(HelpCircle, { size: 20, className: "text-indigo-400" }),
          " Help"
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setShowHelp(false), className: "text-slate-500 hover:text-white", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-4", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "If you are stuck, verify your database credentials in cPanel." }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "relative z-10 w-full max-w-4xl px-6", children: /* @__PURE__ */ jsxs("div", { className: "glass-panel rounded-xl relative overflow-hidden transition-all duration-500 min-h-[650px] flex flex-col border-t border-white/10", children: [
      /* @__PURE__ */ jsx("div", { className: "noise-bg" }),
      /* @__PURE__ */ jsxs("div", { className: "h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 relative", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-rose-500/80" }),
            /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-amber-500/80" }),
            /* @__PURE__ */ jsx("div", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500/80" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "h-4 w-px bg-white/10" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-mono text-slate-400 tracking-wider", children: "INSTALLER_V2.5" })
        ] }),
        step > 1 && step < 6 && /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded", children: step === 2 ? "License Check" : step === 3 ? "Config Protocol" : step === 4 ? "Deploy Sequence" : "Admin Init" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 md:p-12 flex-1 relative flex flex-col", children: [
        step < 6 && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-10 px-2 relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 left-0 w-full h-px bg-slate-800 -z-10" }),
          [1, 2, 3, 4, 5, 6].map((num) => {
            const isActive = step >= num;
            return /* @__PURE__ */ jsx("div", { className: "relative flex flex-col items-center gap-2", children: /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all duration-500 ${isActive ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]" : "bg-[#0f1016] border-slate-700 text-slate-500"}`, children: isActive ? /* @__PURE__ */ jsx(Check, { size: 14 }) : num }) }, num);
          })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col justify-center", children: [
          step === 1 && /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-4 duration-500", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-6 relative group", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-indigo-500/10 blur-xl rounded-lg group-hover:bg-indigo-500/20 transition-all" }),
              /* @__PURE__ */ jsxs("div", { className: "relative bg-[#0a0a10]/90 border border-indigo-500/30 rounded-lg p-5 overflow-hidden", children: [
                !scanned && /* @__PURE__ */ jsx("div", { className: "hologram-line" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-indigo-400 font-bold text-sm tracking-widest uppercase", children: [
                    /* @__PURE__ */ jsx(Server, { size: 16 }),
                    " Server Environment"
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "text-[10px] font-mono text-slate-500", children: scanned ? "SCAN_COMPLETE" : "ANALYZING..." })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 text-xs font-mono", children: [
                  /* @__PURE__ */ jsxs("div", { className: "p-3 bg-black/40 rounded border border-white/5", children: [
                    /* @__PURE__ */ jsx("div", { className: "text-slate-500 mb-1", children: "PHP Version" }),
                    /* @__PURE__ */ jsx("div", { className: "text-white", children: serverInfo.php_version || "Scanning..." })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "p-3 bg-black/40 rounded border border-white/5", children: [
                    /* @__PURE__ */ jsx("div", { className: "text-slate-500 mb-1", children: "Memory Limit" }),
                    /* @__PURE__ */ jsx("div", { className: "text-white", children: serverInfo.memory_limit || "Scanning..." })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "p-3 bg-black/40 rounded border border-white/5", children: [
                    /* @__PURE__ */ jsx("div", { className: "text-slate-500 mb-1", children: "Max Upload" }),
                    /* @__PURE__ */ jsx("div", { className: "text-white", children: serverInfo.upload_max_filesize || "Scanning..." })
                  ] })
                ] })
              ] })
            ] }),
            scanned && Object.keys(requirements).length > 0 && /* @__PURE__ */ jsxs("div", { className: `mb-6 p-4 rounded-lg border flex items-center justify-between ${allChecksPassed ? "bg-emerald-500/10 border-emerald-500/30" : "bg-rose-500/10 border-rose-500/30"}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                allChecksPassed ? /* @__PURE__ */ jsx(Check, { size: 20, className: "text-emerald-400" }) : /* @__PURE__ */ jsx(AlertCircle, { size: 20, className: "text-rose-400" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-white", children: allChecksPassed ? "All Requirements Passed!" : `${failedChecks.length} Critical Issue${failedChecks.length > 1 ? "s" : ""} Found` }),
                  /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400", children: [
                    summary.critical_passed,
                    "/",
                    summary.critical_total,
                    " critical • ",
                    summary.optional_passed,
                    "/",
                    summary.optional_total,
                    " optional"
                  ] })
                ] })
              ] }),
              !allChecksPassed && /* @__PURE__ */ jsx("button", { onClick: () => setSelectedFailedCheck(failedChecks[0]), className: "text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 px-3 py-1.5 rounded font-bold uppercase tracking-wide transition-colors", children: "View Fixes" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: `grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 transition-opacity duration-500 max-h-[300px] overflow-y-auto custom-scrollbar ${scanned ? "opacity-100" : "opacity-50 blur-sm pointer-events-none"}`, children: Object.entries(requirements).map(([key, req]) => /* @__PURE__ */ jsx(
              "div",
              {
                onClick: () => !req.passed && setSelectedFailedCheck([key, req]),
                className: `p-3 rounded-lg border transition-all duration-300 relative overflow-hidden ${req.passed ? "bg-emerald-500/5 border-emerald-500/30" : req.critical ? "bg-rose-500/5 border-rose-500/30 cursor-pointer hover:bg-rose-500/10" : "bg-amber-500/5 border-amber-500/30"}`,
                children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                    /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${req.passed ? "bg-emerald-500" : req.critical ? "bg-rose-500" : "bg-amber-500"}` }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("div", { className: "text-xs font-semibold text-slate-200", children: req.label }),
                      /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500", children: req.value })
                    ] })
                  ] }),
                  req.passed ? /* @__PURE__ */ jsx(Check, { size: 12, className: "text-emerald-400" }) : /* @__PURE__ */ jsx(X, { size: 12, className: req.critical ? "text-rose-400" : "text-amber-400" })
                ] })
              },
              key
            )) }),
            selectedFailedCheck && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4", onClick: () => setSelectedFailedCheck(null), children: /* @__PURE__ */ jsxs("div", { className: "bg-[#0c0c12] border border-indigo-500/30 rounded-xl p-6 max-w-2xl w-full animate-in zoom-in-95 max-h-[90vh] overflow-hidden flex flex-col", onClick: (e) => e.stopPropagation(), children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx(HelpCircle, { size: 20, className: "text-indigo-400" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("div", { className: "text-white font-bold", children: selectedFailedCheck[1]?.label || "Setup Needed" }),
                    /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400", children: selectedFailedCheck[1]?.description })
                  ] })
                ] }),
                /* @__PURE__ */ jsx("button", { onClick: () => setSelectedFailedCheck(null), className: "text-slate-500 hover:text-white", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-black/40 rounded-lg p-4 mb-4 flex-1 overflow-y-auto custom-scrollbar", children: [
                /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-3", children: "📖 Step-by-Step Guide" }),
                /* @__PURE__ */ jsx("div", { className: "text-sm text-slate-300 leading-relaxed whitespace-pre-line", children: selectedFailedCheck[1]?.fix })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs pt-2 border-t border-white/5", children: [
                /* @__PURE__ */ jsxs("div", { className: "text-slate-500", children: [
                  "Status: ",
                  /* @__PURE__ */ jsx("span", { className: "text-amber-400", children: selectedFailedCheck[1]?.value }),
                  " • Goal: ",
                  /* @__PURE__ */ jsx("span", { className: "text-emerald-400", children: selectedFailedCheck[1]?.required })
                ] }),
                /* @__PURE__ */ jsx("button", { onClick: () => {
                  setSelectedFailedCheck(null);
                  window.location.reload();
                }, className: "bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold uppercase tracking-wider transition-colors", children: "Re-check" })
              ] })
            ] }) }),
            /* @__PURE__ */ jsx("button", { onClick: () => {
              setStep(2);
              sound.click();
            }, disabled: !allChecksPassed || !scanned, className: `w-full py-4 rounded-lg font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 border ${allChecksPassed && scanned ? "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]" : "bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed"}`, children: allChecksPassed ? "Proceed to License" : "Fix Issues Above to Continue" })
          ] }),
          step === 2 && /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto w-full", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-8 text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 text-indigo-400", children: /* @__PURE__ */ jsx(Key, { size: 32 }) }),
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-white mb-2", children: "License Verification" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400", children: "Please enter your purchase code to activate the system." })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "tech-input-group", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block", children: "License Key / Purchase Code" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "XXXX-XXXX-XXXX-XXXX",
                    value: licenseKey,
                    onChange: (e) => {
                      setLicenseKey(e.target.value);
                      setLicenseStatus("idle");
                    },
                    className: `w-full bg-[#0a0a10] border rounded p-4 text-center text-lg font-mono tracking-widest outline-none transition-colors ${licenseStatus === "error" ? "border-rose-500 text-rose-400" : licenseStatus === "success" ? "border-emerald-500 text-emerald-400" : "border-slate-700 text-white focus:border-indigo-500"}`
                  }
                )
              ] }),
              licenseStatus === "error" && /* @__PURE__ */ jsx("div", { className: "p-3 bg-rose-500/10 border border-rose-500/20 rounded text-center", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-400 font-bold", children: "Invalid License Key. Please check and try again." }) }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    if (licenseStatus === "success") {
                      setStep(3);
                      sound.click();
                    } else {
                      verifyLicense();
                    }
                  },
                  className: `w-full py-4 rounded-lg font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 border ${licenseStatus === "success" ? "bg-emerald-600 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]"}`,
                  disabled: !licenseKey || licenseStatus === "verifying",
                  children: licenseStatus === "verifying" ? /* @__PURE__ */ jsx(RefreshCw, { className: "animate-spin", size: 16 }) : licenseStatus === "success" ? "License Verified - Continue" : "Verify License"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx("a", { href: "#", className: "text-[10px] text-slate-500 hover:text-white transition-colors", children: "Where do I find my purchase code?" }) })
            ] })
          ] }),
          step === 3 && /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto w-full", children: [
            dbRecommendations.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mb-6 p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-lg", children: [
              /* @__PURE__ */ jsxs("div", { className: "text-[10px] uppercase tracking-wider text-indigo-400 font-bold mb-3 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(HelpCircle, { size: 12 }),
                " Quick Setup Tips"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-3", children: dbRecommendations.map((rec, i) => /* @__PURE__ */ jsxs("div", { className: "text-xs text-slate-400", children: [
                /* @__PURE__ */ jsx("div", { className: "text-white font-semibold mb-1", children: rec.title }),
                rec.description
              ] }, i)) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mb-6 p-1 bg-black/40 border border-slate-700 rounded-lg flex relative", children: [
              /* @__PURE__ */ jsx("div", { className: `absolute inset-y-1 w-1/2 bg-indigo-600/20 border border-indigo-500/50 rounded transition-all duration-300 ${envMode === "production" ? "left-1/2" : "left-0"}` }),
              /* @__PURE__ */ jsxs("button", { onClick: () => setEnvMode("local"), className: `flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider relative z-10 transition-colors ${envMode === "local" ? "text-white" : "text-slate-500"}`, children: [
                /* @__PURE__ */ jsx(Bug, { size: 14 }),
                " Local / Testing"
              ] }),
              /* @__PURE__ */ jsxs("button", { onClick: () => setEnvMode("production"), className: `flex-1 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-wider relative z-10 transition-colors ${envMode === "production" ? "text-white" : "text-slate-500"}`, children: [
                /* @__PURE__ */ jsx(ShieldCheck, { size: 14 }),
                " Live / Production"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "tech-input-group", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block", children: "Host" }),
                /* @__PURE__ */ jsx("input", { type: "text", value: dbConfig.host, onChange: (e) => {
                  setDbConfig({ ...dbConfig, host: e.target.value });
                  setDbStatus("idle");
                  setDbError(null);
                }, placeholder: "127.0.0.1 or localhost", className: "w-full bg-[#0a0a10] border border-slate-700 rounded p-3 text-sm text-white font-mono outline-none focus:border-indigo-500" }),
                /* @__PURE__ */ jsx("div", { className: "text-[9px] text-slate-600 mt-1", children: "Usually 127.0.0.1 or localhost" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "tech-input-group", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block", children: "Port" }),
                /* @__PURE__ */ jsx("input", { type: "text", value: dbConfig.port, onChange: (e) => {
                  setDbConfig({ ...dbConfig, port: e.target.value });
                  setDbStatus("idle");
                  setDbError(null);
                }, placeholder: "3306", className: "w-full bg-[#0a0a10] border border-slate-700 rounded p-3 text-sm text-white font-mono outline-none focus:border-indigo-500" }),
                /* @__PURE__ */ jsx("div", { className: "text-[9px] text-slate-600 mt-1", children: "Default MySQL port is 3306" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "col-span-2 tech-input-group", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block", children: "Database Name" }),
                /* @__PURE__ */ jsx("input", { type: "text", value: dbConfig.name, onChange: (e) => {
                  setDbConfig({ ...dbConfig, name: e.target.value });
                  setDbStatus("idle");
                  setDbError(null);
                }, placeholder: "venqore", className: `w-full bg-[#0a0a10] border rounded p-3 text-sm text-white font-mono outline-none transition-colors ${dbError ? "border-rose-500" : "border-slate-700 focus:border-indigo-500"}` }),
                /* @__PURE__ */ jsx("div", { className: "text-[9px] text-slate-600 mt-1", children: "On shared hosting: usually prefixed like username_dbname" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "tech-input-group", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block", children: "Username" }),
                /* @__PURE__ */ jsx("input", { type: "text", value: dbConfig.user, onChange: (e) => {
                  setDbConfig({ ...dbConfig, user: e.target.value });
                  setDbStatus("idle");
                  setDbError(null);
                }, placeholder: "root", className: "w-full bg-[#0a0a10] border border-slate-700 rounded p-3 text-sm text-white font-mono outline-none focus:border-indigo-500" }),
                /* @__PURE__ */ jsx("div", { className: "text-[9px] text-slate-600 mt-1", children: "Same prefix as database name" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "tech-input-group", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block", children: "Password" }),
                /* @__PURE__ */ jsx("input", { type: "password", placeholder: "••••••••", onChange: (e) => {
                  setDbConfig({ ...dbConfig, pass: e.target.value });
                  setDbStatus("idle");
                  setDbError(null);
                }, className: "w-full bg-[#0a0a10] border border-slate-700 rounded p-3 text-sm text-white font-mono outline-none focus:border-indigo-500" })
              ] })
            ] }),
            dbError && /* @__PURE__ */ jsx("div", { className: "mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg animate-in slide-in-from-top-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 18, className: "text-rose-500 mt-0.5 flex-shrink-0" }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { className: "text-sm text-rose-300 font-bold mb-1", children: "Connection Failed" }),
                /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400 mb-2", children: dbError }),
                /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-slate-500", children: [
                  /* @__PURE__ */ jsx("strong", { className: "text-indigo-400", children: "How to fix:" }),
                  " Double-check your credentials in cPanel ",
                  ">",
                  " MySQL Databases. Make sure the user is added to the database with ALL PRIVILEGES."
                ] })
              ] })
            ] }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
              /* @__PURE__ */ jsxs("button", { onClick: testConnection, className: `flex-1 py-3 rounded-lg border font-mono text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${dbStatus === "success" ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" : dbStatus === "error" ? "border-rose-500 text-rose-400 bg-rose-500/10" : "border-slate-700 text-slate-400 hover:border-slate-500"}`, children: [
                dbStatus === "testing" ? /* @__PURE__ */ jsx(RefreshCw, { className: "animate-spin", size: 12 }) : dbStatus === "success" ? /* @__PURE__ */ jsx(Check, { size: 12 }) : /* @__PURE__ */ jsx(Wifi, { size: 12 }),
                dbStatus === "testing" ? "Testing..." : dbStatus === "success" ? "Connected!" : "Test Connection"
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: () => {
                setStep(4);
                sound.click();
              }, disabled: dbStatus !== "success", className: `flex-[2] py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-300 ${dbStatus === "success" ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg" : "bg-slate-800 text-slate-600 cursor-not-allowed"}`, children: "Save & Continue" })
            ] })
          ] }),
          step === 4 && /* @__PURE__ */ jsx("div", { className: "animate-in fade-in zoom-in-95 duration-500 relative z-20", children: !loading && logs.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-8 max-w-2xl mx-auto", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  onClick: () => {
                    if (!installOptions.demo) {
                      backupInputRef.current.click();
                    }
                    setInstallOptions({ ...installOptions, demo: !installOptions.demo, clean: false });
                  },
                  className: `cursor-pointer p-6 rounded-lg border transition-all duration-300 relative group overflow-hidden ${installOptions.demo ? "bg-indigo-600/10 border-indigo-500/50" : "bg-slate-900/40 border-slate-700 hover:border-slate-500"}`,
                  children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "file",
                        ref: backupInputRef,
                        className: "hidden",
                        onChange: (e) => setBackupFile(e.target.files[0]),
                        accept: ".sql,.vyb"
                      }
                    ),
                    /* @__PURE__ */ jsx("div", { className: `mb-3 ${installOptions.demo ? "text-indigo-400" : "text-slate-500"}`, children: /* @__PURE__ */ jsx(Database, { size: 24 }) }),
                    /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-white mb-1", children: "Restore Backup / Vyapar" }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 leading-relaxed", children: backupFile ? `Selected: ${backupFile.name}` : "Restore from VenQore (.sql) or Vyapar Backup (.vyb). Unlimited (2GB+)" }),
                    isAnalyzing && /* @__PURE__ */ jsx("div", { className: "mt-3 relative w-full h-1 bg-slate-800 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
                      "div",
                      {
                        className: "absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-300 ease-out",
                        style: { width: `${uploadProgress}%` }
                      }
                    ) }),
                    isAnalyzing && /* @__PURE__ */ jsxs("p", { className: "text-[9px] text-indigo-400 mt-1 text-right", children: [
                      uploadProgress,
                      "% Uploaded"
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: `absolute top-3 right-3 w-3 h-3 rounded-full border ${installOptions.demo ? "bg-indigo-500 border-indigo-400 shadow-[0_0_8px_#6366f1]" : "border-slate-600"}` }),
                    backupFile && installOptions.demo && !isAnalyzing && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: (e) => {
                          e.stopPropagation();
                          setBackupFile(null);
                        },
                        className: "absolute bottom-3 right-3 text-[10px] text-rose-400 hover:text-rose-300 underline",
                        children: "Remove File"
                      }
                    )
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { onClick: () => setInstallOptions({ ...installOptions, clean: !installOptions.clean }), className: `cursor-pointer p-6 rounded-lg border transition-all duration-300 relative group overflow-hidden ${installOptions.clean ? "bg-rose-600/10 border-rose-500/50" : "bg-slate-900/40 border-slate-700 hover:border-slate-500"}`, children: [
                /* @__PURE__ */ jsx("div", { className: `mb-3 ${installOptions.clean ? "text-rose-400" : "text-slate-500"}`, children: /* @__PURE__ */ jsx(Shield, { size: 24 }) }),
                /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-white mb-1", children: "Start Fresh" }),
                /* @__PURE__ */ jsx("p", { className: "text-[10px] text-slate-400 leading-relaxed", children: "Wipe existing data and start zero (Recommended)." }),
                /* @__PURE__ */ jsx("div", { className: `absolute top-3 right-3 w-3 h-3 rounded-full border ${installOptions.clean ? "bg-rose-500 border-rose-400 shadow-[0_0_8px_#f43f5e]" : "border-slate-600"}` })
              ] })
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => runInstallation(false), className: "w-full py-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(99,102,241,0.25)] hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all duration-300 group relative overflow-hidden", children: /* @__PURE__ */ jsxs("span", { className: "relative z-10 flex items-center justify-center gap-3", children: [
              /* @__PURE__ */ jsx(Rocket, { size: 16, className: "group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" }),
              "Execute Launch Sequence"
            ] }) })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
            /* @__PURE__ */ jsxs("div", { className: "mb-6 text-center animate-in fade-in slide-in-from-top-4 duration-700 min-h-[60px]", children: [
              /* @__PURE__ */ jsx("div", { className: "text-[10px] uppercase tracking-widest text-indigo-400 font-bold mb-2", children: "Pro Tip" }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-white font-light animate-in fade-in duration-500", children: [
                '"',
                tips[currentTip],
                '"'
              ] }, currentTip)
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsxs("div", { className: "relative w-10 h-10 flex items-center justify-center", children: [
                  /* @__PURE__ */ jsxs("svg", { className: "w-full h-full -rotate-90", children: [
                    /* @__PURE__ */ jsx("circle", { cx: "20", cy: "20", r: "18", stroke: "#334155", strokeWidth: "3", fill: "none" }),
                    /* @__PURE__ */ jsx("circle", { cx: "20", cy: "20", r: "18", stroke: installError ? "#f43f5e" : "#6366f1", strokeWidth: "3", fill: "none", strokeDasharray: "113", strokeDashoffset: 113 - 113 * installProgress / 100, className: "transition-all duration-300 ease-out" })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "absolute text-[10px] font-mono font-bold", children: [
                    installProgress,
                    "%"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("div", { className: "text-sm font-bold text-white", children: installError ? "Installation Paused" : "Installing Core Systems..." }),
                  /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400 font-mono", children: "Process ID: 8942" })
                ] })
              ] }),
              installError && /* @__PURE__ */ jsxs("div", { className: "flex gap-3 animate-in fade-in", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    className: "px-3 py-1.5 rounded border border-slate-700 hover:bg-white/5 text-xs text-slate-300 flex items-center gap-2 transition-colors",
                    onClick: () => {
                      const text = logs.map((l) => `[${l.time}] ${l.text}`).join("\n");
                      navigator.clipboard.writeText(text);
                      sound.click();
                    },
                    children: [
                      /* @__PURE__ */ jsx(Copy, { size: 12 }),
                      " Copy Logs"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs("button", { onClick: () => runInstallation(true), className: "px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-xs text-white flex items-center gap-2 transition-colors font-bold", children: [
                  /* @__PURE__ */ jsx(RotateCcw, { size: 12 }),
                  " Retry Step"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-[#050508]/80 backdrop-blur rounded-lg border border-slate-800 relative overflow-hidden font-mono text-xs", children: [
              /* @__PURE__ */ jsxs("div", { className: "h-8 bg-[#15151a] flex items-center px-4 border-b border-slate-800 justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500", children: "root@venqore-installer:~$ ./install.sh --verbose" }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-slate-700" }),
                  /* @__PURE__ */ jsx("div", { className: "w-2 h-2 rounded-full bg-slate-700" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-4 h-64 overflow-y-auto custom-scrollbar scanline-overlay relative", children: [
                logs.map((log, i) => /* @__PURE__ */ jsxs("div", { className: "mb-1.5 flex gap-3 animate-in fade-in duration-200", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-600 select-none", children: log.time }),
                  /* @__PURE__ */ jsx("span", { className: i === logs.length - 1 ? "text-indigo-400" : "text-emerald-500", children: i === logs.length - 1 ? ">>" : "✓" }),
                  /* @__PURE__ */ jsx("span", { className: installError && i === logs.length - 1 ? "text-rose-400" : "text-slate-300", children: log.text })
                ] }, i)),
                /* @__PURE__ */ jsx("div", { ref: terminalEndRef }),
                loading && !installError && /* @__PURE__ */ jsx("div", { className: "animate-pulse text-indigo-500 mt-2 ml-2", children: "_" })
              ] })
            ] })
          ] }) }),
          step === 5 && /* @__PURE__ */ jsxs("div", { className: "animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto w-full", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-indigo-400 uppercase tracking-widest mb-6", children: "Administrator Profile" }),
              /* @__PURE__ */ jsxs("div", { className: "tech-input-group", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block", children: "Full Name" }),
                /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Abdullah Hashmi", value: admin.name, onChange: (e) => setAdmin({ ...admin, name: e.target.value }), className: "w-full bg-[#0a0a10] border border-slate-700 rounded p-3 text-sm text-white font-mono outline-none focus:border-indigo-500" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "tech-input-group", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block", children: "Email Address" }),
                /* @__PURE__ */ jsx("input", { type: "email", placeholder: "admin@venqore.com", value: admin.email, onChange: (e) => setAdmin({ ...admin, email: e.target.value }), className: "w-full bg-[#0a0a10] border border-slate-700 rounded p-3 text-sm text-white font-mono outline-none focus:border-indigo-500" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "tech-input-group", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block", children: "Secure Password" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx("input", { type: admin.showPass ? "text" : "password", value: admin.password, onChange: (e) => setAdmin({ ...admin, password: e.target.value }), className: "w-full bg-[#0a0a10] border border-slate-700 rounded p-3 text-sm text-white font-mono outline-none focus:border-indigo-500 pr-10" }),
                  /* @__PURE__ */ jsx("button", { onClick: () => setAdmin({ ...admin, showPass: !admin.showPass }), className: "absolute right-3 top-3 text-slate-500 hover:text-white", children: admin.showPass ? /* @__PURE__ */ jsx(EyeOff, { size: 16 }) : /* @__PURE__ */ jsx(Eye, { size: 16 }) })
                ] }),
                admin.password && /* @__PURE__ */ jsxs("div", { className: `mt-2 grid grid-cols-3 gap-1 strength-${strength}`, children: [
                  /* @__PURE__ */ jsx("div", { className: "strength-seg seg-1" }),
                  /* @__PURE__ */ jsx("div", { className: "strength-seg seg-2" }),
                  /* @__PURE__ */ jsx("div", { className: "strength-seg seg-3" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "tech-input-group", children: [
                /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-2 block", children: "Quick PIN / Passcode (Optional)" }),
                /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsx("input", { type: admin.showPass ? "text" : "password", maxLength: 6, placeholder: "1234", value: admin.passcode, onChange: (e) => setAdmin({ ...admin, passcode: e.target.value }), className: "w-full bg-[#0a0a10] border border-slate-700 rounded p-3 text-sm text-white font-mono outline-none focus:border-indigo-500" }) })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsx("button", { onClick: handleFinalize, className: "w-full py-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all", children: "Create Profile & Launch" }) })
          ] }),
          step === 6 && /* @__PURE__ */ jsxs("div", { className: "text-center animate-in zoom-in-95 duration-700 flex flex-col items-center justify-center h-full", children: [
            /* @__PURE__ */ jsxs("div", { className: "relative mb-8 group cursor-pointer", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-emerald-500/20 rounded-full blur-[50px] animate-pulse-glow" }),
              /* @__PURE__ */ jsxs("div", { className: "relative w-28 h-28 bg-[#0a0a10] border border-emerald-500/30 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform duration-500", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-full border border-emerald-500/20 animate-[spin_10s_linear_infinite]" }),
                /* @__PURE__ */ jsx("div", { className: "absolute inset-2 rounded-full border border-emerald-500/20 animate-[spin_7s_linear_infinite_reverse]" }),
                /* @__PURE__ */ jsx(Zap, { size: 40, className: "text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]" })
              ] })
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "text-5xl font-bold text-white mb-2 tracking-tighter", children: "ONLINE" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 mb-8 max-w-sm mx-auto leading-relaxed text-sm", children: "Systems stable. Welcome to the future." }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-px bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden mb-8 max-w-md w-full", children: [
              /* @__PURE__ */ jsxs("div", { className: "bg-[#0c0c12] p-4 flex flex-col gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-bold", children: "Time" }),
                /* @__PURE__ */ jsx("span", { className: "text-emerald-400 font-mono text-sm", children: "4.2s" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-[#0c0c12] p-4 flex flex-col gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-bold", children: "Memory" }),
                /* @__PURE__ */ jsx("span", { className: "text-indigo-400 font-mono text-sm", children: "12MB" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-[#0c0c12] p-4 flex flex-col gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-slate-500 uppercase tracking-wider font-bold", children: "Status" }),
                /* @__PURE__ */ jsx("span", { className: "text-white font-mono text-sm", children: "OK" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: downloadCredentials, className: "mb-8 flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider hover:text-white transition-colors", children: [
              /* @__PURE__ */ jsx(Download, { size: 14 }),
              " Download Mission Briefing (Credentials)"
            ] }),
            /* @__PURE__ */ jsxs("button", { onClick: async () => {
              try {
                if (autoNuke) {
                  await axios.post("/api/installer/run", { step: "finalize", data: { auto_nuke: true } });
                }
              } catch (e) {
                console.log("Self-destruct optional, continuing...");
              }
              router.visit(route("store.create-or-join"));
            }, className: "px-12 py-4 rounded-full bg-white text-black font-bold text-sm uppercase tracking-widest hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300 flex items-center gap-3", children: [
              "Enter Setup Wizard ",
              /* @__PURE__ */ jsx(ChevronRight, { size: 16 })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "absolute bottom-0 left-0 w-full h-10 border-t border-white/5 bg-black/40 flex items-center justify-between px-8 text-[10px] font-mono text-slate-500 uppercase tracking-wider backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-6", children: [
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" }),
            " System Active"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(Gauge, { size: 10 }),
            " CPU: 12%"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(MemoryStick, { size: 10 }),
            " MEM: 240MB"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsx("span", { children: "Secured by VenQore" }),
          /* @__PURE__ */ jsx("span", { className: "opacity-50", children: "Build 8942" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Installer as default
};
