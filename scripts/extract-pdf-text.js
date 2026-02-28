const fs = require('fs');
const path = require('path');

async function extract(pdfPath) {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdfParse(dataBuffer);
    return { text: data.text, pages: data.numpages };
  } catch (e) {
    return { text: '', error: e.message };
  }
}

const root = path.join(__dirname, '..');
const files = [
  'Cahier-de-Recette-INKSPOT.pdf',
  'Manuel-Utilisation-INKSPOT.pdf',
  'Manuel-Deploiement-Railway-INKSPOT (1) - Copie.pdf',
  'CHANGELOG-INKSPOT.pdf'
];

(async () => {
  for (const f of files) {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) {
      console.log('--- FILE NOT FOUND: ' + f + ' ---\n');
      continue;
    }
    console.log('=== ' + f + ' ===\n');
    const out = await extract(p);
    if (out.error) console.log('Error: ' + out.error);
    else console.log(out.text || '(empty)');
    console.log('\n');
  }
})();
