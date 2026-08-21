// AnimatedList Vanilla selection list with interactive scaling animations
// Ported from reactbits.dev UI components

class AnimatedList {
    constructor(container, options = {}) {
        this.container = container;
        this.items = options.items || [];
        this.onItemSelect = options.onItemSelect || null;
        this.initialSelectedIndex = options.initialSelectedIndex !== undefined ? options.initialSelectedIndex : -1;
        this.selectedIndex = this.initialSelectedIndex;
        
        this.initDOM();
        this.setupIntersectionObserver();
        this.bindEvents();
    }
    
    initDOM() {
        this.container.innerHTML = '';
        this.container.classList.add('scroll-list-container');
        this.container.style.position = 'relative';
        this.container.style.width = '100%';
        this.container.style.maxWidth = '100%';
        
        // Scroll List
        this.listEl = document.createElement('div');
        this.listEl.className = 'scroll-list no-scrollbar';
        this.listEl.style.maxHeight = '260px';
        this.listEl.style.overflowY = 'auto';
        this.listEl.style.padding = '8px';
        this.listEl.style.scrollbarWidth = 'none'; // Hide default scrollbars
        this.listEl.style.msOverflowStyle = 'none';
        this.container.appendChild(this.listEl);
        
        // Add Gradients for premium blending look
        this.topGradient = document.createElement('div');
        this.topGradient.className = 'absolute top-0 left-0 right-0 pointer-events-none transition-opacity duration-300';
        this.topGradient.style.height = '40px';
        this.topGradient.style.background = 'linear-gradient(to bottom, #09090b, transparent)';
        this.topGradient.style.opacity = '0';
        this.container.appendChild(this.topGradient);

        this.bottomGradient = document.createElement('div');
        this.bottomGradient.className = 'absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-300';
        this.bottomGradient.style.height = '40px';
        this.bottomGradient.style.background = 'linear-gradient(to top, #09090b, transparent)';
        this.bottomGradient.style.opacity = '1';
        this.container.appendChild(this.bottomGradient);
        
        this.itemElements = [];
        this.items.forEach((item, index) => {
            const itemWrapper = document.createElement('div');
            itemWrapper.setAttribute('data-index', index);
            itemWrapper.style.transform = 'scale(0.7)';
            itemWrapper.style.opacity = '0';
            itemWrapper.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease';
            itemWrapper.style.marginBottom = '0.75rem';
            itemWrapper.style.cursor = 'pointer';
            
            const itemBox = document.createElement('div');
            itemBox.className = 'item-box p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all text-center';
            if (index === this.selectedIndex) {
                itemBox.classList.add('bg-[#327882]/20', 'border-[#327882]/40');
                itemBox.style.borderColor = '#327882';
                itemBox.style.backgroundColor = 'rgba(50, 120, 130, 0.2)';
            }
            
            const itemText = document.createElement('p');
            itemText.className = 'text-sm text-gray-300 font-medium transition-colors';
            itemText.textContent = item;
            if (index === this.selectedIndex) {
                itemText.style.color = '#ffffff';
            }
            
            itemBox.appendChild(itemText);
            itemWrapper.appendChild(itemBox);
            
            // Hover logic
            itemWrapper.addEventListener('mouseenter', () => {
                this.setSelectedIndex(index);
            });
            
            // Click selection logic
            itemWrapper.addEventListener('click', () => {
                this.selectItem(index);
            });
            
            this.listEl.appendChild(itemWrapper);
            this.itemElements.push(itemWrapper);
        });
    }
    
    setupIntersectionObserver() {
        // Observe items entering view for scaling up animation
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const target = entry.target;
                if (entry.isIntersecting) {
                    target.style.transform = 'scale(1)';
                    target.style.opacity = '1';
                } else {
                    target.style.transform = 'scale(0.7)';
                    target.style.opacity = '0';
                }
            });
        }, {
            root: this.listEl,
            threshold: 0.25
        });
        
        this.itemElements.forEach(el => observer.observe(el));
    }
    
    bindEvents() {
        // Gradient opacity fading on scroll
        this.listEl.addEventListener('scroll', () => {
            const scrollTop = this.listEl.scrollTop;
            const scrollHeight = this.listEl.scrollHeight;
            const clientHeight = this.listEl.clientHeight;
            
            this.topGradient.style.opacity = Math.min(scrollTop / 30, 1).toString();
            const bottomDistance = scrollHeight - (scrollTop + clientHeight);
            this.bottomGradient.style.opacity = scrollHeight <= clientHeight ? '0' : Math.min(bottomDistance / 30, 1).toString();
        });
        
        // Arrow & keyboard navigation
        this.keyDownHandler = (e) => {
            const isModalOpen = this.container.closest('.fixed')?.classList.contains('opacity-100');
            if (!isModalOpen) return;
            
            if (e.key === 'ArrowDown' || e.key === 'Tab') {
                e.preventDefault();
                this.setSelectedIndex(Math.min(this.selectedIndex + 1, this.items.length - 1));
                this.scrollIntoViewIfNeeded();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.setSelectedIndex(Math.max(this.selectedIndex - 1, 0));
                this.scrollIntoViewIfNeeded();
            } else if (e.key === 'Enter') {
                if (this.selectedIndex >= 0 && this.selectedIndex < this.items.length) {
                    e.preventDefault();
                    this.selectItem(this.selectedIndex);
                }
            }
        };
        window.addEventListener('keydown', this.keyDownHandler);
    }
    
    setSelectedIndex(index) {
        this.selectedIndex = index;
        this.itemElements.forEach((el, idx) => {
            const box = el.querySelector('.item-box');
            const text = el.querySelector('p');
            if (idx === index) {
                box.style.borderColor = '#327882';
                box.style.backgroundColor = 'rgba(50, 120, 130, 0.2)';
                text.style.color = '#ffffff';
            } else {
                box.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                box.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                text.style.color = '#d1d5db';
            }
        });
    }
    
    selectItem(index) {
        this.setSelectedIndex(index);
        if (this.onItemSelect) {
            this.onItemSelect(this.items[index], index);
        }
    }
    
    scrollIntoViewIfNeeded() {
        if (this.selectedIndex < 0) return;
        const selectedItem = this.itemElements[this.selectedIndex];
        if (selectedItem) {
            const container = this.listEl;
            const extraMargin = 40;
            const containerScrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const itemTop = selectedItem.offsetTop;
            const itemBottom = itemTop + selectedItem.offsetHeight;
            
            if (itemTop < containerScrollTop + extraMargin) {
                container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
            } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
                container.scrollTo({
                    top: itemBottom - containerHeight + extraMargin,
                    behavior: 'smooth'
                });
            }
        }
    }
    
    destroy() {
        window.removeEventListener('keydown', this.keyDownHandler);
    }
}

window.AnimatedList = AnimatedList;
