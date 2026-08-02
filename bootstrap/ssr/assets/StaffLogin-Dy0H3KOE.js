import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { useForm, Head, Link } from "@inertiajs/react";
import { KeyRound, ShieldCheck, Mail, Lock, EyeOff, Eye, Loader2, ArrowRight } from "lucide-react";
const AuthInput = ({ icon: Icon, label, error, ...props }) => {
  const [focused, setFocused] = useState(false);
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("label", { className: `block text-2xs font-black uppercase tracking-[0.25em] mb-2.5 transition-colors duration-300 ${focused ? "text-violet-400" : "text-slate-500"}`, children: label }),
    /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
      /* @__PURE__ */ jsx("div", { className: `absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${focused ? "text-violet-400" : "text-slate-600"}`, children: /* @__PURE__ */ jsx(Icon, { size: 18 }) }),
      /* @__PURE__ */ jsx(
        "input",
        {
          ...props,
          onFocus: (e) => {
            setFocused(true);
            props.onFocus?.(e);
          },
          onBlur: (e) => {
            setFocused(false);
            props.onBlur?.(e);
          },
          className: `w-full pl-12 pr-4 py-4 bg-white/[0.02] border rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none transition-all duration-500
                        ${focused ? "border-violet-500/40 bg-violet-500/[0.02] shadow-lg shadow-violet-900/10" : "border-white/[0.06] hover:border-white/[0.1]"}
                        ${error ? "border-red-500/40" : ""}
                    `
        }
      ),
      /* @__PURE__ */ jsx("div", { className: `absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-violet-500 to-transparent transition-opacity duration-500 ${focused ? "opacity-100" : "opacity-0"}` })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-2 font-medium", children: error })
  ] });
};
function StaffLogin({ status, flash }) {
  const { data, setData, post, processing, errors, reset } = useForm({
    email: "",
    password: "",
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    return () => reset("password");
  }, []);
  const submit = (e) => {
    e.preventDefault();
    post("/staff-login", {
      preserveState: true,
      preserveScroll: true
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen w-full flex bg-void-900 font-sans selection:bg-violet-500/40 selection:text-white", children: [
    /* @__PURE__ */ jsx(Head, { title: "Staff Access Portal" }),
    /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex w-[45%] relative overflow-hidden items-center justify-center p-16 border-r border-white/[0.03]", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-[-20%] right-[-15%] w-[600px] h-[600px] bg-violet-600/15 rounded-full blur-[140px] pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-20", style: {
        backgroundImage: "linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)",
        backgroundSize: "50px 50px"
      } }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 text-center max-w-md", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-10 flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-white/[0.03] backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/[0.06] shadow-2xl shadow-violet-900/20", children: /* @__PURE__ */ jsx(KeyRound, { className: "w-10 h-10 text-violet-400" }) }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-black text-white mb-4 tracking-tighter leading-[0.95]", style: { fontFamily: "'Space Grotesk', 'Inter', sans-serif" }, children: "Staff Hub." }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm leading-relaxed", children: "Secure authorization portal for VenQore platform support agents, content writers, marketing specialists, and platform managers." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-12 flex justify-center gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "px-6 py-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-xs font-bold text-slate-400 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { size: 14, className: "text-violet-500" }),
            " Platform Level"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "px-6 py-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] text-xs font-bold text-slate-400 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { size: 14, className: "text-violet-500" }),
            " Secure Sessions"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-violet-600/5 rounded-full blur-[100px] pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md relative z-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "mb-10 text-center sm:text-left", children: [
          /* @__PURE__ */ jsx("span", { className: "text-2xs bg-violet-500/10 border border-violet-500/20 text-violet-400 font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block mb-3", children: "Platform Command Portal" }),
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-black text-white tracking-tight mb-2", style: { fontFamily: "'Space Grotesk', 'Inter', sans-serif" }, children: "Staff Authorization" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-sm", children: "Please authenticate using your credentials to enter the cockpit." })
        ] }),
        status && /* @__PURE__ */ jsx("div", { className: "p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8", children: status }),
        flash?.error && /* @__PURE__ */ jsx("div", { className: "p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-8", children: flash.error }),
        /* @__PURE__ */ jsx("form", { onSubmit: submit, className: "space-y-6", children: /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
          /* @__PURE__ */ jsx(
            AuthInput,
            {
              icon: Mail,
              label: "Email Address",
              type: "email",
              value: data.email,
              onChange: (e) => setData("email", e.target.value),
              placeholder: "yourname@venqore.com",
              autoComplete: "username",
              autoFocus: true,
              error: errors.email
            }
          ),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-2xs font-black uppercase tracking-[0.25em] mb-2.5 text-slate-500", children: "Password" }),
            /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600", children: /* @__PURE__ */ jsx(Lock, { size: 18 }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: showPassword ? "text" : "password",
                  value: data.password,
                  onChange: (e) => setData("password", e.target.value),
                  placeholder: "••••••••",
                  autoComplete: "current-password",
                  className: "w-full pl-12 pr-12 py-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-white text-sm placeholder:text-slate-700 outline-none focus:border-violet-500/40 focus:bg-violet-500/[0.02] focus:shadow-lg focus:shadow-violet-900/10 hover:border-white/[0.1] transition-all duration-500"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setShowPassword(!showPassword),
                  className: "absolute inset-y-0 right-0 pr-4 flex items-center text-slate-600 hover:text-slate-400 transition-colors",
                  children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { size: 16 }) : /* @__PURE__ */ jsx(Eye, { size: 16 })
                }
              )
            ] }),
            errors.password && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-2 font-medium", children: errors.password })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsxs("label", { className: "flex items-center cursor-pointer group", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: data.remember,
                onChange: (e) => setData("remember", e.target.checked),
                className: "w-4 h-4 rounded border-white/10 bg-white/[0.03] text-violet-600 focus:ring-violet-500/20 focus:ring-offset-0"
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "ml-2.5 text-sm text-slate-500 group-hover:text-slate-400 transition-colors", children: "Remember me" })
          ] }) }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "w-full flex items-center justify-center gap-3 py-4 px-4 bg-white text-void-900 rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:shadow-[0_0_60px_-10px_rgba(139,92,246,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 disabled:opacity-50",
              children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }),
                " Authorizing..."
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                "Enter Staff Hub ",
                /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
              ] })
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "mt-10 text-center", children: /* @__PURE__ */ jsx(Link, { href: route("login"), className: "font-semibold text-xs text-slate-600 hover:text-violet-400 transition-colors", children: "← Regular Store Account Login" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                * { font-family: 'Inter', system-ui, sans-serif; }
            ` })
  ] });
}
export {
  StaffLogin as default
};
