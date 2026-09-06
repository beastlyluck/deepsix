import { chromium } from 'playwright';

const base = 'http://127.0.0.1:5174';
const pages = ['/goku', '/vegeta', '/spiderman', '/contact'];
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message));
page.on('console', (m) => {
  if (['error', 'warning'].includes(m.type())) logs.push(m.type().toUpperCase() + ' ' + m.text());
});

for (const path of pages) {
  logs.length = 0;
  await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);
  console.log('\n====', path, '====');
  logs.forEach((l) => console.log(l));
  if (!logs.length) console.log('(no errors)');
}

await browser.close();
