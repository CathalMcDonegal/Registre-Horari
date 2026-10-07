# Guia: publicar Registre Horari a Google Play

## Fitxers d’aquest paquet

| Fitxer | Ús |
|--------|-----|
| `privacitat.html` | Política de privadesa (obligatòria a Play) |
| `well-known/assetlinks.json` | Verificació TWA (cal omplir el SHA-256) |
| `manifest.json` | Manifest PWA millorat per empaquetar |
| `index.html` / `sw.js` | App |

URL pública prevista (GitHub Pages del projecte):

- App: `https://cathalmcdonegal.github.io/Registre-Horari/`
- Privadesa: `https://cathalmcdonegal.github.io/Registre-Horari/privacitat.html`

## Pas 1 — Puja els fitxers al GitHub

1. Al repo `Registre-Horari`, afegeix:
   - `privacitat.html` (arrel del repo)
   - `manifest.json` actualitzat
   - `index.html` i `sw.js` (versió actual)
2. **assetlinks.json** (important a GitHub Pages):
   - Si tens un repo **user site** `cathalmcdonegal.github.io`, crea-hi:
     `/.well-known/assetlinks.json`
   - Si només tens el projecte `Registre-Horari`, prova també:
     `/Registre-Horari/.well-known/assetlinks.json`
     (alguns fluxos TWA miren el path de l’app; Bubblewrap et dirà l’URL exacta).

## Pas 2 — Icones 192 i 512

El manifest demana `icons/icon-192.png` i `icons/icon-512.png`.
Si només tens `app-icon.png`, genera les mides 192 i 512 (PWA Builder també et pot ajudar).

## Pas 3 — Compte Google Play

1. https://play.google.com/console → pagar **25 USD** (únic).
2. Crear app → nom **Registre Horari**, idioma predeterminat **català**.

## Pas 4 — Generar l’AAB (Android App Bundle)

### Opció recomanada: PWA Builder
1. https://www.pwabuilder.com
2. Introdueix: `https://cathalmcdonegal.github.io/Registre-Horari/`
3. Package → Android → descarrega el projecte / AAB
4. Anota el **package name** (p.ex. `cat.mossos.registrehorari`) i el **SHA-256**

### Opció tècnica: Bubblewrap
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://cathalmcdonegal.github.io/Registre-Horari/manifest.json
bubblewrap build
```

## Pas 5 — Completar assetlinks.json

1. A Play Console → la teva app → **Configuració → Integritat de l’app → Signatura de l’app**
2. Copia l’empremta **SHA-256** de la clau de **signatura de l’app** (Play App Signing), no només la d’upload.
3. Enganxa-la a `assetlinks.json` (substitueix el text `SUBSTITUEIX_...`).
4. Assegura’t que `package_name` coincideix amb el de l’AAB.
5. Puja el fitxer i comprova a l’navegador que retorna JSON (codi 200).

## Pas 6 — Fitxa de Play Console

- **Descripció curta** (80 caràcters): p.ex. «Registre d’hores personal per a Mossos. 1580 h, nits, vacances. Dades al dispositiu.»
- **Descripció completa**: funcionalitats + que les dades són locals
- **Política de privadesa**: URL de `privacitat.html`
- **Captures**: mínim 2 pantalles de mòbil (fes captures des del Chrome del mòbil)
- **Icona**: 512×512
- **Categoria**: Productivitat
- **Públic**: 18+ o segons el que indiquis (no orientada a menors)

## Pas 7 — Enviar a revisió

Completa el qüestionari de contingut, països i preu (gratuïta). Envia a revisió.

## Notes

- Actualitzar només el codi a GitHub Pages actualitza el contingut de la TWA sense nova versió a Play (URL fixa).
- Canvis al package nadiu (nom, permisos) sí que requereixen nou AAB a Play.
- iOS / App Store és un procés a part (Apple Developer, ~99 USD/any).
