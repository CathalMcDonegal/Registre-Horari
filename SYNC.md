# Sincronització amb Firebase (5 minuts)

1. Entra a https://console.firebase.google.com → **Afegeix un projecte** (sense Analytics).
2. **Build → Authentication → Comença → Correu electrònic/contrasenya → Activa**.
3. **Build → Firestore Database → Crea base de dades** (mode producció, regió `eur3`).
4. A la pestanya **Regles** enganxa això i prem **Publica**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuaris/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
5. **Configuració del projecte (⚙) → Les teves apps → </> Web** → registra l'app → copia l'objecte `firebaseConfig`.
6. Enganxa'l a `firebase-config.js` (substitueix els valors «PEGA_AQUI»).
7. **Authentication → Configuració → Dominis autoritzats** → afegeix `cathalmcdonegal.github.io`.
8. Puja tots els fitxers a GitHub Pages (inclosos `sync.js`, `firebase-config.js` i `sw.js`).

Cada persona crea el seu compte amb el seu correu: les dades queden a `usuaris/{uid}` i les regles impedeixen veure les d'altri.
