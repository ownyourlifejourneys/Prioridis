const { launchBrowser } = require("./launch-browser");

const STAMP = Date.now();
const EMAIL_A = "anna" + STAMP + "@test.nl";
const EMAIL_B = "bram" + STAMP + "@test.nl";

(async () => {
  const browser = await launchBrowser();
  const results = {};

  // --- Gebruiker A: registreren, taak toevoegen ---
  const ctxA = await browser.newContext();
  const pageA = await ctxA.newPage();
  await pageA.goto("http://127.0.0.1:8090/");
  await pageA.click("#loginModeBtn"); // naar registreren
  await pageA.fill("#loginName", "Anna");
  await pageA.fill("#loginUser", EMAIL_A);
  await pageA.fill("#loginPass", "wachtwoord123");
  await pageA.click("#loginBtn");
  await pageA.waitForSelector("#appView:not([hidden])", { timeout: 15000 });
  results.aTitle = await pageA.textContent("#appTitle");

  // taak toevoegen voor Anna
  await pageA.click("#composeToggle");
  await pageA.fill("#taskInput", "Annas geheime taak");
  await pageA.click("#addBtn");
  await pageA.waitForTimeout(1500); // Firestore-schrijfactie laten voltooien
  results.aTasksAfterAdd = await pageA.locator("#taskList li").allTextContents();

  // --- Gebruiker B: registreren, eigen taak, mag Anna's taak niet zien ---
  const ctxB = await browser.newContext();
  const pageB = await ctxB.newPage();
  await pageB.goto("http://127.0.0.1:8090/");
  await pageB.click("#loginModeBtn");
  await pageB.fill("#loginName", "Bram");
  await pageB.fill("#loginUser", EMAIL_B);
  await pageB.fill("#loginPass", "andersWachtwoord9");
  await pageB.click("#loginBtn");
  await pageB.waitForSelector("#appView:not([hidden])", { timeout: 15000 });
  results.bTitle = await pageB.textContent("#appTitle");
  results.bTasksAtStart = (await pageB.locator("#taskList li").allTextContents()).join(" | ");
  results.bSeesAnnasTask = results.bTasksAtStart.includes("Annas geheime taak");

  await pageB.click("#composeToggle");
  await pageB.fill("#taskInput", "Brams eigen taak");
  await pageB.click("#addBtn");
  await pageB.waitForTimeout(1500);
  results.bTasksAfterAdd = await pageB.locator("#taskList li").allTextContents();

  // --- Fout wachtwoord voor bestaand account ---
  const ctxC = await browser.newContext();
  const pageC = await ctxC.newPage();
  await pageC.goto("http://127.0.0.1:8090/");
  await pageC.fill("#loginUser", EMAIL_A);
  await pageC.fill("#loginPass", "helemaalfout");
  await pageC.click("#loginBtn");
  await pageC.waitForSelector("#loginError:not([hidden])", { timeout: 8000 });
  results.wrongPasswordError = await pageC.textContent("#loginError");

  // --- Anna's data blijft na uitloggen + opnieuw inloggen ---
  await pageA.click("#logoutBtn");
  await pageA.waitForSelector("#loginView:not([hidden])", { timeout: 8000 });
  await pageA.fill("#loginUser", EMAIL_A);
  await pageA.fill("#loginPass", "wachtwoord123");
  await pageA.click("#loginBtn");
  await pageA.waitForSelector("#appView:not([hidden])", { timeout: 15000 });
  results.aTasksAfterRelogin = await pageA.locator("#taskList li").allTextContents();

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
})().catch(e => { console.error("TEST FAILED:", e); process.exit(1); });
