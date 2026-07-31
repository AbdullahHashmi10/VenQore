import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { F as FormModal, a as FormField, c as FormSelect, b as FormInput, d as FormTextarea, S as SecondaryButton, e as PrimaryButton } from "../ssr.js";
import axios from "axios";
import { usePage } from "@inertiajs/react";
function QuickPartyModal({ isOpen, onClose, onSuccess, type = "customer", initialName = "", editingParty = null }) {
  const {
    store
  } = usePage().props;
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const isEditMode = !!editingParty;
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    type: type === "all" ? "customer" : type,
    opening_balance: 0,
    opening_balance_type: "receivable",
    credit_limit: "",
    address: "",
    notes: "",
    default_discount: 0
  });
  useEffect(() => {
    if (isOpen) {
      if (editingParty) {
        setFormData({
          name: editingParty.name || "",
          phone: editingParty.phone || "",
          email: editingParty.email || "",
          type: editingParty.type || (type === "all" ? "customer" : type),
          opening_balance: editingParty.opening_balance || 0,
          opening_balance_type: editingParty.opening_balance_type || "receivable",
          credit_limit: editingParty.credit_limit || "",
          address: editingParty.address || "",
          notes: editingParty.notes || "",
          default_discount: editingParty.default_discount || 0
        });
      } else {
        setFormData({
          name: initialName,
          phone: "",
          email: "",
          type: type === "all" ? "customer" : type,
          opening_balance: 0,
          opening_balance_type: "receivable",
          credit_limit: "",
          address: "",
          notes: "",
          default_discount: 0
        });
      }
      setErrors({});
    }
  }, [isOpen, initialName, type, editingParty]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      let response;
      if (isEditMode) {
        const url = type === "supplier" ? route("store.suppliers.update", [store.slug, editingParty.id]) : route("store.parties.update", [store.slug, editingParty.id]);
        response = await axios.put(url, formData);
      } else {
        const url = type === "supplier" ? route("store.suppliers.store", { store_slug: store.slug }) : route("store.parties.store", {
          store_slug: store.slug
        });
        response = await axios.post(url, formData);
      }
      if (response.data.success || response.status === 200 || response.status === 201) {
        onSuccess(response.data.party || { ...formData, id: editingParty?.id });
        onClose();
      }
    } catch (error) {
      if (error.response && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        console.error("Error saving party:", error);
      }
    } finally {
      setSubmitting(false);
    }
  };
  const typeLabel = type === "all" ? formData.type === "customer" ? "Customer" : "Supplier" : type === "customer" ? "Customer" : "Supplier";
  return /* @__PURE__ */ jsx(
    FormModal,
    {
      isOpen,
      onClose,
      title: `${isEditMode ? "Edit" : "Create New"} ${typeLabel}`,
      size: "md",
      errors,
      children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4 p-4", children: [
        type === "all" && !isEditMode && /* @__PURE__ */ jsx(FormField, { label: "Contact Type", error: errors.type, required: true, children: /* @__PURE__ */ jsxs(
          FormSelect,
          {
            value: formData.type,
            onChange: (e) => setFormData({ ...formData, type: e.target.value }),
            children: [
              /* @__PURE__ */ jsx("option", { value: "customer", children: "Customer" }),
              /* @__PURE__ */ jsx("option", { value: "supplier", children: "Supplier" })
            ]
          }
        ) }),
        /* @__PURE__ */ jsx(FormField, { label: "Name", error: errors.name, required: true, children: /* @__PURE__ */ jsx(
          FormInput,
          {
            id: "tour-party-name",
            value: formData.name,
            onChange: (e) => setFormData({ ...formData, name: e.target.value }),
            autoFocus: true
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsx(FormField, { label: "Phone", error: errors.phone, children: /* @__PURE__ */ jsx(
            FormInput,
            {
              id: "tour-party-phone",
              value: formData.phone,
              onChange: (e) => setFormData({ ...formData, phone: e.target.value })
            }
          ) }),
          /* @__PURE__ */ jsx(FormField, { label: "Email", error: errors.email, children: /* @__PURE__ */ jsx(
            FormInput,
            {
              type: "email",
              value: formData.email,
              onChange: (e) => setFormData({ ...formData, email: e.target.value })
            }
          ) })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4", children: /* @__PURE__ */ jsx(FormField, { label: "Default Discount (%)", error: errors.default_discount, children: /* @__PURE__ */ jsx(
          FormInput,
          {
            type: "number",
            step: "0.01",
            min: "0",
            max: "100",
            value: formData.default_discount,
            onChange: (e) => setFormData({ ...formData, default_discount: e.target.value }),
            placeholder: "0.00"
          }
        ) }) }),
        !isEditMode && /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsx(FormField, { label: "Opening Balance", error: errors.opening_balance, children: /* @__PURE__ */ jsx(
            FormInput,
            {
              value: formData.opening_balance,
              onChange: (e) => setFormData({ ...formData, opening_balance: e.target.value })
            }
          ) }),
          /* @__PURE__ */ jsx(FormField, { label: "Balance Type", children: /* @__PURE__ */ jsxs(
            FormSelect,
            {
              value: formData.opening_balance_type,
              onChange: (e) => setFormData({ ...formData, opening_balance_type: e.target.value }),
              children: [
                /* @__PURE__ */ jsx("option", { value: "receivable", children: "To Receive (They Owe Us)" }),
                /* @__PURE__ */ jsx("option", { value: "payable", children: "To Pay (We Owe Them)" })
              ]
            }
          ) })
        ] }),
        /* @__PURE__ */ jsx(FormField, { label: "Address", children: /* @__PURE__ */ jsx(
          FormTextarea,
          {
            id: "tour-party-address",
            value: formData.address,
            onChange: (e) => setFormData({ ...formData, address: e.target.value })
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700", children: [
          /* @__PURE__ */ jsx(SecondaryButton, { onClick: onClose, disabled: submitting, children: "Cancel" }),
          /* @__PURE__ */ jsxs(PrimaryButton, { id: "tour-party-submit", type: "submit", disabled: submitting, loading: submitting, children: [
            isEditMode ? "Update" : "Create",
            " ",
            typeLabel
          ] })
        ] })
      ] })
    }
  );
}
export {
  QuickPartyModal as Q
};
