// Utility functions for formatting - PURE JS (No Hooks)
// Relies on explicit settings argument OR global window.amdSettings injected by Layout

export const getCurrencySymbol = (settings = null) => {
    const config = settings || window.amdSettings || {};
    const symbolMap = {
        'PKR': 'Rs.',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'INR': '₹',
        'AED': 'DH',
        'SAR': 'SR',
    };
    
    // Explicitly check for valid non-empty symbol
    const symbol = config.currency_symbol && config.currency_symbol.trim() !== '' 
        ? config.currency_symbol 
        : (symbolMap[config.currency_code || config.currency || 'PKR'] || 'Rs.');
        
    return symbol;
};

export const formatCurrency = (amount, settings = null) => {
    const config = settings || window.amdSettings || {};
    const symbol = getCurrencySymbol(config);
    const decimals = parseInt(config.decimal_places !== undefined ? config.decimal_places : 0);

    const formattedNumber = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(amount || 0);

    // If symbol has no trailing space, add one. If it already has one, don't add.
    const separator = symbol.endsWith(' ') ? '' : ' ';
    return `${symbol}${separator}${formattedNumber}`;
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

export const formatDate = (date, settings = null) => {
    if (!date) return '-';
    const config = settings || window.amdSettings || {};
    
    try {
        const options = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: config.timezone || 'UTC'
        };
        return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
    } catch (e) {
        // Fallback if timezone is invalid
        return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }
};

export const formatTime = (date, settings = null) => {
    if (!date) return '-';
    const config = settings || window.amdSettings || {};
    
    try {
        const options = {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: config.timezone || 'UTC'
        };
        return new Intl.DateTimeFormat('en-US', options).format(new Date(date));
    } catch (e) {
        return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
};
