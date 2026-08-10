import React, { useState, useEffect, useMemo, useRef } from 'react';

if (typeof document !== 'undefined' && !document.getElementById('venqore-fonts')) {
  const fontLink = document.createElement('link');
  fontLink.id = 'venqore-fonts';
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Syne:wght@600;700;800&display=swap';
  document.head.appendChild(fontLink);
}

const Icons = {
  Grid: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>,
  RotateCcw: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  Search: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Grip: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" /></svg>,
  ShieldAlert: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Database: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
  TrendingUp: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  TrendingDown: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>,
  Users: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Box: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Layers: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Sparkles: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Settings: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  ArrowLeft: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  ArrowRight: () => <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  Info: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  CornerResize: () => <svg className="w-3.5 h-3.5 text-cyan-400 group-hover/handle:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 19L5 5M19 12L12 19M19 5v14H5" /></svg>
};

const SIZE_PRESETS = {
  small: { label: 'Small', code: 'S', w: 3, h: 2, desc: 'Compact 1/4 width' },
  medium: { label: 'Medium', code: 'M', w: 6, h: 2, desc: 'Half width' },
  large: { label: 'Large', code: 'L', w: 6, h: 4, desc: 'Tall half width' },
  wide: { label: 'Wide', code: 'Wide', w: 12, h: 2, desc: 'Full width banner' }
};

const WIDGET_REGISTRY = {
  pending_actions: {
    type: 'pending_actions',
    title: 'Pending Actions',
    category: 'Operations',
    dashboardKey: 'executive',
    minPlan: 'Starter',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Displays urgent operational & authorization items requiring attention.'
  },
  profit_margin: {
    type: 'profit_margin',
    title: 'Profit Margin',
    category: 'Finance',
    dashboardKey: 'executive',
    minPlan: 'Starter',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Current profit vs total revenue margin health status.'
  },
  overdue_payments: {
    type: 'overdue_payments',
    title: 'Overdue Payments',
    category: 'Finance',
    dashboardKey: 'executive',
    minPlan: 'Starter',
    requiredModule: 'accounts_payable',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Tracks unpaid invoices and payables past due dates.'
  },
  net_balance: {
    type: 'net_balance',
    title: 'Net Balance',
    category: 'Finance',
    dashboardKey: 'executive',
    minPlan: 'Starter',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Total liquid balance across connected primary business accounts.'
  },
  purchases_trend: {
    type: 'purchases_trend',
    title: 'Purchases Trend',
    category: 'Finance',
    dashboardKey: 'executive',
    minPlan: 'Growth',
    supportedPresets: ['medium', 'large', 'wide'],
    defaultPreset: 'medium',
    description: 'Six-month historical spending and vendor procurement trend line.'
  },
  inventory_status: {
    type: 'inventory_status',
    title: 'Inventory Status',
    category: 'Inventory',
    dashboardKey: 'executive',
    minPlan: 'Starter',
    requiredModule: 'inventory_tracking',
    supportedPresets: ['medium', 'large'],
    defaultPreset: 'medium',
    description: 'Healthy, low stock, and out-of-stock breakdown donut chart.'
  },
  payments_breakdown: {
    type: 'payments_breakdown',
    title: 'Payments Breakdown',
    category: 'Finance',
    dashboardKey: 'executive',
    minPlan: 'Growth',
    supportedPresets: ['medium', 'large'],
    defaultPreset: 'medium',
    description: 'Transaction channel distribution (Cash, Bank Transfer, POS).'
  },
  expenses_breakdown: {
    type: 'expenses_breakdown',
    title: 'Expenses Breakdown',
    category: 'Finance',
    dashboardKey: 'executive',
    minPlan: 'Growth',
    supportedPresets: ['medium', 'large'],
    defaultPreset: 'medium',
    description: 'Monthly categorised expense breakdown and recurring burn.'
  },
  active_staff: {
    type: 'active_staff',
    title: 'Active Staff',
    category: 'Team',
    dashboardKey: 'executive',
    minPlan: 'Starter',
    requiredModule: 'payroll_staff',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Live attendance and clocked-in active team members.'
  },
  system_status: {
    type: 'system_status',
    title: 'System Status',
    category: 'Operations',
    dashboardKey: 'executive',
    minPlan: 'Starter',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Real-time VenQore cloud node & sync operational status.'
  },
  last_backup: {
    type: 'last_backup',
    title: 'Last Backup',
    category: 'Operations',
    dashboardKey: 'executive',
    minPlan: 'Starter',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Database snapshot timestamp and cloud recovery health.'
  },
  alerts_feed: {
    type: 'alerts_feed',
    title: 'Alerts & System Logs',
    category: 'Operations',
    dashboardKey: 'executive',
    minPlan: 'Starter',
    supportedPresets: ['small', 'medium', 'large'],
    defaultPreset: 'small',
    description: 'System health notifications, profit pulses, and security logs.'
  },
  business_activity: {
    type: 'business_activity',
    title: 'Business Activity',
    category: 'Operations',
    dashboardKey: 'executive',
    minPlan: 'Starter',
    supportedPresets: ['medium', 'large'],
    defaultPreset: 'medium',
    description: 'Audit feed of latest administrative and staff operations.'
  },
  performance_summary: {
    type: 'performance_summary',
    title: 'Performance',
    category: 'Analytics',
    dashboardKey: 'overview',
    minPlan: 'Starter',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Total revenue and gross profit metrics for selected interval.'
  },
  outstanding_summary: {
    type: 'outstanding_summary',
    title: 'Outstanding Summary',
    category: 'Finance',
    dashboardKey: 'overview',
    minPlan: 'Growth',
    requiredModule: 'accounts_payable',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Summary of To Receive (Receivables) vs To Pay (Payables).'
  },
  net_profit_summary: {
    type: 'net_profit_summary',
    title: 'Net Profit Status',
    category: 'Finance',
    dashboardKey: 'overview',
    minPlan: 'Starter',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Current net profit health status and revenue vs expense gap.'
  },
  revenue_analytics: {
    type: 'revenue_analytics',
    title: 'Revenue Analytics',
    category: 'Analytics',
    dashboardKey: 'overview',
    minPlan: 'Growth',
    requiredModule: 'advanced_analytics',
    supportedPresets: ['medium', 'large', 'wide'],
    defaultPreset: 'wide',
    description: 'Interactive hourly/daily Sales vs Gross Profit chart.'
  },
  top_products: {
    type: 'top_products',
    title: 'Top Products',
    category: 'Inventory',
    dashboardKey: 'overview',
    minPlan: 'Starter',
    requiredModule: 'inventory_tracking',
    supportedPresets: ['medium', 'large'],
    defaultPreset: 'medium',
    description: 'Leaderboard of top selling inventory items by volume and revenue.'
  },
  low_stock_alerts: {
    type: 'low_stock_alerts',
    title: 'Low Stock Alerts',
    category: 'Inventory',
    dashboardKey: 'overview',
    minPlan: 'Starter',
    requiredModule: 'inventory_tracking',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'medium',
    description: 'Automatic reorder triggers for items falling below safety threshold.'
  },
  recent_purchases: {
    type: 'recent_purchases',
    title: 'Recent Purchases',
    category: 'Finance',
    dashboardKey: 'overview',
    minPlan: 'Starter',
    supportedPresets: ['medium', 'large'],
    defaultPreset: 'medium',
    description: 'Log of latest supplier orders and incoming invoices.'
  },
  quick_actions: {
    type: 'quick_actions',
    title: 'Quick Actions',
    category: 'Operations',
    dashboardKey: 'overview',
    minPlan: 'Starter',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'One-click triggers for Sale creation, Purchases, and Custom Actions.'
  },
  cash_in_hand: {
    type: 'cash_in_hand',
    title: 'Cash in Hand',
    category: 'Finance',
    dashboardKey: 'overview',
    minPlan: 'Starter',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Main register physical cash balance and live status.'
  },
  stock_value: {
    type: 'stock_value',
    title: 'Stock Value',
    category: 'Inventory',
    dashboardKey: 'overview',
    minPlan: 'Growth',
    requiredModule: 'inventory_tracking',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Total asset cost calculation for currently stored inventory.'
  },
  bank_accounts: {
    type: 'bank_accounts',
    title: 'Bank Accounts Overview',
    category: 'Finance',
    dashboardKey: 'overview',
    minPlan: 'Growth',
    supportedPresets: ['small', 'medium'],
    defaultPreset: 'small',
    description: 'Connected commercial bank accounts and balance updates.'
  }
};

