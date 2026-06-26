import React, { useState, useEffect, useRef, useMemo } from 'react';import {ScanBarcode, Plus, Minus, Trash2, ShoppingCart, Receipt, Printer, Package,ChevronRight, Lock, Calendar, Activity, Zap, Settings, Clock, TrendingUp,Award, Target, Flame, AlertTriangle, Sparkles, Star, Crown, Rocket,CalendarDays, Users, Play, Square, Database, Warehouse, Search, Shield,Layers, RefreshCw, BarChart3, HelpCircle, ArrowRight, Check, Sun, Moon,Cpu, FileText, Globe, Workflow} from 'lucide-react';// ============================================================================// CANONICAL ECG GHOST SWEEP GRAPH (Pixel Buffer Overwrite Model)// ============================================================================const ECGGraph = ({ data = [], color = '#22d3ee', height = 220 }) => {const canvasRef = useRef(null);const pts = useMemo(() => data.map(p => ({val: isFinite(p?.val) ? p.val : 0,over: !!p?.over,ds: p?.ds})), [data]);const headXRef = useRef(0);const pixelBufferRef = useRef(null);const targetPtsRef = useRef(pts);const ptsLengthRef = useRef(pts.length);const isRunningRef = useRef(false);useEffect(() => {targetPtsRef.current = pts;if (pts.length !== ptsLengthRef.current) {ptsLengthRef.current = pts.length;pixelBufferRef.current = null;headXRef.current = 0;}}, [pts]);useEffect(() => {if (!canvasRef.current || pts.length < 2) return;if (isRunningRef.current) return;isRunningRef.current = true;const canvas = canvasRef.current;
const ctx = canvas.getContext('2d');
let animationFrameId;
const speed = 2.5;
const gapSize = 40;
const dpr = window.devicePixelRatio || 1;

