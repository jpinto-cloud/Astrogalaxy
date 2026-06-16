# Astrogalaxy 🌱✨ — Web app con Firebase

Landing de **Astrogalaxy**: retos ambientales escolares con evidencia verificada
por IA, puntos, NFTs y ranking por grados o individual. La página lee el
**ranking** y las **estadísticas** en vivo desde **Firebase Firestore**.

## Lenguajes y tecnología
- **HTML5 / CSS3 / JavaScript** — interfaz de la página.
- **JavaScript (módulos ES)** — conexión a la base de datos.
- **Firebase Firestore** — base de datos en la nube (ranking + estadísticas).
- **Firebase Hosting** — despliegue de la web.

## Estructura
```
.
├── index.html              Estructura de la página
├── style.css               Estilos
├── script.js               Interacciones (menú, dashboard, contadores)
├── firebase-config.js      ← PEGA AQUÍ tus credenciales de Firebase
├── firebase.js             Lee ranking + stats desde Firestore
├── firebase.json           Config de Hosting + Functions
├── functions/              Cloud Function de IA (verifyEvidence)
│   ├── index.js
│   └── package.json
├── .firebaserc             Alias del proyecto
├── firestore.rules         Reglas de seguridad
├── firestore.indexes.json  Índices
└── seed/
    ├── seed-data.json      Datos de ejemplo
    └── seed.js             Script para subirlos a Firestore
```

> Si **no** configuras Firebase, la página funciona igual con datos de
> demostración. Al configurarlo, el ranking y las estadísticas vienen de la BD.

---

## 🚀 Desplegar en Firebase Hosting (paso a paso)

### 1. Crear el proyecto en Firebase
1. Entra a <https://console.firebase.google.com> y crea un proyecto.
2. Crea una base de datos **Firestore** (modo producción).
3. Agrega una app **Web (</>)** y copia el objeto `firebaseConfig`.

### 2. Conectar la página a tu base de datos
Abre **`firebase-config.js`** y reemplaza los valores `TU_...` por los reales
que copiaste. Pon también tu `projectId` en **`.firebaserc`**.

### 3. Instalar la CLI de Firebase (una sola vez)
```bash
npm install -g firebase-tools
firebase login
```

### 4. Cargar los datos de ejemplo en Firestore (opcional pero recomendado)
```bash
cd seed
npm install firebase-admin
# Descarga serviceAccountKey.json desde:
# Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada
node seed.js
cd ..
```

### 5. Publicar las reglas y la web
```bash
firebase deploy --only firestore:rules
firebase deploy --only hosting
```

Al terminar, la CLI te dará tu URL pública, por ejemplo:
`https://TU_PROYECTO.web.app` 🎉

---

## Probar en local
```bash
firebase serve        # o abre index.html con un servidor estático
```
Abrir `index.html` directamente con doble clic también funciona, pero algunos
navegadores bloquean los módulos por CORS; usa un servidor local si ves errores.

---

## 🤖 Verificación de evidencia por IA

Cada reto tiene un botón **"Empezar reto" → "📷 Subir evidencia"**. Al subir la
foto, se llama a un verificador de IA que decide si la imagen cumple el reto y,
si la aprueba, otorga puntos + NFT y marca el reto como cumplido.

La función `askAI()` en `script.js` busca un verificador en este orden:

1. **Google Gemini** (`window.AG_GEMINI_KEY`) — IA real con visión, **gratis**.
2. **Tu backend / Cloud Function** (`window.AG_VERIFY_URL`) — opcional, oculta la clave.
3. **IA integrada del entorno de previsualización** (`window.claude`).
4. **Respaldo local** — si nada está disponible, aprueba en modo demostración
   para que la interfaz nunca se quede bloqueada.

---

## ⭐ Opción GRATIS y recomendada: Google Gemini (sin tarjeta, sin backend)

Gemini tiene una **capa gratuita** y se llama directo desde la web, así que
funciona incluso en **GitHub Pages** sin servidor.

**Pasos:**

1. Entra a <https://aistudio.google.com/app/apikey> (inicia sesión con Google).
2. Pulsa **"Create API key"** y copia la clave.
3. Abre **`script.js`**, arriba encontrarás esta línea:
   ```js
   window.AG_GEMINI_KEY = window.AG_GEMINI_KEY || "";
   ```
   Pega tu clave entre las comillas:
   ```js
   window.AG_GEMINI_KEY = window.AG_GEMINI_KEY || "AIza...tu_clave";
   ```
4. Guarda y sube los archivos a tu hosting. ¡Listo! Cada foto se verifica con IA real. ✨

### 🔒 Protege tu clave de Gemini (importante)
Como la clave queda en la web, restríngela para que solo funcione desde tu sitio:
- En <https://console.cloud.google.com/apis/credentials> abre tu clave.
- En **"Restricciones de aplicación" → "Sitios web"**, agrega el dominio de tu
  sitio (ej. `https://TU_PROYECTO.web.app/*` o `https://TU_USUARIO.github.io/*`).
- En **"Restricciones de API"**, deja solo *Generative Language API*.

Así, aunque alguien vea la clave, no podrá usarla fuera de tu página.

---

## (Opcional) Ocultar la clave en un servidor: Cloud Function

Si prefieres que la clave **no** aparezca en la web, usa la Cloud Function
incluida (`functions/index.js`), que también usa Gemini.

```bash
# 1. Instalar dependencias de la función
cd functions && npm install && cd ..

# 2. Guardar tu clave de Gemini como secreto
firebase functions:secrets:set GEMINI_API_KEY
#   (pega tu clave de https://aistudio.google.com/app/apikey)

# 3. Desplegar la función  (requiere plan Blaze de Firebase)
firebase deploy --only functions
```

Copia la URL que te da (`https://us-central1-TU_PROYECTO.cloudfunctions.net/verifyEvidence`)
y pégala en `script.js` → `window.AG_VERIFY_URL`. Vuelve a desplegar el hosting.

> Mientras no configures ninguna de las dos, la app usa el motor de demostración.
