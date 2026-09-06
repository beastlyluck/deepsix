import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://127.0.0.1:5174/zoro', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(4500);
await page.screenshot({ path: 'e:/OpenCode/deepsix-portfolio/.shots/zoro-final.png', fullPage: false });
await page.goto('http://127.0.0.1:5174/figures', { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(7000);
await page.screenshot({ path: 'e:/OpenCode/deepsix-portfolio/.shots/figures-final.png', fullPage: false });
console.log(await page.evaluate(() => window.__FIG || null));
await browser.close();
