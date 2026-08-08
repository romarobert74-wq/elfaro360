# Firebase paso a paso — El Faro 360

Guía para conectar El Faro 360 a **Firebase** (base de datos real + login) en un
proyecto **nuevo y exclusivo**, sin mezclar con Mendoza Bureau.

El código ya está listo. Vos hacés los clicks; yo te acompaño con cada captura
que me mandes.

---

## ⚠️ Antes de empezar: sobre la seguridad

- La config de Firebase (`apiKey`, etc.) **va en el frontend, no es un secreto**.
  Es así por diseño de Google.
- La seguridad real la dan **(1) las reglas de Firestore** (nadie sin login toca
  nada) y **(2) el login real (Firebase Auth)**. Ambas ya están implementadas.
- Lo único secreto (claves de servicio/admin) **no se usa en esta app**.

---

## Paso 1 · Crear el proyecto NUEVO

1. Entrá a https://console.firebase.google.com
2. **"Crear un proyecto"** (NO uses `mendoza-bureau`).
3. Nombre: **`el-faro-360`**. Podés desactivar Google Analytics. Crear.

## Paso 2 · Base de datos Firestore

1. Menú izquierdo → **Compilación → Firestore Database → "Crear base de datos"**.
2. Modo **producción**. Región: **`southamerica-east1`** (o la que prefieras).

## Paso 3 · Activar el login (Authentication)

1. Menú → **Compilación → Authentication → "Comenzar"**.
2. En **Sign-in method**, habilitá:
   - **Correo electrónico/contraseña** → Habilitar → Guardar.
   - **Google** → Habilitar → elegí un email de soporte → Guardar.

## Paso 4 · Registrar la app web y copiar la config

1. En la portada del proyecto (ícono ⚙️ → Configuración del proyecto), bajá a
   **"Tus apps"** y tocá el ícono **`</>`** (Web).
2. Apodo: `elfaro360-web`. Registrar app.
3. Copiá los 6 valores del objeto `firebaseConfig`:
   `apiKey`, `authDomain`, `projectId`, `storageBucket`,
   `messagingSenderId`, `appId`.

## Paso 5 · Cargar las variables en Vercel

En Vercel → proyecto **elfaro360** → **Settings → Environment Variables**,
agregá (Production + Preview):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_DATA_BACKEND` | `firebase` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | *(apiKey)* |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | *(authDomain)* |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | *(projectId)* |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | *(storageBucket)* |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | *(messagingSenderId)* |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | *(appId)* |

Después: **Deployments → (último) → Redeploy** para que tome las variables.

## Paso 6 · Publicar las reglas de seguridad

Firestore → pestaña **Reglas** → pegá el contenido del archivo
`firestore.rules` del repo → **Publicar**. Con esto, **solo usuarios logueados**
pueden leer/escribir.

## Paso 7 · Cargar los datos iniciales (seed)

> Para poder loguearte necesitás dos cosas que coincidan por **email**: una
> cuenta en Authentication y una ficha en la colección `users`. El seed crea las
> fichas; vos creás las cuentas.

1. Abrí la app ya en modo Firebase → como todavía no tenés cuenta, primero:
2. **Authentication → Users → "Add user"**: creá tu usuario con el **mismo email**
   que figura en los usuarios semilla, ej. **`roma@elfaro360.com`** (super admin),
   y una contraseña. *(Podés cambiar los emails después.)*
3. Entrá a la app con ese email/contraseña. Vas a ver el mensaje de "cuenta no
   autorizada" hasta que carguemos las fichas → seguí al paso 4.
4. Andá a **`elfaro360.vercel.app/configuracion/seed`** y tocá **"Migrar datos
   mock a Firebase"**. Esto crea la colección `users` (con `roma@elfaro360.com`
   como super_admin) y todo el resto.
5. Recargá: ahora tu cuenta queda vinculada y entrás como Super Admin. 🎉

> Si el paso 4 te bloquea por no estar logueado, avisame y ajustamos el orden
> (podemos permitir el seed la primera vez o cargar el primer user a mano).

## Paso 8 · Dar de alta a tu equipo

- **Con email/contraseña:** en **Authentication → Add user** creás la cuenta, y en
  la app (módulo **Usuarios**) creás la ficha con el **mismo email** y su rol.
- **Con Google:** el empleado entra con "Entrar con Google". Para que tenga
  acceso, su **email de Google** debe existir como ficha en **Usuarios** (con su
  rol). Si no existe, la app le dice "cuenta no autorizada".

---

## Cómo funciona (resumen técnico)

- `NEXT_PUBLIC_DATA_BACKEND=firebase` activa `FirebaseStoreProvider`.
- El login usa **Firebase Auth** (email/contraseña + Google).
- Tras autenticarse, la app busca la ficha en `users` **por email** para saber el
  rol. Sin ficha activa → sin acceso.
- Todas las escrituras van a Firestore (write-through). Las reglas exigen login.

## Endurecer por rol (opcional, más adelante)

Hoy cualquier usuario logueado puede leer/escribir en la base (el control por rol
está en la UI). Para restringir por rol también a nivel base de datos, hay que
guardar el rol por UID y ajustar `firestore.rules` (dejé el ejemplo comentado en
ese archivo). Lo hacemos como paso extra cuando quieras.
