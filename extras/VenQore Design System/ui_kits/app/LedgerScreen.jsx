(function(){
const { Card, DataTable, Badge, Button, Chip, Tabs, Select, StatCard, Modal, IconButton, Alert } = window.VenQoreDesignSystem_76c34c;

const ROWS = [
  { id: 1, ref: "INV-2291", party: "Rana Traders", date: "16 Aug 2026", status: "Paid", tone: "success", amount: "128,400.00" },
  { id: 2, ref: "INV-2290", party: "Bilal Pharmacy", date: "15 Aug 2026", status: "Overdue", tone: "danger", amount: "10,260.00" },
  { id: 3, ref: "INV-2289", party: "Zoya Retail", date: "14 Aug 2026", status: "Draft", tone: "neutral", amount: "274,240.00" },
  { id: 4, ref: "INV-2288", party: "Kashif & Sons", date: "12 Aug 2026", status: "Paid", tone: "success", amount: "45,120.00" },
  { id: 5, ref: "CRN-0112", party: "Bilal Pharmacy", date: "11 Aug 2026", status: "Posted", tone: "accent", amount: "(3,900.00)", neg: true },
  { id: 6, ref: "INV-2287", party: "Metro Mart", date: "09 Aug 2026", status: "Paid", tone: "success", amount: "88,650.00" },
];

function LedgerScreen() {
  const [tab, setTab] = React.useState("All");
  const [row, setRow] = React.useState(null);
  const rows = tab === "All" ? ROWS : ROWS.filter(r => r.status === tab);
  const total = rows.reduce((s, r) => s + (r.neg ? -1 : 1) * Number(r.amount.replace(/[(),]/g, "")), 0);
  const fmt = n => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "var(--vq-gutter)" }}>
        <StatCard tone="accent" label="Receivables" value="412,900" unit="Rs" delta="4.4%" caption="6 open invoices" />
        <StatCard label="Overdue" value="10,260" unit="Rs" delta="3.1%" deltaTone="down" caption="1 invoice · 12 days" />
        <StatCard label="Posted this month" value="128" unit="entries" caption="all balanced" />
        <StatCard label="Trial balance" value="0.00" unit="Rs diff" caption="debits = credits" />
      </div>

      <Card pad={16} title="Invoices" eyebrow="Core Ledger · August 2026"
        action={<div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Select size="sm" options={["August 2026", "July 2026", "Q3 2026"]} />
          <Button variant="secondary" size="sm">Export</Button>
          <Button size="sm">New invoice</Button>
        </div>}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {["All", "Paid", "Overdue", "Draft"].map(t => (
            <Chip key={t} selected={tab === t} count={t === "All" ? ROWS.length : ROWS.filter(r => r.status === t).length} onClick={() => setTab(t)}>{t}</Chip>
          ))}
          <span style={{ marginLeft: "auto" }}><Tabs size="sm" tabs={["Table", "Cards"]} value="Table" onChange={() => {}} /></span>
        </div>
        <DataTable
          onRowClick={setRow}
          columns={[
            { key: "ref", label: "Reference" },
            { key: "party", label: "Customer" },
            { key: "date", label: "Date" },
            { key: "status", label: "Status", render: r => <Badge tone={r.tone}>{r.status}</Badge> },
            { key: "amount", label: "Amount (Rs)", numeric: true, render: r => <span style={{ color: r.neg ? "var(--vq-danger)" : "inherit" }}>{r.neg ? "−" : ""}{r.amount}</span> },
          ]}
          rows={rows}
          totals={{ ref: "Total", amount: fmt(total) }}
        />
      </Card>

      <Modal open={!!row} onClose={() => setRow(null)} width={720}
        title={row ? row.ref + " · " + row.party : ""}
        description="Every line below posted through Core Ledger. Debits equal credits or nothing posted."
        footer={<><Button variant="ghost" onClick={() => setRow(null)}>Close</Button><Button variant="secondary">Print</Button><Button>Record payment</Button></>}>
        <Alert tone="success">Balanced — 2 debits, 2 credits.</Alert>
        <DataTable
          columns={[{ key: "acct", label: "Account" }, { key: "dr", label: "Debit", numeric: true }, { key: "cr", label: "Credit", numeric: true }]}
          rows={[
            { acct: "Accounts receivable", dr: "128,400.00", cr: "—" },
            { acct: "Sales revenue", dr: "—", cr: "112,631.58" },
            { acct: "Output tax", dr: "—", cr: "15,768.42" },
          ]}
          totals={{ acct: "Total", dr: "128,400.00", cr: "128,400.00" }}
        />
      </Modal>
    </>
  );
}
Object.assign(window, { LedgerScreen });

})();
