const { chromium } = require("playwright");

const STAMP = Date.now();
const EMAIL = "architectuur" + STAMP + "@test.nl";

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const results = {};

  // account aanmaken op "apparaat 1"
  const ctx1 = await browser.newContext();
  const page1 = await ctx1.newPage();
  await page1.goto("http://127.0.0.1:8090/");
  await page1.click("#loginModeBtn");
  await page1.fill("#loginName", "Rob");
  await page1.fill("#loginUser", EMAIL);
  await page1.fill("#loginPass", "wachtwoord123");
  await page1.click("#loginBtn");
  await page1.waitForSelector("#appView:not([hidden])", { timeout: 15000 });

  results.voorbeeldTakenGeladen = (await page1.locator("#taskList li .task-text").allTextContents()).length;

  // op hetzelfde apparaat een taak toevoegen
  await page1.click("#composeToggle");
  await page1.fill("#taskInput", "Rapport afronden");
  await page1.click("#addBtn");
  await page1.waitForTimeout(600);
  results.naToevoegenApparaat1 = await page1.locator("#taskList li .task-text").allTextContents();

  // ---- "apparaat 2": zelfde account, nieuw browserprofiel, tegelijk open ----
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await page2.goto("http://127.0.0.1:8090/");
  await page2.fill("#loginUser", EMAIL);
  await page2.fill("#loginPass", "wachtwoord123");
  await page2.click("#loginBtn");
  await page2.waitForSelector("#appView:not([hidden])", { timeout: 15000 });

  results.apparaat2ZietZelfdeLijst = await page2.locator("#taskList li .task-text").allTextContents();

  // gelijktijdig: apparaat 1 voegt een taak toe, apparaat 2 voegt een andere
  // taak toe, vlak na elkaar (de klassieke race condition uit de review)
  // (het invoerpaneel op apparaat 1 staat al open van de vorige stap)
  await page1.fill("#taskInput", "Taak van apparaat 1");
  await Promise.all([
    page1.click("#addBtn"),
    (async () => {
      await page2.click("#composeToggle");
      await page2.fill("#taskInput", "Taak van apparaat 2");
      await page2.click("#addBtn");
    })(),
  ]);

  await page1.waitForTimeout(1000);
  await page2.waitForTimeout(1000);

  results.apparaat1ZietBeideNaRace = await page1.locator("#taskList li .task-text").allTextContents();
  results.apparaat2ZietBeideNaRace = await page2.locator("#taskList li .task-text").allTextContents();

  // apparaat 1 vinkt een taak af, apparaat 2 moet dat direct zien zonder herladen
  await page1.locator("#taskList li:has-text('Rapport afronden') .check").click();
  await page1.waitForTimeout(1000);
  results.apparaat2ZietAfvinkingLive = await page2.locator("#doneList .txt").allTextContents();

  await page1.screenshot({ path: "/tmp/architectuur_apparaat1.png", fullPage: true });

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error("TEST FAILED:", e); process.exit(1); });
