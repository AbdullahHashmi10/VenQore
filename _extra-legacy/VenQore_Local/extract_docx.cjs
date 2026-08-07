const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const files = [
    { src: path.join(__dirname, 'rules_for_consistancy', 'AMD_ERP_Financial_Bible_v3.docx'), out: path.join(__dirname, 'rules_for_consistancy', 'Financial_Bible_v3.txt') },
    { src: path.join(__dirname, 'rules_for_consistancy', 'AMD_ERP_Scenario_Rulebook_v3.docx'), out: path.join(__dirname, 'rules_for_consistancy', 'Scenario_Rulebook_v3.txt') },
    { src: path.join(__dirname, 'rules_for_consistancy', 'AMD_ERP_Execution_Plan_v1.1.docx'), out: path.join(__dirname, 'rules_for_consistancy', 'Execution_Plan_v1.1.txt') },
];

for (const f of files) {
    try {
        const zip = new AdmZip(f.src);
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
        fs.writeFileSync(f.out, output, 'utf8');
        console.log(`Wrote ${path.basename(f.out)} (${output.length} chars, ${texts.length} paragraphs)`);
    } catch (e) {
        console.error(`Error with ${path.basename(f.src)}: ${e.message}`);
    }
}
