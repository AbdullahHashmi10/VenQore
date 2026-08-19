(function(){
const { Button, Badge, Chip, ThemeToggle, Card } = window.VenQoreDesignSystem_76c34c;

function Nav() {
  const links = ["Product", "Blueprint", "Core Ledger", "Pricing", "Docs"];
  return (
    <nav style={{ position: "sticky", top: 0, zIndex: 200, display: "flex", alignItems: "center", gap: 26, padding: "16px 34px", background: "rgb(6 36 33 / .55)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgb(255 255 255 / .1)" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="../../assets/logo-mark.png" alt="" width="28" height="28" />
        <span style={{ font: "600 20px/1 var(--vq-font-display)", letterSpacing: "-0.03em", color: "#EAFBF5" }}>VenQore</span>
      </span>
      <span style={{ display: "flex", gap: 22, marginLeft: 18 }}>
        {links.map(l => <a key={l} href="#" style={{ font: "500 14px/1 var(--vq-font-sans)", color: "rgb(234 251 245 / .74)", textDecoration: "none" }}>{l}</a>)}
      </span>
      <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        <a href="#" style={{ font: "600 14px/1 var(--vq-font-sans)", color: "#EAFBF5", textDecoration: "none" }}>Sign in</a>
        <Button size="sm">Start building</Button>
      </span>
    </nav>
  );
}

function Hero() {
  const [prompt, setPrompt] = React.useState("");
  const examples = ["Two pharmacy branches", "Wholesale + 3 sales reps", "Restaurant with central kitchen", "Online store on Amazon & Woo"];
  return (
    <header style={{ position: "relative", background: "var(--vq-grad-hero)", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "var(--vq-grad-spot)", animation: "vqDrift var(--vq-dur-amb) ease-in-out infinite alternate" }} />
      <style>{"@keyframes vqDrift{from{transform:translate3d(-2%,-1%,0) scale(1.04)}to{transform:translate3d(3%,2%,0) scale(1.12)}}@keyframes vqRise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}"}</style>
      <div style={{ position: "relative" }}>
        <Nav />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "86px 24px 120px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
          <span style={{ animation: "vqRise 620ms var(--vq-ease-out) both" }}>
            <Badge tone="accent" style={{ background: "rgb(255 255 255 / .14)", color: "#C6F5E9", borderColor: "rgb(255 255 255 / .22)" }}>240+ features · one source of truth</Badge>
          </span>
          <h1 style={{ margin: 0, font: "600 var(--vq-fs-hero)/var(--vq-lh-hero) var(--vq-font-display)", letterSpacing: "var(--vq-ls-hero)", color: "#F4FFFB", animation: "vqRise 720ms var(--vq-ease-out) 80ms both" }}>
            Tell us your business.<br />We&rsquo;ll build the <span style={{ color: "#93EBD6" }}>system</span>.
          </h1>
          <p style={{ margin: 0, maxWidth: 640, font: "400 var(--vq-fs-lede)/var(--vq-lh-lede) var(--vq-font-sans)", color: "rgb(234 251 245 / .78)", animation: "vqRise 760ms var(--vq-ease-out) 140ms both" }}>
            Describe how you actually work. VenQore assembles the ERP that runs it — and every number it produces is backed by double-entry accounting.
          </p>
          <div style={{ width: "min(680px, 100%)", display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 8px 22px", background: "rgb(255 255 255 / .1)", border: "1px solid rgb(255 255 255 / .24)", borderRadius: "var(--vq-r-full)", backdropFilter: "blur(10px)", animation: "vqRise 800ms var(--vq-ease-out) 200ms both" }}>
            <input value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe your business…"
              style={{ flex: 1, minWidth: 0, background: "transparent", border: 0, outline: 0, color: "#F4FFFB", font: "500 17px/1 var(--vq-font-sans)" }} />
            <Button size="lg" iconAfter={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M5 12h13m-5-6 6 6-6 6"/></svg>}>Build it</Button>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", animation: "vqRise 840ms var(--vq-ease-out) 260ms both" }}>
            {examples.map(e => <Chip key={e} onClick={() => setPrompt(e)} selected={prompt === e}>{e}</Chip>)}
          </div>
          <span style={{ font: "500 12.5px/1 var(--vq-font-sans)", color: "rgb(234 251 245 / .6)" }}>14-day trial · no card · live in 15 minutes</span>
        </div>
      </div>
    </header>
  );
}
Object.assign(window, { Hero, MarketingNav: Nav });
})();
