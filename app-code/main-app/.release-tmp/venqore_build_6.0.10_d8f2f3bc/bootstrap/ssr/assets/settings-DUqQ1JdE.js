function roundTotal(total, settings) {
  const val = settings?.round_off_total;
  if (val === void 0 || val === null || val === "" || val === "none") {
    return parseFloat(total || 0);
  }
  if (val === "1" || val === "0" || val === true) {
    return Math.round(parseFloat(total || 0));
  }
  const decimals = parseInt(val);
  if (isNaN(decimals)) {
    return parseFloat(total || 0);
  }
  const factor = Math.pow(10, decimals);
  return Math.round(parseFloat(total || 0) * factor) / factor;
}
function shouldStopNegativeStock(settings) {
  return isSettingEnabled("stop_sale_negative_stock", settings);
}
function isSettingEnabled(key, settings) {
  const value = settings?.[key];
  return value === "1" || value === true || value === 1 || value === "true";
}
function isWholesalePricingEnabled(settings) {
  return isSettingEnabled("wholesale_price_enabled", settings);
}
function getProductPrice(product, quantity, settings, isWholesaleCustomer = false) {
  if (isWholesalePricingEnabled(settings)) {
    const wholesalePrice = product?.wholesale_price;
    const minQty = product?.wholesale_min_quantity || 1;
    if (wholesalePrice && (quantity >= minQty || isWholesaleCustomer)) {
      return parseFloat(wholesalePrice);
    }
  }
  return parseFloat(product?.price || product?.selling_price || 0);
}
export {
  getProductPrice as g,
  roundTotal as r,
  shouldStopNegativeStock as s
};
