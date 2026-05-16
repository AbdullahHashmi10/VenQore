// Utility functions for formatting - PURE JS (No Hooks)
// Relies on explicit settings argument OR global window.amdSettings injected by Layout

export const formatCurrency = (amount, settings = null) => {
    const config = settings || window.amdSettings || {};
    const symbol = config.currency_symbol || 'Rs';
    const decimals = parseInt(config.decimal_places || 0);

    const formattedNumber = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount || 0);

    return `${symbol} ${formattedNumber}`;
};

export const formatNumber = (number, decimals = null, settings = null) => {
    const config = settings || window.amdSettings || {};
    // If decimals is explicitly passed, use it. Otherwise fall back to settings, then 0.
    const d = decimals !== null ? decimals : parseInt(config.decimal_places || 0);

    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
    }).format(number || 0);
};

export const numberToWords = (num, type = '1') => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const makeGroup = (n) => {
        let str = '';
        if (n >= 100) {
            str += a[Math.floor(n / 100)] + 'Hundred ';
            n %= 100;
        }
        if (n >= 10 && n <= 19) {
            str += a[n];
        } else if (n >= 20) {
            str += b[Math.floor(n / 10)] + (n % 10 !== 0 ? a[n % 10] : ' ');
        } else {
            str += a[n];
        }
        return str;
    };

    if (num === 0) return 'Zero';
    let integerPart = Math.floor(num);
    let fractionalPart = Math.round((num - integerPart) * 100);

    let str = '';
    if (type === '2') { // Indian System
        if (integerPart >= 10000000) {
            str += makeGroup(Math.floor(integerPart / 10000000)) + 'Crore ';
            integerPart %= 10000000;
        }
        if (integerPart >= 100000) {
            str += makeGroup(Math.floor(integerPart / 100000)) + 'Lakh ';
            integerPart %= 100000;
        }
    } else { // International System
        if (integerPart >= 1000000) {
            str += makeGroup(Math.floor(integerPart / 1000000)) + 'Million ';
            integerPart %= 1000000;
        }
    }

    if (integerPart >= 1000) {
        str += makeGroup(Math.floor(integerPart / 1000)) + 'Thousand ';
        integerPart %= 1000;
    }
    str += makeGroup(integerPart);

    let result = str.trim() + ' Only';
    if (fractionalPart > 0) {
        result = str.trim() + ' and ' + makeGroup(fractionalPart).trim() + ' Paise Only';
    }

    return result;
};
