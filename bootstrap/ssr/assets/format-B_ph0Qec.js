const getCurrencySymbol = (settings = null) => {
  const config = settings || window.amdSettings || {};
  const symbolMap = {
    "PKR": "Rs.",
    "USD": "$",
    "EUR": "€",
    "GBP": "£",
    "INR": "₹",
    "AED": "DH",
    "SAR": "SR"
  };
  const symbol = config.currency_symbol && config.currency_symbol.trim() !== "" ? config.currency_symbol : symbolMap[config.currency_code || config.currency || "PKR"] || "Rs.";
  return symbol;
};
const formatCurrency = (amount, settings = null) => {
  const config = settings || window.amdSettings || {};
  const symbol = getCurrencySymbol(config);
  let decimals = parseInt(config.decimal_places !== void 0 && config.decimal_places !== null && config.decimal_places !== "" ? config.decimal_places : 2);
  if (config.print_amount_decimal === "0" || config.print_amount_decimal === false || config.print_amount_decimal === 0) {
    decimals = 0;
  }
  const useGrouping = config.print_amount_grouping !== "0" && config.print_amount_grouping !== false && config.print_amount_grouping !== 0;
  const formattedNumber = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping
  }).format(amount || 0);
  const separator = symbol.endsWith(" ") ? "" : " ";
  return `${symbol}${separator}${formattedNumber}`;
};
const formatNumber = (number, decimals = null, settings = null) => {
  const config = settings || window.amdSettings || {};
  let d = decimals !== null ? decimals : parseInt(config.decimal_places !== void 0 && config.decimal_places !== null && config.decimal_places !== "" ? config.decimal_places : 2);
  if (decimals === null && (config.print_amount_decimal === "0" || config.print_amount_decimal === false || config.print_amount_decimal === 0)) {
    d = 0;
  }
  const useGrouping = config.print_amount_grouping !== "0" && config.print_amount_grouping !== false && config.print_amount_grouping !== 0;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
    useGrouping
  }).format(number || 0);
};
const numberToWords = (num, type = "1") => {
  const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const makeGroup = (n) => {
    let str2 = "";
    if (n >= 100) {
      str2 += a[Math.floor(n / 100)] + "Hundred ";
      n %= 100;
    }
    if (n >= 10 && n <= 19) {
      str2 += a[n];
    } else if (n >= 20) {
      str2 += b[Math.floor(n / 10)] + (n % 10 !== 0 ? a[n % 10] : " ");
    } else {
      str2 += a[n];
    }
    return str2;
  };
  if (num === 0) return "Zero";
  let integerPart = Math.floor(num);
  let fractionalPart = Math.round((num - integerPart) * 100);
  let str = "";
  if (type === "2") {
    if (integerPart >= 1e7) {
      str += makeGroup(Math.floor(integerPart / 1e7)) + "Crore ";
      integerPart %= 1e7;
    }
    if (integerPart >= 1e5) {
      str += makeGroup(Math.floor(integerPart / 1e5)) + "Lakh ";
      integerPart %= 1e5;
    }
  } else {
    if (integerPart >= 1e6) {
      str += makeGroup(Math.floor(integerPart / 1e6)) + "Million ";
      integerPart %= 1e6;
    }
  }
  if (integerPart >= 1e3) {
    str += makeGroup(Math.floor(integerPart / 1e3)) + "Thousand ";
    integerPart %= 1e3;
  }
  str += makeGroup(integerPart);
  let result = str.trim() + " Only";
  if (fractionalPart > 0) {
    result = str.trim() + " and " + makeGroup(fractionalPart).trim() + " Paise Only";
  }
  return result;
};
const formatDate = (date, settings = null) => {
  if (!date) return "-";
  const config = settings || window.amdSettings || {};
  try {
    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: config.timezone || "UTC"
    };
    return new Intl.DateTimeFormat("en-US", options).format(new Date(date));
  } catch (e) {
    return new Date(date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
  }
};
const formatTime = (date, settings = null) => {
  if (!date) return "-";
  const config = settings || window.amdSettings || {};
  try {
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: config.timezone || "UTC"
    };
    return new Intl.DateTimeFormat("en-US", options).format(new Date(date));
  } catch (e) {
    return new Date(date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  }
};
export {
  formatNumber as a,
  formatDate as b,
  formatTime as c,
  formatCurrency as f,
  getCurrencySymbol as g,
  numberToWords as n
};
