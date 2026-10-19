import React, { useState } from 'react';
import {
  ShoppingBag,
  Store,
  MapPin,
  Navigation,
  Plus,
  Minus,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  User,
  Lock,
  Mail,
  Phone,
  Truck,
  Package,
  Settings,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CreditCard,
  LogOut,
  ClipboardList,
  Check,
  Sun,
  Moon,
  Zap,
  Receipt,
  SlidersHorizontal,
  Building2,
  ExternalLink
} from 'lucide-react';

const VQ_LOGO =
  'data:image/png;base64,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';

const VQ_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap');

:root, .vq-theme-light {
  --vq-teal-50: #E6FBF5;
  --vq-teal-100: #C6F5E9;
  --vq-teal-200: #93EBD6;
  --vq-teal-300: #59DBC0;
  --vq-teal-400: #23C4A6;
  --vq-teal-500: #0BAA8F;
  --vq-teal-600: #088975;
  --vq-teal-700: #076B5E;
  --vq-teal-800: #0A5049;
  --vq-teal-900: #0B3A35;
  --vq-teal-950: #062421;

  --vq-ink-0: #FFFFFF;
  --vq-ink-25: #F8FAF8;
  --vq-ink-50: #F1F5F2;
  --vq-ink-100: #E6ECE8;
  --vq-ink-200: #D3DCD7;
  --vq-ink-300: #B4C0BA;
  --vq-ink-400: #8B9A93;
  --vq-ink-500: #6B7A73;
  --vq-ink-600: #536159;
  --vq-ink-700: #3C4841;
  --vq-ink-800: #29332D;
  --vq-ink-900: #17201B;
  --vq-ink-950: #0D1412;
  --vq-ink-1000: #060A09;

  --vq-lime-100: #EEF9D7;
  --vq-lime-400: #A9E34B;
  --vq-lime-500: #8CCB2E;
  --vq-coral-100: #FFE8E1;
  --vq-coral-400: #FF8A6B;
  --vq-coral-500: #F26A47;
  --vq-butter-100: #FFF3D6;
  --vq-butter-400: #FFCD5B;
  --vq-butter-500: #F5B32E;
  --vq-sky-100: #DDF2FB;
  --vq-sky-400: #55C4EC;
  --vq-sky-500: #2BA5D1;
  --vq-plum-400: #C98BC9;
  --vq-plum-500: #B266A8;

  --vq-font-display: "Bricolage Grotesque", "Plus Jakarta Sans", system-ui, sans-serif;
  --vq-font-sans: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
  --vq-font-numeric: "Space Grotesk", ui-monospace, monospace;

  --vq-r-xs: 8px;
  --vq-r-sm: 12px;
  --vq-r-md: 14px;
  --vq-r-lg: 20px;
  --vq-r-xl: 28px;
  --vq-r-2xl: 36px;
  --vq-r-full: 999px;

  --vq-dur-1: 120ms;
  --vq-dur-2: 200ms;
  --vq-dur-3: 320ms;
  --vq-dur-4: 520ms;
  --vq-ease-out: cubic-bezier(.22, 1, .36, 1);
  --vq-ease-spring: cubic-bezier(.34, 1.56, .64, 1);
  --vq-ease-spring-soft: cubic-bezier(.32, 1.28, .5, 1);

  --vq-bg: #F1F5F2;
  --vq-bg-alt: #E9EFEB;
  --vq-surface: #FFFFFF;
  --vq-surface-2: #F8FAF8;
  --vq-sunken: #E6ECE8;
  --vq-raised: #FFFFFF;
  --vq-glass: rgb(255 255 255 / .78);

  --vq-text: #17201B;
  --vq-text-2: #536159;
  --vq-text-3: #6B7A73;

  --vq-accent: #0BAA8F;
  --vq-accent-fill: #088975;
  --vq-accent-fill-hover: #076B5E;
  --vq-accent-text: #076B5E;
  --vq-accent-quiet: #E6FBF5;
  --vq-accent-quiet-line: #93EBD6;
  --vq-on-accent: #FFFFFF;

  --vq-line: #D3DCD7;
  --vq-line-soft: #E6ECE8;
  --vq-line-strong: #B4C0BA;
  --vq-focus: #23C4A6;

  --vq-success: #12855C; --vq-success-bg: #E4F6EC; --vq-success-line: #A9E0C4;
  --vq-warning: #A6690A; --vq-warning-bg: #FFF3D6; --vq-warning-line: #F2D08A;
  --vq-danger:  #C4443A; --vq-danger-bg:  #FDEAE7; --vq-danger-line:  #F3B7AF;
  --vq-info:    #1B7096; --vq-info-bg:    #DDF2FB; --vq-info-line:    #A8DCF0;

  --vq-chart-track: #E6ECE8;
  --vq-chart-grid: #E6ECE8;

  --vq-elev-1: 0 1px 2px rgb(13 20 18 / .05), 0 2px 8px -4px rgb(13 20 18 / .06);
  --vq-elev-2: 0 1px 2px rgb(13 20 18 / .05), 0 10px 24px -10px rgb(13 20 18 / .12);
  --vq-elev-3: 0 2px 4px rgb(13 20 18 / .06), 0 24px 56px -16px rgb(13 20 18 / .22);
  --vq-glow-accent: 0 6px 20px -6px rgb(11 170 143 / .55);
  --vq-glow-accent-strong: 0 12px 34px -8px rgb(11 170 143 / .72);
  --vq-ring-focus: 0 0 0 4px rgb(35 196 166 / .28);

  --vq-grad-hero: linear-gradient(168deg, #062421 0%, #0A5049 38%, #0BAA8F 78%, #59DBC0 100%);
  --vq-grad-mint: linear-gradient(135deg, #23C4A6 0%, #0BAA8F 55%, #076B5E 100%);
  --vq-grad-mesh: radial-gradient(55% 65% at 18% 12%, rgba(35, 196, 166, 0.58), transparent 68%), radial-gradient(48% 55% at 84% 80%, rgba(7, 107, 94, 0.68), transparent 66%), radial-gradient(40% 42% at 62% 22%, rgba(85, 196, 236, 0.25), transparent 70%), #081210;
  --vq-grad-warm: linear-gradient(135deg, #F5B32E 0%, #F26A47 100%);
}

.vq-theme-dark {
  --vq-bg: #0C1211;
  --vq-bg-alt: #0A0F0E;
  --vq-surface: #141B19;
  --vq-surface-2: #1A2220;
  --vq-sunken: #080D0C;
  --vq-raised: #1D2624;
  --vq-glass: rgb(20 27 25 / .80);

  --vq-text: #EDF2EF;
  --vq-text-2: #A8B4AE;
  --vq-text-3: #8B9A93;

  --vq-accent: #23C4A6;
  --vq-accent-fill: #0BAA8F;
  --vq-accent-fill-hover: #23C4A6;
  --vq-accent-text: #59DBC0;
  --vq-accent-quiet: rgb(35 196 166 / .14);
  --vq-accent-quiet-line: rgb(35 196 166 / .28);
  --vq-on-accent: #062421;

  --vq-line: rgb(255 255 255 / .10);
  --vq-line-soft: rgb(255 255 255 / .06);
  --vq-line-strong: rgb(255 255 255 / .20);
  --vq-focus: #59DBC0;

  --vq-success: #4BD99B; --vq-success-bg: rgb(75 217 155 / .13); --vq-success-line: rgb(75 217 155 / .28);
  --vq-warning: #F7C05A; --vq-warning-bg: rgb(247 192 90 / .13); --vq-warning-line: rgb(247 192 90 / .28);
  --vq-danger:  #FF8A7E; --vq-danger-bg:  rgb(255 138 126 / .13); --vq-danger-line:  rgb(255 138 126 / .28);
  --vq-info:    #7BD4E6; --vq-info-bg:    rgb(123 212 230 / .12); --vq-info-line:    rgb(123 212 230 / .26);

  --vq-chart-track: rgb(255 255 255 / .09);
  --vq-chart-grid: rgb(255 255 255 / .07);

  --vq-elev-1: 0 1px 0 rgb(255 255 255 / .04);
  --vq-elev-2: 0 1px 0 rgb(255 255 255 / .05), 0 12px 28px -14px rgb(0 0 0 / .7);
  --vq-elev-3: 0 1px 0 rgb(255 255 255 / .07), 0 28px 64px -20px rgb(0 0 0 / .85);
  --vq-glow-accent: 0 8px 26px -8px rgb(35 196 166 / .45);
  --vq-glow-accent-strong: 0 12px 38px -10px rgb(35 196 166 / .62);
  --vq-ring-focus: 0 0 0 4px rgb(89 219 192 / .26);
}

@keyframes vqDrift {
  from { transform: translate3d(-3%, -2%, 0) scale(1.04); }
  to   { transform: translate3d(4%, 3%, 0) scale(1.12); }
}
@keyframes vqRise {
  from { opacity: 0; transform: translateY(10px) scale(0.985); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes vqPulseRing {
  0%   { transform: translate(-50%, -50%) scale(0.75); opacity: 0.75; }
  100% { transform: translate(-50%, -50%) scale(2.35); opacity: 0; }
}

.vq-screen-enter {
  animation: vqRise 280ms var(--vq-ease-out) both;
}

.vq-display {
  font-family: var(--vq-font-display);
  font-weight: 600;
  letter-spacing: -0.028em;
}
.vq-sans {
  font-family: var(--vq-font-sans);
}
.vq-num {
  font-family: var(--vq-font-numeric);
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
.vq-eyebrow {
  font-family: var(--vq-font-numeric);
  font-size: 10.5px;
  line-height: 1.2;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  color: var(--vq-text-3);
}
.vq-spring-btn {
  transition: transform var(--vq-dur-2) var(--vq-ease-spring),
              background-color var(--vq-dur-1) var(--vq-ease-out),
              box-shadow var(--vq-dur-2) var(--vq-ease-out),
              border-color var(--vq-dur-1) var(--vq-ease-out);
}
.vq-spring-btn:hover:not(:disabled) {
  transform: translateY(-1.5px);
}
.vq-spring-btn:active:not(:disabled) {
  transform: scale(0.965);
}
.vq-no-scrollbar::-webkit-scrollbar {
  display: none;
}
.vq-no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
`;

function VqBadge({ children, tone = 'neutral', dot = true, style }) {
  const tones = {
    neutral: ['var(--vq-sunken)', 'var(--vq-text-2)', 'var(--vq-line)'],
    accent: ['var(--vq-accent-quiet)', 'var(--vq-accent-text)', 'var(--vq-accent-quiet-line)'],
    success: ['var(--vq-success-bg)', 'var(--vq-success)', 'var(--vq-success-line)'],
    warning: ['var(--vq-warning-bg)', 'var(--vq-warning)', 'var(--vq-warning-line)'],
    danger: ['var(--vq-danger-bg)', 'var(--vq-danger)', 'var(--vq-danger-line)'],
    info: ['var(--vq-info-bg)', 'var(--vq-info)', 'var(--vq-info-line)']
  };
  const [bg, fg, bd] = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5.5,
        height: 23,
        padding: '0 9px',
        background: bg,
        color: fg,
        border: `1px solid ${bd}`,
        borderRadius: 'var(--vq-r-full)',
        font: '600 11px/1 var(--vq-font-sans)',
        letterSpacing: '-0.005em',
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {dot && (
        <span
          style={{
            width: 5.5,
            height: 5.5,
            borderRadius: 999,
            background: fg
          }}
        />
      )}
      {children}
    </span>
  );
}

function VqAvatar({ name = '', size = 28, bg }) {
  const hues = [
    'var(--vq-teal-400)',
    'var(--vq-coral-400)',
    'var(--vq-sky-400)',
    'var(--vq-butter-400)',
    'var(--vq-lime-400)'
  ];
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';
  const hue =
    bg || hues[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length];
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: hue,
        color: '#062421',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        font: `700 ${Math.round(size * 0.38)}px/1 var(--vq-font-sans)`,
        boxShadow: '0 0 0 2px var(--vq-surface)',
        flexShrink: 0
      }}
    >
      {initials}
    </span>
  );
}

function VqChip({ children, selected, onClick, count }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="vq-spring-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        height: 29,
        padding: '0 11px',
        background: selected ? 'var(--vq-accent-fill)' : 'var(--vq-surface)',
        color: selected ? 'var(--vq-on-accent)' : 'var(--vq-text-2)',
        border: `1px solid ${selected ? 'transparent' : 'var(--vq-line)'}`,
        borderRadius: 'var(--vq-r-full)',
        font: '600 11.5px/1 var(--vq-font-sans)',
        boxShadow: selected ? 'var(--vq-glow-accent)' : 'none',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
    >
      <span>{children}</span>
      {count != null && (
        <span
          className="vq-num"
          style={{
            fontSize: 10,
            padding: '2px 5px',
            borderRadius: 999,
            background: selected ? 'rgb(255 255 255 / .22)' : 'var(--vq-sunken)',
            color: selected ? 'var(--vq-on-accent)' : 'var(--vq-text-3)'
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function VqSwitch({ checked, onChange, locked = false }) {
  return (
    <button
      type="button"
      onClick={() => !locked && onChange && onChange(!checked)}
      style={{
        width: 42,
        height: 24,
        borderRadius: 999,
        padding: 3,
        background: checked ? 'var(--vq-accent-fill)' : 'var(--vq-line-strong)',
        boxShadow: checked ? 'var(--vq-glow-accent)' : 'none',
        border: 0,
        cursor: locked ? 'not-allowed' : 'pointer',
        opacity: locked ? 0.8 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        transition: 'background-color var(--vq-dur-2) var(--vq-ease-out)'
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: 999,
          background: '#FFFFFF',
          boxShadow: '0 1px 3px rgb(13 20 18 / .3)',
          transform: checked ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform var(--vq-dur-3) var(--vq-ease-spring)'
        }}
      />
    </button>
  );
}

function VqTabs({ tabs, value, onChange, darkSurface = false }) {
  const activeIdx = Math.max(
    0,
    tabs.findIndex((t) => t.value === value)
  );
  return (
    <div
      style={{
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: `repeat(${tabs.length}, 1fr)`,
        padding: 4,
        height: 40,
        background: darkSurface ? 'rgb(255 255 255 / .08)' : 'var(--vq-sunken)',
        borderRadius: 'var(--vq-r-full)',
        border: darkSurface
          ? '1px solid rgb(255 255 255 / .12)'
          : '1px solid var(--vq-line-soft)'
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 4,
          width: `calc((100% - 8px) / ${tabs.length})`,
          transform: `translateX(${activeIdx * 100}%)`,
          background: darkSurface ? '#23C4A6' : 'var(--vq-surface)',
          borderRadius: 'var(--vq-r-full)',
          boxShadow: darkSurface ? 'var(--vq-glow-accent)' : 'var(--vq-elev-1)',
          transition: 'transform var(--vq-dur-3) var(--vq-ease-spring)'
        }}
      />
      {tabs.map((t, i) => {
        const isActive = i === activeIdx;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            style={{
              position: 'relative',
              zIndex: 1,
              background: 'none',
              border: 0,
              cursor: 'pointer',
              font: `${isActive ? 700 : 500} 11.5px/1 var(--vq-font-sans)`,
              color: darkSurface
                ? isActive
                  ? '#062421'
                  : 'rgb(234 251 245 / .72)'
                : isActive
                ? 'var(--vq-text)'
                : 'var(--vq-text-3)',
              transition: 'color var(--vq-dur-2) var(--vq-ease-out)'
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function VqAreaChart({ data = [18, 32, 28, 49, 44, 72], labels = ['10a', '12p', '2p', '4p', '6p', 'Now'], height = 96 }) {
  const w = 320;
  const pad = { l: 6, r: 6, t: 10, b: 18 };
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const x = (i) => pad.l + (i * (w - pad.l - pad.r)) / Math.max(data.length - 1, 1);
  const y = (v) => pad.t + (1 - (v - min) / span) * (height - pad.t - pad.b);
  const line = data
    .map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join(' ');
  const area = `${line} L${x(data.length - 1).toFixed(1)},${height - pad.b} L${x(0)},${height - pad.b} Z`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${w} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className="block overflow-visible"
      >
        <defs>
          <linearGradient id="vqAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--vq-teal-400)" stopOpacity="0.38" />
            <stop offset="100%" stopColor="var(--vq-teal-400)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.2, 0.6, 1].map((t) => (
          <line
            key={t}
            x1={pad.l}
            x2={w - pad.r}
            y1={pad.t + t * (height - pad.t - pad.b)}
            y2={pad.t + t * (height - pad.t - pad.b)}
            stroke="var(--vq-chart-grid)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}
        <path d={area} fill="url(#vqAreaGrad)" />
        <path
          d={line}
          fill="none"
          stroke="var(--vq-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={x(data.length - 1)}
          cy={y(data[data.length - 1])}
          r="4"
          fill="var(--vq-surface)"
          stroke="var(--vq-accent)"
          strokeWidth="2.5"
        />
      </svg>
      <div className="flex justify-between mt-1 px-1">
        {labels.map((l) => (
          <span
            key={l}
            className="vq-num text-[10px]"
            style={{ color: 'var(--vq-text-3)' }}
          >
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}

function VqProgressRing({ value = 86, size = 76, thickness = 9, label = '86%' }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--vq-chart-track)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--vq-accent)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * value) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="vq-num text-sm font-bold" style={{ color: 'var(--vq-text)' }}>
          {label}
        </span>
      </div>
    </div>
  );
}

function VqBarMeter({ label, pct, color = 'var(--vq-accent)' }) {
  return (
    <div className="grid grid-cols-[64px_1fr_32px] items-center gap-2 text-xs">
      <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--vq-text-2)' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="truncate text-[11px]">{label}</span>
      </span>
      <span
        className="h-2 rounded-full overflow-hidden block"
        style={{ background: 'var(--vq-chart-track)' }}
      >
        <span
          className="h-full block rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </span>
      <span className="vq-num text-[11px] font-semibold text-right">{pct}%</span>
    </div>
  );
}

function VqActivityRow({ title, meta, amount, tone = 'in' }) {
  const isOut = tone === 'out';
  return (
    <div
      className="flex items-center gap-2.5 py-2 px-2.5 rounded-xl transition-colors"
      style={{ background: 'var(--vq-surface-2)', border: '1px solid var(--vq-line-soft)' }}
    >
      <span
        className="vq-num w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
        style={{
          background: isOut ? 'var(--vq-danger-bg)' : 'var(--vq-success-bg)',
          color: isOut ? 'var(--vq-danger)' : 'var(--vq-success)'
        }}
      >
        {isOut ? '−' : '+'}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold truncate" style={{ color: 'var(--vq-text)' }}>
          {title}
        </div>
        <div className="text-[10.5px]" style={{ color: 'var(--vq-text-3)' }}>
          {meta}
        </div>
      </div>
      <span
        className="vq-num text-xs font-bold"
        style={{ color: isOut ? 'var(--vq-danger)' : 'var(--vq-success)' }}
      >
        {amount}
      </span>
    </div>
  );
}

const INITIAL_STORES = [
  {
    id: 'store-1',
    name: 'GreenLeaf Organics & Grocers',
    category: 'Grocery & Fresh Produce',
    rating: 4.9,
    reviews: 142,
    baseEta: 18,
    distance: '0.6 km',
    deliveryTime: '18 min',
    bannerGradient: 'var(--vq-grad-mint)',
    badge: 'VenSynQ Live',
    pinCoords: { x: 30, y: 34 },
    products: [
      {
        id: 'p-101',
        name: 'Organic Hass Avocados (4 Pack)',
        price: 6.5,
        unit: '500g pack',
        stock: 24,
        desc: 'Hand-picked creamy organic avocados from local orchards.',
        tag: 'Bestseller',
        emoji: '🥑'
      },
      {
        id: 'p-102',
        name: 'Artisan Country Sourdough',
        price: 4.75,
        unit: 'Fresh loaf',
        stock: 9,
        desc: 'Slow-fermented 24hr crispy crust country sourdough.',
        tag: 'Fresh Baked',
        emoji: '🍞'
      },
      {
        id: 'p-103',
        name: 'Cold-Pressed Valencia Orange',
        price: 5.2,
        unit: '1L Glass Bottle',
        stock: 16,
        desc: '100% pure squeezed oranges with zero added sugar.',
        tag: 'Chilled',
        emoji: '🍊'
      }
    ]
  },
  {
    id: 'store-2',
    name: 'Urban Roast & Bakehouse',
    category: 'Specialty Coffee & Bakery',
    rating: 4.8,
    reviews: 98,
    baseEta: 14,
    distance: '0.8 km',
    deliveryTime: '14 min',
    bannerGradient: 'var(--vq-grad-warm)',
    badge: 'Top Rated',
    pinCoords: { x: 68, y: 58 },
    products: [
      {
        id: 'p-201',
        name: 'Iced Spanish Latte (Double Shot)',
        price: 4.5,
        unit: '16 oz cup',
        stock: 40,
        desc: 'Specialty Arabica espresso over textured condensed milk.',
        tag: 'Popular',
        emoji: '🧋'
      },
      {
        id: 'p-202',
        name: 'Belgian 70% Dark Croissant',
        price: 3.8,
        unit: 'Warm pastry',
        stock: 11,
        desc: 'Flaky French butter layers filled with dark chocolate.',
        tag: 'Warm',
        emoji: '🥐'
      },
      {
        id: 'p-203',
        name: 'House Reserve Espresso Beans',
        price: 14.0,
        unit: '250g whole bean',
        stock: 19,
        desc: 'Medium-dark roast with notes of caramel and hazelnut.',
        tag: 'Roastery',
        emoji: '☕'
      }
    ]
  }
];

const DEMO_BUSINESS_ACCOUNTS = {
  owner: {
    email: 'owner@greenleaf.com',
    role: 'STORE_OWNER',
    name: 'Tariq Mahmood',
    storeName: 'GreenLeaf Organics & Grocers',
    label: 'Store Owner',
    tone: 'accent',
    permissions: 'Full Qore ERP • Core Ledger • Storefront Admin'
  },
  employee: {
    email: 'staff@greenleaf.com',
    role: 'STORE_EMPLOYEE',
    name: 'Sara Ahmed',
    storeName: 'GreenLeaf Organics & Grocers',
    label: 'Store Employee',
    tone: 'success',
    permissions: 'POS Counter • Order Prep Queue • Stock Count'
  },
  rider: {
    email: 'rider@fleet.com',
    role: 'RIDER',
    name: 'Bilal Khan',
    storeName: 'Express Fleet Partner',
    label: 'Delivery Rider',
    tone: 'warning',
    permissions: 'Rider Sister App • Live Route & Proof of Delivery'
  }
};

export default function App() {
  const [vqTheme, setVqTheme] = useState('light');
  const [screen, setScreen] = useState('WELCOME');
  const [history, setHistory] = useState([]);
  const [registrationOrigin, setRegistrationOrigin] = useState('BUSINESS_ENTRY');

  // Business Auth state
  const [businessAuthMode, setBusinessAuthMode] = useState('SIGN_IN');
  const [loginEmail, setLoginEmail] = useState('owner@greenleaf.com');
  const [loginPassword, setLoginPassword] = useState('••••••••••••');
  const [activeBusinessUser, setActiveBusinessUser] = useState(
    DEMO_BUSINESS_ACCOUNTS.owner
  );

  // Dynamic stores list so a converted Customer's store appears live in the Marketplace
  const [stores, setStores] = useState(INITIAL_STORES);

  // New Store Owner Registration & VenQore AI Blueprint Builder state
  const [newOwnerForm, setNewOwnerForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: ''
  });
  const [builderStep, setBuilderStep] = useState(1);
  const [blueprintPrompt, setBlueprintPrompt] = useState(
    'Neighborhood organic grocery & cafe with walk-in POS, batch & expiry tracking, and local 25-minute rider delivery.'
  );
  const [storeBuilderData, setStoreBuilderData] = useState({
    storeName: 'Zainab Fresh Mart & Cafe',
    category: 'Grocery & Specialty',
    address: 'Main Boulevard, Block C Commercial',
    deliveryRadius: '5 km',
    plan: 'Business ($79/mo)',
    modules: {
      pos: true,
      batchExpiry: true,
      riderDispatch: true,
      coreLedger: true
    }
  });

  // Customer Location & Map state
  const [mapPin, setMapPin] = useState({ x: 52, y: 46 });
  const [selectedAreaName, setSelectedAreaName] = useState(
    'Block C, Commercial Area'
  );
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);

  // Customer Marketplace, Direct Auth, Profile Settings & Conversion state
  const [activeStore, setActiveStore] = useState(INITIAL_STORES[0]);
  const [selectedCategoryChip, setSelectedCategoryChip] = useState('All Items');
  const [cart, setCart] = useState({});
  const [customerSignedIn, setCustomerSignedIn] = useState(false);
  const [customerAuthTab, setCustomerAuthTab] = useState('SIGN_IN');
  const [customerConvertedStore, setCustomerConvertedStore] = useState(null);
  const [customerUser, setCustomerUser] = useState({
    name: 'Zainab Ali',
    email: 'zainab@customer.com',
    phone: '+92 300 5551234',
    address: 'House 42, Street 7, Block C'
  });
  const [ordersPlaced, setOrdersPlaced] = useState([
    {
      id: 'SAL-R1-8821',
      storeName: 'GreenLeaf Organics & Grocers',
      total: 16.45,
      status: 'Rider Dispatched',
      tone: 'success',
      date: 'Today, 2:15 PM',
      itemsCount: 3
    }
  ]);

  // Owner ERP sub-tab ('ERP' | 'STOREFRONT')
  const [ownerTab, setOwnerTab] = useState('ERP');
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    price: '5.50',
    unit: '1 Pack',
    emoji: '🥗'
  });

  // Interactive states for Employee & Rider dashboards
  const [employeeOrders, setEmployeeOrders] = useState([
    {
      id: '#4091',
      customer: 'Zainab A.',
      items: '3 items (Avocados, Sourdough)',
      status: 'Pending Prep',
      tone: 'warning',
      time: '2m ago'
    },
    {
      id: '#4089',
      customer: 'Hamza K.',
      items: '5 items (Cold-Pressed OJ +4)',
      status: 'Packing',
      tone: 'info',
      time: '8m ago'
    },
    {
      id: '#4084',
      customer: 'Usman R.',
      items: '2 items (Spanish Latte)',
      status: 'Ready for Rider',
      tone: 'success',
      time: '14m ago'
    }
  ]);
  const [riderDeliveryStep, setRiderDeliveryStep] = useState(1);

  const navigateTo = (nextScreen) => {
    setHistory((prev) => [...prev, screen]);
    setScreen(nextScreen);
  };

  const goBack = () => {
    if (history.length === 0) {
      setScreen('WELCOME');
      return;
    }
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setScreen(previous);
  };

  const resetToWelcome = () => {
    setHistory([]);
    setScreen('WELCOME');
  };

  const addToCart = (product, store) => {
    setCart((prev) => {
      const existingQty = prev[product.id]?.qty || 0;
      return {
        ...prev,
        [product.id]: {
          product,
          storeName: store.name,
          storeId: store.id,
          qty: existingQty + 1
        }
      };
    });
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      if (!prev[productId]) return prev;
      const nextQty = prev[productId].qty - 1;
      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          qty: nextQty
        }
      };
    });
  };

  const cartItemsList = Object.values(cart);
  const cartTotalCount = cartItemsList.reduce((acc, item) => acc + item.qty, 0);
  const cartSubtotal = cartItemsList.reduce(
    (acc, item) => acc + item.product.price * item.qty,
    0
  );

  // Unified Business Sign-In handler (No role question asked; role is resolved by system account!)
  const handleBusinessSignIn = (e) => {
    e.preventDefault();
    const emailLower = loginEmail.toLowerCase().trim();

    if (emailLower.includes('rider')) {
      setActiveBusinessUser(DEMO_BUSINESS_ACCOUNTS.rider);
      navigateTo('RIDER_DASHBOARD');
    } else if (emailLower.includes('staff') || emailLower.includes('employee')) {
      setActiveBusinessUser(DEMO_BUSINESS_ACCOUNTS.employee);
      navigateTo('EMPLOYEE_DASHBOARD');
    } else {
      setActiveBusinessUser(DEMO_BUSINESS_ACCOUNTS.owner);
      navigateTo('OWNER_DASHBOARD');
    }
  };

  const handleOwnerRegistrationSubmit = (e) => {
    e.preventDefault();
    setBuilderStep(1);
    navigateTo('STORE_BUILDER');
  };

  const handleCompleteStoreBuilder = () => {
    const isFromCustomerProfile =
      registrationOrigin === 'CUSTOMER_PROFILE_CONVERSION';

    const storeTitle =
      storeBuilderData.storeName ||
      (isFromCustomerProfile
        ? `${customerUser.name.split(' ')[0]}'s Market & Store`
        : 'Rana Traders & Organics');

    const createdStoreObj = {
      id: `store-custom-${Date.now()}`,
      name: storeTitle,
      category: storeBuilderData.category || 'Grocery & Essentials',
      rating: 5.0,
      reviews: 1,
      distance: '0.4 km',
      deliveryTime: '15 min',
      bannerGradient: 'var(--vq-grad-mint)',
      badge: 'Your Live Store',
      pinCoords: { x: 44, y: 42 },
      products: [
        {
          id: `p-custom-1`,
          name: 'Signature Farm Fresh Box',
          price: 8.5,
          unit: '1 Box',
          desc: 'Curated local essentials synced from your VenQore ERP.',
          tag: 'New Launch',
          emoji: '🧺'
        },
        {
          id: `p-custom-2`,
          name: 'Artisan Cold Brew & Honey Pack',
          price: 6.0,
          unit: 'Combo Pack',
          desc: 'Prepared fresh daily with live batch & inventory tracking.',
          tag: 'Storefront Special',
          emoji: '🍯'
        }
      ]
    };

    setStores((prev) => [
      createdStoreObj,
      ...prev.filter((s) => !s.id.startsWith('store-custom-'))
    ]);
    setActiveStore(createdStoreObj);

    const createdOwner = {
      email: isFromCustomerProfile
        ? customerUser.email
        : newOwnerForm.email || 'founder@newstore.com',
      role: 'STORE_OWNER',
      name: isFromCustomerProfile
        ? customerUser.name
        : newOwnerForm.fullName || 'Ahmad Raza',
      storeName: storeTitle,
      label: isFromCustomerProfile
        ? 'Converted Customer → Store Owner'
        : 'Store Owner (Blueprint Live)',
      tone: 'accent'
    };

    if (isFromCustomerProfile) {
      setCustomerConvertedStore(createdStoreObj);
    }

    setActiveBusinessUser(createdOwner);
    setOwnerTab('ERP');
    navigateTo('OWNER_DASHBOARD');
  };

  const handleAddProductToStorefront = (e) => {
    e.preventDefault();
    if (!newProductForm.name.trim()) return;
    const newProd = {
      id: `p-${Date.now()}`,
      name: newProductForm.name.trim(),
      price: parseFloat(newProductForm.price) || 5.0,
      unit: newProductForm.unit || '1 Unit',
      desc: 'Synced live from VenQore Owner ERP.',
      tag: 'ERP Synced',
      emoji: newProductForm.emoji || '📦'
    };

    setStores((prev) =>
      prev.map((st) =>
        st.name === activeBusinessUser.storeName || st.id === activeStore.id
          ? { ...st, products: [newProd, ...st.products] }
          : st
      )
    );
    setActiveStore((prev) => ({
      ...prev,
      products: [newProd, ...prev.products]
    }));
    setNewProductForm({ name: '', price: '5.50', unit: '1 Pack', emoji: '🥗' });
  };

  const handleUseCurrentLocation = () => {
    setIsLocatingGPS(true);
    setTimeout(() => {
      setMapPin({ x: 48, y: 50 });
      setSelectedAreaName('Live GPS • Gulberg III Boulevard');
      setIsLocatingGPS(false);
    }, 550);
  };

  const handleDirectCustomerAuth = (e) => {
    e.preventDefault();
    setCustomerSignedIn(true);
    navigateTo('CUSTOMER_DASHBOARD');
  };

  const handlePlaceOrderAndSignIn = (e) => {
    e.preventDefault();
    const newOrder = {
      id: `SAL-R1-${Math.floor(1000 + Math.random() * 9000)}`,
      storeName: cartItemsList[0]?.storeName || activeStore.name,
      total: +(cartSubtotal + 1.5).toFixed(2),
      status: 'Preparing at Store',
      tone: 'accent',
      date: 'Just now',
      itemsCount: cartTotalCount
    };
    setOrdersPlaced((prev) => [newOrder, ...prev]);
    setCustomerSignedIn(true);
    setCart({});
    navigateTo('CUSTOMER_DASHBOARD');
  };

  const renderWelcomeScreen = () => (
    <div
      className="vq-screen-enter flex flex-col h-full justify-between p-4 select-none relative overflow-hidden"
      style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)' }}
    >
      {/* Top VenQore Brand Header */}
      <div className="flex items-center justify-between z-10 pt-0.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center p-1"
            style={{
              background: 'var(--vq-surface)',
              border: '1px solid var(--vq-line)',
              boxShadow: 'var(--vq-elev-1)'
            }}
          >
            <img src={VQ_LOGO} alt="VenQore" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="vq-display text-[17px] leading-none"
                style={{ color: 'var(--vq-text)', letterSpacing: '-0.03em' }}
              >
                VenQore
              </span>
              <span
                className="vq-num text-[9.5px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  background: 'var(--vq-accent-quiet)',
                  color: 'var(--vq-accent-text)',
                  border: '1px solid var(--vq-accent-quiet-line)'
                }}
              >
                v6 QORE
              </span>
            </div>
            <span
              className="text-[11px] block mt-0.5 font-medium"
              style={{ color: 'var(--vq-text-3)' }}
            >
              Unified Marketplace &amp; Store OS
            </span>
          </div>
        </div>

        <VqBadge tone="success">Live Nearby</VqBadge>
      </div>

      {/* PRIMARY BIG CHUNK: Customer Marketplace Hero Card (VenQore v6 Mesh Hero) */}
      <div className="my-2.5 z-10 flex-1 flex flex-col">
        <div
          onClick={() => navigateTo('CUSTOMER_LOCATION')}
          role="button"
          tabIndex={0}
          className="vq-spring-btn w-full flex-1 p-5 text-left flex flex-col justify-between relative overflow-hidden group cursor-pointer"
          style={{
            borderRadius: 'var(--vq-r-2xl)',
            background: 'var(--vq-grad-mesh)',
            boxShadow: 'var(--vq-glow-accent-strong)',
            border: '1px solid rgb(89 219 192 / .28)'
          }}
        >
          {/* Animated Ambient Drift Glow from VenQore v6 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(55% 60% at 22% 18%, rgb(35 196 166 / .38), transparent 70%), radial-gradient(50% 50% at 85% 75%, rgb(245 179 46 / .18), transparent 70%)',
              animation: 'vqDrift 8s ease-in-out infinite alternate'
            }}
          />

          {/* Top Row: Eyebrow Pill + Direct Customer Sign-In Button */}
          <div className="flex items-center justify-between w-full relative z-10">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold"
              style={{
                background: 'rgb(255 255 255 / .12)',
                color: '#C6F5E9',
                border: '1px solid rgb(255 255 255 / .22)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <Sparkles className="w-3 h-3 text-[#FFCD5B]" />
              <span>Customer Marketplace</span>
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (customerSignedIn) {
                  navigateTo('CUSTOMER_DASHBOARD');
                } else {
                  setCustomerAuthTab('SIGN_IN');
                  navigateTo('CUSTOMER_AUTH');
                }
              }}
              className="vq-spring-btn text-[11px] font-semibold px-3 py-1 rounded-full flex items-center gap-1.5"
              style={{
                background: 'rgb(255 255 255 / .16)',
                color: '#F4FFFB',
                border: '1px solid rgb(255 255 255 / .28)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <User className="w-3 h-3 text-[#59DBC0]" />
              <span>{customerSignedIn ? 'My Dashboard' : 'Customer Sign In'}</span>
            </button>
          </div>

          {/* Center Visual: Floating Store Preview Chips + Display Headline */}
          <div className="my-auto py-2 relative z-10 space-y-3.5">
            {/* Floating Live Storefront Pills */}
            <div className="flex flex-wrap gap-1.5">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: 'rgb(255 255 255 / .11)',
                  color: '#F4FFFB',
                  border: '1px solid rgb(255 255 255 / .16)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <span>🥑 GreenLeaf Organics</span>
                <span className="vq-num text-[#93EBD6]">★ 4.9</span>
              </div>
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: 'rgb(255 255 255 / .11)',
                  color: '#F4FFFB',
                  border: '1px solid rgb(255 255 255 / .16)',
                  backdropFilter: 'blur(8px)'
                }}
              >
                <span>🥐 Urban Roast</span>
                <span className="vq-num text-[#FFCD5B]">0.8 km</span>
              </div>
            </div>

            <div>
              <h1
                className="vq-display text-[28px] leading-[1.03] text-[#F4FFFB]"
                style={{ letterSpacing: '-0.035em' }}
              >
                Shop local stores around your{' '}
                <span style={{ color: '#93EBD6' }}>pin</span>.
              </h1>
              <p
                className="text-[12.5px] leading-relaxed mt-2"
                style={{ color: 'rgb(234 251 245 / .80)' }}
              >
                Drop your pin on the map or sign in to your Customer Account to browse neighborhood storefronts.
              </p>
            </div>
          </div>

          {/* Bottom High-Contrast Mint Action Pill */}
          <div
            className="w-full p-2 pl-4 flex items-center justify-between relative z-10"
            style={{
              borderRadius: 'var(--vq-r-full)',
              background: 'rgb(255 255 255 / .13)',
              border: '1px solid rgb(255 255 255 / .24)',
              backdropFilter: 'blur(12px)'
            }}
          >
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#59DBC0]" />
              <span className="text-xs font-semibold text-[#F4FFFB]">
                Set Location &amp; Explore Stores
              </span>
            </div>
            <span
              className="px-3.5 py-2 rounded-full font-bold text-xs flex items-center gap-1 transition-transform group-hover:translate-x-0.5"
              style={{
                background: 'var(--vq-teal-400)',
                color: '#062421',
                boxShadow: 'var(--vq-glow-accent)'
              }}
            >
              <span>Explore</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </span>
          </div>
        </div>
      </div>

      {/* SECONDARY SMALLER CHUNK: Store Owners, Staff & Riders */}
      <div className="z-10">
        <div
          className="p-3.5"
          style={{
            background: 'var(--vq-surface)',
            border: '1px solid var(--vq-line)',
            borderRadius: 'var(--vq-r-xl)',
            boxShadow: 'var(--vq-elev-2)'
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 flex items-center justify-center shrink-0"
                style={{
                  borderRadius: 'var(--vq-r-md)',
                  background: 'var(--vq-accent-quiet)',
                  color: 'var(--vq-accent-text)',
                  border: '1px solid var(--vq-accent-quiet-line)'
                }}
              >
                <Store className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2
                  className="vq-display text-[13.5px] leading-tight truncate"
                  style={{ color: 'var(--vq-text)' }}
                >
                  Store Owner, Staff or Rider?
                </h2>
                <p
                  className="text-[11px] truncate mt-0.5"
                  style={{ color: 'var(--vq-text-3)' }}
                >
                  Auto-routed workspace login or build a store
                </p>
              </div>
            </div>

            {/* Overlapping Role Avatar Stack */}
            <div className="flex items-center shrink-0">
              <VqAvatar name="Owner" size={24} bg="var(--vq-teal-400)" />
              <span className="-ml-2">
                <VqAvatar name="Staff" size={24} bg="var(--vq-butter-400)" />
              </span>
              <span className="-ml-2">
                <VqAvatar name="Rider" size={24} bg="var(--vq-coral-400)" />
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setRegistrationOrigin('BUSINESS_ENTRY');
                setBusinessAuthMode('SIGN_IN');
                navigateTo('BUSINESS_AUTH');
              }}
              className="vq-spring-btn h-9 px-3 font-semibold text-xs flex items-center justify-center gap-1.5"
              style={{
                borderRadius: 'var(--vq-r-full)',
                background: 'var(--vq-sunken)',
                color: 'var(--vq-text)',
                border: '1px solid var(--vq-line)'
              }}
            >
              <Lock className="w-3.5 h-3.5" style={{ color: 'var(--vq-accent-text)' }} />
              <span>Sign In to Store</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRegistrationOrigin('BUSINESS_ENTRY');
                setBusinessAuthMode('REGISTER_OWNER');
                navigateTo('BUSINESS_AUTH');
              }}
              className="vq-spring-btn h-9 px-3 font-semibold text-xs flex items-center justify-center gap-1.5"
              style={{
                borderRadius: 'var(--vq-r-full)',
                background: 'var(--vq-accent-quiet)',
                color: 'var(--vq-accent-text)',
                border: '1px solid var(--vq-accent-quiet-line)'
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create a Store</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBusinessAuthScreen = () => {
    const emailLower = loginEmail.toLowerCase();
    const detectedAccount = emailLower.includes('rider')
      ? DEMO_BUSINESS_ACCOUNTS.rider
      : emailLower.includes('staff') || emailLower.includes('employee')
      ? DEMO_BUSINESS_ACCOUNTS.employee
      : DEMO_BUSINESS_ACCOUNTS.owner;

    return (
      <div
        className="vq-screen-enter flex flex-col h-full"
        style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)' }}
      >
        <div
          className="px-4 pt-3.5 pb-4 relative overflow-hidden"
          style={{
            background: 'var(--vq-grad-mesh)',
            color: '#EDF2EF',
            borderRadius: '0 0 var(--vq-r-xl) var(--vq-r-xl)'
          }}
        >
          <div className="flex items-center justify-between mb-3 relative z-10">
            <button
              type="button"
              onClick={goBack}
              className="vq-spring-btn w-8 h-8 flex items-center justify-center"
              style={{
                borderRadius: 'var(--vq-r-sm)',
                background: 'rgb(255 255 255 / .1)',
                border: '1px solid rgb(255 255 255 / .16)',
                color: '#EDF2EF'
              }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <VqBadge
              tone="accent"
              style={{
                background: 'rgb(35 196 166 / .18)',
                color: '#93EBD6',
                borderColor: 'rgb(35 196 166 / .35)'
              }}
            >
              VenQore Partner Portal
            </VqBadge>
          </div>

          <h1 className="vq-display text-xl text-[#F4FFFB] relative z-10">
            {businessAuthMode === 'SIGN_IN'
              ? 'Sign in to your workspace'
              : 'Register as Store Owner'}
          </h1>
          <p className="text-[11.5px] mt-1 relative z-10" style={{ color: '#A8B4AE' }}>
            {businessAuthMode === 'SIGN_IN'
              ? 'No role questions asked — our backend resolves Owner, Staff, or Rider from your credentials.'
              : 'Because you entered via Partner Portal, registering tags you as Store Owner & launches the Builder.'}
          </p>

          <div className="mt-3.5 relative z-10">
            <VqTabs
              darkSurface
              tabs={[
                { value: 'SIGN_IN', label: 'Existing Store Sign In' },
                { value: 'REGISTER_OWNER', label: 'New Store Owner' }
              ]}
              value={businessAuthMode}
              onChange={setBusinessAuthMode}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto vq-no-scrollbar p-4 space-y-3">
          {businessAuthMode === 'SIGN_IN' ? (
            <>
              <div
                className="p-3"
                style={{
                  background: 'var(--vq-surface)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-lg)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="vq-eyebrow">1-Tap Demo Credentials</span>
                  <span className="vq-num text-[10px]" style={{ color: 'var(--vq-accent-text)' }}>
                    Zero role prompts
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      key: 'owner',
                      title: 'Owner',
                      sub: 'Qore ERP',
                      email: DEMO_BUSINESS_ACCOUNTS.owner.email,
                      icon: Store
                    },
                    {
                      key: 'employee',
                      title: 'Employee',
                      sub: 'Prep Queue',
                      email: DEMO_BUSINESS_ACCOUNTS.employee.email,
                      icon: ClipboardList
                    },
                    {
                      key: 'rider',
                      title: 'Rider',
                      sub: 'Sister App',
                      email: DEMO_BUSINESS_ACCOUNTS.rider.email,
                      icon: Truck
                    }
                  ].map((item) => {
                    const IconComponent = item.icon;
                    const selected = loginEmail === item.email;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setLoginEmail(item.email)}
                        className="vq-spring-btn p-2.5 text-left"
                        style={{
                          borderRadius: 'var(--vq-r-md)',
                          background: selected
                            ? 'var(--vq-accent-quiet)'
                            : 'var(--vq-surface-2)',
                          border: `1px solid ${
                            selected
                              ? 'var(--vq-accent-quiet-line)'
                              : 'var(--vq-line)'
                          }`,
                          color: selected
                            ? 'var(--vq-accent-text)'
                            : 'var(--vq-text)'
                        }}
                      >
                        <IconComponent className="w-4 h-4 mb-1" />
                        <div className="text-xs font-bold">{item.title}</div>
                        <div
                          className="vq-num text-[9.5px] truncate"
                          style={{ color: 'var(--vq-text-3)' }}
                        >
                          {item.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={handleBusinessSignIn} className="space-y-3">
                <div>
                  <label
                    className="text-xs font-semibold block mb-1"
                    style={{ color: 'var(--vq-text-2)' }}
                  >
                    Work Email or Phone
                  </label>
                  <div
                    className="flex items-center gap-2.5 px-3.5 h-11"
                    style={{
                      background: 'var(--vq-surface)',
                      border: '1px solid var(--vq-line)',
                      borderRadius: 'var(--vq-r-md)',
                      boxShadow: 'var(--vq-elev-1)'
                    }}
                  >
                    <Mail className="w-4 h-4" style={{ color: 'var(--vq-text-3)' }} />
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ color: 'var(--vq-text)' }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="text-xs font-semibold block mb-1"
                    style={{ color: 'var(--vq-text-2)' }}
                  >
                    Password
                  </label>
                  <div
                    className="flex items-center gap-2.5 px-3.5 h-11"
                    style={{
                      background: 'var(--vq-surface)',
                      border: '1px solid var(--vq-line)',
                      borderRadius: 'var(--vq-r-md)',
                      boxShadow: 'var(--vq-elev-1)'
                    }}
                  >
                    <Lock className="w-4 h-4" style={{ color: 'var(--vq-text-3)' }} />
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="flex-1 bg-transparent text-sm outline-none"
                      style={{ color: 'var(--vq-text)' }}
                    />
                  </div>
                </div>

                {/* Live System Identity Resolution Preview */}
                <div
                  className="p-3 space-y-1.5"
                  style={{
                    background: 'var(--vq-surface-2)',
                    border: '1px solid var(--vq-line)',
                    borderRadius: 'var(--vq-r-md)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="vq-eyebrow">System Directory Resolution</span>
                    <VqBadge tone={detectedAccount.tone}>
                      {detectedAccount.label}
                    </VqBadge>
                  </div>
                  <div className="text-xs font-semibold" style={{ color: 'var(--vq-text)' }}>
                    {detectedAccount.name} · {detectedAccount.storeName}
                  </div>
                  <div className="vq-num text-[10.5px]" style={{ color: 'var(--vq-text-3)' }}>
                    Scopes: {detectedAccount.permissions}
                  </div>
                </div>

                <button
                  type="submit"
                  className="vq-spring-btn w-full h-11 font-semibold text-xs flex items-center justify-center gap-2"
                  style={{
                    borderRadius: 'var(--vq-r-full)',
                    background: 'var(--vq-accent-fill)',
                    color: 'var(--vq-on-accent)',
                    boxShadow: 'var(--vq-glow-accent)'
                  }}
                >
                  <span>Sign In &amp; Open {detectedAccount.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleOwnerRegistrationSubmit} className="space-y-2.5">
              <div
                className="p-3 text-xs flex items-start gap-2.5"
                style={{
                  background: 'var(--vq-accent-quiet)',
                  color: 'var(--vq-accent-text)',
                  border: '1px solid var(--vq-accent-quiet-line)',
                  borderRadius: 'var(--vq-r-md)'
                }}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">
                    Automatic Role Tag: STORE_OWNER
                  </span>
                  Staff &amp; Riders are invited by their Store Owner. Registering here creates a <strong>Store Owner</strong> account and opens the AI Blueprint Builder.
                </div>
              </div>

              {[
                {
                  label: 'Owner Full Name',
                  type: 'text',
                  placeholder: 'e.g., Ahmad Raza',
                  val: newOwnerForm.fullName,
                  key: 'fullName'
                },
                {
                  label: 'Business Email',
                  type: 'email',
                  placeholder: 'ahmad@ranatraders.pk',
                  val: newOwnerForm.email,
                  key: 'email'
                },
                {
                  label: 'Mobile Number',
                  type: 'tel',
                  placeholder: '+92 300 1234567',
                  val: newOwnerForm.phone,
                  key: 'phone'
                },
                {
                  label: 'Create Password',
                  type: 'password',
                  placeholder: 'Min. 8 characters',
                  val: newOwnerForm.password,
                  key: 'password'
                }
              ].map((field) => (
                <div key={field.key}>
                  <label
                    className="text-xs font-semibold block mb-1"
                    style={{ color: 'var(--vq-text-2)' }}
                  >
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    required
                    value={field.val}
                    onChange={(e) =>
                      setNewOwnerForm({
                        ...newOwnerForm,
                        [field.key]: e.target.value
                      })
                    }
                    placeholder={field.placeholder}
                    className="w-full px-3.5 h-10 text-xs outline-none"
                    style={{
                      background: 'var(--vq-surface)',
                      color: 'var(--vq-text)',
                      border: '1px solid var(--vq-line)',
                      borderRadius: 'var(--vq-r-md)',
                      boxShadow: 'var(--vq-elev-1)'
                    }}
                  />
                </div>
              ))}

              <button
                type="submit"
                className="vq-spring-btn w-full h-11 font-semibold text-xs flex items-center justify-center gap-2 mt-2"
                style={{
                  borderRadius: 'var(--vq-r-full)',
                  background: 'var(--vq-accent-fill)',
                  color: 'var(--vq-on-accent)',
                  boxShadow: 'var(--vq-glow-accent)'
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>Create Owner Account &amp; Build Store</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  const renderStoreBuilderScreen = () => (
    <div
      className="vq-screen-enter flex flex-col h-full"
      style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)' }}
    >
      {/* Mint Gradient Header */}
      <div
        className="px-4 pt-3.5 pb-4 text-white"
        style={{
          background: 'var(--vq-grad-mint)',
          borderRadius: '0 0 var(--vq-r-xl) var(--vq-r-xl)',
          boxShadow: 'var(--vq-glow-accent)'
        }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <button
            type="button"
            onClick={goBack}
            className="vq-spring-btn w-8 h-8 flex items-center justify-center"
            style={{
              borderRadius: 'var(--vq-r-sm)',
              background: 'rgb(255 255 255 / .18)'
            }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <span className="vq-num text-[10.5px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-black/25">
            Step 0{builderStep} / 03 • AI Blueprint
          </span>
        </div>

        <h1 className="vq-display text-lg text-white leading-tight">
          Tell us your business. We&rsquo;ll build the store.
        </h1>
        <p className="text-[11.5px] text-white/85 mt-0.5">
          {registrationOrigin === 'CUSTOMER_PROFILE_CONVERSION'
            ? `Converting ${customerUser.name}'s account to Store Owner (ERP + Storefront).`
            : 'Describe how you work, review your modules, and pick a plan.'}
        </p>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className="h-1.5 rounded-full transition-all"
              style={{
                background:
                  builderStep >= step ? '#FFFFFF' : 'rgb(255 255 255 / .28)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Builder Steps Content */}
      <div className="flex-1 overflow-y-auto vq-no-scrollbar p-4 space-y-3">
        {builderStep === 1 && (
          <>
            {/* Natural Language Prompt Card from VenQore BlueprintScreen */}
            <div
              className="p-3.5 space-y-2.5"
              style={{
                background: 'var(--vq-surface)',
                border: '1px solid var(--vq-line)',
                borderRadius: 'var(--vq-r-lg)',
                boxShadow: 'var(--vq-elev-1)'
              }}
            >
              <div className="flex items-center justify-between">
                <span className="vq-eyebrow">Step 01 · Describe &amp; Name</span>
                <VqBadge tone="accent" dot={false}>
                  Vena AI
                </VqBadge>
              </div>

              <input
                type="text"
                value={storeBuilderData.storeName}
                onChange={(e) =>
                  setStoreBuilderData({
                    ...storeBuilderData,
                    storeName: e.target.value
                  })
                }
                placeholder="Storefront Name"
                className="w-full px-3 h-9 text-xs font-semibold outline-none"
                style={{
                  background: 'var(--vq-surface-2)',
                  color: 'var(--vq-text)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-sm)'
                }}
              />

              <textarea
                rows={2}
                value={blueprintPrompt}
                onChange={(e) => setBlueprintPrompt(e.target.value)}
                className="w-full p-2.5 text-xs outline-none resize-none leading-relaxed"
                style={{
                  background: 'var(--vq-surface-2)',
                  color: 'var(--vq-text)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-sm)'
                }}
              />

              {/* Detected Capability Chips */}
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {['Storefront', 'POS', 'Batch & Expiry', 'Rider Fleet', 'Core Ledger'].map(
                  (tag) => (
                    <VqChip key={tag} selected={false}>
                      {tag}
                    </VqChip>
                  )
                )}
              </div>
            </div>

            {/* Assembled Modules with Spring Switches */}
            <div
              className="p-3.5 space-y-2"
              style={{
                background: 'var(--vq-surface)',
                border: '1px solid var(--vq-line)',
                borderRadius: 'var(--vq-r-lg)',
                boxShadow: 'var(--vq-elev-1)'
              }}
            >
              <span className="vq-eyebrow block">Assembled Blueprint Modules</span>

              {[
                {
                  key: 'pos',
                  name: 'Marketplace Storefront & POS',
                  sub: 'Live online orders + walk-in counter'
                },
                {
                  key: 'riderDispatch',
                  name: 'Rider Sister System',
                  sub: 'Auto-dispatch orders to your delivery riders'
                },
                {
                  key: 'coreLedger',
                  name: 'Core Ledger (Double-Entry)',
                  sub: 'Always on — debits equal credits',
                  locked: true
                }
              ].map((m) => (
                <div
                  key={m.key}
                  className="flex items-center justify-between p-2.5"
                  style={{
                    borderRadius: 'var(--vq-r-md)',
                    background: 'var(--vq-surface-2)',
                    border: '1px solid var(--vq-line-soft)'
                  }}
                >
                  <div className="pr-2 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-semibold truncate"
                        style={{ color: 'var(--vq-text)' }}
                      >
                        {m.name}
                      </span>
                      {m.locked && (
                        <VqBadge tone="accent" dot={false}>
                          Locked
                        </VqBadge>
                      )}
                    </div>
                    <div
                      className="text-[10.5px] truncate mt-0.5"
                      style={{ color: 'var(--vq-text-3)' }}
                    >
                      {m.sub}
                    </div>
                  </div>
                  <VqSwitch
                    checked={storeBuilderData.modules[m.key]}
                    locked={m.locked}
                    onChange={(val) =>
                      setStoreBuilderData({
                        ...storeBuilderData,
                        modules: { ...storeBuilderData.modules, [m.key]: val }
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {builderStep === 2 && (
          <div
            className="p-4 space-y-3.5"
            style={{
              background: 'var(--vq-surface)',
              border: '1px solid var(--vq-line)',
              borderRadius: 'var(--vq-r-lg)',
              boxShadow: 'var(--vq-elev-1)'
            }}
          >
            <span className="vq-eyebrow">Step 02 · Store Hub &amp; Coverage</span>

            {/* Visual Radar Coverage Preview */}
            <div
              className="h-32 rounded-2xl relative overflow-hidden flex items-center justify-center"
              style={{
                background: 'var(--vq-grad-mesh)',
                border: '1px solid var(--vq-line)'
              }}
            >
              <div
                className="rounded-full border border-[#59DBC0]/40 flex items-center justify-center transition-all duration-300"
                style={{
                  width:
                    storeBuilderData.deliveryRadius === '3 km'
                      ? 68
                      : storeBuilderData.deliveryRadius === '5 km'
                      ? 96
                      : 122,
                  height:
                    storeBuilderData.deliveryRadius === '3 km'
                      ? 68
                      : storeBuilderData.deliveryRadius === '5 km'
                      ? 96
                      : 122,
                  background: 'rgb(35 196 166 / .16)'
                }}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white"
                  style={{
                    background: 'var(--vq-accent-fill)',
                    boxShadow: 'var(--vq-glow-accent)'
                  }}
                >
                  <Store className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="vq-num absolute bottom-2 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/50 text-[#93EBD6]">
                Coverage: {storeBuilderData.deliveryRadius} radius
              </span>
            </div>

            <div>
              <label
                className="text-xs font-semibold block mb-1"
                style={{ color: 'var(--vq-text-2)' }}
              >
                Store Branch Address
              </label>
              <input
                type="text"
                value={storeBuilderData.address}
                onChange={(e) =>
                  setStoreBuilderData({
                    ...storeBuilderData,
                    address: e.target.value
                  })
                }
                className="w-full px-3.5 h-10 text-xs outline-none"
                style={{
                  background: 'var(--vq-surface-2)',
                  color: 'var(--vq-text)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-md)'
                }}
              />
            </div>

            <div>
              <label
                className="text-xs font-semibold block mb-1.5"
                style={{ color: 'var(--vq-text-2)' }}
              >
                Customer Delivery Radius
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['3 km', '5 km', '10 km'].map((rad) => {
                  const selected = storeBuilderData.deliveryRadius === rad;
                  return (
                    <button
                      key={rad}
                      type="button"
                      onClick={() =>
                        setStoreBuilderData({
                          ...storeBuilderData,
                          deliveryRadius: rad
                        })
                      }
                      className="vq-spring-btn vq-num py-2 px-2 text-xs font-semibold"
                      style={{
                        borderRadius: 'var(--vq-r-full)',
                        background: selected
                          ? 'var(--vq-accent-fill)'
                          : 'var(--vq-surface-2)',
                        color: selected ? 'var(--vq-on-accent)' : 'var(--vq-text)',
                        border: `1px solid ${
                          selected ? 'transparent' : 'var(--vq-line)'
                        }`,
                        boxShadow: selected ? 'var(--vq-glow-accent)' : 'none'
                      }}
                    >
                      {rad}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {builderStep === 3 && (
          <div className="space-y-2.5">
            <span className="vq-eyebrow block px-1">
              Step 03 · Choose Plan &amp; Go Live
            </span>
            {[
              {
                name: 'Starter ($36/mo)',
                price: '$36',
                features: 'One branch • 2 Staff/Rider logins • Core Ledger'
              },
              {
                name: 'Business ($79/mo)',
                price: '$79',
                best: true,
                features: 'Up to 5 branches • 10 Staff & Rider logins • VenSynQ'
              }
            ].map((plan) => {
              const selected = storeBuilderData.plan === plan.name;
              return (
                <div
                  key={plan.name}
                  onClick={() =>
                    setStoreBuilderData({ ...storeBuilderData, plan: plan.name })
                  }
                  className="p-3.5 cursor-pointer transition"
                  style={{
                    borderRadius: 'var(--vq-r-lg)',
                    background: selected
                      ? 'var(--vq-grad-mint)'
                      : 'var(--vq-surface)',
                    color: selected ? '#FFFFFF' : 'var(--vq-text)',
                    border: `1px solid ${
                      selected ? 'transparent' : 'var(--vq-line)'
                    }`,
                    boxShadow: selected
                      ? 'var(--vq-glow-accent)'
                      : 'var(--vq-elev-1)'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="vq-display text-sm">{plan.name}</span>
                      {plan.best && (
                        <VqBadge
                          tone="neutral"
                          dot={false}
                          style={
                            selected
                              ? {
                                  background: 'rgb(255 255 255 / .2)',
                                  color: '#fff',
                                  borderColor: 'rgb(255 255 255 / .3)'
                                }
                              : undefined
                          }
                        >
                          Most picked
                        </VqBadge>
                      )}
                    </div>
                    <span className="vq-num text-lg font-bold">
                      {plan.price}
                      <span className="text-xs font-normal opacity-75">/mo</span>
                    </span>
                  </div>
                  <p
                    className="text-[11.5px] mt-1"
                    style={{
                      color: selected
                        ? 'rgb(255 255 255 / .86)'
                        : 'var(--vq-text-2)'
                    }}
                  >
                    {plan.features}
                  </p>
                </div>
              );
            })}

            <div
              className="p-3.5 space-y-2"
              style={{
                background: 'var(--vq-surface)',
                border: '1px solid var(--vq-line)',
                borderRadius: 'var(--vq-r-lg)'
              }}
            >
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-1.5">
                  <CreditCard
                    className="w-4 h-4"
                    style={{ color: 'var(--vq-accent-text)' }}
                  />
                  <span>Payment Card</span>
                </span>
                <VqBadge tone="success">14-Day Trial</VqBadge>
              </div>
              <div
                className="vq-num text-xs px-3 py-2 flex items-center justify-between"
                style={{
                  background: 'var(--vq-sunken)',
                  borderRadius: 'var(--vq-r-sm)',
                  color: 'var(--vq-text-2)'
                }}
              >
                <span>•••• •••• •••• 4242</span>
                <span>08/29</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div
        className="p-3.5 flex gap-2"
        style={{
          background: 'var(--vq-surface)',
          borderTop: '1px solid var(--vq-line)'
        }}
      >
        {builderStep > 1 && (
          <button
            type="button"
            onClick={() => setBuilderStep(builderStep - 1)}
            className="vq-spring-btn px-4 h-11 text-xs font-semibold"
            style={{
              borderRadius: 'var(--vq-r-full)',
              background: 'var(--vq-surface-2)',
              color: 'var(--vq-text)',
              border: '1px solid var(--vq-line)'
            }}
          >
            Back
          </button>
        )}
        {builderStep < 3 ? (
          <button
            type="button"
            onClick={() => setBuilderStep(builderStep + 1)}
            className="vq-spring-btn flex-1 h-11 font-semibold text-xs flex items-center justify-center gap-1.5"
            style={{
              borderRadius: 'var(--vq-r-full)',
              background: 'var(--vq-accent-fill)',
              color: 'var(--vq-on-accent)',
              boxShadow: 'var(--vq-glow-accent)'
            }}
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCompleteStoreBuilder}
            className="vq-spring-btn flex-1 h-11 font-semibold text-xs flex items-center justify-center gap-1.5"
            style={{
              borderRadius: 'var(--vq-r-full)',
              background: 'var(--vq-accent-fill)',
              color: 'var(--vq-on-accent)',
              boxShadow: 'var(--vq-glow-accent-strong)'
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Convert &amp; Open Store Owner ERP</span>
          </button>
        )}
      </div>
    </div>
  );

  const renderRoleDashboardScreen = () => {
    const isOwner = screen === 'OWNER_DASHBOARD';
    const isEmployee = screen === 'EMPLOYEE_DASHBOARD';
    const isRider = screen === 'RIDER_DASHBOARD';

    const managedStore =
      stores.find((s) => s.name === activeBusinessUser.storeName) || stores[0];

    return (
      <div
        className="vq-screen-enter flex flex-col h-full"
        style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)' }}
      >
        {/* Role-specific VenQore Header */}
        <div
          className="px-4 pt-3.5 pb-4 text-white"
          style={{
            background: isOwner
              ? 'var(--vq-grad-mesh)'
              : isEmployee
              ? 'var(--vq-grad-mint)'
              : 'linear-gradient(135deg, #0B3A35 0%, #A6690A 100%)',
            borderRadius: '0 0 var(--vq-r-xl) var(--vq-r-xl)'
          }}
        >
          <div className="flex items-center justify-between mb-2.5">
            <VqBadge
              tone={isOwner ? 'accent' : isEmployee ? 'success' : 'warning'}
            >
              {isOwner
                ? 'Store Owner · ERP & Storefront'
                : isEmployee
                ? 'Store Employee Queue'
                : 'Rider Sister System'}
            </VqBadge>
            <div className="flex items-center gap-1.5">
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveStore(managedStore);
                    navigateTo('MARKETPLACE');
                  }}
                  className="vq-spring-btn text-[10.5px] font-semibold bg-[#23C4A6] text-[#062421] px-2.5 py-1 rounded-full flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>View Storefront</span>
                </button>
              )}
              <button
                type="button"
                onClick={resetToWelcome}
                className="vq-spring-btn text-[11px] bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-full flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          </div>

          <h1 className="vq-display text-lg text-white leading-tight">
            {activeBusinessUser.storeName}
          </h1>
          <p className="text-[11px] text-white/75 mt-0.5">
            {activeBusinessUser.name} ·{' '}
            <span className="vq-num">{activeBusinessUser.label}</span>
          </p>

          {isOwner && (
            <div className="mt-3">
              <VqTabs
                darkSurface
                tabs={[
                  { value: 'ERP', label: 'Qore ERP & Ledger' },
                  { value: 'STOREFRONT', label: 'Storefront Catalog' }
                ]}
                value={ownerTab}
                onChange={setOwnerTab}
              />
            </div>
          )}
        </div>

        {/* Role Body */}
        <div className="flex-1 overflow-y-auto vq-no-scrollbar p-3.5 space-y-3">
          {isOwner && ownerTab === 'ERP' && (
            <>
              {/* VenQore StatCards */}
              <div className="grid grid-cols-2 gap-2.5">
                <div
                  className="p-3.5 text-white"
                  style={{
                    borderRadius: 'var(--vq-r-xl)',
                    background: 'var(--vq-grad-mint)',
                    boxShadow: 'var(--vq-glow-accent)'
                  }}
                >
                  <span
                    className="vq-eyebrow"
                    style={{ color: 'rgb(255 255 255 / .8)' }}
                  >
                    Net Balance
                  </span>
                  <div className="vq-num text-xl font-bold mt-1">
                    Rs 148,920
                  </div>
                  <span className="vq-num text-[10.5px] font-semibold inline-block mt-1 px-2 py-0.5 rounded-full bg-white/20">
                    ▴ 14.2% vs yesterday
                  </span>
                </div>

                <div
                  className="p-3.5"
                  style={{
                    borderRadius: 'var(--vq-r-xl)',
                    background: 'var(--vq-surface)',
                    border: '1px solid var(--vq-line)',
                    boxShadow: 'var(--vq-elev-1)'
                  }}
                >
                  <span className="vq-eyebrow">Live Storefront</span>
                  <div
                    className="vq-num text-xl font-bold mt-1"
                    style={{ color: 'var(--vq-text)' }}
                  >
                    {managedStore.products.length} SKUs
                  </div>
                  <span
                    className="vq-num text-[10.5px] font-semibold mt-1 inline-block"
                    style={{ color: 'var(--vq-success)' }}
                  >
                    ● VenSynQ Online
                  </span>
                </div>
              </div>

              {/* VenQore v6 AreaChart Card */}
              <div
                className="p-3.5 space-y-2"
                style={{
                  background: 'var(--vq-surface)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-lg)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="vq-eyebrow block">Today&rsquo;s Velocity</span>
                    <span className="vq-display text-sm">
                      Storefront &amp; POS Sales
                    </span>
                  </div>
                  <VqBadge tone="success">Balanced</VqBadge>
                </div>
                <VqAreaChart />
              </div>

              {/* VenQore v6 Inventory ProgressRing + BarMeter Card */}
              <div
                className="p-3.5 flex items-center gap-3.5"
                style={{
                  background: 'var(--vq-surface)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-lg)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              >
                <VqProgressRing value={86} label="86%" />
                <div className="flex-1 space-y-1.5 min-w-0">
                  <span className="vq-eyebrow block">Stock Health</span>
                  <VqBarMeter label="Healthy" pct={78} color="var(--vq-success)" />
                  <VqBarMeter label="Low" pct={14} color="var(--vq-warning)" />
                  <VqBarMeter label="Out" pct={8} color="var(--vq-danger)" />
                </div>
              </div>

              {/* VenQore v6 Core Ledger Activity Rows */}
              <div
                className="p-3.5 space-y-2"
                style={{
                  background: 'var(--vq-surface)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-lg)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              >
                <span className="vq-eyebrow block">Core Ledger Postings</span>
                <VqActivityRow
                  tone="in"
                  title="Online Order #SAL-R1-8821"
                  meta="2 mins ago · Marketplace"
                  amount="+Rs 4,620"
                />
                <VqActivityRow
                  tone="out"
                  title="Supplier Batch #PUR-2210"
                  meta="2 hrs ago · 30-day credit"
                  amount="−Rs 12,400"
                />
              </div>
            </>
          )}

          {isOwner && ownerTab === 'STOREFRONT' && (
            <div className="space-y-3">
              {/* Publish New Product to Live Storefront */}
              <form
                onSubmit={handleAddProductToStorefront}
                className="p-3.5 space-y-2.5"
                style={{
                  background: 'var(--vq-surface)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-lg)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="vq-eyebrow">Add Item to Live Storefront</span>
                  <VqBadge tone="accent" dot={false}>
                    VenSynQ Instant
                  </VqBadge>
                </div>

                <div className="grid grid-cols-[44px_1fr] gap-2">
                  <input
                    type="text"
                    value={newProductForm.emoji}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        emoji: e.target.value
                      })
                    }
                    className="h-9 text-center text-base outline-none"
                    style={{
                      background: 'var(--vq-surface-2)',
                      border: '1px solid var(--vq-line)',
                      borderRadius: 'var(--vq-r-sm)'
                    }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="Product title (e.g. Organic Honey)"
                    value={newProductForm.name}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        name: e.target.value
                      })
                    }
                    className="px-3 h-9 text-xs outline-none"
                    style={{
                      background: 'var(--vq-surface-2)',
                      color: 'var(--vq-text)',
                      border: '1px solid var(--vq-line)',
                      borderRadius: 'var(--vq-r-sm)'
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="Price ($)"
                    value={newProductForm.price}
                    onChange={(e) =>
                      setNewProductForm({
                        ...newProductForm,
                        price: e.target.value
                      })
                    }
                    className="vq-num px-3 h-9 text-xs outline-none"
                    style={{
                      background: 'var(--vq-surface-2)',
                      color: 'var(--vq-text)',
                      border: '1px solid var(--vq-line)',
                      borderRadius: 'var(--vq-r-sm)'
                    }}
                  />
                  <button
                    type="submit"
                    className="vq-spring-btn h-9 text-xs font-semibold flex items-center justify-center gap-1"
                    style={{
                      borderRadius: 'var(--vq-r-full)',
                      background: 'var(--vq-accent-fill)',
                      color: 'var(--vq-on-accent)',
                      boxShadow: 'var(--vq-glow-accent)'
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Publish to Store</span>
                  </button>
                </div>
              </form>

              {/* Current Storefront Products */}
              <div
                className="p-3.5 space-y-2"
                style={{
                  background: 'var(--vq-surface)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-lg)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="vq-eyebrow">
                    Live Marketplace Catalog ({managedStore.products.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveStore(managedStore);
                      navigateTo('MARKETPLACE');
                    }}
                    className="text-[11px] font-semibold flex items-center gap-1"
                    style={{ color: 'var(--vq-accent-text)' }}
                  >
                    <span>Open Customer View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {managedStore.products.map((prod) => (
                  <div
                    key={prod.id}
                    className="flex items-center justify-between p-2.5 rounded-xl"
                    style={{
                      background: 'var(--vq-surface-2)',
                      border: '1px solid var(--vq-line-soft)'
                    }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg">{prod.emoji}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">
                          {prod.name}
                        </div>
                        <div
                          className="text-[10.5px]"
                          style={{ color: 'var(--vq-text-3)' }}
                        >
                          {prod.unit} · {prod.tag}
                        </div>
                      </div>
                    </div>
                    <span
                      className="vq-num text-xs font-bold"
                      style={{ color: 'var(--vq-accent-text)' }}
                    >
                      ${prod.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEmployee && (
            <div className="space-y-2.5">
              <div
                className="p-3 text-xs"
                style={{
                  background: 'var(--vq-accent-quiet)',
                  color: 'var(--vq-accent-text)',
                  border: '1px solid var(--vq-accent-quiet-line)',
                  borderRadius: 'var(--vq-r-md)'
                }}
              >
                <strong>Staff Prep Queue:</strong> Tap any status pill to advance the order to the next stage for the Rider.
              </div>
              {employeeOrders.map((ord, idx) => (
                <div
                  key={ord.id}
                  className="p-3.5 flex items-center justify-between gap-2"
                  style={{
                    background: 'var(--vq-surface)',
                    border: '1px solid var(--vq-line)',
                    borderRadius: 'var(--vq-r-lg)',
                    boxShadow: 'var(--vq-elev-1)'
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="vq-num font-bold text-sm">{ord.id}</span>
                      <span
                        className="text-xs font-semibold"
                        style={{ color: 'var(--vq-text)' }}
                      >
                        {ord.customer}
                      </span>
                    </div>
                    <div
                      className="text-[11px] truncate mt-0.5"
                      style={{ color: 'var(--vq-text-2)' }}
                    >
                      {ord.items}
                    </div>
                    <div
                      className="vq-num text-[10px] mt-0.5"
                      style={{ color: 'var(--vq-text-3)' }}
                    >
                      Received {ord.time}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextStates = {
                        'Pending Prep': { status: 'Packing', tone: 'info' },
                        Packing: { status: 'Ready for Rider', tone: 'success' },
                        'Ready for Rider': {
                          status: 'Handed to Rider',
                          tone: 'accent'
                        }
                      };
                      const next = nextStates[ord.status] || {
                        status: 'Completed',
                        tone: 'neutral'
                      };
                      const updated = [...employeeOrders];
                      updated[idx] = { ...ord, ...next };
                      setEmployeeOrders(updated);
                    }}
                    className="vq-spring-btn shrink-0"
                  >
                    <VqBadge tone={ord.tone}>{ord.status}</VqBadge>
                  </button>
                </div>
              ))}
            </div>
          )}

          {isRider && (
            <div className="space-y-3">
              {/* Rider Route Card */}
              <div
                className="p-4 relative overflow-hidden"
                style={{
                  background: 'var(--vq-grad-mesh)',
                  color: '#EDF2EF',
                  borderRadius: 'var(--vq-r-xl)',
                  boxShadow: 'var(--vq-elev-2)'
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="vq-eyebrow" style={{ color: '#93EBD6' }}>
                    Active Dispatch #DLV-902
                  </span>
                  <VqBadge tone="warning">1.2 km · 6 min</VqBadge>
                </div>
                <div className="vq-display text-sm text-white">
                  GreenLeaf Organics → House 42, Block C
                </div>
                <p className="text-xs mt-1" style={{ color: '#A8B4AE' }}>
                  Customer: Zainab Ali · +92 300 5551234
                </p>

                {/* Simulated Route Line SVG */}
                <svg
                  viewBox="0 0 260 42"
                  className="w-full h-10 mt-2 overflow-visible"
                >
                  <path
                    d="M 14 28 Q 95 6, 150 24 T 246 14"
                    fill="none"
                    stroke="rgb(255 255 255 / .2)"
                    strokeWidth="3"
                    strokeDasharray="4 4"
                  />
                  <path
                    d="M 14 28 Q 95 6, 150 24"
                    fill="none"
                    stroke="#23C4A6"
                    strokeWidth="3"
                  />
                  <circle cx="14" cy="28" r="5" fill="#23C4A6" />
                  <circle cx="150" cy="24" r="6" fill="#FFCD5B" />
                  <circle cx="246" cy="14" r="5" fill="#FF8A6B" />
                </svg>
              </div>

              <div
                className="p-4 space-y-3"
                style={{
                  background: 'var(--vq-surface)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-lg)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              >
                <span className="vq-eyebrow">Rider Progression</span>
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  {[
                    { s: 1, label: '01. At Store' },
                    { s: 2, label: '02. Picked Up' },
                    { s: 3, label: '03. Delivered' }
                  ].map((st) => (
                    <div
                      key={st.s}
                      className="vq-num py-1.5 px-2 rounded-lg text-[10.5px] font-bold"
                      style={{
                        background:
                          riderDeliveryStep >= st.s
                            ? 'var(--vq-accent-quiet)'
                            : 'var(--vq-sunken)',
                        color:
                          riderDeliveryStep >= st.s
                            ? 'var(--vq-accent-text)'
                            : 'var(--vq-text-3)'
                      }}
                    >
                      {st.label}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setRiderDeliveryStep((prev) => (prev < 3 ? prev + 1 : 1))
                  }
                  className="vq-spring-btn w-full h-11 font-semibold text-xs"
                  style={{
                    borderRadius: 'var(--vq-r-full)',
                    background: 'var(--vq-accent-fill)',
                    color: 'var(--vq-on-accent)',
                    boxShadow: 'var(--vq-glow-accent)'
                  }}
                >
                  {riderDeliveryStep === 1
                    ? 'Confirm Package Pickup from Store'
                    : riderDeliveryStep === 2
                    ? 'Mark Order Delivered to Customer'
                    : 'Completed! Tap for Next Dispatch'}
                </button>
              </div>
            </div>
          )}

          {/* Instant Role Preview Switcher */}
          <div
            className="p-3"
            style={{
              background: 'var(--vq-sunken)',
              borderRadius: 'var(--vq-r-lg)',
              border: '1px solid var(--vq-line)'
            }}
          >
            <span className="vq-eyebrow block mb-2">
              Instant Role Switcher (Same Sign-In Portal)
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                {
                  label: 'Owner ERP',
                  active: isOwner,
                  acc: customerConvertedStore
                    ? {
                        email: customerUser.email,
                        role: 'STORE_OWNER',
                        name: customerUser.name,
                        storeName: customerConvertedStore.name,
                        label: 'Converted Store Owner',
                        tone: 'accent'
                      }
                    : DEMO_BUSINESS_ACCOUNTS.owner,
                  scr: 'OWNER_DASHBOARD'
                },
                {
                  label: 'Staff Queue',
                  active: isEmployee,
                  acc: DEMO_BUSINESS_ACCOUNTS.employee,
                  scr: 'EMPLOYEE_DASHBOARD'
                },
                {
                  label: 'Rider App',
                  active: isRider,
                  acc: DEMO_BUSINESS_ACCOUNTS.rider,
                  scr: 'RIDER_DASHBOARD'
                }
              ].map((btn) => (
                <button
                  key={btn.scr}
                  type="button"
                  onClick={() => {
                    setActiveBusinessUser(btn.acc);
                    setScreen(btn.scr);
                  }}
                  className="vq-spring-btn py-2 text-[11px] font-semibold"
                  style={{
                    borderRadius: 'var(--vq-r-full)',
                    background: btn.active
                      ? 'var(--vq-accent-fill)'
                      : 'var(--vq-surface)',
                    color: btn.active
                      ? 'var(--vq-on-accent)'
                      : 'var(--vq-text-2)',
                    border: `1px solid ${
                      btn.active ? 'transparent' : 'var(--vq-line)'
                    }`,
                    boxShadow: btn.active ? 'var(--vq-glow-accent)' : 'none'
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCustomerLocationScreen = () => (
    <div
      className="vq-screen-enter flex flex-col h-full"
      style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)' }}
    >
      {/* Top Bar */}
      <div
        className="px-4 pt-3.5 pb-3 flex items-center justify-between z-10"
        style={{
          background: 'var(--vq-surface)',
          borderBottom: '1px solid var(--vq-line)'
        }}
      >
        <button
          type="button"
          onClick={goBack}
          className="vq-spring-btn w-8 h-8 flex items-center justify-center"
          style={{
            borderRadius: 'var(--vq-r-sm)',
            background: 'var(--vq-sunken)',
            color: 'var(--vq-text)'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h1 className="vq-display text-sm">Pin Your Delivery Location</h1>
          <p className="text-[10.5px]" style={{ color: 'var(--vq-text-3)' }}>
            Tap map to move pin or use live GPS
          </p>
        </div>
        <VqBadge tone="accent" dot={false}>
          {stores.length} Stores
        </VqBadge>
      </div>

      {/* Interactive Vector City Map Canvas */}
      <div
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = Math.min(
            84,
            Math.max(16, Math.round(((e.clientX - rect.left) / rect.width) * 100))
          );
          const y = Math.min(
            78,
            Math.max(20, Math.round(((e.clientY - rect.top) / rect.height) * 100))
          );
          setMapPin({ x, y });
          setSelectedAreaName(
            `Pinned Zone (${x}°, ${y}°) • ${stores.length} Stores Nearby`
          );
        }}
        className="relative flex-1 overflow-hidden cursor-crosshair select-none"
        style={{
          background: vqTheme === 'dark' ? '#0E1916' : '#E5F2EC'
        }}
      >
        {/* Vector City Blocks, Parks, and Roads */}
        <svg
          viewBox="0 0 400 420"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <rect
            x="24"
            y="36"
            width="110"
            height="85"
            rx="16"
            fill={vqTheme === 'dark' ? '#132A23' : '#C8EFE0'}
          />
          <rect
            x="230"
            y="240"
            width="135"
            height="95"
            rx="18"
            fill={vqTheme === 'dark' ? '#132A23' : '#C8EFE0'}
          />
          <rect
            x="160"
            y="40"
            width="190"
            height="75"
            rx="12"
            fill={vqTheme === 'dark' ? '#16221F' : '#F4F8F5'}
          />
          <rect
            x="30"
            y="165"
            width="145"
            height="120"
            rx="14"
            fill={vqTheme === 'dark' ? '#16221F' : '#F4F8F5'}
          />
          <path
            d="M -20 140 L 420 140 M -20 310 L 420 210 M 195 -20 L 195 440"
            stroke={vqTheme === 'dark' ? '#243530' : '#FFFFFF'}
            strokeWidth="18"
            strokeLinecap="round"
          />
          <path
            d="M -20 140 L 420 140 M -20 310 L 420 210 M 195 -20 L 195 440"
            stroke={vqTheme === 'dark' ? '#364F47' : '#D3DCD7'}
            strokeWidth="1.5"
            strokeDasharray="6 6"
          />
        </svg>

        {/* Store Markers on Map */}
        {stores.map((st) => (
          <div
            key={st.id}
            style={{ left: `${st.pinCoords.x}%`, top: `${st.pinCoords.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1 rounded-full text-[10.5px] font-bold flex items-center gap-1 pointer-events-none"
          >
            <span
              className="px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{
                background: 'var(--vq-surface)',
                color: 'var(--vq-text)',
                border: '1.5px solid var(--vq-accent)',
                boxShadow: 'var(--vq-elev-2)'
              }}
            >
              <span>{st.products[0]?.emoji || '🏪'}</span>
              <span>{st.name.split(' ')[0]}</span>
            </span>
          </div>
        ))}

        {/* User Selected Qore Teal Pin with Radar Pulse */}
        <div
          style={{ left: `${mapPin.x}%`, top: `${mapPin.y}%` }}
          className="absolute transition-all duration-200 pointer-events-none"
        >
          <span
            className="absolute rounded-full"
            style={{
              width: 56,
              height: 56,
              left: 0,
              top: 0,
              background: 'rgb(11 170 143 / .28)',
              animation: 'vqPulseRing 2s ease-out infinite'
            }}
          />
          <div className="-translate-x-1/2 -translate-y-full flex flex-col items-center">
            <div
              className="vq-num text-[10px] font-semibold px-2.5 py-1 rounded-full mb-1 whitespace-nowrap"
              style={{
                background: 'var(--vq-ink-950)',
                color: '#93EBD6',
                boxShadow: 'var(--vq-elev-2)'
              }}
            >
              Deliver Here
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--vq-accent-fill)',
                border: '3px solid #FFFFFF',
                boxShadow: 'var(--vq-glow-accent-strong)'
              }}
            >
              <MapPin className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Location Control Sheet */}
      <div
        className="p-4 space-y-2.5 z-10"
        style={{
          background: 'var(--vq-surface)',
          borderTop: '1px solid var(--vq-line)',
          borderRadius: 'var(--vq-r-xl) var(--vq-r-xl) 0 0',
          boxShadow: 'var(--vq-elev-3)'
        }}
      >
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="vq-spring-btn w-full h-9 px-4 font-semibold text-xs flex items-center justify-center gap-2"
          style={{
            borderRadius: 'var(--vq-r-full)',
            background: 'var(--vq-accent-quiet)',
            color: 'var(--vq-accent-text)',
            border: '1px solid var(--vq-accent-quiet-line)'
          }}
        >
          <Navigation
            className={`w-3.5 h-3.5 ${isLocatingGPS ? 'animate-spin' : ''}`}
          />
          <span>
            {isLocatingGPS
              ? 'Locking onto GPS satellite...'
              : 'Use My Current GPS Location'}
          </span>
        </button>

        <div
          className="p-2.5 px-3 flex items-center gap-2.5"
          style={{
            background: 'var(--vq-surface-2)',
            border: '1px solid var(--vq-line)',
            borderRadius: 'var(--vq-r-md)'
          }}
        >
          <MapPin
            className="w-4 h-4 shrink-0"
            style={{ color: 'var(--vq-accent-text)' }}
          />
          <div className="min-w-0 flex-1">
            <span className="vq-eyebrow block">Selected Delivery Zone</span>
            <div className="text-xs font-bold truncate">{selectedAreaName}</div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigateTo('MARKETPLACE')}
          className="vq-spring-btn w-full h-11 font-semibold text-xs flex items-center justify-center gap-2"
          style={{
            borderRadius: 'var(--vq-r-full)',
            background: 'var(--vq-accent-fill)',
            color: 'var(--vq-on-accent)',
            boxShadow: 'var(--vq-glow-accent)'
          }}
        >
          <span>Show Stores Around Here ({stores.length})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderMarketplaceScreen = () => (
    <div
      className="vq-screen-enter flex flex-col h-full"
      style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)' }}
    >
      {/* Sticky Glass Top Bar with Direct Customer Sign-In / Dashboard Button */}
      <div
        className="px-4 pt-3 pb-2.5 sticky top-0 z-10 flex items-center justify-between gap-2"
        style={{
          background: 'var(--vq-glass)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--vq-line)'
        }}
      >
        <button
          type="button"
          onClick={() => navigateTo('CUSTOMER_LOCATION')}
          className="flex items-center gap-2 text-left min-w-0"
        >
          <div
            className="w-8 h-8 flex items-center justify-center shrink-0"
            style={{
              borderRadius: 'var(--vq-r-sm)',
              background: 'var(--vq-accent-quiet)',
              color: 'var(--vq-accent-text)'
            }}
          >
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="vq-eyebrow flex items-center gap-0.5">
              <span>Delivering To</span>
              <ChevronRight className="w-3 h-3" />
            </div>
            <div className="text-xs font-bold truncate max-w-[130px]">
              {selectedAreaName}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {customerSignedIn ? (
            <button
              type="button"
              onClick={() => navigateTo('CUSTOMER_DASHBOARD')}
              className="vq-spring-btn px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5"
              style={{
                borderRadius: 'var(--vq-r-full)',
                background: 'var(--vq-ink-950)',
                color: '#F4FFFB',
                boxShadow: 'var(--vq-elev-1)'
              }}
            >
              <User className="w-3 h-3 text-[#23C4A6]" />
              <span>My Dashboard</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCustomerAuthTab('SIGN_IN');
                navigateTo('CUSTOMER_AUTH');
              }}
              className="vq-spring-btn px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5"
              style={{
                borderRadius: 'var(--vq-r-full)',
                background: 'var(--vq-accent-fill)',
                color: 'var(--vq-on-accent)',
                boxShadow: 'var(--vq-glow-accent)'
              }}
            >
              <User className="w-3 h-3" />
              <span>Sign In</span>
            </button>
          )}
          <button
            type="button"
            onClick={resetToWelcome}
            className="w-8 h-8 flex items-center justify-center"
            style={{
              borderRadius: 'var(--vq-r-sm)',
              background: 'var(--vq-sunken)',
              color: 'var(--vq-text-2)'
            }}
            title="Back to Split Screen"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Storefront Selector + Products */}
      <div className="flex-1 overflow-y-auto vq-no-scrollbar p-3.5 space-y-3.5">
        {/* Store Switcher Pills */}
        <div>
          <span className="vq-eyebrow block mb-2">
            Nearby Storefronts ({stores.length})
          </span>
          <div className="grid grid-cols-2 gap-2">
            {stores.map((st) => {
              const isSelected = activeStore.id === st.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setActiveStore(st)}
                  className="vq-spring-btn p-3 text-left"
                  style={{
                    borderRadius: 'var(--vq-r-lg)',
                    background: isSelected
                      ? 'var(--vq-accent-quiet)'
                      : 'var(--vq-surface)',
                    border: `1.5px solid ${
                      isSelected ? 'var(--vq-accent)' : 'var(--vq-line)'
                    }`,
                    boxShadow: isSelected ? 'none' : 'var(--vq-elev-1)'
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <VqBadge tone={isSelected ? 'accent' : 'neutral'} dot={false}>
                      {st.badge}
                    </VqBadge>
                    <span
                      className="vq-num text-[11px] font-bold"
                      style={{ color: 'var(--vq-warning)' }}
                    >
                      ★ {st.rating}
                    </span>
                  </div>
                  <div className="vq-display text-xs truncate">{st.name}</div>
                  <div
                    className="vq-num text-[10px] mt-0.5"
                    style={{ color: 'var(--vq-text-3)' }}
                  >
                    {st.distance} · {st.deliveryTime}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Storefront Hero Banner */}
        <div
          className="p-4 text-white relative overflow-hidden"
          style={{
            borderRadius: 'var(--vq-r-xl)',
            background: activeStore.bannerGradient,
            boxShadow: 'var(--vq-elev-2)'
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="vq-eyebrow"
              style={{ color: 'rgb(255 255 255 / .88)' }}
            >
              {activeStore.category}
            </span>
            <span className="vq-num text-[11px] font-semibold bg-black/25 px-2.5 py-0.5 rounded-full">
              ⚡ {activeStore.deliveryTime}
            </span>
          </div>
          <h3 className="vq-display text-base mt-1">{activeStore.name}</h3>
          <p className="text-[11px] text-white/85 mt-0.5">
            Live inventory synced via VenSynQ. Sign in anytime from the top bar or add items to order.
          </p>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1.5 overflow-x-auto vq-no-scrollbar">
          {['All Items', 'Bestsellers', 'Fresh Today'].map((c) => (
            <VqChip
              key={c}
              selected={selectedCategoryChip === c}
              onClick={() => setSelectedCategoryChip(c)}
            >
              {c}
            </VqChip>
          ))}
        </div>

        {/* Store Products */}
        <div className="space-y-2">
          {activeStore.products.map((prod) => {
            const inCartQty = cart[prod.id]?.qty || 0;
            return (
              <div
                key={prod.id}
                className="p-3 flex items-center justify-between gap-3"
                style={{
                  background: 'var(--vq-surface)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-lg)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center text-2xl shrink-0"
                  style={{
                    borderRadius: 'var(--vq-r-md)',
                    background: 'var(--vq-sunken)'
                  }}
                >
                  {prod.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <VqBadge tone="neutral" dot={false}>
                      {prod.tag}
                    </VqBadge>
                    <span
                      className="vq-num text-[10.5px]"
                      style={{ color: 'var(--vq-text-3)' }}
                    >
                      {prod.unit}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold mt-1 truncate">
                    {prod.name}
                  </h4>
                  <div
                    className="vq-num text-sm font-bold mt-0.5"
                    style={{ color: 'var(--vq-accent-text)' }}
                  >
                    ${prod.price.toFixed(2)}
                  </div>
                </div>

                {inCartQty === 0 ? (
                  <button
                    type="button"
                    onClick={() => addToCart(prod, activeStore)}
                    className="vq-spring-btn px-3.5 py-2 text-xs font-semibold flex items-center gap-1 shrink-0"
                    style={{
                      borderRadius: 'var(--vq-r-full)',
                      background: 'var(--vq-accent-fill)',
                      color: 'var(--vq-on-accent)',
                      boxShadow: 'var(--vq-glow-accent)'
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                ) : (
                  <div
                    className="flex items-center gap-1.5 px-1.5 py-1 shrink-0"
                    style={{
                      borderRadius: 'var(--vq-r-full)',
                      background: 'var(--vq-accent-quiet)',
                      border: '1px solid var(--vq-accent-quiet-line)'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => removeFromCart(prod.id)}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: 'var(--vq-surface)',
                        color: 'var(--vq-text)'
                      }}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span
                      className="vq-num text-xs font-bold w-4 text-center"
                      style={{ color: 'var(--vq-accent-text)' }}
                    >
                      {inCartQty}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(prod, activeStore)}
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{
                        background: 'var(--vq-accent-fill)',
                        color: 'var(--vq-on-accent)'
                      }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Floating Checkout Bar */}
      {cartTotalCount > 0 && (
        <div
          className="p-3"
          style={{
            background: 'var(--vq-surface)',
            borderTop: '1px solid var(--vq-line)'
          }}
        >
          <button
            type="button"
            onClick={() => navigateTo('CART_AUTH_GATE')}
            className="vq-spring-btn w-full h-11 px-4 flex items-center justify-between"
            style={{
              borderRadius: 'var(--vq-r-full)',
              background: 'var(--vq-accent-fill)',
              color: 'var(--vq-on-accent)',
              boxShadow: 'var(--vq-glow-accent-strong)'
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="vq-num w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center"
                style={{ background: '#062421', color: '#93EBD6' }}
              >
                {cartTotalCount}
              </span>
              <span className="text-xs font-semibold">Proceed to Checkout</span>
            </div>
            <div className="vq-num flex items-center gap-1.5 font-bold text-sm">
              <span>${cartSubtotal.toFixed(2)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}
    </div>
  );

  const renderCustomerAuthScreen = () => (
    <div
      className="vq-screen-enter flex flex-col h-full"
      style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)' }}
    >
      {/* Top Mesh Header */}
      <div
        className="px-4 pt-3.5 pb-4 text-white"
        style={{
          background: 'var(--vq-grad-mesh)',
          borderRadius: '0 0 var(--vq-r-xl) var(--vq-r-xl)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={goBack}
            className="vq-spring-btn w-8 h-8 flex items-center justify-center"
            style={{
              borderRadius: 'var(--vq-r-sm)',
              background: 'rgb(255 255 255 / .12)',
              color: '#FFFFFF'
            }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <VqBadge tone="accent">Marketplace Customer</VqBadge>
        </div>

        <h1 className="vq-display text-xl text-white">
          {customerAuthTab === 'SIGN_IN'
            ? 'Welcome back to VenQore'
            : 'Create Customer Account'}
        </h1>
        <p className="text-[11.5px] mt-1" style={{ color: '#A8B4AE' }}>
          Sign in to access your Customer Dashboard, saved addresses, and Profile Settings.
        </p>

        <div className="mt-3.5">
          <VqTabs
            darkSurface
            tabs={[
              { value: 'SIGN_IN', label: 'Customer Sign In' },
              { value: 'REGISTER', label: 'New Customer' }
            ]}
            value={customerAuthTab}
            onChange={setCustomerAuthTab}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto vq-no-scrollbar p-4">
        <form onSubmit={handleDirectCustomerAuth} className="space-y-3">
          {customerAuthTab === 'REGISTER' && (
            <div>
              <label
                className="text-xs font-semibold block mb-1"
                style={{ color: 'var(--vq-text-2)' }}
              >
                Full Name
              </label>
              <input
                type="text"
                required
                value={customerUser.name}
                onChange={(e) =>
                  setCustomerUser({ ...customerUser, name: e.target.value })
                }
                className="w-full px-3.5 h-10 text-xs outline-none"
                style={{
                  background: 'var(--vq-surface)',
                  color: 'var(--vq-text)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-md)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              />
            </div>
          )}

          <div>
            <label
              className="text-xs font-semibold block mb-1"
              style={{ color: 'var(--vq-text-2)' }}
            >
              Email Address
            </label>
            <input
              type="email"
              required
              value={customerUser.email}
              onChange={(e) =>
                setCustomerUser({ ...customerUser, email: e.target.value })
              }
              className="w-full px-3.5 h-10 text-xs outline-none"
              style={{
                background: 'var(--vq-surface)',
                color: 'var(--vq-text)',
                border: '1px solid var(--vq-line)',
                borderRadius: 'var(--vq-r-md)',
                boxShadow: 'var(--vq-elev-1)'
              }}
            />
          </div>

          {customerAuthTab === 'REGISTER' && (
            <div>
              <label
                className="text-xs font-semibold block mb-1"
                style={{ color: 'var(--vq-text-2)' }}
              >
                Mobile Number
              </label>
              <input
                type="tel"
                required
                value={customerUser.phone}
                onChange={(e) =>
                  setCustomerUser({ ...customerUser, phone: e.target.value })
                }
                className="w-full px-3.5 h-10 text-xs outline-none"
                style={{
                  background: 'var(--vq-surface)',
                  color: 'var(--vq-text)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-md)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              />
            </div>
          )}

          <div>
            <label
              className="text-xs font-semibold block mb-1"
              style={{ color: 'var(--vq-text-2)' }}
            >
              Password
            </label>
            <input
              type="password"
              required
              defaultValue="••••••••••"
              className="w-full px-3.5 h-10 text-xs outline-none"
              style={{
                background: 'var(--vq-surface)',
                color: 'var(--vq-text)',
                border: '1px solid var(--vq-line)',
                borderRadius: 'var(--vq-r-md)',
                boxShadow: 'var(--vq-elev-1)'
              }}
            />
          </div>

          <button
            type="submit"
            className="vq-spring-btn w-full h-11 font-semibold text-xs flex items-center justify-center gap-2 mt-2"
            style={{
              borderRadius: 'var(--vq-r-full)',
              background: 'var(--vq-accent-fill)',
              color: 'var(--vq-on-accent)',
              boxShadow: 'var(--vq-glow-accent-strong)'
            }}
          >
            <span>Sign In &amp; Open Customer Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );

  const renderCartAuthGateScreen = () => (
    <div
      className="vq-screen-enter flex flex-col h-full"
      style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)' }}
    >
      <div
        className="px-4 pt-3.5 pb-3 flex items-center justify-between"
        style={{
          background: 'var(--vq-surface)',
          borderBottom: '1px solid var(--vq-line)'
        }}
      >
        <button
          type="button"
          onClick={goBack}
          className="vq-spring-btn w-8 h-8 flex items-center justify-center"
          style={{
            borderRadius: 'var(--vq-r-sm)',
            background: 'var(--vq-sunken)',
            color: 'var(--vq-text)'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h1 className="vq-display text-sm">Confirm &amp; Send Order</h1>
          <p className="text-[10.5px]" style={{ color: 'var(--vq-text-3)' }}>
            {customerSignedIn
              ? `Signed in as ${customerUser.name}`
              : 'Delivery details for your order'}
          </p>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto vq-no-scrollbar p-4 space-y-3">
        {/* Order Summary Card */}
        <div
          className="p-3.5 space-y-2"
          style={{
            background: 'var(--vq-surface)',
            border: '1px solid var(--vq-line)',
            borderRadius: 'var(--vq-r-lg)',
            boxShadow: 'var(--vq-elev-1)'
          }}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="vq-eyebrow">Order Summary ({cartTotalCount})</span>
            <span
              className="vq-num text-sm"
              style={{ color: 'var(--vq-accent-text)' }}
            >
              ${(cartSubtotal + 1.5).toFixed(2)}
            </span>
          </div>
          {cartItemsList.map((item) => (
            <div
              key={item.product.id}
              className="flex items-center justify-between text-xs"
              style={{ color: 'var(--vq-text-2)' }}
            >
              <span className="truncate pr-2">
                {item.qty}× {item.product.name}
              </span>
              <span className="vq-num font-semibold">
                ${(item.product.price * item.qty).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <form onSubmit={handlePlaceOrderAndSignIn} className="space-y-2.5">
          {[
            { label: 'Full Name', type: 'text', val: customerUser.name, key: 'name' },
            { label: 'Mobile Number', type: 'tel', val: customerUser.phone, key: 'phone' },
            {
              label: 'Delivery Address',
              type: 'text',
              val: customerUser.address,
              key: 'address'
            }
          ].map((f) => (
            <div key={f.key}>
              <label
                className="text-xs font-semibold block mb-1"
                style={{ color: 'var(--vq-text-2)' }}
              >
                {f.label}
              </label>
              <input
                type={f.type}
                required
                value={f.val}
                onChange={(e) =>
                  setCustomerUser({ ...customerUser, [f.key]: e.target.value })
                }
                className="w-full px-3.5 h-10 text-xs outline-none"
                style={{
                  background: 'var(--vq-surface)',
                  color: 'var(--vq-text)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-md)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              />
            </div>
          ))}

          <button
            type="submit"
            className="vq-spring-btn w-full h-11 font-semibold text-xs flex items-center justify-center gap-2 mt-2"
            style={{
              borderRadius: 'var(--vq-r-full)',
              background: 'var(--vq-accent-fill)',
              color: 'var(--vq-on-accent)',
              boxShadow: 'var(--vq-glow-accent-strong)'
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Send Order Now</span>
          </button>
        </form>
      </div>
    </div>
  );

  const renderCustomerDashboardScreen = () => (
    <div
      className="vq-screen-enter flex flex-col h-full"
      style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)' }}
    >
      {/* Top Dark Mesh Header */}
      <div
        className="px-4 pt-3.5 pb-4 text-white"
        style={{
          background: 'var(--vq-grad-mesh)',
          borderRadius: '0 0 var(--vq-r-xl) var(--vq-r-xl)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => navigateTo('MARKETPLACE')}
            className="vq-spring-btn text-[11px] bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Shops</span>
          </button>

          {/* Dedicated Profile Settings Button */}
          <button
            type="button"
            onClick={() => navigateTo('CUSTOMER_PROFILE_SETTINGS')}
            className="vq-spring-btn px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5"
            style={{
              background: 'rgb(35 196 166 / .22)',
              color: '#93EBD6',
              border: '1px solid rgb(89 219 192 / .4)'
            }}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Profile Settings</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <VqAvatar name={customerUser.name} size={42} bg="var(--vq-teal-400)" />
            <div className="min-w-0">
              <h1 className="vq-display text-base text-white truncate">
                {customerUser.name}
              </h1>
              <p
                className="vq-num text-[11px] truncate"
                style={{ color: '#A8B4AE' }}
              >
                {customerUser.email} · {selectedAreaName}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto vq-no-scrollbar p-4 space-y-3.5">
        {/* If already converted to Store Owner, show quick jump to their ERP */}
        {customerConvertedStore && (
          <div
            className="p-3.5 flex items-center justify-between gap-2"
            style={{
              background: 'var(--vq-accent-quiet)',
              border: '1px solid var(--vq-accent-quiet-line)',
              borderRadius: 'var(--vq-r-lg)'
            }}
          >
            <div className="min-w-0">
              <span className="vq-eyebrow block" style={{ color: 'var(--vq-accent-text)' }}>
                Store Owner Active
              </span>
              <div
                className="vq-display text-xs truncate mt-0.5"
                style={{ color: 'var(--vq-text)' }}
              >
                {customerConvertedStore.name}
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('OWNER_DASHBOARD')}
              className="vq-spring-btn px-3 py-1.5 text-[11px] font-semibold shrink-0 flex items-center gap-1"
              style={{
                borderRadius: 'var(--vq-r-full)',
                background: 'var(--vq-accent-fill)',
                color: 'var(--vq-on-accent)'
              }}
            >
              <span>Open ERP</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Hint pointing to Profile Settings */}
        <div
          onClick={() => navigateTo('CUSTOMER_PROFILE_SETTINGS')}
          className="p-3 flex items-center justify-between cursor-pointer"
          style={{
            background: 'var(--vq-surface)',
            border: '1px solid var(--vq-line)',
            borderRadius: 'var(--vq-r-lg)',
            boxShadow: 'var(--vq-elev-1)'
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--vq-sunken)',
                color: 'var(--vq-text-2)'
              }}
            >
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold">Account &amp; Profile Settings</div>
              <div className="text-[11px]" style={{ color: 'var(--vq-text-3)' }}>
                Manage profile, delivery pin, or make your own store
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--vq-text-3)' }} />
        </div>

        {/* Live Order Tracker */}
        <div>
          <span className="vq-eyebrow block mb-2">My Active &amp; Recent Orders</span>
          <div className="space-y-2">
            {ordersPlaced.map((ord) => (
              <div
                key={ord.id}
                className="p-3.5"
                style={{
                  background: 'var(--vq-surface)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-lg)',
                  boxShadow: 'var(--vq-elev-1)'
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="vq-num text-xs font-bold">{ord.id}</span>
                  <VqBadge tone={ord.tone || 'success'}>{ord.status}</VqBadge>
                </div>
                <div className="vq-display text-xs mt-1">{ord.storeName}</div>
                <div
                  className="flex items-center justify-between text-[11px] mt-1.5"
                  style={{ color: 'var(--vq-text-3)' }}
                >
                  <span>
                    {ord.itemsCount} items · {ord.date}
                  </span>
                  <span
                    className="vq-num font-bold text-xs"
                    style={{ color: 'var(--vq-text)' }}
                  >
                    ${ord.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCustomerProfileSettingsScreen = () => (
    <div
      className="vq-screen-enter flex flex-col h-full"
      style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)' }}
    >
      {/* Top Bar */}
      <div
        className="px-4 pt-3.5 pb-3 flex items-center justify-between"
        style={{
          background: 'var(--vq-surface)',
          borderBottom: '1px solid var(--vq-line)'
        }}
      >
        <button
          type="button"
          onClick={goBack}
          className="vq-spring-btn w-8 h-8 flex items-center justify-center"
          style={{
            borderRadius: 'var(--vq-r-sm)',
            background: 'var(--vq-sunken)',
            color: 'var(--vq-text)'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="text-center">
          <h1 className="vq-display text-sm">Profile Settings</h1>
          <p className="text-[10.5px]" style={{ color: 'var(--vq-text-3)' }}>
            Customer Account &amp; Store Conversion
          </p>
        </div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto vq-no-scrollbar p-4 space-y-3.5">
        {/* Customer Personal Details Card */}
        <div
          className="p-3.5 space-y-2.5"
          style={{
            background: 'var(--vq-surface)',
            border: '1px solid var(--vq-line)',
            borderRadius: 'var(--vq-r-lg)',
            boxShadow: 'var(--vq-elev-1)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="vq-eyebrow">Personal Details</span>
            <VqBadge tone="success">Verified</VqBadge>
          </div>

          {[
            { label: 'Full Name', val: customerUser.name, key: 'name' },
            { label: 'Email', val: customerUser.email, key: 'email' },
            { label: 'Phone', val: customerUser.phone, key: 'phone' },
            { label: 'Default Address', val: customerUser.address, key: 'address' }
          ].map((item) => (
            <div key={item.key}>
              <label
                className="text-[11px] font-semibold block mb-1"
                style={{ color: 'var(--vq-text-2)' }}
              >
                {item.label}
              </label>
              <input
                type="text"
                value={item.val}
                onChange={(e) =>
                  setCustomerUser({ ...customerUser, [item.key]: e.target.value })
                }
                className="w-full px-3 h-9 text-xs outline-none"
                style={{
                  background: 'var(--vq-surface-2)',
                  color: 'var(--vq-text)',
                  border: '1px solid var(--vq-line)',
                  borderRadius: 'var(--vq-r-sm)'
                }}
              />
            </div>
          ))}
        </div>

        {/* EXCLUSIVE STORE CREATION & CONVERSION OPTION (Located ONLY inside Profile Settings!) */}
        <div
          className="p-4 text-white relative overflow-hidden"
          style={{
            borderRadius: 'var(--vq-r-xl)',
            background: 'var(--vq-grad-hero)',
            boxShadow: 'var(--vq-glow-accent-strong)',
            border: '1px solid rgb(89 219 192 / .3)'
          }}
        >
          <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-black/25 px-2.5 py-1 rounded-full mb-2">
            <Sparkles className="w-3 h-3 text-[#FFCD5B]" />
            <span>Profile Settings · Business Upgrade</span>
          </div>

          <h3 className="vq-display text-base leading-snug text-white">
            {customerConvertedStore
              ? 'Your Store Owner ERP & Storefront is Active'
              : 'Make Your Own Store on VenQore'}
          </h3>
          <p className="text-[11.5px] text-white/85 mt-1 leading-relaxed">
            {customerConvertedStore
              ? `You converted your account and launched "${customerConvertedStore.name}". Jump straight to your Store Owner Dashboard.`
              : 'Convert your account to a Store Owner to unlock the full VenQore ERP (Core Ledger, POS, Inventory) and publish your own Storefront on the Marketplace.'}
          </p>

          {customerConvertedStore ? (
            <button
              type="button"
              onClick={() => navigateTo('OWNER_DASHBOARD')}
              className="vq-spring-btn mt-3.5 w-full h-10 px-4 font-bold text-xs flex items-center justify-center gap-2"
              style={{
                borderRadius: 'var(--vq-r-full)',
                background: '#FFFFFF',
                color: '#062421',
                boxShadow: 'var(--vq-elev-2)'
              }}
            >
              <Store className="w-4 h-4 text-[#088975]" />
              <span>Switch to Main Store Owner Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setRegistrationOrigin('CUSTOMER_PROFILE_CONVERSION');
                setStoreBuilderData((prev) => ({
                  ...prev,
                  storeName: `${customerUser.name.split(' ')[0]}'s Fresh Store`
                }));
                setBuilderStep(1);
                navigateTo('STORE_BUILDER');
              }}
              className="vq-spring-btn mt-3.5 w-full h-10 px-4 font-bold text-xs flex items-center justify-center gap-2"
              style={{
                borderRadius: 'var(--vq-r-full)',
                background: '#FFFFFF',
                color: '#062421',
                boxShadow: 'var(--vq-elev-2)'
              }}
            >
              <Store className="w-4 h-4 text-[#088975]" />
              <span>Create Your Own Store (ERP + Storefront)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sign Out of Customer Account */}
        <button
          type="button"
          onClick={() => {
            setCustomerSignedIn(false);
            resetToWelcome();
          }}
          className="vq-spring-btn w-full h-10 text-xs font-semibold flex items-center justify-center gap-1.5"
          style={{
            borderRadius: 'var(--vq-r-full)',
            background: 'var(--vq-sunken)',
            color: 'var(--vq-text-2)',
            border: '1px solid var(--vq-line)'
          }}
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out of Customer Account</span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`vq-sans min-h-screen flex flex-col lg:flex-row items-center justify-center p-3 sm:p-6 gap-7 ${
        vqTheme === 'dark' ? 'vq-theme-dark' : 'vq-theme-light'
      }`}
      style={{ background: 'var(--vq-bg)', color: 'var(--vq-text)' }}
    >
      <style>{VQ_CSS}</style>

      {/* Left / Top VenQore v6 Architecture Inspector & Quick-Jump Panel */}
      <div
        className="w-full max-w-md lg:max-w-[360px] p-5 space-y-4"
        style={{
          background: 'var(--vq-surface)',
          border: '1px solid var(--vq-line)',
          borderRadius: 'var(--vq-r-xl)',
          boxShadow: 'var(--vq-elev-2)'
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={VQ_LOGO} alt="VenQore" className="w-8 h-8 rounded-lg" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="vq-display text-base">VenQore</h2>
                <VqBadge tone="accent" dot={false}>
                  v6 Qore
                </VqBadge>
              </div>
              <p className="text-[11.5px]" style={{ color: 'var(--vq-text-3)' }}>
                Single-APK Flutter Flow Prototype
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setVqTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            className="vq-spring-btn w-9 h-9 flex items-center justify-center"
            style={{
              borderRadius: 'var(--vq-r-md)',
              background: 'var(--vq-surface-2)',
              color: 'var(--vq-text-2)',
              border: '1px solid var(--vq-line)',
              boxShadow: 'var(--vq-elev-1)'
            }}
            title="Toggle Light / Dark Theme"
          >
            {vqTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-[#59DBC0]" />
            ) : (
              <Sun className="w-4 h-4 text-[#088975]" />
            )}
          </button>
        </div>

        {/* Workflow Summary Box */}
        <div
          className="p-3.5 space-y-2 text-xs"
          style={{
            background: 'var(--vq-surface-2)',
            border: '1px solid var(--vq-line-soft)',
            borderRadius: 'var(--vq-r-lg)'
          }}
        >
          <div
            className="font-semibold flex items-center gap-1.5"
            style={{ color: 'var(--vq-accent-text)' }}
          >
            <Check className="w-4 h-4" />
            <span>Updated Customer &amp; Store Flow:</span>
          </div>
          <ul
            className="space-y-1.5 text-[11.5px] leading-relaxed"
            style={{ color: 'var(--vq-text-2)' }}
          >
            <li>
              • <strong>Direct Customer Sign-In:</strong> Customers can sign in anytime from the Welcome screen or Marketplace top bar (not forced to wait until sending an order).
            </li>
            <li>
              • <strong>Profile Settings Conversion:</strong> Inside the <em>Customer Dashboard</em>, tapping <strong>Profile Settings</strong> reveals the exclusive <em>Create Your Own Store</em> button.
            </li>
            <li>
              • <strong>Full ERP + Storefront:</strong> Converting upgrades the customer into the <strong>Store Owner Dashboard</strong> with Qore ERP &amp; Live Storefront Catalog management.
            </li>
          </ul>
        </div>

        {/* Quick Jump State Switcher */}
        <div className="space-y-2">
          <span className="vq-eyebrow block">Quick-Jump to Any Screen</span>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { id: 'WELCOME', label: '01. Split Entry', action: resetToWelcome },
              {
                id: 'BUSINESS_AUTH',
                label: '02. Partner Sign-In',
                action: () => {
                  setBusinessAuthMode('SIGN_IN');
                  navigateTo('BUSINESS_AUTH');
                }
              },
              {
                id: 'CUSTOMER_AUTH',
                label: '03. Customer Sign-In',
                action: () => {
                  setCustomerAuthTab('SIGN_IN');
                  navigateTo('CUSTOMER_AUTH');
                }
              },
              {
                id: 'MARKETPLACE',
                label: '04. Storefronts',
                action: () => navigateTo('MARKETPLACE')
              },
              {
                id: 'CUSTOMER_DASHBOARD',
                label: '05. Customer Dash',
                action: () => {
                  setCustomerSignedIn(true);
                  navigateTo('CUSTOMER_DASHBOARD');
                }
              },
              {
                id: 'CUSTOMER_PROFILE_SETTINGS',
                label: '06. Profile Settings',
                action: () => {
                  setCustomerSignedIn(true);
                  navigateTo('CUSTOMER_PROFILE_SETTINGS');
                }
              },
              {
                id: 'STORE_BUILDER',
                label: '07. AI Store Builder',
                action: () => {
                  setRegistrationOrigin('CUSTOMER_PROFILE_CONVERSION');
                  navigateTo('STORE_BUILDER');
                }
              },
              {
                id: 'OWNER_DASHBOARD',
                label: '08. Owner ERP & Store',
                action: () => navigateTo('OWNER_DASHBOARD')
              }
            ].map((item) => {
              const active =
                screen === item.id ||
                (item.id === 'OWNER_DASHBOARD' &&
                  (screen === 'EMPLOYEE_DASHBOARD' ||
                    screen === 'RIDER_DASHBOARD'));
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="vq-spring-btn p-2.5 text-left font-semibold truncate"
                  style={{
                    borderRadius: 'var(--vq-r-md)',
                    background: active
                      ? 'var(--vq-accent-quiet)'
                      : 'var(--vq-surface-2)',
                    color: active
                      ? 'var(--vq-accent-text)'
                      : 'var(--vq-text-2)',
                    border: `1px solid ${
                      active
                        ? 'var(--vq-accent-quiet-line)'
                        : 'var(--vq-line)'
                    }`
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Center Titanium Mobile Phone Viewport */}
      <div
        className="w-full max-w-[392px] h-[796px] p-3 relative flex flex-col select-none"
        style={{
          background: 'linear-gradient(145deg, #1E2824 0%, #090E0C 100%)',
          borderRadius: 52,
          border: '2px solid #2E3B36',
          boxShadow:
            '0 30px 70px -15px rgba(6, 10, 9, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
        }}
      >
        {/* Inner Obsidian Bezel */}
        <div
          className="flex-1 flex flex-col overflow-hidden relative"
          style={{
            borderRadius: 40,
            background: 'var(--vq-bg)',
            border: '4px solid #060A09'
          }}
        >
          {/* Phone Status Bar + Dynamic Island */}
          <div
            className="vq-num flex items-center justify-between px-5 pt-2 pb-1.5 text-[11px] font-semibold z-20"
            style={{
              background: 'var(--vq-surface)',
              color: 'var(--vq-text)'
            }}
          >
            <span>9:41</span>
            <div
              className="w-24 h-5 rounded-full flex items-center justify-between px-2.5"
              style={{ background: '#060A09' }}
            >
              <span className="w-2 h-2 rounded-full bg-[#23C4A6] animate-pulse" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#141B19] border border-white/10" />
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span>5G</span>
              <div
                className="w-5 h-2.5 rounded-sm p-0.5 flex items-center"
                style={{ border: '1px solid currentColor' }}
              >
                <div
                  className="h-full w-full rounded-[1px]"
                  style={{ background: 'var(--vq-accent)' }}
                />
              </div>
            </div>
          </div>

          {/* Active Flutter Screen Container */}
          <div className="flex-1 overflow-hidden relative">
            {screen === 'WELCOME' && renderWelcomeScreen()}
            {screen === 'BUSINESS_AUTH' && renderBusinessAuthScreen()}
            {screen === 'STORE_BUILDER' && renderStoreBuilderScreen()}
            {(screen === 'OWNER_DASHBOARD' ||
              screen === 'EMPLOYEE_DASHBOARD' ||
              screen === 'RIDER_DASHBOARD') &&
              renderRoleDashboardScreen()}
            {screen === 'CUSTOMER_LOCATION' && renderCustomerLocationScreen()}
            {screen === 'MARKETPLACE' && renderMarketplaceScreen()}
            {screen === 'CUSTOMER_AUTH' && renderCustomerAuthScreen()}
            {screen === 'CART_AUTH_GATE' && renderCartAuthGateScreen()}
            {screen === 'CUSTOMER_DASHBOARD' && renderCustomerDashboardScreen()}
            {screen === 'CUSTOMER_PROFILE_SETTINGS' &&
              renderCustomerProfileSettingsScreen()}
          </div>

          {/* Bottom Home Indicator Bar */}
          <div
            className="py-2 flex justify-center"
            style={{ background: 'var(--vq-surface)' }}
          >
            <div
              className="w-32 h-1 rounded-full"
              style={{ background: 'var(--vq-line-strong)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}