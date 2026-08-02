import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { usePage, useForm, Head, Link } from "@inertiajs/react";
import { ArrowRight, X, Mail, Lock, EyeOff, Eye, Loader2, Grip } from "lucide-react";
const AuthInput = ({ icon: Icon, label, error, ...props }) => {
  const [focused, setFocused] = useState(false);
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("label", { className: `block text-2xs font-black uppercase tracking-[0.25em] mb-2.5 transition-colors duration-300 ${focused ? "text-indigo-400" : "text-slate-400"}`, children: label }),
    /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
      /* @__PURE__ */ jsx("div", { className: `absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300 ${focused ? "text-indigo-400" : "text-slate-500"}`, children: /* @__PURE__ */ jsx(Icon, { size: 18 }) }),
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
          className: `w-full pl-12 pr-4 py-3.5 sm:py-4 bg-white/[0.03] border rounded-2xl text-white text-sm placeholder:text-slate-500 outline-none transition-all duration-500
                        ${focused ? "border-indigo-500/40 bg-indigo-500/[0.03] shadow-lg shadow-indigo-900/10" : "border-white/[0.08] hover:border-white/[0.12]"}
                        ${error ? "border-red-500/40" : ""}
                    `
        }
      ),
      /* @__PURE__ */ jsx("div", { className: `absolute bottom-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent transition-opacity duration-500 ${focused ? "opacity-100" : "opacity-0"}` })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-2 font-medium", children: error })
  ] });
};
function Login({ status, canResetPassword, settings, passcode_login_available, flash }) {
  const page = usePage();
  const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
    email: "",
    password: "",
    remember: false,
    loginMethod: "email",
    passcode: ""
  });
  const displayErrors = { ...page.props.errors, ...errors };
  useEffect(() => {
  }, [page.props]);
  useEffect(() => {
  }, [errors]);
  const [showPassword, setShowPassword] = useState(false);
  useEffect(() => {
    return () => reset("password");
  }, []);
  const submitPasscode = () => {
    if (!processing && data.passcode) {
      post("/login/passcode", {
        preserveState: true,
        preserveScroll: true,
        onError: () => setData("passcode", "")
      });
    }
  };
  const handlePasscodeChange = (newPasscode) => {
    setData("passcode", newPasscode);
    if (errors.passcode) clearErrors("passcode");
  };
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (data.loginMethod !== "passcode") return;
      if (/^[0-9]$/.test(e.key)) {
        const c = data.passcode || "";
        if (c.length < 10) handlePasscodeChange(c + e.key);
      } else if (e.key === "Backspace") {
        handlePasscodeChange((data.passcode || "").slice(0, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        submitPasscode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data.loginMethod, data.passcode, processing]);
  const submit = (e) => {
    e.preventDefault();
    if (data.loginMethod === "email") {
      post("/login", {
        preserveState: true,
        preserveScroll: true
      });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen w-full flex bg-void-950 font-sans selection:bg-indigo-500/40 selection:text-white", children: [
    /* @__PURE__ */ jsx(Head, { title: "Sign In" }),
    /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex w-[45%] relative overflow-hidden items-center justify-center p-16", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-[-20%] right-[-15%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" }),
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 opacity-30", style: {
        backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      } }),
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 text-center max-w-md", children: [
        /* @__PURE__ */ jsx("div", { className: "mb-10 flex justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-20 h-20 bg-white/[0.04] backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/[0.08] shadow-2xl shadow-indigo-900/20", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: settings?.company_logo ? `/storage/${settings.company_logo}` : "/images/logo.png",
            alt: "Logo",
            className: "w-12 h-12 object-contain",
            onError: (e) => {
              e.target.onerror = null;
              e.target.src = "/images/logo.png";
            }
          }
        ) }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-black text-white mb-4 tracking-tighter leading-[0.95]", style: { fontFamily: "'Space Grotesk', 'Inter', sans-serif" }, children: settings?.business_name || "Welcome Back." }),
        /* @__PURE__ */ jsx("p", { className: "text-slate-500 text-base leading-relaxed", children: settings?.login_hero_text || "The operations platform where every transaction writes a correct journal entry. Automatically." }),
        /* @__PURE__ */ jsx("div", { className: "mt-12 grid grid-cols-3 gap-4", children: [
          { val: "38", label: "Reports" },
          { val: "0.00", label: "Balance Error" },
          { val: "FIFO", label: "Cost Basis" }
        ].map((s, i) => /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05]", children: [
          /* @__PURE__ */ jsx("div", { className: "text-lg font-black text-white tracking-tighter", style: { fontFamily: "'Space Grotesk', sans-serif" }, children: s.val }),
          /* @__PURE__ */ jsx("div", { className: "text-3xs text-slate-600 font-bold uppercase tracking-widest mt-1", children: s.label })
        ] }, i)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 relative", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" }),
      /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md relative z-10", children: [
        /* @__PURE__ */ jsx("div", { className: "lg:hidden flex justify-center mb-6 sm:mb-10", children: /* @__PURE__ */ jsx("div", { className: "w-14 h-14 sm:w-16 sm:h-16 bg-white/[0.04] rounded-2xl flex items-center justify-center border border-white/[0.08]", children: /* @__PURE__ */ jsx("img", { src: "/images/logo.png", alt: "Logo", className: "w-8 h-8 sm:w-10 sm:h-10 object-contain" }) }) }),
        /* @__PURE__ */ jsxs("div", { className: "mb-6 sm:mb-10", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-2xl sm:text-3xl font-black text-white tracking-tight mb-2", style: { fontFamily: "'Space Grotesk', 'Inter', sans-serif" }, children: "Sign in" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm", children: "Enter your credentials to access the dashboard." })
        ] }),
        status && /* @__PURE__ */ jsx("div", { className: "p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8", children: status }),
        flash?.error && /* @__PURE__ */ jsx("div", { className: "p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium mb-8", children: flash.error }),
        data.loginMethod === "passcode" ? (
          /* ── Passcode Mode ─────────────────────── */
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "text-center mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "text-2xs text-slate-600 font-black uppercase tracking-[0.3em] mb-6", children: "Enter Passcode" }),
              /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-2.5 mb-6 min-h-[20px]", children: (data.passcode || "").split("").map((_, i) => /* @__PURE__ */ jsx("div", { className: `w-3.5 h-3.5 rounded-full transition-all duration-200 ${displayErrors.passcode ? "bg-red-500 animate-pulse" : "bg-indigo-500 shadow-lg shadow-indigo-500/30"}` }, i)) }),
              displayErrors.passcode && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-sm font-bold", children: displayErrors.passcode })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 max-w-[280px] mx-auto", children: [
              [1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    const c = data.passcode || "";
                    if (c.length < 10) handlePasscodeChange(c + num);
                  },
                  className: "h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xl font-bold text-white hover:bg-white/[0.06] hover:border-white/[0.12] hover:scale-105 active:scale-95 transition-all duration-200",
                  children: num
                },
                num
              )),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: submitPasscode,
                  className: "h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 hover:scale-105 active:scale-95 transition-all",
                  children: /* @__PURE__ */ jsx(ArrowRight, { size: 22 })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => {
                    const c = data.passcode || "";
                    if (c.length < 10) handlePasscodeChange(c + "0");
                  },
                  className: "h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xl font-bold text-white hover:bg-white/[0.06] hover:border-white/[0.12] hover:scale-105 active:scale-95 transition-all duration-200",
                  children: "0"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handlePasscodeChange((data.passcode || "").slice(0, -1)),
                  className: "h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 flex items-center justify-center transition-all active:scale-95",
                  children: /* @__PURE__ */ jsx(X, { size: 22 })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-8 text-center", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setData("loginMethod", "email"),
                className: "text-sm font-medium text-slate-600 hover:text-indigo-400 transition-colors",
                children: "← Back to Email Login"
              }
            ) })
          ] })
        ) : (
          /* ── Email Mode ────────────────────────── */
          /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => window.location.href = route("auth.google"),
                className: "flex items-center justify-center gap-3 w-full py-3.5 sm:py-4 px-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-sm font-bold text-white hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 active:scale-[0.98]",
                children: [
                  /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", children: [
                    /* @__PURE__ */ jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
                    /* @__PURE__ */ jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }),
                    /* @__PURE__ */ jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }),
                    /* @__PURE__ */ jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })
                  ] }),
                  "Continue with Google"
                ]
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center", children: /* @__PURE__ */ jsx("div", { className: "w-full border-t border-white/[0.06]" }) }),
              /* @__PURE__ */ jsx("div", { className: "relative flex justify-center text-2xs", children: /* @__PURE__ */ jsx("span", { className: "px-4 bg-void-950 text-slate-500 font-bold uppercase tracking-widest", children: "or" }) })
            ] }),
            /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-5", children: [
              /* @__PURE__ */ jsx(
                AuthInput,
                {
                  icon: Mail,
                  label: "Email",
                  type: "email",
                  value: data.email,
                  onChange: (e) => setData("email", e.target.value),
                  placeholder: "name@company.com",
                  autoComplete: "username",
                  autoFocus: true,
                  error: displayErrors.email
                }
              ),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: `block text-2xs font-black uppercase tracking-[0.25em] mb-2.5 text-slate-400`, children: "Password" }),
                /* @__PURE__ */ jsxs("div", { className: "relative group", children: [
                  /* @__PURE__ */ jsx("div", { className: "absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500", children: /* @__PURE__ */ jsx(Lock, { size: 18 }) }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: showPassword ? "text" : "password",
                      value: data.password,
                      onChange: (e) => setData("password", e.target.value),
                      placeholder: "••••••••",
                      autoComplete: "current-password",
                      className: "w-full pl-12 pr-12 py-3.5 sm:py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl text-white text-sm placeholder:text-slate-500 outline-none focus:border-indigo-500/40 focus:bg-indigo-500/[0.03] focus:shadow-lg focus:shadow-indigo-900/10 hover:border-white/[0.12] transition-all duration-500"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setShowPassword(!showPassword),
                      className: "absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors",
                      children: showPassword ? /* @__PURE__ */ jsx(EyeOff, { size: 16 }) : /* @__PURE__ */ jsx(Eye, { size: 16 })
                    }
                  )
                ] }),
                displayErrors.password && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-xs mt-2 font-medium", children: displayErrors.password })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("label", { className: "flex items-center cursor-pointer group", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "checkbox",
                      checked: data.remember,
                      onChange: (e) => setData("remember", e.target.checked),
                      className: "w-4 h-4 rounded border-white/10 bg-white/[0.03] text-indigo-600 focus:ring-indigo-500/20 focus:ring-offset-0"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "ml-2.5 text-sm text-slate-400 group-hover:text-slate-200 transition-colors", children: "Remember me" })
                ] }),
                canResetPassword && /* @__PURE__ */ jsx(Link, { href: route("password.request"), className: "text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors", children: "Forgot password?" })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: processing,
                  className: "w-full flex items-center justify-center gap-3 py-3.5 sm:py-4 px-4 bg-white text-void-950 rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed",
                  children: processing ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Loader2, { size: 18, className: "animate-spin" }),
                    " Signing in..."
                  ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                    "Sign In ",
                    /* @__PURE__ */ jsx(ArrowRight, { size: 16 })
                  ] })
                }
              ),
              passcode_login_available && /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  onClick: () => setData("loginMethod", "passcode"),
                  className: "w-full flex items-center justify-center gap-2.5 py-3 sm:py-3.5 px-4 bg-white/[0.03] border border-white/[0.06] text-slate-500 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.1] rounded-2xl font-bold text-sm transition-all active:scale-[0.98]",
                  children: [
                    /* @__PURE__ */ jsx(Grip, { size: 18 }),
                    " Login with Passcode"
                  ]
                }
              )
            ] })
          ] })
        ),
        /* @__PURE__ */ jsx("div", { className: "mt-8 sm:mt-10 text-center", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-slate-400", children: [
          "Don't have an account?",
          " ",
          /* @__PURE__ */ jsx(Link, { href: route("register"), className: "font-bold text-indigo-400 hover:text-indigo-300 transition-colors", children: "Create one for free" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("style", { children: `
                * { font-family: 'Inter', 'Figtree', system-ui, sans-serif; }
            ` })
  ] });
}
export {
  Login as default
};
