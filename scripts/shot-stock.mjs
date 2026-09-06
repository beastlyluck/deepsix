import { chromium } from 'playwright';
import fs from 'fs';

const out = 'e:/OpenCode/deepsix-portfolio/.shots';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const path of ['/goku', '/vegeta', '/spiderman']) {
  const name = path.slice(1);
  await page.goto('http://127.0.0.1:5174' + path, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(5500);
  await page.screenshot({ path: `${out}/${name}-stock0.png`, fullPage: false });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/${name}-stock1.png`, fullPage: false });
  console.log(path, JSON.stringify(await page.evaluate(() => window.__FIG || null)));
}

await browser.close();
