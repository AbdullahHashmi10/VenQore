import { jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useDebounce } from "use-debounce";
import { S as SmartCombobox } from "./SmartCombobox-D_cdCy9L.js";
function AsyncProductCombobox({
  selectedItem,
  onSelect,
  onQueryChange,
  onCreateNew,
  onEdit,
  placeholder = "Search Products...",
  defaultOptions = [],
  ...props
}) {
  const { store } = usePage().props;
  const isControlled = props.value !== void 0;
  const [internalQuery, setInternalQuery] = useState("");
  const query = isControlled ? props.value : internalQuery;
  const setQuery = (val) => {
    if (!isControlled) setInternalQuery(val);
  };
  const [debouncedQuery] = useDebounce(query, 300);
  const [items, setItems] = useState(defaultOptions);
  const [loading, setLoading] = useState(false);
  const fetchProducts = (searchTerm = "") => {
    setLoading(true);
    axios.get(route("store.inventory.search", { store_slug: store?.slug }), { params: { query: searchTerm } }).then((res) => {
      const mapped = (res.data || []).map((p) => ({
        ...p,
        cost: p.cost || p.cost_price
      }));
      setItems(mapped);
    }).catch((err) => console.error("AsyncProductCombobox fetch failed", err)).finally(() => setLoading(false));
  };
  useEffect(() => {
    const handleSync = () => fetchProducts(debouncedQuery || "");
    window.addEventListener("amd:product-updated", handleSync);
    const handleStorage = (e) => {
      if (e.key === "amd_product_latest_change") handleSync();
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("amd:product-updated", handleSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, [debouncedQuery]);
  useEffect(() => {
    if (selectedItem) {
      setItems((prev) => {
        const exists = prev.find((i) => i.id === selectedItem.id);
        return exists ? prev : [selectedItem, ...prev];
      });
    }
  }, [selectedItem]);
  useEffect(() => {
    if (defaultOptions.length > 0) {
      setItems(defaultOptions);
      return;
    }
    fetchProducts("");
  }, []);
  useEffect(() => {
    if (!debouncedQuery) {
      if (defaultOptions.length > 0) {
        setItems(defaultOptions);
      } else {
        fetchProducts("");
      }
      return;
    }
    fetchProducts(debouncedQuery);
  }, [debouncedQuery]);
  return /* @__PURE__ */ jsx(
    SmartCombobox,
    {
      items,
      selectedItem,
      onSelect,
      onQueryChange: (val) => {
        setQuery(val);
        if (onQueryChange) onQueryChange(val);
      },
      loading,
      placeholder,
      displayKey: "name",
      filterKey: "name",
      disableLocalFiltering: true,
      onAddNew: onCreateNew,
      onEdit,
      ...props
    }
  );
}
export {
  AsyncProductCombobox as A
};
