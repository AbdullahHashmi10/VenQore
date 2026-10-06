const fs = require('node:fs');
const path = require('node:path');
const png2icons = require('png2icons');

// png2icons resizes/pads local PNGs without the obsolete Jimp dependency tree.
function convert(inputPath, outputPath) {
    const output = png2icons.createICO(fs.readFileSync(inputPath), png2icons.BICUBIC, 0, true, true);
    if (!output) throw new Error(`Could not convert PNG: ${inputPath}`);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, output);
    return output;
}

if (require.main === module) {
    try {
        const input = process.argv[2] || path.join(__dirname, 'assets/icon.png');
        const outputs = process.argv[3]
            ? [path.resolve(process.argv[3])]
            : ['assets/icon.ico', 'build/icon.ico'].map(p => path.join(__dirname, p));
        for (const output of outputs) {
            convert(input, output);
            console.log(`Created ${output}`);
        }
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}
module.exports = { convert };
