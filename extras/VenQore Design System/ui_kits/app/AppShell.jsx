(function(){
const { SidebarItem, SearchField, IconButton, Avatar, ThemeToggle, Button, Badge } = window.VenQoreDesignSystem_76c34c;

const G = (d, sw = 1.9) => React.createElement("svg", { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: sw, strokeLinecap: "round", strokeLinejoin: "round" }, d);
const ICONS = {
  dash: G(<><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>),
  blueprint: G(<><path d="M12 3v18M3 12h18"/><rect x="3" y="3" width="18" height="18" rx="4"/></>),
  sales: G(<><path d="M3 5h2l2.4 11h11L21 8H6"/><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></>),
  stock: G(<><path d="M4 17V7l8-4 8 4v10l-8 4-8-4Z"/><path d="m4 7 8 4 8-4M12 21V11"/></>),
  ledger: G(<><path d="M5 4h11l3 3v13H5z"/><path d="M8 9h8M8 13h8M8 17h5"/></>),
  parties: G(<><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 11a3 3 0 1 0 0-6M18 20c0-2.4-1-4.5-2.6-5.7"/></>),
  reports: G(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>),
  bell: G(<><path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7"/><path d="M10.5 20a2 2 0 0 0 3 0"/></>),
  spark: G(<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></>),
};

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: ICONS.dash },
  { id: "blueprint", label: "Blueprint", icon: ICONS.blueprint, badge: "AI" },
  { id: "sales", label: "Sales & POS", icon: ICONS.sales, badge: 12 },
  { id: "inventory", label: "Inventory", icon: ICONS.stock },
  { id: "ledger", label: "Core Ledger", icon: ICONS.ledger },
  { id: "parties", label: "Customers", icon: ICONS.parties },
  { id: "reports", label: "Reports", icon: ICONS.reports },
];

function AppShell({ screen, onNavigate, children, title, subtitle, actions }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "var(--vq-rail-w) 1fr", minHeight: "100vh", background: "var(--vq-bg)" }}>
      <aside style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", gap: 18, padding: 14, borderRight: "1px solid var(--vq-line)", background: "var(--vq-surface)", zIndex: 300 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px" }}>
          <img src="../../assets/logo-mark.png" alt="" width="28" height="28" />
          <span style={{ font: "600 19px/1 var(--vq-font-display)", letterSpacing: "-0.03em" }}>VenQore</span>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span className="vq-eyebrow" style={{ padding: "6px 10px 2px" }}>Operate</span>
          {NAV.map(n => (
            <SidebarItem key={n.id} icon={n.icon} label={n.label} badge={n.badge}
              active={screen === n.id} onClick={() => onNavigate(n.id)} />
          ))}
        </nav>
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ padding: 14, borderRadius: "var(--vq-r-lg)", background: "var(--vq-grad-mint)", color: "#fff", boxShadow: "var(--vq-glow-accent)" }}>
            <div className="vq-eyebrow" style={{ color: "rgb(255 255 255 / .78)" }}>Trial</div>
            <div style={{ font: "600 15px/1.3 var(--vq-font-display)", marginTop: 4 }}>3 days left</div>
            <div style={{ font: "500 12px/1.45 var(--vq-font-sans)", color: "rgb(255 255 255 / .82)", marginTop: 4 }}>Keep everything you've built.</div>
            <Button variant="secondary" size="sm" full style={{ marginTop: 12 }}>Choose a plan</Button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 6px" }}>
            <Avatar name="Ahmad Raza" ring />
            <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
              <span style={{ font: "600 13px/1.3 var(--vq-font-sans)" }}>Ahmad Raza</span>
              <span style={{ font: "500 11.5px/1.3 var(--vq-font-sans)", color: "var(--vq-text-3)" }}>Rana Traders</span>
            </span>
            <ThemeToggle size={34} style={{ marginLeft: "auto" }} />
          </div>
        </div>
      </aside>

      <main style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header style={{ position: "sticky", top: 0, zIndex: 200, display: "flex", alignItems: "center", gap: 16, height: "var(--vq-topbar-h)", padding: "0 24px", background: "var(--vq-glass)", backdropFilter: "blur(var(--vq-glass-blur))", borderBottom: "1px solid var(--vq-line)" }}>
          <SearchField width={300} />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <Button variant="soft" size="sm" icon={ICONS.spark}>Ask Vena</Button>
            <Badge tone="success">Live sync</Badge>
            <IconButton label="Notifications">{ICONS.bell}</IconButton>
          </div>
        </header>
        <div style={{ padding: "26px 24px 40px", display: "flex", flexDirection: "column", gap: "var(--vq-gutter)", maxWidth: 1320 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span className="vq-eyebrow">{subtitle}</span>
              <h1 style={{ font: "600 var(--vq-fs-h1)/var(--vq-lh-h1) var(--vq-font-display)", letterSpacing: "var(--vq-ls-h1)", margin: 0 }}>{title}</h1>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>{actions}</div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

Object.assign(window, { AppShell, ICONS, NAV });

})();
