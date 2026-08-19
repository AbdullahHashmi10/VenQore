(function(){
const { Card, Button, Input, Badge, Chip, Checkbox, Switch, Toast, EmptyState, Alert } = window.VenQoreDesignSystem_76c34c;

const MODULES = [
  { name: "Point of sale", why: "You said you ring up walk-in sales.", on: true },
  { name: "Batch & expiry tracking", why: "Pharmacy stock needs expiry dates.", on: true },
  { name: "Supplier credit — 30 days", why: "Four distributors on credit terms.", on: true },
  { name: "Core Ledger — double entry", why: "Always on. Every module posts through it.", on: true, locked: true },
  { name: "Payroll", why: "You have 6 staff on fixed salaries.", on: true },
  { name: "Manufacturing / BOM", why: "Nothing you described is assembled.", on: false },
];

function BlueprintScreen() {
  const [prompt, setPrompt] = React.useState("Two pharmacy branches, 30-day credit from four distributors, batch & expiry tracking, trial balance monthly.");
  const [state, setState] = React.useState("draft");
  const [mods, setMods] = React.useState(MODULES);
  const toggle = i => setMods(m => m.map((x, j) => (j === i && !x.locked ? { ...x, on: !x.on } : x)));
  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: "var(--vq-gutter)", alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--vq-gutter)" }}>
        <Card tone="accent" eyebrow="Step 1 · describe" title="Tell us how you actually work" pad={24}>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={3}
            style={{ width: "100%", boxSizing: "border-box", resize: "none", background: "rgb(255 255 255 / .16)", border: "1px solid rgb(255 255 255 / .3)", borderRadius: "var(--vq-r-md)", padding: 14, color: "#fff", font: "500 15px/1.55 var(--vq-font-sans)", outline: "none" }} />
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => setState("draft")}>Redraft the blueprint</Button>
            <span style={{ font: "500 12.5px/1.4 var(--vq-font-sans)", color: "rgb(255 255 255 / .8)" }}>Sentences, not a 40-field wizard.</span>
          </div>
        </Card>

        <Card eyebrow="Step 2 · review" title="Your blueprint" action={<Badge tone={state === "approved" ? "success" : "accent"}>{state === "approved" ? "Approved" : "Draft"}</Badge>}>
          <Alert tone="info">AI decides what your system looks like. It never decides what your numbers say.</Alert>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {mods.map((m, i) => (
              <div key={m.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: "var(--vq-r-md)", border: "1px solid var(--vq-line)", background: m.on ? "var(--vq-surface)" : "var(--vq-sunken)" }}>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, font: "600 14px/1.3 var(--vq-font-sans)" }}>
                    {m.name}
                    {m.locked ? <Badge tone="accent" dot={false}>Locked</Badge> : null}
                  </span>
                  <span style={{ display: "block", marginTop: 3, font: "500 12.5px/1.45 var(--vq-font-sans)", color: "var(--vq-text-3)" }}>{m.why}</span>
                </span>
                <Switch checked={m.on} onChange={() => toggle(i)} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Button onClick={() => setState("approved")} disabled={state === "approved"}>Approve blueprint</Button>
            <Button variant="ghost">Export as PDF</Button>
          </div>
        </Card>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--vq-gutter)" }}>
        <Card eyebrow="Detected" title="What we read">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {["2 branches", "Pharmacy", "Batch + expiry", "30-day credit", "4 suppliers", "Monthly trial balance", "6 staff"].map(t => <Chip key={t} selected={false}>{t}</Chip>)}
          </div>
        </Card>
        <Card eyebrow="Step 3 · go live" title="What happens next">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Checkbox label="Import my supplier list (CSV)" checked onChange={() => {}} />
            <Checkbox label="Open with last month's stock count" checked onChange={() => {}} />
            <Checkbox label="Invite my accountant" onChange={() => {}} />
          </div>
          <Input label="Go-live date" value="1 Sep 2026" />
        </Card>
        {state === "approved" ? (
          <Toast title="Blueprint approved" description="Assembling your system — about 40 seconds." />
        ) : (
          <Card pad={6}><EmptyState title="Nothing is real yet" body="Every line above is editable. Nothing posts to a ledger until you approve." /></Card>
        )}
      </div>
    </div>
  );
}
Object.assign(window, { BlueprintScreen });

})();
