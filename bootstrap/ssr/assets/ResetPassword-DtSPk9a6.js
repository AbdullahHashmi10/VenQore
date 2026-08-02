import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useForm, Head, Link } from "@inertiajs/react";
import { ShieldCheck, Mail, Lock, EyeOff, Eye, Loader2, ArrowRight } from "lucide-react";
import { useState } from "react";
function ResetPassword({ token, email }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    token,
    email,
    password: "",
    password_confirmation: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    post("/reset-password", {
      preserveState: true,
      preserveScroll: true,
      onFinish: () => reset("password", "password_confirmation")
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen w-full flex items-center justify-center bg-void-950 font-sans selection:bg-indigo-500/40 p-4 sm:p-6 relative overflow-hidden", children: [
    /* @__PURE__ */ jsx(Head, { title: "Reset Password" }),
    /* @__PURE__ */ jsx("div", { className: "absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-indigo-900/15 rounded-full blur-[160px] pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-15%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-900/8 rounded-full blur-[140px] pointer-events-none" }),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-20", style: {
      backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
      backgroundSize: "30px 30px"
    } }),
    /* @__PURE__ */ jsxs("div", { className: "relative z-10 w-full max-w-md", children: [
      /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-6 sm:mb-10", children: /* @__PURE__ */ jsx(Link, { href: "/", className: "w-14 h-14 sm:w-16 sm:h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08] hover:scale-105 transition-transform", children: /* @__PURE__ */ jsx("img", { src: "/images/logo.png", alt: "Logo", className: "w-8 h-8 sm:w-10 sm:h-10 object-contain" }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white/[0.02] border border-white/[0.06] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-6 sm:mb-8", children: [
          /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400", children: /* @__PURE__ */ jsx(ShieldCheck, { size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-black text-white tracking-tight", style: { fontFamily: "'Space Grotesk', 'Inter', sans-serif" }, children: "Set New Password" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: "Choose a strong password for your account" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-4 sm:space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-black uppercase tracking-[0.25em] mb-2.5 text-slate-400", children: "Email" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400", children: /* @__PURE__ */ jsx(Mail, { size: 18 }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "email",
                  value: data.email,
                  onChange: (e) => setData("email", e.target.value),
                  className: "w-full pl-12 pr-4 py-3 sm:py-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-slate-400 text-sm outline-none",
                  readOnly: true
                }
              )
            ] }),
            errors.email && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-2", children: errors.email })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-black uppercase tracking-[0.25em] mb-2.5 text-slate-400", children: "New Password" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400", children: /* @__PURE__ */ jsx(Lock, { size: 18 }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: showPassword ? "text" : "password",
                  value: data.password,
                  onChange: (e) => setData("password", e.target.value),
                  placeholder: "••••••••",
                  autoComplete: "new-password",
                  autoFocus: true,
                  className: "w-full pl-12 pr-12 py-3 sm:py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-slate-400 outline-none focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] hover:border-white/[0.12] transition-all duration-500"
                }
              ),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setShowPassword(!showPassword), className: "absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-200 transition-colors", children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { size: 16 }) : /* @__PURE__ */ jsx(Eye, { size: 16 }) })
            ] }),
            errors.password && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-2", children: errors.password })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-black uppercase tracking-[0.25em] mb-2.5 text-slate-400", children: "Confirm Password" }),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400", children: /* @__PURE__ */ jsx(Lock, { size: 18 }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: showPassword ? "text" : "password",
                  value: data.password_confirmation,
                  onChange: (e) => setData("password_confirmation", e.target.value),
                  placeholder: "••••••••",
                  autoComplete: "new-password",
                  className: "w-full pl-12 pr-4 py-3 sm:py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-slate-400 outline-none focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] hover:border-white/[0.12] transition-all duration-500"
                }
              )
            ] }),
            errors.password_confirmation && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-2", children: errors.password_confirmation })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "w-full flex items-center justify-center gap-3 py-3.5 sm:py-4 px-4 bg-white text-void-950 rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 mt-2",
              children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }),
                " Resetting..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                "Reset Password ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ] })
            }
          )
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `* { font-family: 'Inter', 'Figtree', system-ui, sans-serif; }` })
  ] });
}
export {
  ResetPassword as default
};
