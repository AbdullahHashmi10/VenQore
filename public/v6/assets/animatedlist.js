// AnimatedList Vanilla selection list with interactive scaling animations
// Styled strictly with VenQore V6 Design System Tokens

class AnimatedList {
    constructor(container, options = {}) {
        this.container = container;
        this.items = options.items || [];
        this.onItemSelect = options.onItemSelect || null;
        this.initialSelectedIndex = options.initialSelectedIndex !== undefined ? options.initialSelectedIndex : -1;
        this.selectedIndex = this.initialSelectedIndex;
        
        this.initDOM();
        this.bindEvents();
    }
    
    initDOM() {
        this.container.innerHTML = '';
        this.container.classList.add('scroll-list-container');
        
        // Scroll List
        this.listEl = document.createElement('div');
        this.listEl.className = 'scroll-list';
        this.container.appendChild(this.listEl);
        
        this.itemElements = [];
        this.items.forEach((item, index) => {
            const itemWrapper = document.createElement('div');
            itemWrapper.className = 'item-wrapper';
            itemWrapper.setAttribute('data-index', index);
            
            const itemBox = document.createElement('div');
            itemBox.className = 'item-box' + (index === this.selectedIndex ? ' is-selected' : '');
            
            const itemText = document.createElement('p');
            itemText.textContent = item;
            
            itemBox.appendChild(itemText);
            itemWrapper.appendChild(itemBox);
            
            // Hover selection logic
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

        // Bottom spacer to ensure the last item is never clipped by flex container overflow
        const spacer = document.createElement('div');
        spacer.style.height = '24px';
        spacer.style.flex = 'none';
        this.listEl.appendChild(spacer);
    }
    
    bindEvents() {
        // Arrow & keyboard navigation
        this.keyDownHandler = (e) => {
            const modal = document.getElementById('modal-business');
            const isModalOpen = modal && modal.classList.contains('is-open');
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
                    const confirmBtn = document.getElementById('btn-confirm-business');
                    if (confirmBtn) confirmBtn.click();
                }
            }
        };
        window.addEventListener('keydown', this.keyDownHandler);
    }
    
    setSelectedIndex(index) {
        this.selectedIndex = index;
        this.itemElements.forEach((el, idx) => {
            const box = el.querySelector('.item-box');
            if (box) {
                box.classList.toggle('is-selected', idx === index);
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
            selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }
    
    destroy() {
        window.removeEventListener('keydown', this.keyDownHandler);
    }
}

window.AnimatedList = AnimatedList;
