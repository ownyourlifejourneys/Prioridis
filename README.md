# Prioridis

Prioridis is een prioriteiten-gebaseerde to-do-app in het Nederlands, gebouwd
voor Own Your Life Journeys. De app draait op Firebase (Authentication +
Firestore) en wordt gehost via Netlify.

## Mapstructuur

- `src/prioridis.html`
  De bewerkbare bron. Bevat de `<style>` en de volledige app-inhoud
  (inlogscherm, appscherm, script). Dit bestand heeft geen eigen `<head>` met
  echte bestandslinks: dat komt pas bij het bouwen.

- `site/`
  De daadwerkelijk gehoste site.
  - `site/index.html` is een gebouwd bestand: `scripts/build-site.py` zet
    `site/head-template.html` + de inhoud van `src/prioridis.html` +
    `site/tail-template.html` aan elkaar. Bewerk `site/index.html` dus nooit
    rechtstreeks, dat wordt bij de volgende build overschreven.
  - `site/head-template.html` en `site/tail-template.html` bevatten wat uniek
    is voor de gehoste site: paginatitel, meta-tags, manifest-link, de
    Firebase-scripts van gstatic.com, en de service-worker-registratie.
  - `site/manifest.json`, `site/sw.js`, `site/icon-*.png`: overige
    site-bestanden.
  - `site/firestore.rules`: de Firestore-beveiligingsregels. Bij elke nieuwe
    subcollectie (zoals `tasks`) moet hier een eigen `match`-blok bij; regels
    erven niet automatisch over naar subcollecties.

- `scripts/`
  - `build-site.py`: bouwt `site/index.html` uit `src/prioridis.html`. Draai
    dit na elke wijziging in `src/prioridis.html` en zet de nieuwe
    `site/index.html` (samen met de rest van `site/`) op Netlify.
  - `build-test-page.py`: bouwt `test/index.html` uit `src/prioridis.html`,
    voor de lokale testopstelling.

- `test/`
  Lokale testopstelling: een Firebase Auth-emulator (echt) plus een
  nagemaakte Firestore-server, en Playwright-testscripts die de app
  end-to-end doorlopen. Zie `test/README.md`.

## Werkwijze bij een wijziging

1. Bewerk `src/prioridis.html`.
2. Draai `python3 scripts/build-test-page.py` en test lokaal (zie
   `test/README.md`).
3. Draai `python3 scripts/build-site.py` om `site/index.html` bij te werken.
4. Zet de inhoud van `site/` op Netlify (of, als Netlify aan deze
   git-repository is gekoppeld, commit en push).
5. Als de wijziging Firestore-structuur raakt: werk ook
   `site/firestore.rules` bij en zet de nieuwe regels in de Firebase Console.

## Werkwijze bij een nieuw ontwerp of nieuwe stijl

Voor een nieuwe visuele richting (een nieuwe laag zoals eerder GenZ of GenX,
een andere kleurstelling, een nieuw scherm) geldt een tussenstap vóór de
volledige bouw: eerst een korte beschrijving of een schermafbeelding-schets
ter goedkeuring, pas daarna de echte implementatie in `src/prioridis.html`.

Aanleiding: de GenX-huisstijl werd destijds volledig gebouwd, getest en
uitgeleverd, en binnen één bericht weer teruggedraaid omdat hij achteraf te
weinig onderscheidend bleek. Die tussenstap had dat werk voorkomen.

Dit geldt niet voor kleine, functionele wijzigingen (een knop, een bugfix,
een nieuw veld) — alleen voor iets dat de app anders laat aanvoelen of
eruitzien dan wat er al staat.
