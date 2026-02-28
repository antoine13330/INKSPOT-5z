// Export PDF des pages docs avec charte graphique INKSPOT.
// Prérequis : `npm run build` puis `npm run pdf:all`.
import { chromium } from 'playwright-chromium';
import { spawn } from 'node:child_process';
import { setTimeout as wait } from 'node:timers/promises';
import path from 'node:path';
import fs from 'node:fs';

const pages = [
  { slug: 'mut', title: 'Manuel-Utilisation-Technique', label: 'MUT' },
  { slug: 'deploiement-railway', title: 'Manuel-Deploiement-Railway', label: 'Déploiement Railway' },
  { slug: 'manuel-mise-a-jour', title: 'Manuel-Mise-a-Jour', label: 'Mise à Jour' },
  { slug: 'cahier-recette', title: 'Cahier-de-Recette', label: 'Cahier de recette' },
  { slug: 'changelog', title: 'Changelog', label: 'Changelog' },
];

const PREVIEW_PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PREVIEW_PORT}`;
const distPdf = path.join(process.cwd(), 'dist-pdf');

// Charte INKSPOT : couleurs alignées sur l’app (design-system.css)
const INKSPOT_HEADER_BG = '#1a1a1a';
const INKSPOT_PRIMARY = '#3b82f6';

const pdfHeaderTemplate = `
  <div style="width:100%;padding:8px 15px;font-size:10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;background:${INKSPOT_HEADER_BG};display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;">
    <span><strong>INKSPOT</strong> · Documentation</span>
    <span class="title"></span>
  </div>
`;
const pdfFooterTemplate = `
  <div style="width:100%;padding:6px 15px;font-size:9px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#64748b;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;box-sizing:border-box;">
    <span>INKSPOT – Documentation</span>
    <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
  </div>
`;

async function startPreview() {
  return new Promise((resolve, reject) => {
    const proc = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', `${PREVIEW_PORT}`], {
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    proc.on('error', reject);
    // Attendre quelques secondes que le serveur démarre
    setTimeout(() => resolve(proc), 4000);
  });
}

async function stopPreview(proc) {
  if (proc && !proc.killed) proc.kill();
}

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function exportAll() {
  await ensureDir(distPdf);

  console.log('🚀 Lancement astro preview…');
  const previewProc = await startPreview();

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1400, height: 2400 },
  });

  for (const entry of pages) {
    const url = `${BASE_URL}/${entry.slug}`;
    console.log(`→ Export ${url} (charte INKSPOT)`);
    await page.goto(url, { waitUntil: 'networkidle' });
    await wait(800);
    // Charte INKSPOT + masquer navbar + forcer bordures des tableaux
    await page.evaluate(() => {
      document.body.classList.add('charte-inkspot');
      const header = document.querySelector('header.doc-header-pdf, header');
      if (header) header.style.setProperty('display', 'none', 'important');
      // Forcer bordures visibles sur tous les tableaux (contour noir)
      const style = document.createElement('style');
      style.textContent = `
        table { border: 2px solid #0f172a !important; border-collapse: collapse !important; }
        table th, table td { border: 2px solid #0f172a !important; }
      `;
      document.head.appendChild(style);
    });
    await wait(200);
    const target = path.join(distPdf, `${entry.title}.pdf`);
    await page.pdf({
      path: target,
      printBackground: true,
      format: 'A4',
      margin: { top: '20mm', bottom: '20mm', left: '14mm', right: '14mm' },
      displayHeaderFooter: true,
      headerTemplate: pdfHeaderTemplate.replace('<span class="title"></span>', `<span>${entry.label}</span>`),
      footerTemplate: pdfFooterTemplate,
    });
    console.log(`✅ PDF généré : ${target}`);
  }

  await browser.close();
  await stopPreview(previewProc);
  console.log('🏁 Export terminé.');
}

exportAll().catch((err) => {
  console.error('❌ Échec export PDF', err);
  process.exit(1);
});
