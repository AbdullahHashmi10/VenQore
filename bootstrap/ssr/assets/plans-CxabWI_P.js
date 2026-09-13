const PLAN_ORDER = ["solo", "starter", "core", "scale", "custom"];
const SELF_SERVE_PLANS = ["solo", "starter", "core", "scale"];
const PLAN_LABELS = {
  trial: "Free Trial",
  solo: "Solo",
  starter: "Starter",
  core: "Core",
  scale: "Scale",
  custom: "Custom",
  ltd: "Lifetime Deal",
  ltd_1: "Lifetime Tier 1",
  ltd_2: "Lifetime Tier 2",
  ltd_3: "Lifetime Tier 3"
};
const PLAN_PRICE_USD = { solo: 0, starter: 49, core: 99, scale: 299 };
const LEGACY = { counter: "solo", growth: "core", business: "scale" };
const LTD_EQUIVALENT = { ltd_1: "starter", ltd_2: "core", ltd_3: "scale" };
function normalizePlan(slug) {
  const s = String(slug ?? "").trim().toLowerCase();
  return LEGACY[s] || s;
}
function planRank(slug) {
  const s = normalizePlan(slug);
  const i = PLAN_ORDER.indexOf(LTD_EQUIVALENT[s] || s);
  return i === -1 ? 0 : i + 1;
}
function nextPlan(slug) {
  const s = LTD_EQUIVALENT[normalizePlan(slug)] || normalizePlan(slug);
  if (s === "custom") return null;
  const i = SELF_SERVE_PLANS.indexOf(s);
  if (i === -1) return "starter";
  return SELF_SERVE_PLANS[i + 1] || null;
}
function planLabel(slug) {
  const s = normalizePlan(slug);
  return PLAN_LABELS[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "");
}
const PLAN_PERKS = {
  solo: ["500 products", "1 staff seat (2 till logins)", "1 till", "100 sales / month", "100 monthly AI credits"],
  starter: [
    "5,000 products",
    "1 full staff seat — till logins unlimited",
    "2 tills",
    "Unlimited sales and full history",
    "500 monthly AI credits",
    "Email support within 2 business days"
  ],
  core: [
    "25,000 products",
    "5 full staff seats",
    "6 tills",
    "Unlimited sales and full history",
    "2,000 monthly AI credits",
    "Email support within 1 business day"
  ],
  scale: [
    "250,000 products",
    "25 full staff seats",
    "20 tills",
    "Unlimited sales and full history",
    "10,000 monthly AI credits",
    "Named contact, 4 business hours"
  ]
};
export {
  PLAN_PERKS as P,
  SELF_SERVE_PLANS as S,
  nextPlan as a,
  planLabel as b,
  PLAN_PRICE_USD as c,
  normalizePlan as n,
  planRank as p
};
