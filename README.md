# Gestión de Servicio Técnico - Bonet (Firestore)

Versión conectada a **Firebase Authentication + Cloud Firestore**.

## Archivos

- `index.html`
- `style.css`
- `app.js`
- `firebase-config.js`
- `README.md`

## Qué hace esta versión

- Login con Google
- Lectura de tickets desde Firestore
- Creación de tickets en Firestore
- Actualización de informe técnico
- Generación de prompt para ChatGPT
- Exportación de informe `.txt`

## Configuración rápida

1. Crea un proyecto en Firebase.
2. Agrega una app web.
3. Habilita Authentication > Google.
4. Crea Firestore Database.
5. Copia tus credenciales en `firebase-config.js`.
6. Sube estos archivos a GitHub Pages.

## Colección usada

`tickets`

## Reglas mínimas sugeridas para pruebas

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /tickets/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Siguiente mejora

- Storage para fotos
- PDF real
- Cloud Functions para OpenAI
- Dashboard por técnico y cliente
