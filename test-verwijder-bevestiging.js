const { launchBrowser } = require("./launch-browser");

const STAMP = Date.now();
const EMAIL = "verwijder" + STAMP + "@test.nl";

(async () => {
  const browser = await launchBrowser();
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

  // gewone taak toevoegen
  await page.click("#composeToggle");
  await page.fill("#taskInput", "Boodschappen doen");
  await page.click("#addBtn");
  await page.waitForTimeout(800);

  // dagelijkse taak toevoegen
  await page.fill("#taskInput", "Mediteren");
  await page.check("#dailyInput");
  await page.click("#addBtn");
  await page.waitForTimeout(800);

  results.beforeDelete = await page.locator("#taskList li .task-text").allTextContents();

  // klik op x van de gewone taak: verwacht bevestigingsrij, geen directe verwijdering
  // (elementHandle vastpakken vóór de klik, want de li-tekst verandert erna)
  const normalLi = await page.locator("#taskList li", { hasText: "Boodschappen doen" }).first().elementHandle();
  await (await normalLi.$(".del-btn")).click();
  await page.waitForTimeout(300);
  results.confirmMsgNormal = await (await normalLi.$(".confirm-msg")).textContent();
  results.stillThereAfterFirstClick = await page.locator("#taskList li .task-text").allTextContents();

  // annuleren: taak moet blijven staan, gewone rij terug
  await (await normalLi.$(".confirm-no")).click();
  await page.waitForTimeout(300);
  results.afterCancel = await page.locator("#taskList li .task-text").allTextContents();
  results.delBtnBackAfterCancel = await page.locator("#taskList li:has-text('Boodschappen doen') .del-btn").isVisible();

  // nu echt verwijderen (nieuwe handle, DOM is herbouwd na cancel)
  const normalLi2 = await page.locator("#taskList li", { hasText: "Boodschappen doen" }).first().elementHandle();
  await (await normalLi2.$(".del-btn")).click();
  await page.waitForTimeout(300);
  await (await normalLi2.$(".confirm-yes")).click();
  await page.waitForTimeout(800);
  results.afterConfirmDelete = await page.locator("#taskList li .task-text").allTextContents();

  // dagelijkse taak: bevestigingstekst moet waarschuwen voor de hele reeks
  const dailyLi = await page.locator("#taskList li", { hasText: "Mediteren" }).first().elementHandle();
  await (await dailyLi.$(".del-btn")).click();
  await page.waitForTimeout(300);
  results.confirmMsgDaily = await (await dailyLi.$(".confirm-msg")).textContent();

  await page.screenshot({ path: "/tmp/verwijder_bevestiging.png", fullPage: true });

  // niet bevestigen, gewoon laten staan (voor de zekerheid)
  await (await dailyLi.$(".confirm-no")).click();
  await page.waitForTimeout(300);
  results.dailyStillThere = await page.locator("#taskList li .task-text").allTextContents();

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error("TEST FAILED:", e); process.exit(1); });
