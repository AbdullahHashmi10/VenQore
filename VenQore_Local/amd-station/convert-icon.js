const fs = require('fs');
const png2icons = require('png2icons');
const Jimp = require('jimp');
const path = require('path');

async function convert(inputPath, outputPath, isFavicon = false) {
    try {
        console.log(`Reading ${inputPath}...`);
        const image = await Jimp.read(inputPath);

        console.log('Original Size:', image.bitmap.width, 'x', image.bitmap.height);

        const size = isFavicon ? 64 : 256;
        const canvas = new Jimp(size, size, 0x00000000);

        image.scaleToFit(size, size);

        const x = (size - image.bitmap.width) / 2;
        const y = (size - image.bitmap.height) / 2;

        console.log(`Compositing at ${x},${y}...`);
        canvas.composite(image, x, y);

        const buffer = await canvas.getBufferAsync(Jimp.MIME_PNG);

        console.log(`Creating ${isFavicon ? 'Favicon' : 'ICO'}...`);
        const output = isFavicon
            ? png2icons.createICO(buffer, png2icons.BICUBIC, 0, false)
            : png2icons.createICO(buffer, png2icons.BICUBIC, 0, false);

        if (output) {
            fs.writeFileSync(outputPath, output);
            console.log(`Success! ${outputPath} created.`);
        } else {
            console.error(`Failed: png2icons returned null for ${outputPath}.`);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

async function run() {
    // 1. Create App Icon
    await convert('assets/icon.png', 'assets/icon.ico');
    await convert('assets/icon.png', 'build/icon.ico');

    // 2. Create Web Favicon (assuming public directory is at ../public)
    const faviconPath = path.resolve(__dirname, '../public/favicon.ico');
    await convert('assets/icon.png', faviconPath, true);
}

run();
