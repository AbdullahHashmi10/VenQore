const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const src = path.join(__dirname, 'VenQore_Phased_RoleArchitecture.docx');
const out = path.join(__dirname, 'VenQore_Phased_RoleArchitecture.txt');

try {
    const zip = new AdmZip(src);
    const xml = zip.readAsText('word/document.xml');

    const paragraphs = xml.split(/<w:p[\s>]/);
    const texts = [];

    for (const para of paragraphs) {
        const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
        let paraText = '';
        let m;
        while ((m = tRegex.exec(para)) !== null) {
            paraText += m[1];
        }
        if (paraText.trim()) {
            texts.push(paraText);
        }
    }

    const output = texts.join('\n');
    fs.writeFileSync(out, output, 'utf8');
    console.log(`Wrote ${path.basename(out)} (${output.length} chars, ${texts.length} paragraphs)`);
} catch (e) {
    console.error(`Error with ${path.basename(src)}: ${e.message}`);
}
