import { chromium } from 'playwright';

const BASE = 'https://revendafacil-liard.vercel.app';
const PAGES = [
  '/login',
  '/cadastro',
  '/dashboard',
  '/clientes',
  '/marcas',
  '/produtos',
  '/estoque',
  '/vendas',
  '/contas-receber',
  '/despesas',
  '/financeiro',
  '/metas',
  '/configuracoes',
  '/relatorios',
  '/catalogo/demo',
];

const OUT = 'C:\\Users\\WELLIN~1.SAN\\AppData\\Local\\Temp\\opencode\\screenshots';
import { mkdirSync } from 'fs';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

// Login
console.log('Logging in...');
await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(1000);
await page.fill('input[type="email"]', 'admin@revendafacil.com');
await page.fill('input[type="password"]', 'Admin123!');
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);

for (const path of PAGES) {
  try {
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 30000 });
  } catch {}
  await page.waitForTimeout(1500);
  const name = path.replace(/[/\\]/g, '_') || 'index';
  await page.screenshot({ path: `${OUT}\\${name}.png`, fullPage: true });
  console.log(`✓ ${path}`);
}

await browser.close();
console.log('Done!');
