// Main Application Logic & Interactivity

document.addEventListener('DOMContentLoaded', () => {
    // Global LaserFlow Watermark shader configs
    window.laserConfig = {
        beamX: 0.07,
        beamY: 0.02,
        vSizing: 1.5,
        hSizing: 1.6,
        color: '#327882',
        opacity: 100,
        flowSpeed: 0.95
    };

    // Gate the customizer panel behind ?debug=1 parameter
    const urlParams = new URLSearchParams(window.location.search);
    const isDebug = urlParams.get('debug') === '1';
    const gradientPanelToggle = document.getElementById('gradient-panel-toggle');
    if (gradientPanelToggle && !isDebug) {
        gradientPanelToggle.style.display = 'none';
    }

    // 1. Dark / Light Theme Toggle & Tabbed Gradient Customization
    const themeBtn = document.getElementById('theme-toggle');
    const htmlEl = document.documentElement;
    const gradientOverlay = document.querySelector('.hero-gradient-overlay');
    const footerEl = document.querySelector('footer');
    const watermarkText = document.querySelector('footer h1');

    // Light Tab DOM Selectors
    const pickerTopL = document.getElementById('picker-bg-top-l') || document.getElementById('picker-top-l');
    const pickerMidL = document.getElementById('picker-bg-mid-l') || document.getElementById('picker-mid-l');
    const pickerBottomL = document.getElementById('picker-bg-bottom-l') || document.getElementById('picker-bottom-l');
    const sliderTopPosL = document.getElementById('slider-bg-top-pos-l') || document.getElementById('slider-top-pos-l');
    const sliderMidPosL = document.getElementById('slider-bg-mid-pos-l') || document.getElementById('slider-mid-pos-l');
    const sliderBottomPosL = document.getElementById('slider-bg-bottom-pos-l') || document.getElementById('slider-bottom-pos-l');
    const valTopPosL = document.getElementById('val-bg-top-pos-l') || document.getElementById('val-top-pos-l');
    const valMidPosL = document.getElementById('val-bg-mid-pos-l') || document.getElementById('val-mid-pos-l');
    const valBottomPosL = document.getElementById('val-bg-bottom-pos-l') || document.getElementById('val-bottom-pos-l');

    const textTopL = document.getElementById('text-bg-top-l') || document.getElementById('text-top-l');
    const textMidL = document.getElementById('text-bg-mid-l') || document.getElementById('text-mid-l');
    const textBottomL = document.getElementById('text-bg-bottom-l') || document.getElementById('text-bottom-l');

    // Footer Light Tab Selectors
    const pickerFootTopL = document.getElementById('picker-foot-top-l');
    const pickerFootMidL = document.getElementById('picker-foot-mid-l');
    const pickerFootBottomL = document.getElementById('picker-foot-bottom-l');
    const sliderFootTopPosL = document.getElementById('slider-foot-top-pos-l');
    const sliderFootMidPosL = document.getElementById('slider-foot-mid-pos-l');
    const sliderFootBottomPosL = document.getElementById('slider-foot-bottom-pos-l');
    const valFootTopPosL = document.getElementById('val-foot-top-pos-l');
    const valFootMidPosL = document.getElementById('val-foot-mid-pos-l');
    const valFootBottomPosL = document.getElementById('val-foot-bottom-pos-l');
    const textFootTopL = document.getElementById('text-foot-top-l');
    const textFootMidL = document.getElementById('text-foot-mid-l');
    const textFootBottomL = document.getElementById('text-foot-bottom-l');

    // Dark Tab DOM Selectors
    const pickerTopD = document.getElementById('picker-bg-top-d') || document.getElementById('picker-top-d');
    const pickerMidD = document.getElementById('picker-bg-mid-d') || document.getElementById('picker-mid-d');
    const pickerBottomD = document.getElementById('picker-bg-bottom-d') || document.getElementById('picker-bottom-d');
    const sliderTopPosD = document.getElementById('slider-bg-top-pos-d') || document.getElementById('slider-top-pos-d');
    const sliderMidPosD = document.getElementById('slider-bg-mid-pos-d') || document.getElementById('slider-mid-pos-d');
    const sliderBottomPosD = document.getElementById('slider-bg-bottom-pos-d') || document.getElementById('slider-bottom-pos-d');
    const valTopPosD = document.getElementById('val-bg-top-pos-d') || document.getElementById('val-top-pos-d');
    const valMidPosD = document.getElementById('val-bg-mid-pos-d') || document.getElementById('val-mid-pos-d');
    const valBottomPosD = document.getElementById('val-bg-bottom-pos-d') || document.getElementById('val-bottom-pos-d');

    const textTopD = document.getElementById('text-bg-top-d') || document.getElementById('text-top-d');
    const textMidD = document.getElementById('text-bg-mid-d') || document.getElementById('text-mid-d');
    const textBottomD = document.getElementById('text-bg-bottom-d') || document.getElementById('text-bottom-d');

    // Footer Dark Tab Selectors
    const pickerFootTopD = document.getElementById('picker-foot-top-d');
    const pickerFootMidD = document.getElementById('picker-foot-mid-d');
    const pickerFootBottomD = document.getElementById('picker-foot-bottom-d');
    const sliderFootTopPosD = document.getElementById('slider-foot-top-pos-d');
    const sliderFootMidPosD = document.getElementById('slider-foot-mid-pos-d');
    const sliderFootBottomPosD = document.getElementById('slider-foot-bottom-pos-d');
    const valFootTopPosD = document.getElementById('val-foot-top-pos-d');
    const valFootMidPosD = document.getElementById('val-foot-mid-pos-d');
    const valFootBottomPosD = document.getElementById('val-foot-bottom-pos-d');
    const textFootTopD = document.getElementById('text-foot-top-d');
    const textFootMidD = document.getElementById('text-foot-mid-d');
    const textFootBottomD = document.getElementById('text-foot-bottom-d');

    // Watermark Selectors
    const pickerWatermark = document.getElementById('picker-watermark');
    const textWatermark = document.getElementById('text-watermark');
    const sliderWatermarkOpacity = document.getElementById('slider-watermark-opacity');
    const valWatermarkOpacity = document.getElementById('val-watermark-opacity');

    // Tab Headers & Containers
    const tabLight = document.getElementById('tab-light');
    const tabDark = document.getElementById('tab-dark');
    const panelLight = document.getElementById('panel-content-light');
    const panelDark = document.getElementById('panel-content-dark');

    // Tab Switching Bindings
    tabLight?.addEventListener('click', () => {
        switchTab('light');
    });

    tabDark?.addEventListener('click', () => {
        switchTab('dark');
    });

    function switchTab(mode) {
        if (mode === 'light') {
            panelLight?.classList.remove('hidden');
            panelDark?.classList.add('hidden');
            tabLight?.classList.remove('opacity-50', 'border-transparent');
            tabLight?.classList.add('font-bold', 'border-white');
            tabDark?.classList.add('opacity-50', 'border-transparent');
            tabDark?.classList.remove('font-bold', 'border-white');
        } else {
            panelDark?.classList.remove('hidden');
            panelLight?.classList.add('hidden');
            tabDark?.classList.remove('opacity-50', 'border-transparent');
            tabDark?.classList.add('font-bold', 'border-white');
            tabLight?.classList.add('opacity-50', 'border-transparent');
            tabLight?.classList.remove('font-bold', 'border-white');
        }
    }

    // Dynamic linear gradient background renderer
    function updatePageGradient() {
        const isDark = htmlEl.classList.contains('dark');
        
        // 1. Update Hero/Header Gradient
        if (gradientOverlay) {
            if (isDark) {
                if (pickerTopD && pickerMidD && pickerBottomD && sliderTopPosD && sliderMidPosD && sliderBottomPosD) {
                    const top = pickerTopD.value;
                    const mid = pickerMidD.value;
                    const bottom = pickerBottomD.value;
                    const topPos = sliderTopPosD.value;
                    const midPos = sliderMidPosD.value;
                    const bottomPos = sliderBottomPosD.value;
                    
                    if (valTopPosD) valTopPosD.textContent = topPos + '%';
                    if (valMidPosD) valMidPosD.textContent = midPos + '%';
                    if (valBottomPosD) valBottomPosD.textContent = bottomPos + '%';
                    
                    if (textTopD) textTopD.value = top.toUpperCase();
                    if (textMidD) textMidD.value = mid.toUpperCase();
                    if (textBottomD) textBottomD.value = bottom.toUpperCase();
                    
                    gradientOverlay.style.background = `linear-gradient(180deg, ${top} ${topPos}%, ${mid} ${midPos}%, ${bottom} ${bottomPos}%)`;
                }
            } else {
                if (pickerTopL && pickerMidL && pickerBottomL && sliderTopPosL && sliderMidPosL && sliderBottomPosL) {
                    const top = pickerTopL.value;
                    const mid = pickerMidL.value;
                    const bottom = pickerBottomL.value;
                    const topPos = sliderTopPosL.value;
                    const midPos = sliderMidPosL.value;
                    const bottomPos = sliderBottomPosL.value;
                    
                    if (valTopPosL) valTopPosL.textContent = topPos + '%';
                    if (valMidPosL) valMidPosL.textContent = midPos + '%';
                    if (valBottomPosL) valBottomPosL.textContent = bottomPos + '%';
                    
                    if (textTopL) textTopL.value = top.toUpperCase();
                    if (textMidL) textMidL.value = mid.toUpperCase();
                    if (textBottomL) textBottomL.value = bottom.toUpperCase();
                    
                    gradientOverlay.style.background = `linear-gradient(180deg, ${top} ${topPos}%, ${mid} ${midPos}%, ${bottom} ${bottomPos}%)`;
                }
            }
        }

        // 2. Update Footer Gradient
        if (footerEl) {
            const footerBgEl = footerEl.querySelector('.footer-bg') || footerEl;
            if (isDark) {
                if (pickerFootTopD && pickerFootMidD && pickerFootBottomD && sliderFootTopPosD && sliderFootMidPosD && sliderFootBottomPosD) {
                    const top = pickerFootTopD.value;
                    const mid = pickerFootMidD.value;
                    const bottom = pickerFootBottomD.value;
                    const topPos = sliderFootTopPosD.value;
                    const midPos = sliderFootMidPosD.value;
                    const bottomPos = sliderFootBottomPosD.value;

                    if (valFootTopPosD) valFootTopPosD.textContent = topPos + '%';
                    if (valFootMidPosD) valFootMidPosD.textContent = midPos + '%';
                    if (valFootBottomPosD) valFootBottomPosD.textContent = bottomPos + '%';

                    if (textFootTopD) textFootTopD.value = top.toUpperCase();
                    if (textFootMidD) textFootMidD.value = mid.toUpperCase();
                    if (textFootBottomD) textFootBottomD.value = bottom.toUpperCase();

                    footerBgEl.style.background = `linear-gradient(180deg, ${top} ${topPos}%, ${mid} ${midPos}%, ${bottom} ${bottomPos}%)`;
                }
            } else {
                if (pickerFootTopL && pickerFootMidL && pickerFootBottomL && sliderFootTopPosL && sliderFootMidPosL && sliderFootBottomPosL) {
                    const top = pickerFootTopL.value;
                    const mid = pickerFootMidL.value;
                    const bottom = pickerFootBottomL.value;
                    const topPos = sliderFootTopPosL.value;
                    const midPos = sliderFootMidPosL.value;
                    const bottomPos = sliderFootBottomPosL.value;

                    if (valFootTopPosL) valFootTopPosL.textContent = topPos + '%';
                    if (valFootMidPosL) valFootMidPosL.textContent = midPos + '%';
                    if (valFootBottomPosL) valFootBottomPosL.textContent = bottomPos + '%';

                    if (textFootTopL) textFootTopL.value = top.toUpperCase();
                    if (textFootMidL) textFootMidL.value = mid.toUpperCase();
                    if (textFootBottomL) textFootBottomL.value = bottom.toUpperCase();

                    footerBgEl.style.background = `linear-gradient(180deg, ${top} ${topPos}%, ${mid} ${midPos}%, ${bottom} ${bottomPos}%)`;
                }
            }
        }

        // 3. Update Watermark Color & Opacity
        if (watermarkText && pickerWatermark && sliderWatermarkOpacity) {
            const color = pickerWatermark.value;
            const opacity = sliderWatermarkOpacity.value / 100;
            if (valWatermarkOpacity) valWatermarkOpacity.textContent = sliderWatermarkOpacity.value + '%';
            if (textWatermark) textWatermark.value = color.toUpperCase();
            
            const rgb = hexToRgb(color);
            if (rgb) {
                watermarkText.style.color = `rgba(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)}, ${opacity})`;
            }
        }

        // 4. Update Header Responsive Contrast
        updateHeaderAppearance();
    }

    // Dynamic Header Text & Styling Adaptability based on background color luminance
    function updateHeaderAppearance() {
        const isDark = htmlEl.classList.contains('dark');
        const scrollY = window.scrollY;
        
        let topColor = "#021416";
        let bodyBgColor = "#ecf9fb";
        let footerTopColor = "#ecf9fb";
        
        if (isDark) {
            topColor = pickerTopD ? pickerTopD.value : "#ecf9fb";
            bodyBgColor = "#021416";
            footerTopColor = pickerFootTopD ? pickerFootTopD.value : "#021416";
        } else {
            topColor = pickerTopL ? pickerTopL.value : "#021416";
            bodyBgColor = "#ecf9fb";
            footerTopColor = pickerFootTopL ? pickerFootTopL.value : "#ecf9fb";
        }
        
        // Detect if the fixed header is currently overlapping/intersecting the footer
        const header = document.querySelector('header');
        let isOverlappingFooter = false;
        if (footerEl && header) {
            const footerRect = footerEl.getBoundingClientRect();
            const headerRect = header.getBoundingClientRect();
            if (footerRect.top <= headerRect.bottom) {
                isOverlappingFooter = true;
            }
        }
        
        // Resolve the color directly behind the header
        let currentColor = bodyBgColor;
        if (isOverlappingFooter) {
            currentColor = footerTopColor;
        } else if (scrollY <= 150) {
            currentColor = topColor;
        }
        
        const luminance = getLuminance(currentColor);
        
        // High luminance (light background) -> dark text; Low luminance (dark background) -> light text
        const navTextColor = luminance > 0.5 ? "#021416" : "#ECF9FB";
        document.documentElement.style.setProperty('--header-text', navTextColor);
    }

    // Bidirectional Color Picker and Text Input Binder
    function bindColorAndText(picker, textInput, onChangeCallback) {
        if (!picker || !textInput) return;

        // When picker changes, update text field
        picker.addEventListener('input', (e) => {
            textInput.value = e.target.value.toUpperCase();
            if (onChangeCallback) onChangeCallback(e.target.value);
        });

        // When user types or pastes hex color code
        textInput.addEventListener('input', (e) => {
            let val = e.target.value.trim();
            if (val && !val.startsWith('#')) {
                val = '#' + val;
            }
            if (/^#[0-9A-F]{6}$/i.test(val)) {
                picker.value = val;
                if (onChangeCallback) onChangeCallback(val);
            }
        });
    }

    // Bind Hero gradient inputs
    bindColorAndText(pickerTopL, textTopL, updatePageGradient);
    bindColorAndText(pickerMidL, textMidL, updatePageGradient);
    bindColorAndText(pickerBottomL, textBottomL, updatePageGradient);
    bindColorAndText(pickerTopD, textTopD, updatePageGradient);
    bindColorAndText(pickerMidD, textMidD, updatePageGradient);
    bindColorAndText(pickerBottomD, textBottomD, updatePageGradient);

    // Bind Footer gradient inputs
    bindColorAndText(pickerFootTopL, textFootTopL, updatePageGradient);
    bindColorAndText(pickerFootMidL, textFootMidL, updatePageGradient);
    bindColorAndText(pickerFootBottomL, textFootBottomL, updatePageGradient);
    bindColorAndText(pickerFootTopD, textFootTopD, updatePageGradient);
    bindColorAndText(pickerFootMidD, textFootMidD, updatePageGradient);
    bindColorAndText(pickerFootBottomD, textFootBottomD, updatePageGradient);

    // Bind Watermark inputs
    bindColorAndText(pickerWatermark, textWatermark, updatePageGradient);
    sliderWatermarkOpacity?.addEventListener('input', updatePageGradient);

    // Bind LaserFlow inputs
    const pickerLaserColor = document.getElementById('picker-laser-color');
    const textLaserColor = document.getElementById('text-laser-color');
    const sliderLaserOpacity = document.getElementById('slider-laser-opacity');
    const valLaserOpacity = document.getElementById('val-laser-opacity');
    const sliderLaserX = document.getElementById('slider-laser-x');
    const valLaserX = document.getElementById('val-laser-x');
    const sliderLaserY = document.getElementById('slider-laser-y');
    const valLaserY = document.getElementById('val-laser-y');
    const sliderLaserWidth = document.getElementById('slider-laser-width');
    const valLaserWidth = document.getElementById('val-laser-width');
    const sliderLaserHeight = document.getElementById('slider-laser-height');
    const valLaserHeight = document.getElementById('val-laser-height');
    const sliderLaserSpeed = document.getElementById('slider-laser-speed');
    const valLaserSpeed = document.getElementById('val-laser-speed');

    function updateLaserFlowSettings() {
        if (!window.laserConfig) return;
        if (pickerLaserColor) window.laserConfig.color = pickerLaserColor.value;
        if (sliderLaserOpacity) {
            const val = parseInt(sliderLaserOpacity.value);
            window.laserConfig.opacity = val;
            if (valLaserOpacity) valLaserOpacity.textContent = val + '%';
        }
        if (sliderLaserX) {
            const val = parseFloat(sliderLaserX.value);
            window.laserConfig.beamX = val;
            if (valLaserX) valLaserX.textContent = val;
        }
        if (sliderLaserY) {
            const val = parseFloat(sliderLaserY.value);
            window.laserConfig.beamY = val;
            if (valLaserY) valLaserY.textContent = val;
        }
        if (sliderLaserWidth) {
            const val = parseFloat(sliderLaserWidth.value);
            window.laserConfig.hSizing = val;
            if (valLaserWidth) valLaserWidth.textContent = val;
        }
        if (sliderLaserHeight) {
            const val = parseFloat(sliderLaserHeight.value);
            window.laserConfig.vSizing = val;
            if (valLaserHeight) valLaserHeight.textContent = val;
        }
        if (sliderLaserSpeed) {
            const val = parseFloat(sliderLaserSpeed.value);
            window.laserConfig.flowSpeed = val;
            if (valLaserSpeed) valLaserSpeed.textContent = val;
        }
    }

    bindColorAndText(pickerLaserColor, textLaserColor, (val) => {
        if (window.laserConfig) window.laserConfig.color = val;
    });

    [sliderLaserOpacity, sliderLaserX, sliderLaserY, sliderLaserWidth, sliderLaserHeight, sliderLaserSpeed].forEach(el => {
        el?.addEventListener('input', updateLaserFlowSettings);
    });

    // Initialize LaserFlow customizer displays
    updateLaserFlowSettings();

    // Initial page load gradient sync
    updatePageGradient();

    // Register position listeners for Light theme controls
    [sliderTopPosL, sliderMidPosL, sliderBottomPosL, sliderFootTopPosL, sliderFootMidPosL, sliderFootBottomPosL].forEach(el => {
        el?.addEventListener('input', updatePageGradient);
    });

    // Register position listeners for Dark theme controls
    [sliderTopPosD, sliderMidPosD, sliderBottomPosD, sliderFootTopPosD, sliderFootMidPosD, sliderFootBottomPosD].forEach(el => {
        el?.addEventListener('input', updatePageGradient);
    });

    // Global Theme Toggle
    themeBtn?.addEventListener('click', () => {
        if (htmlEl.classList.contains('light')) {
            htmlEl.classList.remove('light');
            htmlEl.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            switchTab('dark');
        } else {
            htmlEl.classList.remove('dark');
            htmlEl.classList.add('light');
            localStorage.setItem('theme', 'light');
            switchTab('light');
        }
        updatePageGradient();
    });

    // Customizer Drawer Show / Hide (Slide-out panel)
    const gradToggle = document.getElementById('gradient-panel-toggle');
    const customizerDrawer = document.getElementById('customizer-drawer');
    const btnCloseDrawer = document.getElementById('btn-close-drawer');

    gradToggle?.addEventListener('click', () => {
        customizerDrawer?.classList.remove('translate-x-full');
        gradToggle.classList.add('opacity-100');
    });

    btnCloseDrawer?.addEventListener('click', () => {
        customizerDrawer?.classList.add('translate-x-full');
        gradToggle?.classList.remove('opacity-100');
    });

    // Helper: Hex color to normalized RGB converter
    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255
        } : null;
    }

    // Helper: Calculate luminance to support responsive contrast calculations
    function getLuminance(hex) {
        const rgb = hexToRgb(hex);
        if (!rgb) return 0;
        return 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    }

    // Bind WebGL Fluid Engine Real-time controls
    const canvasEl = document.getElementById('fluid-canvas');

    const sliderOpacity = document.getElementById('slider-opacity');
    const valOpacity = document.getElementById('val-opacity');
    sliderOpacity?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (valOpacity) valOpacity.textContent = val;
        if (window.fluidConfig) window.fluidConfig.INK_OPACITY = val;
    });

    const sliderRadius = document.getElementById('slider-radius');
    const valRadius = document.getElementById('val-radius');
    sliderRadius?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (valRadius) valRadius.textContent = val;
        if (window.fluidConfig) window.fluidConfig.SPLAT_RADIUS = val;
    });

    const sliderVorticity = document.getElementById('slider-vorticity');
    const valVorticity = document.getElementById('val-vorticity');
    sliderVorticity?.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (valVorticity) valVorticity.textContent = val;
        if (window.fluidConfig) window.fluidConfig.CURL = val;
    });

    const sliderForce = document.getElementById('slider-force');
    const valForce = document.getElementById('val-force');
    sliderForce?.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (valForce) valForce.textContent = val;
        if (window.fluidConfig) window.fluidConfig.SPLAT_FORCE = val;
    });

    const sliderDissipation = document.getElementById('slider-dissipation');
    const valDissipation = document.getElementById('val-dissipation');
    sliderDissipation?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (valDissipation) valDissipation.textContent = val;
        if (window.fluidConfig) window.fluidConfig.DENSITY_DISSIPATION = val;
    });

    const sliderVelDissipation = document.getElementById('slider-velocity-dissipation');
    const valVelDissipation = document.getElementById('val-velocity-dissipation');
    sliderVelDissipation?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (valVelDissipation) valVelDissipation.textContent = val;
        if (window.fluidConfig) window.fluidConfig.VELOCITY_DISSIPATION = val;
    });

    const sliderPressure = document.getElementById('slider-pressure');
    const valPressure = document.getElementById('val-pressure');
    sliderPressure?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (valPressure) valPressure.textContent = val;
        if (window.fluidConfig) window.fluidConfig.PRESSURE = val;
    });

    const sliderIterations = document.getElementById('slider-iterations');
    const valIterations = document.getElementById('val-iterations');
    sliderIterations?.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (valIterations) valIterations.textContent = val;
        if (window.fluidConfig) window.fluidConfig.PRESSURE_ITERATIONS = val;
    });

    const pickerSplatColor = document.getElementById('picker-splat-color');
    const textSplatColor = document.getElementById('text-splat-color');
    bindColorAndText(pickerSplatColor, textSplatColor, (val) => {
        const rgb = hexToRgb(val);
        if (rgb && window.fluidConfig) window.fluidConfig.SPLAT_COLOR = rgb;
    });

    const selectSimRes = document.getElementById('select-sim-res');
    selectSimRes?.addEventListener('change', (e) => {
        if (window.fluidConfig) {
            window.fluidConfig.SIM_RESOLUTION = parseInt(e.target.value);
            if (window.reinitFluidFramebuffers) window.reinitFluidFramebuffers();
        }
    });

    const selectDyeRes = document.getElementById('select-dye-res');
    selectDyeRes?.addEventListener('change', (e) => {
        if (window.fluidConfig) {
            window.fluidConfig.DYE_RESOLUTION = parseInt(e.target.value);
            if (window.reinitFluidFramebuffers) window.reinitFluidFramebuffers();
        }
    });

    // WebGL Rendering Checkboxes
    const checkShading = document.getElementById('check-shading');
    checkShading?.addEventListener('change', (e) => {
        if (window.fluidConfig) window.fluidConfig.SHADING = e.target.checked;
    });

    const checkPaused = document.getElementById('check-paused');
    checkPaused?.addEventListener('change', (e) => {
        if (window.fluidConfig) window.fluidConfig.PAUSED = e.target.checked;
    });

    const checkInvertCore = document.getElementById('check-invert-core');
    const rowCoreThreshold = document.getElementById('row-core-threshold');
    const rowCoreColor = document.getElementById('row-core-color');
    checkInvertCore?.addEventListener('change', (e) => {
        const active = e.target.checked;
        if (window.fluidConfig) window.fluidConfig.INVERT_CORE = active;
        if (active) {
            rowCoreThreshold?.classList.remove('hidden');
            rowCoreColor?.classList.remove('hidden');
        } else {
            rowCoreThreshold?.classList.add('hidden');
            rowCoreColor?.classList.add('hidden');
        }
    });

    const pickerCoreColor = document.getElementById('picker-core-color');
    const textCoreColor = document.getElementById('text-core-color');
    bindColorAndText(pickerCoreColor, textCoreColor, (val) => {
        const rgb = hexToRgb(val);
        if (rgb && window.fluidConfig) window.fluidConfig.CORE_COLOR = rgb;
    });

    const sliderCoreThreshold = document.getElementById('slider-core-threshold');
    const valCoreThreshold = document.getElementById('val-core-threshold');
    sliderCoreThreshold?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (valCoreThreshold) valCoreThreshold.textContent = val;
        if (window.fluidConfig) window.fluidConfig.CORE_THRESHOLD = val;
    });

    // Canvas CSS Overrides
    const selectBlendMode = document.getElementById('select-blend-mode');
    selectBlendMode?.addEventListener('change', (e) => {
        if (canvasEl) canvasEl.style.mixBlendMode = e.target.value;
    });

    const sliderBlur = document.getElementById('slider-blur');
    const valBlur = document.getElementById('val-blur');
    sliderBlur?.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (valBlur) valBlur.textContent = val + 'px';
        if (canvasEl) canvasEl.style.filter = `blur(${val}px)`;
    });

    const sliderOpacityCss = document.getElementById('slider-opacity-css');
    const valOpacityCss = document.getElementById('val-opacity-css');
    sliderOpacityCss?.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (valOpacityCss) valOpacityCss.textContent = val;
        if (canvasEl) canvasEl.style.opacity = val;
    });

    // Footer buttons
    const btnSplats = document.getElementById('btn-splats');
    btnSplats?.addEventListener('click', () => {
        if (window.triggerManualSplats) {
            window.triggerManualSplats(Math.floor(Math.random() * 5) + 5);
        }
    });

    const btnReset = document.getElementById('btn-reset');
    btnReset?.addEventListener('click', () => {
        // Reset Gradient controls
        if (pickerTopL) pickerTopL.value = "#021416";
        if (pickerMidL) pickerMidL.value = "#327882";
        if (pickerBottomL) pickerBottomL.value = "#ecf9fb";
        if (sliderTopPosL) sliderTopPosL.value = 10;
        if (sliderMidPosL) sliderMidPosL.value = 50;
        if (sliderBottomPosL) sliderBottomPosL.value = 90;

        if (pickerTopD) pickerTopD.value = "#ecf9fb";
        if (pickerMidD) pickerMidD.value = "#327882";
        if (pickerBottomD) pickerBottomD.value = "#021416";
        if (sliderTopPosD) sliderTopPosD.value = 10;
        if (sliderMidPosD) sliderMidPosD.value = 51;
        if (sliderBottomPosD) sliderBottomPosD.value = 90;

        // Reset Footer Gradient controls
        if (pickerFootTopL) pickerFootTopL.value = "#ecf9fb";
        if (pickerFootMidL) pickerFootMidL.value = "#327882";
        if (pickerFootBottomL) pickerFootBottomL.value = "#021416";
        if (sliderFootTopPosL) sliderFootTopPosL.value = 30;
        if (sliderFootMidPosL) sliderFootMidPosL.value = 70;
        if (sliderFootBottomPosL) sliderFootBottomPosL.value = 100;

        if (pickerFootTopD) pickerFootTopD.value = "#021416";
        if (pickerFootMidD) pickerFootMidD.value = "#327882";
        if (pickerFootBottomD) pickerFootBottomD.value = "#ecf9fb";
        if (sliderFootTopPosD) sliderFootTopPosD.value = 30;
        if (sliderFootMidPosD) sliderFootMidPosD.value = 70;
        if (sliderFootBottomPosD) sliderFootBottomPosD.value = 100;

        // Reset Watermark
        if (pickerWatermark) pickerWatermark.value = "#021416";
        if (sliderWatermarkOpacity) sliderWatermarkOpacity.value = 80;

        // Reset Fluid dynamics controls
        if (pickerSplatColor) {
            pickerSplatColor.value = "#051414";
            if (textSplatColor) textSplatColor.value = "#051414";
        }
        if (sliderOpacity) { sliderOpacity.value = 45; if (valOpacity) valOpacity.textContent = 45; }
        if (sliderRadius) { sliderRadius.value = 0.2; if (valRadius) valRadius.textContent = 0.2; }
        if (sliderVorticity) { sliderVorticity.value = 12; if (valVorticity) valVorticity.textContent = 12; }
        if (sliderForce) { sliderForce.value = 8500; if (valForce) valForce.textContent = 8500; }
        if (sliderDissipation) { sliderDissipation.value = 0.97; if (valDissipation) valDissipation.textContent = 0.97; }
        if (sliderVelDissipation) { sliderVelDissipation.value = 0.97; if (valVelDissipation) valVelDissipation.textContent = 0.97; }
        if (sliderPressure) { sliderPressure.value = 0.7; if (valPressure) valPressure.textContent = 0.7; }
        if (sliderIterations) { sliderIterations.value = 20; if (valIterations) valIterations.textContent = 20; }
        if (selectSimRes) selectSimRes.value = "256";
        if (selectDyeRes) selectDyeRes.value = "2048";

        // Reset WebGL check boxes
        if (checkShading) checkShading.checked = false;
        if (checkPaused) checkPaused.checked = false;
        if (checkInvertCore) {
            checkInvertCore.checked = true;
            rowCoreThreshold?.classList.remove('hidden');
            rowCoreColor?.classList.remove('hidden');
        }
        if (pickerCoreColor) {
            pickerCoreColor.value = "#0c393f";
            if (textCoreColor) textCoreColor.value = "#0C393F";
        }
        if (sliderCoreThreshold) { sliderCoreThreshold.value = 0.1; if (valCoreThreshold) valCoreThreshold.textContent = "0.1"; }

        // Reset Canvas overrides
        if (selectBlendMode) selectBlendMode.value = "normal";
        if (sliderBlur) { sliderBlur.value = 1; if (valBlur) valBlur.textContent = "1px"; }
        if (sliderOpacityCss) { sliderOpacityCss.value = 0.9; if (valOpacityCss) valOpacityCss.textContent = "0.9"; }

        // Reset LaserFlow settings
        if (pickerLaserColor) pickerLaserColor.value = "#327882";
        if (textLaserColor) textLaserColor.value = "#327882";
        if (sliderLaserOpacity) sliderLaserOpacity.value = 100;
        if (sliderLaserX) sliderLaserX.value = 0.07;
        if (sliderLaserY) sliderLaserY.value = 0.02;
        if (sliderLaserWidth) sliderLaserWidth.value = 1.6;
        if (sliderLaserHeight) sliderLaserHeight.value = 1.5;
        if (sliderLaserSpeed) sliderLaserSpeed.value = 0.95;
        updateLaserFlowSettings();

        if (canvasEl) {
            canvasEl.style.mixBlendMode = "normal";
            canvasEl.style.filter = "blur(1px)";
            canvasEl.style.opacity = 0.9;
        }

        updatePageGradient();

        if (window.fluidConfig) {
            window.fluidConfig.INK_OPACITY = 45;
            window.fluidConfig.DENSITY_DISSIPATION = 0.97;
            window.fluidConfig.SPLAT_RADIUS = 0.2;
            window.fluidConfig.CURL = 12;
            window.fluidConfig.SPLAT_FORCE = 8500;
            window.fluidConfig.VELOCITY_DISSIPATION = 0.97;
            window.fluidConfig.PRESSURE = 0.7;
            window.fluidConfig.PRESSURE_ITERATIONS = 20;
            window.fluidConfig.SIM_RESOLUTION = 256;
            window.fluidConfig.DYE_RESOLUTION = 2048;
            window.fluidConfig.SHADING = false;
            window.fluidConfig.PAUSED = false;
            window.fluidConfig.INVERT_CORE = true;
            window.fluidConfig.CORE_THRESHOLD = 0.1;
            window.fluidConfig.CORE_COLOR = { r: 0.0470588, g: 0.223529, b: 0.2470588 };
            window.fluidConfig.SPLAT_COLOR = { r: 0.0196078, g: 0.0784313, b: 0.0784313 };
            if (window.reinitFluidFramebuffers) window.reinitFluidFramebuffers();
        }
    });

    // Copy Unified Settings configurations as JSON
    const btnCopyGradient = document.getElementById('btn-copy-gradient');
    btnCopyGradient?.addEventListener('click', () => {
        if (!pickerTopL || !pickerMidL || !pickerBottomL || !sliderTopPosL || !sliderMidPosL || !sliderBottomPosL) return;
        if (!pickerTopD || !pickerMidD || !pickerBottomD || !sliderTopPosD || !sliderMidPosD || !sliderBottomPosD) return;

        // Convert current splat color to rgb hex
        let splatHex = pickerSplatColor ? pickerSplatColor.value : "#071214";
        let splatRgb = hexToRgb(splatHex);

        const configSnapshot = {
            SIM_RESOLUTION: window.fluidConfig ? window.fluidConfig.SIM_RESOLUTION : 256,
            DYE_RESOLUTION: window.fluidConfig ? window.fluidConfig.DYE_RESOLUTION : 2048,
            DENSITY_DISSIPATION: window.fluidConfig ? window.fluidConfig.DENSITY_DISSIPATION : 0.97,
            VELOCITY_DISSIPATION: window.fluidConfig ? window.fluidConfig.VELOCITY_DISSIPATION : 0.97,
            PRESSURE: window.fluidConfig ? window.fluidConfig.PRESSURE : 0.7,
            PRESSURE_ITERATIONS: window.fluidConfig ? window.fluidConfig.PRESSURE_ITERATIONS : 20,
            CURL: window.fluidConfig ? window.fluidConfig.CURL : 12,
            SPLAT_RADIUS: window.fluidConfig ? window.fluidConfig.SPLAT_RADIUS : 0.2,
            SPLAT_FORCE: window.fluidConfig ? window.fluidConfig.SPLAT_FORCE : 8500,
            SHADING: window.fluidConfig ? window.fluidConfig.SHADING : false,
            PAUSED: window.fluidConfig ? window.fluidConfig.PAUSED : false,
            INK_OPACITY: window.fluidConfig ? window.fluidConfig.INK_OPACITY : 45,
            INVERT_CORE: window.fluidConfig ? window.fluidConfig.INVERT_CORE : false,
            CORE_THRESHOLD: window.fluidConfig ? window.fluidConfig.CORE_THRESHOLD : 0.6,
            CORE_COLOR: window.fluidConfig ? window.fluidConfig.CORE_COLOR : { r: 0.015, g: 0.003, b: 0.003 },
            SPLAT_COLOR: splatRgb,
            BACKGROUND_GRADIENT: {
                light: {
                    BG_TOP_COLOR: pickerTopL.value,
                    BG_TOP_POSITION: parseInt(sliderTopPosL.value),
                    BG_MID_COLOR: pickerMidL.value,
                    BG_MID_POSITION: parseInt(sliderMidPosL.value),
                    BG_BOTTOM_COLOR: pickerBottomL.value,
                    BG_BOTTOM_POSITION: parseInt(sliderBottomPosL.value)
                },
                dark: {
                    BG_TOP_COLOR: pickerTopD.value,
                    BG_TOP_POSITION: parseInt(sliderTopPosD.value),
                    BG_MID_COLOR: pickerMidD.value,
                    BG_MID_POSITION: parseInt(sliderMidPosD.value),
                    BG_BOTTOM_COLOR: pickerBottomD.value,
                    BG_BOTTOM_POSITION: parseInt(sliderBottomPosD.value)
                }
            },
            FOOTER_GRADIENT: {
                light: {
                    BG_TOP_COLOR: pickerFootTopL ? pickerFootTopL.value : "#021416",
                    BG_TOP_POSITION: sliderFootTopPosL ? parseInt(sliderFootTopPosL.value) : 10,
                    BG_MID_COLOR: pickerFootMidL ? pickerFootMidL.value : "#327882",
                    BG_MID_POSITION: sliderFootMidPosL ? parseInt(sliderFootMidPosL.value) : 50,
                    BG_BOTTOM_COLOR: pickerFootBottomL ? pickerFootBottomL.value : "#ecf9fb",
                    BG_BOTTOM_POSITION: sliderFootBottomPosL ? parseInt(sliderFootBottomPosL.value) : 90
                },
                dark: {
                    BG_TOP_COLOR: pickerFootTopD ? pickerFootTopD.value : "#ecf9fb",
                    BG_TOP_POSITION: sliderFootTopPosD ? parseInt(sliderFootTopPosD.value) : 10,
                    BG_MID_COLOR: pickerFootMidD ? pickerFootMidD.value : "#327882",
                    BG_MID_POSITION: sliderFootMidPosD ? parseInt(sliderFootMidPosD.value) : 51,
                    BG_BOTTOM_COLOR: pickerFootBottomD ? pickerFootBottomD.value : "#021416",
                    BG_BOTTOM_POSITION: sliderFootBottomPosD ? parseInt(sliderFootBottomPosD.value) : 90
                }
            },
            WATERMARK_COLOR: pickerWatermark ? pickerWatermark.value : "#327882",
            WATERMARK_OPACITY: sliderWatermarkOpacity ? parseInt(sliderWatermarkOpacity.value) : 15,
            LASERFLOW: {
                color: pickerLaserColor ? pickerLaserColor.value : "#327882",
                opacity: sliderLaserOpacity ? parseInt(sliderLaserOpacity.value) : 80,
                beamX: sliderLaserX ? parseFloat(sliderLaserX.value) : 0.1,
                beamY: sliderLaserY ? parseFloat(sliderLaserY.value) : 0.0,
                widthScale: sliderLaserWidth ? parseFloat(sliderLaserWidth.value) : 0.5,
                heightScale: sliderLaserHeight ? parseFloat(sliderLaserHeight.value) : 2.0,
                flowSpeed: sliderLaserSpeed ? parseFloat(sliderLaserSpeed.value) : 0.35
            },
            CSS_BLEND_MODE: selectBlendMode ? selectBlendMode.value : "normal",
            CSS_BLUR: sliderBlur ? sliderBlur.value + "px" : "1px",
            CSS_OPACITY: sliderOpacityCss ? sliderOpacityCss.value : "0.9"
        };

        navigator.clipboard.writeText(JSON.stringify(configSnapshot, null, 2))
            .then(() => {
                const originalText = btnCopyGradient.textContent;
                btnCopyGradient.textContent = "Copied! ✓";
                btnCopyGradient.classList.remove('bg-emerald-600/30', 'border-emerald-500/30');
                btnCopyGradient.classList.add('bg-emerald-500/80', 'text-black');
                
                setTimeout(() => {
                    btnCopyGradient.textContent = originalText;
                    btnCopyGradient.classList.add('bg-emerald-600/30', 'border-emerald-500/30');
                    btnCopyGradient.classList.remove('bg-emerald-500/80', 'text-black');
                }, 1500);
            })
            .catch(err => {
                console.error("Failed to copy master configurations: ", err);
            });
    });

    // 2. Textarea Auto-Resize & Interactivity
    const promptTextarea = document.getElementById('prompt-input');
    if (promptTextarea) {
        promptTextarea.addEventListener('input', () => {
            promptTextarea.style.height = 'auto';
            promptTextarea.style.height = Math.min(promptTextarea.scrollHeight, 180) + 'px';
        });

        // Submit prompt on Enter key (without Shift)
        promptTextarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitPrompt();
            }
        });
    }

    const sendBtn = document.getElementById('send-prompt-btn');
    sendBtn?.addEventListener('click', submitPrompt);

    function submitPrompt() {
        if (!promptTextarea || !promptTextarea.value.trim()) return;
        const query = promptTextarea.value.trim();
        
        // Show interactive feedback
        const card = document.querySelector('.prompt-card');
        card.style.transform = 'scale(0.99)';
        setTimeout(() => {
            card.style.transform = 'none';
        }, 150);

        promptTextarea.value = '';
        promptTextarea.placeholder = `Generating design for "${query.slice(0, 30)}..."`;
        
        setTimeout(() => {
            promptTextarea.placeholder = 'Ask Kraft anything...';
        }, 3000);
    }

    // 3. Toolbar Mode Buttons Toggle (Reasoning, Design, Wireframe)
    const modeButtons = document.querySelectorAll('.mode-btn');
    modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('bg-white');
            btn.classList.toggle('bg-accent/20');
            btn.classList.toggle('text-white');
        });
    });

    // 4. FAQ Accordion Toggle
    const faqItems = document.querySelectorAll('.accordion-item');
    faqItems.forEach(item => {
        const header = item.querySelector('.accordion-header');
        header?.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            faqItems.forEach(i => i.classList.remove('active'));
            if (!isOpen) {
                item.classList.add('active');
            }
        });
    });

    // 5. Scroll Reveal Animations Observer
    const revealElements = document.querySelectorAll('.reveal-item');
    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => revealObserver.observe(el));

    // 6. Waitlist Form Submission
    const waitlistForm = document.getElementById('waitlist-form');
    waitlistForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = waitlistForm.querySelector('input[type="email"]');
        const submitBtn = waitlistForm.querySelector('button[type="submit"]');
        if (input && input.value) {
            submitBtn.textContent = '✓ Joined Waitlist';
            submitBtn.classList.add('bg-green-600', 'text-white');
            input.value = '';
            setTimeout(() => {
                submitBtn.textContent = 'Join waitlist';
                submitBtn.classList.remove('bg-green-600', 'text-white');
            }, 3500);
        }
    });

    // 7. Gooey Navigation Logic
    const gooeyNavWrapper = document.getElementById('gooey-nav-wrapper');
    const gooeyNavList = document.getElementById('gooey-nav-list');
    const gooeyFilter = document.getElementById('gooey-effect-filter');
    const gooeyText = document.getElementById('gooey-effect-text');

    if (gooeyNavWrapper && gooeyNavList && gooeyFilter && gooeyText) {
        const lis = gooeyNavList.querySelectorAll('li');
        let activeIndex = 0;

        const noise = (n = 1) => n / 2 - Math.random() * n;

        const getXY = (distance, pointIndex, totalPoints) => {
            const angle = ((360 + noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
            return [distance * Math.cos(angle), distance * Math.sin(angle)];
        };

        const createParticle = (i, t, d, r) => {
            let rotate = noise(r / 10);
            const colors = [1, 2, 3, 1, 2, 3, 1, 4];
            return {
                start: getXY(d[0], 15 - i, 15),
                end: getXY(d[1] + noise(7), 15 - i, 15),
                time: t,
                scale: 1 + noise(0.2),
                color: colors[Math.floor(Math.random() * colors.length)],
                rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
            };
        };

        const makeParticles = element => {
            const d = [90, 10];
            const r = 100;
            const bubbleTime = 600 * 2 + 300;
            element.style.setProperty('--time', `${bubbleTime}ms`);

            for (let i = 0; i < 15; i++) {
                const t = 600 * 2 + noise(300 * 2);
                const p = createParticle(i, t, d, r);
                element.classList.remove('active');

                setTimeout(() => {
                    const particle = document.createElement('span');
                    const point = document.createElement('span');
                    particle.classList.add('particle');
                    particle.style.setProperty('--start-x', `${p.start[0]}px`);
                    particle.style.setProperty('--start-y', `${p.start[1]}px`);
                    particle.style.setProperty('--end-x', `${p.end[0]}px`);
                    particle.style.setProperty('--end-y', `${p.end[1]}px`);
                    particle.style.setProperty('--time', `${p.time}ms`);
                    particle.style.setProperty('--scale', `${p.scale}`);
                    particle.style.setProperty('--color', `var(--color-${p.color}, white)`);
                    particle.style.setProperty('--rotate', `${p.rotate}deg`);

                    point.classList.add('point');
                    particle.appendChild(point);
                    element.appendChild(particle);
                    requestAnimationFrame(() => {
                        element.classList.add('active');
                    });
                    setTimeout(() => {
                        try {
                            element.removeChild(particle);
                        } catch (e) {}
                    }, t);
                }, 30);
            }
        };

        const updateEffectPosition = element => {
            const containerRect = gooeyNavWrapper.getBoundingClientRect();
            const pos = element.getBoundingClientRect();

            const styles = {
                left: `${pos.x - containerRect.x}px`,
                top: `${pos.y - containerRect.y}px`,
                width: `${pos.width}px`,
                height: `${pos.height}px`
            };
            Object.assign(gooeyFilter.style, styles);
            Object.assign(gooeyText.style, styles);
            gooeyText.innerText = element.innerText;
        };

        lis.forEach((li, index) => {
            const a = li.querySelector('a');
            
            a?.addEventListener('click', (e) => {
                if (activeIndex === index) return;
                
                lis[activeIndex].classList.remove('active');
                activeIndex = index;
                li.classList.add('active');

                updateEffectPosition(li);

                const oldParticles = gooeyFilter.querySelectorAll('.particle');
                oldParticles.forEach(p => {
                    try { gooeyFilter.removeChild(p); } catch(err){}
                });

                gooeyText.classList.remove('active');
                void gooeyText.offsetWidth; // trigger reflow
                gooeyText.classList.add('active');

                makeParticles(gooeyFilter);
            });
        });

        // Initialize active position after a slight delay to allow rendering layout
        setTimeout(() => {
            const activeLi = lis[activeIndex];
            if (activeLi) {
                updateEffectPosition(activeLi);
                gooeyText.classList.add('active');
            }
        }, 150);

        // Resize syncing
        window.addEventListener('resize', () => {
            const currentActiveLi = lis[activeIndex];
            if (currentActiveLi) {
                updateEffectPosition(currentActiveLi);
            }
        });
    }

    // 8. SpotlightCard Mouse Move Tracker (Ask Anything Section)
    const promptCard = document.querySelector('.prompt-card');
    if (promptCard) {
        promptCard.addEventListener('mousemove', (e) => {
            const rect = promptCard.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            promptCard.style.setProperty('--mouse-x', `${x}px`);
            promptCard.style.setProperty('--mouse-y', `${y}px`);
            promptCard.style.setProperty('--spotlight-opacity', '1');
        });
        promptCard.addEventListener('mouseleave', () => {
            promptCard.style.setProperty('--spotlight-opacity', '0');
        });
    }

    // Business Selector AnimatedList Modal Logic
    const btnSelectBusiness = document.getElementById('btn-select-business');
    const modalBusiness = document.getElementById('modal-business');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnConfirmBusiness = document.getElementById('btn-confirm-business');
    const businessListContainer = document.getElementById('business-list');
    const promptInput = document.getElementById('prompt-input');

    const businessList = [
        "Agri inputs",
        "Apparel",
        "Auto parts",
        "Bakery",
        "Bookstore & Stationery",
        "Building materials",
        "Café",
        "Caterer",
        "Cloud kitchen",
        "Computers & Mobile Accessories",
        "Cosmetics",
        "Distribution",
        "Electronics",
        "Furniture",
        "General store",
        "Grocery & Supermarket",
        "Hardware",
        "Jewellery",
        "Juice bar",
        "Optical",
        "Paint",
        "Pet shop",
        "Pharmacy",
        "Restaurant",
        "Service-based business",
        "Sports goods",
        "Sweet shop",
        "Toys",
        "Tyre shop",
        "Van/route sales",
        "Wholesale",
        "Custom"
    ];

    let animatedListInstance = null;
    let selectedBusiness = businessList[6]; // Defaults to Café

    if (btnSelectBusiness && modalBusiness) {
        // Initialize AnimatedList inside modal
        if (businessListContainer && window.AnimatedList) {
            animatedListInstance = new AnimatedList(businessListContainer, {
                items: businessList,
                initialSelectedIndex: 6,
                onItemSelect: (item) => {
                    selectedBusiness = item;
                }
            });
        }

        // Open Modal
        btnSelectBusiness.addEventListener('click', () => {
            modalBusiness.classList.remove('opacity-0', 'pointer-events-none');
            modalBusiness.classList.add('opacity-100');
        });

        // Close Modal Helper
        const closeModal = () => {
            modalBusiness.classList.add('opacity-0', 'pointer-events-none');
            modalBusiness.classList.remove('opacity-100');
        };

        btnCloseModal?.addEventListener('click', closeModal);

        // Click outside container to close modal
        modalBusiness.addEventListener('click', (e) => {
            if (e.target === modalBusiness) {
                closeModal();
            }
        });

        // Confirm Selection
        btnConfirmBusiness?.addEventListener('click', () => {
            if (promptInput) {
                if (selectedBusiness === "Custom") {
                    promptInput.value = "I want to design a layout for my custom business: ";
                    promptInput.focus();
                } else {
                    promptInput.value = `I want to design a creative website layout for my ${selectedBusiness} business.`;
                }
                promptInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
            closeModal();
        });
    }

    // 8.5 ShinyText Placeholder & FoldText Logic
    const shinyPlaceholder = document.getElementById('shiny-placeholder');
    if (promptInput && shinyPlaceholder) {
        const togglePlaceholder = () => {
            if (promptInput.value.length > 0) {
                shinyPlaceholder.style.opacity = '0';
            } else {
                shinyPlaceholder.style.opacity = '1';
            }
        };
        promptInput.addEventListener('input', togglePlaceholder);
        shinyPlaceholder.addEventListener('click', () => promptInput.focus());
        togglePlaceholder();
    }

    const applyFoldText = (selector) => {
        const containers = document.querySelectorAll(selector);
        containers.forEach(container => {
            const textNodes = [];
            const walk = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
            let n;
            while (n = walk.nextNode()) textNodes.push(n);

            let charIndex = 0;
            textNodes.forEach(textNode => {
                const text = textNode.textContent;
                // If the node is just whitespace, keep it intact
                if (!text.trim() && text.length > 0) return;

                const fragment = document.createDocumentFragment();
                const words = text.split(/(\s+)/); // Keep whitespace chunks separate
                
                words.forEach(word => {
                    if (/^\s+$/.test(word)) {
                        fragment.appendChild(document.createTextNode(word));
                    } else {
                        // Wrap word to prevent characters wrapping to next line individually
                        const wordSpan = document.createElement('span');
                        wordSpan.className = 'inline-block whitespace-nowrap';
                        
                        for (let i = 0; i < word.length; i++) {
                            const char = word[i];
                            const span = document.createElement('span');
                            span.textContent = char;
                            span.className = 'fold-text-piece inline-block';
                            span.style.animationDelay = `${charIndex * 0.045}s`;
                            wordSpan.appendChild(span);
                            charIndex++;
                        }
                        fragment.appendChild(wordSpan);
                    }
                });
                textNode.parentNode.replaceChild(fragment, textNode);
            });
            container.style.perspective = '700px';
        });
    };
    
    applyFoldText('.fold-text-container');

    // 9. Window scroll listener for responsive header appearance
    window.addEventListener('scroll', updateHeaderAppearance);

    // Initial check on load
    updateHeaderAppearance();
});
