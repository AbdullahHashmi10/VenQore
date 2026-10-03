import React from 'react';

/* Small pictograms for the chart-family picker. Drawn with currentColor so
   they follow the selected / disabled state of the tile they sit in. */
export default function FamilyGlyph({ family, size = 30 }) {
  const w = size, h = Math.round(size * 0.7);
  const common = { width: w, height: h, viewBox: '0 0 30 21', fill: 'none', 'aria-hidden': true, className: 'vqe-glyph' };
  switch (family) {
    case 'number':
      return (
        <svg {...common}>
          <rect x="2" y="4" width="15" height="7" rx="2" fill="currentColor" />
          <rect x="2" y="14" width="10" height="3" rx="1.5" fill="currentColor" opacity=".45" />
          <path d="m21 13 3-4 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'area':
      return (
        <svg {...common}>
          <path d="M2 17 L8 10 L13 13 L20 5 L28 8 L28 19 L2 19Z" fill="currentColor" opacity=".3" />
          <path d="M2 17 L8 10 L13 13 L20 5 L28 8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
      );
    case 'line':
      return (
        <svg {...common}>
          <path d="M2 16 C6 16 7 8 11 9 S16 15 20 11 S25 4 28 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="28" cy="5" r="2" fill="currentColor" />
        </svg>
      );
    case 'bar':
      return (
        <svg {...common}>
          {[[3, 11], [9, 6], [15, 9], [21, 3]].map(([x, y]) => <rect key={x} x={x} y={y} width="4.5" height={19 - y} rx="1.4" fill="currentColor" />)}
        </svg>
      );
    case 'composed':
      return (
        <svg {...common}>
          {[[3, 12], [9, 9], [15, 11], [21, 7]].map(([x, y]) => <rect key={x} x={x} y={y} width="4.5" height={19 - y} rx="1.4" fill="currentColor" opacity=".45" />)}
          <path d="M3 9 L11 5 L17 8 L27 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'pie':
      return (
        <svg {...common}>
          <circle cx="15" cy="10.5" r="7.5" stroke="currentColor" strokeWidth="4" opacity=".35" />
          <path d="M15 3 A7.5 7.5 0 0 1 21.5 14.2" stroke="currentColor" strokeWidth="4" />
        </svg>
      );
    case 'ring':
      return (
        <svg {...common}>
          <circle cx="15" cy="10.5" r="7.5" stroke="currentColor" strokeWidth="2.6" opacity=".22" />
          <path d="M15 3 A7.5 7.5 0 1 1 7.6 12" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      );
    case 'gauge':
      return (
        <svg {...common}>
          <path d="M5 17 A10 10 0 0 1 25 17" stroke="currentColor" strokeWidth="3" opacity=".25" strokeLinecap="round" />
          <path d="M5 17 A10 10 0 0 1 19 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <path d="M15 17 L19 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case 'radar':
      return (
        <svg {...common}>
          <path d="M15 2 L24 8.5 L21 18 L9 18 L6 8.5Z" stroke="currentColor" strokeWidth="1" opacity=".4" />
          <path d="M15 5 L21 9.5 L18.5 15 L11 16 L9 9Z" fill="currentColor" opacity=".55" />
        </svg>
      );
    case 'heatmap':
      return (
        <svg {...common}>
          {[0, 1, 2].map(r => [0, 1, 2, 3, 4].map(c => (
            <rect key={`${r}${c}`} x={3 + c * 5} y={2 + r * 6} width="4" height="5" rx="1"
              fill="currentColor" opacity={[0.25, 0.6, 1, 0.4, 0.8][(r + c) % 5]} />
          )))}
        </svg>
      );
    case 'funnel':
      return (
        <svg {...common}>
          {[[2, 26], [5, 20], [8, 14], [11, 8]].map(([x, w], i) => (
            <rect key={i} x={15 - w / 2} y={2 + i * 5} width={w} height="4" rx="1.5" fill="currentColor" opacity={1 - i * 0.18} />
          ))}
        </svg>
      );
    case 'scatter':
      return (
        <svg {...common}>
          {[[5, 15], [9, 9], [13, 13], [17, 6], [21, 11], [25, 4]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2" fill="currentColor" />)}
        </svg>
      );
    case 'sankey':
      return (
        <svg {...common}>
          <rect x="2" y="3" width="3" height="15" rx="1" fill="currentColor" />
          <rect x="25" y="3" width="3" height="6" rx="1" fill="currentColor" />
          <rect x="25" y="12" width="3" height="6" rx="1" fill="currentColor" />
          <path d="M5 5 C15 5 15 5 25 5 M5 14 C15 14 15 15 25 15" stroke="currentColor" strokeWidth="4" opacity=".35" />
        </svg>
      );
    case 'sunburst':
      return (
        <svg {...common}>
          <circle cx="15" cy="10.5" r="3" fill="currentColor" />
          <circle cx="15" cy="10.5" r="7.5" stroke="currentColor" strokeWidth="3.5" strokeDasharray="12 6 8 5" opacity=".45" />
        </svg>
      );
    case 'live':
      return (
        <svg {...common}>
          <path d="M2 14 L8 11 L13 13 L19 7 L25 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="25" cy="8" r="3" fill="currentColor" opacity=".3" />
          <circle cx="25" cy="8" r="1.6" fill="currentColor" />
        </svg>
      );
    case 'records':
      return (
        <svg {...common}>
          {[4, 10, 16].map((y, i) => (
            <g key={y}>
              <circle cx="4" cy={y} r="1.6" fill="currentColor" />
              <rect x="8" y={y - 1.5} width={[18, 13, 9][i]} height="3" rx="1.5" fill="currentColor" opacity=".6" />
            </g>
          ))}
        </svg>
      );
    case 'status':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="24" height="11" rx="5.5" fill="currentColor" opacity=".2" />
          <path d="m9 10.5 2.5 2.5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return <svg {...common}><rect x="4" y="4" width="22" height="13" rx="3" stroke="currentColor" /></svg>;
  }
}

/** A w×h card drawn inside the 12×6 board it lives on — chosen by eye. */
export function SpanGlyph({ w, h, full }) {
  const BW = 46, BH = 28, cols = 12, rows = 6;
  const cw = (BW - 2) / cols, rh = (BH - 2) / rows;
  const fw = Math.max(3, Math.min(BW - 2, (full ? cols : w) * cw));
  const fh = Math.max(3, Math.min(BH - 2, Math.min(h, rows) * rh));
  return (
    <svg className="vqe-span-glyph" width={BW} height={BH} viewBox={`0 0 ${BW} ${BH}`} aria-hidden="true">
      <rect x=".5" y=".5" width={BW - 1} height={BH - 1} rx="4" fill="none" stroke="currentColor" strokeOpacity=".22" strokeDasharray="2 2" />
      <rect x="1" y="1" width={fw} height={fh} rx="3" fill="currentColor" fillOpacity=".88" />
    </svg>
  );
}
