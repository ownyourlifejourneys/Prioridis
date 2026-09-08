const { launchBrowser } = require("./launch-browser");

const STAMP = Date.now();
const EMAIL = "rob" + STAMP + "@test.nl";

(async () => {
  const browser = await launchBrowser();
  const results = {};

  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8090/");

  // registreren
  await page.click("#loginModeBtn");
  await page.fill("#loginName", "Rob");
  await page.fill("#loginUser", EMAIL);
  await page.fill("#loginPass", "wachtwoord123");
  await page.click("#loginBtn");
  await page.waitForSelector("#appView:not([hidden])", { timeout: 15000 });

  // backup panel moet weg zijn
  results.backupPanelGone = (await page.locator("#backupPanel").count()) === 0;

  // dagelijkse taak toevoegen
  await page.click("#composeToggle");
  await page.fill("#taskInput", "Mediteren");
  await page.check("#dailyInput");
  await page.click("#addBtn");
  await page.waitForTimeout(1200);

  results.taskListAfterAdd = await page.locator("#taskList li .task-text").allTextContents();
  results.dailyBadgeVisible = await page.locator("#taskList li:has-text('Mediteren') .daily-badge").isVisible();
  results.dailyCheckboxResetAfterAdd = await page.isChecked("#dailyInput");

  // taak afvinken
  await page.locator("#taskList li:has-text('Mediteren') .check").click();
  await page.waitForTimeout(1200);
  results.doneListAfterCheck = await page.locator("#doneList .txt").allTextContents();
  results.activeListAfterCheck = await page.locator("#taskList li .task-text").allTextContents();

  // simuleer "volgende dag": haal de taken rechtstreeks uit de fake
  // firestore-deelverzameling, zet dailyDoneDate terug naar gisteren, herlaad de pagina
  const uidHandle = await page.evaluate(() => {
    return new Promise((resolve) => {
      firebase.auth().onAuthStateChanged((u) => resolve(u && u.uid));
    });
  });
  const taskDocs = await page.evaluate(async (uid) => {
    const r = await fetch("/fsfake-collection/priodisUsers/" + uid + "/tasks");
    const json = await r.json();
    return json.docs;
  }, uidHandle);
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const yISO = yesterday.getFullYear() + "-" + String(yesterday.getMonth() + 1).padStart(2, "0") + "-" + String(yesterday.getDate()).padStart(2, "0");
  const dailyDocs = taskDocs.filter((d) => d.data.daily);
  await page.evaluate(async ({ uid, dailyDocs, yISO }) => {
    for (const d of dailyDocs) {
      const patched = Object.assign({}, d.data, { dailyDoneDate: yISO });
      await fetch("/fsfake/priodisUsers/" + uid + "/tasks/" + d.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: patched, merge: true }),
      });
    }
  }, { uid: uidHandle, dailyDocs, yISO });

  await page.reload();
  await page.waitForSelector("#appView:not([hidden])", { timeout: 15000 });
  await page.waitForTimeout(1000);
  results.activeListNextDay = await page.locator("#taskList li .task-text").allTextContents();
  results.doneListNextDay = await page.locator("#doneList .txt").allTextContents();

  await page.screenshot({ path: "/tmp/std_light.png", fullPage: true });

  // GenZ layout aanzetten
  await page.click("#layoutBtn");
  await page.waitForTimeout(400);
  results.dataLayoutAttr = await page.evaluate(() => document.documentElement.getAttribute("data-layout"));
  await page.click("#composeToggle");
  await page.screenshot({ path: "/tmp/genz_light.png", fullPage: true });

  // donker + GenZ
  await page.click("#themeBtn");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/genz_dark.png", fullPage: true });

  // terug naar standaard, donker blijft
  await page.click("#layoutBtn");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "/tmp/std_dark.png", fullPage: true });

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error("TEST FAILED:", e); process.exit(1); });