const PLAN_HIERARCHY = { Starter: 1, Growth: 2, Enterprise: 3 };

const isWidgetAvailable = (widget, currentPlan, activeModules) => {
  if (!widget) return false;
  const userPlanRank = PLAN_HIERARCHY[currentPlan] || 1;
  const reqPlanRank = PLAN_HIERARCHY[widget.minPlan] || 1;
  if (userPlanRank < reqPlanRank) return false;

  if (widget.requiredModule && !activeModules[widget.requiredModule]) {
    return false;
  }
  return true;
};

const getDefaultLayout = (dashboardKey, currentPlan, activeModules) => {
  const allWidgets = Object.values(WIDGET_REGISTRY).filter(w => 
    (w.dashboardKey === dashboardKey || w.dashboardKey === 'both') &&
    isWidgetAvailable(w, currentPlan, activeModules)
  );

  let currentX = 0;
  let currentY = 0;
  const maxCols = 12;

  return allWidgets.map((w) => {
    const presetKey = w.defaultPreset || 'small';
    const preset = SIZE_PRESETS[presetKey];
    let width = preset.w;
    let height = preset.h;

    if (currentX + width > maxCols) {
      currentX = 0;
      currentY += 2;
    }

    const item = {
      widget_type: w.type,
      x: currentX,
      y: currentY,
      w: width,
      h: height,
      size_preset: presetKey
    };

    currentX += width;
    return item;
  });
};

