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

```
npm install -g firebase-tools   # als firebase nog niet beschikbaar is
```

Playwright (voor de testscripts) moet beschikbaar zijn als `node_modules` of
globaal; dit project verwacht een werkende `require("playwright")`.

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
4. Draai een testscript:
   ```
   node test-account-isolatie.js
   node test-dagelijkse-taken.js
   node test-genz-layout.js
   node test-wachtwoord-vergeten.js
   node test-verwijder-bevestiging.js
   node test-race-condition.js
   ```

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
