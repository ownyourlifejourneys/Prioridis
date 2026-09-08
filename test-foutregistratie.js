const { launchBrowser } = require("./launch-browser");

const STAMP = Date.now();
const EMAIL = "foutlog" + STAMP + "@test.nl";
const BAD_EMAIL = "onbekend" + STAMP + "@test.nl";

(async () => {
  const browser = await launchBrowser();
  const results = {};

  const page = await browser.newPage();
  await page.goto("http://127.0.0.1:8090/");

  // 1) Mislukte inlogpoging op een niet-bestaand account moet gelogd worden,
  //    ook al is er op dat moment nog geen ingelogde gebruiker (uid null).
  await page.fill("#loginUser", BAD_EMAIL);
  await page.fill("#loginPass", "watdanook123");
  await page.click("#loginBtn");
  await page.waitForSelector("#loginError:not([hidden])", { timeout: 15000 });

  await page.waitForTimeout(500); // logschrijfactie is fire-and-forget

  const afterFailedLogin = await page.evaluate(async () => {
    const r = await fetch("/fsfake-collection/errorLogs");
    return r.json();
  });
  results.foutenNaMislukteLogin = afterFailedLogin.docs.length;
  results.eersteFoutContext = afterFailedLogin.docs.length ? afterFailedLogin.docs[0].data.context : null;
  results.eersteFoutHeeftUid = afterFailedLogin.docs.length ? afterFailedLogin.docs[0].data.uid : "geen entry";

  // 2) Registreer een echt account, forceer daarna een taak-opslagfout door
  //    de fake Firestore-server een 500 te laten geven, en controleer dat
  //    ook die fout gelogd wordt, nu mét uid.
  await page.reload();
  await page.click("#loginModeBtn");
  await page.fill("#loginName", "Foutentest");
  await page.fill("#loginUser", EMAIL);
  await page.fill("#loginPass", "wachtwoord123");
  await page.click("#loginBtn");
  await page.waitForSelector("#appView:not([hidden])", { timeout: 15000 });

  await page.route("**/fsfake/priodisUsers/**/tasks/**", (route) => {
    if (route.request().method() === "PUT") {
      route.fulfill({ status: 500, body: "kunstmatige fout voor test" });
    } else {
      route.continue();
    }
  });

  await page.click("#composeToggle");
  await page.fill("#taskInput", "Taak die zal mislukken");
  await page.click("#addBtn");
  await page.waitForTimeout(800);

  const afterFailedSave = await page.evaluate(async () => {
    const r = await fetch("/fsfake-collection/errorLogs");
    return r.json();
  });
  const savingErrors = afterFailedSave.docs.filter((d) => d.data.context === "taak toevoegen");
  results.foutenNaMislukteTaakOpslag = savingErrors.length;
  results.taakFoutHeeftUid = savingErrors.length ? !!savingErrors[savingErrors.length - 1].data.uid : "geen entry";

  // 3) Basiscontrole op het formaat van een entry: geen lange strings, geen
  //    ontbrekende velden.
  const sample = afterFailedSave.docs[0].data;
  results.velden = Object.keys(sample).sort();
  results.berichtBinnenLimiet = typeof sample.message === "string" && sample.message.length <= 500;

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => { console.error("TEST FAILED:", e); process.exit(1); });