const WidgetContent = ({ type }) => {
  switch (type) {
    case 'pending_actions':
      return (
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="text-3xl font-extrabold text-white tracking-tight font-syne">0 <span className="text-sm font-normal text-slate-400 font-sans">ITEMS</span></div>
            <p className="text-xs text-amber-400/90 mt-1 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block"></span> Requires your attention
            </p>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 flex justify-between">
            <span>Pending approvals</span>
            <span className="text-slate-300 font-mono">0</span>
          </div>
        </div>
      );

    case 'profit_margin':
      return (
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-extrabold text-emerald-400 font-syne">0%</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">Healthy</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Net profit / Total revenue</p>
          </div>
          <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full w-0 transition-all duration-500"></div>
          </div>
        </div>
      );

    case 'overdue_payments':
      return (
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="text-2xl font-extrabold text-white font-syne">Rs 0.00</div>
            <p className="text-xs text-emerald-400 mt-1 font-medium flex items-center gap-1">
              <Icons.Check /> On Track — No overdue invoices
            </p>
          </div>
          <div className="text-[11px] text-slate-500 border-t border-slate-800/80 pt-2 flex justify-between">
            <span>Critical suppliers</span>
            <span className="text-emerald-400 font-medium">0</span>
          </div>
        </div>
      );

    case 'net_balance':
      return (
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="text-2xl font-extrabold text-cyan-400 font-syne">Rs 0.00</div>
            <p className="text-xs text-slate-400 mt-1">Liquid operational capital</p>
          </div>
          <div className="flex gap-2 text-[11px]">
            <span className="text-slate-500">Inflow today: <strong className="text-slate-300">Rs 0</strong></span>
          </div>
        </div>
      );

    case 'purchases_trend':
      return (
        <div className="flex flex-col h-full justify-between">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Past 6 months spending</span>
            <span className="text-cyan-400 text-[11px] font-medium">Updated live</span>
          </div>
          <div className="h-28 w-full relative flex items-end pt-4 pb-1">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 300 80">
              <line x1="0" y1="20" x2="300" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="300" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
              <path d="M0 75 Q 60 72, 120 70 T 240 75 T 300 75" fill="none" stroke="#8b5cf6" strokeWidth="2.5" />
            </svg>
            <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span>
            </div>
          </div>
        </div>
      );

    case 'inventory_status':
      return (
        <div className="flex items-center justify-between h-full gap-4">
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path stroke="#1e293b" strokeWidth="3.8" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path stroke="#00C9A7" strokeDasharray="100, 100" strokeWidth="3.8" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            </svg>
            <div className="absolute text-center">
              <span className="text-sm font-bold text-emerald-400 font-syne">100%</span>
              <p className="text-[9px] text-slate-400">HEALTHY</p>
            </div>
          </div>
          <div className="flex-1 space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Healthy</span>
              <span className="font-mono text-emerald-400">100%</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Low Stock</span>
              <span className="font-mono">0%</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Out of Stock</span>
              <span className="font-mono">0%</span>
            </div>
          </div>
        </div>
      );

    case 'payments_breakdown':
    case 'expenses_breakdown':
      return (
        <div className="flex flex-col justify-between h-full">
          <div className="text-xs text-slate-400">Monthly categorization</div>
          <div className="flex items-center justify-center my-2">
            <div className="w-20 h-20 rounded-full border-4 border-slate-800 flex items-center justify-center text-slate-500 text-[10px]">
              NO DATA
            </div>
          </div>
          <div className="text-[11px] text-slate-500 text-center">0 sales or expenses recorded</div>
        </div>
      );

    case 'active_staff':
      return (
        <div className="flex flex-col justify-between h-full">
          <div className="text-3xl font-extrabold text-white font-syne">1 <span className="text-sm font-normal text-slate-500 font-sans">/ 1</span></div>
          <div className="text-xs text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Active Clocked In
          </div>
        </div>
      );

    case 'system_status':
      return (
        <div className="flex flex-col justify-between h-full">
          <div className="text-xl font-bold text-emerald-400 font-syne">Operational</div>
          <p className="text-xs text-slate-400">All local & cloud nodes online</p>
        </div>
      );

    case 'last_backup':
      return (
        <div className="flex flex-col justify-between h-full">
          <div className="text-lg font-bold text-slate-200 font-syne">3 weeks ago</div>
          <p className="text-xs text-cyan-400 hover:underline cursor-pointer">Trigger Manual Backup</p>
        </div>
      );

    case 'alerts_feed':
      return (
        <div className="space-y-2 h-full overflow-y-auto pr-1">
          <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
            <span>All systems running smoothly</span>
            <span className="text-[10px] text-emerald-500">Live</span>
          </div>
          <div className="p-2 rounded bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300 flex justify-between">
            <span>Profit summary ready</span>
            <span className="text-slate-400 font-mono">Rs 0.00</span>
          </div>
        </div>
      );

    case 'business_activity':
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs gap-2">
          <Icons.Grip />
          <p>No recent activity recorded today.</p>
        </div>
      );

    case 'performance_summary':
      return (
        <div className="grid grid-cols-2 gap-2 h-full items-center">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Total Revenue</div>
            <div className="text-xl font-bold text-white font-syne">Rs 0.00</div>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">Gross Profit</div>
            <div className="text-xl font-bold text-emerald-400 font-syne">Rs 0.00</div>
          </div>
        </div>
      );

    case 'outstanding_summary':
      return (
        <div className="grid grid-cols-2 gap-2 h-full items-center">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400">To Receive</div>
            <div className="text-lg font-bold text-cyan-400 font-syne">Rs 0.00</div>
          </div>
          <div className="border-l border-slate-800 pl-3">
            <div className="text-[10px] uppercase tracking-wider text-slate-400">To Pay</div>
            <div className="text-lg font-bold text-rose-400 font-syne">Rs 0.00</div>
          </div>
        </div>
      );

    case 'net_profit_summary':
      return (
        <div className="flex flex-col justify-between h-full">
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-slate-400">Current Status</span>
            <span className="text-xs font-bold text-emerald-400 font-syne">GOOD</span>
          </div>
          <div className="text-2xl font-extrabold text-white font-syne">Rs 0.00</div>
          <div className="text-[10px] text-slate-500">Revenue Rs 0.00 | Expenses Rs 0.00</div>
        </div>
      );

    case 'revenue_analytics':
      return (
        <div className="flex flex-col h-full justify-between">
          <div className="flex justify-between items-center text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-300"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Sales: Rs 0.00</span>
              <span className="flex items-center gap-1.5 text-slate-300"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Gross Profit: Rs 0.00</span>
            </div>
            <div className="flex gap-1 bg-slate-900/80 p-0.5 rounded border border-slate-800 text-[10px] text-slate-400">
              <button className="px-2 py-0.5 rounded bg-slate-800 text-white font-medium">Today</button>
              <button className="px-2 py-0.5 rounded hover:text-white">Month</button>
              <button className="px-2 py-0.5 rounded hover:text-white">Year</button>
            </div>
          </div>
          <div className="h-32 w-full relative flex items-end pt-4 pb-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 90">
              <line x1="0" y1="20" x2="500" y2="20" stroke="#1e293b" strokeDasharray="3 3" />
              <line x1="0" y1="50" x2="500" y2="50" stroke="#1e293b" strokeDasharray="3 3" />
              <path d="M0 80 L 100 80 L 200 80 L 350 78 L 500 80" fill="none" stroke="#3d9bff" strokeWidth="2.5" />
            </svg>
            <div className="absolute bottom-0 w-full flex justify-between text-[10px] text-slate-500 font-mono">
              <span>01:00</span><span>05:00</span><span>09:00</span><span>13:00</span><span>17:00</span><span>21:00</span>
            </div>
          </div>
        </div>
      );

    case 'top_products':
      return (
        <div className="flex flex-col justify-center items-center h-full text-slate-500 text-xs">
          <p>No sales data recorded yet.</p>
        </div>
      );

    case 'low_stock_alerts':
      return (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-2">
            <Icons.Check />
          </div>
          <div className="text-xs font-medium text-emerald-400">Stock levels are healthy</div>
        </div>
      );

    case 'recent_purchases':
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
          <p>No purchases recorded yet.</p>
        </div>
      );

    case 'quick_actions':
      return (
        <div className="grid grid-cols-3 gap-2 h-full items-center">
          <button className="flex flex-col items-center justify-center p-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-semibold transition">
            <Icons.Plus />
            <span className="mt-1">SALE</span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 rounded bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 text-xs font-semibold transition">
            <Icons.Plus />
            <span className="mt-1">PURCHASE</span>
          </button>
          <button className="flex flex-col items-center justify-center p-2 rounded bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 text-xs font-semibold transition">
            <Icons.Plus />
            <span className="mt-1">ACTIONS</span>
          </button>
        </div>
      );

    case 'cash_in_hand':
      return (
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-extrabold text-white font-syne">Rs 0.00</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-mono">MAIN</span>
            </div>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span> Active
            </p>
          </div>
        </div>
      );

    case 'stock_value':
      return (
        <div className="flex flex-col justify-between h-full">
          <div>
            <div className="text-2xl font-extrabold text-white font-syne">Rs 0.00</div>
            <p className="text-xs text-slate-400 mt-1">Total Asset Cost</p>
          </div>
        </div>
      );

    case 'bank_accounts':
      return (
        <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-800 rounded p-2 text-center hover:border-slate-700 transition cursor-pointer">
          <Icons.Plus />
          <span className="text-xs font-medium text-slate-300 mt-1">Add Bank Account</span>
          <span className="text-[10px] text-slate-500">Track business banking</span>
        </div>
      );

    default:
      return <div className="text-xs text-slate-500">Widget content preview</div>;
  }
};

