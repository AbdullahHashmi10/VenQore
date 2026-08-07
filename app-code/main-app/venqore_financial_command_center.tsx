import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Plus, 
  Trash2, 
  Settings, 
  Code, 
  Layers, 
  Activity, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Percent,
  Calculator,
  ShieldAlert,
  Server,
  ToggleLeft,
  ChevronRight,
  Radio,
  Sliders,
  DollarSign as USD_ICON,
  Sparkles
} from 'lucide-react';

// === CANONICAL ECG GHOST SWEEP GRAPH COMPONENT ===
// Conforming strictly to the Physical Pixel Buffer Overwrite architecture
const ECGGraph = ({ data = [], color = '#818cf8', height = 180 }) => {
  const canvasRef = useRef(null);

  // 1. Sanitize incoming data series
  const pts = useMemo(() => data.map(p => ({
    val: isFinite(p?.val) ? p.val : 0,
    over: !!p?.over,
    ds: p?.ds
  })), [data]);

  // 2. State and Animation Refs: pixel buffer acts as source of truth
  const headXRef = useRef(0);
  const pixelBufferRef = useRef(null); // Float32Array storing raw values per pixel column
  const targetPtsRef = useRef(pts);  // Always holds latest data; buffer is updated by sweeping head
  const ptsLengthRef = useRef(pts.length); // Detects shape or interval switches
  const isRunningRef = useRef(false);

  // Keep targetPts in sync: reset buffer only if length of array changes
  useEffect(() => {
    targetPtsRef.current = pts;
    if (pts.length !== ptsLengthRef.current) {
      ptsLengthRef.current = pts.length;
      pixelBufferRef.current = null; // Re-initialize on next sweep frame
      headXRef.current = 0;
    }
  }, [pts]);

  // 4. Radar Animation Sweep Loop
  useEffect(() => {
    if (!canvasRef.current || pts.length < 2) return;
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    const speed = 2.0; // Steady radar speed rate
    const gapSize = 35; // Size of ghost blank space before head
    const dpr = window.devicePixelRatio || 1;

    const draw = () => {
      if (!canvasRef.current) return;
      const rect = canvas.getBoundingClientRect();
      const width = rect.width || 1;
      const h = rect.height || 1;

      // Handle Device Pixel Ratio scaling for retina screens
      if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(h * dpr);
        ctx.scale(dpr, dpr);
        pixelBufferRef.current = null; // Canvas resized: reset buffer
        headXRef.current = 0;
      }

      if (!targetPtsRef.current || targetPtsRef.current.length < 2) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }

      const bufLen = Math.ceil(width);

      // Cosine interpolation to get precise raw intermediate values
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

      // Fill pixel buffer on launch so a live line displays instantly
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
      const getY = (val) => h - ((val || 0) / maxVal) * h * 0.75 - h * 0.10;
      const thresholdY = getY(100);

      // Gold Threshold Reference Line (80% metric limit)
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, thresholdY);
      ctx.lineTo(width, thresholdY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Advance head and stamp targets into the buffer for columns crossed
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
        // Wrap-around buffer stamping
        for (let i = Math.floor(prevHeadX); i < bufLen; i++) {
          pixelBufferRef.current[i] = getInterpolatedVal(targetPtsRef.current, i);
        }
        for (let i = 0; i <= Math.floor(currentHeadX); i++) {
          pixelBufferRef.current[i] = getInterpolatedVal(targetPtsRef.current, i);
        }
      }

      // Build drawing segments by reading strictly from pixel buffer
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

      // Render zones with specific color splits (gold for peak performance levels, indigo for baseline)
      const drawZone = (zoneSegments, isGold) => {
        const zoneColor = isGold ? '#f59e0b' : color;
        const fillAlpha = isGold ? '0.12' : '0.08';

        ctx.save();
        const fillGrad = ctx.createLinearGradient(0, 0, 0, h);
        fillGrad.addColorStop(0, isGold ? `rgba(245, 158, 11, ${fillAlpha})` : `rgba(129, 140, 248, ${fillAlpha})`);
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
        ctx.shadowBlur = 8;
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

      // Sweep head tracking dot: reads directly from live target
      const headVal = getInterpolatedVal(targetPtsRef.current, currentHeadX);
      const headY = getY(headVal);
      const headIsGold = headY < thresholdY;
      ctx.beginPath();
      ctx.arc(currentHeadX, headY, 4, 0, Math.PI * 2);
      ctx.fillStyle = headIsGold ? '#f59e0b' : '#ffffff';
      ctx.shadowBlur = 15;
      ctx.shadowColor = headIsGold ? '#f59e0b' : '#ffffff';
      ctx.fill();
    };

    const animateLoop = () => {
      draw();
      animationFrameId = requestAnimationFrame(animateLoop);
    };

    animateLoop();
    return () => {
      cancelAnimationFrame(animationFrameId);
      isRunningRef.current = false;
    };
  }, [pts, color]);

  return <canvas ref={canvasRef} className="w-full" style={{ height }} />;
};

