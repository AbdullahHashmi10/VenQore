import { jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useDebounce } from "use-debounce";
import { S as SmartCombobox } from "./SmartCombobox-D_cdCy9L.js";
function AsyncPartyCombobox({
  selectedItem,
  onSelect,
  onQueryChange,
  onCreateNew,
  onEdit,
  placeholder = "Search Parties...",
  type = "all",
  // 'customer', 'supplier', or 'all'
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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (selectedItem) {
      setItems((prev) => {
        const exists = prev.find((i) => i.id === (selectedItem.party_id || selectedItem.id));
        return exists ? prev : [selectedItem, ...prev];
      });
    }
  }, [selectedItem]);
  useEffect(() => {
    setLoading(true);
    axios.get(route("store.parties.search", { store_slug: store?.slug }), {
      params: {
        query: debouncedQuery || "",
        type
      }
    }).then((res) => {
      setItems(res.data || []);
    }).catch((err) => console.error("Async Party Search failed", err)).finally(() => setLoading(false));
  }, [debouncedQuery, type]);
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
  AsyncPartyCombobox as A
};