export default function App() {
  const [activeDashboard, setActiveDashboard] = useState('executive');
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  
  const gridContainerRef = useRef(null);
  const [resizingWidgetType, setResizingWidgetType] = useState(null);

  const [currentPlan, setCurrentPlan] = useState('Growth');
  const [activeModules, setActiveModules] = useState({
    accounts_payable: true,
    inventory_tracking: true,
    advanced_analytics: true,
    payroll_staff: true
  });

  const [showHintBanner, setShowHintBanner] = useState(true);

  const [layouts, setLayouts] = useState(() => {
    return {
      executive: getDefaultLayout('executive', 'Growth', {
        accounts_payable: true,
        inventory_tracking: true,
        advanced_analytics: true,
        payroll_staff: true
      }),
      overview: getDefaultLayout('overview', 'Growth', {
        accounts_payable: true,
        inventory_tracking: true,
        advanced_analytics: true,
        payroll_staff: true
      })
    };
  });

  const [toasts, setToasts] = useState([]);
  const [removedWidgetBackup, setRemovedWidgetBackup] = useState(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showDbInspector, setShowDbInspector] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const addToast = (message, type = 'info', action = null) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  useEffect(() => {
    setLayouts(prevLayouts => {
      let droppedCount = 0;
      const updatedExecutive = prevLayouts.executive.filter(item => {
        const meta = WIDGET_REGISTRY[item.widget_type];
        const valid = isWidgetAvailable(meta, currentPlan, activeModules);
        if (!valid) droppedCount++;
        return valid;
      });

      const updatedOverview = prevLayouts.overview.filter(item => {
        const meta = WIDGET_REGISTRY[item.widget_type];
        const valid = isWidgetAvailable(meta, currentPlan, activeModules);
        if (!valid) droppedCount++;
        return valid;
      });

      if (droppedCount > 0) {
        addToast(`${droppedCount} widget(s) gracefully hidden due to plan/module restrictions`, 'warning');
      }

      return {
        executive: updatedExecutive,
        overview: updatedOverview
      };
    });
  }, [currentPlan, activeModules]);

  const currentLayout = layouts[activeDashboard] || [];

  const updateCurrentLayout = (newItems) => {
    setLayouts(prev => ({
      ...prev,
      [activeDashboard]: newItems
    }));
  };

  const handleCornerResizeStart = (e, widgetType, currentW, currentH, widgetMeta) => {
    e.preventDefault();
    e.stopPropagation();

    if (!gridContainerRef.current) return;

    const gridRect = gridContainerRef.current.getBoundingClientRect();
    const colWidth = (gridRect.width - (11 * 16)) / 12;
    const rowHeight = 116;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const startX = clientX;
    const startY = clientY;

    const minW = 3;
    const minH = 2;

    let lastW = currentW;
    let lastH = currentH;

    setResizingWidgetType(widgetType);

    const handlePointerMove = (moveEvent) => {
      const currentX = moveEvent.touches ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = moveEvent.touches ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      const colsChange = Math.round(deltaX / (colWidth + 16));
      const rowsChange = Math.round(deltaY / rowHeight);

      const newW = Math.max(minW, Math.min(12, currentW + colsChange));
      const newH = Math.max(minH, Math.min(6, currentH + rowsChange));

      if (newW !== lastW || newH !== lastH) {
        lastW = newW;
        lastH = newH;

        const matchedPresetKey = Object.keys(SIZE_PRESETS).find(
          k => SIZE_PRESETS[k].w === newW && SIZE_PRESETS[k].h === newH
        ) || (newW >= 12 ? 'wide' : newW >= 6 ? (newH >= 4 ? 'large' : 'medium') : 'small');

        setLayouts(prev => ({
          ...prev,
          [activeDashboard]: prev[activeDashboard].map(item => {
            if (item.widget_type === widgetType) {
              return { ...item, w: newW, h: newH, size_preset: matchedPresetKey };
            }
            return item;
          })
        }));
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      setResizingWidgetType(null);
      addToast(`Snapped ${WIDGET_REGISTRY[widgetType]?.title || widgetType} to ${lastW}×${lastH} grid units`, 'success');
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);
  };

  const handlePresetChange = (widgetType, newPresetKey) => {
    const preset = SIZE_PRESETS[newPresetKey];
    if (!preset) return;

    updateCurrentLayout(
      currentLayout.map(item => {
        if (item.widget_type === widgetType) {
          return {
            ...item,
            size_preset: newPresetKey,
            w: preset.w,
            h: preset.h
          };
        }
        return item;
      })
    );
    addToast(`Resized ${WIDGET_REGISTRY[widgetType]?.title || widgetType} to ${preset.label}`, 'success');
  };

  const handleRemoveWidget = (widgetType) => {
    const targetItem = currentLayout.find(i => i.widget_type === widgetType);
    if (!targetItem) return;

    setRemovedWidgetBackup({ item: targetItem, dashboard: activeDashboard });
    updateCurrentLayout(currentLayout.filter(i => i.widget_type !== widgetType));

    addToast(
      `Removed "${WIDGET_REGISTRY[widgetType]?.title}" from dashboard`,
      'info',
      {
        label: 'Undo',
        onClick: () => {
          if (targetItem) {
            updateCurrentLayout([...currentLayout, targetItem]);
            setRemovedWidgetBackup(null);
            addToast('Restored widget to grid', 'success');
          }
        }
      }
    );
  };

  const handleAddWidget = (widgetType) => {
    const meta = WIDGET_REGISTRY[widgetType];
    if (!meta) return;

    const presetKey = meta.defaultPreset || 'small';
    const preset = SIZE_PRESETS[presetKey];

    const maxY = currentLayout.reduce((max, item) => Math.max(max, item.y + item.h), 0);

    const newItem = {
      widget_type: widgetType,
      x: 0,
      y: maxY,
      w: preset.w,
      h: preset.h,
      size_preset: presetKey
    };

    updateCurrentLayout([...currentLayout, newItem]);
    addToast(`Added "${meta.title}" to grid`, 'success');
  };

  const handleResetToDefault = () => {
    const freshLayout = getDefaultLayout(activeDashboard, currentPlan, activeModules);
    updateCurrentLayout(freshLayout);
    setShowResetModal(false);
    addToast(`Reset ${activeDashboard} dashboard layout to defaults`, 'info');
  };

  const handleSaveAndDone = () => {
    setIsEditMode(false);
    setShowAddDrawer(false);
    addToast(`Saved layout to DB [dashboard_layouts: user_101 / tenant_99]`, 'success');
  };

  const [draggedWidgetType, setDraggedWidgetType] = useState(null);
  const [dropTargetWidgetType, setDropTargetWidgetType] = useState(null);

  const handleDragStart = (e, widgetType) => {
    setDraggedWidgetType(widgetType);
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', widgetType);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e, widgetType) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    if (dropTargetWidgetType !== widgetType && draggedWidgetType !== widgetType) {
      setDropTargetWidgetType(widgetType);
    }
  };

  const handleDragLeave = (e, widgetType) => {
    e.preventDefault();
    if (dropTargetWidgetType === widgetType) {
      setDropTargetWidgetType(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedWidgetType(null);
    setDropTargetWidgetType(null);
  };

  const handleDrop = (e, targetWidgetType) => {
    e.preventDefault();
    setDropTargetWidgetType(null);
    if (!draggedWidgetType || draggedWidgetType === targetWidgetType) return;

    const draggedIdx = currentLayout.findIndex(i => i.widget_type === draggedWidgetType);
    const targetIdx = currentLayout.findIndex(i => i.widget_type === targetWidgetType);

    if (draggedIdx === -1 || targetIdx === -1) return;

    const newLayout = [...currentLayout];
    const temp = newLayout[draggedIdx];
    newLayout[draggedIdx] = newLayout[targetIdx];
    newLayout[targetIdx] = temp;

    updateCurrentLayout(newLayout);
    addToast(
      `Swapped positions: ${WIDGET_REGISTRY[draggedWidgetType]?.title || draggedWidgetType} ⇄ ${WIDGET_REGISTRY[targetWidgetType]?.title || targetWidgetType}`,
      'success'
    );
    setDraggedWidgetType(null);
  };

  const handleMoveWidget = (widgetType, direction) => {
    const index = currentLayout.findIndex(i => i.widget_type === widgetType);
    if (index === -1) return;

    let targetIndex = index;
    if (direction === 'left' || direction === 'up') {
      targetIndex = Math.max(0, index - 1);
    } else if (direction === 'right' || direction === 'down') {
      targetIndex = Math.min(currentLayout.length - 1, index + 1);
    }

    if (targetIndex === index) return;

    const newLayout = [...currentLayout];
    const temp = newLayout[index];
    newLayout[index] = newLayout[targetIndex];
    newLayout[targetIndex] = temp;

    updateCurrentLayout(newLayout);
  };

  const availableWidgetsForDrawer = useMemo(() => {
    const currentTypes = new Set(currentLayout.map(i => i.widget_type));
    return Object.values(WIDGET_REGISTRY).filter(w => {
      const matchDashboard = w.dashboardKey === activeDashboard || w.dashboardKey === 'both';
      const notAdded = !currentTypes.has(w.type);
      const allowedByPlan = isWidgetAvailable(w, currentPlan, activeModules);
      const matchCategory = selectedCategory === 'All' || w.category === selectedCategory;
      const matchSearch = drawerSearch.trim() === '' || 
        w.title.toLowerCase().includes(drawerSearch.toLowerCase()) || 
        w.description.toLowerCase().includes(drawerSearch.toLowerCase());

      return matchDashboard && notAdded && allowedByPlan && matchCategory && matchSearch;
    });
  }, [currentLayout, activeDashboard, currentPlan, activeModules, drawerSearch, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#03070F] text-slate-100 font-sans flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Navigation Header */}
      <header className="border-b border-slate-800/80 bg-[#060C18] sticky top-0 z-40 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-syne font-extrabold text-slate-950 text-lg shadow-lg shadow-cyan-500/20">
                VQ
              </div>
              <span className="font-syne font-bold text-lg text-white tracking-tight">
                VenQore <span className="text-cyan-400 text-xs font-mono font-normal">WIDGET SYSTEM</span>
              </span>
            </div>

            {/* Dashboard Tabs */}
            <nav className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveDashboard('executive')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  activeDashboard === 'executive' 
                    ? 'bg-cyan-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Executive Dashboard
              </button>
              <button
                onClick={() => setActiveDashboard('overview')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  activeDashboard === 'overview' 
                    ? 'bg-cyan-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Overview
              </button>
            </nav>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3">
            
            {/* Plan Tier Simulator Switcher */}
            <div className="hidden md:flex items-center gap-2 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">Plan:</span>
              <select
                value={currentPlan}
                onChange={(e) => setCurrentPlan(e.target.value)}
                className="bg-transparent text-cyan-400 font-bold focus:outline-none cursor-pointer"
              >
                <option value="Starter" className="bg-slate-900 text-white">Starter Tier</option>
                <option value="Growth" className="bg-slate-900 text-white">Growth Tier</option>
                <option value="Enterprise" className="bg-slate-900 text-white">Enterprise Tier</option>
              </select>
            </div>

            {/* DB Inspector Toggle */}
            <button
              onClick={() => setShowDbInspector(true)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition"
              title="Inspect dashboard_layouts DB record"
            >
              <Icons.Database />
            </button>

            {/* Edit Mode & Customize Action */}
            {isEditMode ? (
              <div className="flex items-center gap-2 animate-in fade-in duration-200">
                <button
                  onClick={() => setShowAddDrawer(true)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Icons.Plus /> Add Widget
                </button>
                <button
                  onClick={() => setShowResetModal(true)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                  title="Reset layout to default"
                >
                  <Icons.RotateCcw />
                </button>
                <button
                  onClick={handleSaveAndDone}
                  className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
                >
                  <Icons.Check /> Save & Done
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditMode(true)}
                className="px-3.5 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
              >
                <Icons.Edit /> Customize Layout
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        
        {/* Onboarding Hint Banner */}
        {showHintBanner && (
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-3.5 flex items-center justify-between gap-4 text-xs text-cyan-200 animate-in fade-in duration-300">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400"><Icons.Sparkles /></span>
              <p>
                <strong>This dashboard is yours to customize.</strong> Click <strong>"Customize Layout"</strong> to add, remove, resize using presets or corner dragging, and swap widget positions. Layouts automatically persist.
              </p>
            </div>
            <button
              onClick={() => setShowHintBanner(false)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <Icons.X />
            </button>
          </div>
        )}

        {/* Dynamic Responsive 12-Column Grid Container */}
        <div 
          ref={gridContainerRef}
          className="grid grid-cols-12 gap-4 auto-rows-[100px] transition-all duration-300 relative select-none"
        >
          {currentLayout.map((item) => {
            const widgetMeta = WIDGET_REGISTRY[item.widget_type];
            if (!widgetMeta) return null;

            const colSpanClass = {
              1: 'col-span-12 sm:col-span-6 md:col-span-3 lg:col-span-1',
              2: 'col-span-12 sm:col-span-6 md:col-span-3 lg:col-span-2',
              3: 'col-span-12 md:col-span-6 lg:col-span-3',
              4: 'col-span-12 sm:col-span-6 lg:col-span-4',
              5: 'col-span-12 sm:col-span-6 lg:col-span-5',
              6: 'col-span-12 lg:col-span-6',
              7: 'col-span-12 lg:col-span-7',
              8: 'col-span-12 lg:col-span-8',
              9: 'col-span-12 lg:col-span-9',
              10: 'col-span-12 lg:col-span-10',
              11: 'col-span-12 lg:col-span-11',
              12: 'col-span-12'
            }[item.w] || 'col-span-12 lg:col-span-6';

            const rowSpanStyle = {
              gridRowEnd: `span ${item.h}`,
              height: `${(item.h * 100) + ((item.h - 1) * 16)}px`
            };

            const isBeingResized = resizingWidgetType === item.widget_type;
            const isBeingDragged = draggedWidgetType === item.widget_type;
            const isDropTarget = dropTargetWidgetType === item.widget_type;

            return (
              <div
                key={item.widget_type}
                draggable={isEditMode && !resizingWidgetType}
                onDragStart={(e) => handleDragStart(e, item.widget_type)}
                onDragOver={(e) => handleDragOver(e, item.widget_type)}
                onDragLeave={(e) => handleDragLeave(e, item.widget_type)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => handleDrop(e, item.widget_type)}
                style={rowSpanStyle}
                className={`${colSpanClass} bg-[#0B1422] border ${
                  isBeingResized
                    ? 'border-cyan-400 ring-2 ring-cyan-500/50 shadow-2xl shadow-cyan-500/20 z-30 scale-[1.01]'
                    : isDropTarget
                    ? 'border-cyan-400 ring-4 ring-cyan-500/40 shadow-2xl shadow-cyan-500/30 z-30 scale-[1.02]'
                    : isBeingDragged
                    ? 'border-slate-700 opacity-40 scale-95 border-dashed'
                    : isEditMode 
                    ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10 cursor-grab active:cursor-grabbing' 
                    : 'border-slate-800/80 hover:border-slate-700/80'
                } rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 relative group`}
              >
                {/* Drag Target Swap Overlay */}
                {isDropTarget && (
                  <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px] rounded-xl border-2 border-dashed border-cyan-400 flex items-center justify-center z-40 pointer-events-none">
                    <span className="bg-cyan-400 text-slate-950 font-extrabold px-3 py-1 rounded-full text-xs shadow-lg animate-bounce">
                      ⇄ Swap Position Here
                    </span>
                  </div>
                )}

                {/* Corner Resize Snapping Overlay Badge */}
                {isBeingResized && (
                  <div className="absolute top-2 right-2 bg-cyan-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[10px] shadow-lg z-40 font-mono animate-pulse">
                    GRID SNAP: {item.w} × {item.h}
                  </div>
                )}

                {/* Widget Card Header */}
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    {isEditMode && (
                      <span className="text-slate-500 hover:text-cyan-400 cursor-grab">
                        <Icons.Grip />
                      </span>
                    )}
                    <h3 className="font-syne font-bold text-xs text-slate-200 tracking-wide">
                      {widgetMeta.title}
                    </h3>
                  </div>

                  {/* Header Edit Controls */}
                  {isEditMode ? (
                    <div className="flex items-center gap-1.5">
                      {/* Move Order Controls */}
                      <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-slate-800">
                        <button
                          onClick={() => handleMoveWidget(item.widget_type, 'left')}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                          title="Move earlier"
                        >
                          <Icons.ArrowLeft />
                        </button>
                        <button
                          onClick={() => handleMoveWidget(item.widget_type, 'right')}
                          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                          title="Move later"
                        >
                          <Icons.ArrowRight />
                        </button>
                      </div>

                      {/* Size Preset Selector */}
                      <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-slate-800">
                        {widgetMeta.supportedPresets.map(presetKey => {
                          const p = SIZE_PRESETS[presetKey];
                          const isActive = item.size_preset === presetKey;
                          return (
                            <button
                              key={presetKey}
                              onClick={() => handlePresetChange(item.widget_type, presetKey)}
                              className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded transition ${
                                isActive 
                                  ? 'bg-cyan-500 text-slate-950' 
                                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                              }`}
                              title={`${p.label} (${p.w}x${p.h} grid)`}
                            >
                              {p.code}
                            </button>
                          );
                        })}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveWidget(item.widget_type)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition"
                        title="Remove widget"
                      >
                        <Icons.X />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono uppercase">
                      {item.w}×{item.h}
                    </span>
                  )}
                </div>

                {/* Widget Body Content */}
                <div className="flex-1 overflow-hidden pt-1">
                  <WidgetContent type={item.widget_type} />
                </div>

                {/* Corner Drag Resize Handle */}
                {isEditMode && (
                  <div
                    onMouseDown={(e) => handleCornerResizeStart(e, item.widget_type, item.w, item.h, widgetMeta)}
                    onTouchStart={(e) => handleCornerResizeStart(e, item.widget_type, item.w, item.h, widgetMeta)}
                    className="absolute bottom-1 right-1 w-6 h-6 rounded-tl-lg bg-slate-900/80 hover:bg-cyan-500/20 border-t border-l border-slate-700/80 hover:border-cyan-500/80 cursor-se-resize flex items-center justify-center transition-all z-20 group/handle"
                    title="Drag corner to resize & snap to grid"
                  >
                    <Icons.CornerResize />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty Canvas Notice */}
        {currentLayout.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <div className="w-12 h-12 rounded-full bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto mb-3">
              <Icons.Box />
            </div>
            <h3 className="text-base font-bold text-slate-300 font-syne">Your dashboard is empty</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click below to select widgets from your plan's library and build your customized workspace.
            </p>
            <button
              onClick={() => { setIsEditMode(true); setShowAddDrawer(true); }}
              className="mt-4 px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-cyan-400 transition"
            >
              + Add First Widget
            </button>
          </div>
        )}
      </main>

      {/* Add Widget Drawer Slide-over */}
      {showAddDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-[#060C18] border-l border-slate-800 h-full flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <h2 className="font-syne font-bold text-base text-white">Add Widgets</h2>
                <p className="text-xs text-slate-400">Available for {currentPlan} Plan</p>
              </div>
              <button 
                onClick={() => setShowAddDrawer(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <Icons.X />
              </button>
            </div>

            <div className="p-4 border-b border-slate-800/80 space-y-3">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500"><Icons.Search /></span>
                <input
                  type="text"
                  placeholder="Search available widgets..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full bg-[#0B1422] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
                {['All', 'Finance', 'Inventory', 'Operations', 'Analytics', 'Team'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-full whitespace-nowrap transition ${
                      selectedCategory === cat 
                        ? 'bg-cyan-500 text-slate-950 font-bold' 
                        : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {availableWidgetsForDrawer.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No additional widgets match your search or current plan tier.
                </div>
              ) : (
                availableWidgetsForDrawer.map(widget => (
                  <div
                    key={widget.type}
                    className="p-3 bg-[#0B1422] border border-slate-800 hover:border-cyan-500/50 rounded-xl transition flex flex-col justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-syne font-bold text-xs text-white">{widget.title}</span>
                        <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                          {widget.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{widget.description}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-800/60 pt-2 text-[10px] text-slate-500">
                      <span>Supported: {widget.supportedPresets.map(p => p.toUpperCase()).join(', ')}</span>
                      <button
                        onClick={() => handleAddWidget(widget.type)}
                        className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded font-semibold transition flex items-center gap-1"
                      >
                        <Icons.Plus /> Add
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Database Inspector Modal */}
      {showDbInspector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#060C18] border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-400 font-syne font-bold">
                <Icons.Database /> DB Table Inspector: <span className="text-white">dashboard_layouts</span>
              </div>
              <button onClick={() => setShowDbInspector(false)} className="text-slate-400 hover:text-white">
                <Icons.X />
              </button>
            </div>
            <div className="p-4 text-xs font-mono bg-[#03070F] text-emerald-400 overflow-x-auto max-h-96">
              <div className="text-slate-500 mb-2">// Query: SELECT * FROM dashboard_layouts WHERE user_id = 'user_101' AND tenant_id = 'tenant_99'</div>
              <pre>{JSON.stringify({
                id: 'layout_uuid_9921',
                tenant_id: 'tenant_99',
                user_id: 'user_101',
                dashboard_key: activeDashboard,
                current_plan: currentPlan,
                layout_json: currentLayout,
                updated_at: new Date().toISOString()
              }, null, 2)}</pre>
            </div>
            <div className="p-3 bg-[#060C18] border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Layout persists across logins and devices</span>
              <button
                onClick={() => setShowDbInspector(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Layout Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#060C18] border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-3">
              <Icons.ShieldAlert />
              <h3 className="font-syne font-bold text-base text-white">Reset Layout to Default?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will overwrite your customized grid positions and sizes for the <strong>{activeDashboard}</strong> dashboard with the curated plan defaults.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-lg text-xs shadow-lg shadow-rose-500/20"
              >
                Reset to Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-xl border shadow-xl text-xs flex items-center justify-between gap-2 ${
              toast.type === 'warning' 
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-200' 
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900/90 border-cyan-500/50 text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icons.Info />
              <span>{toast.message}</span>
            </div>
            {toast.action && (
              <button
                onClick={toast.action.onClick}
                className="px-2 py-1 bg-cyan-500 text-slate-950 font-bold rounded text-[10px] hover:bg-cyan-400 transition"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}