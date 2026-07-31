import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useForm, Head, Link } from "@inertiajs/react";
import { Mail, CheckCircle2, Loader2, RefreshCw, LogOut } from "lucide-react";
function VerifyEmail({ status }) {
  const { post, processing } = useForm({});
  const submit = (e) => {
    e.preventDefault();
    post("/email/verification-notification", {
      preserveState: true,
      preserveScroll: true
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen w-full flex items-center justify-center bg-[#020010] font-sans selection:bg-indigo-500/40 p-4 sm:p-6 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx(Head, { title: "Verify Email" }),
    /* @__PURE__ */ jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/15 rounded-full blur-[160px] pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-violet-900/10 rounded-full blur-[140px] pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-20", style: {
      backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
      backgroundSize: "60px 60px"
    } }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full max-w-md", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-6 sm:mb-10", children: /* @__PURE__ */ jsx(Link, { href: "/", className: "w-14 h-14 sm:w-16 sm:h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08] hover:scale-105 transition-transform", children: /* @__PURE__ */ jsx("img", { src: "/images/logo.png", alt: "Logo", className: "w-8 h-8 sm:w-10 sm:h-10 object-contain" }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/[0.06] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 backdrop-blur-sm text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-4 sm:mb-6", children: /* @__PURE__ */ jsx("div", { className: "w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center", children: /* @__PURE__ */ jsx(Mail, { size: 22, className: "text-indigo-400" }) }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl sm:text-2xl font-black text-white tracking-tight mb-2 sm:mb-3", style: { fontFamily: "'Space Grotesk', 'Inter', sans-serif" }, children: "Check Your Email" }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm leading-relaxed mb-6 sm:mb-8 max-w-sm mx-auto", children: "We've sent a verification link to your email address. Click the link to activate your account and get started." }),
        status === "verification-link-sent" && /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6 flex items-center justify-center gap-2", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
          "A new verification link has been sent!"
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3 sm:space-y-4", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "w-full flex items-center justify-center gap-3 py-3.5 sm:py-4 px-4 bg-white text-[#020010] rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50",
              children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }),
                " Sending..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(RefreshCw, { size: 16 }),
                " Resend Verification Email"
              ] })
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              href: route("logout"),
              method: "post",
              as: "button",
              className: "w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.06] rounded-2xl font-bold text-sm transition-all active:scale-[0.98]",
              children: [
                /* @__PURE__ */ jsx(LogOut, { size: 16 }),
                " Sign Out"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-slate-400 mt-4 sm:mt-6", children: "Didn't receive the email? Check your spam folder or try resending." })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `* { font-family: 'Inter', 'Figtree', system-ui, sans-serif; }` })
  ] });
}
export {
  VerifyEmail as default
};
