# Conectar Firebase (Fase 2)

La app está preparada para funcionar con **Firestore** sin tocar código: se
activa por variables de entorno. Por default corre en modo **mock** (memoria).

> El código de Firebase ya está escrito (`lib/firebase.ts`, `lib/firestore.ts`,
> `FirebaseStoreProvider`). Falta tu proyecto + probarlo. Seguí estos pasos.

---

## 1. Crear el proyecto Firebase

1. Entrá a https://console.firebase.google.com → **"Crear un proyecto"**.
2. Nombre: `el-faro-360` (o el que quieras). Podés desactivar Google Analytics.
3. Dentro del proyecto, menú izquierdo → **Compilación → Firestore Database** →
   **"Crear base de datos"** → modo **producción** → elegí región
   (ej. `southamerica-east1`).

## 2. Registrar la app web

1. En la portada del proyecto, tocá el ícono **`</>`** (Web).
2. Apodo: `elfaro360-web`. **No** hace falta Hosting. Tocá **"Registrar app"**.
3. Firebase te muestra un objeto `firebaseConfig` con estos valores:
   `apiKey`, `authDomain`, `projectId`, `storageBucket`,
   `messagingSenderId`, `appId`. **Copialos.**

## 3. Cargar las variables de entorno

### En Vercel (para la app online)
Project → **Settings → Environment Variables**. Agregá:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_DATA_BACKEND` | `firebase` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | *(apiKey)* |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | *(authDomain)* |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | *(projectId)* |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | *(storageBucket)* |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | *(messagingSenderId)* |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | *(appId)* |

Después: **Deployments → Redeploy** (para que tome las variables).

### En tu compu (opcional, para desarrollo)
Copiá `.env.local.example` como `.env.local` y completá los mismos valores.

## 4. Reglas de seguridad

En Firestore → **Reglas**, pegá el contenido de `firestore.rules` (incluido en
el repo) y publicá. ⚠️ Las reglas actuales son **abiertas** (modo demo) para
poder cargar datos sin login. Antes de usar en producción, activá el bloque de
ejemplo con `request.auth` que está comentado en ese archivo.

## 5. Cargar los datos iniciales (seed)

1. Entrá a la app (ya en modo Firebase) con el usuario **Super Admin**.
2. Andá a **`/configuracion/seed`** (escribí esa URL después del dominio).
3. Tocá **"Migrar datos mock a Firebase"**. Vas a ver el progreso por colección.
4. Listo: los clientes, servicios, presupuestos, etc. quedan en tu Firestore.

A partir de acá, todo lo que crees/edites/borres en la app se **persiste** en
Firestore y sobrevive a recargas.

---

## 6. Siguiente nivel: login real con Firebase Auth

Hoy el login sigue siendo el selector de usuario (demo). Para autenticación
real:

1. Firebase → **Authentication → Sign-in method** → habilitá **Email/Password**.
2. Reemplazar en `FirebaseStoreProvider` el `login()` por `signInWithEmailAndPassword`
   y mapear el usuario autenticado a su documento en `users` (por `uid`).
3. Ajustar `firestore.rules` al bloque de producción (validando rol).

Eso es un paso acotado y opcional; el resto del sistema ya queda funcionando
con datos reales.

---

## Cómo funciona internamente (resumen técnico)

- `lib/backend.ts` lee `NEXT_PUBLIC_DATA_BACKEND` y decide el provider.
- `AppStoreProvider` renderiza `StoreProvider` (mock) o `FirebaseStoreProvider`.
- Ambos exponen la **misma** interfaz `useStore()`, así que **ninguna página
  cambia** al migrar.
- `FirebaseStoreProvider` carga las colecciones al iniciar y hace *write-through*
  a Firestore en cada alta/edición/baja.