// === MAIN DYNAMIC COMMAND CENTER APP ===
export default function App() {
  // Inject fonts and CSS drift animations on component mount
  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes drift-orb-one {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        50% { transform: translate(40px, -30px) scale(1.15); }
      }
      @keyframes drift-orb-two {
        0%, 100% { transform: translate(0px, 0px) scale(1); }
        50% { transform: translate(-30px, 40px) scale(1.1); }
      }
      .animate-drift-one {
        animation: drift-orb-one 12s ease-in-out infinite;
      }
      .animate-drift-two {
        animation: drift-orb-two 14s ease-in-out infinite;
      }
      /* Custom glowing range slider thumb styling */
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 9999px;
        background: #818cf8;
        border: 2px solid #ffffff;
        box-shadow: 0 0 10px rgba(129, 140, 248, 0.6);
        cursor: pointer;
        transition: transform 0.1s, background-color 0.1s;
      }
      input[type=range]::-webkit-slider-thumb:hover {
        transform: scale(1.2);
        background: #a5b4fc;
      }
      /* Smooth custom scrollbars */
      .scrollbar-custom::-webkit-scrollbar {
        height: 4px;
        width: 4px;
      }
      .scrollbar-custom::-webkit-scrollbar-track {
        background: rgba(15, 23, 42, 0.3);
      }
      .scrollbar-custom::-webkit-scrollbar-thumb {
        background: rgba(129, 140, 248, 0.3);
        border-radius: 9999px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(style);
    };
  }, []);

  // --- STATE MANAGEMENT ---
  const [exchangeRate, setExchangeRate] = useState(279);
  const [serverCapacity, setServerCapacity] = useState(200);
  const [variableExpenseRate, setVariableExpenseRate] = useState(5);

  const [isAnnualBilling, setIsAnnualBilling] = useState(false);
  const [isFoundingDiscount, setIsFoundingDiscount] = useState(true);
  const [foundingDiscountPercent, setFoundingDiscountPercent] = useState(50);

  // Default plans and configurations
  const [prices, setPrices] = useState({
    pk_exclusive: { 
      name: 'Pakistan Exclusive', 
      pricePkr: 1000, 
      priceUsd: 3.58, 
      activeCount: 30, 
      feePct: 2.5, 
      fixedFee: 15 
    },
    starter: { 
      name: 'Starter', 
      priceUsd: 29, 
      pricePkr: 8091, 
      activeCount: 15, 
      feePct: 6.5, 
      fixedFee: 0.50 
    },
    growth: { 
      name: 'Growth', 
      priceUsd: 59, 
      pricePkr: 16461, 
      activeCount: 10, 
      feePct: 6.5, 
      fixedFee: 0.50 
    },
    business: { 
      name: 'Business', 
      priceUsd: 129, 
      pricePkr: 35991, 
      activeCount: 3, 
      feePct: 6.5, 
      fixedFee: 0.50 
    }
  });

  const [ltdRevenue, setLtdRevenue] = useState({
    tier1Count: 12,
    tier1Price: 79,
    tier2Count: 8,
    tier2Price: 149,
    tier3Count: 4,
    tier3Price: 249
  });

  const [fixedExpenses, setFixedExpenses] = useState([
    { id: '1', name: 'KVM 2 Production Server', amount: 2508, currency: 'PKR' },
    { id: '2', name: 'Domain Registration & Routing', amount: 257, currency: 'PKR' },
    { id: '3', name: 'Database Backups & Cloud Storage', amount: 1500, currency: 'PKR' },
    { id: '4', name: 'Transactional SMTP Email API', amount: 10, currency: 'USD' }
  ]);

  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCurrency, setNewExpenseCurrency] = useState('PKR');

  const [activeTab, setActiveTab] = useState('overview');
  const [copiedNotification, setCopiedNotification] = useState(false);

  const milestones = [
    { targetPkr: 50000, label: 'Server Costs & Domains Covered' },
    { targetPkr: 100000, label: 'Initial Baseline Profit Target' },
    { targetPkr: 200000, label: 'Healthy SaaS Runway Level' },
    { targetPkr: 500000, label: 'Enterprise Scaling Milestone' }
  ];

  // --- ACTIONS ---
  const handlePriceChange = (tier, field, value) => {
    setPrices(prev => {
      const updated = { ...prev };
      const parsedVal = parseFloat(value) || 0;
      
      if (field === 'priceUsd') {
        updated[tier].priceUsd = parsedVal;
        updated[tier].pricePkr = Math.round(parsedVal * exchangeRate);
      } else if (field === 'pricePkr') {
        updated[tier].pricePkr = parsedVal;
        updated[tier].priceUsd = parseFloat((parsedVal / exchangeRate).toFixed(2));
      } else {
        updated[tier][field] = parsedVal;
      }
      return updated;
    });
  };

  const addExpense = (e) => {
    e.preventDefault();
    if (!newExpenseName || !newExpenseAmount) return;

    const newExpense = {
      id: Date.now().toString(),
      name: newExpenseName,
      amount: parseFloat(newExpenseAmount) || 0,
      currency: newExpenseCurrency
    };

    setFixedExpenses(prev => [...prev, newExpense]);
    setNewExpenseName('');
    setNewExpenseAmount('');
  };

  const removeExpense = (id) => {
    setFixedExpenses(prev => prev.filter(exp => exp.id !== id));
  };

  const setPreset = (type) => {
    if (type === 'original_code') {
      setPrices({
        pk_exclusive: { name: 'Pakistan Exclusive', pricePkr: 1000, priceUsd: 3.58, activeCount: 20, feePct: 2.5, fixedFee: 15 },
        starter: { name: 'Starter', priceUsd: 19, pricePkr: 5301, activeCount: 15, feePct: 6.5, fixedFee: 0.50 },
        growth: { name: 'Growth', priceUsd: 39, pricePkr: 10881, activeCount: 10, feePct: 6.5, fixedFee: 0.50 },
        business: { name: 'Business', priceUsd: 79, pricePkr: 22041, activeCount: 3, feePct: 6.5, fixedFee: 0.50 }
      });
    } else if (type === 'recommended') {
      setPrices({
        pk_exclusive: { name: 'Pakistan Exclusive', pricePkr: 1000, priceUsd: 3.58, activeCount: 30, feePct: 2.5, fixedFee: 15 },
        starter: { name: 'Starter', priceUsd: 29, pricePkr: 8091, activeCount: 15, feePct: 6.5, fixedFee: 0.50 },
        growth: { name: 'Growth', priceUsd: 59, pricePkr: 16461, activeCount: 10, feePct: 6.5, fixedFee: 0.50 },
        business: { name: 'Business', priceUsd: 129, pricePkr: 35991, activeCount: 3, feePct: 6.5, fixedFee: 0.50 }
      });
    } else if (type === 'aggressive') {
      setPrices({
        pk_exclusive: { name: 'Pakistan Exclusive', pricePkr: 1500, priceUsd: 5.38, activeCount: 15, feePct: 2.5, fixedFee: 15 },
        starter: { name: 'Starter', priceUsd: 39, pricePkr: 10881, activeCount: 12, feePct: 6.5, fixedFee: 0.50 },
        growth: { name: 'Growth', priceUsd: 89, pricePkr: 24831, activeCount: 8, feePct: 6.5, fixedFee: 0.50 },
        business: { name: 'Business', priceUsd: 249, pricePkr: 69471, activeCount: 2, feePct: 6.5, fixedFee: 0.50 }
      });
    }
  };

  // Keep global PKR and USD currencies synchronized when the exchange rate is edited
  useEffect(() => {
    setPrices(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        if (key !== 'pk_exclusive') {
          updated[key].pricePkr = Math.round(updated[key].priceUsd * exchangeRate);
        }
      });
      return updated;
    });
  }, [exchangeRate]);

  // --- FINANCIAL CALCULATION ENGINE ---
  const totals = useMemo(() => {
    let fixedPkrTotal = 0;
    let fixedUsdTotal = 0;

    fixedExpenses.forEach(exp => {
      if (exp.currency === 'PKR') {
        fixedPkrTotal += exp.amount;
        fixedUsdTotal += exp.amount / exchangeRate;
      } else {
        fixedUsdTotal += exp.amount;
        fixedPkrTotal += exp.amount * exchangeRate;
      }
    });

    let totalGrossPkr = 0;
    let totalGrossUsd = 0;
    let totalFeesPkr = 0;
    let totalFeesUsd = 0;
    let totalPayingStores = 0;
    const storeBreakdown = [];

    Object.entries(prices).forEach(([key, tier]) => {
      const isLocal = key === 'pk_exclusive';
      const storeCount = tier.activeCount;
      totalPayingStores += storeCount;

      let effectivePriceUsd = tier.priceUsd;
      let effectivePricePkr = tier.pricePkr;

      if (isAnnualBilling && !isLocal) {
        effectivePriceUsd = effectivePriceUsd * (10 / 12);
        effectivePricePkr = effectivePricePkr * (10 / 12);
      }

      if (isFoundingDiscount && !isLocal) {
        const factor = (100 - foundingDiscountPercent) / 100;
        effectivePriceUsd = effectivePriceUsd * factor;
        effectivePricePkr = effectivePricePkr * factor;
      }

      const tierGrossPkr = effectivePricePkr * storeCount;
      const tierGrossUsd = effectivePriceUsd * storeCount;

      totalGrossPkr += tierGrossPkr;
      totalGrossUsd += tierGrossUsd;

      let tierFeesPkr = 0;
      let tierFeesUsd = 0;

      if (storeCount > 0) {
        if (isLocal) {
          tierFeesPkr = (tierGrossPkr * (tier.feePct / 100)) + (tier.fixedFee * storeCount);
          tierFeesUsd = tierFeesPkr / exchangeRate;
        } else {
          tierFeesUsd = (tierGrossUsd * (tier.feePct / 100)) + (tier.fixedFee * storeCount);
          tierFeesPkr = tierFeesUsd * exchangeRate;
        }
      }

      totalFeesPkr += tierFeesPkr;
      totalFeesUsd += tierFeesUsd;

      const afterFeesPkr = tierGrossPkr - tierFeesPkr;
      const afterFeesUsd = tierGrossUsd - tierFeesUsd;

      const varExpenseMultiplier = variableExpenseRate / 100;
      const tierVarExpensePkr = afterFeesPkr * varExpenseMultiplier;
      const tierVarExpenseUsd = afterFeesUsd * varExpenseMultiplier;

      const netContributionPkr = afterFeesPkr - tierVarExpensePkr;
      const netContributionUsd = afterFeesUsd - tierVarExpenseUsd;

      storeBreakdown.push({
        key,
        name: tier.name,
        count: storeCount,
        grossPkr: tierGrossPkr,
        grossUsd: tierGrossUsd,
        feesPkr: tierFeesPkr,
        feesUsd: tierFeesUsd,
        afterFeesPkr,
        afterFeesUsd,
        varExpensePkr: tierVarExpensePkr,
        varExpenseUsd: tierVarExpenseUsd,
        netContributionPkr,
        netContributionUsd
      });
    });

    const afterFeesGrandPkr = totalGrossPkr - totalFeesPkr;
    const totalVarExpensesPkr = afterFeesGrandPkr * (variableExpenseRate / 100);
    const totalVarExpensesUsd = totalVarExpensesPkr / exchangeRate;

    const afterAllExpensesPkr = afterFeesGrandPkr - totalVarExpensesPkr;
    const netMrrPkr = afterAllExpensesPkr - fixedPkrTotal;
    const netMrrUsd = netMrrPkr / exchangeRate;

    const totalDeductionsPkr = totalFeesPkr + totalVarExpensesPkr + fixedPkrTotal;
    const totalDeductionsUsd = totalDeductionsPkr / exchangeRate;

    const marginPercent = totalGrossPkr > 0 ? (netMrrPkr / totalGrossPkr) * 100 : 0;

    const totalLtdPkr = (
      (ltdRevenue.tier1Count * ltdRevenue.tier1Price) +
      (ltdRevenue.tier2Count * ltdRevenue.tier2Price) +
      (ltdRevenue.tier3Count * ltdRevenue.tier3Price)
    ) * exchangeRate;

    return {
      fixedPkr: fixedPkrTotal,
      fixedUsd: fixedUsdTotal,
      grossMrrPkr: totalGrossPkr,
      grossMrrUsd: totalGrossUsd,
      feesPkr: totalFeesPkr,
      feesUsd: totalFeesUsd,
      varExpensesPkr: totalVarExpensesPkr,
      varExpensesUsd: totalVarExpensesUsd,
      deductionsPkr: totalDeductionsPkr,
      deductionsUsd: totalDeductionsUsd,
      netMrrPkr,
      netMrrUsd,
      arrPkr: netMrrPkr * 12,
      arrUsd: netMrrUsd * 12,
      marginPercent,
      storeBreakdown,
      totalPayingStores,
      totalLtdPkr
    };
  }, [prices, fixedExpenses, exchangeRate, isAnnualBilling, isFoundingDiscount, foundingDiscountPercent, variableExpenseRate, ltdRevenue]);

  // Generate dynamic points for the ghost sweep graph based on active configurations
  const liveECGData = useMemo(() => {
    const defaultWaves = [35, 42, 68, 55, 72, 115, 82, 98, 120, 88, 105, 112, 92, 125, 115];
    const marginFactor = totals.marginPercent > 0 ? (totals.marginPercent / 100) : 0.4;
    const countFactor = totals.totalPayingStores > 0 ? Math.min(1.5, totals.totalPayingStores / 30) : 0.5;

    return defaultWaves.map((v, i) => {
      const modulatedVal = Math.min(140, Math.max(5, v * (0.4 + marginFactor * 0.45 + countFactor * 0.25)));
      return {
        val: Math.round(modulatedVal),
        ds: `S${i + 1}`
      };
    });
  }, [totals.marginPercent, totals.totalPayingStores]);

  // Custom premium container implementing the Midnight Nebula design system
  function MidnightNebulaCard({ children, className = '', primaryGlow = 'indigo', secondaryGlow = 'purple' }) {
    const glowClasses = {
      indigo: 'bg-indigo-600/20',
      purple: 'bg-purple-600/15',
      emerald: 'bg-emerald-600/20',
      teal: 'bg-teal-600/15',
      amber: 'bg-amber-600/20',
      rose: 'bg-rose-600/15',
      blue: 'bg-blue-600/20'
    };

    const glowPrimary = glowClasses[primaryGlow] || glowClasses.indigo;
    const glowSecondary = glowClasses[secondaryGlow] || glowClasses.purple;

    return (
      <div className={`relative overflow-hidden rounded-2xl bg-slate-900/40 border border-slate-800/80 p-6 group transition duration-300 hover:border-slate-700/60 shadow-2xl backdrop-blur-xl ${className}`}>
        
        {/* Layer 1: Ambient cosmic light orbs drifting slowly */}
        <div className={`absolute top-0 right-0 w-44 h-44 ${glowPrimary} rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 animate-drift-one pointer-events-none`}></div>
        <div className={`absolute bottom-0 left-0 w-44 h-44 ${glowSecondary} rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 animate-drift-two pointer-events-none`}></div>

        {/* Layer 2: Tactile noise overlay texture */}
        <div 
          className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` 
          }}
        ></div>

        {/* Layer 3: Laser gradient bottom accent line */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent opacity-60"></div>

        {/* Layer 4: Interactive content */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500 selection:text-white pb-12" style={{ fontFamily: "'Syne', sans-serif" }}>
      
      {/* Top ambient header bar with status glow */}
      <div className="bg-slate-900/80 backdrop-blur-md py-3 px-4 text-center text-xs font-semibold tracking-wide border-b border-slate-800/60 flex items-center justify-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></span>
        <span className="text-slate-300 font-mono tracking-wider">Telemetry Core Online: ECG Signal sweep matching system parameters for Abdullah.</span>
      </div>

      {/* Main Glass Header */}
      <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Calculator className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                VenQore Finance Core
                <span className="text-3xs font-mono font-bold tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded uppercase">
                  Nebula 2.5
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono">Dynamic system simulation pipeline customized for Abdullah Hashmi</p>
            </div>
          </div>

          {/* Quick configure panel */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80 text-sm">
            <div className="flex items-center gap-2 px-3 py-1 font-mono text-xs">
              <span className="text-slate-400">Exchange Rate:</span>
              <input 
                type="number" 
                value={exchangeRate} 
                onChange={(e) => setExchangeRate(parseInt(e.target.value) || 279)} 
                className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-center text-indigo-400 font-bold focus:outline-none focus:border-indigo-500 shadow-inner"
              />
            </div>
            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-1.5 pr-2 text-xs font-mono">
              <span className="text-slate-500">Presets:</span>
              <button 
                onClick={() => setPreset('original_code')}
                className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 transition"
                title="Legacy configurations: $19, $39, $79"
              >
                Legacy
              </button>
              <button 
                onClick={() => setPreset('recommended')}
                className="px-2.5 py-1 rounded bg-indigo-950/50 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 font-bold transition"
                title="Recommended premium plans: $29, $59, $129"
              >
                Recommended
              </button>
              <button 
                onClick={() => setPreset('aggressive')}
                className="px-2.5 py-1 rounded bg-purple-950/30 hover:bg-purple-900 border border-purple-850 text-purple-300 transition"
                title="Aggressive pricing tiers: $39, $89, $249"
              >
                Aggressive
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Contents */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tabbed Navigation Layout */}
        <div className="flex border-b border-slate-900 mb-8 overflow-x-auto whitespace-nowrap scrollbar-none gap-2 font-mono text-xs">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-4 font-bold border-b-2 transition duration-200 flex items-center gap-2 ${activeTab === 'overview' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <TrendingUp className="h-4 w-4" />
            01 : Platform Commands
          </button>
          <button 
            onClick={() => setActiveTab('pricing')}
            className={`pb-4 px-4 font-bold border-b-2 transition duration-200 flex items-center gap-2 ${activeTab === 'pricing' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Layers className="h-4 w-4" />
            02 : Plan Editor
          </button>
          <button 
            onClick={() => setActiveTab('expenses')}
            className={`pb-4 px-4 font-bold border-b-2 transition duration-200 flex items-center gap-2 ${activeTab === 'expenses' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Activity className="h-4 w-4" />
            03 : Fixed & Variables
          </button>
          <button 
            onClick={() => setActiveTab('code')}
            className={`pb-4 px-4 font-bold border-b-2 transition duration-200 flex items-center gap-2 ${activeTab === 'code' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
          >
            <Code className="h-4 w-4" />
            04 : Laravel Integration Code
          </button>
        </div>

        {/* Tab content 1: Overview Command Dashboard with Integrated Live ECG Ghost Sweep */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            
            {/* Live Telemetry Sweep Graph Section wrapped in Premium Nebula design */}
            <div className="grid grid-cols-1">
              <MidnightNebulaCard primaryGlow="indigo" secondaryGlow="purple" className="relative shadow-inner">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-indigo-400 animate-pulse" />
                      <h3 className="text-sm font-mono font-bold text-slate-200 uppercase tracking-widest">Platform Global Alpha Telemetry</h3>
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-1">Ghost Sweep ECG radar visualization displaying live recurring growth trends and signal variance</p>
                  </div>
                  <div className="flex items-center gap-4 text-3xs font-mono bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block shadow-[0_0_8px_#6366f1]"></span> Recurring Tiers
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_#f59e0b]"></span> Premium Peak Yield (over 100%)
                    </span>
                  </div>
                </div>

                {/* Simulated Waveform Sweep Radar */}
                <div className="bg-slate-950/90 p-3.5 rounded-xl border border-slate-900 shadow-inner">
                  <ECGGraph data={liveECGData} color="#818cf8" height={190} />
                </div>
              </MidnightNebulaCard>
            </div>

            {/* Top Row: Midnight Nebula Key Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <MidnightNebulaCard primaryGlow="emerald" secondaryGlow="teal">
                <span className="text-3xs font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-2">Net Profit</span>
                <div className={`text-2xl font-bold tracking-tight ${totals.netMrrPkr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  PKR {totals.netMrrPkr.toLocaleString()}
                </div>
                <p className="text-3xs font-mono text-slate-400 mt-2 leading-relaxed">
                  USD equivalent: ${totals.netMrrUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} per month after deducting variable fees
                </p>
              </MidnightNebulaCard>

              <MidnightNebulaCard primaryGlow="blue" secondaryGlow="indigo">
                <span className="text-3xs font-mono font-bold text-blue-400 uppercase tracking-widest block mb-2">Gross Subscriptions</span>
                <div className="text-2xl font-bold tracking-tight text-white">
                  PKR {totals.grossMrrPkr.toLocaleString()}
                </div>
                <p className="text-3xs font-mono text-slate-400 mt-2 leading-relaxed">
                  Equivalent to ${totals.grossMrrUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD from total monthly customer subscriptions
                </p>
              </MidnightNebulaCard>

              <MidnightNebulaCard primaryGlow="purple" secondaryGlow="indigo">
                <span className="text-3xs font-mono font-bold text-purple-400 uppercase tracking-widest block mb-2">Annualized Projection</span>
                <div className="text-2xl font-bold tracking-tight text-purple-400">
                  PKR {totals.arrPkr.toLocaleString()}
                </div>
                <p className="text-3xs font-mono text-slate-400 mt-2 leading-relaxed">
                  Projected net ARR equivalent to ${totals.arrUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} USD
                </p>
              </MidnightNebulaCard>

              <MidnightNebulaCard primaryGlow="rose" secondaryGlow="amber">
                <span className="text-3xs font-mono font-bold text-rose-400 uppercase tracking-widest block mb-2">Deduction Pool</span>
                <div className="text-2xl font-bold tracking-tight text-rose-400">
                  PKR {Math.round(totals.deductionsPkr).toLocaleString()}
                </div>
                <p className="text-3xs font-mono text-slate-400 mt-2 leading-relaxed">
                  Checkout fees: PKR {Math.round(totals.feesPkr).toLocaleString()} and Fixed: PKR {totals.fixedPkr.toLocaleString()}
                </p>
              </MidnightNebulaCard>

            </div>

            {/* Sub-Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center shadow-lg">
                <div>
                  <span className="text-4xs font-mono text-slate-500 uppercase tracking-wider block">Lemon Squeezy Cuts</span>
                  <span className="text-sm font-bold text-amber-500 font-mono">PKR {Math.round(totals.feesPkr).toLocaleString()}</span>
                </div>
                <div className="p-2 rounded bg-amber-500/10 text-amber-400 text-xs font-mono">LS Cut</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center shadow-lg">
                <div>
                  <span className="text-4xs font-mono text-slate-500 uppercase tracking-wider block">Active Stores Simulated</span>
                  <span className="text-sm font-bold text-indigo-400 font-mono">{totals.totalPayingStores} Active</span>
                </div>
                <div className="p-2 rounded bg-indigo-500/10 text-indigo-400 text-xs font-mono">Stores</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center shadow-lg">
                <div>
                  <span className="text-4xs font-mono text-slate-500 uppercase tracking-wider block">Server Capacity Limit</span>
                  <span className="text-sm font-bold text-slate-300 font-mono">{serverCapacity} Stores Max</span>
                </div>
                <div className="p-2 rounded bg-slate-800/60 text-slate-400 text-xs font-mono">Limit</div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex justify-between items-center shadow-lg">
                <div>
                  <span className="text-4xs font-mono text-slate-500 uppercase tracking-wider block">Profit Margin Rate</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">{totals.marginPercent.toFixed(1)}%</span>
                </div>
                <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono">Margin</div>
              </div>
            </div>

            {/* Strategic Promotion System with Premium Dark Panels */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    Founding Member Promotion System
                  </h3>
                  <p className="text-sm text-slate-400 max-w-2xl">
                    Early adopters are locked in forever at an attractive rate; this creates urgency and loyalty while allowing your standard pricing blocks to display premium rates.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-6 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                  {/* Annual billing Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={isAnnualBilling} 
                        onChange={(e) => setIsAnnualBilling(e.target.checked)} 
                        className="sr-only"
                      />
                      <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${isAnnualBilling ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
                      <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${isAnnualBilling ? 'translate-x-5' : ''}`}></div>
                    </div>
                    <span className="text-xs font-mono text-slate-300 group-hover:text-slate-100">
                      Annual: 2 Months Free
                    </span>
                  </label>

                  {/* Founding Discount Toggle */}
                  <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={isFoundingDiscount} 
                        onChange={(e) => setIsFoundingDiscount(e.target.checked)} 
                        className="sr-only"
                      />
                      <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${isFoundingDiscount ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
                      <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform duration-200 ${isFoundingDiscount ? 'translate-x-5' : ''}`}></div>
                    </div>
                    <span className="text-xs font-mono text-slate-300 group-hover:text-slate-100">
                      Founding Discount
                    </span>
                  </label>
                </div>
              </div>

              {/* Founding Discount customization panel */}
              {isFoundingDiscount && (
                <div className="pt-6 border-t border-slate-800/60 max-w-xl">
                  <div className="flex justify-between items-center mb-2 font-mono text-xs text-slate-300">
                    <span>Discount Rate:</span>
                    <span className="font-bold text-indigo-400">{foundingDiscountPercent}% discount applied</span>
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="80" 
                    step="5"
                    value={foundingDiscountPercent} 
                    onChange={(e) => setFoundingDiscountPercent(parseInt(e.target.value))}
                    className="w-full accent-indigo-500 h-1.5 bg-slate-850 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-4xs font-mono text-slate-500 mt-1">
                    <span>10% Discount</span>
                    <span>50% (Standard Founding Level)</span>
                    <span>80% Discount</span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Dynamic Sliders & Real-time Capacity Column */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Sliders layout column (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Activity className="h-4.5 w-4.5 text-indigo-400" />
                    Simulate Paying Subscription Volume
                  </h3>

                  <div className="space-y-6">
                    {Object.entries(prices).map(([key, value]) => {
                      const isLocal = key === 'pk_exclusive';
                      
                      // Calculate active local rate displayed
                      let effectiveRate = isLocal ? value.pricePkr : value.priceUsd;
                      if (!isLocal) {
                        if (isAnnualBilling) {
                          effectiveRate = effectiveRate * (10 / 12);
                        }
                        if (isFoundingDiscount) {
                          effectiveRate = effectiveRate * ((100 - foundingDiscountPercent) / 100);
                        }
                      }

                      return (
                        <div key={key} className="p-4 bg-slate-950/80 rounded-xl border border-slate-850/80 shadow-md">
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <div>
                              <span className="text-sm font-bold text-slate-100">{value.name}</span>
                              <span className="ml-2 text-2xs font-mono text-slate-400">
                                {isLocal 
                                  ? `PKR ${Math.round(effectiveRate).toLocaleString()} /mo` 
                                  : `$${effectiveRate.toFixed(2)} USD /mo (PKR ${Math.round(effectiveRate * exchangeRate).toLocaleString()})`
                                }
                              </span>
                            </div>
                            <div className="flex items-center gap-2 font-mono text-xs">
                              <span className="text-slate-500">Paying Stores:</span>
                              <span className="font-extrabold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                                {value.activeCount}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <input 
                              type="range" 
                              min="0" 
                              max="150" 
                              value={value.activeCount} 
                              onChange={(e) => handlePriceChange(key, 'activeCount', e.target.value)}
                              className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>

                          {/* Detail summary block */}
                          <div className="mt-3 flex justify-between text-4xs font-mono text-slate-500 pt-2 border-t border-slate-900">
                            <span>
                              {!isLocal && (isAnnualBilling || isFoundingDiscount) 
                                ? `Active promotional calculations applied` 
                                : `Standard payment pricing`
                              }
                            </span>
                            <span className="text-slate-400 font-medium">
                              Gross simulated pool: PKR {Math.round(totals.storeBreakdown.find(b => b.key === key)?.grossPkr || 0).toLocaleString()}
                            </span>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* LTD Injected Revenue Tracker */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-widest">LTD Upfront Capital Tracker</h3>
                    <span className="text-3xs font-mono font-bold text-purple-400 bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded">
                      One-Time Capital Inflow
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-6 font-mono leading-relaxed">
                    While LTD deals do not show up as monthly recurring metrics (MRR), they provide vital upfront capital injection. Modify these to model your server launch funds.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 shadow-md">
                      <span className="text-4xs font-mono text-slate-400 uppercase tracking-wider block mb-1">Tier 1 ($79) Codes</span>
                      <input 
                        type="number" 
                        value={ltdRevenue.tier1Count} 
                        onChange={(e) => setLtdRevenue(prev => ({ ...prev, tier1Count: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-sm font-mono font-bold text-white text-center focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-4xs font-mono text-slate-500 block mt-2">
                        Gross: PKR {((ltdRevenue.tier1Count * ltdRevenue.tier1Price) * exchangeRate).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 shadow-md">
                      <span className="text-4xs font-mono text-slate-400 uppercase tracking-wider block mb-1">Tier 2 ($149) Codes</span>
                      <input 
                        type="number" 
                        value={ltdRevenue.tier2Count} 
                        onChange={(e) => setLtdRevenue(prev => ({ ...prev, tier2Count: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-sm font-mono font-bold text-white text-center focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-4xs font-mono text-slate-500 block mt-2">
                        Gross: PKR {((ltdRevenue.tier2Count * ltdRevenue.tier2Price) * exchangeRate).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-850 shadow-md">
                      <span className="text-4xs font-mono text-slate-400 uppercase tracking-wider block mb-1">Tier 3 ($249) Codes</span>
                      <input 
                        type="number" 
                        value={ltdRevenue.tier3Count} 
                        onChange={(e) => setLtdRevenue(prev => ({ ...prev, tier3Count: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-sm font-mono font-bold text-white text-center focus:border-indigo-500 focus:outline-none"
                      />
                      <span className="text-4xs font-mono text-slate-500 block mt-2">
                        Gross: PKR {((ltdRevenue.tier3Count * ltdRevenue.tier3Price) * exchangeRate).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Upfront Lifetime Capital Received:</span>
                    <span className="font-bold text-purple-400">PKR {totals.totalLtdPkr.toLocaleString()}</span>
                  </div>
                </div>

              </div>

              {/* Sidebar: Dynamic calculations & server capacity column (1/3 width) */}
              <div className="space-y-6">
                
                {/* Real-time server capacity and safety indicator */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">Server Capacity Tracker</h3>
                  <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">Current storage capacity before scaling to higher performance configurations:</p>
                  
                  {/* Dynamic capacity logic */}
                  {(() => {
                    const pctValue = Math.min((totals.totalPayingStores / serverCapacity) * 100, 100);
                    const isOverCap = totals.totalPayingStores > serverCapacity;
                    const barColorClass = pctValue > 90 ? 'bg-rose-500' : pctValue > 70 ? 'bg-amber-500' : 'bg-emerald-500';

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-slate-400">Capacity Used</span>
                          <span className="font-bold text-white">{pctValue.toFixed(0)}% ({totals.totalPayingStores} / {serverCapacity} stores)</span>
                        </div>

                        <div className="h-6 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800/80 relative shadow-inner">
                          <div className={`h-full transition-all duration-300 ${barColorClass}`} style={{ width: `${pctValue}%` }}></div>
                        </div>

                        {isOverCap && (
                          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-mono flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 animate-pulse" />
                            <div>
                              <p className="font-bold">Over Capacity Safety Limits</p>
                              <p className="text-3xs text-rose-500 mt-1 leading-normal">Abdullah, please upgrade local network configurations to prevent lag.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Milestone targeting list */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-3">Milestone Progress Target</h3>
                  <div className="space-y-3">
                    {milestones.map((ms, index) => {
                      const isAchieved = totals.netMrrPkr >= ms.targetPkr;
                      const averageNetStoreContribution = totals.totalPayingStores > 0 ? (totals.netMrrPkr / totals.totalPayingStores) : 0;
                      const storesNeeded = averageNetStoreContribution > 0 ? Math.ceil((ms.targetPkr + totals.fixedPkr) / averageNetStoreContribution) : 0;

                      return (
                        <div key={index} className={`p-3 rounded-xl border transition-colors duration-250 ${isAchieved ? 'bg-emerald-950/20 border-emerald-800/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'bg-slate-950/40 border-slate-850'}`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-slate-100 font-mono">PKR {ms.targetPkr.toLocaleString()} /mo</span>
                            {isAchieved ? (
                              <span className="text-4xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase">
                                Active ✓
                              </span>
                            ) : (
                              <span className="text-3xs font-mono text-indigo-400">
                                ~{storesNeeded} stores needed
                              </span>
                            )}
                          </div>
                          <span className="text-4xs font-mono text-slate-450 block">{ms.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Specific individual tier break-evens */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-3">Individual Tier Break-Even</h3>
                  <p className="text-xs text-slate-400 mb-4 font-mono leading-relaxed">Total stores required in each tier to completely offset the PK server overhead of PKR {totals.fixedPkr.toLocaleString()}:</p>
                  <div className="space-y-2 font-mono text-xs">
                    {Object.entries(prices).map(([key, value]) => {
                      const netPerStore = value.pricePkr * (1 - (value.feePct / 100));
                      const qty = netPerStore > 0 ? Math.ceil(totals.fixedPkr / netPerStore) : 0;

                      return (
                        <div key={key} className="flex justify-between items-center p-2.5 bg-slate-950/60 rounded-lg border border-slate-850 shadow-md">
                          <span className="text-slate-400">{value.name}</span>
                          <span className="font-bold text-indigo-400">{qty} stores</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>

            {/* P&L Waterfall step diagram */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-6">P&L Waterfall Visualizer</h3>
              
              {(() => {
                const maxIntake = totals.grossMrrPkr || 1;
                const otherExpensesTotal = (totals.grossMrrPkr - totals.feesPkr) * (variableExpenseRate / 100);

                const waterfallData = [
                  { label: 'Gross recurring subscription pool', amount: totals.grossMrrPkr, colorClass: 'bg-indigo-500', isNegative: false },
                  { label: 'Checkout gateway fees (Lemon Squeezy & Local)', amount: totals.feesPkr, colorClass: 'bg-rose-500/80', isNegative: true },
                  { label: 'Calculated other overhead variables', amount: otherExpensesTotal, colorClass: 'bg-rose-400/70', isNegative: true },
                  { label: 'Monthly fixed operational costs', amount: totals.fixedPkr, colorClass: 'bg-amber-500/80', isNegative: true },
                  { label: 'Platform Net Profit', amount: totals.netMrrPkr, colorClass: totals.netMrrPkr >= 0 ? 'bg-emerald-500' : 'bg-rose-500', isNegative: false }
                ];

                return (
                  <div className="space-y-4">
                    {waterfallData.map((item, idx) => {
                      const displayPct = Math.max((Math.abs(item.amount) / maxIntake) * 100, 1);

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
                          <span className="text-slate-450 sm:w-80 shrink-0">{item.label}</span>
                          <div className="flex-1 h-5 bg-slate-950/80 rounded border border-slate-850/80 overflow-hidden relative shadow-inner">
                            <div className={`h-full rounded-sm transition-all duration-300 ${item.colorClass}`} style={{ width: `${displayPct}%` }}></div>
                          </div>
                          <span className={`sm:w-36 text-right font-bold shrink-0 ${item.isNegative ? 'text-rose-400' : 'text-slate-100'}`}>
                            {item.isNegative ? '-' : ''}PKR {Math.round(Math.abs(item.amount)).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Detailed financial matrix breakdown */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-4">Detailed Financial Matrix Breakdown</h3>
              
              <div className="overflow-x-auto scrollbar-custom">
                <table className="w-full text-left text-xs font-mono text-slate-400 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-slate-200">
                      <th className="py-3 px-4">Tier Name</th>
                      <th className="py-3 px-4">Active Count</th>
                      <th className="py-3 px-4">Gross Intake (PKR)</th>
                      <th className="py-3 px-4">Checkout Processing Fees</th>
                      <th className="py-3 px-4">Balance After Fees</th>
                      <th className="py-3 px-4">Other Variables</th>
                      <th className="py-3 px-4">Simulated Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60">
                    {totals.storeBreakdown.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-200">{item.name}</td>
                        <td className="py-3.5 px-4 text-slate-300">{item.count} stores</td>
                        <td className="py-3.5 px-4 text-slate-300">PKR {Math.round(item.grossPkr).toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-rose-400">-PKR {Math.round(item.feesPkr).toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-slate-300">PKR {Math.round(item.afterFeesPkr).toLocaleString()}</td>
                        <td className="py-3.5 px-4 text-rose-400/80">-PKR {Math.round(item.varExpensePkr).toLocaleString()}</td>
                        <td className={`py-3.5 px-4 font-bold ${item.netContributionPkr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          PKR {Math.round(item.netContributionPkr).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Aggregated Final Row */}
                    <tr className="bg-slate-950/80 font-bold text-slate-100">
                      <td className="py-4 px-4">Aggregated Total</td>
                      <td className="py-4 px-4">{totals.totalPayingStores} stores</td>
                      <td className="py-4 px-4 text-indigo-400">PKR {Math.round(totals.grossMrrPkr).toLocaleString()}</td>
                      <td className="py-4 px-4 text-rose-400">-PKR {Math.round(totals.feesPkr).toLocaleString()}</td>
                      <td className="py-4 px-4">PKR {Math.round(totals.grossMrrPkr - totals.feesPkr).toLocaleString()}</td>
                      <td className="py-4 px-4 text-rose-400/80">-PKR {Math.round(totals.varExpensesPkr).toLocaleString()}</td>
                      <td className={`py-4 px-4 font-extrabold text-sm ${totals.netMrrPkr >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        PKR {Math.round(totals.netMrrPkr).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab content 2: Dynamic Pricing Matrix configuration */}
        {activeTab === 'pricing' && (
          <div className="space-y-8 animate-fadeIn">
            
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-2">Dynamic Tier Editor & Price Matrix</h3>
              <p className="text-sm text-slate-400 mb-6 font-mono leading-relaxed">
                Directly configure target plan pricing here. Your modifications will recalculate the waterfall projections, ARR targets, and server capacity limits.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(prices).map(([key, value]) => {
                  const isLocal = key === 'pk_exclusive';
                  return (
                    <div key={key} className={`bg-slate-950/70 border rounded-xl p-5 shadow-lg backdrop-blur-md transition-colors ${isLocal ? 'border-purple-800/50' : 'border-slate-800/80'}`}>
                      
                      <div className="flex justify-between items-center mb-4 font-mono text-xs">
                        <span className={`font-bold uppercase tracking-wider ${isLocal ? 'text-purple-400' : 'text-indigo-400'}`}>
                          {isLocal ? 'Local PK Tier' : 'SaaS Plan'}
                        </span>
                        <span className="text-slate-500">({key})</span>
                      </div>

                      <h4 className="text-sm font-bold text-white mb-4">{value.name}</h4>

                      <div className="space-y-4">
                        
                        {/* USD Input */}
                        {!isLocal && (
                          <div>
                            <label className="text-4xs font-mono text-slate-400 uppercase tracking-widest block mb-1">USD Base Rate /mo</label>
                            <div className="relative">
                              <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">$</span>
                              <input 
                                type="number" 
                                value={value.priceUsd} 
                                onChange={(e) => handlePriceChange(key, 'priceUsd', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-6 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors"
                              />
                            </div>
                          </div>
                        )}

                        {/* PKR Input */}
                        <div>
                          <label className="text-4xs font-mono text-slate-400 uppercase tracking-widest block mb-1">PKR equivalent</label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500 text-3xs font-mono">PKR</span>
                            <input 
                              type="number" 
                              value={value.pricePkr} 
                              onChange={(e) => handlePriceChange(key, 'pricePkr', e.target.value)}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-indigo-500 transition-colors"
                              disabled={!isLocal} // Recalculates based on exchange rate for global tiers
                            />
                          </div>
                        </div>

                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-900 text-4xs font-mono text-slate-500 flex justify-between">
                        <span>Multiplier tracking:</span>
                        <span>{exchangeRate}x rate</span>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Strategic Comparison Module */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              <h3 className="text-base font-bold text-white mb-4">Competitor & Market Context</h3>
              <p className="text-xs text-slate-400 mb-6 font-mono leading-relaxed">
                When merchants compare VenQore to legacy solutions, present this direct matrix. Your optimized premium pricing disrupts these options.
              </p>

              <div className="overflow-x-auto scrollbar-custom">
                <table className="w-full text-left text-xs font-mono text-slate-400 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-200">
                      <th className="py-3 px-4">Alternative Systems</th>
                      <th className="py-3 px-4">Entry Pricing</th>
                      <th className="py-3 px-4">Mid Level Range</th>
                      <th className="py-3 px-4">Enterprise Level</th>
                      <th className="py-3 px-4">Identified SaaS Limitations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    <tr className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">Lightspeed POS</td>
                      <td className="py-3.5 px-4">$89 /month</td>
                      <td className="py-3.5 px-4">$149 /month</td>
                      <td className="py-3.5 px-4">$269 /month</td>
                      <td className="py-3.5 px-4 text-rose-400/80">Forces aggressive per-location upcharges on active subscribers</td>
                    </tr>
                    <tr className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">Shopify Retail</td>
                      <td className="py-3.5 px-4">$29 /month</td>
                      <td className="py-3.5 px-4">$79 /month</td>
                      <td className="py-3.5 px-4">$299 /month</td>
                      <td className="py-3.5 px-4 text-rose-400/80">Missing double-entry general ledger and built-in manufacturing modules</td>
                    </tr>
                    <tr className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">Odoo POS</td>
                      <td className="py-3.5 px-4">$24 /month</td>
                      <td className="py-3.5 px-4">$44 /month</td>
                      <td className="py-3.5 px-4">$79 /month</td>
                      <td className="py-3.5 px-4 text-rose-400/80">Requires dedicated engineering setups to deploy and maintain</td>
                    </tr>
                    <tr className="bg-indigo-950/20 hover:bg-indigo-950/30 text-indigo-300 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-indigo-200">VenQore Platform (Simulated)</td>
                      <td className="py-3.5 px-4 font-bold">${prices.starter.priceUsd} /mo</td>
                      <td className="py-3.5 px-4 font-bold">${prices.growth.priceUsd} /mo</td>
                      <td className="py-3.5 px-4 font-bold">${prices.business.priceUsd} /mo</td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400">Includes double-entry general ledger, native manufacturing, and open API access</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Tab content 3: Expense & Gateways Manager */}
        {activeTab === 'expenses' && (
          <div className="space-y-8 animate-fadeIn">
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Fixed Expenses (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-base font-bold text-white">Platform Fixed Expenses</h3>
                      <p className="text-xs text-slate-400">Model baseline hosting setups, domains, backups, and dedicated server configurations.</p>
                    </div>
                    <span className="text-xs font-mono font-bold bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80 text-slate-300 shadow-md">
                      Total: PKR {totals.fixedPkr.toLocaleString()} /mo
                    </span>
                  </div>

                  {/* Operational Expenses List */}
                  <div className="space-y-3 mb-6">
                    {fixedExpenses.map(exp => (
                      <div key={exp.id} className="flex justify-between items-center p-3.5 bg-slate-950/80 rounded-xl border border-slate-850/80 hover:border-slate-800/60 transition-colors duration-200 shadow-md">
                        <div>
                          <p className="text-xs font-semibold text-white">{exp.name}</p>
                          <p className="text-4xs font-mono text-slate-500">
                            Base: {exp.currency} {exp.amount.toLocaleString()} 
                            {exp.currency === 'USD' && ` (PKR ${(exp.amount * exchangeRate).toLocaleString()})`}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-mono font-bold text-slate-300">
                            PKR {exp.currency === 'PKR' ? exp.amount.toLocaleString() : (exp.amount * exchangeRate).toLocaleString()}
                          </span>
                          <button 
                            onClick={() => removeExpense(exp.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="Remove cost item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add cost form element */}
                  <form onSubmit={addExpense} className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                    
                    <div className="sm:col-span-5">
                      <label className="text-4xs font-mono text-slate-400 uppercase tracking-widest block mb-1">Expense Label</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Hetzner Cloud Volume"
                        value={newExpenseName}
                        onChange={(e) => setNewExpenseName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-4xs font-mono text-slate-400 uppercase tracking-widest block mb-1">Cost Volume</label>
                      <input 
                        type="number" 
                        placeholder="0"
                        value={newExpenseAmount}
                        onChange={(e) => setNewExpenseAmount(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-4xs font-mono text-slate-400 uppercase tracking-widest block mb-1">Currency</label>
                      <select 
                        value={newExpenseCurrency}
                        onChange={(e) => setNewExpenseCurrency(e.target.value)}
                        className="w-full bg-slate-955 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="PKR">PKR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <button 
                        type="submit"
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-slate-950 font-bold py-2 rounded-lg text-xs transition-colors duration-200 flex justify-center items-center gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        Add Cost
                      </button>
                    </div>

                  </form>

                </div>

              </div>

              {/* Right Column: Gateway Settings (1/3 width) */}
              <div className="space-y-6">
                
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
                  
                  <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider mb-4">Variable Checkout Fees</h3>

                  <div className="space-y-6 font-mono text-xs">
                    
                    {/* International settings card */}
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 shadow-md">
                      <p className="font-bold text-slate-200 mb-3">Lemon Squeezy Metrics</p>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-4xs text-slate-400 block mb-1">Base Rate (%)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={prices.starter.feePct}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setPrices(prev => ({
                                ...prev,
                                starter: { ...prev.starter, feePct: v },
                                growth: { ...prev.growth, feePct: v },
                                business: { ...prev.business, feePct: v }
                              }));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-4xs text-slate-400 block mb-1">Fixed Cost (USD)</label>
                          <input 
                            type="number" 
                            step="0.01"
                            value={prices.starter.fixedFee}
                            onChange={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              setPrices(prev => ({
                                ...prev,
                                starter: { ...prev.starter, fixedFee: v },
                                growth: { ...prev.growth, fixedFee: v },
                                business: { ...prev.business, fixedFee: v }
                              }));
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-4xs text-slate-500 leading-normal">
                        Lemon Squeezy defaults are set to 6.5% + $0.50 per transaction capture. Customize this rate block to reflect custom arrangements.
                      </p>
                    </div>

                    {/* Local gateway settings card */}
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 shadow-md">
                      <p className="font-bold text-slate-200 mb-3">PK Exclusive Gateway</p>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="text-4xs text-slate-400 block mb-1">Rate (%)</label>
                          <input 
                            type="number" 
                            step="0.1"
                            value={prices.pk_exclusive.feePct}
                            onChange={(e) => handlePriceChange('pk_exclusive', 'feePct', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-4xs text-slate-400 block mb-1">Fixed PKR fee</label>
                          <input 
                            type="number" 
                            value={prices.pk_exclusive.fixedFee}
                            onChange={(e) => handlePriceChange('pk_exclusive', 'fixedFee', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-center font-bold text-white focus:outline-none"
                          />
                        </div>
                      </div>
                      <p className="text-4xs text-slate-500 leading-normal">
                        Local payment networks typically deduct between 2.0% and 3.0% flat with a fixed SMS gateway cost (default PKR 15).
                      </p>
                    </div>

                    {/* Overall Overhead safety block */}
                    <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-850 shadow-md">
                      <p className="font-bold text-slate-200 mb-2">Unforeseen Overheads</p>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number" 
                          value={variableExpenseRate}
                          onChange={(e) => setVariableExpenseRate(parseFloat(e.target.value) || 0)}
                          className="w-20 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-center font-bold text-indigo-400 focus:outline-none"
                        />
                        <span className="text-2xs text-slate-400">Percent buffer of remaining margin (default 5%)</span>
                      </div>
                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* Tab content 4: Laravel Integration Code Generator */}
        {activeTab === 'code' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-md">
              
              <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                <Code className="h-5 w-5 text-indigo-400" />
                Dynamic Integration Code Generator
              </h3>
              <p className="text-sm text-slate-400 mb-6 font-mono leading-relaxed">
                Avoid pricing discrepancies and manually calculated undercounts by copying your simulated configuration options directly into your production application files:
              </p>

              <div className="space-y-6 font-mono text-xs">
                
                {/* Controller Code Block */}
                <div>
                  <div className="flex justify-between items-center bg-slate-950/90 px-4 py-2.5 rounded-t-xl border-t border-x border-slate-800">
                    <span className="font-bold text-indigo-400">SuperAdminController.php</span>
                    <button 
                      onClick={() => copyToClipboard(`$planPrices = [\n    'pk_exclusive' => ${prices.pk_exclusive.priceUsd},\n    'starter'      => ${prices.starter.priceUsd},\n    'growth'       => ${prices.growth.priceUsd},\n    'business'     => ${prices.business.priceUsd},\n    'ltd'          => 0\n];`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-3xs font-bold transition flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Copy Array Snippet
                    </button>
                  </div>
                  <pre className="bg-slate-950/80 border-x border-b border-slate-800 p-4 rounded-b-xl overflow-x-auto text-3xs text-slate-300 leading-relaxed shadow-lg scrollbar-custom">
{`// Update the pricing configuration around lines 39-40 of SuperAdminController.php:

$planPrices = [
    'pk_exclusive' => ${prices.pk_exclusive.priceUsd}, // PKR ${prices.pk_exclusive.pricePkr} local tier converted to USD
    'starter'      => ${prices.starter.priceUsd}, // Starter base tier setting ($${prices.starter.priceUsd})
    'growth'       => ${prices.growth.priceUsd}, // Growth tier setting ($${prices.growth.priceUsd})
    'business'     => ${prices.business.priceUsd}, // Business tier setting ($${prices.business.priceUsd})
    'ltd'          => 0   // Lifetime Redemptions mapped to 0 MRR
];

// Re-calculate the MRR matching paying client metrics:
$mrr = $realTenants
    ->where('status', 'active')
    ->sum(fn($t) => $planPrices[$t->plan] ?? 0);`}
                  </pre>
                </div>

                {/* Dashboard JSX config block */}
                <div>
                  <div className="flex justify-between items-center bg-slate-950/90 px-4 py-2.5 rounded-t-xl border-t border-x border-slate-800">
                    <span className="font-bold text-indigo-400">Dashboard.jsx</span>
                    <button 
                      onClick={() => copyToClipboard(`const PLAN_CONFIG = {\n    pk_exclusive: { price: ${prices.pk_exclusive.priceUsd} },\n    starter:      { price: ${prices.starter.priceUsd} },\n    growth:       { price: ${prices.growth.priceUsd} },\n    business:     { price: ${prices.business.priceUsd} },\n    ltd:          { price: 0 }\n};`)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-3xs font-bold transition flex items-center gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Copy Config Snippet
                    </button>
                  </div>
                  <pre className="bg-slate-950/80 border-x border-b border-slate-800 p-4 rounded-b-xl overflow-x-auto text-3xs text-slate-300 leading-relaxed shadow-lg scrollbar-custom">
{`// Apply this matching configuration block to client calculations in Dashboard.jsx:

const PLAN_CONFIG = {
    pk_exclusive: { price: ${prices.pk_exclusive.priceUsd} }, // Local converted tier base value
    starter:      { price: ${prices.starter.priceUsd} }, // Starter Tier price base
    growth:       { price: ${prices.growth.priceUsd} }, // Growth Tier price base
    business:     { price: ${prices.business.priceUsd} }, // Business Tier price base
    ltd:          { price: 0 }  // Handled separately from recurring calculations
};`}
                  </pre>
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* Copy Alert Popup */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 bg-slate-900/90 border border-indigo-500 rounded-xl p-4 text-xs font-mono font-semibold shadow-2xl flex items-center gap-2 animate-bounce z-50 text-indigo-400">
          <CheckCircle className="h-4 w-4" />
          Config array copied to clipboard!
        </div>
      )}

      {/* Custom Command Center Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 text-center text-xs text-slate-500 font-mono">
        <p>VenQore Administrative Command Panel: Designed for Abdullah Hashmi.</p>
        <p className="mt-2 font-mono text-3xs text-slate-600">Calculated locally: No tracking cookies or external processing calls used.</p>
      </footer>

    </div>
  );
}