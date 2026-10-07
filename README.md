# Registre Horari 2.1 (millores completes)

Versió millorada sobre la 2.0 original de CathalMcDonegal.

## Novetats

### Ja a la 2.1 anterior
- **TIP configurable** (marca d'aigua des de Configuració)
- Missatge amable al còmput quan encara no hi ha hores registrades

### Noves en aquesta versió
- **Mode fosc manual**: Auto (sistema) / Clar / Fosc
- **Recordatori diari**: notificació si a les 18 h encara no has registrat (cal permís del navegador)
- **Exportar PDF / Imprimir**: resum anual + taula de registres (obre finestra i imprimeix / desa com a PDF)
- **Feedback millorat**: toasts amb estil d'èxit i missatges més clars en desar jornades

## Instal·lació
1. Descarrega i descomprimeix el ZIP.
2. Puja `index.html`, `manifest.json` i `sw.js` al repositori de GitHub.
3. Mantén la carpeta `icons/`.
4. GitHub Pages publicarà la nova versió.

Les dades (`localStorage` clau `registreHorariMossos`) es conserven i són compatibles amb la versió anterior.

## Notes
- Les notificacions només funcionen amb permís del navegador i mentre l'app està oberta o en segon pla segons el SO.
- L'export PDF utilitza la impressió del navegador («Desar com a PDF»).
