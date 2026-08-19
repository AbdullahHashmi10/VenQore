(function(){
const { Card, StatCard, AreaChart, BarChart, ProgressRing, BarMeter, ActivityRow, Alert, Badge, Button, Tabs, Select, IconButton } = window.VenQoreDesignSystem_76c34c;

function DashboardScreen() {
  const [period, setPeriod] = React.useState("Month");
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "var(--vq-gutter)" }}>
        <StatCard tone="accent" label="Net balance" value="6,636,549" unit="Rs" delta="8.2%" caption="vs last month" />
        <StatCard label="Profit margin" value="54" unit="%" delta="2.1%" caption="net / revenue" />
        <StatCard label="Overdue" value="10,260" unit="Rs" delta="3.1%" deltaTone="down" caption="receivables" />
        <StatCard label="Pending actions" value="3" unit="items" caption="needs approval" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.55fr) minmax(0,1fr)", gap: "var(--vq-gutter)", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--vq-gutter)", minWidth: 0 }}>
          <Card eyebrow="Past 6 months spending" title="Purchases trend" action={<Tabs size="sm" tabs={["Month", "Quarter", "Year"]} value={period} onChange={setPeriod} />}>
            <AreaChart data={[700, 1400, 2100, 2400, 2600, 5200]} labels={["Mar", "Apr", "May", "Jun", "Jul", "Aug"]} height={210} />
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "var(--vq-gutter)" }}>
            <Card title="Inventory" action={<Badge tone="warning">Action needed</Badge>}>
              <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                <ProgressRing value={33} size={116} sublabel="Inventory" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                  <BarMeter label="Healthy" value={75} color="var(--vq-success)" />
                  <BarMeter label="Low" value={12} color="var(--vq-warning)" />
                  <BarMeter label="Out" value={13} color="var(--vq-danger)" />
                </div>
              </div>
            </Card>
            <Card eyebrow="This week" title="Sales by day" action={<Select size="sm" options={["Units", "Value"]} />}>
              <BarChart data={[3, 7, 5, 9, 4, 6, 2]} labels={["S", "M", "T", "W", "T", "F", "S"]} highlight={3} height={148} />
            </Card>
          </div>

          <Card title="Payments" eyebrow="Transaction types">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 28px" }}>
              <BarMeter label="Cash" value={2511} max={2511} display="2,511" color="var(--vq-series-1)" />
              <BarMeter label="Credit" value={830} max={2511} display="830" color="var(--vq-series-3)" />
              <BarMeter label="Bank" value={884} max={2511} display="884" color="var(--vq-series-2)" />
              <BarMeter label="Split" value={1} max={2511} display="1" color="var(--vq-series-4)" />
            </div>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--vq-gutter)", minWidth: 0 }}>
          <Card eyebrow="Today" title="Cash position" action={<IconButton label="More" variant="ghost">···</IconButton>}>
            <div className="vq-num" style={{ font: "600 30px/1 var(--vq-font-numeric)", letterSpacing: "-0.03em" }}>Rs 6,636,549.20</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: 14, borderRadius: "var(--vq-r-md)", background: "var(--vq-success-bg)", border: "1px solid var(--vq-success-line)" }}>
                <div className="vq-eyebrow" style={{ color: "var(--vq-success)" }}>In</div>
                <div className="vq-num" style={{ font: "600 17px/1.2 var(--vq-font-numeric)", marginTop: 6 }}>Rs 14,561.15</div>
              </div>
              <div style={{ padding: 14, borderRadius: "var(--vq-r-md)", background: "var(--vq-danger-bg)", border: "1px solid var(--vq-danger-line)" }}>
                <div className="vq-eyebrow" style={{ color: "var(--vq-danger)" }}>Out</div>
                <div className="vq-num" style={{ font: "600 17px/1.2 var(--vq-font-numeric)", marginTop: 6 }}>Rs 54,251.00</div>
              </div>
            </div>
          </Card>

          <Card title="Alerts" action={<Button variant="ghost" size="sm">View all</Button>}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Alert tone="warning">13% inventory running low</Alert>
              <Alert tone="danger">9% products out of stock</Alert>
              <Alert tone="success">Profit: Rs 53,544.70 today</Alert>
            </div>
          </Card>

          <Card title="Business activity" action={<Button variant="ghost" size="sm">View all</Button>} pad={14}>
            <div>
              <ActivityRow tone="in" title="Sale #SAL-R1-160826" meta="1 day ago" amount="+Rs 1,244.00" />
              <ActivityRow tone="out" title="Purchase #PUR-R1-2210" meta="1 week ago" amount="−Rs 1,700.00" />
              <ActivityRow tone="out" title="Purchase #PUR-R1-2209" meta="1 week ago" amount="−Rs 1,000.00" />
              <ActivityRow tone="in" title="Sale #SAL-R1-070826" meta="1 week ago" amount="+Rs 5,922.00" />
            </div>
          </Card>

          <Card tone="ink" eyebrow="Signals" title="Two customers are slipping">
            <p style={{ margin: 0, font: "500 13px/1.55 var(--vq-font-sans)", color: "rgb(237 242 239 / .7)" }}>Their order gap has doubled since June. Reach out while it is still cheap to keep them.</p>
            <Button size="sm" style={{ alignSelf: "flex-start" }}>Open Signals</Button>
          </Card>
        </div>
      </div>
    </>
  );
}
Object.assign(window, { DashboardScreen });

})();