const draw = () => {
  if (!canvasRef.current) return;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || 1;
  const h = rect.height || 1;

  if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(h * dpr)) {
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.scale(dpr, dpr);
    pixelBufferRef.current = null;
    headXRef.current = 0;
  }

  if (!targetPtsRef.current || targetPtsRef.current.length < 2) {
    animationFrameId = requestAnimationFrame(draw);
    return;
  }

  const bufLen = Math.ceil(width);

  const getInterpolatedVal = (dataset, xPos) => {
    const progress = xPos / Math.max(bufLen - 1, 1);
    const index = progress * (dataset.length - 1);
    const i1 = Math.floor(index);
    const i2 = Math.min(dataset.length - 1, i1 + 1);
    const t = index - i1;
    const v1 = dataset[i1]?.val || 0;
    const v2 = dataset[i2]?.val || 0;
    return v1 + (v2 - v1) * (0.5 - 0.5 * Math.cos(Math.PI * t));
  };

  if (!pixelBufferRef.current || pixelBufferRef.current.length !== bufLen) {
    const buf = new Float32Array(bufLen);
    for (let i = 0; i < bufLen; i++) {
      buf[i] = getInterpolatedVal(targetPtsRef.current, i);
    }
    pixelBufferRef.current = buf;
    headXRef.current = 0;
  }

  ctx.clearRect(0, 0, width, h);

  const centerY = h * 0.85;
  const maxVal = Math.max(100, Math.max(...targetPtsRef.current.map(p => p.val || 0)));
  const getY = (val) => h - ((val || 0) / maxVal) * h * 0.85 - h * 0.05;
  const thresholdY = getY(100);

  // Target threshold dashed line
  ctx.beginPath();
  ctx.setLineDash([8, 8]);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
  ctx.lineWidth = 1;
  ctx.moveTo(0, thresholdY);
  ctx.lineTo(width, thresholdY);
  ctx.stroke();
  ctx.setLineDash([]);

  const prevHeadX = headXRef.current;
  headXRef.current += speed;
  let currentHeadX = headXRef.current;

  const didWrap = currentHeadX >= width;
  if (didWrap) {
    headXRef.current = currentHeadX % width;
    currentHeadX = headXRef.current;
  }

  if (!didWrap) {
    for (let i = Math.floor(prevHeadX); i <= Math.floor(currentHeadX) && i < bufLen; i++) {
      pixelBufferRef.current[i] = getInterpolatedVal(targetPtsRef.current, i);
    }
  } else {
    for (let i = Math.floor(prevHeadX); i < bufLen; i++) {
      pixelBufferRef.current[i] = getInterpolatedVal(targetPtsRef.current, i);
    }
    for (let i = 0; i <= Math.floor(currentHeadX); i++) {
      pixelBufferRef.current[i] = getInterpolatedVal(targetPtsRef.current, i);
    }
  }

  let segments = [];
  let currentSegment = [];

  for (let i = 0; i < width; i++) {
    let inGap = false;
    if (currentHeadX + gapSize < width) {
      if (i >= currentHeadX && i <= currentHeadX + gapSize) inGap = true;
    } else {
      if (i >= currentHeadX || i <= (currentHeadX + gapSize) % width) inGap = true;
    }

    if (!inGap) {
      currentSegment.push({ x: i, y: getY(pixelBufferRef.current[i] ?? 0) });
    } else if (currentSegment.length > 0) {
      segments.push(currentSegment);
      currentSegment = [];
    }
  }
  if (currentSegment.length > 0) segments.push(currentSegment);

  const drawZone = (zoneSegments, isGold) => {
    const zoneColor = isGold ? '#fbbf24' : color;
    const fillAlpha = isGold ? '0.15' : '0.1';

    ctx.save();
    const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
    fillGrad.addColorStop(0, isGold ? `rgba(251, 191, 36, ${fillAlpha})` : `rgba(34, 211, 238, ${fillAlpha})`);
    fillGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = fillGrad;
    zoneSegments.forEach(seg => {
      if (seg.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(seg[0].x, centerY);
      seg.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.lineTo(seg[seg.length - 1].x, centerY);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = zoneColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = 10;
    ctx.shadowColor = zoneColor;
    zoneSegments.forEach(seg => {
      if (seg.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(seg[0].x, seg[0].y);
      for (let i = 1; i < seg.length; i++) ctx.lineTo(seg[i].x, seg[i].y);
      ctx.stroke();
    });
    ctx.restore();
  };

  segments.forEach(segment => {
    if (segment.length < 2) return;
    let sub = [segment[0]];
    let curIsGold = segment[0].y < thresholdY;
    for (let i = 1; i < segment.length; i++) {
      const isGold = segment[i].y < thresholdY;
      if (isGold !== curIsGold) {
        drawZone([sub], curIsGold);
        sub = [segment[i]];
        curIsGold = isGold;
      } else {
        sub.push(segment[i]);
      }
    }
    drawZone([sub], curIsGold);
  });

  const headVal = getInterpolatedVal(targetPtsRef.current, currentHeadX);
  const headY = getY(headVal);
  const headIsGold = headY < thresholdY;
  ctx.beginPath();
  ctx.arc(currentHeadX, headY, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = headIsGold ? '#fbbf24' : '#ffffff';
  ctx.shadowBlur = 18;
  ctx.shadowColor = headIsGold ? '#fbbf24' : '#ffffff';
  ctx.fill();

  animationFrameId = requestAnimationFrame(draw);
};

draw();
return () => {
  cancelAnimationFrame(animationFrameId);
  isRunningRef.current = false;
};
}, [pts, color]);return <canvas ref={canvasRef} style={{ width: '100%', height }} />;};// ============================================================================// MAIN SYSTEM APP LANDING PAGE// ============================================================================export default function App() {const [darkMode, setDarkMode] = useState(true);const [activeCategory, setActiveCategory] = useState('POS');// Interactive POS Simulator Stateconst [posCart, setPosCart] = useState([{ id: 1, name: 'Obsidian Server Module V2', price: 1450.00, qty: 1, stock: 12 },{ id: 2, name: 'Holographic Display Terminal', price: 820.00, qty: 2, stock: 5 },]);const [barcodeInput, setBarcodeInput] = useState('');const [cashReceived, setCashReceived] = useState('3200');// Interactive AI Terminal Prompt Stateconst [selectedPrompt, setSelectedPrompt] = useState(null);const [aiStreamingText, setAiStreamingText] = useState('');const [isAiTyping, setIsAiTyping] = useState(false);// Dynamic Graph Scenario Dataconst [graphScenario, setGraphScenario] = useState('normal');const normalGraphData = [{ val: 40, ds: '01' }, { val: 65, ds: '02' }, { val: 50, ds: '03' },{ val: 95, ds: '04' }, { val: 80, ds: '05' }, { val: 110, ds: '06', over: true },{ val: 90, ds: '07' }, { val: 120, ds: '08', over: true }, { val: 105, ds: '09' }];const peakGraphData = [{ val: 90, ds: '01' }, { val: 130, ds: '02', over: true }, { val: 145, ds: '03', over: true },{ val: 120, ds: '04', over: true }, { val: 160, ds: '05', over: true }, { val: 185, ds: '06', over: true },{ val: 140, ds: '07', over: true }, { val: 210, ds: '08', over: true }, { val: 195, ds: '09', over: true }];// Inject Fonts dynamically on component mountuseEffect(() => {const link = document.createElement('link');link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap';link.rel = 'stylesheet';document.head.appendChild(link);return () => {document.head.removeChild(link);};}, []);// POS Inventory List for scanning simulatorconst availableItems = [{ barcode: '88102', name: 'Obsidian Server Module V2', price: 1450.00, stock: 12 },{ barcode: '88105', name: 'Holographic Display Terminal', price: 820.00, stock: 5 },{ barcode: '88109', name: 'Liquid Core Cooling Unit', price: 340.00, stock: 24 },{ barcode: '88112', name: 'Cryptographic Auth Key', price: 150.00, stock: 150 }];// POS Calculationsconst taxRate = 0.16; // 16% Tax Rateconst posSubtotal = posCart.reduce((acc, item) => acc + (item.price * item.qty), 0);const posTaxAmount = posSubtotal * taxRate;const posTotal = posSubtotal + posTaxAmount;const posChangeDue = parseFloat(cashReceived) - posTotal;const handleScanItem = (barcode) => {const target = availableItems.find(i => i.barcode === barcode);if (!target) return;const existing = posCart.find(i => i.id === target.barcode);if (existing) {setPosCart(posCart.map(item => item.id === target.barcode ? { ...item, qty: item.qty + 1 } : item));} else {setPosCart([...posCart, { id: target.barcode, name: target.name, price: target.price, qty: 1, stock: target.stock }]);}setBarcodeInput('');};const updatePOSQty = (id, delta) => {setPosCart(posCart.map(item => {if (item.id === id) {const nextQty = Math.max(1, item.qty + delta);return { ...item, qty: nextQty };}return item;}));};const removePOSItem = (id) => {setPosCart(posCart.filter(item => item.id !== id));};// AI Streaming Simulator Engineconst prompts = [{id: 1,title: 'Current Net Margin Strategy',question: 'Evaluate VenQore ledger Net Margin for Q2 and isolate tax liabilities.',response: [VENQORE CORE RECONCILIATION ENGINE - V3.4]\n\nSearching Ledger: 'journal_items' (COA Account mapped to 'Sales/Revenue')\nLive calculations matched automatically against 5 Categories of Correctness.\n\n-> Q2 Gross Income: $1,425,800.00\n-> Total Cost of Goods Sold (FIFO Costing): $621,400.00\n-> Net Operational Expense (OPEX): $240,200.00\n-> Calculated Net Profit Margin: 39.57%\n-> Regional GST/VAT liabilities mapped: $228,128.00 (Status: Reconciled & Saved)},{id: 2,title: 'Inventory Forecasting Audit',question: 'Perform FIFO stock aging audit and predict next reorder point.',response: [VENQORE STOCK TRACKER - FIFO BATCH SYSTEM]\n\nAnalysis Completed across 3 Warehouses:\n\n-> Primary Depot (Chicago): 4,500 units 'Quantum CPU V1' detected.\n-> Batch Expiry Trace: Healthy. No product batches expiring < 180 days.\n-> Lead-time analysis: Average delivery time from supplier is 12 days.\n-> Recommended Action: Reorder trigger set for SKU 'CPU-8801' at 450 units.\n-> Auto-generates PO draft: YES (Scheduled for Thursday run).}];const handleTriggerAI = (prompt) => {if (isAiTyping) return;setSelectedPrompt(prompt.id);setIsAiTyping(true);setAiStreamingText('');let index = 0;const interval = setInterval(() => {if (index < prompt.response.length) {setAiStreamingText((prev) => prev + prompt.response.charAt(index));index++;} else {clearInterval(interval);setIsAiTyping(false);}}, 15);};return (<div className={min-h-screen font-sans transition-colors duration-500 overflow-x-hidden ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-950'}}>  {/* ----------------------------------------------------------------------
      NAVBAR & GLASSMOPRHIC CONTAINER
      ---------------------------------------------------------------------- */}
  <nav className={`fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-md transition-colors ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
    <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/20">
          V
        </div>
        <span className="font-bold text-xl tracking-tight font-display">
          VENQORE<span className="text-cyan-400">.</span>
        </span>
        <span className="hidden md:inline px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 text-[10px] font-bold tracking-widest uppercase">
          V12 QORE ENGINE
        </span>
      </div>

      <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
        <a href="#features" className={`hover:text-cyan-400 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Capabilities</a>
        <a href="#pos-demo" className={`hover:text-cyan-400 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>POS Simulator</a>
        <a href="#ai-assistant" className={`hover:text-cyan-400 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Autonomous AI</a>
        <a href="#accounting" className={`hover:text-cyan-400 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Reconciliation</a>
        <a href="#integrations" className={`hover:text-cyan-400 transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Integrations</a>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-lg border transition-colors ${darkMode ? 'border-slate-800 bg-slate-900 text-yellow-400' : 'border-slate-200 bg-slate-100 text-slate-800'}`}
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <a
          href="#pricing"
          className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-semibold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity"
        >
          Get Started
        </a>
      </div>
    </div>
  </nav>

  {/* ----------------------------------------------------------------------
      HERO SECTION — APPLE MEETS STRIPE
      ---------------------------------------------------------------------- */}
  <section className="relative pt-32 pb-24 px-6 overflow-hidden">
    {/* Ambient Grid and Blur Backgrounds */}
    <div className="absolute inset-0 pointer-events-none z-0">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px]" />
      <div className={`absolute inset-0 opacity-10 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] ${darkMode ? 'opacity-10' : 'opacity-20'}`} />
    </div>

    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
      {/* Left Text Column */}
      <div className="lg:col-span-6 space-y-8 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 text-xs font-semibold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
          </span>
          THE FUTURE OF ERP REDESIGNED
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-none font-display">
          The Enterprise Engine<br />
          With <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Zero Margin for Error</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
          Most accounting platforms round numbers and lose your stock. VenQore runs on an unbreakable, **Double-Entry Financial Accounting Engine** verified by 635 automated test suites. Built for high-velocity POS systems and multi-store operations.
        </p>

        <div className="flex flex-wrap gap-4 pt-4">
          <a href="#pos-demo" className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform">
            Launch Live Simulator
          </a>
          <a href="#pricing" className={`px-6 py-3.5 rounded-xl border font-bold text-sm tracking-wide hover:bg-white/5 transition-all ${darkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-800 bg-white'}`}>
            14-Day Free Trial
          </a>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-800">
          <div>
            <p className="text-3xl font-extrabold text-cyan-400 tracking-tight font-display">100%</p>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Double-Entry Audit</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-indigo-400 tracking-tight font-display">&lt; 3ms</p>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Transaction Speed</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-amber-400 tracking-tight font-display">635+</p>
            <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Validated Scenarios</p>
          </div>
        </div>
      </div>

      {/* Right Visual Command Center Mockup */}
      <div className="lg:col-span-6 relative">
        <div className={`p-1 rounded-3xl border shadow-2xl transition-colors duration-500 ${darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-white/60'}`}>
          <div className={`rounded-[22px] overflow-hidden p-6 relative ${darkMode ? 'bg-slate-950/80' : 'bg-slate-50'}`}>
            
            {/* Visual Glassmorphic Widget 1: Live Revenue Counter */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Active Store Terminal Net Revenue</p>
                <h2 className="text-3xl font-black tracking-tight font-display mt-1 text-cyan-400">
                  $1,425,800<span className="text-slate-600 font-normal">.00</span>
                </h2>
              </div>
              <div className="p-3 bg-cyan-400/10 text-cyan-400 rounded-2xl border border-cyan-400/20">
                <TrendingUp size={24} />
              </div>
            </div>

            {/* Simulated Product Command Workspace Mockup */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'}`}>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Inventory Health</span>
                <p className="text-lg font-black mt-1 text-emerald-500">99.98% Healthy</p>
                <p className="text-[10px] text-slate-500 mt-1">Zero FIFO anomalies detected</p>
              </div>
              <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'}`}>
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">OmniSearch Index</span>
                <p className="text-lg font-black mt-1">45,000+ SKUs</p>
                <p className="text-[10px] text-slate-500 mt-1">Fuzzy-matching active</p>
              </div>
            </div>

            {/* Real-time Graph Visual (Dynamic sweep placeholder) */}
            <div className={`p-4 rounded-2xl border mb-2 relative ${darkMode ? 'bg-slate-900/20 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase text-slate-500 tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Double-Entry System Health
                </span>
                <span className="text-[10px] font-mono text-cyan-400">V12-SYNC</span>
              </div>
              <ECGGraph data={normalGraphData} color="#22d3ee" height={100} />
            </div>

            {/* Floating Micro-Badge */}
            <div className="absolute -bottom-4 -left-4 p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <Shield size={16} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Audit Status</p>
                <p className="text-[11px] font-bold text-emerald-500">Category 1 Passed</p>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 animate-spin">
                <RefreshCw size={16} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Synchronizer</p>
                <p className="text-[11px] font-bold text-indigo-400">Reverb Active</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </section>

  {/* ----------------------------------------------------------------------
      TRUSTED BY SECURE MARQUEE
      ---------------------------------------------------------------------- */}
  <section className={`py-12 border-y ${darkMode ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-100/50 border-slate-200'}`}>
    <div className="max-w-7xl mx-auto px-6 text-center">
      <p className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-6">
        TRUSTED BY ELITE HIGH-VELOCITY ENTERPRISES GLOBALLY
      </p>
      <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
        <span className="font-extrabold text-2xl tracking-tight font-display">STRIPE<span className="text-cyan-400">.</span></span>
        <span className="font-extrabold text-2xl tracking-tight font-display">LINEAR<span className="text-indigo-400">.</span></span>
        <span className="font-extrabold text-2xl tracking-tight font-display">APPLE ENTERPRISE</span>
        <span className="font-extrabold text-2xl tracking-tight font-display">VERCEL<span className="text-amber-400">.</span></span>
        <span className="font-extrabold text-2xl tracking-tight font-display">WOOCOMMERCE</span>
      </div>
    </div>
  </section>

  {/* ----------------------------------------------------------------------
      BUSINESS COMMAND CENTER SHOWCASE (INTERACTIVE MODULES)
      ---------------------------------------------------------------------- */}
  <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
    <div className="text-center max-w-3xl mx-auto mb-16">
      <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
        The Multi-Store Business Command Center
      </h2>
      <p className="text-slate-400 mt-4 leading-relaxed">
        One platform, zero boundaries. Swap between core business configurations directly to visual maps of warehouse assets and cashier terminals.
      </p>
    </div>

    {/* Feature/Module Tabs */}
    <div className="flex flex-wrap justify-center gap-3 mb-12">
      {['POS Terminal', 'Warehouse Godowns', 'AI Core & Search', 'Double-Entry Accounting'].map((tab) => (
        <button
          key={tab}
          onClick={() => {
            if (tab === 'POS Terminal') setActiveCategory('POS');
            if (tab === 'Warehouse Godowns') setActiveCategory('Inventory');
            if (tab === 'AI Core & Search') setActiveCategory('AI');
            if (tab === 'Double-Entry Accounting') setActiveCategory('Accounting');
          }}
          className={`px-5 py-3 rounded-xl font-bold text-sm uppercase tracking-wider border transition-all ${
            (tab === 'POS Terminal' && activeCategory === 'POS') ||
            (tab === 'Warehouse Godowns' && activeCategory === 'Inventory') ||
            (tab === 'AI Core & Search' && activeCategory === 'AI') ||
            (tab === 'Double-Entry Accounting' && activeCategory === 'Accounting')
              ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white border-transparent shadow-lg shadow-cyan-500/10'
              : darkMode ? 'border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white bg-slate-900/40' : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-white shadow-sm'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>

    {/* Dynamic Showcase Grid based on Selected Tab */}
    <div className={`p-1 rounded-3xl border shadow-xl transition-colors ${darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white/40'}`}>
      <div className={`rounded-[22px] p-8 ${darkMode ? 'bg-slate-950/80' : 'bg-slate-50'}`}>
        {activeCategory === 'POS' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-400/20">
                <ScanBarcode size={24} />
              </div>
              <h3 className="text-2xl font-extrabold font-display">POS Terminal Supercharged</h3>
              <p className="text-slate-400 leading-relaxed">
                A lightning-fast terminal built for supermarkets and busy retail floors. Supports instant keyboard shortcuts, fuzzing typos, automated cash rounding, and split payments. Connects straight to local thermal printers without delay.
              </p>
              <ul className="space-y-3 font-semibold text-sm">
                <li className="flex items-center gap-3"><Check size={16} className="text-cyan-400" /> One-Click Barcode Scanning</li>
                <li className="flex items-center gap-3"><Check size={16} className="text-cyan-400" /> Split Card/Cash/Credit Khata</li>
                <li className="flex items-center gap-3"><Check size={16} className="text-cyan-400" /> Auto-Assembly Composite Recipe Deduction</li>
              </ul>
            </div>
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-slate-800">
                <span className="font-bold text-xs uppercase text-slate-500">POS Terminal View</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">ONLINE</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between font-bold text-xs">
                  <span>PRODUCT SKU</span>
                  <span>QTY</span>
                  <span>TOTAL</span>
                </div>
                <div className="flex justify-between font-mono text-sm text-slate-400">
                  <span>AeroGlass Tablet v4</span>
                  <span>1 pcs</span>
                  <span>$820.00</span>
                </div>
                <div className="flex justify-between font-mono text-sm text-slate-400">
                  <span>Quantum Heat Sink</span>
                  <span>2 pcs</span>
                  <span>$680.00</span>
                </div>
                <div className="pt-3 border-t border-slate-850 flex justify-between font-black text-lg text-cyan-400">
                  <span>Total Due</span>
                  <span>$1,500.00</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'Inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                <Warehouse size={24} />
              </div>
              <h3 className="text-2xl font-extrabold font-display">Multi-Warehouse Isolation</h3>
              <p className="text-slate-400 leading-relaxed">
                Lock down inventory assets across separate geographical depots, transit networks, and storefront racks. Supports FIFO batch-expiry trace calculations, waybill inventory logs, and automatic reorder warnings.
              </p>
              <ul className="space-y-3 font-semibold text-sm">
                <li className="flex items-center gap-3"><Check size={16} className="text-indigo-400" /> Dynamic Transfer Vouchers with Waybill Generation</li>
                <li className="flex items-center gap-3"><Check size={16} className="text-indigo-400" /> FIFO Batch Cost Tracking</li>
                <li className="flex items-center gap-3"><Check size={16} className="text-indigo-400" /> Low Stock Level reorder triggers</li>
              </ul>
            </div>
            <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-xs uppercase text-slate-500">Warehouse Stocks</span>
                <span className="text-[11px] font-bold text-slate-400">All Godowns</span>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Central Depot (Chicago)</span>
                    <span className="text-indigo-400">88% Capacity</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>West Coast Depots (LA)</span>
                    <span className="text-cyan-400">34% Capacity</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full rounded-full" style={{ width: '34%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span>Retail Rack Shelf (Store A)</span>
                    <span className="text-emerald-500">12% Capacity (Low)</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '12%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'AI' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <Sparkles size={24} />
              </div>
              <h3 className="text-2xl font-extrabold font-display">Autonomous AI Core</h3>
              <p className="text-slate-400 leading-relaxed">
                Query your entire platform database inside our AI Assistant chat bubble using normal language commands. Get answers to margin fluctuations, aged receivables, stock predictions, and profit breakdowns in real-time.
              </p>
              <ul className="space-y-3 font-semibold text-sm">
                <li className="flex items-center gap-3"><Check size={16} className="text-amber-400" /> Fuzzy-matching query trace</li>
                <li className="flex items-center gap-3"><Check size={16} className="text-amber-400" /> Natural language report compiling</li>
                <li className="flex items-center gap-3"><Check size={16} className="text-amber-400" /> Secure read-only database query logic</li>
              </ul>
            </div>
            <div className={`p-6 rounded-2xl border text-left ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-850">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-bold text-xs uppercase text-slate-500">Autonomous AI Assistant Console</span>
              </div>
              <div className="bg-black/40 p-4 rounded-xl font-mono text-xs text-amber-400 min-h-[140px] space-y-2 overflow-x-auto">
                <p className="text-slate-500">&gt; await database.query('isolate_profit_margin_by_sku')</p>
                <p className="text-emerald-500">[COMPILING COMPLETE IN 3ms]</p>
                <p>&gt; Top SKU: 'Obsidian Module' margin at 58.4%</p>
                <p>&gt; Lowest SKU: 'Cooling Unit' margin at 12.1%</p>
              </div>
            </div>
          </div>
        )}

        {activeCategory === 'Accounting' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <Database size={24} />
              </div>
              <h3 className="text-2xl font-extrabold font-display">Unbending Double-Entry Ledger</h3>
              <p className="text-slate-400 leading-relaxed">
                Zero estimations. VenQore posts balanced, immutable debits and credits automatically to raw journal tables for every operational movement, ensuring verified balance statements matching professional accounting standards.
              </p>
              <ul className="space-y-3 font-semibold text-sm">
                <li className="flex items-center gap-3"><Check size={16} className="text-emerald-500" /> Fully Reconciled Bank Ledger Imports</li>
                <li className="flex items-center gap-3"><Check size={16} className="text-emerald-500" /> Real-time double-entry compliance</li>
                <li className="flex items-center gap-3"><Check size={16} className="text-emerald-500" /> Automated asset depreciation tracking</li>
              </ul>
            </div>
            <div className={`p-6 rounded-2xl border text-left ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-xs uppercase text-slate-500">Journal Balances (Double Entry)</span>
                <span className="text-[11px] font-mono text-emerald-500">RECONCILED</span>
              </div>
              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-slate-900/80">
                  <span>Debit (Assets/Cash)</span>
                  <span className="text-emerald-400">+$24,500.00</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-900/80">
                  <span>Credit (Revenue/Sales)</span>
                  <span className="text-amber-500">-$24,500.00</span>
                </div>
                <div className="h-px bg-slate-800 my-1" />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Difference Status</span>
                  <span>Balanced ($0.00)</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  </section>

  {/* ----------------------------------------------------------------------
      POS LIVE SIMULATOR SECTION (THE HIGHLIGHT INTERACTIVE DEMO)
      ---------------------------------------------------------------------- */}
  <section id="pos-demo" className={`py-24 px-6 border-y relative overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-100/30 border-slate-200'}`}>
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 text-xs font-semibold uppercase tracking-widest">
          Live Terminal Interface
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight mt-4">
          Test Our POS Simulator Live
        </h2>
        <p className="text-slate-400 mt-4 leading-relaxed">
          Don't take our word for it. Test adding items, scanning barcodes, updating quantities, and processing checkouts directly below.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Product Catalog Selection (Simulator Inputs) */}
        <div className={`lg:col-span-4 p-6 rounded-3xl border flex flex-col justify-between text-left ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Package size={18} className="text-cyan-400" />
              Product Catalog
            </h3>
            <p className="text-xs text-slate-400 mb-6">Click any product card to scan/insert it straight into the active sales screen on the right.</p>
            
            <div className="space-y-3">
              {availableItems.map((item) => (
                <button
                  key={item.barcode}
                  onClick={() => handleScanItem(item.barcode)}
                  className={`w-full p-3.5 rounded-2xl border text-left flex justify-between items-center transition-all hover:scale-[1.01] active:scale-98 ${
                    darkMode ? 'bg-slate-950/80 border-slate-850 hover:border-cyan-400/40' : 'bg-slate-50 border-slate-200 hover:border-cyan-400'
                  }`}
                >
                  <div>
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">Barcode: {item.barcode} | Stock: {item.stock}</p>
                  </div>
                  <span className="font-bold text-cyan-400 font-display">${item.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Barcode input simulation */}
          <div className="pt-6 border-t border-slate-800/60 mt-6">
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Simulate Barcode Scan (Enter 88102, 88105, 88109, 88112)</label>
            <div className="relative">
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScanItem(barcodeInput)}
                placeholder="Scan or type barcode..."
                className={`w-full py-3 pl-10 pr-4 rounded-xl outline-none font-bold text-sm ${
                  darkMode ? 'bg-slate-950 border border-slate-850 text-white focus:border-cyan-400' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-cyan-400'
                }`}
              />
              <ScanBarcode size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <button
                onClick={() => handleScanItem(barcodeInput)}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-cyan-400 text-slate-950 text-xs font-bold hover:bg-cyan-300"
              >
                Scan
              </button>
            </div>
          </div>
        </div>

        {/* Right: Active Cashier Register Screen (Simulator Output) */}
        <div className={`lg:col-span-8 p-6 rounded-3xl border flex flex-col justify-between text-left ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <ShoppingCart size={18} className="text-cyan-400" />
                <h3 className="font-bold text-sm uppercase tracking-wider">ACTIVE REGISTER SCREEN</h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 text-[10px] font-bold">STATION A</span>
            </div>

            {/* Cart Rows */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              {posCart.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between gap-4 text-xs transition-colors ${
                    darkMode ? 'bg-slate-950/80 border-slate-850' : 'bg-slate-50 border-slate-150'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Unit Price: ${item.price.toFixed(2)}</p>
                  </div>

                  {/* Qty Controls */}
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-0.5 rounded-xl shrink-0">
                    <button
                      onClick={() => updatePOSQty(item.id, -1)}
                      className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center font-bold font-mono text-white text-xs">{item.qty}</span>
                    <button
                      onClick={() => updatePOSQty(item.id, 1)}
                      className="w-7 h-7 rounded-lg hover:bg-slate-800 flex items-center justify-center text-slate-400"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  {/* Line Total */}
                  <div className="text-right min-w-[70px] shrink-0 font-display">
                    <span className="font-bold text-sm text-cyan-400">${(item.price * item.qty).toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => removePOSItem(item.id)}
                    className="text-slate-500 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {posCart.length === 0 && (
                <div className="py-12 text-center text-slate-500">
                  <ShoppingCart size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="font-bold text-sm">Cart is empty.</p>
                  <p className="text-xs">Click items on the left to scan or simulate barcode values.</p>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Math & Processing */}
          <div className="mt-8 pt-6 border-t border-slate-850">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Subtotal</span>
                <p className="font-mono text-sm">${posSubtotal.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Tax Amount (16% GST)</span>
                <p className="font-mono text-sm text-amber-500">${posTaxAmount.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Total Invoice Due</span>
                <p className="text-xl font-black text-cyan-400 font-display">${posTotal.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Amount Tendered (Cash)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-sm text-slate-400">$</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0.00"
                    className={`w-full py-2.5 pl-8 pr-4 rounded-xl font-mono text-sm font-bold ${
                      darkMode ? 'bg-slate-950 border border-slate-850 text-white focus:border-cyan-400' : 'bg-slate-50 border border-slate-200 text-slate-900 focus:border-cyan-400'
                    }`}
                  />
                </div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1.5">Cash Change Due</span>
                <div className={`py-2.5 px-4 rounded-xl font-mono text-sm font-black ${
                  posChangeDue >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                }`}>
                  {posChangeDue >= 0 ? `$${posChangeDue.toFixed(2)}` : `Shortage of $${Math.abs(posChangeDue).toFixed(2)}`}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (posCart.length === 0) return alert('Cannot checkout empty cart!');
                if (posChangeDue < 0) return alert('Tendered amount insufficient!');
                alert(`POS Invoice successfully posted to balanced ledger! Total: $${posTotal.toFixed(2)} | Change: $${posChangeDue.toFixed(2)}`);
                setPosCart([]);
              }}
              className="w-full mt-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/10 hover:opacity-95 transition-opacity"
            >
              Post Invoice & Record Ledger Entries
            </button>
          </div>

        </div>
      </div>
    </div>
  </section>

  {/* ----------------------------------------------------------------------
      INVENTORY & WAREHOUSE EXCELLENCE
      ---------------------------------------------------------------------- */}
  <section className="py-24 px-6 max-w-7xl mx-auto text-left">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-6">
        <span className="px-3 py-1 rounded-full border border-indigo-400/20 bg-indigo-400/5 text-indigo-400 text-xs font-semibold uppercase tracking-widest">
          Multi-Warehouse Systems
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
          Warehouse Godowns<br />
          & Trace Batch Systems
        </h2>
        <p className="text-slate-400 leading-relaxed">
          VenQore monitors separate warehouses in different physical locations, including stock shifts and transfers. Ensure exact inventory tracking, and get automated batch-expiry warnings before stock degrades.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <Cpu size={24} className="text-indigo-400 mb-2" />
            <h4 className="font-bold text-sm">Batch Serial Tracking</h4>
            <p className="text-xs text-slate-500 mt-1">Isolate specific batches by color, size, and incoming serial number.</p>
          </div>
          <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
            <Warehouse size={24} className="text-cyan-400 mb-2" />
            <h4 className="font-bold text-sm">Transfer Logs</h4>
            <p className="text-xs text-slate-500 mt-1">Inter-depot stock transfer logs completed with automatic waybill generation.</p>
          </div>
        </div>
      </div>

      {/* High Fidelity Transfer Voucher Preview */}
      <div className={`p-1 rounded-3xl border shadow-xl transition-colors ${darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white/40'}`}>
        <div className={`rounded-[22px] p-6 relative ${darkMode ? 'bg-slate-950/80' : 'bg-slate-50'}`}>
          <div className="flex justify-between items-center mb-6 border-b border-dashed border-slate-800 pb-4">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500">Inventory Transfer Waybill</span>
              <p className="font-bold text-sm mt-0.5">Voucher: #ST-99801</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
              IN TRANSIT
            </span>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500">Source Godown</span>
              <p className="font-bold text-sm mt-0.5">Central Depot (Chicago)</p>
            </div>
            <div>
              <span className="text-[9px] uppercase font-bold text-slate-500">Destination Godown</span>
              <p className="font-bold text-sm mt-0.5">Retail Floor (Store A)</p>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <span className="text-[9px] uppercase font-bold text-slate-500">Shipped Items Line list</span>
            <div className="p-3 bg-slate-900 rounded-xl text-xs flex justify-between items-center font-mono">
              <span>CPU Module Variant-Blue</span>
              <span>100 units</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl text-xs flex justify-between items-center font-mono">
              <span>Liquid Cooled Sink</span>
              <span>45 units</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center">
              <Clock size={18} />
            </div>
            <div className="text-left text-xs">
              <p className="font-bold">Estimated Arrival</p>
              <p className="text-slate-500">Thursday, June 25, 2026 at 5:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* ----------------------------------------------------------------------
      AUTONOMOUS AI CORE TERMINAL (INTERACTIVE CONSOLE)
      ---------------------------------------------------------------------- */}
  <section id="ai-assistant" className={`py-24 px-6 border-y relative overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-100/30 border-slate-200'}`}>
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="px-3 py-1 rounded-full border border-amber-400/20 bg-amber-400/5 text-amber-400 text-xs font-semibold uppercase tracking-widest">
          Natural Language Ledger Queries
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight mt-4">
          Autonomous AI Ledger Assistant
        </h2>
        <p className="text-slate-400 mt-4 leading-relaxed">
          Simply ask your AI Assistant to pull up calculations, check aged debts, or analyze product profit margins in plain English. No complex SQL required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left: Pre-configured AI Prompts */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4 text-left">
          <div className="space-y-3">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400 animate-pulse" />
              Select Sample Ledger Queries
            </h3>
            {prompts.map((p) => (
              <button
                key={p.id}
                onClick={() => handleTriggerAI(p)}
                className={`w-full p-4 rounded-2xl border text-left flex justify-between items-start transition-all hover:scale-[1.01] active:scale-98 ${
                  selectedPrompt === p.id
                    ? 'border-amber-400 bg-amber-400/5'
                    : darkMode ? 'bg-slate-900 border-slate-850 hover:border-amber-400/30' : 'bg-white border-slate-200 hover:border-amber-400'
                }`}
              >
                <div>
                  <p className="font-bold text-sm text-slate-100">{p.title}</p>
                  <p className="text-xs text-slate-500 mt-1 italic">"{p.question}"</p>
                </div>
                <ArrowRight size={16} className="text-slate-500 shrink-0 mt-0.5" />
              </button>
            ))}
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-500 leading-relaxed mt-6">
            ⚠️ **Security Boundary Lock:** The AI Assistant is hard-wired for Read-Only operations. It runs separate query models that can never write, delete, or alter any posted financial transactions.
          </div>
        </div>

        {/* Right: Active Live Streaming Console */}
        <div className={`lg:col-span-7 p-6 rounded-3xl border text-left flex flex-col justify-between ${
          darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div>
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-850">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="font-bold text-xs uppercase text-slate-500">Autonomous AI Assistant Console</span>
            </div>

            <div className="bg-black/40 p-4 rounded-xl font-mono text-xs text-amber-400 min-h-[220px] space-y-2 overflow-x-auto select-all">
              {selectedPrompt ? (
                <div className="whitespace-pre-wrap">{aiStreamingText || 'System calculating...'}</div>
              ) : (
                <div className="text-slate-600 italic">Select one of the sample queries on the left to see the AI generate structured reports in real-time.</div>
              )}
              {isAiTyping && <span className="inline-block w-2 h-4 bg-amber-500 animate-pulse ml-1" />}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-850 flex items-center justify-between mt-6 text-xs text-slate-500">
            <span>Core Engine: VenQore-AI-V12</span>
            <span className="font-mono">Status: Connected</span>
          </div>
        </div>

      </div>
    </div>
  </section>

  {/* ----------------------------------------------------------------------
      ACCOUNTING & PROFIT INTELLIGENCE (WITH BLUEPRINT ECG GRAPH)
      ---------------------------------------------------------------------- */}
  <section id="accounting" className="py-24 px-6 max-w-7xl mx-auto text-left">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      
      <div className="lg:col-span-5 space-y-6">
        <span className="px-3 py-1 rounded-full border border-emerald-400/20 bg-emerald-400/5 text-emerald-400 text-xs font-semibold uppercase tracking-widest">
          Double-Entry Financial Accounting
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
          Balanced Ledger<br />
          & Gross Profit Truth
        </h2>
        <p className="text-slate-400 leading-relaxed">
          Most checkout software lies about profit. They use loose approximations. VenQore posts balanced, immutable debits and credits automatically to raw journal tables for every item sold, ensuring absolute truth on balance statements.
        </p>

        <div className="flex gap-2 bg-slate-900 border border-slate-850 p-1 rounded-xl w-max">
          <button
            onClick={() => setGraphScenario('normal')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              graphScenario === 'normal' ? 'bg-cyan-400 text-slate-950 font-black shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Normal Operations
          </button>
          <button
            onClick={() => setGraphScenario('peak')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              graphScenario === 'peak' ? 'bg-amber-400 text-slate-950 font-black shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            Peak Scaling Event
          </button>
        </div>
        <p className="text-xs text-slate-500">
          *Toggle scenarios to test the **Pixel Buffer Overwrite** model. Watch the sweeping head rewrite the line column-by-column without visual jumps!*
        </p>
      </div>

      <div className="lg:col-span-7">
        <div className={`p-1 rounded-3xl border shadow-xl transition-colors ${darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white/40'}`}>
          <div className={`rounded-[22px] p-6 relative ${darkMode ? 'bg-slate-950/80' : 'bg-slate-50'}`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-cyan-400" />
                <span className="font-bold text-xs uppercase text-slate-500">Live Sweep Performance Monitor</span>
              </div>
              <span className="font-mono text-xs text-cyan-400 uppercase tracking-widest">{graphScenario} scenario active</span>
            </div>

            <div className="mb-4">
              <ECGGraph data={graphScenario === 'normal' ? normalGraphData : peakGraphData} color="#22d3ee" height={180} />
            </div>

            <div className="flex justify-between items-center border-t border-slate-850 pt-4 text-xs font-mono text-slate-500">
              <span>Sweep Speed: 2.5px/frame</span>
              <span>Goal threshold: 100%</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  {/* ----------------------------------------------------------------------
      AUTOMATION FLOWCHART & PRODUCTIVITY
      ---------------------------------------------------------------------- */}
  <section className={`py-24 px-6 border-y relative overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-100/30 border-slate-200'}`}>
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="px-3 py-1 rounded-full border border-indigo-400/20 bg-indigo-400/5 text-indigo-400 text-xs font-semibold uppercase tracking-widest">
          Zero-human Workflows
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight mt-4">
          Autonomous Auto-Assembly Triggers
        </h2>
        <p className="text-slate-400 mt-4 leading-relaxed">
          Set automated triggers linking your recipes to inventories. When composite items are purchased at POS, raw ingredients are automatically deducted in real-time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left items-stretch">
        
        <div className={`p-6 rounded-3xl border flex flex-col justify-between ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-400/10 text-cyan-400 flex items-center justify-center border border-cyan-400/20">
              <ShoppingCart size={20} />
            </div>
            <h4 className="font-black text-lg">1. POS Purchase Trigger</h4>
            <p className="text-sm text-slate-400 leading-relaxed">A customer checks out a composite meal or package item at the cash register floor.</p>
          </div>
          <span className="text-cyan-400 font-mono text-xs mt-6">STEP 01</span>
        </div>

        <div className={`p-6 rounded-3xl border flex flex-col justify-between ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 animate-spin">
              <Workflow size={20} />
            </div>
            <h4 className="font-black text-lg">2. Auto-Assembly Engine</h4>
            <p className="text-sm text-slate-400 leading-relaxed">VenQore reads the predefined recipe matrix to identify constituent raw materials instantly.</p>
          </div>
          <span className="text-indigo-400 font-mono text-xs mt-6">STEP 02</span>
        </div>

        <div className={`p-6 rounded-3xl border flex flex-col justify-between ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
              <Database size={20} />
            </div>
            <h4 className="font-black text-lg">3. Real-Time Balance Deduction</h4>
            <p className="text-sm text-slate-400 leading-relaxed">Raw batch stocks are cleanly deducted across separate depots with zero-human interaction.</p>
          </div>
          <span className="text-emerald-500 font-mono text-xs mt-6">STEP 03</span>
        </div>

      </div>
    </div>
  </section>

  {/* ----------------------------------------------------------------------
      SYSTEM INTEGRATIONS (3D NODES MOCKUP)
      ---------------------------------------------------------------------- */}
  <section id="integrations" className="py-24 px-6 max-w-7xl mx-auto">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
      
      <div className="space-y-6">
        <span className="px-3 py-1 rounded-full border border-cyan-400/20 bg-cyan-400/5 text-cyan-400 text-xs font-semibold uppercase tracking-widest">
          Unified Ecosystem Connections
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-none">
          Deep Marketplace Integrations
        </h2>
        <p className="text-slate-400 leading-relaxed">
          Connect external online marketplaces, bank accounts, custom SMTP platforms, and local thermal systems directly in our settings dashboard.
        </p>
        <div className="space-y-3 font-semibold text-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center font-bold text-[10px]">1</div>
            <span>WooCommerce stock & customer synchronizer</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center font-bold text-[10px]">2</div>
            <span>External accounting CSV reconciliation tools</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-cyan-400/10 text-cyan-400 flex items-center justify-center font-bold text-[10px]">3</div>
            <span>Direct WebUSB thermal print connections</span>
          </div>
        </div>
      </div>

      {/* Integration nodes visual box */}
      <div className={`p-1 rounded-3xl border shadow-xl transition-colors ${darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white/40'}`}>
        <div className={`rounded-[22px] p-8 ${darkMode ? 'bg-slate-950/80' : 'bg-slate-50'} grid grid-cols-2 sm:grid-cols-3 gap-4`}>
          {[
            { name: 'WooCommerce', active: true },
            { name: 'Shopify Sync', active: true },
            { name: 'QuickBooks', active: true },
            { name: 'Amazon Store', active: false },
            { name: 'Custom SMTP', active: true },
            { name: 'SMS Gateways', active: false }
          ].map((node) => (
            <div
              key={node.name}
              className={`p-4 rounded-2xl border text-center relative ${
                darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
              }`}
            >
              <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${node.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
              <Globe size={18} className="mx-auto text-slate-500 mb-2" />
              <p className="font-bold text-xs">{node.name}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  </section>

  {/* ----------------------------------------------------------------------
      PRICING PREVIEW
      ---------------------------------------------------------------------- */}
  <section id="pricing" className={`py-24 px-6 border-t border-b relative overflow-hidden ${darkMode ? 'bg-slate-950 border-slate-900' : 'bg-slate-100/30 border-slate-200'}`}>
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="px-3 py-1 rounded-full border border-indigo-400/20 bg-indigo-400/5 text-indigo-400 text-xs font-semibold uppercase tracking-widest">
          Pricing Options
        </span>
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight mt-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-slate-400 mt-4 leading-relaxed">
          No hidden fees. Choose the tier that matches your business scale. Scale with absolute certainty.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch justify-center max-w-5xl mx-auto text-left">
        
        {/* Starter Plan */}
        <div className={`p-8 rounded-3xl border flex flex-col justify-between ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest block mb-1">Starter Tier</span>
            <h3 className="font-bold text-xl mb-4">Single Location</h3>
            <div className="mb-6 font-display">
              <span className="text-4xl font-extrabold">$29</span>
              <span className="text-slate-500"> / month</span>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Perfect for single storefront operations and local boutique businesses seeking balanced ledger control.</p>
            <div className="h-px bg-slate-800 mb-6" />
            <ul className="space-y-3 text-xs font-semibold">
              <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Single Checkout Station</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Double-Entry General Ledger</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Standard Multi-Warehouse Log</li>
            </ul>
          </div>
          <button className="w-full mt-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors">
            Start Trial
          </button>
        </div>

        {/* Premium Plan (Highlighted) */}
        <div className="p-8 rounded-3xl border-2 border-cyan-400 bg-gradient-to-br from-cyan-400/5 to-indigo-600/5 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-cyan-400/10 text-cyan-400 text-[9px] font-black tracking-widest uppercase">
            MOST POPULAR
          </div>
          <div>
            <span className="text-[10px] uppercase font-black text-cyan-400 tracking-widest block mb-1">Professional Tier</span>
            <h3 className="font-bold text-xl mb-4">Multi-Store Growth</h3>
            <div className="mb-6 font-display">
              <span className="text-4xl font-extrabold">$59</span>
              <span className="text-slate-500"> / month</span>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Excellent for growing enterprises looking to sync multiple warehouse depots and cashier terminals instantly.</p>
            <div className="h-px bg-cyan-400/20 mb-6" />
            <ul className="space-y-3 text-xs font-semibold">
              <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Up to 5 Checkout Stations</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Dynamic Inter-Warehouse Transfers</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> WooCommerce Real-Time Sync</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Read-Only AI Ledger Assistant</li>
            </ul>
          </div>
          <button className="w-full mt-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-xs uppercase tracking-wider transition-opacity shadow-lg shadow-cyan-500/10 hover:opacity-90">
            Start Trial
          </button>
        </div>

        {/* Enterprise Plan */}
        <div className={`p-8 rounded-3xl border flex flex-col justify-between ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div>
            <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest block mb-1">Enterprise Tier</span>
            <h3 className="font-bold text-xl mb-4">Godown Command</h3>
            <div className="mb-6 font-display">
              <span className="text-4xl font-extrabold">$149</span>
              <span className="text-slate-500"> / month</span>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Engineered for large distribution logistics, composite production assemblies, and high-frequency checks.</p>
            <div className="h-px bg-slate-800 mb-6" />
            <ul className="space-y-3 text-xs font-semibold">
              <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Unlimited POS Stations</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Composite Auto-Assembly Cookbook</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Custom SMTP Domain connections</li>
              <li className="flex items-center gap-2"><Check size={14} className="text-cyan-400" /> Immutable Audit-History Logs</li>
            </ul>
          </div>
          <button className="w-full mt-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors">
            Contact Sales
          </button>
        </div>

      </div>
    </div>
  </section>

  {/* ----------------------------------------------------------------------
      FINAL CALL TO ACTION
      ---------------------------------------------------------------------- */}
  <section className="py-24 px-6 relative overflow-hidden">
    {/* Background Radial Glow */}
    <div className="absolute inset-0 pointer-events-none z-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px]" />
    </div>

    <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
      <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-none">
        Isolate Your Ledgers.<br />
        Secure Your Scale.
      </h2>
      <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
        Register your store name in under 30 seconds and test the exact mathematics of Double-Entry with a 14-day premium trial today.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <a href="#pos-demo" className="px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/20 hover:scale-[1.01] transition-transform">
          Launch Live POS Demo
        </a>
        <a href="#pricing" className={`px-8 py-4 rounded-xl border font-bold text-sm tracking-wide hover:bg-white/5 transition-all ${darkMode ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-800'}`}>
          Review Pricing Plans
        </a>
      </div>
    </div>
  </section>

  {/* ----------------------------------------------------------------------
      FOOTER WITH COPYRIGHT & TECHNICAL STATUS
      ---------------------------------------------------------------------- */}
  <footer className={`py-12 px-6 border-t ${darkMode ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200'}`}>
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-500">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-indigo-600 flex items-center justify-center text-white font-bold text-[10px]">
          V
        </div>
        <span>© 2026 VenQore Technologies Inc. All rights reserved.</span>
      </div>

      <div className="flex items-center gap-6">
        <span className="flex items-center gap-1.5 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          All Systems Operational
        </span>
        <span className="font-mono">V12-QORE ACTIVE</span>
      </div>
    </div>
  </footer>

</div>
);}