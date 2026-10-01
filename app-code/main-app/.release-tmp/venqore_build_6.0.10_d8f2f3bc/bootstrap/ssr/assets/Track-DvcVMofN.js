import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { AlertCircle, CheckCircle2, RefreshCw, PackageCheck, Bike, ChefHat, Clock } from "lucide-react";
const STEPS = [
  { key: "placed", label: "Order Placed", desc: "We received your order", icon: Clock },
  { key: "preparing", label: "Preparing", desc: "Kitchen is cooking your food", icon: ChefHat },
  { key: "out", label: "On the Way", desc: "Rider is heading to your door", icon: Bike },
  { key: "delivered", label: "Delivered", desc: "Enjoy your meal!", icon: PackageCheck }
];
const STEP_INDEX = { placed: 0, preparing: 1, out: 2, delivered: 3 };
function Track({ tracking, error }) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  useEffect(() => {
    if (error || tracking?.status === "delivered") return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.location.reload();
          return 30;
        }
        return prev - 1;
      });
    }, 1e3);
    return () => clearInterval(interval);
  }, [error, tracking?.status]);
  if (error === "not_found") {
    return /* @__PURE__ */ jsxs("div", { style: containerStyle, children: [
      /* @__PURE__ */ jsx(Head, { title: "Order Not Found" }),
      /* @__PURE__ */ jsx("div", { style: cardStyle, children: /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "32px 16px" }, children: [
        /* @__PURE__ */ jsx(AlertCircle, { size: 48, style: { color: "#ef4444", margin: "0 auto 16px" } }),
        /* @__PURE__ */ jsx("h1", { style: { fontSize: "20px", fontWeight: 800, color: "#18181b", margin: "0 0 8px" }, children: "Order Not Found" }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: "14px", color: "#71717a", margin: 0, lineHeight: 1.5 }, children: "This tracking link is invalid or has expired. If you placed an order, please contact the store directly." })
      ] }) })
    ] });
  }
  if (error === "expired") {
    return /* @__PURE__ */ jsxs("div", { style: containerStyle, children: [
      /* @__PURE__ */ jsx(Head, { title: "Tracking Expired" }),
      /* @__PURE__ */ jsx("div", { style: cardStyle, children: /* @__PURE__ */ jsxs("div", { style: { textAlign: "center", padding: "32px 16px" }, children: [
        /* @__PURE__ */ jsx(CheckCircle2, { size: 48, style: { color: "#10b981", margin: "0 auto 16px" } }),
        /* @__PURE__ */ jsx("h1", { style: { fontSize: "20px", fontWeight: 800, color: "#18181b", margin: "0 0 8px" }, children: "Delivery Completed" }),
        /* @__PURE__ */ jsx("p", { style: { fontSize: "14px", color: "#71717a", margin: 0, lineHeight: 1.5 }, children: "This order was completed and its tracking window has ended. Thank you for your order!" })
      ] }) })
    ] });
  }
  const currentIdx = STEP_INDEX[tracking?.status] ?? 0;
  const isOut = tracking?.status === "out";
  const isDelivered = tracking?.status === "delivered";
  return /* @__PURE__ */ jsxs("div", { style: containerStyle, children: [
    /* @__PURE__ */ jsx(Head, { title: `Live Order Tracking • ${tracking?.status_label || "Delivery"}` }),
    /* @__PURE__ */ jsxs("div", { style: cardStyle, children: [
      /* @__PURE__ */ jsxs("header", { style: {
        padding: "24px 20px",
        borderBottom: "1px solid #f4f4f5",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        background: "#fafafa",
        borderTopLeftRadius: "16px",
        borderTopRightRadius: "16px"
      }, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { style: {
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#10b981",
            display: "block",
            marginBottom: "4px"
          }, children: "Live Delivery Tracking" }),
          /* @__PURE__ */ jsx("h1", { style: { fontSize: "18px", fontWeight: 800, color: "#18181b", margin: 0 }, children: tracking?.customer_name ? `Order for ${tracking.customer_name}` : "Your Order" })
        ] }),
        !isDelivered && /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#71717a" }, children: [
          /* @__PURE__ */ jsx(RefreshCw, { size: 12, style: { animation: "spin 3s linear infinite" } }),
          /* @__PURE__ */ jsxs("span", { children: [
            secondsLeft,
            "s"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { style: {
        padding: "24px 20px",
        textAlign: "center",
        background: isDelivered ? "#ecfdf5" : isOut ? "#eff6ff" : "#ffffff",
        borderBottom: "1px solid #f4f4f5"
      }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          width: "56px",
          height: "56px",
          borderRadius: "28px",
          background: isDelivered ? "#10b981" : isOut ? "#3b82f6" : "#18181b",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
        }, children: isDelivered ? /* @__PURE__ */ jsx(PackageCheck, { size: 28 }) : isOut ? /* @__PURE__ */ jsx(Bike, { size: 28 }) : /* @__PURE__ */ jsx(ChefHat, { size: 28 }) }),
        /* @__PURE__ */ jsx("h2", { style: { fontSize: "22px", fontWeight: 800, color: "#18181b", margin: "0 0 6px" }, children: tracking?.status_label }),
        isOut && tracking?.rider_first_name && /* @__PURE__ */ jsxs("p", { style: { fontSize: "15px", color: "#2563eb", fontWeight: 600, margin: "0 0 8px" }, children: [
          "🚴 ",
          tracking.rider_first_name,
          " is on the way!"
        ] }),
        isOut && tracking?.eta_remaining !== null && /* @__PURE__ */ jsxs("div", { style: {
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          background: "#dbeafe",
          color: "#1d4ed8",
          padding: "6px 14px",
          borderRadius: "20px",
          fontSize: "13px",
          fontWeight: 700,
          marginTop: "4px"
        }, children: [
          /* @__PURE__ */ jsx(Clock, { size: 14 }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Estimated arrival: ",
            tracking.eta_remaining > 0 ? `~${tracking.eta_remaining} mins` : "Any moment now"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { style: { padding: "24px 20px" }, children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: "20px", position: "relative" }, children: [
        /* @__PURE__ */ jsx("div", { style: {
          position: "absolute",
          left: "19px",
          top: "16px",
          bottom: "16px",
          width: "2px",
          background: "#e4e4e7",
          zIndex: 0
        } }),
        STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const StepIcon = step.icon;
          let dotBg = "#e4e4e7";
          let dotColor = "#71717a";
          if (isDone || isCurrent) {
            dotBg = isCurrent ? "#18181b" : "#10b981";
            dotColor = "#ffffff";
          }
          return /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "flex-start", gap: "16px", zIndex: 1 }, children: [
            /* @__PURE__ */ jsx("div", { style: {
              width: "40px",
              height: "40px",
              borderRadius: "20px",
              background: dotBg,
              color: dotColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.3s ease",
              boxShadow: isCurrent ? "0 0 0 4px rgba(24,24,27,0.1)" : "none"
            }, children: isDone ? /* @__PURE__ */ jsx(CheckCircle2, { size: 18 }) : /* @__PURE__ */ jsx(StepIcon, { size: 18 }) }),
            /* @__PURE__ */ jsxs("div", { style: { paddingTop: "8px" }, children: [
              /* @__PURE__ */ jsx("h3", { style: {
                fontSize: "15px",
                fontWeight: isCurrent ? 800 : 600,
                color: isCurrent ? "#18181b" : isDone ? "#3f3f46" : "#a1a1aa",
                margin: "0 0 2px"
              }, children: step.label }),
              /* @__PURE__ */ jsx("p", { style: { fontSize: "13px", color: "#71717a", margin: 0 }, children: step.desc })
            ] })
          ] }, step.key);
        })
      ] }) }),
      /* @__PURE__ */ jsx("footer", { style: {
        padding: "16px 20px",
        borderTop: "1px solid #f4f4f5",
        textAlign: "center",
        background: "#fafafa",
        borderBottomLeftRadius: "16px",
        borderBottomRightRadius: "16px"
      }, children: /* @__PURE__ */ jsx("p", { style: { fontSize: "12px", color: "#a1a1aa", margin: 0 }, children: "Powered by VenQore Restaurant Platform" }) })
    ] })
  ] });
}
const containerStyle = {
  minHeight: "100vh",
  background: "#f4f4f5",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 16px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
};
const cardStyle = {
  background: "#ffffff",
  borderRadius: "16px",
  width: "100%",
  maxWidth: "440px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  border: "1px solid #e4e4e7"
};
export {
  Track as default
};
