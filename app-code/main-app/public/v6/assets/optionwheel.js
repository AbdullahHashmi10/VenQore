// OptionWheel Vanilla 3D Scrolling Selection Component
// Ported from reactbits.dev UI OptionWheel component

class OptionWheel {
    constructor(container, options = {}) {
        this.container = container;
        this.items = options.items || [];
        this.defaultSelected = options.defaultSelected || 0;
        this.onChange = options.onChange || null;
        this.fontSize = options.fontSize || 28; // in px
        this.spacing = options.spacing || 1.6;
        this.curve = options.curve || 1.2;
        this.tilt = options.tilt || 14; // Angle of bend
        this.fade = options.fade || 0.28;
        this.minOpacity = options.minOpacity || 0.05;
        this.smoothing = options.smoothing || 140; // exponential smoothing ms
        
        this.pos = this.defaultSelected;
        this.target = this.defaultSelected;
        this.isDragging = false;
        this.dragStartPos = 0;
        this.dragStartTarget = 0;
        this.velocity = 0;
        this.lastTime = 0;
        this.lastPos = 0;
        this.selectedIndex = this.defaultSelected;
        
        this.initDOM();
        this.bindEvents();
        this.startLoop();
    }
    
    initDOM() {
        this.container.classList.add('option-wheel');
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.height = '100%';
        this.container.style.overflow = 'hidden';
        this.container.style.cursor = 'grab';
        this.container.style.userSelect = 'none';
        this.container.style.touchAction = 'none';
        this.container.style.perspective = '1000px';
        this.container.style.transformStyle = 'preserve-3d';
        
        // Add absolute central highlight bar inside the container for premium UI feel
        const highlight = document.createElement('div');
        highlight.className = 'absolute left-0 right-0 h-14 border-y border-white/10 bg-white/5 pointer-events-none -translate-y-1/2';
        highlight.style.top = '50%';
        this.container.appendChild(highlight);
        
        this.itemElements = [];
        this.items.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'option-wheel-item absolute text-center w-full select-none cursor-pointer transition-colors duration-150';
            el.style.fontSize = `${this.fontSize}px`;
            el.style.fontWeight = '300';
            el.style.lineHeight = '1.2';
            el.style.top = '50%';
            el.style.left = '0';
            el.style.transformOrigin = 'center center';
            el.style.color = '#a6a6a6';
            el.textContent = item;
            
            el.addEventListener('click', () => {
                if (!this.isDragging) {
                    this.target = index;
                }
            });
            
            this.container.appendChild(el);
            this.itemElements.push(el);
        });
    }
    
    bindEvents() {
        const onStart = (e) => {
            this.isDragging = true;
            this.container.style.cursor = 'grabbing';
            const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            this.dragStartPos = clientY;
            this.dragStartTarget = this.target;
            this.lastTime = performance.now();
            this.lastPos = this.pos;
            this.velocity = 0;
        };
        
        const onMove = (e) => {
            if (!this.isDragging) return;
            const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
            const dy = clientY - this.dragStartPos;
            const rowH = this.fontSize * this.spacing;
            const offset = dy / rowH;
            
            this.target = Math.max(0, Math.min(this.items.length - 1, this.dragStartTarget - offset));
            
            const now = performance.now();
            const dt = now - this.lastTime;
            if (dt > 10) {
                this.velocity = (this.pos - this.lastPos) / (dt / 1000);
                this.lastTime = now;
                this.lastPos = this.pos;
            }
        };
        
        const onEnd = () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.container.style.cursor = 'grab';
            
            // Inertia calculation
            if (Math.abs(this.velocity) > 0.5) {
                const inertia = this.velocity * 0.12;
                this.target = Math.max(0, Math.min(this.items.length - 1, Math.round(this.target - inertia)));
            } else {
                this.target = Math.round(this.target);
            }
        };
        
        this.container.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        
        this.container.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
        
        // Wheel Scrolling
        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = Math.sign(e.deltaY);
            this.target = Math.max(0, Math.min(this.items.length - 1, this.target + delta));
        }, { passive: false });
    }
    
    startLoop() {
        let lastFrameTime = performance.now();
        const run = (now) => {
            requestAnimationFrame(run);
            
            const currentNow = now || performance.now();
            let dt = (currentNow - lastFrameTime) / 1000;
            if (isNaN(dt) || dt <= 0) dt = 0.016; // Fallback to ~60fps frame duration
            dt = Math.min(dt, 0.05);
            lastFrameTime = currentNow;
            
            const tau = this.smoothing / 1000;
            const k = isNaN(tau) ? 0.1 : 1 - Math.exp(-dt / (tau || 0.15));
            
            if (isNaN(this.pos)) this.pos = this.defaultSelected || 0;
            if (isNaN(this.target)) this.target = this.defaultSelected || 0;
            
            this.pos = this.pos + (this.target - this.pos) * k;
            
            const rowH = this.fontSize * this.spacing;
            const tiltRad = (this.tilt * Math.PI) / 180;
            const R = tiltRad > 0.0005 ? rowH / tiltRad : 0;
            
            this.itemElements.forEach((el, i) => {
                const d = i - this.pos;
                const dist = Math.abs(d);
                
                let x = 0;
                let y = d * rowH;
                let rot = 0;
                
                if (R > 0) {
                    const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
                    y = R * Math.sin(ang);
                    x = -R * (1 - Math.cos(ang)) * this.curve;
                    rot = ang * 180 / Math.PI;
                }
                
                const opacity = Math.max(this.minOpacity, 1 - dist * this.fade);
                const blurVal = dist > 0.1 ? (dist * 1.5).toFixed(1) : 0;
                
                el.style.transform = `translate3d(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%), 0) rotateX(${-rot.toFixed(3)}deg)`;
                el.style.opacity = opacity.toFixed(4);
                el.style.filter = blurVal > 0 ? `blur(${blurVal}px)` : 'none';
                
                if (dist < 0.5) {
                    el.style.color = '#327882';
                    el.style.fontWeight = '600';
                } else {
                    el.style.color = '#a6a6a6';
                    el.style.fontWeight = '300';
                }
            });
            
            const currentSelected = Math.round(this.pos);
            if (this.selectedIndex !== currentSelected) {
                this.selectedIndex = currentSelected;
                if (this.onChange) {
                    this.onChange(this.items[this.selectedIndex], this.selectedIndex);
                }
            }
        };
        requestAnimationFrame(run);
    }
}

window.OptionWheel = OptionWheel;
