import { jsxs, jsx } from "react/jsx-runtime";
import { useState } from "react";
import { usePage, useForm, Head, Link, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { P as PlatformLayout } from "./PlatformLayout-Bffb0vmW.js";
import { ArrowLeft, CheckCircle, User, Mail, Save, Smartphone, Moon, Sun, Type, Key, AlertTriangle, Shield, EyeOff, Eye, Lock, Trash2 } from "lucide-react";
import "marked";
import "axios";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "./ui-Bi1AXgyR.js";
function Edit({ mustVerifyEmail, status }) {
  const {
    store
  } = usePage().props;
  const { auth, settings } = usePage().props;
  const user = auth.user;
  const myRole = usePage().props.my_role || user?.role;
  const needsPasscode = ["owner", "admin", "manager", "accountant", "shift_supervisor"].includes(myRole);
  const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
    name: user.name || "",
    email: user.email || ""
  });
  const { data: passwordData, setData: setPasswordData, put: putPassword, errors: passwordErrors, processing: passwordProcessing, recentlySuccessful: passwordRecentlySuccessful, reset: resetPassword } = useForm({
    current_password: "",
    password: "",
    password_confirmation: ""
  });
  const [passcodeData, setPasscodeData] = useState({
    enable_passcode: user.has_passcode ? true : false,
    passcode: "",
    confirm_passcode: ""
  });
  const [passcodeError, setPasscodeError] = useState("");
  const [passcodeSaved, setPasscodeSaved] = useState(false);
  const [passcodeSaving, setPasscodeSaving] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [securityPinData, setSecurityPinData] = useState({
    enable_security_pin: user.security_pin ? true : false,
    security_pin: "",
    confirm_security_pin: ""
  });
  const [securityPinError, setSecurityPinError] = useState("");
  const [securityPinSaved, setSecurityPinSaved] = useState(false);
  const [securityPinSaving, setSecurityPinSaving] = useState(false);
  const [showSecurityPin, setShowSecurityPin] = useState(false);
  const { delete: destroy, processing: deleteProcessing } = useForm({
    password: ""
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [preferences, setPreferences] = useState({
    // Fall back to the live <html> class: with no saved choice the theme
    // is resolved per-route by ThemeContext, so localStorage may be empty
    // while the app is still rendering in dark.
    dark_mode: localStorage.getItem("amd_theme") ? localStorage.getItem("amd_theme") === "dark" : document.documentElement.classList.contains("dark"),
    senior_mode: settings?.senior_mode === "1"
  });
  const submit = (e) => {
    e.preventDefault();
    if (store) {
      patch(route("store.profile.update", { store_slug: store.slug }));
    } else {
      patch(route("account.update"));
    }
  };
  const submitPassword = (e) => {
    e.preventDefault();
    putPassword(route("password.update"), {
      onSuccess: () => resetPassword()
    });
  };
  const submitPasscode = async (e) => {
    e.preventDefault();
    setPasscodeError("");
    if (passcodeData.enable_passcode) {
      if (!passcodeData.passcode || passcodeData.passcode.length < 4) {
        setPasscodeError("Passcode must be at least 4 digits");
        return;
      }
      if (passcodeData.passcode !== passcodeData.confirm_passcode) {
        setPasscodeError("Passcodes do not match");
        return;
      }
    }
    setPasscodeSaving(true);
    const url = store ? route("store.profile.passcode", { store_slug: store.slug }) : route("account.passcode");
    try {
      await router.post(url, {
        passcode: passcodeData.enable_passcode ? passcodeData.passcode : null
      }, {
        preserveScroll: true,
        onSuccess: () => {
          setPasscodeSaved(true);
          setPasscodeData((prev) => ({ ...prev, passcode: "", confirm_passcode: "" }));
          setTimeout(() => setPasscodeSaved(false), 3e3);
        },
        onError: (errors2) => {
          setPasscodeError(errors2.passcode || "Failed to update passcode");
        }
      });
    } finally {
      setPasscodeSaving(false);
    }
  };
  const submitSecurityPin = async (e) => {
    e.preventDefault();
    setSecurityPinError("");
    if (securityPinData.enable_security_pin) {
      if (!securityPinData.security_pin || securityPinData.security_pin.length !== 6) {
        setSecurityPinError("Security PIN must be exactly 6 digits");
        return;
      }
      if (securityPinData.security_pin !== securityPinData.confirm_security_pin) {
        setSecurityPinError("Security PINs do not match");
        return;
      }
    }
    setSecurityPinSaving(true);
    const url = store ? route("store.profile.security-pin", { store_slug: store.slug }) : route("account.security-pin");
    try {
      await router.post(url, {
        security_pin: securityPinData.enable_security_pin ? securityPinData.security_pin : null
      }, {
        preserveScroll: true,
        onSuccess: () => {
          setSecurityPinSaved(true);
          setSecurityPinData((prev) => ({ ...prev, security_pin: "", confirm_security_pin: "" }));
          setTimeout(() => setSecurityPinSaved(false), 3e3);
        },
        onError: (errors2) => {
          setSecurityPinError(errors2.security_pin || "Failed to update security PIN");
        }
      });
    } finally {
      setSecurityPinSaving(false);
    }
  };
  const deleteAccount = (e) => {
    e.preventDefault();
    const url = store ? route("store.profile.destroy", { store_slug: store.slug }) : route("account.destroy");
    destroy(url, {
      data: { password: deletePassword }
    });
  };
  const toggleDarkMode = () => {
    const newMode = !preferences.dark_mode;
    setPreferences((prev) => ({ ...prev, dark_mode: newMode }));
    localStorage.setItem("amd_theme", newMode ? "dark" : "light");
    if (newMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };
  const toggleSeniorMode = () => {
    const newValue = !preferences.senior_mode;
    setPreferences((prev) => ({ ...prev, senior_mode: newValue }));
    if (store) {
      router.post(route("store.settings.update", {
        store_slug: store.slug
      }), {
        settings: { ...settings, senior_mode: newValue ? "1" : "0" }
      }, { preserveScroll: true });
    }
  };
  const Layout = store ? OneGlanceLayout : PlatformLayout;
  return /* @__PURE__ */ jsxs(Layout, { ...store ? { title: "Profile Settings", activeMenu: "System" } : { title: "Profile Settings" }, children: [
    /* @__PURE__ */ jsx(Head, { title: "Profile Settings" }),
    /* @__PURE__ */ jsx("div", { className: "h-full overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 pb-24", children: [
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: store ? route("store.home", { store_slug: store.slug }) : "/VenQore",
          className: "inline-flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 transition-colors",
          children: [
            /* @__PURE__ */ jsx(ArrowLeft, { size: 16 }),
            "Back to Dashboard"
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold", children: (user.name || user.email).substring(0, 2).toUpperCase() }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "Profile Information" }),
              /* @__PURE__ */ jsx("p", { className: "text-indigo-100 text-sm", children: "Update your account's profile information and email address." })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "p-6 space-y-6", children: [
          recentlySuccessful && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400", children: [
            /* @__PURE__ */ jsx(CheckCircle, { size: 20 }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Profile updated successfully!" })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2", children: [
              /* @__PURE__ */ jsx(User, { size: 14, className: "inline mr-2" }),
              "Name"
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: data.name,
                onChange: (e) => setData("name", e.target.value),
                className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all",
                placeholder: "Your name"
              }
            ),
            errors.name && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-500", children: errors.name })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2", children: [
              /* @__PURE__ */ jsx(Mail, { size: 14, className: "inline mr-2" }),
              "Email"
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                value: data.email,
                onChange: (e) => setData("email", e.target.value),
                className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all",
                placeholder: "your@email.com"
              }
            ),
            errors.email && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-500", children: errors.email })
          ] }),
          mustVerifyEmail && user.email_verified_at === null && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-amber-700 dark:text-amber-400", children: [
              "Your email address is unverified.",
              " ",
              /* @__PURE__ */ jsx(
                Link,
                {
                  href: route("verification.send"),
                  method: "post",
                  as: "button",
                  className: "underline hover:text-amber-900 dark:hover:text-amber-300",
                  children: "Click here to re-send the verification email."
                }
              )
            ] }),
            status === "verification-link-sent" && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-emerald-600 dark:text-emerald-400", children: "A new verification link has been sent to your email address." })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: processing,
              className: "inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(Save, { size: 18 }),
                processing ? "Saving..." : "Save Changes"
              ]
            }
          ) })
        ] })
      ] }),
      store && /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "text-indigo-500" }),
            "Onboarding Setup Progress"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Track the setup steps required to unlock your dashboard analytics." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6 space-y-4", children: /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
          { key: "inventory", label: "Catalog First Product", isDone: usePage().props.onboarding_metrics?.has_products, desc: "Add at least one product to your store inventory.", route: "store.inventory.index" },
          { key: "purchase", label: "Record First Purchase", isDone: usePage().props.onboarding_metrics?.has_purchases, desc: "Add stock to your inventory by recording a purchase.", route: "store.purchases.create" },
          { key: "sale", label: "Record First Sale (POS/Invoice)", isDone: usePage().props.onboarding_metrics?.has_sales, desc: "Make a POS sale or generate a customer invoice.", route: "store.sales.invoice.create" },
          { key: "expense", label: "Record Store Expense", isDone: usePage().props.onboarding_metrics?.has_expenses, desc: "Keep track of daily business costs by adding an expense.", route: "store.expenses.index" },
          { key: "drive_sync", label: "Secure Database (Google Drive)", isDone: usePage().props.onboarding_metrics?.has_drive_sync || !!store?.google_backup_enabled || !!store?.google_connected, desc: "Link your Google Drive for automated database backups.", route: "store.admin.data", tab: "drive_sync" }
        ].map((item, idx) => /* @__PURE__ */ jsxs("div", { className: `p-4 rounded-2xl border transition-all ${item.isDone ? "bg-emerald-500/5 border-emerald-100 dark:border-emerald-950/50" : "bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800"}`, children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: `mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${item.isDone ? "bg-emerald-500/15 text-emerald-500" : "bg-slate-200 dark:bg-slate-700 text-slate-400"}`, children: item.isDone ? /* @__PURE__ */ jsx(CheckCircle, { size: 12, className: "fill-emerald-500/10" }) : /* @__PURE__ */ jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: `font-bold text-sm ${item.isDone ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-700 dark:text-slate-200"}`, children: item.label }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed", children: item.desc })
              ] })
            ] }),
            /* @__PURE__ */ jsx("span", { className: `text-2xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${item.isDone ? "bg-emerald-500/10 text-emerald-500" : "bg-indigo-500/10 text-indigo-500"}`, children: item.isDone ? "Done" : "Pending" })
          ] }),
          !item.isDone && /* @__PURE__ */ jsx("div", { className: "mt-3 flex justify-end", children: /* @__PURE__ */ jsx(
            Link,
            {
              href: route(item.route, { store_slug: store.slug, ...item.tab ? { tab: item.tab } : {} }),
              className: "text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1",
              children: "Start Task →"
            }
          ) })
        ] }, idx)) }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Smartphone, { size: 20, className: "text-indigo-500" }),
            "Personal Preferences"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Customize your experience with these personal settings." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center", children: preferences.dark_mode ? /* @__PURE__ */ jsx(Moon, { size: 20, className: "text-indigo-500" }) : /* @__PURE__ */ jsx(Sun, { size: 20, className: "text-amber-500" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: "Dark Mode" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Switch between light and dark themes" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: toggleDarkMode,
                className: `relative w-14 h-7 rounded-full transition-all duration-300 ${preferences.dark_mode ? "bg-indigo-600 shadow-lg shadow-indigo-500/30" : "bg-slate-300 dark:bg-slate-600"}`,
                children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${preferences.dark_mode ? "left-8" : "left-1"}` })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center", children: /* @__PURE__ */ jsx(Type, { size: 20, className: "text-indigo-500" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: "Senior Mode (Large Text)" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Increase text size for better readability" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: toggleSeniorMode,
                className: `relative w-14 h-7 rounded-full transition-all duration-300 ${preferences.senior_mode ? "bg-indigo-600 shadow-lg shadow-indigo-500/30" : "bg-slate-300 dark:bg-slate-600"}`,
                children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${preferences.senior_mode ? "left-8" : "left-1"}` })
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Key, { size: 20, className: "text-indigo-500" }),
            "Personal Passcode (Quick Login PIN)"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Set up a 4-6 digit PIN for quick login instead of email/password." })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submitPasscode, className: "p-6 space-y-6", children: [
          passcodeSaved && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400", children: [
            /* @__PURE__ */ jsx(CheckCircle, { size: 20 }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Passcode updated successfully!" })
          ] }),
          passcodeError && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 20 }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: passcodeError })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Shield, { size: 20, className: "text-indigo-600" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: "Enable Quick Login PIN" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: user.has_passcode ? "You have a passcode set. Update or disable it below." : "No passcode set yet." })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setPasscodeData((prev) => ({ ...prev, enable_passcode: !prev.enable_passcode })),
                className: `relative w-14 h-7 rounded-full transition-all duration-300 ${passcodeData.enable_passcode ? "bg-indigo-600 shadow-lg shadow-indigo-500/30" : "bg-slate-300 dark:bg-slate-600"}`,
                children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${passcodeData.enable_passcode ? "left-8" : "left-1"}` })
              }
            )
          ] }),
          passcodeData.enable_passcode && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-top-2 duration-300", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2", children: "New Passcode (4-6 digits)" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: showPasscode ? "text" : "password",
                      value: passcodeData.passcode,
                      onChange: (e) => setPasscodeData((prev) => ({ ...prev, passcode: e.target.value.replace(/\D/g, "").slice(0, 6) })),
                      className: "w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono tracking-[0.5em] text-center text-lg",
                      placeholder: "••••••",
                      maxLength: 6
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setShowPasscode(!showPasscode),
                      className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600",
                      children: showPasscode ? /* @__PURE__ */ jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsx(Eye, { size: 18 })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2", children: "Confirm Passcode" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: showPasscode ? "text" : "password",
                    value: passcodeData.confirm_passcode,
                    onChange: (e) => setPasscodeData((prev) => ({ ...prev, confirm_passcode: e.target.value.replace(/\D/g, "").slice(0, 6) })),
                    className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono tracking-[0.5em] text-center text-lg",
                    placeholder: "••••••",
                    maxLength: 6
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-indigo-700 dark:text-indigo-300", children: [
              /* @__PURE__ */ jsx("strong", { children: "Tip:" }),
              " This PIN allows you to quickly log in from the login screen using just a 4-6 digit code instead of your email and password."
            ] }) })
          ] }),
          (passcodeData.enable_passcode || user.has_passcode) && /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: passcodeSaving,
              className: `inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 ${passcodeData.enable_passcode ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30" : "bg-red-500 hover:bg-red-600 shadow-red-500/30"}`,
              children: [
                /* @__PURE__ */ jsx(Key, { size: 18 }),
                passcodeSaving ? "Saving..." : passcodeData.enable_passcode ? user.has_passcode ? "Update Passcode" : "Save Passcode" : "Disable Passcode"
              ]
            }
          ) })
        ] })
      ] }),
      needsPasscode && /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden", id: "security-pin-section", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800 bg-violet-50/30 dark:bg-violet-900/10", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Shield, { size: 20, className: "text-violet-600" }),
            "Security Passcode (Transaction PIN)"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Set up a mandatory 6-digit PIN for sensitive tasks like adding capital, deleting records, or changing settings." })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submitSecurityPin, className: "p-6 space-y-6", children: [
          securityPinSaved && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400", children: [
            /* @__PURE__ */ jsx(CheckCircle, { size: 20 }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Security PIN updated successfully!" })
          ] }),
          securityPinError && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-red-600 dark:text-red-400", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 20 }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: securityPinError })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Lock, { size: 20, className: "text-violet-600" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white", children: "Enable Transaction Security" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: user.security_pin ? "Security PIN is currently active." : "Security PIN is not set yet." })
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setSecurityPinData((prev) => ({ ...prev, enable_security_pin: !prev.enable_security_pin })),
                className: `relative w-14 h-7 rounded-full transition-all duration-300 ${securityPinData.enable_security_pin ? "bg-violet-600 shadow-lg shadow-violet-500/30" : "bg-slate-300 dark:bg-slate-600"}`,
                children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-300 ${securityPinData.enable_security_pin ? "left-8" : "left-1"}` })
              }
            )
          ] }),
          securityPinData.enable_security_pin && /* @__PURE__ */ jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-top-2 duration-300", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2", children: "New Security PIN (Exactly 6 digits)" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: showSecurityPin ? "text" : "password",
                      value: securityPinData.security_pin,
                      onChange: (e) => setSecurityPinData((prev) => ({ ...prev, security_pin: e.target.value.replace(/\D/g, "").slice(0, 6) })),
                      className: "w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-mono tracking-[0.5em] text-center text-lg",
                      placeholder: "••••••",
                      maxLength: 6
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => setShowSecurityPin(!showSecurityPin),
                      className: "absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600",
                      children: showSecurityPin ? /* @__PURE__ */ jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsx(Eye, { size: 18 })
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2", children: "Confirm Security PIN" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: showSecurityPin ? "text" : "password",
                    value: securityPinData.confirm_security_pin,
                    onChange: (e) => setSecurityPinData((prev) => ({ ...prev, confirm_security_pin: e.target.value.replace(/\D/g, "").slice(0, 6) })),
                    className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all font-mono tracking-[0.5em] text-center text-lg",
                    placeholder: "••••••",
                    maxLength: 6
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl", children: /* @__PURE__ */ jsxs("p", { className: "text-sm text-violet-700 dark:text-violet-300", children: [
              /* @__PURE__ */ jsx("strong", { children: "Safety First:" }),
              " This PIN is separate from your login code. It provides an extra layer of protection for your business capital and sensitive records."
            ] }) })
          ] }),
          (securityPinData.enable_security_pin || user.security_pin) && /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: securityPinSaving,
              className: `inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 ${securityPinData.enable_security_pin ? "bg-violet-600 hover:bg-violet-700 shadow-violet-500/30" : "bg-red-500 hover:bg-red-600 shadow-red-500/30"}`,
              children: [
                /* @__PURE__ */ jsx(Shield, { size: 18 }),
                securityPinSaving ? "Saving..." : securityPinData.enable_security_pin ? user.security_pin ? "Update Security PIN" : "Save Security PIN" : "Disable Security PIN"
              ]
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-slate-100 dark:border-slate-800", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Lock, { size: 20, className: "text-indigo-500" }),
            "Update Password"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Ensure your account is using a long, random password to stay secure." })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: submitPassword, className: "p-6 space-y-6", children: [
          passwordRecentlySuccessful && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-400", children: [
            /* @__PURE__ */ jsx(CheckCircle, { size: 20 }),
            /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Password updated successfully!" })
          ] }),
          !user.google_id && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2", children: "Current Password" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                value: passwordData.current_password,
                onChange: (e) => setPasswordData("current_password", e.target.value),
                className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              }
            ),
            passwordErrors.current_password && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-500", children: passwordErrors.current_password })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2", children: "New Password" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                value: passwordData.password,
                onChange: (e) => setPasswordData("password", e.target.value),
                className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              }
            ),
            passwordErrors.password && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-500", children: passwordErrors.password })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-200 mb-2", children: "Confirm Password" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "password",
                value: passwordData.password_confirmation,
                onChange: (e) => setPasswordData("password_confirmation", e.target.value),
                className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              }
            ),
            passwordErrors.password_confirmation && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-red-500", children: passwordErrors.password_confirmation })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxs(
            "button",
            {
              type: "submit",
              disabled: passwordProcessing,
              className: "inline-flex items-center gap-2 px-6 py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(Lock, { size: 18 }),
                passwordProcessing ? "Updating..." : "Update Password"
              ]
            }
          ) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-red-200 dark:border-red-900/50 overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-6 border-b border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10", children: [
          /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { size: 20 }),
            "Danger Zone"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-red-500/80 mt-1", children: "Once you delete your account, there is no going back. Please be certain." })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-6", children: /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowDeleteModal(true),
            className: "inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all",
            children: [
              /* @__PURE__ */ jsx(Trash2, { size: 18 }),
              "Delete Account"
            ]
          }
        ) })
      ] })
    ] }) }),
    showDeleteModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 m-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-800 dark:text-white mb-4", children: "Are you sure?" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mb-6", children: "Once your account is deleted, all of its resources and data will be permanently deleted. Please enter your password to confirm." }),
      /* @__PURE__ */ jsxs("form", { onSubmit: deleteAccount, children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "password",
            value: deletePassword,
            onChange: (e) => setDeletePassword(e.target.value),
            placeholder: "Enter your password",
            className: "w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all mb-4"
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-end", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setShowDeleteModal(false),
              className: "px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: deleteProcessing,
              className: "px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-all disabled:opacity-50",
              children: deleteProcessing ? "Deleting..." : "Delete Account"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
}
export {
  Edit as default
};
