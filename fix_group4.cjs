const fs = require('fs');
const path = require('path');

const map = {
  "store.products.index": "store.inventory.index",
  "sales.presale.show": "store.pre-sales.show",
  "auth.google": "auth.google" // Keeping it since it exists
};

function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
        const fullPath = path.join(dir, f);
        if (fs.statSync(fullPath).isDirectory()) {
            walk(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            
            // Check store.products.index
            if (content.includes("route('store.products.index')") || content.includes('route("store.products.index")')) {
                content = content.replace(/route\(['"]store\.products\.index['"]\)/g, "route('store.inventory.index')");
                changed = true;
            }
            
            // Check sales.presale.show
            if (content.includes("route('sales.presale.show'") || content.includes('route("sales.presale.show"')) {
                content = content.replace(/route\(['"]sales\.presale\.show['"]/g, "route('store.pre-sales.show'");
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed Group 4:', fullPath);
            }
        }
    }
}

walk('resources/js');
console.log('Done fixing Group 4 routes.');
