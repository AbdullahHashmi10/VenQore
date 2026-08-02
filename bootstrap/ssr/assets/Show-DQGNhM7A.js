import { jsxs, jsx } from "react/jsx-runtime";
import "react";
import { useForm, Head } from "@inertiajs/react";
import { CheckCircle2, Sparkles, ArrowRight, LogIn, Clock } from "lucide-react";
function GiftShow({
  token,
  plan_name,
  plan_description,
  duration_label,
  label,
  is_authenticated,
  already_redeemed_by_me
}) {
  const { post, processing } = useForm({});
  const url = (name, fallback) => {
    try {
      return typeof route === "function" ? route(name) : fallback;
    } catch {
      return fallback;
    }
  };
  const acceptUrl = `/gift/${encodeURIComponent(token ?? "")}`;
  const registerUrl = url("register", "/register");
  const loginUrl = url("login", "/login");
  const accept = (e) => {
    e.preventDefault();
    post(acceptUrl);
  };
  const planLabel = plan_name || "VenQore Access";
  const durationText = duration_label || "a limited time";
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-void-950 text-white font-sans flex items-center justify-center p-8", children: [
    /* @__PURE__ */ jsx(Head, { title: `You've Been Gifted VenQore — ${planLabel}` }),
    /* @__PURE__ */ jsx("div", { className: "fixed inset-0 pointer-events-none", children: /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 max-w-xl w-full text-center", children: [
      /* @__PURE__ */ jsx("div", { className: "w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-4xl mb-8 shadow-2xl", children: "🎁" }),
      /* @__PURE__ */ jsx("span", { className: "px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 uppercase tracking-widest", children: "You've Been Gifted" }),
      /* @__PURE__ */ jsxs("h1", { className: "text-4xl font-black mt-4 mb-3 tracking-tight", children: [
        planLabel,
        /* @__PURE__ */ jsx("br", {}),
        /* @__PURE__ */ jsxs("span", { className: "bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent", children: [
          "for ",
          durationText
        ] })
      ] }),
      plan_description && /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-lg mb-8 leading-relaxed", children: plan_description }),
      label && /* @__PURE__ */ jsxs("p", { className: "text-slate-600 text-sm mb-6 italic", children: [
        '"',
        label,
        '"'
      ] }),
      already_redeemed_by_me ? /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { size: 20 }),
        " You've already accepted this gift."
      ] }) : /* @__PURE__ */ jsx("form", { onSubmit: accept, children: is_authenticated ? /* @__PURE__ */ jsxs(
        "button",
        {
          type: "submit",
          disabled: processing,
          className: "flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-indigo-500/25 disabled:opacity-60",
          children: [
            /* @__PURE__ */ jsx(Sparkles, { size: 18 }),
            processing ? "Applying your gift…" : "Accept Gift",
            /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
          ]
        }
      ) : /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: registerUrl,
            className: "flex items-center justify-center gap-3 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold text-base transition-all hover:scale-[1.02]",
            children: [
              /* @__PURE__ */ jsx(Sparkles, { size: 18 }),
              " Create Account & Accept Gift"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: loginUrl,
            className: "flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-sm transition-all",
            children: [
              /* @__PURE__ */ jsx(LogIn, { size: 15 }),
              " Already have an account? Log in"
            ]
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs("p", { className: "text-slate-700 text-xs mt-8 flex items-center justify-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Clock, { size: 12 }),
        " Your access starts the moment you accept."
      ] })
    ] })
  ] });
}
export {
  GiftShow as default
};
