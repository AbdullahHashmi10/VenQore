(function(){
const { Card, Button, Badge, StatCard, AreaChart, BarMeter, ProgressRing, Alert, Chip, DataTable, ActivityRow, Tabs } = window.VenQoreDesignSystem_76c34c;

function Band({ children, alt = false, style }) {
  return (
    <section style={{ background: alt ? "var(--vq-bg-alt)" : "var(--vq-bg)", padding: "var(--vq-section-y) 24px", ...style }}>
      <div style={{ maxWidth: "var(--vq-page-max)", margin: "0 auto", display: "flex", flexDirection: "column", gap: 40 }}>{children}</div>
    </section>
  );
}

function Head({ eyebrow, title, body, center = true }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: center ? "center" : "flex-start", textAlign: center ? "center" : "left" }}>
      <span className="vq-eyebrow">{eyebrow}</span>
      <h2 style={{ margin: 0, font: "600 var(--vq-fs-display)/var(--vq-lh-display) var(--vq-font-display)", letterSpacing: "var(--vq-ls-display)", maxWidth: 760 }}>{title}</h2>
      {body ? <p style={{ margin: 0, maxWidth: 620, font: "400 var(--vq-fs-lede)/var(--vq-lh-lede) var(--vq-font-sans)", color: "var(--vq-text-2)" }}>{body}</p> : null}
    </div>
  );
}

/* The product screenshot, framed. */
function ProductPreview() {
  return (
    <Card pad={0} radius="var(--vq-r-2xl)" style={{ overflow: "hidden", boxShadow: "var(--vq-elev-3)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 18px", borderBottom: "1px solid var(--vq-line)", background: "var(--vq-surface-2)" }}>
        <span style={{ display: "flex", gap: 6 }}>
          {["#FF8A6B", "#FFCD5B", "#A9E34B"].map(c => <span key={c} style={{ width: 10, height: 10, borderRadius: 999, background: c }} />)}
        </span>
        <span className="vq-num" style={{ margin: "0 auto", font: "500 12px/1 var(--vq-font-numeric)", color: "var(--vq-text-3)" }}>app.venqore.com/dashboard</span>
        <Badge tone="success">Live sync</Badge>
      </div>
      <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16, background: "var(--vq-bg)" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
          <StatCard tone="accent" label="Net balance" value="6,636,549" unit="Rs" delta="8.2%" caption="vs last month" />
          <StatCard label="Profit margin" value="54" unit="%" delta="2.1%" caption="net / revenue" />
          <StatCard label="Overdue" value="10,260" unit="Rs" delta="3.1%" deltaTone="down" caption="receivables" />
          <StatCard label="Stock health" value="87" unit="%" caption="1,204 SKUs" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, alignItems: "start" }}>
          <Card eyebrow="Past 6 months" title="Purchases trend">
            <AreaChart data={[700, 1400, 2100, 2400, 2600, 5200]} labels={["Mar", "Apr", "May", "Jun", "Jul", "Aug"]} height={170} />
          </Card>
          <Card title="Alerts">
            <Alert tone="warning">13% inventory running low</Alert>
            <Alert tone="success">Profit: Rs 53,544.70 today</Alert>
            <ActivityRow tone="in" title="Sale #SAL-R1-160826" meta="1 day ago" amount="+Rs 1,244.00" />
          </Card>
        </div>
      </div>
    </Card>
  );
}

const STEPS = [
  { n: "01", t: "Describe it", b: "Plain sentences about how your business runs. Not a 40-field wizard." },
  { n: "02", t: "Review the blueprint", b: "Modules, fields in your words, tax rules, roles, approvals. Every line editable." },
  { n: "03", t: "Approve, and it exists", b: "Not a demo — your live system, your data model, ready for the first transaction." },
];

