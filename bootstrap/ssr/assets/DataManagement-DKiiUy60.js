import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { createPortal } from "react-dom";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { usePage, useForm, Head, router } from "@inertiajs/react";
import axios from "axios";
import { Archive, FileText, FileSpreadsheet, Grid, Database, HardDrive, Cloud, Download, Upload, ShieldCheck, RefreshCw, Unlink, Link2, Check, FileType, ArrowRight, CheckSquare, Plus, AlertTriangle, Loader2 } from "lucide-react";
import { M as MidnightNebula } from "./MidnightNebula-BQ5hjMmA.js";
import { P as PremiumSelect } from "./PremiumSelect-BaeCSgsA.js";
import { u as useAlert } from "../ssr.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "./plans-CxabWI_P.js";
import "./runtime-DwSFgQZq.js";
import "./Input-BO7OpFmF.js";
import "./AiIsland-Ccw9HuV0.js";
import "motion/react";
import "./ThinkingOrb-DGYTy5s1.js";
import "laravel-echo";
import "pusher-js";
import "dexie";
import "driver.js";
import "./utils-H80jjgLf.js";
import "clsx";
import "tailwind-merge";
import "@inertiajs/react/server";
import "react-dom/server";
import "@headlessui/react";
function DataManagement() {
  const { store, googleBackups = [], backups: initialBackupsList = [], autoBackupEnabled = true } = usePage().props;
  const { showConfirm, showAlert } = useAlert();
  const tt = useTermText();
  const csrfToken = typeof document !== "undefined" ? document.querySelector('meta[name="csrf-token"]')?.getAttribute("content") : "";
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const [activeTab, setActiveTab] = useState(urlParams?.get("tab") || "drive_sync");
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [selectedExports, setSelectedExports] = useState([]);
  const [uploadingBackup, setUploadingBackup] = useState(false);
  const [syncingToDrive, setSyncingToDrive] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(null);
  const renderPortal = (content) => {
    if (typeof document === "undefined") return null;
    return createPortal(content, document.body);
  };
  const driveForm = useForm({
    google_backup_enabled: store?.google_backup_enabled ?? false,
    google_backup_retention: store?.google_backup_retention ?? 7
  });
  const formatBytes = (bytes) => {
    if (!bytes) return "N/A";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };
  const handleGoogleRestore = (fileId, fileName) => {
    showConfirm({
      title: "Restore from Google Drive?",
      text: `This will download "${fileName}" from Google Drive and completely replace all your current store data. This operation CANNOT be undone!`,
      icon: "warning",
      onConfirm: () => {
        setActionInProgress(fileId);
        router.post(route("store.google.backup.restore", { store_slug: store?.slug, fileId }), {}, {
          onSuccess: () => {
            showAlert({
              title: "Success",
              message: "Store data restored directly from Google Drive backup successfully!",
              type: "success"
            });
          },
          onFinish: () => setActionInProgress(null)
        });
      }
    });
  };
  const handleGoogleDelete = (fileId, fileName) => {
    showConfirm({
      title: "Delete from Google Drive?",
      text: `Are you sure you want to delete "${fileName}" from your Google Drive folder?`,
      icon: "warning",
      onConfirm: () => {
        setActionInProgress(fileId);
        router.post(route("store.google.backup.delete", { store_slug: store?.slug, fileId }), {}, {
          onFinish: () => setActionInProgress(null)
        });
      }
    });
  };
  const getEstimatedTotalStorage = () => {
    const avgSize = googleBackups.length > 0 ? googleBackups.reduce((acc, f) => acc + (parseInt(f.size) || 0), 0) / googleBackups.length : 5e5;
    return formatBytes(avgSize * driveForm.data.google_backup_retention);
  };
  const handleGoogleSettingsChange = (fields) => {
    const updatedData = {
      google_backup_enabled: driveForm.data.google_backup_enabled,
      google_backup_retention: driveForm.data.google_backup_retention,
      ...fields
    };
    Object.entries(fields).forEach(([k, v]) => driveForm.setData(k, v));
    router.post(route("store.google.settings", { store_slug: store?.slug }), updatedData, {
      preserveScroll: true
    });
  };
  const handleGoogleSyncNow = () => {
    setSyncingToDrive(true);
    router.post(route("store.google.sync-now", { store_slug: store?.slug }), {}, {
      preserveScroll: true,
      onFinish: () => setSyncingToDrive(false)
    });
  };
  const [importType, setImportType] = useState("products");
  const { data, setData, post, processing, errors, reset } = useForm({
    file: null,
    type: "products"
  });
  const exportOptions = [
    { id: "products", label: tt("Products & Stock"), description: "Inventory, prices, levels", icon: Archive, color: "text-blue-500" },
    { id: "parties", label: "Contacts", description: tt("Customers & Suppliers"), icon: FileText, color: "text-emerald-500" },
    { id: "sales", label: "Sales History", description: "Invoices & Transactions", icon: FileSpreadsheet, color: "text-brand-500" },
    { id: "purchases", label: "Purchases", description: "Orders & Bills", icon: Grid, color: "text-orange-500" },
    { id: "expenses", label: "Expenses", description: "Records & Categories", icon: FileText, color: "text-rose-500" },
    { id: "transactions", label: "Ledger", description: "All financial movements", icon: Database, color: "text-brand-500" }
  ];
  const toggleExport = (id) => {
    if (selectedExports.includes(id)) {
      setSelectedExports((prev) => prev.filter((item) => item !== id));
    } else {
      setSelectedExports((prev) => [...prev, id]);
    }
  };
  const handleSelectAll = () => {
    if (selectedExports.length === exportOptions.length) {
      setSelectedExports([]);
    } else {
      setSelectedExports(exportOptions.map((o) => o.id));
    }
  };
  const handleExport = (e) => {
    e.preventDefault();
    if (selectedExports.length === 0) return;
    if (selectedExports.length > 1) {
      alert("Bulk export coming soon. Please select one type at a time.");
      return;
    }
    const form = document.createElement("form");
    form.method = "POST";
    form.action = route("store.admin.data.export", { store_slug: store?.slug });
    const csrfToken2 = document.querySelector('meta[name="csrf-token"]').getAttribute("content");
    const csrfInput = document.createElement("input");
    csrfInput.type = "hidden";
    csrfInput.name = "_token";
    csrfInput.value = csrfToken2;
    form.appendChild(csrfInput);
    const typeInput = document.createElement("input");
    typeInput.type = "hidden";
    typeInput.name = "type";
    typeInput.value = selectedExports[0];
    form.appendChild(typeInput);
    const formatInput = document.createElement("input");
    formatInput.type = "hidden";
    formatInput.name = "format";
    formatInput.value = exportFormat;
    form.appendChild(formatInput);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };
  const handleImportSubmit = (e) => {
    e.preventDefault();
    post(route("store.admin.data.upload-mapping", { store_slug: store?.slug }), {
      onSuccess: () => {
      },
      onError: (err) => console.error(err)
    });
  };
  const handleBackupUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showConfirm({
      title: "Confirm",
      message: tt("WARNING: Restoring a full system backup (.vq) will COMPLETELY OVERWRITE all products, transactions, stock, cash in hand, and configuration settings in this store. This cannot be undone. Are you sure you want to proceed?"),
      type: "warning",
      confirmLabel: "Yes, Continue",
      cancelLabel: "Cancel",
      onConfirm: () => {
        setUploadingBackup(true);
        const formData = new FormData();
        formData.append("file", file);
        router.post(route("store.backup.import", { store_slug: store?.slug }), formData, {
          forceFormData: true,
          onSuccess: () => {
            showAlert({
              title: "Success",
              message: "Store restored successfully!",
              type: "success"
            });
          },
          onFinish: () => setUploadingBackup(false)
        });
      }
    });
  };
  const downloadTemplate = () => {
    window.location.href = route("store.admin.data.template", { store_slug: store?.slug, type: importType, format: "xlsx" });
  };
  const [backupsList, setBackupsList] = useState(initialBackupsList);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const autoBackupForm = useForm({ auto_backup: !!autoBackupEnabled });
  const createBackupNow = () => {
    setCreatingBackup(true);
    router.post(route("store.backups.store", { store_slug: store?.slug }), {}, {
      preserveScroll: true,
      onSuccess: () => {
        showAlert({ title: "Success", message: "Backup created successfully.", type: "success" });
      },
      onFinish: () => setCreatingBackup(false)
    });
  };
  const handleBackupRestoreFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    showConfirm({
      title: "Restore database from this file?",
      message: "WARNING: All current data will be OVERWRITTEN by this backup. This cannot be undone. Are you sure you want to proceed?",
      type: "warning",
      confirmLabel: "Yes, Restore",
      cancelLabel: "Cancel",
      onConfirm: () => {
        setRestoringBackup(true);
        const formData = new FormData();
        formData.append("backup_file", file);
        router.post(route("store.backups.restore", { store_slug: store?.slug }), formData, {
          forceFormData: true,
          onSuccess: () => {
            showAlert({ title: "Success", message: "Database restored successfully! Reloading...", type: "success" });
            setTimeout(() => window.location.reload(), 1500);
          },
          onFinish: () => setRestoringBackup(false)
        });
      }
    });
    e.target.value = null;
  };
  const toggleAutoBackup = (enabled) => {
    autoBackupForm.setData("auto_backup", enabled);
    router.post(route("store.admin.settings.update", { store_slug: store?.slug }), { auto_backup: enabled ? "1" : "0" }, { preserveScroll: true });
  };
  const [migrationFile, setMigrationFile] = useState(null);
  const [migrationStep, setMigrationStep] = useState("upload");
  const [migrationAnalysis, setMigrationAnalysis] = useState(null);
  const [migrationError, setMigrationError] = useState(null);
  const [migrationLog, setMigrationLog] = useState([]);
  const handleMigrationFileChange = (e) => {
    if (e.target.files[0]) {
      setMigrationFile(e.target.files[0]);
      setMigrationError(null);
    }
  };
  const handleMigrationAnalyze = () => {
    if (!migrationFile) return;
    setMigrationStep("analyzing");
    const formData = new FormData();
    formData.append("file", migrationFile);
    axios.post(route("store.legacy.admin.migration.analyze", { store_slug: store?.slug }), formData, {
      headers: { "Content-Type": "multipart/form-data" }
    }).then((res) => {
      if (res.data.success) {
        setMigrationAnalysis(res.data);
        setMigrationStep("review");
      } else {
        setMigrationError(res.data.message);
        setMigrationStep("upload");
      }
    }).catch((err) => {
      setMigrationError(err.response?.data?.message || "Failed to analyze file.");
      setMigrationStep("upload");
    });
  };
  const handleMigrationExecute = () => {
    if (!migrationAnalysis) return;
    setMigrationStep("importing");
    axios.post(route("store.legacy.admin.migration.execute", { store_slug: store?.slug }), {
      path: migrationAnalysis.path
    }).then((res) => {
      if (res.data.success) {
        setMigrationLog(res.data.log);
        setMigrationStep("results");
      } else {
        setMigrationError(res.data.message);
        setMigrationStep("review");
      }
    }).catch((err) => {
      setMigrationError(err.response?.data?.message || "Import failed.");
      setMigrationStep("review");
    });
  };
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "System Data Center", activeMenu: "Data Management", mode: "admin", children: [
    /* @__PURE__ */ jsx(Head, { title: "Data Management" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-[1600px] mx-auto h-full flex flex-col gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-ink flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Database, { className: "text-brand-500" }),
            "Data Operations"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "Securely import, export, and manage system records" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex bg-sunken p-1 rounded-xl gap-1", children: [
          { id: "backups", label: "Backups", icon: HardDrive },
          { id: "drive_sync", label: "Cloud Sync", icon: Cloud },
          { id: "export", label: "Export Data", icon: Download },
          { id: "import", label: "Import Data", icon: Upload },
          { id: "backup", label: "Full System", icon: ShieldCheck },
          { id: "migrate", label: "Migrate", icon: RefreshCw }
        ].map((tab) => /* @__PURE__ */ jsxs(
          "button",
          {
            id: tab.id === "import" ? "tour-import-tab" : void 0,
            onClick: () => setActiveTab(tab.id),
            className: `flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id ? "bg-sunken text-brand-600 dark:text-brand-400 shadow-sm" : "text-ink-muted hover:text-ink-secondary dark:hover:text-neutral-300"}`,
            children: [
              /* @__PURE__ */ jsx(tab.icon, { size: 16 }),
              tab.label
            ]
          },
          tab.id
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-slower", children: [
        activeTab === "drive_sync" && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-6 animate-in fade-in duration-slow", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1 space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500", children: /* @__PURE__ */ jsx(Cloud, { size: 22 }) }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-ink flex items-center gap-2", children: [
                    "Google Drive Automated Backups",
                    store.google_connected && /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-full text-2xs font-bold tracking-widest text-emerald-600 bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 animate-pulse", children: "CONNECTED & ACTIVE" })
                  ] }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1 leading-relaxed", children: "Link your Google account to automatically sync your encrypted store database every night. VenQore limits its access to only write files inside its own folder, keeping your personal Drive items 100% private." })
                ] })
              ] }),
              store.google_connected && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-6 pt-4 border-t border-line text-xs", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-ink-secondary", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-medium text-ink-muted", children: "Connected Account:" }),
                  /* @__PURE__ */ jsx("span", { className: "font-bold", children: store.google_backup_email })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
                  /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 cursor-pointer select-none", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "checkbox",
                        checked: driveForm.data.google_backup_enabled,
                        onChange: (e) => handleGoogleSettingsChange({ google_backup_enabled: e.target.checked }),
                        className: "rounded border-line dark:border-line text-brand-600 focus:ring-brand-500"
                      }
                    ),
                    /* @__PURE__ */ jsx("span", { className: "font-bold text-ink-secondary dark:text-ink", children: "Daily Auto-Backup" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-medium text-ink-muted", children: "Keep last:" }),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: driveForm.data.google_backup_retention,
                        onChange: (e) => handleGoogleSettingsChange({ google_backup_retention: parseInt(e.target.value) }),
                        className: "px-2.5 py-1 rounded-lg border border-line bg-app text-xs font-bold text-ink-secondary dark:text-ink focus:outline-none focus:ring-2 focus:ring-brand-500",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: 7, children: "7 backups" }),
                          /* @__PURE__ */ jsx("option", { value: 14, children: "14 backups" }),
                          /* @__PURE__ */ jsx("option", { value: 30, children: "30 backups" })
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs("span", { className: "text-ink-muted text-1xs ml-1", children: [
                      "(Est. total size: ~",
                      getEstimatedTotalStorage(),
                      ")"
                    ] })
                  ] })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex shrink-0 gap-3 w-full md:w-auto", children: store.google_connected ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: handleGoogleSyncNow,
                  disabled: syncingToDrive,
                  className: "flex-1 md:flex-none px-5 py-3 border-2 border-brand-200 dark:border-brand-800/50 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl font-bold text-xs uppercase tracking-wider text-ink-secondary transition-colors flex items-center justify-center gap-1.5",
                  children: [
                    syncingToDrive ? /* @__PURE__ */ jsx(RefreshCw, { className: "animate-spin", size: 14 }) : /* @__PURE__ */ jsx(RefreshCw, { size: 14 }),
                    syncingToDrive ? "Uploading..." : "Sync Now"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("form", { action: route("store.google.disconnect", { store_slug: store?.slug }), method: "POST", className: "flex-1 md:flex-none", children: [
                /* @__PURE__ */ jsx("input", { type: "hidden", name: "_token", value: csrfToken }),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "submit",
                    className: "w-full px-5 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                    children: [
                      /* @__PURE__ */ jsx(Unlink, { size: 14 }),
                      " Disconnect"
                    ]
                  }
                )
              ] })
            ] }) : /* @__PURE__ */ jsxs(
              "a",
              {
                href: route("store.google.redirect", { store_slug: store?.slug }),
                className: "w-full md:w-auto px-6 py-4 bg-gradient-to-r from-blue-600 to-brand-600 hover:from-blue-500 hover:to-brand-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest text-center shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 whitespace-nowrap",
                children: [
                  /* @__PURE__ */ jsx(Link2, { size: 16 }),
                  " Link Google Drive"
                ]
              }
            ) })
          ] }),
          store.google_connected && /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-8 shadow-sm flex-1 flex flex-col min-h-[400px]", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-line font-bold", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-ink flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Database, { className: "text-brand-500", size: 20 }),
                  "Google Drive Backup Vault"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs font-normal text-ink-muted mt-1", children: "Manage and restore historical database checkpoints stored directly on your cloud drive." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "px-3 py-1.5 bg-sunken rounded-xl text-xs font-bold text-ink-secondary", children: [
                googleBackups.length,
                " of ",
                driveForm.data.google_backup_retention,
                " backup slots used"
              ] })
            ] }),
            googleBackups.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-center p-8", children: [
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-sunken flex items-center justify-center text-ink-muted mb-4 animate-bounce", children: /* @__PURE__ */ jsx(Cloud, { size: 28 }) }),
              /* @__PURE__ */ jsx("h4", { className: "font-bold text-ink-secondary", children: "No backups found on Google Drive" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted max-w-sm mt-2", children: 'Click "Sync Now" above to upload your first database backup checkpoint directly into your VenQore folder.' })
            ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-line text-xs font-bold uppercase tracking-wider text-ink-muted", children: [
                /* @__PURE__ */ jsx("th", { className: "pb-3 pl-2", children: "Filename" }),
                /* @__PURE__ */ jsx("th", { className: "pb-3", children: "Created At" }),
                /* @__PURE__ */ jsx("th", { className: "pb-3", children: "File Size" }),
                /* @__PURE__ */ jsx("th", { className: "pb-3 text-right pr-2", children: "Actions" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line text-sm", children: googleBackups.map((file) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover group", children: [
                /* @__PURE__ */ jsx("td", { className: "py-4 pl-2 font-bold text-ink-secondary dark:text-ink max-w-[400px] truncate", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Cloud, { className: "text-blue-500 shrink-0", size: 16 }),
                  file.name
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "py-4 text-ink-muted", children: new Date(file.createdTime).toLocaleString() }),
                /* @__PURE__ */ jsx("td", { className: "py-4 text-ink-muted", children: formatBytes(file.size) }),
                /* @__PURE__ */ jsx("td", { className: "py-4 text-right pr-2", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-end items-center gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleGoogleRestore(file.id, file.name),
                      disabled: actionInProgress !== null,
                      className: "px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white rounded-lg font-bold text-xs transition-colors",
                      children: actionInProgress === file.id ? "Restoring..." : "Restore"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "a",
                    {
                      href: route("store.google.backup.download", { store_slug: store?.slug, fileId: file.id }),
                      className: "px-3 py-1.5 bg-brand-500/10 hover:bg-brand-500 text-brand-600 dark:text-brand-400 hover:text-white rounded-lg font-bold text-xs transition-colors",
                      children: "Download"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleGoogleDelete(file.id, file.name),
                      disabled: actionInProgress !== null,
                      className: "px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-600 dark:text-red-400 hover:text-white rounded-lg font-bold text-xs transition-colors",
                      children: actionInProgress === file.id ? "Deleting..." : "Delete"
                    }
                  )
                ] }) })
              ] }, file.id)) })
            ] }) })
          ] })
        ] }),
        activeTab === "export" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 h-full", children: [
          /* @__PURE__ */ jsx("div", { className: "lg:col-span-8 flex flex-col gap-4 min-h-0", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-6 flex flex-col h-full shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-ink flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 text-xs font-bold", children: "1" }),
                "Select Data Entities"
              ] }),
              /* @__PURE__ */ jsx("button", { onClick: handleSelectAll, className: "text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline", children: selectedExports.length === exportOptions.length ? "Deselect All" : "Select All" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pr-2", children: exportOptions.map((option) => {
              const isSelected = selectedExports.includes(option.id);
              return /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => toggleExport(option.id),
                  className: `relative p-5 rounded-2xl border-2 text-left transition-all group ${isSelected ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20" : "border-line hover:border-brand-200 dark:hover:border-brand-900/50 bg-sunken/50 dark:bg-surface"}`,
                  children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start mb-3", children: [
                      /* @__PURE__ */ jsx("div", { className: `p-2.5 rounded-xl ${isSelected ? "bg-brand-600 text-white" : "bg-surface " + option.color} shadow-sm transition-colors`, children: /* @__PURE__ */ jsx(option.icon, { size: 20 }) }),
                      /* @__PURE__ */ jsx("div", { className: `w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? "border-brand-600 bg-brand-600 text-white" : "border-line dark:border-line"}`, children: isSelected && /* @__PURE__ */ jsx(Check, { size: 12, strokeWidth: 4 }) })
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: `font-bold text-sm mb-1 ${isSelected ? "text-brand-900 dark:text-white" : "text-ink-secondary dark:text-ink"}`, children: option.label }),
                    /* @__PURE__ */ jsx("p", { className: `text-xs ${isSelected ? "text-brand-700/80 dark:text-brand-300/80" : "text-ink-muted"}`, children: option.description })
                  ]
                },
                option.id
              );
            }) })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "lg:col-span-4 flex flex-col gap-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-6 shadow-sm", children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-ink flex items-center gap-2 mb-6", children: [
                /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 text-xs font-bold", children: "2" }),
                "Format & Export"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-ink-muted uppercase mb-2 block", children: "Export Format" }),
                  /* @__PURE__ */ jsx("div", { className: "grid grid-cols-3 gap-2", children: ["xlsx", "csv", "pdf"].map((fmt) => /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => setExportFormat(fmt),
                      className: `py-3 px-2 rounded-xl border-2 text-xs font-bold uppercase transition-all flex flex-col items-center gap-1
 ${exportFormat === fmt ? "border-brand-600 bg-brand-600 text-white shadow-lg " : "border-line text-ink-muted hover:border-brand-300 dark:hover:border-brand-700"}
`,
                      children: [
                        /* @__PURE__ */ jsx(FileType, { size: 16 }),
                        fmt
                      ]
                    },
                    fmt
                  )) })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "py-4" }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: handleExport,
                    disabled: selectedExports.length === 0,
                    className: "w-full py-4 bg-gradient-brand disabled:bg-none disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 group",
                    children: selectedExports.length === 0 ? "Select Data First" : /* @__PURE__ */ jsxs(Fragment, { children: [
                      "Export Now ",
                      /* @__PURE__ */ jsx(ArrowRight, { size: 20, className: "group-hover:translate-x-1 transition-transform" })
                    ] })
                  }
                ),
                /* @__PURE__ */ jsx("p", { className: "text-center text-xs text-ink-muted mt-3 font-medium", children: selectedExports.length > 0 ? `${selectedExports.length} modules selected` : "No modules selected" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(MidnightNebula, { className: "rounded-2xl p-6", primaryColor: "indigo", secondaryColor: "purple", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4", children: [
              /* @__PURE__ */ jsx("div", { className: "p-3 bg-white/10 rounded-xl backdrop-blur-sm", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "text-white", size: 24 }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "font-bold text-white mb-1", children: "Secure Export" }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-brand-100 leading-relaxed opacity-90", children: [
                  "Exported files contain sensitive business data. Please ensure they are stored securely.",
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("br", {}),
                  /* @__PURE__ */ jsx("strong", { children: "Pro Tip:" }),
                  " Use XLSX for re-importing data."
                ] })
              ] })
            ] }) })
          ] })
        ] }),
        activeTab === "import" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 h-full", children: [
          /* @__PURE__ */ jsx("div", { className: "lg:col-span-7 flex flex-col gap-6", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleImportSubmit, className: "bg-surface border border-line rounded-2xl p-8 flex flex-col gap-6 flex-1 shadow-sm", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-ink flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-xs font-bold", children: "1" }),
              "Upload Data File"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-ink-muted uppercase mb-2 block", children: "Target Module" }),
                /* @__PURE__ */ jsx("div", { id: "tour-import-type", children: /* @__PURE__ */ jsx(
                  PremiumSelect,
                  {
                    options: exportOptions.map((opt) => ({ id: opt.id, name: opt.label })),
                    value: data.type,
                    onChange: (val) => {
                      setData("type", val);
                      setImportType(val);
                    },
                    searchable: false,
                    className: "w-full text-lg"
                  }
                ) })
              ] }),
              /* @__PURE__ */ jsxs("div", { id: "tour-import-upload-zone", className: "relative group cursor-pointer", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    onChange: (e) => setData("file", e.target.files[0]),
                    className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10",
                    accept: ".csv, .xlsx, .xls"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "w-full h-64 rounded-2xl border-2 border-dashed border-line dark:border-line bg-app flex flex-col items-center justify-center gap-4 group-hover:border-brand-500 group-hover:bg-brand-50 dark:group-hover:bg-brand-900/10 transition-all", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-surface rounded-2xl shadow-sm flex items-center justify-center transition-transform text-brand-500", children: /* @__PURE__ */ jsx(Upload, { size: 32 }) }),
                  /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-ink-secondary dark:text-white text-lg", children: data.file ? data.file.name : "Drag & Drop or Click to Upload" }),
                    /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted mt-1", children: "Supports XLSX, CSV (Max 10MB)" })
                  ] })
                ] })
              ] })
            ] }),
            data.file && /* @__PURE__ */ jsxs("div", { className: "p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-3 animate-in slide-in-from-top-2", children: [
              /* @__PURE__ */ jsx(CheckCircle, { className: "text-emerald-500", size: 24 }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-emerald-800 dark:text-emerald-300 text-sm", children: "File Ready for Processing" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-emerald-600 dark:text-emerald-400", children: "The system will update existing records matching unique IDs." })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-auto", children: /* @__PURE__ */ jsx(
              "button",
              {
                id: "tour-import-submit",
                type: "submit",
                disabled: !data.file || processing,
                className: "w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-sunken disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95",
                children: processing ? /* @__PURE__ */ jsx("div", { className: "w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(RefreshCw, { size: 20 }),
                  " Start Import Process"
                ] })
              }
            ) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "lg:col-span-5 flex flex-col gap-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-8 shadow-sm", children: [
            /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-ink flex items-center gap-2 mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 text-xs font-bold", children: "2" }),
              "Use Correct Format"
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink-muted mb-6 leading-relaxed", children: [
              "Data integrity is critical. Start by downloading the official template for the ",
              /* @__PURE__ */ jsx("strong", { children: exportOptions.find((o) => o.id === importType)?.label }),
              " module."
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                id: "tour-import-download-template",
                onClick: downloadTemplate,
                className: "w-full py-3 border-2 border-line hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 rounded-xl font-bold text-ink-secondary flex items-center justify-center gap-2 transition-all mb-6",
                children: [
                  /* @__PURE__ */ jsx(FileSpreadsheet, { size: 18 }),
                  " Download Excel Template"
                ]
              }
            ),
            /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-ink-muted uppercase mb-3", children: "Checklist" }),
            /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: ["Do not rename column headers", "Use unique IDs for updates", "Dates format: YYYY-MM-DD", "Max 5000 rows per file"].map((item, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-sm text-ink-secondary", children: [
              /* @__PURE__ */ jsx(CheckSquare, { size: 16, className: "text-emerald-500" }),
              " ",
              item
            ] }, i)) })
          ] }) })
        ] }),
        activeTab === "backup" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 h-full animate-in fade-in duration-slow", children: [
          /* @__PURE__ */ jsx("div", { className: "lg:col-span-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-8 flex flex-col gap-6 shadow-sm min-h-[360px] justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-ink flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Download, { className: "text-brand-500" }),
                "Full System Backup"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted leading-relaxed mt-4", children: [
                "Generates a single encrypted **`.vq`** file holding **100% of your store data**.",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("br", {}),
                "This includes your complete transaction history, sales records, purchase orders, products list, variations, brand configurations, contacts list, cash in hand records, bank accounts, and chatbot settings.",
                /* @__PURE__ */ jsx("span", { className: "text-brand-500 dark:text-brand-400 font-bold block mt-3", children: "Absolutely nothing—not even a single dot—is left behind." })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(
              "a",
              {
                href: route("store.backup.export", { store_slug: store?.slug }),
                className: "w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 text-center",
                children: [
                  /* @__PURE__ */ jsx(Download, { size: 18 }),
                  " Download Encrypted Backup (.vq)"
                ]
              }
            ) })
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "lg:col-span-6", children: /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-8 flex flex-col gap-6 shadow-sm min-h-[360px] justify-between", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "font-bold text-lg text-ink flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Upload, { className: "text-brand-500" }),
                "Full System Restore"
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-ink-muted leading-relaxed mt-4", children: [
                "Upload a previously downloaded **`.vq`** backup file to restore your entire database state exactly to the point where you left off.",
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("br", {}),
                /* @__PURE__ */ jsx("span", { className: "text-red-500 font-bold block p-4 bg-red-500/5 rounded-xl border border-red-500/10", children: "🚨 WARNING: Restoring a backup will completely replace all your current store data. Any changes made since the backup was taken will be lost. This operation cannot be undone." })
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs("label", { className: "w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer select-none text-center", children: [
              /* @__PURE__ */ jsx(Upload, { size: 18 }),
              " ",
              uploadingBackup ? "Restoring System..." : "Upload & Restore (.vq)",
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "file",
                  accept: ".vq",
                  className: "hidden",
                  onChange: handleBackupUpload,
                  disabled: uploadingBackup
                }
              )
            ] }) })
          ] }) })
        ] }),
        activeTab === "backups" && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-6 animate-in fade-in duration-slow", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl p-6 flex items-center justify-between shadow-sm", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("h3", { className: "font-bold text-ink flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(HardDrive, { className: "text-brand-500", size: 20 }),
                  " Daily Auto-Backup"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-1", children: "Back up the database to local storage every night" })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => toggleAutoBackup(!autoBackupForm.data.auto_backup),
                  className: `relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4 ${autoBackupForm.data.auto_backup ? "bg-brand-600" : "bg-sunken"}`,
                  children: /* @__PURE__ */ jsx("div", { className: `absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${autoBackupForm.data.auto_backup ? "left-7" : "left-1"}` })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: createBackupNow,
                disabled: creatingBackup,
                className: "bg-sunken rounded-2xl p-6 flex items-center justify-center gap-2 text-white font-bold shadow-xl transition-transform active:scale-95 disabled:opacity-60",
                children: [
                  creatingBackup ? /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "animate-spin" }) : /* @__PURE__ */ jsx(Plus, { size: 18 }),
                  creatingBackup ? "Creating Snapshot..." : "Create Snapshot Now"
                ]
              }
            ),
            /* @__PURE__ */ jsxs("label", { className: "cursor-pointer bg-surface border-2 border-dashed border-line dark:border-line hover:border-brand-500 rounded-2xl p-6 flex items-center justify-center gap-2 font-bold text-ink-secondary transition-all text-center", children: [
              /* @__PURE__ */ jsx("input", { type: "file", className: "hidden", accept: ".sql", onChange: handleBackupRestoreFile, disabled: restoringBackup }),
              restoringBackup ? /* @__PURE__ */ jsx(RefreshCw, { size: 18, className: "animate-spin text-brand-500" }) : /* @__PURE__ */ jsx(Upload, { size: 18, className: "text-brand-500" }),
              restoringBackup ? "Restoring..." : "Restore from .sql File"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface border border-line rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "px-8 py-6 border-b border-line bg-sunken/50 dark:bg-surface flex items-center justify-between shrink-0", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-lg font-bold text-ink flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Database, { className: "text-ink-muted", size: 20 }),
                " Snapshot History"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "px-3 py-1 bg-sunken rounded-full text-2xs font-bold uppercase tracking-widest text-ink-muted", children: [
                backupsList.length,
                " Files Found"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "overflow-auto flex-1", children: /* @__PURE__ */ jsxs("table", { className: "w-full", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left border-b border-line", children: [
                /* @__PURE__ */ jsx("th", { className: "px-8 py-4 text-2xs font-bold uppercase tracking-widest text-ink-muted", children: "Snapshot" }),
                /* @__PURE__ */ jsx("th", { className: "px-8 py-4 text-2xs font-bold uppercase tracking-widest text-ink-muted", children: "Created" }),
                /* @__PURE__ */ jsx("th", { className: "px-8 py-4 text-2xs font-bold uppercase tracking-widest text-ink-muted", children: "Size" }),
                /* @__PURE__ */ jsx("th", { className: "px-8 py-4 text-2xs font-bold uppercase tracking-widest text-ink-muted text-right", children: "Actions" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-line", children: backupsList.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: "4", className: "px-8 py-16 text-center", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center text-ink-muted", children: [
                /* @__PURE__ */ jsx(HardDrive, { size: 40, className: "mb-3 opacity-20" }),
                /* @__PURE__ */ jsx("p", { className: "font-bold text-ink-secondary", children: "No snapshots yet" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs", children: "Create your first database backup to protect your data." })
              ] }) }) }) : backupsList.map((backup) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-interactive-hover dark:hover:bg-interactive-hover transition-colors group", children: [
                /* @__PURE__ */ jsx("td", { className: "px-8 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400", children: /* @__PURE__ */ jsx(FileText, { size: 18 }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-ink-secondary dark:text-ink truncate max-w-xs", children: backup.name })
                ] }) }),
                /* @__PURE__ */ jsx("td", { className: "px-8 py-4 text-sm text-ink-muted", children: backup.date }),
                /* @__PURE__ */ jsx("td", { className: "px-8 py-4", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-1 bg-sunken rounded-lg text-xs font-bold text-ink-secondary", children: backup.size }) }),
                /* @__PURE__ */ jsx("td", { className: "px-8 py-4", children: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end", children: /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold", children: "Encrypted & Stored" }) }) })
              ] }, backup.name)) })
            ] }) })
          ] })
        ] }),
        activeTab === "migrate" && /* @__PURE__ */ jsx("div", { className: "h-full flex flex-col items-center overflow-y-auto py-4 animate-in fade-in duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-3xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "mb-8 text-center", children: [
            /* @__PURE__ */ jsx("div", { className: "inline-flex items-center justify-center p-3 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-2xl mb-4", children: /* @__PURE__ */ jsx(Database, { size: 32 }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-ink mb-2", children: "Migrate from Another System" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-muted max-w-lg mx-auto text-sm", children: "Seamlessly import your data from Vyapar backups (.vyp). We'll analyze your file and map Customers, Items, and Stock automatically." })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center mb-10", children: [
            /* @__PURE__ */ jsxs("div", { className: `flex flex-col items-center z-10 ${migrationStep === "upload" ? "opacity-100" : "opacity-50"}`, children: [
              /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${migrationStep === "upload" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`, children: "1" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Upload" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-16 h-0.5 bg-sunken mx-2" }),
            /* @__PURE__ */ jsxs("div", { className: `flex flex-col items-center z-10 ${["analyzing", "review", "importing", "results"].includes(migrationStep) ? "opacity-100" : "opacity-50"}`, children: [
              /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${["review", "importing", "results"].includes(migrationStep) ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`, children: "2" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Review" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "w-16 h-0.5 bg-sunken mx-2" }),
            /* @__PURE__ */ jsxs("div", { className: `flex flex-col items-center z-10 ${migrationStep === "results" ? "opacity-100" : "opacity-50"}`, children: [
              /* @__PURE__ */ jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${migrationStep === "results" ? "bg-brand-600 text-white" : "bg-sunken text-ink-muted"}`, children: "3" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold uppercase", children: "Done" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line shadow-xl overflow-hidden min-h-[380px] relative", children: [
            migrationError && /* @__PURE__ */ jsxs("div", { className: "absolute top-0 left-0 right-0 bg-red-500 text-white px-6 py-3 text-sm font-bold flex items-center justify-center z-10", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 18, className: "mr-2" }),
              " ",
              migrationError
            ] }),
            migrationStep === "upload" && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center p-12 text-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md p-8 border-2 border-dashed border-line dark:border-line rounded-2xl hover:border-brand-500 transition-colors bg-app", children: [
                /* @__PURE__ */ jsx(Upload, { size: 40, className: "mx-auto text-ink-muted mb-4" }),
                /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg mb-2", children: "Drop your .vyp file here" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mb-6", children: "Found in AppData/Roaming/Vyaparapp/DBUpdateBackup" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    accept: ".vyp,.db,.sqlite",
                    onChange: handleMigrationFileChange,
                    className: "block w-full text-sm text-ink-muted file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 mb-4"
                  }
                ),
                migrationFile && /* @__PURE__ */ jsxs("div", { className: "bg-brand-50 text-brand-700 px-4 py-2 rounded-lg font-mono text-sm inline-block", children: [
                  migrationFile.name,
                  " (",
                  (migrationFile.size / 1024 / 1024).toFixed(2),
                  " MB)"
                ] })
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  disabled: !migrationFile,
                  onClick: handleMigrationAnalyze,
                  className: "mt-8 px-8 py-3 bg-brand-600 text-white rounded-xl font-bold shadow-lg transition-transform disabled:opacity-50 flex items-center gap-2",
                  children: [
                    "Analyze File ",
                    /* @__PURE__ */ jsx(ArrowRight, { size: 18 })
                  ]
                }
              )
            ] }),
            migrationStep === "analyzing" && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center p-12 text-center", children: [
              /* @__PURE__ */ jsx(Loader2, { size: 40, className: "animate-spin text-brand-600 mb-4" }),
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: "Scanning Database..." }),
              /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm", children: "Identifying Parties, Items, and transaction history." })
            ] }),
            migrationStep === "review" && migrationAnalysis && /* @__PURE__ */ jsxs("div", { className: "p-8 h-full flex flex-col", children: [
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8", children: [
                /* @__PURE__ */ jsxs("div", { className: "bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-800", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-brand-700 dark:text-brand-400 mb-1", children: "Parties" }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: migrationAnalysis.analysis.potential_parties })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-emerald-700 dark:text-emerald-400 mb-1", children: "Items" }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: migrationAnalysis.analysis.potential_items })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-blue-700 dark:text-blue-400 mb-1", children: "Sales" }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: migrationAnalysis.analysis.potential_sales })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "bg-brand-50 dark:bg-brand-900/20 p-4 rounded-2xl border border-brand-100 dark:border-brand-800", children: [
                  /* @__PURE__ */ jsx("h3", { className: "font-bold text-sm text-brand-700 dark:text-brand-400 mb-1", children: "Purchases" }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-ink", children: migrationAnalysis.analysis.potential_purchases })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "bg-app p-4 rounded-xl mb-8 flex-1 overflow-y-auto", children: [
                /* @__PURE__ */ jsx("h4", { className: "font-bold text-xs uppercase tracking-wider text-ink-muted mb-3", children: "Raw Table Data Detected" }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-2", children: Object.entries(migrationAnalysis.tables).map(([name, count]) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center text-xs p-2 bg-sunken rounded border border-line dark:border-line", children: [
                  /* @__PURE__ */ jsx("span", { className: "font-mono text-ink-secondary truncate max-w-[120px]", title: name, children: name }),
                  /* @__PURE__ */ jsx("span", { className: "font-bold bg-sunken px-1.5 rounded", children: count })
                ] }, name)) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-center mt-auto", children: [
                /* @__PURE__ */ jsxs("button", { onClick: handleMigrationExecute, className: "w-full px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold shadow-lg transition-transform flex items-center justify-center gap-3", children: [
                  /* @__PURE__ */ jsx(RefreshCw, { size: 20 }),
                  " Start Migration Process"
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted mt-3", children: "This action will merge data into your existing system. No existing data will be overwritten." })
              ] })
            ] }),
            migrationStep === "importing" && /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col items-center justify-center p-12 text-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "mb-6 relative", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-brand-500 rounded-full opacity-20 animate-ping" }),
                /* @__PURE__ */ jsx(RefreshCw, { size: 56, className: "animate-spin text-brand-600 relative z-10" })
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-2xl mb-2", children: "Importing Data..." }),
              /* @__PURE__ */ jsx("p", { className: "text-ink-muted max-w-sm text-sm", children: "Please wait while we transfer your accounts and inventory. Do not close this window." })
            ] }),
            migrationStep === "results" && /* @__PURE__ */ jsxs("div", { className: "p-12 h-full flex flex-col items-center justify-center text-center", children: [
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6", children: /* @__PURE__ */ jsx(Check, { size: 32, strokeWidth: 4 }) }),
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-2xl mb-4 text-ink", children: "Migration Successful!" }),
              /* @__PURE__ */ jsx("p", { className: "text-ink-muted mb-8 max-w-md text-sm", children: "Your external data has been successfully imported. You can now view your new customers and products in the system." }),
              /* @__PURE__ */ jsx("div", { className: "bg-app p-4 rounded-xl w-full max-w-lg mb-8 text-left max-h-40 overflow-y-auto", children: migrationLog.map((log, i) => /* @__PURE__ */ jsxs("div", { className: "text-xs font-mono text-ink-secondary py-1 border-b border-line last:border-0 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Check, { size: 12, className: "text-green-500" }),
                " ",
                log
              ] }, i)) }),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
                /* @__PURE__ */ jsx("button", { onClick: () => router.visit(route("store.parties.index", { store_slug: store?.slug })), className: "px-6 py-2.5 bg-sunken text-ink-secondary hover:bg-interactive-hover rounded-xl font-bold transition-colors", children: "View Parties" }),
                /* @__PURE__ */ jsx("button", { onClick: () => router.visit(route("store.inventory.index", { store_slug: store?.slug })), className: "px-6 py-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-xl font-bold shadow-lg transition-colors", children: "View Products" })
              ] })
            ] })
          ] })
        ] }) })
      ] })
    ] }),
    store?.onboarding_step === "drive_sync_tour" && renderPortal(
      /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-modal flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
        /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-neutral-950/65 backdrop-blur-md transition-opacity duration-slow animate-in fade-in" }),
        /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-modal animate-in zoom-in-95 duration-slow", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-neutral-900/90 dark:bg-app border border-brand-500/20 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" }),
          /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
            /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center text-brand-500 mb-6 shadow-inner", children: /* @__PURE__ */ jsx(Cloud, { size: 32, className: "animate-pulse" }) }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold text-white tracking-tight mb-3", children: "Secure Your Store Data! ☁️" }),
            /* @__PURE__ */ jsx("p", { className: "text-ink-muted text-sm font-semibold mb-4", children: "Final Step: Enable Automated Daily Backups" }),
            /* @__PURE__ */ jsxs("p", { className: "text-neutral-300 text-xs leading-relaxed max-w-sm mb-8", children: [
              "Amazing job setting up your catalog, purchases, sales, and expenses!",
              /* @__PURE__ */ jsx("br", {}),
              /* @__PURE__ */ jsx("br", {}),
              "Now, connect your Google Drive to enable automated nightly backups. This guarantees you never lose your database, keeping your data safe and private inside its own folder."
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col w-full gap-3", children: [
              /* @__PURE__ */ jsxs(
                "a",
                {
                  href: route("store.google.redirect", { store_slug: store?.slug }),
                  className: "w-full flex items-center justify-center gap-2 py-3.5 px-5 bg-gradient-to-r from-blue-600 to-brand-600 hover:from-blue-500 hover:to-brand-500 text-white font-bold rounded-xl shadow-lg transition-all duration-normal active:scale-[0.99] cursor-pointer text-sm",
                  children: [
                    /* @__PURE__ */ jsx(Link2, { size: 16 }),
                    " Connect Google Drive"
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    router.post(route("store.onboarding.step", { store_slug: store?.slug }), { step: "completed" }, {
                      onSuccess: () => router.visit(route("store.dashboard", { store_slug: store?.slug }))
                    });
                  },
                  className: "w-full py-3 px-5 bg-neutral-800/60 hover:bg-interactive-hover text-ink-muted hover:text-white font-bold rounded-xl transition-all text-xs border border-neutral-700/50 cursor-pointer",
                  children: "Maybe Later / Skip"
                }
              )
            ] })
          ] })
        ] }) })
      ] })
    )
  ] });
}
function CheckCircle({ className, size }) {
  return /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className, children: [
    /* @__PURE__ */ jsx("path", { d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
    /* @__PURE__ */ jsx("polyline", { points: "22 4 12 14.01 9 11.01" })
  ] });
}
export {
  DataManagement as default
};
