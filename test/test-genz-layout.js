const { chromium } = require("playwright");

const STAMP = Date.now();
const EMAIL = "genz" + STAMP + "@test.nl";

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const results = {};

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8090/");

  await page.click("#loginModeBtn");
  await page.fill("#loginName", "Rob");
  await page.fill("#loginUser", EMAIL);
  await page.fill("#loginPass", "wachtwoord123");
  await page.click("#loginBtn");
  await page.waitForSelector("#appView:not([hidden])", { timeout: 15000 });

  results.initialBtnLabel = await page.textContent("#layoutBtn");

  // klik 1: standaard -> genz
  await page.click("#layoutBtn");
  await page.waitForTimeout(300);
  results.afterClick1 = {
    attr: await page.evaluate(() => document.documentElement.getAttribute("data-layout")),
    btn: await page.textContent("#layoutBtn"),
    tagline: await page.textContent("#appTagline"),
    listHead: await page.textContent("#listHeadTitle"),
    addBtn: await page.textContent("#addBtn"),
    empty: await page.textContent("#emptyState"),
  };
  await page.click("#composeToggle");
  await page.screenshot({ path: "/tmp/genz_light.png", fullPage: true });

  await page.click("#themeBtn");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/genz_dark.png", fullPage: true });

  // klik 2: genz -> standaard
  await page.click("#layoutBtn");
  await page.waitForTimeout(300);
  results.afterClick2 = {
    attr: await page.evaluate(() => document.documentElement.getAttribute("data-layout")),
    btn: await page.textContent("#layoutBtn"),
  };

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error("TEST FAILED:", e); process.exit(1); });
