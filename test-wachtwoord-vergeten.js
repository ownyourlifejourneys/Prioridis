const { launchBrowser } = require("./launch-browser");

const STAMP = Date.now();
const EMAIL = "reset" + STAMP + "@test.nl";
const UNKNOWN_EMAIL = "onbekend" + STAMP + "@test.nl";

(async () => {
  const browser = await launchBrowser();
  const results = {};

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8090/");

  // knop moet zichtbaar zijn op het inlogscherm
  results.forgotBtnVisible = await page.locator("#forgotPassBtn").isVisible();

  // test 1: leeg e-mailveld -> validatiefout
  await page.click("#forgotPassBtn");
  await page.waitForTimeout(300);
  results.emptyEmailError = await page.textContent("#loginError");

  // test 2: onbekend e-mailadres -> auth/user-not-found vertaald
  await page.fill("#loginUser", UNKNOWN_EMAIL);
  await page.click("#forgotPassBtn");
  await page.waitForTimeout(1200);
  results.unknownEmailError = await page.textContent("#loginError");
  results.unknownEmailStatus = await page.textContent("#loginStatus");

  // registreer een echt account
  await page.click("#loginModeBtn");
  await page.fill("#loginName", "Rob");
  await page.fill("#loginUser", EMAIL);
  await page.fill("#loginPass", "wachtwoord123");
  await page.click("#loginBtn");
  await page.waitForSelector("#appView:not([hidden])", { timeout: 15000 });

  // uitloggen om terug bij het inlogscherm te komen
  await page.click("#logoutBtn");
  await page.waitForSelector("#loginView:not([hidden])", { timeout: 15000 });

  // test 3: geldig, geregistreerd e-mailadres -> succesbevestiging
  await page.fill("#loginUser", EMAIL);
  await page.click("#forgotPassBtn");
  await page.waitForTimeout(1200);
  results.successStatus = await page.textContent("#loginStatus");
  results.successError = await page.textContent("#loginError");
  results.btnReenabled = await page.isEnabled("#forgotPassBtn");

  await page.screenshot({ path: "/tmp/wachtwoord_vergeten.png", fullPage: true });

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error("TEST FAILED:", e); process.exit(1); });
