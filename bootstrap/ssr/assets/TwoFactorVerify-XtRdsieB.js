import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useForm, Head } from "@inertiajs/react";
import { I as InputError } from "./InputError-2JjWc6nJ.js";
import { ShieldAlert, KeyRound, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
function TwoFactorVerify() {
  const { data, setData, post, processing, errors } = useForm({
    code: ""
  });
  const [focused, setFocused] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    post("/2fa/verify");
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen w-full flex items-center justify-center bg-[#020010] font-sans selection:bg-indigo-500/40 p-4 sm:p-6 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx(Head, { title: "Two-Factor Authentication Verify" }),
    /* @__PURE__ */ jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/15 rounded-full blur-[160px] pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-violet-900/10 rounded-full blur-[140px] pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-20", style: {
      backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
      backgroundSize: "30px 30px"
    } }),
    /* @__PURE__ */ jsx("div", { className: "relative z-10 w-full max-w-md", children: /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/[0.06] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 backdrop-blur-sm", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400", children: /* @__PURE__ */ jsx(ShieldAlert, { size: 20 }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-xl font-black text-white tracking-tight", style: { fontFamily: "'Space Grotesk', 'Inter', sans-serif" }, children: "Verification Required" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Two-Factor Authentication Code" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6 text-sm text-slate-300", children: [
        /* @__PURE__ */ jsx("p", { children: "Please enter the 6-digit authentication code from your authenticator app, or a secure recovery code." }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-semibold text-slate-400 uppercase tracking-wider", children: "Authentication Code" }),
            /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-3 bg-white/[0.03] border rounded-2xl px-4 py-4 transition-all duration-300 ${focused ? "border-indigo-500 bg-indigo-500/[0.02] shadow-[0_0_20px_rgba(99,102,241,0.1)]" : "border-white/[0.08] hover:border-white/[0.15]"}`, children: [
              /* @__PURE__ */ jsx(KeyRound, { size: 20, className: focused ? "text-indigo-400" : "text-slate-400" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: "000000",
                  value: data.code,
                  onChange: (e) => setData("code", e.target.value),
                  onFocus: () => setFocused(true),
                  onBlur: () => setFocused(false),
                  className: "bg-transparent border-0 outline-none text-white text-base tracking-widest font-mono p-0 w-full placeholder:text-slate-600 focus:ring-0 focus:outline-none",
                  required: true,
                  autoFocus: true
                }
              )
            ] }),
            /* @__PURE__ */ jsx(InputError, { message: errors.code, className: "mt-2 text-red-400 text-xs" })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-2xl font-black text-sm transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:scale-100",
              children: processing ? /* @__PURE__ */ jsx(Loader2, { size: 16, className: "animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                "Verify Code",
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ] })
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  TwoFactorVerify as default
};