const FEATURES = [
  { t: "Core Ledger", b: "Every module posts through one double-entry engine. Debits equal credits or nothing posts.", tone: "accent", wide: true },
  { t: "SmartCapture", b: "The order arrived as a voice note. It leaves as a sale." },
  { t: "VenSynQ", b: "Sell in five places. Count stock once." },
  { t: "Vena", b: "Ask your business a question, in plain language." },
  { t: "Signals", b: "Know a customer is leaving while you can still keep them.", tone: "ink" },
];

function Sections() {
  const [plan, setPlan] = React.useState("Monthly");
  return (
    <>
      <Band style={{ paddingTop: 0, marginTop: -78, background: "transparent" }}>
        <ProductPreview />
      </Band>

      <Band>
        <Head eyebrow="The mechanism" title="Three steps, then it is running." body="No discovery call. No partner firm. No month four." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--vq-gutter)" }}>
          {STEPS.map(s => (
            <Card key={s.n} lift>
              <span className="vq-num" style={{ font: "600 28px/1 var(--vq-font-numeric)", color: "var(--vq-accent-text)", letterSpacing: "-0.03em" }}>{s.n}</span>
              <span style={{ font: "600 21px/1.3 var(--vq-font-display)", letterSpacing: "-0.02em" }}>{s.t}</span>
              <p style={{ margin: 0, font: "500 14.5px/1.6 var(--vq-font-sans)", color: "var(--vq-text-2)" }}>{s.b}</p>
            </Card>
          ))}
        </div>
      </Band>

      <Band alt>
        <Head eyebrow="The moat" title="AI decides what your system looks like. It never decides what your numbers say." center={false} />
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gridAutoRows: "minmax(150px, auto)", gap: "var(--vq-gutter)" }}>
          {FEATURES.map(f => (
            <Card key={f.t} tone={f.tone === "accent" ? "accent" : f.tone === "ink" ? "ink" : "surface"} lift
              style={f.wide ? { gridColumn: "span 2" } : undefined}>
              <span style={{ font: "600 22px/1.25 var(--vq-font-display)", letterSpacing: "-0.024em" }}>{f.t}</span>
              <p style={{ margin: 0, font: "500 14.5px/1.6 var(--vq-font-sans)", color: f.tone ? "rgb(255 255 255 / .82)" : "var(--vq-text-2)" }}>{f.b}</p>
            </Card>
          ))}
        </div>
      </Band>

      <Band>
        <Head eyebrow="Proof, not logos" title="Where a normal site puts a logo wall, we put a correctness wall." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--vq-gutter)" }}>
          <StatCard label="Correctness checks" value="7" unit="independent" caption="on the accounting engine" />
          <StatCard label="Automated tests" value="73" unit="tests" caption="across 20 modules, every release" />
          <StatCard label="Live businesses" value="2" unit="daily" caption="including the shop it was built for" />
          <StatCard tone="accent" label="Features in the box" value="240" unit="+" caption="no module fees" />
        </div>
      </Band>

      <Band alt>
        <Head eyebrow="Pricing" title="$36 a month. No implementation fee." body="Every module, every feature, every user role. The implementation was the expensive part everywhere else." />
        <div style={{ display: "flex", justifyContent: "center" }}><Tabs tabs={["Monthly", "Yearly"]} value={plan} onChange={setPlan} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "var(--vq-gutter)", alignItems: "stretch" }}>
          {[
            { n: "Starter", p: plan === "Monthly" ? "$36" : "$29", b: "One branch, two users", cta: "secondary" },
            { n: "Business", p: plan === "Monthly" ? "$79" : "$64", b: "Up to five branches, ten users", cta: "primary", best: true },
            { n: "Scale", p: "Talk to us", b: "Multi-company, custom modules", cta: "secondary" },
          ].map(t => (
            <Card key={t.n} tone={t.best ? "accent" : "surface"} lift pad={24}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ font: "600 20px/1 var(--vq-font-display)", letterSpacing: "-0.02em" }}>{t.n}</span>
                {t.best ? <Badge tone="neutral" dot={false} style={{ background: "rgb(255 255 255 / .2)", color: "#fff", borderColor: "rgb(255 255 255 / .3)" }}>Most picked</Badge> : null}
              </div>
              <div className="vq-num" style={{ font: "600 42px/1 var(--vq-font-numeric)", letterSpacing: "-0.03em" }}>{t.p}
                {t.p.startsWith("$") ? <span style={{ font: "500 14px/1 var(--vq-font-sans)", opacity: .7 }}> /mo</span> : null}</div>
              <p style={{ margin: 0, font: "500 14px/1.55 var(--vq-font-sans)", color: t.best ? "rgb(255 255 255 / .84)" : "var(--vq-text-2)" }}>{t.b}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                {["Core Ledger included", "Unlimited transactions", "Export your data any time"].map(f => (
                  <span key={f} style={{ display: "flex", gap: 8, alignItems: "center", font: "500 13.5px/1.4 var(--vq-font-sans)", color: t.best ? "rgb(255 255 255 / .9)" : "var(--vq-text-2)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.best ? "#fff" : "var(--vq-accent)"} strokeWidth="3" strokeLinecap="round"><path d="m5 13 4.5 4.5L19 7"/></svg>{f}
                  </span>
                ))}
              </div>
              <Button variant={t.best ? "secondary" : "soft"} full style={{ marginTop: "auto" }}>{t.p === "Talk to us" ? "Book a call" : "Start free trial"}</Button>
            </Card>
          ))}
        </div>
      </Band>

      <section style={{ padding: "var(--vq-section-y) 24px" }}>
        <div style={{ maxWidth: "var(--vq-page-max)", margin: "0 auto", padding: "56px 44px", borderRadius: "var(--vq-r-2xl)", background: "var(--vq-grad-mint)", boxShadow: "var(--vq-glow-accent-strong)", color: "#fff", display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h2 style={{ margin: 0, font: "600 40px/1.08 var(--vq-font-display)", letterSpacing: "-0.03em" }}>Describe your business. See the blueprint in a minute.</h2>
            <p style={{ margin: "12px 0 0", font: "400 17px/1.55 var(--vq-font-sans)", color: "rgb(255 255 255 / .84)" }}>Nothing posts to a ledger until you approve it.</p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <Button variant="secondary" size="lg">Start free trial</Button>
            <Button variant="ghost" size="lg" style={{ color: "#fff" }}>Book a call</Button>
          </div>
        </div>
      </section>

      <footer style={{ background: "var(--vq-ink-950)", color: "rgb(237 242 239 / .7)", padding: "56px 24px" }}>
        <div style={{ maxWidth: "var(--vq-page-max)", margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 32 }}>
          <div>
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="../../assets/logo-mark.png" alt="" width="26" height="26" />
              <span style={{ font: "600 19px/1 var(--vq-font-display)", letterSpacing: "-0.03em", color: "#EDF2EF" }}>VenQore</span>
            </span>
            <p style={{ margin: "14px 0 0", font: "500 13.5px/1.6 var(--vq-font-sans)", maxWidth: 260 }}>The AI ERP builder. Built by one person, running two real shops.</p>
          </div>
          {[["Product", ["Blueprint", "Core Ledger", "SmartCapture", "VenSynQ"]], ["Company", ["About", "Changelog", "Contact"]], ["Legal", ["Terms", "Privacy", "Security"]]].map(([h, items]) => (
            <div key={h} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="vq-eyebrow" style={{ color: "rgb(237 242 239 / .5)" }}>{h}</span>
              {items.map(i => <a key={i} href="#" style={{ font: "500 13.5px/1 var(--vq-font-sans)", color: "rgb(237 242 239 / .72)", textDecoration: "none" }}>{i}</a>)}
            </div>
          ))}
        </div>
      </footer>
    </>
  );
}
Object.assign(window, { MarketingSections: Sections });
})();
