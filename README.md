# Lokale testopstelling

Deze map draait Prioridis lokaal, zonder een echte Firestore-verbinding, zodat
je wijzigingen kunt testen zonder de live data te raken.

Wat hier gebeurt:
- Een echte Firebase Auth-emulator regelt inloggen/registreren/wachtwoord
  vergeten.
- Een nagemaakte Firestore-server (`server.js`, met bijpassende
  clientshim `firebase-firestore-fake.js`) speelt voor taken en instellingen.
  Dit is nodig omdat de echte Firestore-emulator in sommige omgevingen niet
  gedownload kan worden.

## Eenmalig

Vanuit deze map (`test/`):

```
npm install -g firebase-tools     # de Auth-emulator
npm install                       # Playwright, via package.json
npx playwright install chromium   # de browser die Playwright aanstuurt
```

Node.js (inclusief npm) moet al op je computer staan. Test dat met
`node --version` in Terminal; staat er niets, installeer Node.js eerst via
nodejs.org.

## Bij elke testronde

1. Bouw de testpagina opnieuw op na een wijziging in `src/prioridis.html`:
   ```
   cd ..
   python3 scripts/build-test-page.py
   cd test
   ```
2. Start de Auth-emulator (in een apart terminalvenster of op de achtergrond):
   ```
   firebase emulators:start --only auth --project demo-priodis
   ```
   Wacht op de regel "All emulators ready!" voordat je verdergaat.
3. Start de nagemaakte Firestore-server:
   ```
   node server.js
   ```
4. Draai de hele testreeks in één keer:
   ```
   npm test
   ```
   Of één losse test, bijvoorbeeld tijdens het uitzoeken van een probleem:
   ```
   node test-account-isolatie.js
   ```
   De losse scripts: `test-account-isolatie.js`, `test-dagelijkse-taken.js`,
   `test-genz-layout.js`, `test-wachtwoord-vergeten.js`,
   `test-verwijder-bevestiging.js`, `test-race-condition.js`,
   `test-foutregistratie.js`, `test-voltooid-leegmaken.js`.

Elk script opent de app op `http://127.0.0.1:8090/`, doorloopt een scenario,
en drukt de waargenomen resultaten af als JSON. Er is geen ingebouwde
pass/fail-vergelijking: lees de uitkomst en vergelijk die met wat je
verwacht.

## Bekende, onschuldige meldingen

- Een `pkill`-commando om de nagemaakte server te stoppen geeft vaak exit
  code 144 zonder verdere melding. Dat is normaal; controleer daarna of het
  proces echt weg is voordat je verdergaat.
- De Auth-emulator kan tussentijds stoppen. Controleer met
  `curl http://127.0.0.1:9099/`: krijg je geen antwoord, start de emulator
  opnieuw en wacht op "All emulators ready!" (dit kan een paar tellen duren).

## Bestanden in deze map

- `server.js`, `firebase-firestore-fake.js`: de nagemaakte Firestore-laag.
- `firebase-app-compat.js`, `firebase-auth-compat.js`: meegeleverde
  Firebase-scripts voor de emulator-verbinding.
- `head-template.html`: de kop die `build-test-page.py` gebruikt.
- `index.html`: gebouwd bestand, nooit rechtstreeks bewerken.
- `firestore.rules` verwijst voor de zekerheid naar `../site/firestore.rules`
  (zie `firebase.json`), al gebruikt de nagemaakte server geen echte regels.
- `test-*.js`: de Playwright-testscripts, één per functionaliteit.
- `package.json`: declareert Playwright als afhankelijkheid, zodat `npm
  install` in deze map alles ophaalt wat de testscripts nodig hebben.
