import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { router, usePage, Head } from "@inertiajs/react";
import { f as formatCurrency, g as getCurrencySymbol } from "./format-B_ph0Qec.js";
import { e as useWorkspace, O as OneGlanceLayout } from "./marketing-pages-DYgr6x02.js";
import { Trophy, Sparkles, ArrowLeft, ArrowRight, X, Plus, Zap, ScanBarcode, User, CreditCard, Banknote, Wallet, ChevronRight, CheckCircle2, Type, Settings, ChevronDown, GripVertical, Trash2, Printer, TrendingUp, Package } from "lucide-react";
import { u as useAlert, F as FormModal } from "../ssr.js";
import axios from "axios";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-ulkv479L.js";
import { A as AsyncPartyCombobox } from "./AsyncPartyCombobox-DMTeGwCg.js";
import { W as WheelInput } from "./WheelInput-Xb-5dVTx.js";
import { Q as QuickPartyModal } from "./QuickPartyModal-fEhN51o-.js";
import { P as ProductModal } from "./ProductModal-Cky6mbRZ.js";
import "marked";
import "@headlessui/react";
import "driver.js";
import "./vendor-core-4m-Uvb-d.js";
import "@inertiajs/react/server";
import "react-dom/server";
import "dexie";
import "react-dom";
import "laravel-echo";
import "pusher-js";
import "use-debounce";
import "./SmartCombobox-D_cdCy9L.js";
import "./PremiumButton-BcHxfadR.js";
import "./PremiumSelect-BdCYeyr5.js";
function PurchaseTourGuide({ store }) {
  const [hasSuppliers, setHasSuppliers] = useState(true);
  const [isSupplierCreationPath, setIsSupplierCreationPath] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const isVisible = store?.onboarding_step === "purchase_tour" || store?.onboarding_step === "purchase_congratulations";
  useEffect(() => {
    if (isVisible) {
      axios.get(route("store.suppliers.search", { store_slug: store?.slug }), { params: { search: "" } }).then((res) => {
        const list = res.data || [];
        const empty = list.length === 0;
        setHasSuppliers(!empty);
        if (isSupplierCreationPath === null) {
          setIsSupplierCreationPath(empty);
        }
      }).catch((err) => console.error("Failed to search suppliers:", err));
    }
  }, [isVisible, store?.slug]);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const getTargetId = (step) => {
    if (isSupplierCreationPath) {
      switch (step) {
        case 0:
          return "tour-purchase-supplier";
        case 1:
          return "tour-add-new-party-btn";
        case 2:
          return "tour-party-name";
        case 3:
          return "tour-party-phone";
        case 4:
          return "tour-party-address";
        case 5:
          return "tour-party-submit";
        case 6:
          return "tour-purchase-product";
        case 7:
          return "tour-purchase-quantity";
        case 8:
          return "tour-purchase-cost";
        case 9:
          return "tour-purchase-paid";
        case 10:
          return "tour-purchase-save";
        case 11:
          return "tour-new-transaction";
        default:
          return null;
      }
    } else {
      switch (step) {
        case 0:
          return "tour-purchase-supplier";
        case 1:
          return "tour-purchase-product";
        case 2:
          return "tour-purchase-quantity";
        case 3:
          return "tour-purchase-cost";
        case 4:
          return "tour-purchase-paid";
        case 5:
          return "tour-purchase-save";
        case 6:
          return "tour-new-transaction";
        default:
          return null;
      }
    }
  };
  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      const activeId = document.activeElement?.id;
      if (isSupplierCreationPath) {
        if (currentStep === 0) {
          if (document.getElementById("tour-add-new-party-btn")) setCurrentStep(1);
        } else if (currentStep === 1) {
          if (document.getElementById("tour-party-name")) setCurrentStep(2);
        } else if (currentStep === 2) {
          if (activeId === "tour-party-phone") setCurrentStep(3);
        } else if (currentStep === 3) {
          if (activeId === "tour-party-address") setCurrentStep(4);
        } else if (currentStep === 4) {
          if (activeId === "tour-party-submit") setCurrentStep(5);
        } else if (currentStep === 5) {
          if (!document.getElementById("tour-party-name")) setCurrentStep(6);
        } else if (currentStep === 10) {
          if (document.getElementById("tour-new-transaction")) setCurrentStep(11);
        }
      } else {
        if (currentStep === 5) {
          if (document.getElementById("tour-new-transaction")) setCurrentStep(6);
        }
      }
    }, 150);
    return () => clearInterval(interval);
  }, [currentStep, isVisible, isSupplierCreationPath]);
  useEffect(() => {
    if (!isVisible || store?.onboarding_step === "purchase_congratulations") {
      setCoords(null);
      return;
    }
    const targetId = getTargetId(currentStep);
    if (!targetId) {
      setCoords(null);
      return;
    }
    const updateCoords = () => {
      const el2 = document.getElementById(targetId);
      if (el2) {
        const rect = el2.getBoundingClientRect();
        setCoords({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      } else {
        setCoords(null);
      }
    };
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    const timer = setTimeout(updateCoords, 300);
    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", updateCoords, true);
    const interval = setInterval(updateCoords, 80);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", updateCoords, true);
    };
  }, [currentStep, isVisible, store?.onboarding_step, isSupplierCreationPath]);
  const handleStartInvoiceTour = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "invoice_tour_start" },
      {
        onSuccess: () => {
          router.visit(route("store.dashboard", { store_slug: store?.slug }));
        }
      }
    );
  };
  const handleStartPosTour = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "pos_tour_start" },
      {
        onSuccess: () => {
          router.visit(route("store.dashboard", { store_slug: store?.slug }));
        }
      }
    );
  };
  const handleCompleteTour = () => {
    router.post(
      route("store.onboarding.step", { store_slug: store?.slug }),
      { step: "completed" },
      {
        onSuccess: () => {
          router.visit(route("store.dashboard", { store_slug: store?.slug }));
        }
      }
    );
  };
  if (!isVisible) return null;
  if (store?.onboarding_step === "purchase_congratulations") {
    return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none", children: [
      /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" }),
      /* @__PURE__ */ jsx("div", { className: "relative w-full max-w-lg mx-auto my-6 px-4 z-[101] animate-in zoom-in-95 duration-300", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col w-full bg-slate-900/90 dark:bg-slate-950/95 border border-indigo-500/20 rounded-3xl shadow-[0_20px_50px_rgba(99,102,241,0.15)] overflow-hidden", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" }),
        /* @__PURE__ */ jsxs("div", { className: "p-8 flex flex-col items-center text-center relative z-10", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 animate-bounce", children: /* @__PURE__ */ jsx(Trophy, { className: "text-white w-8 h-8" }) }),
          /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3", children: "Stock Added! 🎉" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-sm font-semibold mb-2", children: "Your first purchase was recorded successfully!" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-300 text-sm leading-relaxed max-w-sm mb-6", children: "Congratulations! You have successfully added stock to your store catalog. Now let's try making your first sale to generate an invoice or POS receipt!" }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2.5 w-full", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleStartInvoiceTour,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm",
                children: /* @__PURE__ */ jsx("span", { children: "Create B2B Invoice" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleStartPosTour,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-sm",
                children: /* @__PURE__ */ jsx("span", { children: "Go to POS Register" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleCompleteTour,
                className: "w-full flex items-center justify-center gap-2 py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-xl border border-slate-700/60 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-xs mt-1",
                children: /* @__PURE__ */ jsx("span", { children: "Skip & Finish Setup" })
              }
            )
          ] })
        ] })
      ] }) })
    ] });
  }
  const getTooltipStyle = () => {
    if (!coords) return { display: "none" };
    if (isMobile) {
      return {
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 32px)",
        maxWidth: "360px",
        zIndex: 115
      };
    }
    const spaceOnRight = window.innerWidth - (coords.left + coords.width);
    const spaceOnLeft = coords.left;
    if (spaceOnRight > 340) {
      return {
        position: "fixed",
        top: coords.top + coords.height / 2 - 80,
        left: coords.left + coords.width + 20,
        width: "320px",
        zIndex: 115
      };
    } else if (spaceOnLeft > 340) {
      return {
        position: "fixed",
        top: coords.top + coords.height / 2 - 80,
        left: coords.left - 340,
        width: "320px",
        zIndex: 115
      };
    } else {
      return {
        position: "fixed",
        top: coords.top + coords.height + 20,
        left: coords.left + coords.width / 2 - 160,
        width: "320px",
        zIndex: 115
      };
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[105] overflow-hidden pointer-events-none", children: [
    coords && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed pointer-events-none transition-all duration-100 ease-out",
        style: {
          top: coords.top - 6,
          left: coords.left - 6,
          width: coords.width + 12,
          height: coords.height + 12,
          borderRadius: "12px",
          boxShadow: "0 0 0 9999px rgba(3, 7, 18, 0.75), 0 0 15px 5px rgba(99, 102, 241, 0.4), 0 0 0 2px rgb(99, 102, 241)",
          zIndex: 110
        }
      }
    ),
    !coords && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/75 pointer-events-auto z-[90]" }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: getTooltipStyle(),
        className: "bg-slate-900/95 dark:bg-slate-950/98 border border-indigo-500/30 rounded-2xl shadow-[0_15px_40px_rgba(99,102,241,0.2)] p-6 pointer-events-auto relative z-[115] animate-in fade-in duration-300",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3 mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "p-2 bg-indigo-500/10 rounded-lg text-indigo-400 shrink-0", children: /* @__PURE__ */ jsx(Sparkles, { size: 20, className: "animate-pulse" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-white uppercase tracking-wider", children: "Purchase Tour" }),
              /* @__PURE__ */ jsxs("span", { className: "text-2xs font-semibold text-indigo-400", children: [
                "Step ",
                currentStep + 1,
                " of ",
                isSupplierCreationPath ? 12 : 7
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            isSupplierCreationPath ? /* @__PURE__ */ jsxs(Fragment, { children: [
              currentStep === 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "You don't have any suppliers yet! Click on the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Search Party" }),
                " input."
              ] }),
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Now click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "+ Create New Party" }),
                " at the bottom of the dropdown."
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Put in the supplier's ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Name" }),
                " inside the modal."
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Put in their ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Phone Number" }),
                "."
              ] }),
              currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Put in their ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Address" }),
                "."
              ] }),
              currentStep === 5 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Create Supplier" }),
                " to save the supplier."
              ] }),
              currentStep === 6 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Great! Now move toward the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Search Product" }),
                " option and select the previously created product."
              ] }),
              currentStep === 7 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Set the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Quantity" }),
                " of items purchased."
              ] }),
              currentStep === 8 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Verify the purchase ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Unit Price" }),
                "."
              ] }),
              currentStep === 9 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Enter the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Amount Paid" }),
                " (leave as 0 if on credit)."
              ] }),
              currentStep === 10 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Complete Purchase" }),
                " to save the transaction."
              ] }),
              currentStep === 11 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "NEW TRANSACTION" }),
                " to continue your setup."
              ] })
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              currentStep === 0 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Select a ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Supplier" }),
                " you are purchasing from."
              ] }),
              currentStep === 1 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Search and select the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Product" }),
                " you created."
              ] }),
              currentStep === 2 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Set the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Quantity" }),
                " of items purchased."
              ] }),
              currentStep === 3 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Verify the purchase ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Unit Price" }),
                "."
              ] }),
              currentStep === 4 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Enter the ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Amount Paid" }),
                "."
              ] }),
              currentStep === 5 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "Complete Purchase" }),
                " to save the transaction."
              ] }),
              currentStep === 6 && /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-300 leading-relaxed font-medium", children: [
                "Click ",
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold", children: "NEW TRANSACTION" }),
                " to continue your setup."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2 justify-between items-center", children: [
              currentStep > 0 ? /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep - 1),
                  className: "px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx(ArrowLeft, { size: 12 }),
                    /* @__PURE__ */ jsx("span", { children: "Back" })
                  ]
                }
              ) : /* @__PURE__ */ jsx("div", {}),
              currentStep < (isSupplierCreationPath ? 11 : 6) && /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setCurrentStep(currentStep + 1),
                  className: "px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx("span", { children: "Next" }),
                    /* @__PURE__ */ jsx(ArrowRight, { size: 12 })
                  ]
                }
              )
            ] })
          ] })
        ]
      }
    )
  ] });
}
const CreatePurchase = ({ purchase, expenseCategories = [], products = [] }) => {
  const { settings, auth, store } = usePage().props;
  const isSeniorMode = settings?.senior_mode === "1";
  settings?.show_margin_percentage === "1";
  const isAdmin = auth.user?.role === "admin";
  const {
    activePurchases,
    currentPurchaseId,
    setCurrentPurchaseId,
    addPurchase,
    removePurchase,
    updatePurchase
  } = useWorkspace();
  const { showAlert, showConfirm } = useAlert();
  useEffect(() => {
    if (!purchase && activePurchases.length === 0) {
      addPurchase();
    }
  }, [purchase, activePurchases, addPurchase]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("product_id");
    if (productId && products.length > 0 && currentPurchaseId && !purchase) {
      const product = products.find((p) => p.id == productId);
      if (product) {
        const alreadyAdded = currentPurchase.items.some((i) => i.product && i.product.id === product.id);
        if (!alreadyAdded) {
          const targetItemId = currentPurchase.items[0]?.id;
          if (targetItemId) {
            selectProduct(product, targetItemId);
            window.history.replaceState({}, "", window.location.pathname);
          }
        }
      }
    }
  }, [products, currentPurchaseId, purchase]);
  const resetToNewPurchase = () => {
    if (isEditMode) {
      router.visit(route("store.purchases.index", { store_slug: store.slug }));
      return;
    }
    removePurchase(currentPurchase.id);
  };
  const isEditMode = !!purchase;
  const [editState, setEditState] = useState(null);
  useEffect(() => {
    if (purchase) {
      setEditState({
        id: purchase.id,
        invoiceNumber: purchase.invoice_number,
        supplier: purchase.party,
        items: (purchase.items || []).map((i) => ({
          id: i.id,
          product: i.product,
          name: i.product?.name || i.name || "Unknown Item",
          quantity: parseFloat(i.quantity) || 1,
          originalQuantity: parseFloat(i.quantity) || 0,
          price: parseFloat(i.unit_price) || 0,
          cost: parseFloat(i.unit_price) || 0,
          discount: 0,
          discountType: "fixed",
          received_qty: i.received_qty
        })),
        date: purchase.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        notes: purchase.notes || "",
        amountPaid: parseFloat(purchase.paid_amount) || 0,
        originalPaidAmount: parseFloat(purchase.paid_amount) || 0,
        paymentMethod: purchase.payment_method || "credit",
        discount: 0,
        tax: 0,
        status: purchase.status,
        originalTotal: parseFloat(purchase.total_amount) || 0,
        extras: purchase.expenses?.map((e) => ({
          id: e.id,
          category_id: e.category_id,
          // Ensure this exists or map from name
          amount: parseFloat(e.amount),
          method: e.allocation_method || "value",
          description: e.description
        })) || []
      });
    }
  }, [purchase]);
  const currentPurchase = isEditMode ? editState || { items: [], supplier: null, amountPaid: 0, extras: [] } : activePurchases.find((p) => p.id === currentPurchaseId) || activePurchases[0] || { id: null, items: [], supplier: null, amountPaid: 0, extras: [] };
  const patchPurchase = (data) => {
    if (isEditMode) {
      setEditState((prev) => ({ ...prev, ...data }));
    } else {
      updatePurchase(currentPurchase.id, data);
    }
  };
  const { aiPrefill } = usePage().props;
  const aiPrefillApplied = useRef(false);
  const [aiPrefillNotice, setAiPrefillNotice] = useState(null);
  useEffect(() => {
    if (!aiPrefill || isEditMode || aiPrefillApplied.current) return;
    if (!currentPurchase?.id) return;
    aiPrefillApplied.current = true;
    const items = (aiPrefill.items || []).filter((line) => line.product).map((line, idx) => ({
      id: Date.now() + idx,
      product: line.product,
      name: line.name || line.product?.name,
      quantity: parseFloat(line.quantity) || 1,
      price: parseFloat(line.price) || 0,
      cost: parseFloat(line.price) || 0,
      discount: 0,
      discountType: "fixed",
      aiRawName: line.ai_raw_name || null
    }));
    items.push({ id: Date.now() + 9999, product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" });
    updatePurchase(currentPurchase.id, {
      supplier: aiPrefill.party || null,
      items,
      notes: aiPrefill.notes || "",
      paymentMethod: aiPrefill.payment_method || "credit",
      ...aiPrefill.date ? { date: aiPrefill.date } : {}
    });
    const costChanges = (aiPrefill.items || []).filter((line) => line.cost_changed).map((line) => ({
      name: line.name,
      from: line.catalog_cost,
      to: parseFloat(line.price) || 0
    }));
    setAiPrefillNotice({
      count: items.length - 1,
      party: aiPrefill.party?.name || null,
      reference: aiPrefill.reference || null,
      costChanges
    });
  }, [aiPrefill, isEditMode, currentPurchase?.id, updatePurchase]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productModalMode, setProductModalMode] = useState("create");
  const [editingProduct, setEditingProduct] = useState(null);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [categories, setCategories] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    const handleSync = () => {
      router.reload({
        only: ["products", "categories", "warehouses"],
        preserveState: true,
        preserveScroll: true
      });
      refreshPurchaseItems();
    };
    window.addEventListener("amd:product-updated", handleSync);
    window.addEventListener("storage", (e) => {
      if (e.key === "amd_product_latest_change") handleSync();
    });
    return () => {
      window.removeEventListener("amd:product-updated", handleSync);
    };
  }, [currentPurchase?.items]);
  const refreshPurchaseItems = async () => {
    if (!currentPurchase?.items?.length) return;
    const productsToRefresh = currentPurchase.items.filter((i) => i.product?.id).map((i) => i.product.id);
    if (!productsToRefresh.length) return;
    try {
      const response = await axios.get(route("store.inventory.search", {
        store_slug: store.slug
      }), {
        params: { ids: productsToRefresh }
      });
      const latestProducts = response.data || [];
      const newItems = currentPurchase.items.map((item) => {
        if (!item.product?.id) return item;
        const latest = latestProducts.find((p) => p.id === item.product.id);
        if (latest) {
          const isFinalized = isEditMode || ["received"].includes(currentPurchase.status);
          return {
            ...item,
            product: latest,
            price: !isFinalized ? parseFloat(latest.cost || latest.cost_price || 0) : item.price,
            available_stock: parseFloat(latest.stock_quantity || latest.stock || 0),
            cost: !isFinalized ? parseFloat(latest.cost || latest.cost_price || 0) : item.cost
          };
        }
        return item;
      });
      patchPurchase({ items: newItems });
    } catch (error) {
      console.error("Failed to refresh purchase items", error);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, wareRes, accRes, banksRes] = await Promise.all([
          axios.get(route("store.api.categories", { store_slug: store.slug })),
          axios.get(route("store.api.warehouses", { store_slug: store.slug })),
          axios.get(route("store.accounting.accounts.api", { store_slug: store.slug, type: "asset" })),
          axios.get(route("store.api.bank-accounts", { store_slug: store.slug }))
        ]);
        setCategories(catRes.data);
        setWarehouses(wareRes.data);
        const rawAccounts = accRes.data?.data || accRes.data || [];
        const bankAccounts = banksRes.data || [];
        const cashAccount = { id: 1, name: "Cash in Hand", type: "cash" };
        const chequeAccount = { id: "CHEQUE", name: "Cheque", type: "cheque" };
        const generalBankAccount = rawAccounts.find((a) => a.name === "Bank Account" || a.code === "1010");
        const bankGLId = generalBankAccount?.id || 2;
        const mappedBankAccounts = bankAccounts.map((b) => ({
          id: `BANK_${b.id}`,
          // Unique ID for Dropdown Key
          isBank: true,
          realAccountId: bankGLId,
          // The ID to send to backend (GL Account)
          bankReferenceId: b.id,
          // The specific bank ID
          name: `${b.name} ${b.bank_name ? `(${b.bank_name})` : ""}`,
          type: "bank"
        }));
        const otherAccounts = rawAccounts.filter(
          (a) => a.id !== 1 && // Not Cash
          a.id !== bankGLId && // Not generic Bank GL
          a.name !== "Cash on Hand" && a.name !== "Cheques in Hand" && a.name !== "Inventory" && a.name !== "Accounts Receivable"
        );
        const finalAccounts = [
          cashAccount,
          chequeAccount,
          ...mappedBankAccounts,
          ...otherAccounts
        ];
        setAccounts(finalAccounts);
      } catch (error) {
        console.error("Failed to fetch modal data", error);
        setAccounts([
          { id: 1, name: "Cash in Hand", type: "cash" },
          { id: "CHEQUE", name: "Cheque", type: "cheque" }
        ]);
      }
    };
    fetchData();
  }, []);
  const handleProductSubmit = async (data, onError) => {
    try {
      const url = productModalMode === "create" ? route("store.inventory.store", {
        store_slug: store.slug
      }) : editingProduct?.id ? route("store.inventory.update", [store.slug, editingProduct.id]) : "";
      const response = await axios.post(url, data);
      if (response.data) {
        setIsProductModalOpen(false);
        showAlert({
          title: "Success",
          message: `Product ${productModalMode === "create" ? "created" : "updated"} successfully.`,
          type: "success"
        });
        if (productModalMode === "create" && showQuickEntry) {
          setQuickEntry((prev) => ({ ...prev, name: data.name }));
          handleQuickSearch(data.name);
        }
        if (productModalMode === "edit") {
          handleQuickSearch(quickEntry.name);
        }
      }
    } catch (error) {
      console.error(error);
      if (onError && error.response?.data?.errors) {
        onError(error.response.data.errors);
      } else {
        showAlert({
          title: "Error",
          message: "Failed to save product.",
          type: "error"
        });
      }
    }
  };
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierResults, setSupplierResults] = useState([]);
  const [initialSuppliers, setInitialSuppliers] = useState([]);
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [productResults, setProductResults] = useState([]);
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [quickEntry, setQuickEntry] = useState({
    product: null,
    name: "",
    quantity: 1,
    freeQuantity: 0,
    price: 0,
    discount: 0,
    discountType: "fixed"
  });
  const [quickResults, setQuickResults] = useState([]);
  const [initialProducts, setInitialProducts] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanBuffer, setScanBuffer] = useState("");
  const [scannedItems, setScannedItems] = useState([]);
  const [showProfit, setShowProfit] = useState(false);
  const [profitLocked, setProfitLocked] = useState(false);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [quickSelectedIndex, setQuickSelectedIndex] = useState(-1);
  const [draggedItemIndex, setDraggedItemIndex] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastPurchaseId, setLastPurchaseId] = useState(null);
  const [itemTotalModes, setItemTotalModes] = useState({});
  const getItemTotalMode = (id) => itemTotalModes[id] || "price";
  const toggleItemTotalMode = (id) => setItemTotalModes((prev) => ({ ...prev, [id]: prev[id] === "qty" ? "price" : "qty" }));
  const [textSize, setTextSize] = useState(1);
  const [showTextSizeMenu, setShowTextSizeMenu] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [showMobilePurchaseModal, setShowMobilePurchaseModal] = useState(false);
  const itemsContainerRef = useRef(null);
  const prevItemsLengthRef = useRef(currentPurchase?.items?.length || 0);
  useEffect(() => {
    const currentLength = currentPurchase?.items?.length || 0;
    if (currentLength > prevItemsLengthRef.current) {
      if (itemsContainerRef.current) {
        setTimeout(() => {
          itemsContainerRef.current.scrollTo({
            top: itemsContainerRef.current.scrollHeight,
            behavior: "smooth"
          });
        }, 100);
      }
    }
    prevItemsLengthRef.current = currentLength;
  }, [currentPurchase?.items?.length]);
  const [defaultDelivery, setDefaultDelivery] = useState(() => parseFloat(localStorage.getItem("amd_default_delivery")) || 0);
  const [defaultExtraLabel, setDefaultExtraLabel] = useState(() => localStorage.getItem("amd_default_extra_label") || "Extra");
  const [defaultExtraValue, setDefaultExtraValue] = useState(() => parseFloat(localStorage.getItem("amd_default_extra_value")) || 0);
  const [enableMultipleExtras, setEnableMultipleExtras] = useState(() => localStorage.getItem("amd_enable_multiple_extras") === "1");
  const [showDeliveryCharges, setShowDeliveryCharges] = useState(() => localStorage.getItem("amd_show_delivery") !== "0");
  const [showExtraField, setShowExtraField] = useState(() => localStorage.getItem("amd_show_extra") !== "0");
  useEffect(() => {
    localStorage.setItem("amd_default_delivery", defaultDelivery.toString());
  }, [defaultDelivery]);
  useEffect(() => {
    localStorage.setItem("amd_default_extra_label", defaultExtraLabel);
  }, [defaultExtraLabel]);
  useEffect(() => {
    localStorage.setItem("amd_default_extra_value", defaultExtraValue.toString());
  }, [defaultExtraValue]);
  useEffect(() => {
    localStorage.setItem("amd_enable_multiple_extras", enableMultipleExtras ? "1" : "0");
  }, [enableMultipleExtras]);
  useEffect(() => {
    localStorage.setItem("amd_show_delivery", showDeliveryCharges ? "1" : "0");
  }, [showDeliveryCharges]);
  useEffect(() => {
    localStorage.setItem("amd_show_extra", showExtraField ? "1" : "0");
  }, [showExtraField]);
  useEffect(() => {
    const loadInitialProducts = async () => {
      try {
        const response = await axios.get(route("store.inventory.search", {
          store_slug: store.slug
        }), { params: { query: "" } });
        setInitialProducts((response.data || []).slice(0, 50));
      } catch (error) {
        console.error("Failed to load initial products:", error);
      }
    };
    loadInitialProducts();
  }, []);
  const quantityRef = useRef(null);
  const discountRef = useRef(null);
  useRef(0);
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key === "q") {
        e.preventDefault();
        document.getElementById("quick-entry-input")?.focus();
      }
      if (isSeniorMode) {
        if (e.key === "F1") {
          e.preventDefault();
          document.getElementById("quick-entry-input")?.focus();
        }
        if (e.key === " ") {
          if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
            e.preventDefault();
            handleSave();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSeniorMode, currentPurchase]);
  useEffect(() => {
    if (supplierSearch.length < 2) {
      setSupplierResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const response = await axios.get(route("store.suppliers.search", { store_slug: store.slug }), { params: { search: supplierSearch } });
        setSupplierResults(response.data || []);
      } catch (error) {
        console.error("Supplier search error:", error);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [supplierSearch]);
  useEffect(() => {
    const loadInitialSuppliers = async () => {
      try {
        const response = await axios.get(route("store.suppliers.search", { store_slug: store.slug }), { params: { search: "" } });
        setInitialSuppliers((response.data || []).slice(0, 50));
      } catch (error) {
        console.error("Failed to load initial suppliers:", error);
      }
    };
    loadInitialSuppliers();
  }, []);
  const addItem = () => {
    const newItems = [...currentPurchase.items, { id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }];
    patchPurchase({ items: newItems });
  };
  const removeItem = (id) => {
    const newItems = currentPurchase.items.filter((item) => item.id !== id);
    patchPurchase({ items: newItems.length ? newItems : [{ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" }] });
  };
  const updateItem = (id, field, value) => {
    const newItems = currentPurchase.items.map(
      (item) => item.id === id ? { ...item, [field]: value } : item
    );
    patchPurchase({ items: newItems });
  };
  const selectProduct = (product, itemId) => {
    const updatedItems = currentPurchase.items.map(
      (item) => item.id === itemId ? {
        ...item,
        product,
        // FOR PURCHASE: Price is COST
        price: parseFloat(product.cost || product.cost_price || 0),
        name: product.name,
        // We might keep cost field redundant or use it to show 'Previous Cost'
        cost: parseFloat(product.cost || product.cost_price || 0),
        available_stock: parseFloat(product.stock_quantity || 0),
        // Current Stock
        originalQuantity: 0
      } : item
    );
    const lastItem = updatedItems[updatedItems.length - 1];
    if (lastItem.id === itemId) {
      updatedItems.push({ id: Date.now(), product: null, quantity: 1, price: 0, discount: 0, discountType: "fixed" });
    }
    patchPurchase({ items: updatedItems });
    setProductResults([]);
    setActiveItemIndex(null);
  };
  const handleQuickSearch = async (query) => {
    setQuickEntry((prev) => ({ ...prev, name: query }));
    if (query.length < 2) {
      setQuickResults([]);
      setQuickSelectedIndex(-1);
      return;
    }
    try {
      const response = await axios.get(route("store.inventory.search", {
        store_slug: store.slug
      }), { params: { query } });
      setQuickResults(response.data || []);
      setQuickSelectedIndex(response.data?.length > 0 ? 0 : -1);
    } catch (error) {
      console.error("Quick search error:", error);
    }
  };
  const selectQuickProduct = (product) => {
    setQuickEntry((prev) => ({
      ...prev,
      product,
      name: product.name,
      price: parseFloat(product.cost || product.cost_price || 0),
      // PURCHASE PRICE
      cost: parseFloat(product.cost || product.cost_price || 0)
    }));
    setQuickResults([]);
    setQuickSelectedIndex(-1);
    setTimeout(() => quantityRef.current?.focus(), 50);
  };
  const addQuickItem = () => {
    if (!quickEntry.product && !quickEntry.name) return;
    const newItem = {
      id: Date.now(),
      product: quickEntry.product,
      name: quickEntry.name,
      quantity: quickEntry.quantity || 1,
      freeQuantity: quickEntry.freeQuantity || 0,
      price: quickEntry.price || 0,
      discount: quickEntry.discount || 0,
      discountType: quickEntry.discountType,
      cost: quickEntry.product?.cost || quickEntry.product?.cost_price || 0
    };
    const firstItem = currentPurchase.items[0];
    let newItems;
    if (currentPurchase.items.length === 1 && !firstItem.product && !firstItem.name) {
      newItems = [newItem];
    } else {
      newItems = [...currentPurchase.items, newItem];
    }
    patchPurchase({ items: newItems });
    setQuickEntry({
      product: null,
      name: "",
      quantity: 1,
      freeQuantity: 0,
      price: 0,
      discount: 0,
      discountType: "fixed"
    });
    setQuickResults([]);
    setQuickSelectedIndex(-1);
    document.getElementById("quick-entry-input")?.focus();
  };
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setProductModalMode("edit");
    setIsProductModalOpen(true);
  };
  const handleScan = async (e) => {
    if (e.key === "Enter" && scanBuffer) {
      const isNumeric = /^\d+$/.test(scanBuffer);
      const isShort = scanBuffer.length <= 3;
      if (isNumeric && isShort && scannedItems.length > 0) {
        const qty = parseInt(scanBuffer);
        if (qty > 0) {
          setScannedItems((prev) => {
            const newItems = [...prev];
            const lastIdx = newItems.length - 1;
            newItems[lastIdx] = { ...newItems[lastIdx], quantity: qty };
            return newItems;
          });
          setScanBuffer("");
          return;
        }
      }
      try {
        const response = await axios.get(route("store.inventory.search", {
          store_slug: store.slug
        }), { params: { query: scanBuffer } });
        const results = response.data;
        const product = results && results.length > 0 ? results[0] : null;
        if (product) {
          setScannedItems((prev) => {
            const existingIndex = prev.findIndex((item) => item.product.id === product.id);
            if (existingIndex >= 0) {
              const newItems = [...prev];
              const existingItem = newItems[existingIndex];
              newItems.splice(existingIndex, 1);
              newItems.push({
                ...existingItem,
                quantity: existingItem.quantity + 1
              });
              return newItems;
            } else {
              return [...prev, {
                id: Date.now(),
                product,
                name: product.name,
                quantity: 1,
                price: parseFloat(product.cost || product.cost_price || 0),
                // PURCHASE PRICE
                discount: 0,
                discountType: "fixed",
                cost: parseFloat(product.cost || product.cost_price || 0)
              }];
            }
          });
        } else {
          console.log("Unknown barcode.");
        }
        setScanBuffer("");
      } catch (error) {
        console.error("Scan error:", error);
        setScanBuffer("");
      }
    }
  };
  const confirmScan = () => {
    patchPurchase({ items: [...currentPurchase.items, ...scannedItems] });
    setScannedItems([]);
    setIsScanning(false);
  };
  const handleDragStart = (e, index) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;
    const items = [...currentPurchase.items];
    const draggedItem = items[draggedItemIndex];
    items.splice(draggedItemIndex, 1);
    items.splice(index, 0, draggedItem);
    patchPurchase({ items });
    setDraggedItemIndex(index);
  };
  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };
  const calculateLineTotal = (item) => {
    const sub = item.quantity * item.price;
    const disc = item.discountType === "percent" ? sub * (item.discount / 100) : item.discount || 0;
    return sub - disc;
  };
  const handleTotalChange = (item, newTotalStr) => {
    const newTotal = parseFloat(newTotalStr);
    if (isNaN(newTotal) || newTotal < 0) return;
    const mode = getItemTotalMode(item.id);
    const qty = parseFloat(item.quantity) || 1;
    const disc = item.discount || 0;
    const discType = item.discountType;
    if (mode === "price") {
      const newPrice = discType === "percent" ? newTotal / (qty * (1 - disc / 100)) : (newTotal + disc) / qty;
      updateItem(item.id, "price", Math.max(0, parseFloat(newPrice.toFixed(4))));
    } else {
      const price = parseFloat(item.price) || 0;
      const effectivePrice = discType === "percent" ? price * (1 - disc / 100) : price;
      const newQty = effectivePrice > 0 ? newTotal / effectivePrice : 0;
      updateItem(item.id, "quantity", Math.max(0, parseFloat(newQty.toFixed(4))));
    }
  };
  const subtotal = currentPurchase?.items?.reduce((sum, item) => sum + (item.quantity + (item.freeQuantity || 0)) * item.price, 0) || 0;
  const totalCost = subtotal;
  const itemDiscounts = currentPurchase?.items?.reduce((sum, item) => {
    const sub = item.quantity * item.price;
    const discountVal = item.discountType === "percent" ? sub * (item.discount / 100) : item.discount || 0;
    const freeItemValue = (item.freeQuantity || 0) * item.price;
    return sum + discountVal + freeItemValue;
  }, 0) || 0;
  const afterItemDiscounts = subtotal - itemDiscounts;
  const invoiceDiscount = parseFloat(currentPurchase?.discount) || 0;
  const afterDiscount = afterItemDiscounts - invoiceDiscount;
  const taxAmount = afterDiscount * ((parseFloat(currentPurchase?.tax) || 0) / 100);
  const deliveryCharge = parseFloat(currentPurchase?.delivery_charge) || 0;
  const totalExtras = (currentPurchase?.extras || []).reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const vendorTotal = afterDiscount + taxAmount + deliveryCharge;
  const grandTotal = vendorTotal + totalExtras;
  const profit = 0;
  const balanceDue = grandTotal - (parseFloat(currentPurchase?.amountPaid) || 0);
  const [supplierError, setSupplierError] = useState(false);
  const [invalidItems, setInvalidItems] = useState([]);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const validateInputs = () => {
    let isValid = true;
    let newInvalidItems = [];
    if (!currentPurchase.supplier || typeof currentPurchase.supplier === "string" || !currentPurchase.supplier.id) {
      setSupplierError(true);
      isValid = false;
    } else {
      setSupplierError(false);
    }
    currentPurchase.items.forEach((item, index) => {
      if (item.name && !item.product || item.name && item.product && !item.product.id) {
        newInvalidItems.push(index);
        isValid = false;
      }
    });
    setInvalidItems(newInvalidItems);
    return isValid;
  };
  const handleSave = async (shouldPrint = false) => {
    if (!validateInputs()) {
      showAlert({
        title: "Validation Error",
        message: "Please resolve the highlighted errors (Unregistered Supplier or Products).",
        type: "error"
      });
      return;
    }
    parseFloat(currentPurchase.amountPaid) || 0;
    processPurchase(shouldPrint);
  };
  const processPurchase = async (shouldPrint = false) => {
    setSaving(true);
    try {
      const payload = {
        party_id: currentPurchase.supplier.party_id || currentPurchase.supplier.id,
        items: currentPurchase.items.filter((i) => i.product).map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.price
          // Cost Price
        })),
        payment_method: currentPurchase.paymentMethod,
        amount_paid: currentPurchase.amountPaid,
        // Extra fields for accurate record
        discount: itemDiscounts + invoiceDiscount,
        tax: taxAmount,
        notes: currentPurchase.notes,
        reference: currentPurchase.invoiceNumber,
        date: currentPurchase.date,
        // Landed Cost Extras
        extras: (currentPurchase.extras || []).map((e) => ({
          category_id: e.category_id,
          amount: e.amount,
          method: e.method,
          description: e.description
        })),
        // Explicitly 'purchase' type
        type: "purchase",
        status: "received",
        // Auto-receive logic for now as per instructions "add to inventory"
        payment_account_id: currentPurchase.paymentAccountId || 1,
        cheque_date: currentPurchase.chequeDate,
        payment_reference: currentPurchase.paymentReference
      };
      const response = isEditMode && editState?.id ? await axios.put(route("store.purchases.update", [store.slug, editState.id]), payload) : await axios.post(route("store.purchases.store", {
        store_slug: store.slug
      }), payload);
      if (response.data.success) {
        localStorage.setItem("amd_product_latest_change", Date.now().toString());
        setLastPurchaseId(response.data.id);
        setShowSuccessModal(true);
        if (shouldPrint) {
          showAlert({ title: "Info", message: "Printing not yet configured for purchases.", type: "info" });
        }
      } else {
        showAlert({
          title: "Transaction Failed",
          message: response.data.message || "Unknown error",
          type: "error"
        });
      }
    } catch (error) {
      console.error(error);
      showAlert({
        title: "System Error",
        message: error.response?.data?.message || "Failed to save purchase.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };
  const initiateSave = (print = false) => {
    const isInputValid = validateInputs();
    if (!isInputValid) {
      showAlert({ title: "Validation Error", message: "Please fix highlighted errors.", type: "error" });
      return;
    }
    processPurchase(print);
  };
  if (!currentPurchase || isEditMode && !editState) {
    return /* @__PURE__ */ jsx("div", { className: "flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900", children: /* @__PURE__ */ jsx("p", { className: "text-slate-500 animate-pulse", children: "Initializing Purchase..." }) });
  }
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: isEditMode ? `Edit Purchase #${editState?.invoiceNumber || ""}` : "Add Purchase", activeMenu: "Purchases", fullScreen: false, hideHeader: true, noPadding: true, children: [
    /* @__PURE__ */ jsx(Head, { title: isEditMode ? "Edit Purchase" : "Add Purchase" }),
    /* @__PURE__ */ jsx(PurchaseTourGuide, { store }),
    aiPrefillNotice && /* @__PURE__ */ jsxs("div", { className: "mx-4 mt-3 px-5 py-3.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-black uppercase tracking-wider text-indigo-500", children: "From AI Scan" }),
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold text-slate-600 dark:text-slate-300", children: [
          aiPrefillNotice.count,
          " line",
          aiPrefillNotice.count === 1 ? "" : "s",
          " filled in",
          aiPrefillNotice.party ? ` from ${aiPrefillNotice.party}` : "",
          aiPrefillNotice.reference ? ` · ref ${aiPrefillNotice.reference}` : "",
          "."
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-amber-600 dark:text-amber-500", children: "Nothing is saved yet — check every line, then press Save." }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setAiPrefillNotice(null),
            className: "ml-auto text-2xs font-black uppercase tracking-wider text-slate-400 hover:text-slate-700 dark:hover:text-white",
            children: "Dismiss"
          }
        )
      ] }),
      aiPrefillNotice.costChanges?.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-3 pt-3 border-t border-indigo-500/20", children: [
        /* @__PURE__ */ jsx("p", { className: "text-2xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-500 mb-1.5", children: "Cost change — this will affect future profit calculations" }),
        /* @__PURE__ */ jsx("ul", { className: "space-y-0.5", children: aiPrefillNotice.costChanges.map((c, i) => /* @__PURE__ */ jsxs("li", { className: "text-1xs font-semibold text-slate-600 dark:text-slate-300", children: [
          c.name,
          ": ",
          formatCurrency(c.from),
          " → ",
          /* @__PURE__ */ jsx("span", { className: "text-amber-600 dark:text-amber-500", children: formatCurrency(c.to) })
        ] }, i)) }),
        /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 mt-1.5 leading-relaxed", children: "Saving receives stock at the new cost, which becomes the FIFO layer used for COGS. If a figure was misread, correct it before saving." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: `h-full flex-1 flex flex-col bg-slate-50 dark:bg-void-800 transition-all duration-500 ${isSeniorMode ? "text-[20px] senior-mode" : ""}`, children: [
      /* @__PURE__ */ jsx("style", { children: `
                    .senior-mode input, .senior-mode button, .senior-mode p, .senior-mode span, .senior-mode td, .senior-mode th {
                        font-size: 1.25rem !important;
                    }
                    .senior-mode .text-emerald-400, .senior-mode .text-emerald-500 {
                        color: #059669 !important;
                        font-weight: 900 !important;
                    }
                    .senior-mode .text-indigo-400, .senior-mode .text-indigo-500 {
                        color: #2563eb !important;
                        font-weight: 900 !important;
                    }
                    .senior-mode .bg-slate-900, .senior-mode .bg-void-700 {
                        background-color: #ffffff !important;
                        color: #000000 !important;
                        border: 2px solid #000000 !important;
                    }
                    .hide-scrollbar::-webkit-scrollbar { display: none; }
                    .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

                    /* Hide number input spinner arrows — scroll-wheel still works */
                    input[type="number"]::-webkit-outer-spin-button,
                    input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                    input[type="number"] { -moz-appearance: textfield; }
                    
                    /* Text Scaling System */
                    .text-scale-2 { font-size: 1.05em !important; }
                    .text-scale-3 { font-size: 1.15em !important; }
                    .text-scale-4 { font-size: 1.25em !important; }
                    .text-scale-5 { font-size: 1.4em !important; }
                    
                    [class*="text-scale-"] input, 
                    [class*="text-scale-"] select, 
                    [class*="text-scale-"] button:not(.w-7) { 
                        height: auto !important;
                        padding-top: 0.6em !important;
                        padding-bottom: 0.6em !important;
                    }
                    
                    .text-scale-2 .text-xs { font-size: 0.85rem !important; }
                    .text-scale-3 .text-xs { font-size: 0.95rem !important; }
                    .text-scale-4 .text-xs { font-size: 1.05rem !important; }
                    .text-scale-5 .text-xs { font-size: 1.15rem !important; }
                ` }),
      /* @__PURE__ */ jsxs("div", { className: `flex-1 flex flex-col lg:flex-row gap-2 min-h-0 px-2 pb-0 pt-2 lg:overflow-hidden overflow-y-auto text-scale-${textSize}`, children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden min-h-[400px] lg:min-h-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex items-center gap-1 px-3 pt-2 pb-0 overflow-x-auto hide-scrollbar border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 shrink-0", children: [
            activePurchases.map((purchase2, idx) => /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => setCurrentPurchaseId(purchase2.id),
                className: `
                                    flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all min-w-[100px] max-w-[160px] relative group text-xs
                                    ${currentPurchaseId === purchase2.id ? "bg-white dark:bg-slate-900 text-indigo-600" : "bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"}
                                `,
                children: [
                  /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${currentPurchaseId === purchase2.id ? "bg-indigo-500 animate-pulse" : "bg-slate-400"}` }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold truncate", children: purchase2.supplier?.name || `Purchase #${idx + 1}` }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: (e) => {
                        e.stopPropagation();
                        const proceed = () => {
                          removePurchase(purchase2.id);
                          if (activePurchases.length === 1) router.visit(route("store.purchases.index", {
                            store_slug: store.slug
                          }));
                        };
                        if (activePurchases.length === 1 && purchase2.items.length > 1) {
                          showConfirm({
                            title: "Discard Purchase?",
                            message: "You have unsaved items. Discarding will lose this data.",
                            type: "error",
                            confirmLabel: "Discard",
                            onConfirm: proceed
                          });
                        } else {
                          proceed();
                        }
                      },
                      className: `ml-auto flex items-center justify-center w-5 h-5 rounded-md transition-all ${currentPurchaseId === purchase2.id ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 opacity-100" : "opacity-0 group-hover:opacity-100 text-slate-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"}`,
                      children: /* @__PURE__ */ jsx(X, { size: 10, strokeWidth: 3 })
                    }
                  )
                ]
              },
              purchase2.id
            )),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => addPurchase({
                  delivery_charge: defaultDelivery,
                  extra_charge_value: defaultExtraValue,
                  extra_charge_label: defaultExtraLabel
                }),
                className: "px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 shrink-0",
                title: "New Tab",
                children: /* @__PURE__ */ jsx(Plus, { size: 12 })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex px-3 py-2 border-b border-slate-100 dark:border-slate-800 items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30 shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    setShowQuickEntry(!showQuickEntry);
                    if (!showQuickEntry) {
                      setTimeout(() => document.getElementById("quick-entry-input")?.focus(), 50);
                    }
                  },
                  className: `flex items-center justify-center w-12 h-12 rounded-2xl transition-all border ${showQuickEntry ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20" : "bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50"}`,
                  title: "Toggle Quick Add (Alt+Q)",
                  children: /* @__PURE__ */ jsx(Zap, { size: 20, className: showQuickEntry ? "fill-current" : "" })
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setIsScanning(true),
                  className: "flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 transition-all border border-slate-200 dark:border-slate-700 shadow-sm",
                  title: "Scanning Mode",
                  children: [
                    /* @__PURE__ */ jsx(ScanBarcode, { size: 20 }),
                    /* @__PURE__ */ jsx("span", { className: "text-sm font-bold", children: "Scan" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-xl", id: "tour-purchase-supplier", children: [
              /* @__PURE__ */ jsx("div", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400", children: /* @__PURE__ */ jsx(User, { size: 18 }) }),
              currentPurchase.supplier ? /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxs("div", { className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-10 py-3.5 flex items-center justify-between shadow-sm", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: currentPurchase.supplier.name }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: currentPurchase.supplier.phone || "No Phone" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        patchPurchase({ supplier: null });
                        setSupplierSearch("");
                      },
                      className: "absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors",
                      children: /* @__PURE__ */ jsx(X, { size: 18 })
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500", children: /* @__PURE__ */ jsx(User, { size: 18 }) })
              ] }) : /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsx(
                  AsyncPartyCombobox,
                  {
                    type: "all",
                    selectedItem: currentPurchase.supplier,
                    onSelect: (supplier) => {
                      patchPurchase({ supplier });
                      setSupplierError(false);
                    },
                    onCreateNew: () => setIsPartyModalOpen(true),
                    onEdit: (supplier) => {
                      setEditingParty(supplier);
                      setIsPartyModalOpen(true);
                    },
                    placeholder: "Search Party (Name/Phone)...",
                    addNewLabel: "Create New Party",
                    inputClassName: `h-9 min-h-[36px] text-xs py-1.5 ${supplierError ? "!border-red-500 !ring-red-500/20" : ""}`
                  }
                ),
                supplierError && /* @__PURE__ */ jsx("p", { className: "absolute -bottom-2 left-3.5 bg-red-600 text-white text-4xs font-black uppercase px-1.5 py-0.5 rounded shadow-md z-20 animate-pulse", children: "Please select supplier" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => patchPurchase({ paymentMethod: "credit" }),
                    className: `px-3 py-1.5 rounded-lg text-2xs font-black flex items-center gap-1.5 transition-all ${currentPurchase.paymentMethod === "credit" ? "bg-emerald-500 text-white shadow shadow-emerald-500/20" : "text-slate-500 hover:text-slate-700"}`,
                    children: [
                      /* @__PURE__ */ jsx(CreditCard, { size: 12 }),
                      " CREDIT"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => patchPurchase({ paymentMethod: "cash" }),
                    className: `px-3 py-1.5 rounded-lg text-2xs font-black flex items-center gap-1.5 transition-all ${currentPurchase.paymentMethod === "cash" ? "bg-orange-500 text-white shadow shadow-orange-500/20" : "text-slate-500 hover:text-slate-700"}`,
                    children: [
                      /* @__PURE__ */ jsx(Banknote, { size: 12 }),
                      " CASH"
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative group/accounts", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 text-2xs font-black min-w-[120px] justify-between",
                    children: [
                      /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5 truncate", children: [
                        /* @__PURE__ */ jsx(Wallet, { size: 12, className: "text-indigo-500" }),
                        currentPurchase.selectedBankName || accounts.find((a) => a.id === (currentPurchase.paymentAccountId || 1))?.name || "Cash in Hand"
                      ] }),
                      /* @__PURE__ */ jsx(ChevronRight, { size: 12, className: "rotate-90 text-slate-400" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("div", { className: "absolute top-full pt-2 right-0 w-48 z-50 overflow-hidden hidden group-hover/accounts:block animate-in fade-in slide-in-from-top-2", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden", children: [
                  /* @__PURE__ */ jsx("div", { className: "p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50", children: /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase", children: "Pay From" }) }),
                  /* @__PURE__ */ jsx("div", { className: "max-h-48 overflow-y-auto custom-scrollbar p-1", children: accounts.map((acc) => /* @__PURE__ */ jsxs(
                    "button",
                    {
                      onClick: () => {
                        if (acc.isBank) {
                          patchPurchase({
                            paymentAccountId: acc.realAccountId,
                            selectedBankName: acc.name,
                            paymentReference: `Paid from: ${acc.name}`
                          });
                        } else {
                          patchPurchase({
                            paymentAccountId: acc.id,
                            selectedBankName: null,
                            paymentReference: ""
                          });
                        }
                      },
                      className: `w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-between ${(currentPurchase.paymentAccountId || 1) === acc.id ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`,
                      children: [
                        /* @__PURE__ */ jsx("span", { children: acc.name }),
                        (currentPurchase.paymentAccountId || 1) === acc.id && /* @__PURE__ */ jsx(CheckCircle2, { size: 12 })
                      ]
                    },
                    acc.id
                  )) })
                ] }) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => setShowTextSizeMenu(!showTextSizeMenu),
                    className: `flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all border text-2xs font-black ${textSize > 1 ? "bg-purple-500 text-white border-purple-500 shadow shadow-purple-500/20" : "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30"}`,
                    title: "Change Text Size",
                    children: [
                      /* @__PURE__ */ jsx(Type, { size: 12 }),
                      " Aa+ ",
                      textSize > 1 && `(${textSize})`
                    ]
                  }
                ),
                showTextSizeMenu && /* @__PURE__ */ jsx("div", { className: "absolute top-full mt-2 right-0 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2", children: [1, 2, 3, 4, 5].map((size) => /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      setTextSize(size);
                      setShowTextSizeMenu(false);
                    },
                    className: `w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${textSize === size ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600" : "text-slate-600 dark:text-slate-300"}`,
                    children: size === 1 ? "Normal" : size === 2 ? "Large" : size === 3 ? "Larger" : size === 4 ? "Senior" : "Max"
                  },
                  size
                )) })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setShowSettingsDrawer(true),
                  className: "flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 text-2xs font-black",
                  title: "Quick Settings",
                  children: /* @__PURE__ */ jsx(Settings, { size: 12 })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex lg:hidden flex-col gap-1.5 p-1.5 bg-void-800 border-b border-slate-800/80 shrink-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between w-full relative", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => router.visit(route("store.purchases.index", { store_slug: store?.slug })),
                  className: "flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 shadow-sm",
                  title: "Go Back",
                  children: /* @__PURE__ */ jsx(ArrowLeft, { size: 14 })
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => setShowMobilePurchaseModal(true),
                  className: "flex items-center gap-1.5 px-2.5 py-0.5 bg-indigo-900/30 border border-indigo-800 rounded-full text-1xs font-black text-indigo-400 max-w-[60%] shadow-sm active:scale-95 transition-all",
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" }),
                    /* @__PURE__ */ jsx("span", { className: "truncate", children: currentPurchase.supplier?.name || `Purchase #${activePurchases.findIndex((p) => p.id === currentPurchase.id) + 1}` }),
                    /* @__PURE__ */ jsx(ChevronDown, { size: 11, className: "text-indigo-400 shrink-0" })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setShowSettingsDrawer(true),
                    className: "flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 shadow-sm hover:text-white",
                    title: "Settings",
                    children: /* @__PURE__ */ jsx(Settings, { size: 13 })
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      if (window.confirm("Are you sure you want to cancel and discard this purchase?")) {
                        removePurchase(currentPurchase.id);
                        if (activePurchases.length === 1) {
                          router.visit(route("store.purchases.index", { store_slug: store?.slug }));
                        }
                      }
                    },
                    className: "flex items-center justify-center w-7 h-7 rounded-lg bg-slate-800 text-red-400 hover:text-red-500 border border-slate-700 shadow-sm active:scale-95 transition-all",
                    title: "Cancel Purchase",
                    children: /* @__PURE__ */ jsx(X, { size: 14 })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 w-full", children: [
              /* @__PURE__ */ jsxs("div", { className: "relative flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none", children: /* @__PURE__ */ jsx(User, { size: 13 }) }),
                currentPurchase.supplier ? /* @__PURE__ */ jsx("div", { className: "relative", children: /* @__PURE__ */ jsxs("div", { className: "w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-7 py-1.5 flex items-center justify-between shadow-sm min-h-[36px]", children: [
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-200 text-xs truncate leading-tight", children: currentPurchase.supplier.name }),
                    /* @__PURE__ */ jsx("p", { className: "text-3xs text-slate-500 leading-none", children: currentPurchase.supplier.phone || "No Phone" })
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        patchPurchase({ supplier: null });
                        setSupplierSearch("");
                      },
                      className: "absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors",
                      children: /* @__PURE__ */ jsx(X, { size: 12 })
                    }
                  )
                ] }) }) : /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx(
                    AsyncPartyCombobox,
                    {
                      type: "all",
                      selectedItem: currentPurchase.supplier,
                      onSelect: (supplier) => {
                        patchPurchase({ supplier });
                        setSupplierError(false);
                      },
                      onCreateNew: () => setIsPartyModalOpen(true),
                      onEdit: (supplier) => {
                        setEditingParty(supplier);
                        setIsPartyModalOpen(true);
                      },
                      placeholder: "Search Supplier...",
                      addNewLabel: "Create Supplier",
                      inputClassName: `h-9 min-h-[36px] text-xs py-1.5 ${supplierError ? "!border-red-500 !ring-red-500/20" : ""}`
                    }
                  ),
                  supplierError && /* @__PURE__ */ jsx("p", { className: "absolute -bottom-2 left-3.5 bg-red-600 text-white text-4xs font-black uppercase px-1.5 py-0.5 rounded shadow-md z-20 animate-pulse", children: "Please select supplier" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 bg-slate-800 rounded-lg p-0.5 border border-slate-700 h-[36px]", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => patchPurchase({ paymentMethod: "credit" }),
                      className: `px-2 py-1 rounded text-2xs font-black transition-all ${currentPurchase.paymentMethod === "credit" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500"}`,
                      children: "CREDIT"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => patchPurchase({ paymentMethod: "cash" }),
                      className: `px-2 py-1 rounded text-2xs font-black transition-all ${currentPurchase.paymentMethod === "cash" ? "bg-orange-600 text-white shadow-sm" : "text-slate-500"}`,
                      children: "CASH"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "relative group/accounts-mobile shrink-0 h-[36px]", children: [
                  /* @__PURE__ */ jsx("button", { type: "button", className: "flex items-center justify-center w-9 h-[36px] rounded-lg bg-slate-800 text-indigo-400 border border-slate-700 shadow-sm active:scale-95", children: /* @__PURE__ */ jsx(Wallet, { size: 13 }) }),
                  /* @__PURE__ */ jsx("div", { className: "absolute right-0 top-full pt-1 z-50 hidden group-hover/accounts-mobile:block", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden w-36 p-1", children: [
                    /* @__PURE__ */ jsx("div", { className: "p-1 border-b border-slate-700 bg-slate-900/50", children: /* @__PURE__ */ jsx("p", { className: "text-4xs font-bold text-slate-500 uppercase", children: "Paid From" }) }),
                    /* @__PURE__ */ jsx("div", { className: "max-h-32 overflow-y-auto custom-scrollbar p-0.5", children: accounts.map((acc) => /* @__PURE__ */ jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => {
                          if (acc.isBank) {
                            patchPurchase({
                              paymentAccountId: acc.realAccountId,
                              selectedBankName: acc.name,
                              paymentReference: `Paid from: ${acc.name}`
                            });
                          } else {
                            patchPurchase({
                              paymentAccountId: acc.id,
                              selectedBankName: null,
                              paymentReference: ""
                            });
                          }
                        },
                        className: `w-full text-left px-1.5 py-0.5 rounded text-3xs font-bold transition-colors flex items-center justify-between ${(currentPurchase.paymentAccountId || 1) === acc.id ? "bg-indigo-900/20 text-indigo-400" : "text-slate-300 hover:bg-slate-700"}`,
                        children: [
                          /* @__PURE__ */ jsx("span", { className: "truncate", children: acc.name }),
                          (currentPurchase.paymentAccountId || 1) === acc.id && /* @__PURE__ */ jsx(CheckCircle2, { size: 9 })
                        ]
                      },
                      acc.id
                    )) })
                  ] }) })
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { ref: itemsContainerRef, className: "flex-1 overflow-y-auto hide-scrollbar px-2 py-2", children: [
            /* @__PURE__ */ jsxs("table", { className: "hidden md:table w-full border-separate border-spacing-y-1.5", children: [
              /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-xs font-bold text-slate-400 uppercase tracking-wide", children: [
                /* @__PURE__ */ jsx("th", { className: "pb-2 w-8" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 pl-3 w-10 text-center", children: "#" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2", children: "Item Description" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 w-20 text-center", children: "Qty" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 w-20 text-center text-xs text-emerald-600", children: "Free" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 w-28 text-right", children: "Price" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 w-32 text-right", children: "Discount" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 w-28 text-right", children: "Total" }),
                /* @__PURE__ */ jsx("th", { className: "pb-2 w-10" })
              ] }) }),
              /* @__PURE__ */ jsxs("tbody", { children: [
                showQuickEntry && /* @__PURE__ */ jsxs("tr", { className: "bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 border border-indigo-200 dark:border-indigo-800/50 rounded-xl overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200", children: [
                  /* @__PURE__ */ jsx("td", { className: "py-3" }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 pl-3", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(Zap, { size: 16, className: "text-indigo-600" }) }) }),
                  /* @__PURE__ */ jsxs("td", { className: "py-3 relative px-2", children: [
                    /* @__PURE__ */ jsx(
                      AsyncProductCombobox,
                      {
                        selectedItem: quickEntry.product,
                        onSelect: (product) => selectQuickProduct(product),
                        onCreateNew: (name) => {
                          setProductModalMode("create");
                          setEditingProduct({ name });
                          setIsProductModalOpen(true);
                        },
                        onEdit: handleEditProduct,
                        placeholder: "Quick Add Product...",
                        addNewLabel: "Add New Product",
                        hideCostAndMargin: !isAdmin
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        id: "quick-entry-input",
                        type: "text",
                        className: "opacity-0 w-0 h-0 absolute",
                        value: quickEntry.name,
                        onChange: (e) => handleQuickSearch(e.target.value)
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 text-center", children: /* @__PURE__ */ jsxs("div", { className: "md:col-span-1", children: [
                    /* @__PURE__ */ jsx("label", { className: "text-2xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block", children: "Qty" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        ref: quantityRef,
                        type: "number",
                        min: "1",
                        value: quickEntry.quantity,
                        onChange: (e) => setQuickEntry({ ...quickEntry, quantity: parseFloat(e.target.value) || 0 }),
                        onKeyDown: (e) => {
                          if (e.key === "Enter") {
                            addQuickItem();
                          }
                        },
                        className: "w-full bg-white dark:bg-slate-800 border-none rounded-xl px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 shadow-sm text-center"
                      }
                    )
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 text-center", children: /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: quickEntry.freeQuantity || "",
                      placeholder: "0",
                      onChange: (e) => setQuickEntry((prev) => ({ ...prev, freeQuantity: parseFloat(e.target.value) || 0 })),
                      onFocus: () => setQuickResults([]),
                      className: "w-16 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2 focus:ring-2 ring-emerald-500/20 outline-none placeholder-emerald-300"
                    }
                  ) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: quickEntry.price,
                      onChange: (e) => setQuickEntry((prev) => ({ ...prev, price: parseFloat(e.target.value) || 0 })),
                      onFocus: () => setQuickResults([]),
                      onKeyDown: (e) => e.key === "Enter" && addQuickItem(),
                      className: "w-24 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 outline-none"
                    }
                  ) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        ref: discountRef,
                        type: "number",
                        value: quickEntry.discount,
                        onChange: (e) => setQuickEntry((prev) => ({ ...prev, discount: parseFloat(e.target.value) || 0 })),
                        onFocus: () => setQuickResults([]),
                        onKeyDown: (e) => e.key === "Enter" && addQuickItem(),
                        className: "w-20 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900/30 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 outline-none"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => {
                          setQuickResults([]);
                          setQuickEntry((prev) => ({ ...prev, discountType: prev.discountType === "fixed" ? "percent" : "fixed" }));
                        },
                        className: `w-8 h-8 rounded-lg text-xs font-black transition-all ${quickEntry.discountType === "percent" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`,
                        children: quickEntry.discountType === "percent" ? "%" : getCurrencySymbol()
                      }
                    )
                  ] }) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 text-right", children: /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: addQuickItem,
                      className: "w-8 h-8 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow shadow-indigo-500/30 flex items-center justify-center active:scale-90",
                      children: /* @__PURE__ */ jsx(Plus, { size: 18 })
                    }
                  ) }),
                  /* @__PURE__ */ jsx("td", { className: "py-3 pr-3" })
                ] }),
                currentPurchase.items.map((item, idx) => /* @__PURE__ */ jsxs(
                  "tr",
                  {
                    className: `group animate-in fade-in duration-200 ${draggedItemIndex === idx ? "opacity-50" : ""}`,
                    draggable: true,
                    onDragStart: (e) => {
                      handleDragStart(e, idx);
                    },
                    onDragOver: (e) => handleDragOver(e, idx),
                    onDragEnd: handleDragEnd,
                    children: [
                      /* @__PURE__ */ jsx(
                        "td",
                        {
                          className: "bg-slate-50 dark:bg-slate-800/50 rounded-l-xl py-3 pl-2 cursor-ns-resize group-active:cursor-grabbing",
                          onMouseDown: (e) => {
                            e.currentTarget.parentElement.setAttribute("draggable", "true");
                          },
                          onMouseUp: (e) => {
                            e.currentTarget.parentElement.setAttribute("draggable", "false");
                          },
                          children: /* @__PURE__ */ jsx(GripVertical, { size: 16, className: "text-slate-300 hover:text-slate-500 transition-colors" })
                        }
                      ),
                      /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 text-sm font-bold text-slate-400 text-center", children: idx + 1 }),
                      /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 relative px-2", children: /* @__PURE__ */ jsx(
                        AsyncProductCombobox,
                        {
                          id: idx === 0 ? "tour-purchase-product" : void 0,
                          selectedItem: item.product,
                          onSelect: (product) => selectProduct(product, item.id),
                          onCreateNew: (name) => {
                            setEditingProduct({ name });
                            setProductModalMode("create");
                            setIsProductModalOpen(true);
                          },
                          onEdit: handleEditProduct,
                          placeholder: "Search item...",
                          addNewLabel: "Add New Product",
                          hideCostAndMargin: !isAdmin
                        }
                      ) }),
                      /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 text-center align-middle", children: /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col items-center", children: [
                        /* @__PURE__ */ jsx(
                          WheelInput,
                          {
                            id: idx === 0 ? "tour-purchase-quantity" : void 0,
                            type: "number",
                            value: item.quantity ?? 1,
                            onChange: (e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0),
                            onWheel: (e) => {
                              e.preventDefault();
                              const delta = e.deltaY < 0 ? 1 : -1;
                              updateItem(item.id, "quantity", Math.max(1, (parseFloat(item.quantity) || 0) + delta));
                            },
                            onFocus: (e) => {
                              e.target.select();
                              setActiveItemIndex(null);
                              setProductResults([]);
                            },
                            className: "w-16 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-center text-sm font-bold py-2 focus:ring-2 ring-indigo-500/20 transition-all no-spinner"
                          }
                        ),
                        item.product && /* @__PURE__ */ jsxs("span", { className: `absolute -bottom-4 text-2xs font-bold whitespace-nowrap ${item.available_stock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`, children: [
                          "(Avail: ",
                          item.available_stock || 0,
                          ")"
                        ] })
                      ] }) }),
                      /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 text-center align-middle", children: /* @__PURE__ */ jsx(
                        WheelInput,
                        {
                          type: "number",
                          value: item.freeQuantity || "",
                          placeholder: "0",
                          onChange: (e) => updateItem(item.id, "freeQuantity", parseFloat(e.target.value) || 0),
                          onWheel: (e) => {
                            e.preventDefault();
                            const delta = e.deltaY < 0 ? 1 : -1;
                            updateItem(item.id, "freeQuantity", Math.max(0, (parseFloat(item.freeQuantity) || 0) + delta));
                          },
                          className: "w-16 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg text-center text-sm font-bold text-emerald-600 dark:text-emerald-400 py-2 focus:ring-2 ring-emerald-500/20 transition-all placeholder-emerald-300/50 no-spinner"
                        }
                      ) }),
                      /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 text-right align-middle", children: /* @__PURE__ */ jsx(
                        WheelInput,
                        {
                          id: idx === 0 ? "tour-purchase-cost" : void 0,
                          type: "number",
                          value: item.price ?? 0,
                          onChange: (e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0),
                          onWheel: (e) => {
                            e.preventDefault();
                            const delta = e.deltaY < 0 ? 1 : -1;
                            const step = item.price >= 100 ? 10 : 1;
                            updateItem(item.id, "price", Math.max(0, (parseFloat(item.price) || 0) + delta * step));
                          },
                          onFocus: (e) => {
                            e.target.select();
                            setActiveItemIndex(null);
                            setProductResults([]);
                          },
                          className: "w-24 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 transition-all no-spinner"
                        }
                      ) }),
                      /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 text-right align-middle", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-2", children: [
                        /* @__PURE__ */ jsx(
                          WheelInput,
                          {
                            type: "number",
                            value: item.discount ?? 0,
                            onChange: (e) => updateItem(item.id, "discount", parseFloat(e.target.value) || 0),
                            onWheel: (e) => {
                              e.preventDefault();
                              const delta = e.deltaY < 0 ? 1 : -1;
                              const step = item.discountType === "percent" ? 1 : item.price >= 100 ? 5 : 1;
                              updateItem(item.id, "discount", Math.max(0, (parseFloat(item.discount) || 0) + delta * step));
                            },
                            className: "w-20 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/20 transition-all no-spinner"
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            onClick: () => updateItem(item.id, "discountType", item.discountType === "fixed" ? "percent" : "fixed"),
                            className: `w-8 h-8 rounded-lg text-xs font-black transition-all ${item.discountType === "percent" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-600"}`,
                            children: item.discountType === "percent" ? "%" : getCurrencySymbol()
                          }
                        )
                      ] }) }),
                      /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 py-3 pr-3 align-middle", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
                        /* @__PURE__ */ jsx(
                          "button",
                          {
                            onClick: () => toggleItemTotalMode(item.id),
                            title: getItemTotalMode(item.id) === "price" ? "Recalculates: Price (scroll/click to change)" : "Recalculates: Qty (scroll/click to change)",
                            className: `w-7 h-7 rounded-md text-2xs font-black transition-all shrink-0 border flex items-center justify-center ${getItemTotalMode(item.id) === "price" ? "bg-indigo-600 text-white border-indigo-500 shadow shadow-indigo-500/30" : "bg-emerald-600 text-white border-emerald-500 shadow shadow-emerald-500/30"}`,
                            children: getItemTotalMode(item.id) === "price" ? store?.currency_symbol || "₨" : "#"
                          }
                        ),
                        /* @__PURE__ */ jsx(
                          WheelInput,
                          {
                            type: "number",
                            value: parseFloat(calculateLineTotal(item).toFixed(2)),
                            onChange: (e) => handleTotalChange(item, e.target.value),
                            onWheel: (e) => {
                              e.preventDefault();
                              const delta = e.deltaY < 0 ? 1 : -1;
                              const currentTotal = calculateLineTotal(item);
                              const step = currentTotal >= 100 ? 10 : 1;
                              handleTotalChange(item, String(Math.max(0, currentTotal + delta * step)));
                            },
                            onFocus: (e) => e.target.select(),
                            className: "w-24 bg-white dark:bg-slate-700 border border-indigo-300 dark:border-indigo-600 rounded-lg text-right text-sm font-bold py-2 px-3 focus:ring-2 ring-indigo-500/30 transition-all text-slate-800 dark:text-white no-spinner"
                          }
                        )
                      ] }) }),
                      /* @__PURE__ */ jsx("td", { className: "bg-slate-50 dark:bg-slate-800/50 rounded-r-xl py-3 pr-3 align-middle", children: /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => removeItem(item.id),
                          className: "p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all",
                          children: /* @__PURE__ */ jsx(Trash2, { size: 16 })
                        }
                      ) })
                    ]
                  },
                  item.id
                ))
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "md:hidden flex flex-col gap-2", children: currentPurchase.items.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-6 border border-dashed border-slate-250 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30", children: /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 font-bold", children: "No Items Added" }) }) : currentPurchase.items.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-200", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-2xs font-black text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0", children: idx + 1 }),
                  /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
                    AsyncProductCombobox,
                    {
                      selectedItem: item.product,
                      onSelect: (prod) => selectProduct(prod, item.id),
                      onCreateNew: (name) => {
                        setProductModalMode("create");
                        setEditingProduct({ name });
                        setIsProductModalOpen(true);
                      },
                      onEdit: handleEditProduct,
                      placeholder: "Select Product...",
                      addNewLabel: "Add Product",
                      hideCostAndMargin: true,
                      inputClassName: "!h-[30px] !py-0.5 !text-xs !pl-8"
                    }
                  ) })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => removeItem(item.id),
                    className: "p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors ml-1.5",
                    children: /* @__PURE__ */ jsx(Trash2, { size: 13 })
                  }
                )
              ] }),
              item.product && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-1.5 mt-1 items-end", children: [
                /* @__PURE__ */ jsxs("div", { className: "col-span-2 flex flex-col gap-0.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-slate-400 uppercase", children: "Qty" }),
                  /* @__PURE__ */ jsx(
                    WheelInput,
                    {
                      type: "number",
                      value: item.quantity ?? 1,
                      onChange: (e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0),
                      className: "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center text-xs font-bold py-1 focus:ring-1 ring-indigo-500/20 outline-none"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "col-span-2 flex flex-col gap-0.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-emerald-500 uppercase", children: "Free" }),
                  /* @__PURE__ */ jsx(
                    WheelInput,
                    {
                      type: "number",
                      value: item.freeQuantity ?? 0,
                      onChange: (e) => updateItem(item.id, "freeQuantity", parseFloat(e.target.value) || 0),
                      className: "w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg text-center text-xs font-bold py-1 text-emerald-600 dark:text-emerald-400 focus:ring-1 ring-emerald-500/20 outline-none"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "col-span-3 flex flex-col gap-0.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-slate-400 uppercase", children: "Price" }),
                  /* @__PURE__ */ jsx(
                    WheelInput,
                    {
                      type: "number",
                      value: item.price ?? 0,
                      onChange: (e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0),
                      className: "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right text-xs font-bold py-1 px-1 focus:ring-1 ring-indigo-500/20 outline-none"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "col-span-2 flex flex-col gap-0.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-slate-400 uppercase", children: "Disc" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pr-0.5", children: [
                    /* @__PURE__ */ jsx(
                      WheelInput,
                      {
                        type: "number",
                        value: item.discount ?? 0,
                        onChange: (e) => updateItem(item.id, "discount", parseFloat(e.target.value) || 0),
                        className: "w-full bg-transparent border-none text-right text-xs font-bold py-1 pl-1 pr-0.5 focus:ring-0 outline-none"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => updateItem(item.id, "discountType", item.discountType === "fixed" ? "percent" : "fixed"),
                        className: `w-3.5 h-3.5 rounded text-4xs font-black transition-all flex items-center justify-center shrink-0 ${item.discountType === "percent" ? "bg-indigo-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-550"}`,
                        children: item.discountType === "percent" ? "%" : getCurrencySymbol()
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "col-span-3 flex flex-col gap-0.5 text-right", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-3xs font-bold text-slate-400 uppercase", children: "Total" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => toggleItemTotalMode(item.id),
                        className: `w-4 h-4 rounded text-4xs font-black transition-all shrink-0 border flex items-center justify-center ${getItemTotalMode(item.id) === "price" ? "bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500" : "bg-emerald-600 dark:bg-emerald-500 text-white border-emerald-600 dark:border-emerald-500"}`,
                        children: getItemTotalMode(item.id) === "price" ? getCurrencySymbol() : "#"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      WheelInput,
                      {
                        type: "number",
                        value: parseFloat(calculateLineTotal(item).toFixed(2)),
                        onChange: (e) => handleTotalChange(item, e.target.value),
                        className: "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right text-xs font-extrabold py-1 px-1 focus:ring-1 ring-indigo-500/20 text-slate-800 dark:text-white outline-none"
                      }
                    )
                  ] })
                ] })
              ] })
            ] }, item.id)) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "shrink-0 px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center", children: /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: addItem,
              className: "px-5 py-2 flex items-center justify-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 transition-all active:scale-95 shadow-sm",
              children: [
                /* @__PURE__ */ jsx(Plus, { size: 14 }),
                " ADD NEW ITEM"
              ]
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "lg:hidden flex flex-col shrink-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-1 px-3 py-1 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-850 shrink-0", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => patchPurchase({ amountPaid: vendorTotal }),
                className: `py-1 rounded-lg border transition-all flex flex-col items-center justify-center ${currentPurchase.amountPaid === vendorTotal && vendorTotal > 0 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`,
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[7.5px] uppercase font-bold text-slate-400", children: "Vendor" }),
                  /* @__PURE__ */ jsx("span", { className: "text-2xs font-extrabold", children: formatCurrency(vendorTotal) })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => patchPurchase({ amountPaid: totalExtras }),
                className: `py-1 rounded-lg border transition-all flex flex-col items-center justify-center ${currentPurchase.amountPaid === totalExtras && totalExtras > 0 ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`,
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[7.5px] uppercase font-bold text-slate-400", children: "Extras" }),
                  /* @__PURE__ */ jsx("span", { className: "text-2xs font-extrabold", children: formatCurrency(totalExtras) })
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => patchPurchase({ amountPaid: grandTotal }),
                className: `py-1 rounded-lg border transition-all flex flex-col items-center justify-center ${currentPurchase.amountPaid === grandTotal && grandTotal > 0 ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`,
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-[7.5px] uppercase font-bold text-slate-400", children: "Full Pay" }),
                  /* @__PURE__ */ jsx("span", { className: "text-2xs font-extrabold", children: formatCurrency(grandTotal) })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: `grid gap-1 px-3 py-1 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-850 shrink-0 ${3 + (showDeliveryCharges ? 1 : 0) + (totalExtras >= 0 ? 1 : 0) === 5 ? "grid-cols-5" : 3 + (showDeliveryCharges ? 1 : 0) + (totalExtras >= 0 ? 1 : 0) === 4 ? "grid-cols-4" : "grid-cols-3"}`, children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-4xs text-slate-400 font-bold block mb-0.5 uppercase", children: "Discount" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: currentPurchase.discount ?? 0,
                  onChange: (e) => patchPurchase({ discount: parseFloat(e.target.value) || 0 }),
                  className: "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1 h-8 text-slate-800 dark:text-white text-xs font-bold text-right outline-none",
                  placeholder: "0"
                }
              )
            ] }),
            showDeliveryCharges && /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-4xs text-slate-400 font-bold block mb-0.5 uppercase", children: "Delivery" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: currentPurchase.delivery_charge ?? 0,
                  onChange: (e) => patchPurchase({ delivery_charge: parseFloat(e.target.value) || 0 }),
                  className: "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1 h-8 text-slate-800 dark:text-white text-xs font-bold text-right outline-none",
                  placeholder: "0"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-4xs text-slate-400 font-bold block mb-0.5 uppercase", children: "Landed Cost" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setShowSettingsDrawer(true),
                  className: "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1 h-8 text-orange-600 dark:text-orange-400 text-xs font-bold text-right outline-none flex items-center justify-end",
                  children: formatCurrency(totalExtras)
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-4xs text-slate-400 font-bold block mb-0.5 uppercase", children: "Paid" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  value: currentPurchase.amountPaid ?? 0,
                  onChange: (e) => patchPurchase({ amountPaid: parseFloat(e.target.value) || 0 }),
                  className: "w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1 h-8 text-slate-800 dark:text-white text-xs font-bold text-right outline-none",
                  placeholder: "0"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-4xs text-slate-400 font-bold block mb-0.5 uppercase", children: "Bal Due" }),
              /* @__PURE__ */ jsx("div", { className: `w-full bg-slate-100 dark:bg-slate-800 rounded-lg px-1 h-8 text-xs font-extrabold text-right border ${balanceDue > 0 ? "text-red-500 border-red-500/20" : "text-emerald-500 border-emerald-500/20"} flex items-center justify-end`, children: formatCurrency(balanceDue) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-2 py-1 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => {
                  if (window.confirm("Are you sure you want to cancel and discard this purchase?")) {
                    removePurchase(currentPurchase.id);
                    if (activePurchases.length === 1) {
                      router.visit(route("store.purchases.index", { store_slug: store?.slug }));
                    }
                  }
                },
                className: "w-1/4 py-2 border border-red-200 dark:border-red-800 text-red-500 rounded-xl font-bold text-xs hover:bg-red-50 dark:hover:bg-red-950/20 active:scale-95 transition-all text-center flex items-center justify-center",
                children: "Cancel"
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => initiateSave(false),
                disabled: saving,
                className: "w-3/4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50",
                children: [
                  /* @__PURE__ */ jsx(CheckCircle2, { size: 14 }),
                  saving ? "SAVING..." : `COMPLETE (${formatCurrency(grandTotal)})`
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "hidden lg:flex w-80 bg-void-700 flex-col overflow-hidden rounded-2xl shadow-2xl border border-slate-800 shrink-0", children: [
          /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-slate-800/50 bg-slate-900/30 shrink-0", children: currentPurchase.supplier ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: `rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0 ${textSize >= 4 ? "w-16 h-16 text-xl" : textSize >= 3 ? "w-14 h-14 text-lg" : "w-12 h-12 text-lg"}`, children: currentPurchase.supplier.name.charAt(0) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: `text-white font-bold truncate ${textSize >= 4 ? "text-lg" : textSize >= 3 ? "text-base" : "text-sm"}`, children: currentPurchase.supplier.name }),
                /* @__PURE__ */ jsx("p", { className: `text-slate-400 font-medium ${textSize >= 4 ? "text-sm" : textSize >= 3 ? "text-xs" : "text-2xs"}`, children: currentPurchase.supplier.phone || "No Phone" })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => {
                    patchPurchase({ supplier: null });
                    setSupplierSearch("");
                  },
                  className: "text-slate-600 hover:text-red-400 p-1.5 hover:bg-red-400/10 rounded-lg transition-all shrink-0",
                  children: /* @__PURE__ */ jsx(X, { size: 16 })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: `space-y-1 bg-slate-800/30 rounded-lg p-2 ${textSize >= 3 ? "text-sm" : "text-xs"}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-medium", children: "Balance:" }),
                /* @__PURE__ */ jsxs("span", { className: `font-black ${currentPurchase.supplier.current_balance >= 0 ? "text-emerald-400" : "text-red-400"}`, children: [
                  currentPurchase.supplier.current_balance >= 0 ? getCurrencySymbol() : `-${getCurrencySymbol()} `,
                  Math.abs(currentPurchase.supplier.current_balance || 0).toLocaleString()
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 font-medium shrink-0", children: "Address:" }),
                /* @__PURE__ */ jsx("span", { className: `text-right ${currentPurchase.supplier.address ? "text-slate-300" : "text-slate-600 italic"}`, children: currentPurchase.supplier.address || "Not set" })
              ] })
            ] })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-4 border border-dashed border-slate-700 rounded-xl", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-2 text-slate-500", children: /* @__PURE__ */ jsx(User, { size: 20 }) }),
            /* @__PURE__ */ jsx("p", { className: `text-slate-400 font-bold ${textSize >= 3 ? "text-sm" : "text-xs"}`, children: "No Supplier Selected" })
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 p-3 space-y-3 overflow-y-auto hide-scrollbar", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-3xs text-slate-500 font-bold uppercase block mb-1", children: "Bill / Ref #" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: currentPurchase.invoiceNumber || "",
                    onChange: (e) => patchPurchase({ invoiceNumber: e.target.value }),
                    className: "w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all",
                    placeholder: "PUR-000001"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-3xs text-slate-500 font-bold uppercase block mb-1", children: "Date" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: currentPurchase.date || "",
                    onChange: (e) => patchPurchase({ date: e.target.value }),
                    className: "w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-3xs text-slate-500 font-bold uppercase block mb-1", children: "Terms" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: currentPurchase.paymentTerms || "net30",
                  onChange: (e) => patchPurchase({ paymentTerms: e.target.value }),
                  className: "w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "immediate", children: "Immediate" }),
                    /* @__PURE__ */ jsx("option", { value: "net7", children: "Net 7" }),
                    /* @__PURE__ */ jsx("option", { value: "net15", children: "Net 15" }),
                    /* @__PURE__ */ jsx("option", { value: "net30", children: "Net 30" }),
                    /* @__PURE__ */ jsx("option", { value: "net60", children: "Net 60" })
                  ]
                }
              )
            ] }),
            currentPurchase.paymentAccountId === "CHEQUE" && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/30 animate-in slide-in-from-top-2", children: [
              /* @__PURE__ */ jsx("div", { className: "col-span-2", children: /* @__PURE__ */ jsxs("p", { className: "text-2xs text-indigo-400 font-black uppercase mb-2 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Wallet, { size: 12 }),
                " CHEQUE DETAILS"
              ] }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-3xs text-slate-500 font-bold uppercase block mb-1", children: "Cheque No" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: currentPurchase.paymentReference || "",
                    onChange: (e) => patchPurchase({ paymentReference: e.target.value }),
                    className: "w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder-slate-600",
                    placeholder: "XXXXXX"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "text-3xs text-slate-500 font-bold uppercase block mb-1", children: "Cheque Date" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "date",
                    value: currentPurchase.chequeDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                    onChange: (e) => patchPurchase({ chequeDate: e.target.value }),
                    className: "w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-2 py-1.5 text-white text-2xs font-bold focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-3 border-t border-slate-800/50", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold", children: "Subtotal" }),
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold text-base", children: formatCurrency(subtotal) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold", children: "Item Discounts" }),
                /* @__PURE__ */ jsxs("span", { className: "text-red-400 font-bold text-sm", children: [
                  "- ",
                  formatCurrency(itemDiscounts)
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-slate-800/30 rounded-xl p-3 border border-slate-700/50", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold", children: "Bill Discount" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 text-xs", children: getCurrencySymbol() }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: currentPurchase.discount ?? 0,
                    onChange: (e) => patchPurchase({ discount: parseFloat(e.target.value) || 0 }),
                    className: "w-20 bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-indigo-500/20 transition-all",
                    placeholder: "0"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between bg-slate-800/30 rounded-xl p-3 border border-slate-700/50", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold", children: "Tax" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: currentPurchase.tax ?? 0,
                    onChange: (e) => patchPurchase({ tax: parseFloat(e.target.value) || 0 }),
                    className: "w-16 bg-slate-700/50 border border-slate-600/50 rounded-lg px-2 py-1.5 text-white font-bold text-sm text-right focus:ring-2 ring-indigo-500/20 transition-all",
                    placeholder: "0"
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-slate-500 text-xs", children: "%" })
              ] })
            ] }),
            showDeliveryCharges && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-2 hover:bg-slate-800/20 rounded-lg transition-colors group", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-500 font-bold group-hover:text-slate-400", children: "Delivery Charges" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-600 text-2xs", children: getCurrencySymbol() }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: currentPurchase.delivery_charge ?? 0,
                    onChange: (e) => patchPurchase({ delivery_charge: parseFloat(e.target.value) || 0 }),
                    className: "w-20 bg-transparent border-b border-dashed border-slate-700 hover:border-indigo-500 transition-all text-xs font-bold text-slate-300 text-right focus:ring-0 focus:border-indigo-500",
                    placeholder: "0"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2 pt-2 border-t border-slate-800/50", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold uppercase", children: "Landed Costs" }),
                totalExtras > 0 && /* @__PURE__ */ jsx("span", { className: "text-xs text-orange-400 font-bold", children: formatCurrency(totalExtras) })
              ] }),
              (currentPurchase.extras || []).map((extra, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/30 rounded-lg p-2 flex gap-2 items-start group", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: extra.category_id || "",
                      onChange: (e) => {
                        const newExtras = [...currentPurchase.extras || []];
                        newExtras[idx] = { ...newExtras[idx], category_id: e.target.value };
                        patchPurchase({ extras: newExtras });
                      },
                      className: "w-full bg-transparent border-none text-2xs font-bold text-white p-0 focus:ring-0 cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "", className: "bg-slate-800 text-slate-400", children: "Select Expense..." }),
                        expenseCategories.map((cat) => /* @__PURE__ */ jsx("option", { value: cat.id, className: "bg-slate-800", children: cat.name }, cat.id))
                      ]
                    }
                  ),
                  /* @__PURE__ */ jsxs(
                    "select",
                    {
                      value: extra.method || "value",
                      onChange: (e) => {
                        const newExtras = [...currentPurchase.extras || []];
                        newExtras[idx] = { ...newExtras[idx], method: e.target.value };
                        patchPurchase({ extras: newExtras });
                      },
                      className: "w-full bg-transparent border-none text-3xs text-slate-500 p-0 focus:ring-0 mt-0.5 cursor-pointer",
                      children: [
                        /* @__PURE__ */ jsx("option", { value: "value", children: "By Value" }),
                        /* @__PURE__ */ jsx("option", { value: "quantity", children: "By Quantity" })
                      ]
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("div", { className: "w-20", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 justify-end", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-500", children: getCurrencySymbol() }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: extra.amount || "",
                      onChange: (e) => {
                        const newExtras = [...currentPurchase.extras || []];
                        newExtras[idx] = { ...newExtras[idx], amount: parseFloat(e.target.value) || 0 };
                        patchPurchase({ extras: newExtras });
                      },
                      className: "w-full bg-transparent border-b border-dashed border-slate-600 focus:border-orange-500 text-right text-xs font-bold text-orange-300 p-0 focus:ring-0",
                      placeholder: "0"
                    }
                  )
                ] }) }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => {
                      const newExtras = (currentPurchase.extras || []).filter((_, i) => i !== idx);
                      patchPurchase({ extras: newExtras });
                    },
                    className: "text-slate-600 hover:text-red-400 p-0.5 opacity-0 group-hover:opacity-100 transition-all",
                    children: /* @__PURE__ */ jsx(X, { size: 12 })
                  }
                )
              ] }, extra.id || idx)),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: () => {
                    const newExtras = [...currentPurchase.extras || [], { id: Date.now(), category_id: "", amount: 0, method: "value" }];
                    patchPurchase({ extras: newExtras });
                  },
                  className: "w-full py-1.5 border border-dashed border-slate-700 hover:border-orange-500/50 hover:bg-orange-500/10 rounded-lg text-2xs font-bold text-slate-500 hover:text-orange-400 transition-all flex items-center justify-center gap-1",
                  children: [
                    /* @__PURE__ */ jsx(Plus, { size: 10 }),
                    " Add Landed Cost"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-800/20 rounded-xl p-2 border border-slate-700/50 space-y-2", children: [
              /* @__PURE__ */ jsx("p", { className: "text-2xs uppercase font-bold text-slate-500 pl-1", children: "Quick Pay" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-1.5", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => patchPurchase({ amountPaid: vendorTotal }),
                    className: `px-2 py-2 rounded-lg text-2xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${currentPurchase.amountPaid === vendorTotal && vendorTotal > 0 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"}`,
                    children: [
                      /* @__PURE__ */ jsx("span", { children: "Vendor" }),
                      /* @__PURE__ */ jsx("span", { className: "text-white", children: formatCurrency(vendorTotal) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => patchPurchase({ amountPaid: totalExtras }),
                    className: `px-2 py-2 rounded-lg text-2xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${currentPurchase.amountPaid === totalExtras && totalExtras > 0 ? "bg-orange-500/20 text-orange-400 border-orange-500/50" : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"}`,
                    children: [
                      /* @__PURE__ */ jsx("span", { children: "Extras" }),
                      /* @__PURE__ */ jsx("span", { className: "text-white", children: formatCurrency(totalExtras) })
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => patchPurchase({ amountPaid: grandTotal }),
                    className: `px-2 py-2 rounded-lg text-2xs font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${currentPurchase.amountPaid === grandTotal && grandTotal > 0 ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/50" : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"}`,
                    children: [
                      /* @__PURE__ */ jsx("span", { children: "Full" }),
                      /* @__PURE__ */ jsx("span", { className: "text-white", children: formatCurrency(grandTotal) })
                    ]
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-1", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 font-bold pl-1", children: "Payment:" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-emerald-600 text-xs", children: getCurrencySymbol() }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      id: "tour-purchase-paid",
                      type: "number",
                      value: currentPurchase.amountPaid ?? 0,
                      onChange: (e) => patchPurchase({ amountPaid: parseFloat(e.target.value) || 0 }),
                      onFocus: (e) => e.target.select(),
                      className: "w-24 bg-slate-800 border border-slate-600 rounded-lg px-2 py-1.5 text-emerald-400 font-bold text-sm text-right focus:ring-2 ring-emerald-500/20 transition-all",
                      placeholder: "0"
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between rounded-xl p-3 border ${balanceDue > 0 ? "bg-red-900/20 border-red-800/30" : "bg-emerald-900/20 border-emerald-800/30"}`, children: [
              /* @__PURE__ */ jsx("span", { className: `text-xs font-bold ${balanceDue > 0 ? "text-red-400" : "text-emerald-400"}`, children: "Balance Due" }),
              /* @__PURE__ */ jsx("span", { className: `font-bold text-base ${balanceDue > 0 ? "text-red-400" : "text-emerald-400"}`, children: formatCurrency(balanceDue) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-900 space-y-2 shrink-0 border-t border-slate-800", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
              /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-500 font-bold uppercase", children: "Total" }),
              /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-white", children: formatCurrency(grandTotal) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  id: "tour-purchase-save",
                  onClick: () => initiateSave(false),
                  disabled: saving,
                  className: "w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx(CheckCircle2, { size: 16 }),
                    saving ? "SAVING..." : isEditMode ? "UPDATE PURCHASE" : "COMPLETE PURCHASE"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => initiateSave(true),
                    disabled: saving,
                    className: "flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50",
                    children: [
                      /* @__PURE__ */ jsx(Printer, { size: 16 }),
                      saving ? "..." : "PRINT"
                    ]
                  }
                ),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      if (isEditMode) {
                        router.visit(route("store.purchases.index", {
                          store_slug: store.slug
                        }));
                        return;
                      }
                      showConfirm({
                        title: "Cancel Purchase?",
                        message: "Discard this purchase? Items will be lost.",
                        type: "warning",
                        confirmLabel: "Yes, Discard",
                        onConfirm: () => {
                          removePurchase(currentPurchase.id);
                          router.visit(route("store.purchases.index", {
                            store_slug: store.slug
                          }));
                        }
                      });
                    },
                    className: "flex-1 py-3 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-500 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all border border-red-500/20 active:scale-95",
                    children: [
                      /* @__PURE__ */ jsx(X, { size: 16 }),
                      " CANCEL"
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] })
      ] })
    ] }),
    showProfit && !showProfitModal && /* @__PURE__ */ jsx("div", { className: "fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-200", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900/95 backdrop-blur-lg rounded-2xl px-8 py-4 shadow-2xl border border-slate-700 flex items-center gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: `w-12 h-12 rounded-xl flex items-center justify-center ${"bg-emerald-500/20"}`, children: /* @__PURE__ */ jsx(TrendingUp, { size: 24, className: "text-emerald-400" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 font-bold uppercase", children: "Profit Margin" }),
          /* @__PURE__ */ jsx("p", { className: `text-2xl font-black ${"text-emerald-400"}`, children: formatCurrency(profit) })
        ] })
      ] }),
      grandTotal > 0 && /* @__PURE__ */ jsxs("div", { className: "border-l border-slate-700 pl-6", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 font-bold uppercase", children: "Margin %" }),
        /* @__PURE__ */ jsxs("p", { className: `text-xl font-black ${"text-emerald-400"}`, children: [
          (profit / grandTotal * 100).toFixed(1),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 italic", children: "↓ Drag down for details" })
    ] }) }),
    /* @__PURE__ */ jsx(
      FormModal,
      {
        isOpen: showSuccessModal,
        onClose: () => {
          setShowSuccessModal(false);
          resetToNewPurchase();
        },
        title: "Purchase Completed!",
        subtitle: "Your purchase has been recorded successfully",
        size: "md",
        children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center py-6 text-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-6 animate-bounce", children: /* @__PURE__ */ jsx(CheckCircle2, { size: 48, className: "text-emerald-500" }) }),
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-black text-slate-800 dark:text-white mb-2", children: "Transaction Successful" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm mb-8", children: "Stock has been updated." }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-3 w-full", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  showAlert({ title: "Info", message: "Print not configured yet.", type: "info" });
                },
                className: "w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/20",
                children: [
                  /* @__PURE__ */ jsx(Printer, { size: 20 }),
                  " PRINT"
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                id: "tour-new-transaction",
                onClick: () => {
                  setShowSuccessModal(false);
                  resetToNewPurchase();
                  if (store?.onboarding_step === "purchase_tour") {
                    router.reload({ only: ["store"] });
                  }
                },
                className: "w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black hover:bg-slate-200 transition-all",
                children: "NEW TRANSACTION"
              }
            )
          ] })
        ] })
      }
    ),
    isScanning && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5", children: [
          /* @__PURE__ */ jsx("div", { className: "w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/20", children: /* @__PURE__ */ jsx(ScanBarcode, { size: 28 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-slate-800 dark:text-white", children: "Scanning Mode" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 font-bold", children: "Scan items one after another" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { onClick: () => setIsScanning(false), className: "p-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all", children: /* @__PURE__ */ jsx(X, { size: 28, className: "text-slate-400" }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 space-y-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              autoFocus: true,
              type: "text",
              placeholder: "Scan Barcode Now...",
              value: scanBuffer,
              onChange: (e) => setScanBuffer(e.target.value),
              onKeyDown: handleScan,
              className: "w-full py-8 px-10 bg-slate-50 dark:bg-slate-800 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-[32px] text-3xl font-black text-center focus:ring-8 ring-indigo-500/10 placeholder-slate-200 transition-all"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "absolute right-8 top-1/2 -translate-y-1/2", children: /* @__PURE__ */ jsx("div", { className: "w-4 h-4 bg-red-500 rounded-full animate-ping" }) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "max-h-80 overflow-y-auto space-y-4 custom-scrollbar pr-2", children: scannedItems.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-16 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[40px]", children: [
          /* @__PURE__ */ jsx(Package, { size: 64, className: "mx-auto text-slate-200 mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-slate-400 font-black text-lg", children: "No items scanned yet" })
        ] }) : scannedItems.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-slate-100 dark:border-slate-800 animate-in slide-in-from-bottom-2 duration-200", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-5", children: [
            /* @__PURE__ */ jsx("span", { className: "w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-xs font-black text-slate-400 shadow-sm", children: idx + 1 }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("p", { className: "font-black text-slate-800 dark:text-white text-lg", children: [
                item.name,
                item.quantity > 1 && /* @__PURE__ */ jsxs("span", { className: "ml-2 text-emerald-500 text-base", children: [
                  "x",
                  item.quantity
                ] })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-indigo-500 font-black", children: [
                item.quantity,
                " @ ",
                getCurrencySymbol(),
                " ",
                item.price.toLocaleString(),
                " = ",
                getCurrencySymbol(),
                " ",
                (item.quantity * item.price).toLocaleString()
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setScannedItems((prev) => prev.filter((i) => i.id !== item.id)), className: "p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all", children: /* @__PURE__ */ jsx(Trash2, { size: 24 }) })
        ] }, item.id)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-base font-black text-slate-500 uppercase tracking-widest", children: [
          "Total: ",
          /* @__PURE__ */ jsxs("span", { className: "text-indigo-600", children: [
            scannedItems.length,
            " items"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsx("button", { onClick: () => setScannedItems([]), className: "px-8 py-4 text-sm font-black text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest", children: "Clear All" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: confirmScan,
              className: "bg-indigo-600 text-white px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest",
              children: "Add to Purchase"
            }
          )
        ] })
      ] })
    ] }) }),
    showProfitModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 shrink-0", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center", children: /* @__PURE__ */ jsx(TrendingUp, { className: "text-emerald-600", size: 20 }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-800 dark:text-white", children: "Profit Analysis" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Per-item breakdown" })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => {
              setShowProfitModal(false);
              setProfitLocked(false);
              setShowProfit(false);
            },
            className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all",
            children: /* @__PURE__ */ jsx(X, { size: 20, className: "text-slate-400" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-4", children: [
        /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "text-left text-2xs font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800", children: [
            /* @__PURE__ */ jsx("th", { className: "pb-2 pl-2", children: "#" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2", children: "Product" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 text-center", children: "Qty" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 text-right", children: "Cost" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 text-right", children: "Price" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 text-right", children: "Margin" }),
            /* @__PURE__ */ jsx("th", { className: "pb-2 text-right pr-2", children: "Profit" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: currentPurchase.items.filter((item) => item.product).map((item, idx) => {
            const cost = item.cost || item.product?.cost || item.product?.cost_price || 0;
            const lineTotal = calculateLineTotal(item);
            const lineCost = cost * item.quantity;
            const lineProfit = lineTotal - lineCost;
            const marginPercent = lineTotal > 0 ? (lineProfit / lineTotal * 100).toFixed(1) : 0;
            return /* @__PURE__ */ jsxs("tr", { className: "border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30", children: [
              /* @__PURE__ */ jsx("td", { className: "py-2 pl-2 text-slate-400 text-xs", children: idx + 1 }),
              /* @__PURE__ */ jsxs("td", { className: "py-2", children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-xs", children: item.product?.name || item.name }),
                /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400", children: item.product?.sku || "N/A" })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "py-2 text-center text-xs", children: item.quantity }),
              /* @__PURE__ */ jsxs("td", { className: "py-2 text-right text-xs text-slate-500", children: [
                getCurrencySymbol(),
                " ",
                cost.toLocaleString()
              ] }),
              /* @__PURE__ */ jsxs("td", { className: "py-2 text-right text-xs", children: [
                getCurrencySymbol(),
                " ",
                item.price.toLocaleString()
              ] }),
              /* @__PURE__ */ jsx("td", { className: "py-2 text-right", children: /* @__PURE__ */ jsxs("span", { className: `text-xs font-bold ${parseFloat(marginPercent) >= 0 ? "text-emerald-500" : "text-red-500"}`, children: [
                marginPercent,
                "%"
              ] }) }),
              /* @__PURE__ */ jsx("td", { className: "py-2 text-right pr-2", children: /* @__PURE__ */ jsxs("span", { className: `text-xs font-bold ${lineProfit >= 0 ? "text-emerald-600" : "text-red-600"}`, children: [
                getCurrencySymbol(),
                " ",
                lineProfit.toLocaleString()
              ] }) })
            ] }, item.id);
          }) })
        ] }),
        currentPurchase.items.filter((item) => item.product).length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-8 text-slate-400", children: /* @__PURE__ */ jsx("p", { className: "text-sm", children: "No products added yet" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-bold uppercase mb-1", children: "Total Cost" }),
          /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold text-slate-600", children: [
            getCurrencySymbol(),
            " ",
            totalCost.toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-bold uppercase mb-1", children: "Total Revenue" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-bold text-slate-800 dark:text-white", children: formatCurrency(grandTotal) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800", children: [
          /* @__PURE__ */ jsx("p", { className: "text-2xs text-emerald-600 font-bold uppercase mb-1", children: "Net Profit" }),
          /* @__PURE__ */ jsxs("p", { className: `text-lg font-bold ${"text-emerald-600"}`, children: [
            formatCurrency(profit),
            grandTotal > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs ml-1 opacity-70", children: [
              "(",
              (profit / grandTotal * 100).toFixed(1),
              "%)"
            ] })
          ] })
        ] })
      ] }) })
    ] }) }),
    showSettingsDrawer && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "fixed inset-0 bg-black/30 backdrop-blur-sm z-[90] animate-in fade-in duration-200",
          onClick: () => setShowSettingsDrawer(false)
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "fixed top-0 right-0 h-full w-80 bg-white dark:bg-slate-900 shadow-2xl z-[100] animate-in slide-in-from-right duration-300 flex flex-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center", children: /* @__PURE__ */ jsx(Settings, { size: 20, className: "text-slate-600 dark:text-slate-400" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-slate-800 dark:text-white", children: "Quick Settings" }),
              /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Purchase preferences" })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowSettingsDrawer(false),
              className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all",
              children: /* @__PURE__ */ jsx(X, { size: 20, className: "text-slate-400" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 p-4 space-y-4 overflow-y-auto", children: [
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-slate-400 uppercase tracking-wide", children: "Purchase Details" }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Bill / Ref #" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: currentPurchase.invoiceNumber || "",
                  onChange: (e) => patchPurchase({ invoiceNumber: e.target.value }),
                  className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 dark:text-white focus:ring-2 ring-indigo-500/20 outline-none",
                  placeholder: "PUR-000001"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Date" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: currentPurchase.date || "",
                  onChange: (e) => patchPurchase({ date: e.target.value }),
                  className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 dark:text-white focus:ring-2 ring-indigo-500/20 outline-none"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5", children: [
              /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Payment Terms" }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  value: currentPurchase.paymentTerms || "net30",
                  onChange: (e) => patchPurchase({ paymentTerms: e.target.value }),
                  className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 dark:text-white focus:ring-2 ring-indigo-500/20 outline-none hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer",
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "immediate", children: "Immediate" }),
                    /* @__PURE__ */ jsx("option", { value: "net7", children: "Net 7 Days" }),
                    /* @__PURE__ */ jsx("option", { value: "net15", children: "Net 15 Days" }),
                    /* @__PURE__ */ jsx("option", { value: "net30", children: "Net 30 Days" }),
                    /* @__PURE__ */ jsx("option", { value: "net60", children: "Net 60 Days" })
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-b border-slate-200 dark:border-slate-750 pb-1.5", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Landed Costs" }),
                totalExtras > 0 && /* @__PURE__ */ jsx("span", { className: "text-xs text-orange-500 font-black", children: formatCurrency(totalExtras) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
                (currentPurchase.extras || []).map((extra, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800/50 rounded-lg p-2 flex gap-1.5 items-start border border-slate-100 dark:border-slate-700 shadow-sm", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: extra.category_id || "",
                        onChange: (e) => {
                          const newExtras = [...currentPurchase.extras || []];
                          newExtras[idx] = { ...newExtras[idx], category_id: e.target.value };
                          patchPurchase({ extras: newExtras });
                        },
                        className: "w-full bg-transparent border-none text-2xs font-bold text-slate-750 dark:text-white p-0 focus:ring-0 cursor-pointer",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "", className: "bg-white dark:bg-slate-800 text-slate-400", children: "Select Expense..." }),
                          expenseCategories.map((cat) => /* @__PURE__ */ jsx("option", { value: cat.id, className: "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200", children: cat.name }, cat.id))
                        ]
                      }
                    ),
                    /* @__PURE__ */ jsxs(
                      "select",
                      {
                        value: extra.method || "value",
                        onChange: (e) => {
                          const newExtras = [...currentPurchase.extras || []];
                          newExtras[idx] = { ...newExtras[idx], method: e.target.value };
                          patchPurchase({ extras: newExtras });
                        },
                        className: "w-full bg-transparent border-none text-3xs text-slate-400 p-0 focus:ring-0 mt-0.5 cursor-pointer",
                        children: [
                          /* @__PURE__ */ jsx("option", { value: "value", children: "By Value" }),
                          /* @__PURE__ */ jsx("option", { value: "quantity", children: "By Quantity" })
                        ]
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "w-16 shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 justify-end", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-400", children: getCurrencySymbol() }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "number",
                        value: extra.amount || "",
                        onChange: (e) => {
                          const newExtras = [...currentPurchase.extras || []];
                          newExtras[idx] = { ...newExtras[idx], amount: parseFloat(e.target.value) || 0 };
                          patchPurchase({ extras: newExtras });
                        },
                        className: "w-full bg-transparent border-b border-dashed border-slate-300 dark:border-slate-600 focus:border-orange-500 text-right text-xs font-bold text-orange-600 dark:text-orange-400 p-0 focus:ring-0 outline-none",
                        placeholder: "0"
                      }
                    )
                  ] }) }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => {
                        const newExtras = (currentPurchase.extras || []).filter((_, i) => i !== idx);
                        patchPurchase({ extras: newExtras });
                      },
                      className: "text-slate-400 hover:text-red-500 p-0.5 transition-all shrink-0",
                      children: /* @__PURE__ */ jsx(X, { size: 12 })
                    }
                  )
                ] }, extra.id || idx)),
                /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => {
                      const newExtras = [...currentPurchase.extras || [], { id: Date.now(), category_id: "", amount: 0, method: "value" }];
                      patchPurchase({ extras: newExtras });
                    },
                    className: "w-full py-1.5 border border-dashed border-slate-200 dark:border-slate-700 hover:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-lg text-3xs font-bold text-slate-500 hover:text-orange-500 transition-all flex items-center justify-center gap-1 mt-1",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { size: 9 }),
                      " Add Landed Cost"
                    ]
                  }
                )
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-slate-400 uppercase tracking-wide", children: "Display" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(Type, { size: 18, className: "text-purple-500" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Large Text" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Bigger fonts for better visibility" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1", children: [1, 2, 3, 4, 5].map((s) => /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setTextSize(s),
                  className: `w-7 h-6 rounded-md text-xs font-bold transition-all ${textSize === s ? "bg-purple-500 text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`,
                  children: s
                },
                s
              )) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx(Zap, { size: 18, className: "text-indigo-500" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Quick Entry" }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Fast product entry row" })
                ] })
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setShowQuickEntry(!showQuickEntry),
                  className: `w-12 h-6 rounded-full transition-all ${showQuickEntry ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`,
                  children: /* @__PURE__ */ jsx("div", { className: `w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showQuickEntry ? "translate-x-6" : "translate-x-0.5"}` })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-slate-400 uppercase tracking-wide", children: "Permanent Defaults" }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl space-y-2 border border-indigo-100 dark:border-indigo-800/50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase", children: "Default Delivery" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs font-bold", children: getCurrencySymbol() }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: defaultDelivery,
                    onChange: (e) => setDefaultDelivery(parseFloat(e.target.value) || 0),
                    className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-white",
                    placeholder: "0"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl space-y-2 border border-purple-100 dark:border-purple-800/50", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-purple-600 dark:text-purple-400 uppercase", children: "Default Extra Field" }),
              /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: defaultExtraLabel,
                    onChange: (e) => setDefaultExtraLabel(e.target.value),
                    className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 dark:text-white",
                    placeholder: "Field Name (e.g. Service)"
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400 text-xs font-bold", children: getCurrencySymbol() }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: defaultExtraValue,
                      onChange: (e) => setDefaultExtraValue(parseFloat(e.target.value) || 0),
                      className: "w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-700 dark:text-white",
                      placeholder: "0"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/50", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center", children: /* @__PURE__ */ jsx(Plus, { size: 16, className: "text-amber-600" }) }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Multiple Extra Fields" }),
                    /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-500", children: "Add up to 10 custom charges" })
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setEnableMultipleExtras(!enableMultipleExtras),
                    className: `w-12 h-6 rounded-full transition-all ${enableMultipleExtras ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700"}`,
                    children: /* @__PURE__ */ jsx("div", { className: `w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${enableMultipleExtras ? "translate-x-6" : "translate-x-0.5"}` })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-slate-400 uppercase tracking-wide", children: "Show/Hide Fields" }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Delivery Charges" }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-500", children: "Show delivery charges field" })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setShowDeliveryCharges(!showDeliveryCharges),
                    className: `w-12 h-6 rounded-full transition-all ${showDeliveryCharges ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`,
                    children: /* @__PURE__ */ jsx("div", { className: `w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showDeliveryCharges ? "translate-x-6" : "translate-x-0.5"}` })
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Extra Field" }),
                  /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-500", children: "Show extra charge field(s)" })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setShowExtraField(!showExtraField),
                    className: `w-12 h-6 rounded-full transition-all ${showExtraField ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"}`,
                    children: /* @__PURE__ */ jsx("div", { className: `w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${showExtraField ? "translate-x-6" : "translate-x-0.5"}` })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-slate-400 uppercase tracking-wide", children: "Purchase Logic" }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Payment Method" }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => patchPurchase({ paymentMethod: "credit" }),
                      className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentPurchase.paymentMethod === "credit" ? "bg-emerald-500 text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"}`,
                      children: "Credit"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => patchPurchase({ paymentMethod: "cash" }),
                      className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentPurchase.paymentMethod === "cash" ? "bg-orange-500 text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"}`,
                      children: "Cash"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Default Tax Rate" }),
                /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: [0, 5, 10, 17].map((rate) => /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => patchPurchase({ tax: rate }),
                    className: `flex-1 py-2 rounded-lg text-xs font-bold transition-all ${currentPurchase.tax === rate ? "bg-indigo-500 text-white" : "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"}`,
                    children: [
                      rate,
                      "%"
                    ]
                  },
                  rate
                )) })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-white", children: "Payment Terms" }),
                /* @__PURE__ */ jsxs(
                  "select",
                  {
                    value: currentPurchase.paymentTerms || "net30",
                    onChange: (e) => patchPurchase({ paymentTerms: e.target.value }),
                    className: "w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-medium focus:ring-2 ring-indigo-500/20",
                    children: [
                      /* @__PURE__ */ jsx("option", { value: "immediate", children: "Immediate" }),
                      /* @__PURE__ */ jsx("option", { value: "net7", children: "Net 7 Days" }),
                      /* @__PURE__ */ jsx("option", { value: "net15", children: "Net 15 Days" }),
                      /* @__PURE__ */ jsx("option", { value: "net30", children: "Net 30 Days" }),
                      /* @__PURE__ */ jsx("option", { value: "net60", children: "Net 60 Days" })
                    ]
                  }
                )
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowSettingsDrawer(false),
            className: "w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:opacity-90 transition-all",
            children: "Done"
          }
        ) })
      ] })
    ] }),
    showMobilePurchaseModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200 font-sans", children: /* @__PURE__ */ jsxs("div", { className: "bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-slate-800 flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-black text-white", children: "Active Purchase Sessions" }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowMobilePurchaseModal(false),
            className: "p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 transition-colors",
            children: /* @__PURE__ */ jsx(X, { size: 16 })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-2.5", children: [
        activePurchases.map((pur, idx) => {
          const isCurrent = pur.id === currentPurchase.id;
          const itemCount = pur.items.filter((i) => i.product || i.name).length;
          const purTotal = pur.items.reduce((sum, item) => sum + (item.quantity + (item.freeQuantity || 0)) * item.price, 0);
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => {
                setCurrentPurchaseId(pur.id);
                setShowMobilePurchaseModal(false);
              },
              className: `p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isCurrent ? "bg-indigo-950/30 border-indigo-500 text-indigo-400 shadow shadow-indigo-500/10" : "bg-slate-800/40 border-slate-850 hover:border-slate-750 text-slate-350"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: `w-1.5 h-1.5 rounded-full ${isCurrent ? "bg-indigo-500 animate-pulse" : "bg-slate-600"}` }),
                    /* @__PURE__ */ jsx("p", { className: "font-extrabold text-xs text-white truncate", children: pur.supplier?.name || `Purchase #${idx + 1}` })
                  ] }),
                  /* @__PURE__ */ jsxs("p", { className: "text-2xs text-slate-500 mt-1", children: [
                    itemCount,
                    " ",
                    itemCount === 1 ? "item" : "items",
                    " • ",
                    formatCurrency(purTotal)
                  ] })
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: (e) => {
                      e.stopPropagation();
                      const proceed = () => {
                        removePurchase(pur.id);
                        if (activePurchases.length === 1) {
                          router.visit(route("store.purchases.index", { store_slug: store?.slug }));
                        }
                      };
                      if (activePurchases.length === 1 && pur.items.length > 1) {
                        showConfirm({
                          title: "Discard Purchase?",
                          message: "You have unsaved items.",
                          type: "error",
                          confirmLabel: "Discard",
                          onConfirm: proceed
                        });
                      } else {
                        proceed();
                      }
                    },
                    className: "p-1 rounded-md text-slate-550 hover:text-red-400 hover:bg-slate-800/80 transition-colors shrink-0",
                    children: /* @__PURE__ */ jsx(X, { size: 14 })
                  }
                )
              ]
            },
            pur.id
          );
        }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => {
              addPurchase({
                delivery_charge: defaultDelivery,
                extra_charge_value: defaultExtraValue,
                extra_charge_label: defaultExtraLabel
              });
              setShowMobilePurchaseModal(false);
            },
            className: "p-3.5 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-2 text-xs font-bold bg-slate-800/10",
            children: [
              /* @__PURE__ */ jsx(Plus, { size: 14 }),
              " Add New Purchase"
            ]
          }
        )
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(
      QuickPartyModal,
      {
        isOpen: isPartyModalOpen,
        onClose: () => {
          setIsPartyModalOpen(false);
          setEditingParty(null);
        },
        type: "supplier",
        initialName: supplierSearch,
        editingParty,
        onSuccess: (newParty) => {
          patchPurchase({ supplier: newParty });
          setSupplierSearch("");
          setEditingParty(null);
        }
      }
    ),
    /* @__PURE__ */ jsx(
      ProductModal,
      {
        isOpen: isProductModalOpen,
        onClose: () => setIsProductModalOpen(false),
        mode: productModalMode,
        product: editingProduct,
        initialName: productModalMode === "create" ? showQuickEntry ? quickEntry.name : activeItemIndex !== null ? currentPurchase.items[activeItemIndex]?.name : "" : "",
        categories,
        warehouses,
        onSubmit: handleProductSubmit
      }
    )
  ] });
};
export {
  CreatePurchase as default
};
