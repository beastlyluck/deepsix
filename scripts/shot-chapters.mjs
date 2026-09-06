import { chromium } from 'playwright';
import fs from 'fs';

const base = 'http://127.0.0.1:5174';
const pages = ['/', '/itachi', '/goku', '/vegeta', '/zoro', '/optimus', '/spiderman', '/contact', '/figures'];
const out = 'e:/OpenCode/deepsix-portfolio/.shots';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => {
  if (m.type() === 'error') console.log('CONSOLE', m.text());
});

for (const path of pages) {
  const name = path === '/' ? 'home' : path.slice(1);
  try {
    await page.goto(base + path, { waitUntil: 'networkidle', timeout: 90000 });
    await page.waitForTimeout(6000);
    const fit = await page.evaluate(() => window.__FIG || null);
    await page.screenshot({ path: `${out}/${name}.png`, fullPage: false });
    console.log('OK', path, JSON.stringify(fit));
  } catch (e) {
    console.log('FAIL', path, e.message);
  }
}

await browser.close();
