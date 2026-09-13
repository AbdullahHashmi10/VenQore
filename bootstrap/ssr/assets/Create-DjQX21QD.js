import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { usePage, Head, router } from "@inertiajs/react";
import { O as OneGlanceLayout } from "./OneGlanceLayout-D0x15wPs.js";
import { P as PageHeader } from "./PageHeader-qaWJfzfS.js";
import { a as FormField, c as FormSelect, b as FormInput, S as SecondaryButton, e as PrimaryButton } from "../ssr.js";
import { Factory, Package } from "lucide-react";
import axios from "axios";
import { A as AsyncProductCombobox } from "./AsyncProductCombobox-BMa0miLw.js";
import { u as useTermText } from "./terms-DwYjlWsV.js";
import "react-dom";
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
import "use-debounce";
import "./SmartCombobox-DfdFIseQ.js";
import "./format-131Nyq79.js";
function localIsoDate(d = /* @__PURE__ */ new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function buildProductionRunPayload(form, today = /* @__PURE__ */ new Date()) {
  return {
    bom_id: form.bom_id ? String(form.bom_id) : "",
    warehouse_id: form.warehouse_id ? String(form.warehouse_id) : "",
    planned_qty: Number(form.planned_qty) || 0,
    run_date: form.run_date || localIsoDate(today)
  };
}
function bomsForProduct(boms, productId) {
  const list = Array.isArray(boms) ? boms : [];
  if (!productId) return list;
  return list.filter((b) => String(b.product_id) === String(productId));
}
function bomRequirements(bom, plannedQty) {
  const qty = Number(plannedQty) || 0;
  return (bom?.items || []).filter((i) => !i.is_byproduct).map((i) => ({ ...i, required: Math.round(Number(i.qty_per_unit) * qty * 1e4) / 1e4 }));
}
function CreateProductionRun({ products = [], warehouses = [] }) {
  const { store } = usePage().props;
  const tt = useTermText();
  const [loading, setLoading] = useState(false);
  const [boms, setBoms] = useState([]);
  const [bomsLoading, setBomsLoading] = useState(true);
  const [bomsError, setBomsError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState(() => ({
    product_id: "",
    bom_id: "",
    planned_qty: 1,
    warehouse_id: warehouses.length === 1 ? String(warehouses[0].id) : "",
    run_date: localIsoDate()
  }));
  const [errors, setErrors] = useState({});
  useEffect(() => {
    let cancelled = false;
    axios.get(`/s/${store?.slug}/inventory/production/boms`).then((res) => {
      if (!cancelled) setBoms(res.data?.boms || []);
    }).catch(() => {
      if (!cancelled) setBomsError("Could not load bills of materials.");
    }).finally(() => {
      if (!cancelled) setBomsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [store?.slug]);
  const productBoms = useMemo(() => bomsForProduct(boms, formData.product_id), [boms, formData.product_id]);
  const selectedBom = boms.find((b) => b.id === formData.bom_id) || null;
  const requirements = bomRequirements(selectedBom, formData.planned_qty);
  const selectProduct = (product) => {
    setSelectedProduct(product);
    const own = bomsForProduct(boms, product.id);
    setFormData((prev) => ({ ...prev, product_id: product.id, bom_id: own.length ? own[0].id : "" }));
  };
  const selectBom = (bomId) => {
    const bom = boms.find((b) => b.id === bomId);
    setFormData((prev) => ({ ...prev, bom_id: bomId, product_id: bom ? bom.product_id : prev.product_id }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      await axios.post(route("store.production.store", { store_slug: store?.slug }), buildProductionRunPayload(formData));
      window.dispatchEvent(new CustomEvent("amd:product-updated"));
      localStorage.setItem("amd_product_latest_change", Date.now().toString());
      router.visit(route("store.production.index", { store_slug: store?.slug }));
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors || {});
      } else {
        alert(error.response?.data?.message || "An error occurred");
      }
    } finally {
      setLoading(false);
    }
  };
  const noBomForProduct = !!formData.product_id && !bomsLoading && productBoms.length === 0;
  return /* @__PURE__ */ jsxs(OneGlanceLayout, { title: "New Production Run", children: [
    /* @__PURE__ */ jsx(Head, { title: "New Production Run" }),
    /* @__PURE__ */ jsxs("div", { className: "h-full flex flex-col gap-6 overflow-auto", children: [
      /* @__PURE__ */ jsx(
        PageHeader,
        {
          title: "New Production Run",
          subtitle: "Create a new manufacturing batch",
          icon: Factory,
          breadcrumbs: [
            { label: "Inventory" },
            { label: "Production", href: route("store.production.index", { store_slug: store?.slug }) },
            { label: "New Run" }
          ]
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-2 bg-surface rounded-2xl border border-line p-6 relative overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-6 relative z-10", children: [
            /* @__PURE__ */ jsx(FormField, { label: tt("Product to Manufacture"), required: true, children: /* @__PURE__ */ jsx(
              AsyncProductCombobox,
              {
                selectedItem: selectedProduct || products.find((p) => p.id === formData.product_id),
                onSelect: (product) => {
                  if (product) {
                    selectProduct(product);
                  } else {
                    setSelectedProduct(null);
                    setFormData((prev) => ({ ...prev, product_id: "", bom_id: "" }));
                  }
                },
                placeholder: "Search product..."
              }
            ) }),
            /* @__PURE__ */ jsx(
              FormField,
              {
                label: "Bill of Materials",
                required: true,
                error: errors.bom_id?.[0] || bomsError || (noBomForProduct ? "This product has no active bill of materials." : void 0),
                children: /* @__PURE__ */ jsx(
                  FormSelect,
                  {
                    value: formData.bom_id,
                    onChange: (e) => selectBom(e.target.value),
                    placeholder: bomsLoading ? "Loading…" : "Select bill of materials",
                    children: productBoms.map((b) => /* @__PURE__ */ jsx("option", { value: b.id, children: `${b.product_name || "Product"} — v${b.version}` }, b.id))
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
              /* @__PURE__ */ jsx(FormField, { label: "Quantity to Produce", required: true, error: errors.planned_qty?.[0], children: /* @__PURE__ */ jsx(
                FormInput,
                {
                  type: "number",
                  min: "0.0001",
                  step: "any",
                  value: formData.planned_qty,
                  onChange: (e) => setFormData({ ...formData, planned_qty: e.target.value })
                }
              ) }),
              /* @__PURE__ */ jsx(FormField, { label: "Warehouse", required: true, error: errors.warehouse_id?.[0], children: /* @__PURE__ */ jsx(
                FormSelect,
                {
                  value: formData.warehouse_id,
                  onChange: (e) => setFormData({ ...formData, warehouse_id: e.target.value }),
                  placeholder: "Select warehouse",
                  children: warehouses.map((w) => /* @__PURE__ */ jsx("option", { value: w.id, children: w.name }, w.id))
                }
              ) }),
              /* @__PURE__ */ jsx(FormField, { label: "Run Date", required: true, error: errors.run_date?.[0], children: /* @__PURE__ */ jsx(
                FormInput,
                {
                  type: "date",
                  max: localIsoDate(),
                  value: formData.run_date,
                  onChange: (e) => setFormData({ ...formData, run_date: e.target.value })
                }
              ) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-line", children: [
              /* @__PURE__ */ jsx(SecondaryButton, { onClick: () => router.visit(route("store.production.index", { store_slug: store?.slug })), children: "Cancel" }),
              /* @__PURE__ */ jsx(PrimaryButton, { type: "submit", loading, disabled: !formData.bom_id, children: "Start Production" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-surface rounded-2xl border border-line p-6", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-semibold text-lg text-ink mb-4 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Package, { size: 18 }),
            "Materials Needed"
          ] }),
          selectedBom ? /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            requirements.map((ing) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between p-3 bg-app rounded-lg", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("p", { className: "font-medium text-ink", children: ing.name }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: ing.sku })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
                /* @__PURE__ */ jsx("p", { className: "font-bold text-brand-600", children: ing.required }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-ink-muted", children: "needed" })
              ] })
            ] }, ing.product_id)),
            requirements.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm text-ink-muted", children: "No components defined" })
          ] }) : /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-ink-muted", children: [
            /* @__PURE__ */ jsx(Package, { size: 32, className: "mx-auto mb-2 opacity-50" }),
            /* @__PURE__ */ jsx("p", { children: "Select a bill of materials to see its components" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  CreateProductionRun as default
};
