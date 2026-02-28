/**
 * Extraction du texte des PDFs INKSPOT via pdf.js-extract (sans canvas).
 * Usage: node scripts/extract-pdf-to-text.js
 * Sortie: scripts/pdf-extracts/*.txt
 */
const fs = require('fs');
const path = require('path');

function pageContentToText(page) {
  if (!page.content || !page.content.length) return '';
  // Grouper par ligne (y) avec tolérance, trier par y décroissant puis x croissant
  const byLine = {};
  const tol = 3;
  for (const item of page.content) {
    const y = Math.round(item.y / tol) * tol;
    if (!byLine[y]) byLine[y] = [];
    byLine[y].push({ x: item.x, str: item.str || '' });
  }
  const lines = Object.keys(byLine)
    .map(Number)
    .sort((a, b) => b - a)
    .map(y => {
      byLine[y].sort((a, b) => a.x - b.x);
      return byLine[y].map(i => i.str).join(' ');
    });
  return lines.join('\n');
}

function pdfToText(pdfResult) {
  if (!pdfResult.pages || !pdfResult.pages.length) return '';
  return pdfResult.pages.map(p => pageContentToText(p)).join('\n\n');
}

async function main() {
  const PDFExtract = require('pdf.js-extract').PDFExtract;
  const pdfExtract = new PDFExtract();
  const root = path.join(__dirname, '..');
  const outDir = path.join(__dirname, 'pdf-extracts');
  const docsExtracts = path.join(__dirname, '..', 'docs-astro', 'public', 'extracts');
  for (const d of [outDir, docsExtracts]) {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  }

  const distPdf = path.join(__dirname, '..', 'docs-astro', 'dist-pdf');
  const files = [
    { file: 'Cahier-de-Recette.pdf', out: 'cahier-recette.txt' },
    { file: 'Manuel-Utilisation-Technique.pdf', out: 'manuel-utilisation.txt' },
    { file: 'Manuel-Deploiement-Railway.pdf', out: 'manuel-deploiement-railway.txt' },
    { file: 'Changelog.pdf', out: 'changelog.txt' }
  ];

  for (const { file, out } of files) {
    const pdfPath = path.join(distPdf, file);
    if (!fs.existsSync(pdfPath)) {
      console.log('SKIP (not found): ' + file);
      continue;
    }
    try {
      const data = await pdfExtract.extract(pdfPath, { normalizeWhitespace: true });
      const text = pdfToText(data);
      const outPath = path.join(outDir, out);
      fs.writeFileSync(outPath, text, 'utf8');
      const docsPath = path.join(docsExtracts, out);
      fs.writeFileSync(docsPath, text, 'utf8');
      console.log('OK: ' + file + ' -> ' + out + ' + docs-astro/public/extracts/ (' + text.length + ' chars)');
    } catch (err) {
      console.error('ERR: ' + file + ' - ' + err.message);
    }
  }
}

main();
