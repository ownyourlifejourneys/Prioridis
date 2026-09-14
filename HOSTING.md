# Firebase Hosting: eenmalige koppeling

Prioridis wordt niet meer via Netlify gehost, maar via Firebase Hosting
(hetzelfde Firebase-project dat al voor inloggen en Firestore wordt
gebruikt: `priodis`). Dit bestand beschrijft de eenmalige koppeling in
Terminal. Daarna volstaat bij elke update `firebase deploy --only hosting`
(zie `README.md`, werkwijze bij een wijziging, stap 4).

## Eenmalige koppeling

1. Open Terminal en ga naar je lokale kopie van de repository:

   ```
   cd ~/Documents/Prioridis
   ```

   (of het pad waar je de repo lokaal hebt staan)

2. Zorg dat `firebase.json` en `.firebaserc` in de hoofdmap van de repo
   staan (ze horen bij `prioridis-repo-update-14.zip`, sleep ze net als de
   andere bestanden in de juiste map).

3. Log eenmalig in bij Firebase vanuit Terminal:

   ```
   firebase login
   ```

   Er opent een browservenster. Log in met het Google-account dat bij het
   Firebase-project `priodis` hoort en geef toestemming.

4. Doe de eerste deploy:

   ```
   firebase deploy --only hosting
   ```

   Firebase toont aan het einde een "Hosting URL", bijvoorbeeld
   `https://priodis.web.app` of `https://priodis.firebaseapp.com`. Open die
   link en controleer dat Prioridis het doet.

## Vanaf nu

Bij elke inhoudelijke wijziging (na `python3 scripts/build-site.py`):

```
firebase deploy --only hosting
```

Dit vervangt het slepen van een zip-bestand naar het Netlify Deploys-
tabblad volledig.

## Eigen domein (optioneel)

Wil je Prioridis op een eigen domeinnaam laten draaien in plaats van
`priodis.web.app`? Dat kan gratis bij Firebase Hosting. Ga naar de Firebase
Console, open het project `priodis`, ga naar Hosting, en kies "Aangepast
domein toevoegen". Firebase geeft dan DNS-instellingen die je bij je
domeinregistrar invult.

## Netlify opzeggen

Zodra de eerste Firebase-deploy bevestigd werkt, kan de Netlify-site
gepauzeerd of verwijderd worden. Dat voorkomt dat je later per ongeluk
weer met verouderde Netlify-credits te maken krijgt.
