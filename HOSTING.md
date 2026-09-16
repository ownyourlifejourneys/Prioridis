# Firebase Hosting

Prioridis wordt niet meer via Netlify gehost, maar via Firebase Hosting, op
een eigen site binnen hetzelfde Firebase-project dat al voor inloggen en
Firestore wordt gebruikt (project `priodis`, hosting-site `prioridis`). Dit
bestand beschrijft de koppeling en de vaste link.

## Live link

**https://prioridis.web.app** — dit is de link die testers en toekomstige
gebruikers gebruiken. Niet `priodis.web.app` (dat is de standaardsite van
het Firebase-project zelf, met de verkeerde naam, en wordt niet meer
bijgewerkt).

## Eenmalige koppeling (al gedaan)

Ter referentie, dit is eenmalig ingesteld en hoeft niet herhaald te worden:

1. `firebase login` — inloggen met het Google-account bij project `priodis`.
2. `firebase hosting:sites:create prioridis` — een extra hosting-site
   aangemaakt binnen het project, met de juiste naam.
3. `firebase target:apply hosting prioridis prioridis` — de naam
   `prioridis` in `firebase.json`/`.firebaserc` gekoppeld aan die site.
4. `firebase.json` verwijst met `"target": "prioridis"` naar die koppeling.

## Vanaf nu: bij elke update

Na `python3 scripts/build-site.py`:

```
firebase deploy --only hosting:prioridis
```

Dit vervangt het slepen van een zip-bestand naar het Netlify Deploys-
tabblad volledig. Firebase toont aan het einde de Hosting URL
(`https://prioridis.web.app`) ter bevestiging.

## Eigen domein (optioneel)

Wil je Prioridis op een eigen domeinnaam laten draaien in plaats van
`prioridis.web.app`? Dat kan gratis bij Firebase Hosting. Ga naar de
Firebase Console, open het project `priodis`, ga naar Hosting, kies de site
`prioridis`, en kies "Aangepast domein toevoegen". Firebase geeft dan
DNS-instellingen die je bij je domeinregistrar invult.

## Netlify opzeggen

Zodra `https://prioridis.web.app` bevestigd werkt (en testers zijn
overgestapt), kan de Netlify-site gepauzeerd of verwijderd worden. Dat
voorkomt dat je later per ongeluk weer met verouderde Netlify-credits te
maken krijgt.
