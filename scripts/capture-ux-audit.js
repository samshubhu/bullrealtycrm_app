const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = process.cwd();
const outDir = path.join(root, "ux-audit", "screenshots");
fs.mkdirSync(outDir, { recursive: true });

const baseUrl = "http://localhost:3000";
const credentials = {
  email: "admin@bullrealty.com",
  password: "password123",
};

async function waitForStable(page) {
  await page.waitForLoadState("domcontentloaded");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(700);
}

async function shot(page, name) {
  await waitForStable(page);
  const target = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: target, fullPage: false });
  console.log(target);
}

(async () => {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${baseUrl}/login`);
  await shot(page, "01-login");

  await page.fill('input[type="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await Promise.all([
    page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 20000 }),
    page.click('button[type="submit"]'),
  ]);

  await page.goto(`${baseUrl}/dashboard`);
  await shot(page, "02-dashboard");

  await page.goto(`${baseUrl}/leads`);
  await shot(page, "03-leads-list");

  const firstLead = await page.locator('a[href^="/leads/"]').first().getAttribute("href").catch(() => null);
  if (firstLead) {
    await page.goto(`${baseUrl}${firstLead}`);
    await shot(page, "04-lead-detail");
  }

  await page.goto(`${baseUrl}/pipeline`);
  await shot(page, "05-pipeline");

  await page.goto(`${baseUrl}/reports`);
  await shot(page, "06-reports");

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await mobile.goto(`${baseUrl}/login`);
  await mobile.fill('input[type="email"]', credentials.email);
  await mobile.fill('input[type="password"]', credentials.password);
  await Promise.all([
    mobile.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 20000 }),
    mobile.click('button[type="submit"]'),
  ]);
  await mobile.goto(`${baseUrl}/dashboard`);
  await shot(mobile, "07-mobile-dashboard");

  await mobile.goto(`${baseUrl}/leads`);
  await shot(mobile, "08-mobile-leads");

  await browser.close();
})();
