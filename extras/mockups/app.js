// Dynamic Mock Data & Chart Variables Configuration
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // DOM Elements
  const navButtons = document.querySelectorAll('.nav-btn');
  const pageContainers = document.querySelectorAll('.page-container');
  const headerTitle = document.getElementById('header-title');
  const headerSubtitle = document.getElementById('header-subtitle');
  const adminPanelBtn = document.getElementById('admin-panel-btn');
  const adminBtnText = document.getElementById('admin-btn-text');
  
  // Customizer Controls
  const customizerSidebar = document.getElementById('customizer-sidebar');
  const customizerToggle = document.getElementById('customizer-toggle-btn');
  const customizerClose = document.getElementById('customizer-close-btn');
  const customizerCloseBtn2 = document.getElementById('close-theme-btn');
  const fontSelect = document.getElementById('customizer-font-select');
  const fontScaleInput = document.getElementById('customizer-font-scale');
  const fontScaleValue = document.getElementById('font-scale-value');
  const resetThemeBtn = document.getElementById('reset-theme-btn');
  const exportCssBtn = document.getElementById('export-css-btn');
  const presetButtons = document.querySelectorAll('.preset-btn');
  
  // Theme Switcher
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeToggleIcon = document.getElementById('theme-toggle-icon');

  // Floating Chat Widget Controls
  const chatBubbleBtn = document.getElementById('floating-chat-bubble-btn');
  const chatWindow = document.getElementById('ai-chat-window');
  const chatCloseBtn = document.getElementById('ai-chat-close-btn');
  const chatInputForm = document.getElementById('chat-input-form');
  const chatTextInput = document.getElementById('chat-text-input');
  const chatMessagesContainer = document.getElementById('chat-messages-container');

  // Color Pickers
  const pickers = {
    bg: document.getElementById('picker-bg'),
    surface: document.getElementById('picker-surface'),
    sunken: document.getElementById('picker-sunken'),
    accent: document.getElementById('picker-accent'),
    text: document.getElementById('picker-text'),
    text2: document.getElementById('picker-text-2'),
    line: document.getElementById('picker-line'),
    success: document.getElementById('picker-success'),
    warning: document.getElementById('picker-warning'),
    danger: document.getElementById('picker-danger'),
  };

  // HEX Text Inputs
  const hexInputs = {
    bg: document.getElementById('hex-bg'),
    surface: document.getElementById('hex-surface'),
    sunken: document.getElementById('hex-sunken'),
    accent: document.getElementById('hex-accent'),
    text: document.getElementById('hex-text'),
    text2: document.getElementById('hex-text-2'),
    line: document.getElementById('hex-line'),
    success: document.getElementById('hex-success'),
    warning: document.getElementById('hex-warning'),
    danger: document.getElementById('hex-danger'),
  };

  // State Management
  let currentPage = 'overview';
  let activeTheme = 'dark';
  let fontScale = 1.00;
  let charts = {};

  // Design System base sizes for typography ratio locking
  const typographyBase = {
    display: 60,
    h1: 40,
    h2: 32,
    h3: 20,
    lede: 19,
    body: 16,
    small: 14,
    caption: 13,
    eyebrow: 11
  };

  // Theme Presets Store (colors, fonts, custom radii adjustments)
  const presets = {
    'classic-dark': {
      '--vq-bg': '#0b0e14',
      '--vq-sunken': '#06080e',
      '--vq-surface': '#121620',
      '--vq-raised': '#181d2a',
      '--vq-text': '#f3f4f6',
      '--vq-text-2': '#9ca3af',
      '--vq-text-3': '#4b5563',
      '--vq-accent': '#6366f1',
      '--vq-accent-hover': '#4f46e5',
      '--vq-accent-text': '#818cf8',
      '--vq-accent-quiet': 'rgba(99, 102, 241, 0.15)',
      '--vq-line': 'rgba(255, 255, 255, 0.08)',
      '--vq-success': '#10b981',
      '--vq-warning': '#f59e0b',
      '--vq-danger': '#ef4444',
      '--vq-info': '#3b82f6',
      '--vq-font-sans': "'Inter', system-ui, sans-serif",
      '--vq-r-md': '10px',
      '--vq-r-lg': '14px',
      '--vq-r-xl': '20px',
      '--vq-r-2xl': '24px'
    },
    'vq2-dark': {
      '--vq-bg': '#0a0b0f',
      '--vq-sunken': '#030509',
      '--vq-surface': '#12141a',
      '--vq-raised': '#1a1d25',
      '--vq-text': '#f4f6f8',
      '--vq-text-2': '#bfc3c8',
      '--vq-text-3': '#595e64',
      '--vq-accent': '#327882',
      '--vq-accent-hover': '#21656f',
      '--vq-accent-text': '#5da5b0',
      '--vq-accent-quiet': 'rgba(50, 120, 130, 0.16)',
      '--vq-line': 'rgba(255, 255, 255, 0.10)',
      '--vq-success': '#54cc8e',
      '--vq-warning': '#efb146',
      '--vq-danger': '#f17070',
      '--vq-info': '#bfc3c8',
      '--vq-font-sans': "'Inter', system-ui, sans-serif",
      '--vq-r-md': '10px',
      '--vq-r-lg': '14px',
      '--vq-r-xl': '20px',
      '--vq-r-2xl': '24px'
    },
    'vq2-light': {
      '--vq-bg': '#ffffff',
      '--vq-sunken': '#f4f6f8',
      '--vq-surface': '#f9fafc',
      '--vq-raised': '#ffffff',
      '--vq-text': '#151a1f',
      '--vq-text-2': '#595e64',
      '--vq-text-3': '#9a9fa5',
      '--vq-accent': '#327882',
      '--vq-accent-hover': '#21656f',
      '--vq-accent-text': '#21656f',
      '--vq-accent-quiet': '#ecf9fb',
      '--vq-line': '#d9dde0',
      '--vq-success': '#1a7f51',
      '--vq-warning': '#a85b05',
      '--vq-danger': '#bd3838',
      '--vq-info': '#595e64',
      '--vq-font-sans': "'Inter', system-ui, sans-serif",
      '--vq-r-md': '10px',
      '--vq-r-lg': '14px',
      '--vq-r-xl': '20px',
      '--vq-r-2xl': '24px'
    },
    'emerald': {
      '--vq-bg': '#02120b',
      '--vq-sunken': '#010906',
      '--vq-surface': '#072115',
      '--vq-raised': '#0c3220',
      '--vq-text': '#e6f7ef',
      '--vq-text-2': '#8cd3b3',
      '--vq-text-3': '#3e7d60',
      '--vq-accent': '#10b981',
      '--vq-accent-hover': '#059669',
      '--vq-accent-text': '#34d399',
      '--vq-accent-quiet': 'rgba(16, 185, 129, 0.15)',
      '--vq-line': 'rgba(255, 255, 255, 0.08)',
      '--vq-success': '#10b981',
      '--vq-warning': '#f59e0b',
      '--vq-danger': '#ef4444',
      '--vq-info': '#6b7280',
      '--vq-font-sans': "'Inter', system-ui, sans-serif",
      '--vq-r-md': '10px',
      '--vq-r-lg': '14px',
      '--vq-r-xl': '20px',
      '--vq-r-2xl': '24px'
    },
    'amber-retro': {
      '--vq-bg': '#1b1812',
      '--vq-sunken': '#12100b',
      '--vq-surface': '#252119',
      '--vq-raised': '#302b20',
      '--vq-text': '#fcfaf7',
      '--vq-text-2': '#d9c8a9',
      '--vq-text-3': '#8a7b63',
      '--vq-accent': '#f59e0b',
      '--vq-accent-hover': '#d97706',
      '--vq-accent-text': '#fbbf24',
      '--vq-accent-quiet': 'rgba(245, 158, 11, 0.15)',
      '--vq-line': 'rgba(255, 255, 255, 0.08)',
      '--vq-success': '#10b981',
      '--vq-warning': '#f59e0b',
      '--vq-danger': '#ef4444',
      '--vq-info': '#6b7280',
      '--vq-font-sans': "'Inter', system-ui, sans-serif",
      '--vq-r-md': '10px',
      '--vq-r-lg': '14px',
      '--vq-r-xl': '20px',
      '--vq-r-2xl': '24px'
    },
    'donezo-light': {
      '--vq-bg': '#f3f5f4',
      '--vq-sunken': '#ebefed',
      '--vq-surface': '#ffffff',
      '--vq-raised': '#ffffff',
      '--vq-text': '#0d1612',
      '--vq-text-2': '#4c5c56',
      '--vq-text-3': '#90a09a',
      '--vq-accent': '#105342',
      '--vq-accent-hover': '#0b3c30',
      '--vq-accent-text': '#105342',
      '--vq-accent-quiet': '#e7f0ed',
      '--vq-line': '#e2e7e4',
      '--vq-success': '#1a7f51',
      '--vq-warning': '#a85b05',
      '--vq-danger': '#bd3838',
      '--vq-info': '#4c5c56',
      '--vq-font-sans': "'Poppins', system-ui, sans-serif",
      '--vq-r-md': '12px',
      '--vq-r-lg': '18px',
      '--vq-r-xl': '24px',
      '--vq-r-2xl': '28px'
    }
  };

  // Mock Sales Data
  const salesData = [
    { date: 'Aug 16, 2026', invoice: 'SAI-R1-160826-0001 POS', party: 'Walk-in', type: 'SALE', pay: 'SPLIT', amt: 1244.00, bal: 'Settled', due: '-', status: 'PAID' },
    { date: 'Aug 10, 2026', invoice: 'SAL-R1-260726-0005', party: 'Walk-In Customer 25', type: 'SALE', pay: 'CASH', amt: 199.00, bal: 'Settled', due: '-', status: 'PAID' },
    { date: 'Aug 10, 2026', invoice: 'SAL-R1-260-26-0001', party: 'Walk-In Customer 7', type: 'SALE', pay: 'CASH', amt: 349.00, bal: 'Settled', due: '-', status: 'PAID' },
    { date: 'Aug 10, 2026', invoice: 'SAL-R1-260726-0003', party: 'Ashley Jones\n555-2326', type: 'SALE', pay: 'CASH', amt: 249.00, bal: 'Settled', due: '-', status: 'PAID' },
    { date: 'Aug 10, 2026', invoice: 'SAL-R1-260726-0002', party: 'John Hernandez\n555-9435', type: 'SALE', pay: 'CASH', amt: 398.00, bal: 'Settled', due: '-', status: 'PAID' },
    { date: 'Aug 10, 2026', invoice: 'SAL-R1-260726-0004', party: 'William Anderson\n555-3635', type: 'SALE', pay: 'CASH', amt: 149.00, bal: 'Settled', due: '-', status: 'PAID' },
    { date: 'Aug 09, 2026', invoice: 'SAL-R1-250726-0023', party: 'Thomas Garcia\n555-4037', type: 'SALE', pay: 'CASH', amt: 449.10, bal: 'Settled', due: '-', status: 'PAID' },
    { date: 'Aug 09, 2026', invoice: 'SAL-R1-250726-0024', party: 'Walk-In Customer 17', type: 'SALE', pay: 'CASH', amt: 268.20, bal: 'Settled', due: '-', status: 'PAID' },
    { date: 'Aug 09, 2026', invoice: 'SAL-R1-250726-0021', party: 'Michael Rodriguez\n555-4367', type: 'SALE', pay: 'CASH', amt: 4295.00, bal: 'Settled', due: '-', status: 'PAID' },
    { date: 'Aug 09, 2026', invoice: 'SAL-R1-250726-0022', party: 'Walk-In Customer 3', type: 'SALE', pay: 'CASH', amt: 100.00, bal: 'Settled', due: '-', status: 'PAID' }
  ];

  // Mock Products Data
  const productsData = [
    { name: 'Lenovo ThinkPad X1 Carbon', sku: 'SKU-LNV-001', category: 'Laptops', stock: 45, buy: 1200.00, sell: 1673.51, status: 'In Stock' },
    { name: 'ASUS ROG Zephyrus G14', sku: 'SKU-ASU-002', category: 'Laptops', stock: 12, buy: 900.00, sell: 1217.13, status: 'In Stock' },
    { name: 'Samsung Galaxy S24 Ultra', sku: 'SKU-SAM-003', category: 'Phones', stock: 0, buy: 800.00, sell: 1199.00, status: 'Out of Stock' },
    { name: 'Apple iPhone 15 Pro Max', sku: 'SKU-APL-004', category: 'Phones', stock: 0, buy: 950.00, sell: 1399.00, status: 'Out of Stock' },
    { name: 'Logitech MX Master 3S', sku: 'SKU-LOG-005', category: 'Accessories', stock: 8, buy: 65.00, sell: 99.99, status: 'Low Stock' },
    { name: 'Sony WH-1000XM5 Headphones', sku: 'SKU-SON-006', category: 'Audio', stock: 3, buy: 220.00, sell: 349.99, status: 'Low Stock' },
    { name: 'Dell UltraSharp 27 Monitor', sku: 'SKU-DEL-007', category: 'Monitors', stock: 22, buy: 300.00, sell: 449.99, status: 'In Stock' },
    { name: 'Apple MacBook Pro 16" M3', sku: 'SKU-APL-008', category: 'Laptops', stock: 15, buy: 1800.00, sell: 2499.00, status: 'In Stock' }
  ];

  // Initialize Page Switcher
  function switchPage(pageId) {
    currentPage = pageId;

    navButtons.forEach(btn => {
      const activeInd = btn.querySelector('.active-indicator');
      if (btn.getAttribute('data-page') === pageId) {
        btn.classList.add('text-vq-accent-text', 'bg-vq-accent-quiet', 'font-semibold');
        btn.classList.remove('text-vq-text-2');
        if (activeInd) activeInd.classList.remove('hidden');
      } else {
        btn.classList.remove('text-vq-accent-text', 'bg-vq-accent-quiet', 'font-semibold');
        btn.classList.add('text-vq-text-2');
        if (activeInd) activeInd.classList.add('hidden');
      }
    });

    pageContainers.forEach(container => {
      if (container.id === `page-${pageId}`) {
        container.classList.remove('hidden');
      } else {
        container.classList.add('hidden');
      }
    });

    const titles = {
      'overview': { title: 'Overview', sub: 'Welcome back, Ahmad Raza' },
      'executive': { title: 'Executive Dashboard', sub: 'Welcome back, Ahmad Raza' },
      'sales-history': { title: 'Sales History', sub: 'Track invoices, payments, and custom invoices' },
      'products': { title: 'Products List', sub: 'Manage product stock levels and pricing' },
      'profit-loss': { title: 'Profit & Loss Statement', sub: 'Financial performance and ledger details' },
      'sales-report': { title: 'Sales Report', sub: 'Detailed visual reports on sales' }
    };

    if (titles[pageId]) {
      headerTitle.textContent = titles[pageId].title;
      headerSubtitle.textContent = titles[pageId].sub;
    }

    if (pageId === 'executive') {
      adminBtnText.textContent = 'Back to Store';
      adminPanelBtn.querySelector('i').setAttribute('data-lucide', 'store');
      lucide.createIcons();
    } else {
      adminBtnText.textContent = 'Admin Panel';
      adminPanelBtn.querySelector('i').setAttribute('data-lucide', 'shield');
      lucide.createIcons();
    }

    setTimeout(() => {
      renderChartsForPage(pageId);
    }, 50);
  }

  window.switchPage = switchPage;

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchPage(btn.getAttribute('data-page'));
    });
  });

  adminPanelBtn.addEventListener('click', () => {
    if (currentPage === 'executive') {
      switchPage('overview');
    } else {
      switchPage('executive');
    }
  });

  // Customizer Toggle
  customizerToggle.addEventListener('click', () => {
    customizerSidebar.classList.remove('translate-x-full');
  });

  const closeSidebar = () => {
    customizerSidebar.classList.add('translate-x-full');
  };
  customizerClose.addEventListener('click', closeSidebar);
  customizerCloseBtn2.addEventListener('click', closeSidebar);

  // Theme Toggler
  themeToggleBtn.addEventListener('click', () => {
    if (activeTheme === 'dark') {
      activeTheme = 'light';
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggleIcon.setAttribute('data-lucide', 'sun');
      loadPreset('vq2-light');
    } else {
      activeTheme = 'dark';
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggleIcon.setAttribute('data-lucide', 'moon');
      loadPreset('vq2-dark');
    }
    lucide.createIcons();
  });

  // Floating Chat bubble Toggle
  chatBubbleBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('hidden');
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
  });

  chatCloseBtn.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
  });

  // AI Chat responses logic
  chatInputForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = chatTextInput.value.trim();
    if (!query) return;

    appendChatMessage('user', query);
    chatTextInput.value = '';

    const typingIndicator = appendChatMessage('ai', 'Thinking...', true);

    setTimeout(() => {
      typingIndicator.remove();
      const reply = getAIResponse(query);
      appendChatMessage('ai', reply);
    }, 1000);
  });

  function appendChatMessage(sender, text, isIndicator = false) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-msg ${sender}-msg flex gap-2 ${sender === 'user' ? 'justify-end' : ''}`;
    
    if (sender === 'user') {
      msgDiv.innerHTML = `
        <div class="bg-vq-accent text-vq-on-accent border border-vq-accent rounded-lg p-2.5 max-w-[80%] leading-relaxed">
          ${text}
        </div>
      `;
    } else {
      msgDiv.innerHTML = `
        <div class="w-7 h-7 rounded-full bg-vq-accent/20 border border-vq-accent/30 text-vq-accent-text flex items-center justify-center text-[10px] font-bold flex-shrink-0">
          AI
        </div>
        <div class="bg-vq-sunken border border-vq-line rounded-lg p-2.5 max-w-[80%] leading-relaxed text-vq-text-2 ${isIndicator ? 'italic animate-pulse' : ''}">
          ${text}
        </div>
      `;
    }
    
    chatMessagesContainer.appendChild(msgDiv);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    return msgDiv;
  }

  function getAIResponse(query) {
    const q = query.toLowerCase();
    if (q.includes('profit') || q.includes('cogs') || q.includes('margin') || q.includes('revenue')) {
      return "Current Net Profit is **$287,845.55** (representing a margin of **20.8%**). Total Sales Revenue stands at **$1,382,436.55** with cost of goods sold (COGS) at **$-1,094,591.00**.";
    }
    if (q.includes('stock') || q.includes('alert') || q.includes('products') || q.includes('low')) {
      return "Inventory Status: We have **18 Low Stock alerts** (e.g. Logitech MX Master, Sony WH-1000XM5) and **5 items Out of Stock** (Samsung Galaxy S24, iPhone 15 Pro Max). Total product catalog size is 245.";
    }
    if (q.includes('theme') || q.includes('customizer') || q.includes('export') || q.includes('color')) {
      return "To customize, click the **Palette (🎨) icon** in the sidebar. You can load presets or set individual HEX codes. When satisfied, click **'Copy theme variables CSS'** to export the CSS custom properties.";
    }
    if (q.includes('balance') || q.includes('cash') || q.includes('bank')) {
      return "Total net balance across bank accounts is **$8,969,631.30**. Cash in hand is currently **$6,636,549.20** and total asset stock valuation is **$87,299,019.00**.";
    }
    return "I can query details from the dashboards for you. Try asking about **'profit margin'**, **'low stock alerts'**, **'bank balance'**, or **'theme customization'**!";
  }

  // Dynamic CSS variables injector
  function applyColor(variable, val) {
    if (!val.startsWith('#') && !val.startsWith('rgba') && !val.startsWith('rgb')) {
      val = '#' + val;
    }
    
    const hexPattern = /^#([0-9a-fA-F]{3}){1,2}$/;
    const hex8Pattern = /^#([0-9a-fA-F]{4}){1,2}$/;
    
    if (val.startsWith('#') && !hexPattern.test(val) && !hex8Pattern.test(val)) {
      return; 
    }

    document.documentElement.style.setProperty(variable, val);
    
    const key = variable.replace('--vq-', '').replace('-2', '2');
    
    if (pickers[key]) {
      pickers[key].value = val.startsWith('#') && val.length === 7 ? val : rgbToHex(val);
    }
    
    if (hexInputs[key]) {
      hexInputs[key].value = val;
    }

    // Handle soft background colors derived from parent values
    if (variable === '--vq-accent') {
      document.documentElement.style.setProperty('--vq-accent-quiet', hexToRgba(val, 0.15));
      document.documentElement.style.setProperty('--vq-accent-hover', adjustColorBrightness(val, -15));
      document.documentElement.style.setProperty('--vq-accent-text', val);
      document.documentElement.style.setProperty('--vq-focus', val);
    }
    if (variable === '--vq-success') {
      document.documentElement.style.setProperty('--vq-success-bg', hexToRgba(val, 0.12));
      document.documentElement.style.setProperty('--vq-success-line', hexToRgba(val, 0.3));
    }
    if (variable === '--vq-warning') {
      document.documentElement.style.setProperty('--vq-warning-bg', hexToRgba(val, 0.12));
      document.documentElement.style.setProperty('--vq-warning-line', hexToRgba(val, 0.3));
    }
    if (variable === '--vq-danger') {
      document.documentElement.style.setProperty('--vq-danger-bg', hexToRgba(val, 0.12));
      document.documentElement.style.setProperty('--vq-danger-line', hexToRgba(val, 0.3));
    }
  }

  function rgbToHex(rgbVal) {
    if (!rgbVal || !rgbVal.startsWith('rgb')) return '#000000';
    const parts = rgbVal.match(/\d+/g);
    if (!parts || parts.length < 3) return '#000000';
    const r = parseInt(parts[0]).toString(16).padStart(2, '0');
    const g = parseInt(parts[1]).toString(16).padStart(2, '0');
    const b = parseInt(parts[2]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // Load Preset
  function loadPreset(presetName) {
    const preset = presets[presetName];
    if (!preset) return;

    // Apply colors and settings
    Object.keys(preset).forEach(variable => {
      if (variable.startsWith('--vq-font')) {
        document.documentElement.style.setProperty(variable, preset[variable]);
      } else {
        applyColor(variable, preset[variable]);
      }
    });

    // Update Font Dropdown Selector alignment
    if (preset['--vq-font-sans']) {
      if (preset['--vq-font-sans'].includes('Poppins')) {
        fontSelect.value = 'Poppins';
      } else if (preset['--vq-font-sans'].includes('Inter')) {
        fontSelect.value = 'Inter';
      } else if (preset['--vq-font-sans'].includes('Roboto')) {
        fontSelect.value = 'Roboto';
      } else if (preset['--vq-font-sans'].includes('Serif')) {
        fontSelect.value = 'Instrument Serif';
      } else if (preset['--vq-font-sans'].includes('Mono')) {
        fontSelect.value = 'JetBrains Mono';
      } else {
        fontSelect.value = 'system-ui';
      }
    }

    // Set layout-theme classes (Donezo is Light mode, VQ2-Light is Light mode)
    if (presetName === 'vq2-light' || presetName === 'donezo-light') {
      activeTheme = 'light';
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      themeToggleIcon.setAttribute('data-lucide', 'sun');
    } else {
      activeTheme = 'dark';
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      themeToggleIcon.setAttribute('data-lucide', 'moon');
    }
    lucide.createIcons();

    // Update preset buttons state
    presetButtons.forEach(btn => {
      if (btn.getAttribute('data-preset') === presetName) {
        btn.classList.add('border-vq-accent', 'text-vq-accent-text');
        btn.classList.remove('border-vq-line');
      } else {
        btn.classList.remove('border-vq-accent', 'text-vq-accent-text');
        btn.classList.add('border-vq-line');
      }
    });

    setTimeout(() => {
      updateChartsTheme();
    }, 100);
  }

  // Color adjustment helper (convert hex to rgba)
  function hexToRgba(hex, alpha) {
    let r = 0, g = 0, b = 0;
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
    hex = hex.replace('#', '');
    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else if (hex.length === 6) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Adjust brightness of a color (+% or -%)
  function adjustColorBrightness(hex, percent) {
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
    let R = parseInt(hex.substring(1, 3), 16);
    let G = parseInt(hex.substring(3, 5), 16);
    let B = parseInt(hex.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = (R > 0) ? R : 0;
    G = (G > 0) ? G : 0;
    B = (B > 0) ? B : 0;

    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
  }

  // Apply Typography Ratio Scale
  function applyFontScale(scale) {
    fontScale = parseFloat(scale);
    fontScaleValue.textContent = fontScale.toFixed(2) + 'x';
    
    Object.keys(typographyBase).forEach(key => {
      const scaledSize = Math.round(typographyBase[key] * fontScale);
      document.documentElement.style.setProperty(`--vq-fs-${key}`, `${scaledSize}px`);
    });
  }

  // Picker event binders
  Object.keys(pickers).forEach(key => {
    pickers[key].addEventListener('input', (e) => {
      let cssVar = '--vq-' + key.replace('text2', 'text-2');
      applyColor(cssVar, e.target.value);
      updateChartsTheme();
    });
  });

  // HEX Input keyboard event binders
  Object.keys(hexInputs).forEach(key => {
    hexInputs[key].addEventListener('change', (e) => {
      let cssVar = '--vq-' + key.replace('text2', 'text-2');
      applyColor(cssVar, e.target.value);
      updateChartsTheme();
    });
  });

  // Typography Scaling Slider Binder
  fontScaleInput.addEventListener('input', (e) => {
    applyFontScale(e.target.value);
  });

  presetButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      loadPreset(btn.getAttribute('data-preset'));
    });
  });

  fontSelect.addEventListener('change', (e) => {
    const font = e.target.value;
    document.documentElement.style.setProperty('--vq-font-sans', `'${font}', system-ui, sans-serif`);
  });

  // Reset Theme
  resetThemeBtn.addEventListener('click', () => {
    loadPreset('classic-dark');
    fontSelect.value = 'Inter';
    document.documentElement.style.setProperty('--vq-font-sans', "'Inter', system-ui, sans-serif");
    fontScaleInput.value = 1.00;
    applyFontScale(1.00);
  });

  // Export CSS variables block
  exportCssBtn.addEventListener('click', () => {
    const computedStyles = getComputedStyle(document.documentElement);
    const cssVars = [
      '--vq-bg', '--vq-sunken', '--vq-surface', '--vq-raised',
      '--vq-text', '--vq-text-2', '--vq-text-3',
      '--vq-accent', '--vq-accent-hover', '--vq-accent-text', '--vq-accent-quiet',
      '--vq-line', '--vq-success', '--vq-warning', '--vq-danger', '--vq-info',
      '--vq-fs-display', '--vq-fs-h1', '--vq-fs-h2', '--vq-fs-h3',
      '--vq-fs-lede', '--vq-fs-body', '--vq-fs-small', '--vq-fs-caption', '--vq-fs-eyebrow'
    ];
    
    let rules = `:root[data-theme='custom'] {\n`;
    cssVars.forEach(v => {
      rules += `  ${v}: ${computedStyles.getPropertyValue(v).trim()};\n`;
    });
    rules += `}`;

    navigator.clipboard.writeText(rules).then(() => {
      const prevText = exportCssBtn.innerHTML;
      exportCssBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i> Copied successfully!`;
      lucide.createIcons();
      setTimeout(() => {
        exportCssBtn.innerHTML = prevText;
        lucide.createIcons();
      }, 2000);
    });
  });

  // Table Injections
  function renderSalesTable() {
    const tableBody = document.getElementById('sales-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    salesData.forEach((row) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-vq-sunken transition-colors border-b border-vq-line-soft';
      tr.innerHTML = `
        <td class="p-3 pl-4"><input type="checkbox" class="rounded border-vq-line"></td>
        <td class="p-3 text-vq-text-2 whitespace-nowrap">${row.date}</td>
        <td class="p-3 font-semibold text-vq-text whitespace-nowrap">${row.invoice}</td>
        <td class="p-3 text-vq-text-2">
          <div class="whitespace-pre-line leading-normal">${row.party}</div>
        </td>
        <td class="p-3">
          <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-vq-accent-quiet text-vq-accent-text border border-vq-accent/30 font-mono-var">${row.type}</span>
        </td>
        <td class="p-3 text-vq-text-2">${row.pay}</td>
        <td class="p-3 text-right font-semibold text-vq-text tnum">$${row.amt.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td class="p-3 text-vq-success font-medium">${row.bal}</td>
        <td class="p-3 text-vq-text-3">${row.due}</td>
        <td class="p-3 text-center">
          <span class="px-2 py-0.5 rounded text-[9px] font-bold bg-vq-success-bg text-vq-success border border-vq-success-line uppercase font-mono-var">${row.status}</span>
        </td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5 text-vq-text-3">
            <button class="w-6 h-6 rounded hover:bg-vq-sunken hover:text-vq-text transition-colors"><i data-lucide="printer" class="w-3.5 h-3.5"></i></button>
            <button class="w-6 h-6 rounded hover:bg-vq-sunken hover:text-vq-text transition-colors"><i data-lucide="external-link" class="w-3.5 h-3.5"></i></button>
            <button class="w-6 h-6 rounded hover:bg-vq-sunken hover:text-vq-text transition-colors"><i data-lucide="more-vertical" class="w-3.5 h-3.5"></i></button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
    lucide.createIcons();
  }

  function renderProductsTable() {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;
    tableBody.innerHTML = '';

    productsData.forEach((row) => {
      let statusClass = 'bg-vq-success-bg text-vq-success border-vq-success-line';
      if (row.status === 'Low Stock') statusClass = 'bg-vq-warning-bg text-vq-warning border-vq-warning-line';
      if (row.status === 'Out of Stock') statusClass = 'bg-vq-danger-bg text-vq-danger border-vq-danger-line';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-vq-sunken transition-colors border-b border-vq-line-soft';
      tr.innerHTML = `
        <td class="p-3 pl-4"><input type="checkbox" class="rounded border-vq-line"></td>
        <td class="p-3 font-semibold text-vq-text whitespace-nowrap">${row.name}</td>
        <td class="p-3 font-mono-var text-vq-text-2">${row.sku}</td>
        <td class="p-3 text-vq-text-2">${row.category}</td>
        <td class="p-3 text-right font-semibold text-vq-text tnum">${row.stock}</td>
        <td class="p-3 text-right text-vq-text-2 tnum">$${row.buy.toFixed(2)}</td>
        <td class="p-3 text-right font-semibold text-vq-text tnum">$${row.sell.toFixed(2)}</td>
        <td class="p-3 text-center">
          <span class="px-2 py-0.5 rounded text-[9px] font-bold border ${statusClass} uppercase font-mono-var">${row.status}</span>
        </td>
        <td class="p-3 text-center">
          <div class="flex items-center justify-center gap-1.5 text-vq-text-3">
            <button class="w-6 h-6 rounded hover:bg-vq-sunken hover:text-vq-text transition-colors"><i data-lucide="edit-3" class="w-3.5 h-3.5"></i></button>
            <button class="w-6 h-6 rounded hover:bg-vq-sunken hover:text-vq-danger transition-colors"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
        </td>
      `;
      tableBody.appendChild(tr);
    });
    lucide.createIcons();
  }

  function getThemeColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  // --- Chart.js rendering ---
  function renderChartsForPage(pageId) {
    const textColor = getThemeColor('--vq-text-2');
    const borderColor = getThemeColor('--vq-line');
    const accentColor = getThemeColor('--vq-accent');
    const successColor = getThemeColor('--vq-success');
    const warningColor = getThemeColor('--vq-warning');
    const dangerColor = getThemeColor('--vq-danger');

    // Page 1: Overview Revenue Chart
    if (pageId === 'overview' && !charts.overviewRevenue) {
      const ctx = document.getElementById('overviewRevenueChart').getContext('2d');
      charts.overviewRevenue = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
          datasets: [
            {
              label: 'Sales',
              data: [12000, 14500, 11000, 13500, 19000, 22000, 17500, 21000, 24500, 23000, 26000, 29000],
              borderColor: accentColor,
              backgroundColor: hexToRgba(accentColor, 0.1),
              borderWidth: 2,
              tension: 0.15,
              fill: true
            },
            {
              label: 'Gross Profit',
              data: [8000, 11000, 9000, 10000, 14000, 18000, 15000, 17000, 20000, 19000, 21000, 24000],
              borderColor: successColor,
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderDash: [4, 4],
              tension: 0.15
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: borderColor }, ticks: { color: textColor, font: { size: 9, family: 'JetBrains Mono' } } },
            y: { grid: { color: borderColor }, ticks: { color: textColor, font: { size: 9, family: 'JetBrains Mono' } } }
          }
        }
      });
    }

    // Page 2: Executive Page Charts
    if (pageId === 'executive') {
      if (!charts.purchasesTrend) {
        const ctx = document.getElementById('purchasesTrendChart').getContext('2d');
        charts.purchasesTrend = new Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
            datasets: [{
              label: 'Purchases',
              data: [78000, 92000, 85000, 110000, 98000, 125000],
              borderColor: accentColor,
              borderWidth: 2.5,
              tension: 0.2,
              fill: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: borderColor }, ticks: { color: textColor, font: { size: 9, family: 'JetBrains Mono' } } },
              y: { grid: { color: borderColor }, ticks: { color: textColor, font: { size: 9, family: 'JetBrains Mono' } } }
            }
          }
        });
      }

      if (!charts.inventoryDonut) {
        const ctx = document.getElementById('inventoryDonutChart').getContext('2d');
        charts.inventoryDonut = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Healthy', 'Low', 'Out'],
            datasets: [{
              data: [78, 13, 9],
              backgroundColor: [successColor, warningColor, dangerColor],
              borderWidth: 0,
              weight: 0.5
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            cutout: '70%'
          }
        });
      }

      if (!charts.paymentsDonut) {
        const ctx = document.getElementById('paymentsDonutChart').getContext('2d');
        charts.paymentsDonut = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Cash', 'Bank', 'Credit', 'Split'],
            datasets: [{
              data: [2511, 884, 830, 1],
              backgroundColor: [accentColor, successColor, warningColor, dangerColor],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            cutout: '70%'
          }
        });
      }

      if (!charts.expensesDonut) {
        const ctx = document.getElementById('expensesDonutChart').getContext('2d');
        charts.expensesDonut = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Rent', 'Payroll', 'Utilities', 'Software'],
            datasets: [{
              data: [35, 45, 12, 8],
              backgroundColor: [dangerColor, accentColor, warningColor, successColor],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            cutout: '70%'
          }
        });
      }
    }

    // Page 5: Profit & Loss page Charts
    if (pageId === 'profit-loss' && !charts.revenueDistribution) {
      const ctx = document.getElementById('revenueDistributionChart').getContext('2d');
      charts.revenueDistribution = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['COGS', 'Net Profit'],
          datasets: [{
            data: [79.2, 20.8],
            backgroundColor: [dangerColor, successColor],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          cutout: '70%'
        }
      });
    }

    // Page 6: Sales Report Charts
    if (pageId === 'sales-report') {
      if (!charts.salesTrend) {
        const ctx = document.getElementById('salesTrendChart').getContext('2d');
        charts.salesTrend = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                type: 'line',
                label: 'Gross Revenue',
                data: [12000, 19000, 15000, 22000, 26000, 32000, 28000],
                borderColor: accentColor,
                borderWidth: 2,
                tension: 0.15,
                fill: false
              },
              {
                type: 'bar',
                label: 'Net Profits',
                data: [4000, 6000, 5000, 7500, 9000, 12000, 9500],
                backgroundColor: hexToRgba(successColor, 0.4),
                borderRadius: 4,
                borderWidth: 0
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: borderColor }, ticks: { color: textColor, font: { size: 9, family: 'JetBrains Mono' } } },
              y: { grid: { color: borderColor }, ticks: { color: textColor, font: { size: 9, family: 'JetBrains Mono' } } }
            }
          }
        });
      }

      if (!charts.channelDistribution) {
        const ctx = document.getElementById('channelDistributionChart').getContext('2d');
        charts.channelDistribution = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['POS', 'Woo', 'Amazon', 'eBay'],
            datasets: [{
              data: [70, 18, 8, 4],
              backgroundColor: [accentColor, successColor, warningColor, dangerColor],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } }
          }
        });
      }
    }
  }

  // --- Update Charts Theme colors dynamically ---
  function updateChartsTheme() {
    const textColor = getThemeColor('--vq-text-2');
    const borderColor = getThemeColor('--vq-line');
    const accentColor = getThemeColor('--vq-accent');
    const successColor = getThemeColor('--vq-success');
    const warningColor = getThemeColor('--vq-warning');
    const dangerColor = getThemeColor('--vq-danger');

    if (charts.overviewRevenue) {
      const chart = charts.overviewRevenue;
      chart.data.datasets[0].borderColor = accentColor;
      chart.data.datasets[0].backgroundColor = hexToRgba(accentColor, 0.1);
      chart.data.datasets[1].borderColor = successColor;
      chart.options.scales.x.grid.color = borderColor;
      chart.options.scales.x.ticks.color = textColor;
      chart.options.scales.y.grid.color = borderColor;
      chart.options.scales.y.ticks.color = textColor;
      chart.update();
    }

    if (charts.purchasesTrend) {
      const chart = charts.purchasesTrend;
      chart.data.datasets[0].borderColor = accentColor;
      chart.options.scales.x.grid.color = borderColor;
      chart.options.scales.x.ticks.color = textColor;
      chart.options.scales.y.grid.color = borderColor;
      chart.options.scales.y.ticks.color = textColor;
      chart.update();
    }

    if (charts.inventoryDonut) {
      const chart = charts.inventoryDonut;
      chart.data.datasets[0].backgroundColor = [successColor, warningColor, dangerColor];
      chart.update();
    }

    if (charts.paymentsDonut) {
      const chart = charts.paymentsDonut;
      chart.data.datasets[0].backgroundColor = [accentColor, successColor, warningColor, dangerColor];
      chart.update();
    }

    if (charts.expensesDonut) {
      const chart = charts.expensesDonut;
      chart.data.datasets[0].backgroundColor = [dangerColor, accentColor, warningColor, successColor];
      chart.update();
    }

    if (charts.revenueDistribution) {
      const chart = charts.revenueDistribution;
      chart.data.datasets[0].backgroundColor = [dangerColor, successColor];
      chart.update();
    }

    if (charts.salesTrend) {
      const chart = charts.salesTrend;
      chart.data.datasets[0].borderColor = accentColor;
      chart.data.datasets[1].backgroundColor = hexToRgba(successColor, 0.4);
      chart.options.scales.x.grid.color = borderColor;
      chart.options.scales.x.ticks.color = textColor;
      chart.options.scales.y.grid.color = borderColor;
      chart.options.scales.y.ticks.color = textColor;
      chart.update();
    }

    if (charts.channelDistribution) {
      const chart = charts.channelDistribution;
      chart.data.datasets[0].backgroundColor = [accentColor, successColor, warningColor, dangerColor];
      chart.update();
    }
  }

  // --- Clock updates ---
  function updateClock() {
    const timeEl = document.getElementById('current-time');
    if (!timeEl) return;
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    timeEl.textContent = `${hours}:${minutes} ${ampm}`;
  }

  setInterval(updateClock, 30000);
  updateClock();

  // Search filters
  const salesSearchInput = document.getElementById('sales-search-input');
  if (salesSearchInput) {
    salesSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#sales-table-body tr');
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(query)) {
          row.classList.remove('hidden');
        } else {
          row.classList.add('hidden');
        }
      });
    });
  }

  const productSearchInput = document.getElementById('product-search-input');
  if (productSearchInput) {
    productSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const rows = document.querySelectorAll('#products-table-body tr');
      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        if (text.includes(query)) {
          row.classList.remove('hidden');
        } else {
          row.classList.add('hidden');
        }
      });
    });
  }

  // Initial load
  loadPreset('classic-dark');
  switchPage('overview');
  renderSalesTable();
  renderProductsTable();
  applyFontScale(1.00);
});
