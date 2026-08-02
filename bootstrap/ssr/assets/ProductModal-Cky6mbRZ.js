import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePage, useForm, router } from "@inertiajs/react";
import { Box, X, AlertTriangle, FileText, RefreshCw, DollarSign, Plus, Edit, Trash2, Image, Upload, Clock, ArrowUpRight, ArrowDownLeft, ExternalLink, Save, Lock, Unlock } from "lucide-react";
import { P as PremiumButton } from "./PremiumButton-BcHxfadR.js";
import axios from "axios";
import { P as PremiumSelect } from "./PremiumSelect-BdCYeyr5.js";
import { P as PasscodeModal } from "../ssr.js";
import { f as formatCurrency } from "./format-B_ph0Qec.js";
const StatCard = ({ title, value, icon }) => /* @__PURE__ */ jsxs("div", { className: "bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-between", children: [
  /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: title }),
    /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-slate-800 dark:text-white", children: value })
  ] }),
  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center border border-slate-100 dark:border-slate-600", children: icon })
] });
const PREMADE_BASE_UNITS = ["pcs", "kg", "ltr", "m", "g", "oz", "lb"];
const PREMADE_SECONDARY_UNITS = ["box", "carton", "pack", "dozen", "crate", "bundle", "roll"];
function ProductModal({ product, onClose, isOpen, mode = "view", warehouses = [], categories = [], attributes = [], onSubmit, initialName = "", onSuccess }) {
  const [activeTab, setActiveTab] = useState("details");
  const [isNewCategory, setIsNewCategory] = useState(false);
  const isEditable = mode === "create" || mode === "edit";
  const { settings, store } = usePage().props;
  const { data, setData, post, processing, errors, reset } = useForm({
    name: product?.name || initialName || "",
    sku: product?.sku || "",
    category_id: product?.category_id || "",
    new_category_name: "",
    base_unit: "",
    secondary_unit: "",
    conversion_rate: "",
    unit: product?.unit || "pcs",
    stock: product?.stock ?? product?.stock_quantity ?? 0,
    price: product?.price || 0,
    cost_price: product?.cost_price || product?.cost || 0,
    min_stock_alert: product?.min_stock_alert || 5,
    description: product?.description || "",
    short_description: product?.short_description || "",
    main_image: null,
    main_image_preview: product?.image || null,
    gallery_images: [],
    existing_images: product?.images || [],
    deleted_images: [],
    variants: product?.variants || [],
    barcodes: product?.barcodes || [],
    warehouse_id: product?.stocks?.[0]?.warehouse_id || warehouses?.[0]?.id || "",
    batch_number: "",
    expiry_date: ""
  });
  const [isStockUnlocked, setIsStockUnlocked] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [customStats, setCustomStats] = useState(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [variantForm, setVariantForm] = useState({
    variant_name: "",
    sku: "",
    price: "",
    cost_price: "",
    stock: 0,
    barcode: "",
    attributes: {}
  });
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [editingBarcode, setEditingBarcode] = useState(null);
  const [barcodeForm, setBarcodeForm] = useState({
    barcode: "",
    barcode_type: "EAN13",
    is_primary: false,
    description: ""
  });
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [quickViewHistory, setQuickViewHistory] = useState(null);
  const [loadingQuickView, setLoadingQuickView] = useState(false);
  const historyFetchedFor = useRef(null);
  useEffect(() => {
    if (activeTab === "reservations" && product?.id) {
      fetchReservations();
    }
    if (activeTab === "history" && product?.id && historyFetchedFor.current !== product.id) {
      fetchHistory();
    }
  }, [activeTab, product]);
  const fetchReservations = async () => {
    setLoadingReservations(true);
    try {
      const res = await axios.get(route("store.inventory.reservations", { store_slug: store?.slug, id: product.id }));
      setReservations(res.data);
    } catch (error) {
      console.error("Failed to fetch reservations", error);
    } finally {
      setLoadingReservations(false);
    }
  };
  useEffect(() => {
    if (isOpen && mode === "create") {
      reset();
      setIsNewCategory(false);
      setData((data2) => ({
        ...data2,
        name: product?.name || initialName || "",
        unit: "pcs",
        warehouse_id: warehouses?.[0]?.id || ""
      }));
    } else if (isOpen && product) {
      setIsNewCategory(false);
      if (historyFetchedFor.current !== product.id) {
        setHistory([]);
        historyFetchedFor.current = null;
      }
      setData({
        name: product.name || "",
        sku: product.sku || "",
        category_id: product.category_id || "",
        new_category_name: "",
        base_unit: "",
        secondary_unit: "",
        conversion_rate: "",
        unit: product.unit || "pcs",
        stock: product.stock ?? product.stock_quantity ?? 0,
        price: product.price || 0,
        cost_price: product.cost_price || product.cost || 0,
        min_stock_alert: product.min_stock_alert || 5,
        description: product.description || "",
        short_description: product.short_description || "",
        main_image: null,
        main_image_preview: product.image || null,
        gallery_images: [],
        existing_images: product.images || [],
        deleted_images: [],
        warehouse_id: product?.stocks?.[0]?.warehouse_id || warehouses?.[0]?.id || "",
        barcodes: product.barcodes || [],
        // Added back
        variants: product.variants || []
        // Added back
      });
      setIsStockUnlocked(false);
    }
  }, [product, mode, isOpen, initialName]);
  const fetchCustomStats = async () => {
    if (!dateRange.start || !dateRange.end) return;
    try {
      const response = await axios.get(route("store.inventory.stats", { store_slug: store?.slug, id: product.id }), {
        params: { start_date: dateRange.start, end_date: dateRange.end }
      });
      setCustomStats(response.data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };
  const generateSKU = () => {
    const random = Math.floor(Math.random() * 1e6).toString().padStart(6, "0");
    const prefix = data.name ? data.name.substring(0, 3).toUpperCase() : "PRD";
    setData("sku", `${prefix}-${random}`);
  };
  const handleMainImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setData((data2) => ({
        ...data2,
        main_image: file,
        main_image_preview: URL.createObjectURL(file)
      }));
    }
  };
  const handleGalleryUpload = (e) => {
    const files = Array.from(e.target.files);
    const total = files.length + data.gallery_images.length + data.existing_images.length;
    if (total > 9) {
      alert("You can upload up to 9 gallery items.");
      return;
    }
    setData("gallery_images", [...data.gallery_images, ...files]);
  };
  const removeGalleryImage = (index) => {
    const newImages = [...data.gallery_images];
    newImages.splice(index, 1);
    setData("gallery_images", newImages);
  };
  const removeExistingImage = (id) => {
    setData((data2) => ({
      ...data2,
      existing_images: data2.existing_images.filter((img) => img.id !== id),
      deleted_images: [...data2.deleted_images, id]
    }));
  };
  const handleAddVariant = () => {
    setEditingVariant(null);
    setVariantForm({
      variant_name: "",
      sku: "",
      price: data.price || "",
      cost_price: data.cost_price || "",
      stock: 0,
      barcode: "",
      attributes: {}
    });
    setIsVariantModalOpen(true);
  };
  const handleEditVariant = (variant) => {
    setEditingVariant(variant);
    const attrObj = {};
    variant.attributes?.forEach((attr) => {
      attrObj[attr.attribute_id] = attr.value;
    });
    setVariantForm({
      variant_name: variant.name,
      sku: variant.sku || "",
      price: variant.price || "",
      cost_price: variant.cost_price || "",
      stock: variant.stock || 0,
      barcode: variant.barcode || "",
      attributes: attrObj
    });
    setIsVariantModalOpen(true);
  };
  const handleSaveVariant = () => {
    const attrValues = Object.entries(variantForm.attributes).map(([attrId, value]) => value).filter(Boolean).join(" - ");
    const newVariant = {
      id: editingVariant?.id || Date.now(),
      name: variantForm.variant_name || attrValues || "Unnamed Variant",
      sku: variantForm.sku,
      price: parseFloat(variantForm.price) || 0,
      cost_price: parseFloat(variantForm.cost_price) || 0,
      stock: parseInt(variantForm.stock) || 0,
      barcode: variantForm.barcode,
      is_active: true,
      attributes: Object.entries(variantForm.attributes).map(([attrId, value]) => ({
        attribute_id: parseInt(attrId),
        attribute_name: attributes.find((a) => a.id === parseInt(attrId))?.name || "",
        value
      })).filter((attr) => attr.value)
    };
    if (editingVariant) {
      setData("variants", data.variants.map((v) => v.id === editingVariant.id ? newVariant : v));
    } else {
      setData("variants", [...data.variants, newVariant]);
    }
    setIsVariantModalOpen(false);
  };
  const handleDeleteVariant = (variantId) => {
    if (confirm("Are you sure you want to delete this variant?")) {
      setData("variants", data.variants.filter((v) => v.id !== variantId));
    }
  };
  const handleAddBarcode = () => {
    setEditingBarcode(null);
    setBarcodeForm({
      barcode: "",
      barcode_type: "EAN13",
      is_primary: (data.barcodes?.length || 0) === 0,
      // First barcode is primary
      description: ""
    });
    setIsBarcodeModalOpen(true);
  };
  const handleEditBarcode = (barcode) => {
    setEditingBarcode(barcode);
    setBarcodeForm({
      barcode: barcode.barcode,
      barcode_type: barcode.type,
      is_primary: barcode.is_primary,
      description: barcode.description || ""
    });
    setIsBarcodeModalOpen(true);
  };
  const handleSaveBarcode = () => {
    const newBarcode = {
      id: editingBarcode?.id || Date.now(),
      barcode: barcodeForm.barcode,
      type: barcodeForm.barcode_type,
      is_primary: barcodeForm.is_primary,
      description: barcodeForm.description,
      is_active: true
    };
    let updatedBarcodes = data.barcodes || [];
    if (newBarcode.is_primary) {
      updatedBarcodes = updatedBarcodes.map((bc) => ({ ...bc, is_primary: false }));
    }
    if (editingBarcode) {
      setData("barcodes", updatedBarcodes.map((bc) => bc.id === editingBarcode.id ? newBarcode : bc));
    } else {
      setData("barcodes", [...updatedBarcodes, newBarcode]);
    }
    setIsBarcodeModalOpen(false);
  };
  const handleDeleteBarcode = (barcodeId) => {
    if (confirm("Are you sure you want to delete this barcode?")) {
      setData("barcodes", (data.barcodes || []).filter((bc) => bc.id !== barcodeId));
    }
  };
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (onSubmit) {
      const submissionData = {};
      Object.keys(data).forEach((key) => {
        if (mode === "edit" && key === "stock") return;
        submissionData[key] = data[key];
      });
      onSubmit(submissionData, (errors2) => {
      });
      return;
    }
    if (mode === "create") {
      post(route("store.inventory.store", { store_slug: store?.slug }), {
        forceFormData: true,
        onSuccess: (page) => {
          window.dispatchEvent(new CustomEvent("amd:product-updated"));
          localStorage.setItem("amd_product_latest_change", Date.now().toString());
          if (onSuccess) {
            const newProduct = page.props.flash?.product || page.props.product;
            onSuccess(newProduct);
          }
          onClose();
        }
      });
    } else {
      if (!product?.id) {
        console.error("Product ID is missing for update route.");
        return;
      }
      post(route("store.inventory.update", { store_slug: store?.slug, id: product.id }), {
        forceFormData: true,
        transform: (data2) => {
          const transformed = { _method: "PUT" };
          Object.keys(data2).forEach((key) => {
            if (key === "stock" && !isStockUnlocked) return;
            transformed[key] = data2[key];
          });
          return transformed;
        },
        onSuccess: (page) => {
          window.dispatchEvent(new CustomEvent("amd:product-updated"));
          localStorage.setItem("amd_product_latest_change", Date.now().toString());
          if (onSuccess) {
            const updatedProduct = page.props.flash?.product || page.props.product;
            onSuccess(updatedProduct);
          }
          onClose();
        }
      });
    }
  };
  const renderInventorySection = () => /* @__PURE__ */ jsxs("section", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Box, { size: 16, className: "text-amber-500" }),
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider", children: "Inventory" })
      ] }),
      mode === "edit" && !isStockUnlocked && /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setShowPasscodeModal(true),
          className: "text-2xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all uppercase tracking-tight",
          children: [
            /* @__PURE__ */ jsx(Lock, { size: 12 }),
            " Unlock Stock"
          ]
        }
      ),
      mode === "edit" && isStockUnlocked && /* @__PURE__ */ jsxs("div", { className: "text-2xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg flex items-center gap-1.5 uppercase tracking-tight animate-pulse", children: [
        /* @__PURE__ */ jsx(Unlock, { size: 12 }),
        " Stock Editable"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Warehouse" }),
          isEditable ? /* @__PURE__ */ jsx(
            PremiumSelect,
            {
              value: data.warehouse_id,
              onChange: (val) => setData("warehouse_id", val),
              options: warehouses.map((w) => ({ value: w.id, label: w.name })),
              placeholder: "Select Warehouse"
            }
          ) : /* @__PURE__ */ jsx("div", { className: "px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300", children: warehouses.find((w) => w.id === data.warehouse_id)?.name || "Main Store" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Stock Status" }),
          mode === "create" || isStockUnlocked ? /* @__PURE__ */ jsx("div", { className: "relative group", children: /* @__PURE__ */ jsx(
            "input",
            {
              type: "number",
              value: data.stock,
              onChange: (e) => setData("stock", e.target.value),
              className: `w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all ${isStockUnlocked ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/10" : "border-slate-200 dark:border-slate-700"}`,
              placeholder: isStockUnlocked ? "Enter New Stock Count" : "Initial Stock",
              autoFocus: isStockUnlocked
            }
          ) }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "p-2 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center relative group", children: [
              /* @__PURE__ */ jsx("span", { className: "block text-2xs text-slate-400 uppercase", children: "Total" }),
              /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-slate-700 dark:text-white", children: product?.stock ?? product?.stock_quantity ?? 0 }),
              isEditable && /* @__PURE__ */ jsx("div", { className: "absolute -top-1 -right-1 w-2 h-2 rounded-full bg-slate-400 border border-white dark:border-slate-900", title: "Read Only" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800 text-center", children: [
              /* @__PURE__ */ jsx("span", { className: "block text-2xs text-amber-600 dark:text-amber-400 uppercase", children: "Reserved" }),
              /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-amber-700 dark:text-amber-300", children: product?.reserved_stock ?? product?.reserved_quantity ?? 0 })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center", children: [
              /* @__PURE__ */ jsx("span", { className: "block text-2xs text-emerald-600 dark:text-emerald-400 uppercase", children: "Available" }),
              /* @__PURE__ */ jsx("span", { className: "block text-sm font-bold text-emerald-700 dark:text-emerald-300", children: product?.available_stock ?? (product?.stock ?? product?.stock_quantity ?? 0) - (product?.reserved_stock ?? product?.reserved_quantity ?? 0) })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Low Stock Alert" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            value: data.min_stock_alert,
            onChange: (e) => setData("min_stock_alert", e.target.value),
            disabled: !isEditable,
            className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
          }
        )
      ] }) }),
      (settings?.batch_tracking_enabled === "1" || settings?.batch_tracking_enabled === true) && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Batch Number" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: data.batch_number,
              onChange: (e) => setData("batch_number", e.target.value),
              disabled: !isEditable,
              className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60",
              placeholder: "Optional"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Expiry Date" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: data.expiry_date ? String(data.expiry_date).substring(0, 10) : "",
              onChange: (e) => setData("expiry_date", e.target.value),
              disabled: !isEditable,
              className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
            }
          )
        ] })
      ] })
    ] })
  ] });
  const renderReservationsTab = () => /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-8 space-y-6", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1", children: "Active Reservations" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "Stock held in active Pre-Sales" })
    ] }) }),
    loadingReservations ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center", children: [
      /* @__PURE__ */ jsx(RefreshCw, { className: "w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Loading reservation details..." })
    ] }) : reservations.length > 0 ? /* @__PURE__ */ jsx("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "p-4 pl-6", children: "Date" }),
        /* @__PURE__ */ jsx("th", { className: "p-4", children: "Order #" }),
        /* @__PURE__ */ jsx("th", { className: "p-4", children: "Customer" }),
        /* @__PURE__ */ jsx("th", { className: "p-4 text-right pr-6", children: "Qty Held" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900", children: reservations.map((res) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", children: [
        /* @__PURE__ */ jsx("td", { className: "p-4 pl-6 text-slate-600 dark:text-slate-400", children: res.date }),
        /* @__PURE__ */ jsx("td", { className: "p-4 font-medium text-indigo-600 dark:text-indigo-400", children: res.order_number }),
        /* @__PURE__ */ jsx("td", { className: "p-4 font-medium text-slate-800 dark:text-white", children: res.customer }),
        /* @__PURE__ */ jsx("td", { className: "p-4 text-right pr-6 font-bold text-amber-600 dark:text-amber-400", children: res.quantity_reserved })
      ] }, res.id)) })
    ] }) }) : /* @__PURE__ */ jsxs("div", { className: "p-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700", children: [
      /* @__PURE__ */ jsx(Box, { className: "w-12 h-12 text-slate-300 mx-auto mb-4" }),
      /* @__PURE__ */ jsx("p", { className: "text-slate-500 font-medium", children: "No active reservations." }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 mt-1", children: "This product is not currently held in any pre-sales." })
    ] })
  ] });
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(route("store.inventory.history", { store_slug: store?.slug, id: product.id }));
      setHistory(res.data);
      historyFetchedFor.current = product.id;
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setLoadingHistory(false);
    }
  };
  const handleHistoryClick = async (item) => {
    setQuickViewHistory({ _loading: true, type: item.type, invoice_number: item.invoice_number });
    setLoadingQuickView(true);
    try {
      let res;
      if (item.type === "Sale" || item.type === "Return") {
        res = await axios.get(route("store.sales.show", { store_slug: store?.slug, sale: item.transaction_id }), { headers: { "X-Inertia": true, "Accept": "application/json" } });
        setQuickViewHistory({ ...res.data?.props?.sale ?? res.data, type: item.type, _route: item.route });
      } else {
        res = await axios.get(route("store.purchases.show", { store_slug: store?.slug, purchase: item.transaction_id }), { headers: { "X-Inertia": true, "Accept": "application/json" } });
        setQuickViewHistory({ ...res.data?.props?.invoice ?? res.data?.props?.purchase ?? res.data, type: "Purchase", _route: item.route });
      }
    } catch (err) {
      setQuickViewHistory({ ...item, _fallback: true });
    } finally {
      setLoadingQuickView(false);
    }
  };
  const handleHistoryDoubleClick = (item) => {
    setQuickViewHistory(null);
    if (item.type === "Sale" || item.type === "Return") {
      router.visit(route("store.sales.edit", { store_slug: store?.slug, sale: item.transaction_id }));
    } else {
      router.visit(route("store.purchases.show", { store_slug: store?.slug, purchase: item.transaction_id }));
    }
  };
  if (!isOpen) return null;
  return createPortal(
    /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 font-sans", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-5xl h-full sm:h-[85vh] bg-white dark:bg-slate-900 rounded-none sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden", children: data.main_image_preview ? /* @__PURE__ */ jsx("img", { src: data.main_image_preview, alt: data.name, className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx(Box, { size: 24, className: "text-slate-400" }) }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-slate-800 dark:text-white", children: mode === "create" ? "Add New Product" : data.name }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 font-medium", children: mode === "create" ? "Enter product details" : `SKU: ${data.sku}` })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onClose,
              className: "p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors",
              children: /* @__PURE__ */ jsx(X, { size: 24 })
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1 px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto", children: ["details", "reservations", "extra", "variants", ...mode !== "create" ? ["history", "purchase_stats"] : []].map((tab) => /* @__PURE__ */ jsx(
          "button",
          {
            id: `tour-tab-${tab}`,
            onClick: () => setActiveTab(tab),
            className: `px-4 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap capitalize ${activeTab === tab ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`,
            children: tab.replace("_", " ")
          },
          tab
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-900/30", children: [
          errors && Object.keys(errors).length > 0 && /* @__PURE__ */ jsxs("div", { className: "mx-8 mt-8 p-6 rounded-[2rem] bg-rose-500/10 border-2 border-rose-500/20 dark:bg-rose-950/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 animate-in slide-in-from-top-4 duration-300", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-3", children: [
              /* @__PURE__ */ jsx(AlertTriangle, { size: 24, className: "shrink-0 text-rose-500" }),
              /* @__PURE__ */ jsx("h4", { className: "text-base font-black uppercase tracking-wider", children: "Please correct the following:" })
            ] }),
            /* @__PURE__ */ jsx("ul", { className: "list-disc pl-5 space-y-1 text-sm font-bold", children: Object.entries(errors).map(([field, messages]) => {
              const fieldLabel = field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              const msg = Array.isArray(messages) ? messages[0] : messages;
              return /* @__PURE__ */ jsxs("li", { className: "tracking-tight", children: [
                /* @__PURE__ */ jsx("span", { className: "capitalize", children: fieldLabel }),
                ": ",
                msg
              ] }, field);
            }) })
          ] }),
          activeTab === "details" && /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-8 space-y-6 sm:space-y-8", children: [
            /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(FileText, { size: 16, className: "text-indigo-500" }),
                " Basic Info"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
                /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Product Name" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      id: "tour-product-name",
                      type: "text",
                      value: data.name,
                      onChange: (e) => setData("name", e.target.value),
                      disabled: !isEditable,
                      className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                    }
                  ),
                  errors.name && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-1", children: errors.name })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "SKU" }),
                  /* @__PURE__ */ jsxs("div", { className: "flex gap-2", id: "tour-product-sku-gen", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "text",
                        value: data.sku,
                        onChange: (e) => setData("sku", e.target.value),
                        disabled: !isEditable,
                        className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                      }
                    ),
                    isEditable && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: generateSKU,
                        className: "px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors",
                        title: "Generate SKU",
                        children: /* @__PURE__ */ jsx(RefreshCw, { size: 18 })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { id: "tour-product-category", children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Category" }),
                  /* @__PURE__ */ jsx(
                    PremiumSelect,
                    {
                      options: categories,
                      value: isNewCategory ? "new" : data.category_id,
                      onChange: (val) => {
                        setIsNewCategory(false);
                        setData("category_id", val);
                      },
                      onAddNew: () => {
                        setIsNewCategory(true);
                        setData("category_id", "");
                      },
                      addNewLabel: "Create New Category",
                      placeholder: "Select Category",
                      disabled: !isEditable
                    }
                  )
                ] }),
                isNewCategory && /* @__PURE__ */ jsxs("div", { className: "col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-2", children: [
                  /* @__PURE__ */ jsxs("div", { className: "col-span-2", children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-indigo-500 mb-1.5", children: "New Category Name" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        id: "tour-new-category-name",
                        type: "text",
                        value: data.new_category_name,
                        onChange: (e) => setData("new_category_name", e.target.value),
                        className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 text-slate-800 dark:text-white font-bold focus:ring-2 ring-indigo-500/20 outline-none",
                        placeholder: "e.g. Beverages"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Base Unit" }),
                    /* @__PURE__ */ jsx(
                      PremiumSelect,
                      {
                        options: PREMADE_BASE_UNITS.map((u) => ({ id: u, name: u })),
                        value: data.base_unit,
                        onChange: (val) => setData("base_unit", val),
                        placeholder: "e.g. pcs"
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Secondary Unit (Scale)" }),
                    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                      /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
                        PremiumSelect,
                        {
                          options: PREMADE_SECONDARY_UNITS.map((u) => ({ id: u, name: u })),
                          value: data.secondary_unit,
                          onChange: (val) => setData("secondary_unit", val),
                          placeholder: "e.g. box"
                        }
                      ) }),
                      /* @__PURE__ */ jsxs("div", { className: "relative w-32", children: [
                        /* @__PURE__ */ jsx("span", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold", children: "=" }),
                        /* @__PURE__ */ jsx(
                          "input",
                          {
                            type: "number",
                            value: data.conversion_rate,
                            onChange: (e) => setData("conversion_rate", e.target.value),
                            className: "w-full pl-6 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none",
                            placeholder: "12"
                          }
                        )
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("p", { className: "text-2xs text-slate-400 mt-1 ml-1", children: [
                      "1 ",
                      data.secondary_unit || "Box",
                      " = ",
                      data.conversion_rate || 12,
                      " ",
                      data.base_unit || "Pcs"
                    ] })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Unit" }),
                  /* @__PURE__ */ jsx(
                    PremiumSelect,
                    {
                      options: PREMADE_BASE_UNITS.map((u) => ({ id: u, name: u })),
                      value: data.unit,
                      onChange: (val) => setData("unit", val),
                      placeholder: "e.g. pcs, kg, box",
                      disabled: !isEditable
                    }
                  )
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("section", { children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(DollarSign, { size: 16, className: "text-emerald-500" }),
                " Pricing"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Cost Price" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm", children: store?.currency_symbol || "Rs" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        id: "tour-product-cost",
                        type: "number",
                        value: data.cost_price,
                        onChange: (e) => setData("cost_price", e.target.value),
                        disabled: !isEditable,
                        className: "w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Selling Price" }),
                  /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                    /* @__PURE__ */ jsx("span", { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm", children: store?.currency_symbol || "Rs" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        id: "tour-product-price",
                        type: "number",
                        value: data.price,
                        onChange: (e) => setData("price", e.target.value),
                        disabled: !isEditable,
                        className: "w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                      }
                    )
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "mt-6 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 text-white relative overflow-hidden", children: [
                /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" }),
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between relative z-10", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Profit Margin" }),
                    /* @__PURE__ */ jsxs("p", { className: "text-3xl font-bold text-white", children: [
                      data.price > 0 ? Math.round((data.price - data.cost_price) / data.price * 100) : 0,
                      "%"
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1", children: "Profit / Unit" }),
                    /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-emerald-400", children: formatCurrency(data.price - data.cost_price, store || settings) })
                  ] })
                ] })
              ] })
            ] }),
            renderInventorySection(),
            /* @__PURE__ */ jsxs("section", { id: "tour-product-barcode", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
                /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(Box, { size: 16, className: "text-indigo-500" }),
                  " Barcodes"
                ] }),
                isEditable && /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: handleAddBarcode,
                    className: "text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1",
                    children: [
                      /* @__PURE__ */ jsx(Plus, { size: 14 }),
                      "Add Barcode"
                    ]
                  }
                )
              ] }),
              data.barcodes && data.barcodes.length > 0 ? /* @__PURE__ */ jsx("div", { className: "grid gap-2", children: data.barcodes.map((barcode) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 flex-1", children: [
                  /* @__PURE__ */ jsx("code", { className: "text-sm font-mono font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-700 px-2 py-1 rounded", children: barcode.barcode }),
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-slate-500 dark:text-slate-400", children: barcode.type }),
                  barcode.is_primary && /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-green-600 dark:text-green-400", children: "â­ PRIMARY" }),
                  barcode.description && /* @__PURE__ */ jsxs("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: [
                    "Â· ",
                    barcode.description
                  ] })
                ] }),
                isEditable && /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                  /* @__PURE__ */ jsx("button", { onClick: () => handleEditBarcode(barcode), className: "p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors", children: /* @__PURE__ */ jsx(Edit, { size: 14 }) }),
                  /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteBarcode(barcode.id), className: "p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors", children: /* @__PURE__ */ jsx(Trash2, { size: 14 }) })
                ] })
              ] }, barcode.id)) }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700", children: [
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400", children: "No barcodes added yet" }),
                isEditable && /* @__PURE__ */ jsx("button", { onClick: handleAddBarcode, className: "mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300", children: "+ Add your first barcode" })
              ] })
            ] })
          ] }),
          activeTab === "extra" && /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-8 space-y-6 sm:space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(FileText, { size: 16, className: "text-indigo-500" }),
                " Additional Info"
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Short Description" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    placeholder: "Brief summary (e.g. 100% Cotton T-Shirt)",
                    value: data.short_description,
                    onChange: (e) => setData("short_description", e.target.value),
                    disabled: !isEditable,
                    className: "w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all disabled:opacity-60"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Full Description" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    rows: "4",
                    placeholder: "Detailed product description...",
                    value: data.description,
                    onChange: (e) => setData("description", e.target.value),
                    disabled: !isEditable,
                    className: "w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 ring-indigo-500/20 outline-none transition-all resize-none disabled:opacity-60"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Image, { size: 16, className: "text-indigo-500" }),
                " Media Gallery"
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2", children: [
                  "Main Image ",
                  /* @__PURE__ */ jsx("span", { className: "text-indigo-500", children: "(Required, Image Only)" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex gap-4 items-start", children: [
                  /* @__PURE__ */ jsx("div", { className: "relative w-40 h-40 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group bg-slate-50 dark:bg-slate-800/50", children: data.main_image_preview ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("img", { src: data.main_image_preview, alt: "Main", className: "w-full h-full object-cover" }),
                    isEditable && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => setData((d) => ({ ...d, main_image: null, main_image_preview: null })),
                        className: "absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg",
                        children: /* @__PURE__ */ jsx(Trash2, { size: 14 })
                      }
                    )
                  ] }) : isEditable && /* @__PURE__ */ jsxs("label", { className: "absolute inset-0 flex flex-col items-center justify-center cursor-pointer", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "file",
                        accept: "image/*",
                        onChange: handleMainImageUpload,
                        className: "hidden"
                      }
                    ),
                    /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(Upload, { size: 18 }) }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-slate-500 dark:text-slate-400", children: "Upload Main" })
                  ] }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 text-xs text-slate-500 leading-relaxed pt-2", children: [
                    /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-700 dark:text-slate-300 mb-1", children: "Primary Thumbnail" }),
                    /* @__PURE__ */ jsx("p", { children: "This image will be displayed on the product list and will be optimized for fast loading." }),
                    /* @__PURE__ */ jsx("p", { className: "mt-1 text-amber-500", children: "Supported: JPG, PNG, WEBP" }),
                    errors.main_image && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-xs mt-2 font-bold animate-pulse", children: errors.main_image })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsxs("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2", children: [
                  "Gallery ",
                  /* @__PURE__ */ jsx("span", { className: "text-slate-400", children: "(Max 9 additional items, Images or Videos)" })
                ] }),
                isEditable && /* @__PURE__ */ jsxs("div", { className: "border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group relative mb-4", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "file",
                      multiple: true,
                      accept: "image/*,video/*",
                      onChange: handleGalleryUpload,
                      className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    }
                  ),
                  /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsx(Upload, { size: 18 }) }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-slate-700 dark:text-slate-200", children: "Add Gallery Media" })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 md:grid-cols-5 gap-4", children: [
                  data.existing_images.map((img) => /* @__PURE__ */ jsxs("div", { className: "relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group", children: [
                    img.type === "video" ? /* @__PURE__ */ jsx("video", { src: img.url, className: "w-full h-full object-cover", controls: true }) : /* @__PURE__ */ jsx("img", { src: img.url, alt: "Gallery", className: "w-full h-full object-cover" }),
                    isEditable && /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => removeExistingImage(img.id),
                        className: "absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm",
                        children: /* @__PURE__ */ jsx(Trash2, { size: 12 })
                      }
                    )
                  ] }, img.id)),
                  data.gallery_images.map((file, index) => /* @__PURE__ */ jsxs("div", { className: "relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group", children: [
                    file.type.startsWith("video") ? /* @__PURE__ */ jsx("video", { src: URL.createObjectURL(file), className: "w-full h-full object-cover" }) : /* @__PURE__ */ jsx("img", { src: URL.createObjectURL(file), alt: "Preview", className: "w-full h-full object-cover" }),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => removeGalleryImage(index),
                        className: "absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm",
                        children: /* @__PURE__ */ jsx(Trash2, { size: 12 })
                      }
                    )
                  ] }, index))
                ] })
              ] })
            ] })
          ] }),
          activeTab === "reservations" && renderReservationsTab(),
          activeTab === "variants" && /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-8 space-y-6", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-slate-900 dark:text-white", children: "Product Variants" }),
                /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500 mt-1", children: "Manage different variations of this product (e.g., Size, Color)" })
              ] }),
              isEditable && /* @__PURE__ */ jsxs(PremiumButton, { onClick: handleAddVariant, className: "px-4 py-2", children: [
                /* @__PURE__ */ jsx(Plus, { size: 16 }),
                "Add Variant"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700", children: [
              /* @__PURE__ */ jsx("h4", { className: "text-sm font-bold text-slate-700 dark:text-slate-300 mb-4", children: "Available Attributes" }),
              /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3", children: attributes.map((attr) => /* @__PURE__ */ jsxs("div", { className: "px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300", children: [
                attr.name,
                /* @__PURE__ */ jsxs("span", { className: "ml-2 text-2xs text-slate-400", children: [
                  "(",
                  attr.options?.length || 0,
                  " options)"
                ] })
              ] }, attr.id)) })
            ] }),
            data.variants && data.variants.length > 0 ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
              /* @__PURE__ */ jsxs("h4", { className: "text-sm font-bold text-slate-700 dark:text-slate-300", children: [
                "Existing Variants (",
                data.variants.length,
                ")"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: data.variants.map((variant) => /* @__PURE__ */ jsx("div", { className: "bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors", children: /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
                    /* @__PURE__ */ jsx("h5", { className: "font-bold text-slate-800 dark:text-white", children: variant.name }),
                    /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded text-xs font-bold ${variant.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`, children: variant.is_active ? "Active" : "Inactive" })
                  ] }),
                  /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mb-3", children: variant.attributes?.map((attr, idx) => /* @__PURE__ */ jsxs("span", { className: "px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded text-xs font-medium", children: [
                    attr.attribute_name,
                    ": ",
                    attr.value
                  ] }, idx)) }),
                  /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 text-xs", children: [
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-slate-500 dark:text-slate-400", children: "SKU:" }),
                      /* @__PURE__ */ jsx("span", { className: "ml-1 font-medium text-slate-700 dark:text-slate-300", children: variant.sku || "N/A" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-slate-500 dark:text-slate-400", children: "Price:" }),
                      /* @__PURE__ */ jsx("span", { className: "ml-1 font-bold text-emerald-600 dark:text-emerald-400", children: formatCurrency(variant.selling_price || variant.price || 0, store || settings) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-2xs text-slate-400 uppercase font-medium", children: "Cost:" }),
                      /* @__PURE__ */ jsx("span", { className: "ml-1 font-medium text-slate-700 dark:text-slate-300", children: formatCurrency(variant.cost_price || variant.cost || 0, store || settings) })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { children: [
                      /* @__PURE__ */ jsx("span", { className: "text-slate-500 dark:text-slate-400", children: "Stock:" }),
                      /* @__PURE__ */ jsx("span", { className: "ml-1 font-bold text-slate-800 dark:text-white", children: variant.stock || 0 })
                    ] })
                  ] })
                ] }),
                isEditable && /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
                  /* @__PURE__ */ jsx("button", { onClick: () => handleEditVariant(variant), className: "p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(Edit, { size: 16 }) }),
                  /* @__PURE__ */ jsx("button", { onClick: () => handleDeleteVariant(variant.id), className: "p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(Trash2, { size: 16 }) })
                ] })
              ] }) }, variant.id)) })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700", children: [
              /* @__PURE__ */ jsx(Box, { size: 48, className: "mx-auto text-slate-300 dark:text-slate-600 mb-3" }),
              /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 font-medium", children: "No variants yet" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-400 dark:text-slate-500 mt-1", children: 'Click "Add Variant" to create product variations' })
            ] })
          ] }),
          activeTab === "history" && mode !== "create" && /* @__PURE__ */ jsx("div", { className: "p-0 relative", children: loadingHistory ? /* @__PURE__ */ jsxs("div", { className: "p-16 text-center", children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Loading transaction history..." })
          ] }) : history.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-16 text-center bg-slate-50 dark:bg-slate-800/50", children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-500 dark:text-slate-400 font-medium", children: "No transaction history found" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 dark:text-slate-500 mt-1", children: "Sales and purchases will appear here once recorded." })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx("div", { className: "px-8 py-3 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-900/30", children: /* @__PURE__ */ jsxs("p", { className: "text-xs text-amber-700 dark:text-amber-400 font-medium", children: [
              /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Click" }),
              " a row to preview Â· ",
              /* @__PURE__ */ jsx("span", { className: "font-bold", children: "Double-click" }),
              " to open editor"
            ] }) }),
            /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
              /* @__PURE__ */ jsx("thead", { className: "bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10", children: /* @__PURE__ */ jsxs("tr", { className: "text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700", children: [
                /* @__PURE__ */ jsx("th", { className: "p-4 pl-8", children: "Type" }),
                /* @__PURE__ */ jsx("th", { className: "p-4", children: "Ref #" }),
                /* @__PURE__ */ jsx("th", { className: "p-4", children: "Party / Customer" }),
                /* @__PURE__ */ jsx("th", { className: "p-4", children: "Date" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 text-center", children: "Qty" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 text-right", children: "Price/Unit" }),
                /* @__PURE__ */ jsx("th", { className: "p-4 text-right pr-8", children: "Total" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: history.map((item) => /* @__PURE__ */ jsxs(
                "tr",
                {
                  className: `hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer group ${quickViewHistory?.invoice_number === item.invoice_number ? "ring-2 ring-inset ring-indigo-400 bg-indigo-50 dark:bg-indigo-900/20" : ""}`,
                  onClick: () => handleHistoryClick(item),
                  onDoubleClick: () => handleHistoryDoubleClick(item),
                  title: "Click to preview Â· Double-click to edit",
                  children: [
                    /* @__PURE__ */ jsx("td", { className: "p-4 pl-8", children: /* @__PURE__ */ jsxs("span", { className: `px-2.5 py-1 rounded-lg text-2xs font-bold border ${item.type === "Sale" ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" : item.type === "Return" ? "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800" : "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800"}`, children: [
                      item.type === "Sale" ? /* @__PURE__ */ jsx(ArrowUpRight, { size: 10, className: "inline mr-1" }) : item.type === "Return" ? /* @__PURE__ */ jsx(RefreshCw, { size: 10, className: "inline mr-1" }) : /* @__PURE__ */ jsx(ArrowDownLeft, { size: 10, className: "inline mr-1" }),
                      item.type
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold", children: item.invoice_number }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-sm font-bold text-slate-700 dark:text-slate-200", children: item.party }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-sm text-slate-500 font-medium", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                      /* @__PURE__ */ jsx(Clock, { size: 14 }),
                      " ",
                      item.date
                    ] }) }),
                    /* @__PURE__ */ jsx("td", { className: "p-4 text-center font-bold text-slate-800 dark:text-white", children: item.qty }),
                    /* @__PURE__ */ jsxs("td", { className: "p-4 text-right text-sm text-slate-500", children: [
                      settings?.currency_symbol || "Rs",
                      " ",
                      Number(item.price).toLocaleString()
                    ] }),
                    /* @__PURE__ */ jsxs("td", { className: "p-4 pr-6 text-right font-bold text-slate-800 dark:text-white", children: [
                      /* @__PURE__ */ jsxs("span", { children: [
                        settings?.currency_symbol || "Rs",
                        " ",
                        Number(item.total).toLocaleString()
                      ] }),
                      /* @__PURE__ */ jsx(ExternalLink, { size: 12, className: "inline ml-2 text-slate-300 group-hover:text-indigo-400 transition-colors" })
                    ] })
                  ]
                },
                item.id
              )) })
            ] }),
            quickViewHistory && /* @__PURE__ */ jsx(
              "div",
              {
                className: "fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200",
                onClick: () => setQuickViewHistory(null),
                children: /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: "w-full max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200",
                    onClick: (e) => e.stopPropagation(),
                    children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 shrink-0", children: [
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                          /* @__PURE__ */ jsxs("div", { children: [
                            /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase tracking-wider", children: quickViewHistory.type === "Sale" ? "Sale Preview" : "Purchase Preview" }),
                            /* @__PURE__ */ jsx("h3", { className: `text-xl font-black ${quickViewHistory.type === "Sale" ? "text-emerald-600" : "text-indigo-600"}`, children: quickViewHistory.invoice_number || quickViewHistory.reference_number || "..." })
                          ] }),
                          /* @__PURE__ */ jsxs("span", { className: `px-2 py-1 rounded-full text-2xs font-bold border ${quickViewHistory.type === "Sale" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`, children: [
                            quickViewHistory.type === "Sale" ? /* @__PURE__ */ jsx(ArrowUpRight, { size: 10, className: "inline mr-1" }) : /* @__PURE__ */ jsx(ArrowDownLeft, { size: 10, className: "inline mr-1" }),
                            quickViewHistory.type
                          ] }),
                          quickViewHistory.payment_status && /* @__PURE__ */ jsx("span", { className: `px-2 py-1 rounded-full text-2xs font-bold uppercase ${quickViewHistory.payment_status === "paid" ? "bg-emerald-100 text-emerald-700" : quickViewHistory.payment_status === "partial" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`, children: quickViewHistory.payment_status })
                        ] }),
                        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                          /* @__PURE__ */ jsxs(
                            "button",
                            {
                              onClick: () => {
                                setQuickViewHistory(null);
                                const id = quickViewHistory.id || quickViewHistory.transaction_id;
                                if (quickViewHistory.type === "Sale") router.visit(route("store.sales.show", { store_slug: store?.slug, sale: id }));
                                else router.visit(route("store.purchases.show", { store_slug: store?.slug, purchase: id }));
                              },
                              className: "px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1",
                              children: [
                                /* @__PURE__ */ jsx(ExternalLink, { size: 13 }),
                                " Open Full"
                              ]
                            }
                          ),
                          quickViewHistory.type === "Sale" && /* @__PURE__ */ jsxs(
                            "button",
                            {
                              onClick: () => {
                                setQuickViewHistory(null);
                                router.visit(route("store.sales.edit", { store_slug: store?.slug, sale: quickViewHistory.id || quickViewHistory.transaction_id }));
                              },
                              className: "px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1",
                              children: [
                                /* @__PURE__ */ jsx(ExternalLink, { size: 13 }),
                                " Edit"
                              ]
                            }
                          ),
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              onClick: () => setQuickViewHistory(null),
                              className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 transition-colors",
                              children: /* @__PURE__ */ jsx(X, { size: 18 })
                            }
                          )
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto p-4", children: loadingQuickView ? /* @__PURE__ */ jsxs("div", { className: "py-16 text-center", children: [
                        /* @__PURE__ */ jsx(RefreshCw, { className: "w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" }),
                        /* @__PURE__ */ jsx("p", { className: "text-sm text-slate-500", children: "Fetching details..." })
                      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3 mb-4", children: [
                          /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                            /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase mb-1", children: quickViewHistory.type === "Sale" ? "Customer" : "Supplier" }),
                            /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: quickViewHistory.party?.name || quickViewHistory.customer?.name || quickViewHistory.party || "N/A" })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800 p-3 rounded-xl", children: [
                            /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-slate-400 uppercase mb-1", children: "Date" }),
                            /* @__PURE__ */ jsx("p", { className: "font-bold text-slate-800 dark:text-white text-sm", children: quickViewHistory.date || (quickViewHistory.created_at ? new Date(quickViewHistory.created_at).toLocaleDateString() : "N/A") })
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800", children: [
                            /* @__PURE__ */ jsx("p", { className: "text-2xs font-bold text-indigo-500 uppercase mb-1", children: "Total" }),
                            /* @__PURE__ */ jsxs("p", { className: "font-black text-indigo-600 text-lg", children: [
                              settings?.currency_symbol || "Rs",
                              " ",
                              Number(quickViewHistory.total || 0).toLocaleString()
                            ] })
                          ] })
                        ] }),
                        (quickViewHistory.items || quickViewHistory.invoice_items) && /* @__PURE__ */ jsxs("div", { className: "border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden", children: [
                          /* @__PURE__ */ jsx("div", { className: "bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700", children: /* @__PURE__ */ jsxs("p", { className: "text-xs font-bold text-slate-500 uppercase", children: [
                            "Items (",
                            (quickViewHistory.items || quickViewHistory.invoice_items)?.length || 0,
                            ")"
                          ] }) }),
                          /* @__PURE__ */ jsx("div", { className: "max-h-64 overflow-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
                            /* @__PURE__ */ jsx("thead", { className: "sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800", children: /* @__PURE__ */ jsxs("tr", { children: [
                              /* @__PURE__ */ jsx("th", { className: "text-left p-3 text-2xs font-bold text-slate-400 uppercase", children: "Item" }),
                              /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-2xs font-bold text-slate-400 uppercase", children: "Qty" }),
                              /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-slate-400 uppercase", children: "Rate" }),
                              /* @__PURE__ */ jsx("th", { className: "text-right p-3 text-2xs font-bold text-slate-400 uppercase", children: "Total" })
                            ] }) }),
                            /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-slate-100 dark:divide-slate-800", children: (quickViewHistory.items || quickViewHistory.invoice_items || []).map((itm, idx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-50 dark:hover:bg-slate-800/50", children: [
                              /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                                /* @__PURE__ */ jsx("p", { className: "font-semibold text-slate-800 dark:text-white", children: itm.product?.name || itm.name || "Unknown" }),
                                itm.product?.sku && /* @__PURE__ */ jsx("p", { className: "text-2xs text-slate-400 font-mono", children: itm.product.sku })
                              ] }),
                              /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-bold text-slate-700 dark:text-slate-300", children: itm.quantity }),
                              /* @__PURE__ */ jsxs("td", { className: "p-3 text-right text-slate-500", children: [
                                settings?.currency_symbol || "Rs",
                                " ",
                                Number(itm.unit_price || itm.price || 0).toLocaleString()
                              ] }),
                              /* @__PURE__ */ jsxs("td", { className: "p-3 text-right font-bold text-slate-800 dark:text-white", children: [
                                settings?.currency_symbol || "Rs",
                                " ",
                                Number(itm.line_total || itm.subtotal || itm.quantity * (itm.unit_price || itm.price || 0)).toLocaleString()
                              ] })
                            ] }, idx)) })
                          ] }) })
                        ] }),
                        !quickViewHistory.items && !quickViewHistory.invoice_items && /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-slate-400", children: [
                          /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Line item details not available in preview." }),
                          /* @__PURE__ */ jsx(
                            "button",
                            {
                              onClick: () => {
                                const id = quickViewHistory.id || quickViewHistory.transaction_id;
                                setQuickViewHistory(null);
                                if (quickViewHistory.type === "Sale") router.visit(route("store.sales.show", { store_slug: store?.slug, sale: id }));
                                else router.visit(route("store.purchases.show", { store_slug: store?.slug, purchase: id }));
                              },
                              className: "mt-2 text-indigo-600 text-xs font-bold underline",
                              children: "Open full page instead"
                            }
                          )
                        ] })
                      ] }) })
                    ]
                  }
                )
              }
            )
          ] }) }),
          activeTab === "purchase_stats" && mode !== "create" && /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-8 space-y-6 sm:space-y-8", children: [
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
              /* @__PURE__ */ jsx(StatCard, { title: "Purchased Today", value: product.purchased_day || 0, icon: /* @__PURE__ */ jsx(Box, { size: 20, className: "text-indigo-500" }) }),
              /* @__PURE__ */ jsx(StatCard, { title: "Purchased This Month", value: product.purchased_month || 0, icon: /* @__PURE__ */ jsx(Box, { size: 20, className: "text-indigo-500" }) }),
              /* @__PURE__ */ jsx(StatCard, { title: "Purchased This Year", value: product.purchased_year || 0, icon: /* @__PURE__ */ jsx(Box, { size: 20, className: "text-indigo-500" }) }),
              /* @__PURE__ */ jsx(StatCard, { title: "Last Purchased Qty", value: product.last_purchased_qty || 0, icon: /* @__PURE__ */ jsx(Box, { size: 20, className: "text-indigo-500" }) }),
              /* @__PURE__ */ jsx(StatCard, { title: "Opening Stock", value: product.opening_stock || 0, icon: /* @__PURE__ */ jsx(Box, { size: 20, className: "text-emerald-500" }) }),
              /* @__PURE__ */ jsx(StatCard, { title: "Current Stock", value: product.stock || 0, icon: /* @__PURE__ */ jsx(Box, { size: 20, className: "text-amber-500" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700", children: [
              /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(Clock, { size: 16, className: "text-indigo-500" }),
                " Custom Date Range"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end gap-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "Start Date" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "date",
                      value: dateRange.start ? String(dateRange.start).substring(0, 10) : "",
                      onChange: (e) => setDateRange({ ...dateRange, start: e.target.value }),
                      className: "px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 ring-indigo-500/20 outline-none"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5", children: "End Date" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "date",
                      value: dateRange.end ? String(dateRange.end).substring(0, 10) : "",
                      onChange: (e) => setDateRange({ ...dateRange, end: e.target.value }),
                      className: "px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:ring-2 ring-indigo-500/20 outline-none"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: fetchCustomStats,
                    className: "px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20",
                    children: "Calculate"
                  }
                )
              ] }),
              customStats && /* @__PURE__ */ jsxs("div", { className: "mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2", children: [
                /* @__PURE__ */ jsx(StatCard, { title: "Purchased Qty", value: customStats.purchased_qty, icon: /* @__PURE__ */ jsx(Box, { size: 20, className: "text-indigo-500" }) }),
                /* @__PURE__ */ jsx(StatCard, { title: "Total Cost", value: `Rs ${customStats.total_cost.toLocaleString()}`, icon: /* @__PURE__ */ jsx(DollarSign, { size: 20, className: "text-emerald-500" }) })
              ] })
            ] })
          ] })
        ] }),
        isEditable && /* @__PURE__ */ jsxs("div", { className: "p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3 z-10", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: onClose,
              className: "px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              id: "tour-product-save",
              onClick: handleSubmit,
              disabled: processing,
              className: "px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 active:scale-95 transition-all",
              children: [
                /* @__PURE__ */ jsx(Save, { size: 18 }),
                processing ? "Saving..." : "Save Changes"
              ]
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        PasscodeModal,
        {
          isOpen: showPasscodeModal,
          onClose: () => setShowPasscodeModal(false),
          onSuccess: (code) => {
            setShowPasscodeModal(false);
            setIsStockUnlocked(true);
            window.dispatchEvent(new CustomEvent("amd:toast", {
              detail: { message: "Inventory field unlocked for manual adjustment", type: "success" }
            }));
          },
          settings
        }
      ),
      isVariantModalOpen && createPortal(
        /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[110] flex items-center justify-center p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-slate-900/60 backdrop-blur-sm", onClick: () => setIsVariantModalOpen(false) }),
          /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-white", children: editingVariant ? "Edit Variant" : "Add New Variant" }),
              /* @__PURE__ */ jsx("button", { onClick: () => setIsVariantModalOpen(false), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3", children: "Select Attributes" }),
                /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-3", children: attributes.map((attr) => /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1", children: attr.name }),
                  attr.type === "select" ? /* @__PURE__ */ jsx(
                    PremiumSelect,
                    {
                      options: attr.options?.map((opt) => ({ id: opt, name: opt })) || [],
                      value: variantForm.attributes[attr.id] || "",
                      onChange: (val) => setVariantForm({ ...variantForm, attributes: { ...variantForm.attributes, [attr.id]: val } }),
                      placeholder: "None"
                    }
                  ) : /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: variantForm.attributes[attr.id] || "",
                      onChange: (e) => setVariantForm({ ...variantForm, attributes: { ...variantForm.attributes, [attr.id]: e.target.value } }),
                      className: "w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 ring-indigo-500/20 outline-none",
                      placeholder: `Enter ${attr.name}`
                    }
                  )
                ] }, attr.id)) })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Variant Name (Optional)" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: variantForm.variant_name,
                    onChange: (e) => setVariantForm({ ...variantForm, variant_name: e.target.value }),
                    placeholder: "Auto-generated from attributes",
                    className: "w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "SKU" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: variantForm.sku,
                      onChange: (e) => setVariantForm({ ...variantForm, sku: e.target.value }),
                      placeholder: "e.g., PRD-001-RED-L",
                      className: "w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Barcode" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: variantForm.barcode,
                      onChange: (e) => setVariantForm({ ...variantForm, barcode: e.target.value }),
                      placeholder: "Optional",
                      className: "w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Selling Price" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: variantForm.price,
                      onChange: (e) => setVariantForm({ ...variantForm, price: e.target.value }),
                      placeholder: "0",
                      className: "w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Cost Price" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "number",
                      value: variantForm.cost_price,
                      onChange: (e) => setVariantForm({ ...variantForm, cost_price: e.target.value }),
                      placeholder: "0",
                      className: "w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Stock Quantity" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "number",
                    value: variantForm.stock,
                    onChange: (e) => setVariantForm({ ...variantForm, stock: e.target.value }),
                    placeholder: "0",
                    className: "w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 ring-indigo-500/20 outline-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setIsVariantModalOpen(false),
                    className: "px-6 py-2.5 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                    children: "Cancel"
                  }
                ),
                /* @__PURE__ */ jsxs(PremiumButton, { onClick: handleSaveVariant, className: "px-6 py-2.5", children: [
                  /* @__PURE__ */ jsx(Save, { size: 16 }),
                  editingVariant ? "Update Variant" : "Add Variant"
                ] })
              ] })
            ] })
          ] })
        ] }),
        document.body
      ),
      isBarcodeModalOpen && createPortal(
        /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[110] flex items-center justify-center p-4", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-slate-900/60 backdrop-blur-sm", onClick: () => setIsBarcodeModalOpen(false) }),
          /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-6", children: [
              /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-white", children: editingBarcode ? "Edit Barcode" : "Add New Barcode" }),
              /* @__PURE__ */ jsx("button", { onClick: () => setIsBarcodeModalOpen(false), className: "p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Barcode Number" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: barcodeForm.barcode,
                    onChange: (e) => setBarcodeForm({ ...barcodeForm, barcode: e.target.value }),
                    placeholder: "e.g., 1234567890123",
                    className: "w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-lg focus:ring-2 ring-indigo-500/20 outline-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Barcode Type" }),
                /* @__PURE__ */ jsx(
                  PremiumSelect,
                  {
                    options: [
                      { id: "EAN13", name: "EAN-13 (13 digits)" },
                      { id: "EAN8", name: "EAN-8 (8 digits)" },
                      { id: "UPC", name: "UPC (12 digits)" },
                      { id: "CODE128", name: "Code 128" },
                      { id: "CODE39", name: "Code 39" },
                      { id: "QR", name: "QR Code" }
                    ],
                    value: barcodeForm.barcode_type,
                    onChange: (val) => setBarcodeForm({ ...barcodeForm, barcode_type: val }),
                    placeholder: "Select Type"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg", children: [
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "checkbox",
                    id: "is_primary",
                    checked: barcodeForm.is_primary,
                    onChange: (e) => setBarcodeForm({ ...barcodeForm, is_primary: e.target.checked }),
                    className: "w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-2 focus:ring-indigo-500/20"
                  }
                ),
                /* @__PURE__ */ jsx("label", { htmlFor: "is_primary", className: "text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-pointer", children: "Set as Primary Barcode â­" })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2", children: "Description (Optional)" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: barcodeForm.description,
                    onChange: (e) => setBarcodeForm({ ...barcodeForm, description: e.target.value }),
                    placeholder: "e.g., Flavor: Chocolate, Size: Large",
                    className: "w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 ring-indigo-500/20 outline-none"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700", children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    onClick: () => setIsBarcodeModalOpen(false),
                    className: "px-6 py-2.5 rounded-lg font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors",
                    children: "Cancel"
                  }
                ),
                /* @__PURE__ */ jsxs(PremiumButton, { onClick: handleSaveBarcode, className: "px-6 py-2.5", children: [
                  /* @__PURE__ */ jsx(Save, { size: 16 }),
                  editingBarcode ? "Update Barcode" : "Add Barcode"
                ] })
              ] })
            ] })
          ] })
        ] }),
        document.body
      )
    ] }),
    document.body
  );
}
export {
  ProductModal as P
};
