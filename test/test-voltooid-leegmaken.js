const { chromium } = require("playwright");

const STAMP = Date.now();
const EMAIL = "leegmaken" + STAMP + "@test.nl";

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const results = {};

  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8090/");

  await page.click("#loginModeBtn");
  await page.fill("#loginName", "Leegmaaktest");
  await page.fill("#loginUser", EMAIL);
  await page.fill("#loginPass", "wachtwoord123");
  await page.click("#loginBtn");
  await page.waitForSelector("#appView:not([hidden])", { timeout: 15000 });

  // Nog niets voltooid: het paneel is leeg, dus geen prullenbak-knop.
  results.knopBijStartVerborgen = await page.isHidden("#doneActionsRow");

  // "Doelen behaald" openklappen, zodat we de grafiek/leeg-tekst kunnen zien.
  await page.click("#goalsToggle");

  // Vink twee voorbeeldtaken af.
  const checks = page.locator("#taskList .task .check");
  await checks.nth(0).click();
  await checks.nth(0).click(); // na de eerste klik schuift de lijst op; opnieuw index 0 pakken
  await page.waitForTimeout(300);

  await page.click("#donePanel summary");
  results.voltooidLabelNaAfvinken = await page.textContent("#doneCount");
  results.knopZichtbaarNaAfvinken = await page.isVisible("#doneActionsRow .done-clear-btn");
  results.grafiekZichtbaarNaAfvinken = await page.isHidden("#goalsChartWrap") === false;

  // Klik op de prullenbak: verwacht een bevestiging, nog geen verwijdering.
  await page.click("#doneActionsRow .done-clear-btn");
  results.bevestigingTekst = await page.textContent("#doneActionsRow .confirm-msg");
  results.nogSteedsTweeVoltooid = await page.textContent("#doneCount");

  // Annuleren: knop moet terugkomen, niets verwijderd.
  await page.click("#doneActionsRow .confirm-no");
  results.naAnnulerenNogVoltooid = await page.textContent("#doneCount");
  results.knopTerugNaAnnuleren = await page.isVisible("#doneActionsRow .done-clear-btn");

  // Opnieuw klikken en nu echt bevestigen.
  await page.click("#doneActionsRow .done-clear-btn");
  await page.click("#doneActionsRow .confirm-yes");
  await page.waitForTimeout(500);

  results.voltooidNaBevestigen = await page.textContent("#doneCount");
  results.knopVerborgenNaLeegmaken = await page.isHidden("#doneActionsRow");
  results.grafiekVerborgenNaLeegmaken = await page.isHidden("#goalsChartWrap");
  results.grafiekLegeMelding = await page.isHidden("#goalsEmpty") === false;

  // De actieve (niet-voltooide) taken zijn onaangeroerd.
  results.actieveTakenNogAanwezig = await page.locator("#taskList .task").count();

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error("TEST FAILED:", e); process.exit(1); });
