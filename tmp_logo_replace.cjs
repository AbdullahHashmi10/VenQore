const fs = require('fs');
const path = require('path');
const dir = 'd:/AMD POS/website/';
const files = ['index.html', 'demo.html', 'docs.html', 'features.html', 'pricing.html', 'reviews.html'];

files.forEach(f => {
    let p = path.join(dir, f);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf8');
    
    // Replace inline SVG inside nav-logo-icon-inner
    let newContent = content.replace(/<div class="nav-logo-icon-inner">[\s\S]*?<\/div>/g, '<div class="nav-logo-icon-inner"><img src="logo.svg" style="width:100%;height:100%;object-fit:contain;"></div>');
    
    if (newContent !== content) {
        fs.writeFileSync(p, newContent);
        console.log('Updated', f);
    }
});
