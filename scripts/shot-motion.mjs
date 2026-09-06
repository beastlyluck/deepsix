import { chromium } from 'playwright';
import fs from 'fs';

const base = 'http://127.0.0.1:5174';
const out = 'e:/OpenCode/deepsix-portfolio/.shots';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const path of ['/goku', '/vegeta', '/zoro']) {
  const name = path.slice(1);
  await page.goto(base + path, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(5000);
  for (let i = 0; i < 3; i++) {
    await page.screenshot({ path: `${out}/${name}-m${i}.png`, fullPage: false });
    await page.waitForTimeout(1100);
  }
  const fit = await page.evaluate(() => window.__FIG || null);
  console.log(path, JSON.stringify(fit));
}

await browser.close();
