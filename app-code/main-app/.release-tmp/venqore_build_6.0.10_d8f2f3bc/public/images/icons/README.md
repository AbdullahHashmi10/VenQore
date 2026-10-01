# PWA App Icons

This directory should contain app icons in various sizes for the Progressive Web App.

## Required Icon Sizes:
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## How to Create Icons:

### Option 1: Use your existing logo
1. Take your `public/images/logo.png` file
2. Use an online tool like https://www.pwabuilder.com/imageGenerator
3. Upload your logo and download all sizes
4. Place them in this directory

### Option 2: Use a design tool
1. Open your logo in Photoshop, Figma, or Canva
2. Export it in all the required sizes listed above
3. Ensure the icons have a transparent or solid background
4. Save them with the exact names listed above

### Option 3: Use an automated script
Run this command in the project root (requires ImageMagick):
```bash
# If you have ImageMagick installed
convert public/images/logo.png -resize 72x72 public/images/icons/icon-72x72.png
convert public/images/logo.png -resize 96x96 public/images/icons/icon-96x96.png
convert public/images/logo.png -resize 128x128 public/images/icons/icon-128x128.png
convert public/images/logo.png -resize 144x144 public/images/icons/icon-144x144.png
convert public/images/logo.png -resize 152x152 public/images/icons/icon-152x152.png
convert public/images/logo.png -resize 192x192 public/images/icons/icon-192x192.png
convert public/images/logo.png -resize 384x384 public/images/icons/icon-384x384.png
convert public/images/logo.png -resize 512x512 public/images/icons/icon-512x512.png
```

## Temporary Solution:
For now, you can copy your logo.png to all sizes as a temporary fix:
```bash
Copy-Item public/images/logo.png public/images/icons/icon-72x72.png
Copy-Item public/images/logo.png public/images/icons/icon-96x96.png
Copy-Item public/images/logo.png public/images/icons/icon-128x128.png
Copy-Item public/images/logo.png public/images/icons/icon-144x144.png
Copy-Item public/images/logo.png public/images/icons/icon-152x152.png
Copy-Item public/images/logo.png public/images/icons/icon-192x192.png
Copy-Item public/images/logo.png public/images/icons/icon-384x384.png
Copy-Item public/images/logo.png public/images/icons/icon-512x512.png
```

Note: This will work but the icons won't be optimized for each size. Use proper tools for production.
