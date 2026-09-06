import { chromium } from 'playwright';
import fs from 'fs';

const out = 'e:/OpenCode/deepsix-portfolio/.shots';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));

for (const path of ['/itachi', '/goku', '/vegeta', '/zoro', '/optimus', '/spiderman', '/contact']) {
  const name = path.slice(1);
  await page.goto('http://127.0.0.1:5174' + path, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(8000);
  await page.screenshot({ path: `${out}/new-${name}.png`, fullPage: false });
  console.log(path, JSON.stringify(await page.evaluate(() => window.__FIG || null)));
}

await browser.close();
