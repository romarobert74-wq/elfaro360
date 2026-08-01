# Desplegar El Faro 360 en Vercel

Objetivo: poder **ver la app online** desde cualquier navegador, sin instalar
nada en tu compu. Con esto queda funcionando con los **datos mock** (Fase 1).

> Tiempo estimado: 5–10 minutos. No necesitás saber programar.

---

## 1. Requisitos (una sola vez)

- El código ya está en GitHub: **`romarobert74-wq/elfaro360`**, rama
  `claude/elfaro360-dashboard-phase1-13h1el`.
- Una cuenta en **Vercel** (gratis): entrá a https://vercel.com y tocá
  **"Sign Up"** → **"Continue with GitHub"** (usá tu misma cuenta de GitHub).

---

## 2. Importar el proyecto

1. Ya logueado en Vercel, tocá **"Add New…" → "Project"**.
2. Vercel te muestra tus repos de GitHub. Buscá **`elfaro360`** y tocá
   **"Import"**.
   - Si no aparece, tocá **"Adjust GitHub App Permissions"** y dale acceso al
     repo `elfaro360`.
3. En la pantalla de configuración:
   - **Framework Preset:** Next.js (lo detecta solo).
   - **Root Directory:** dejalo como está (`./`).
   - **Build & Output:** no toques nada.
4. **Importante — la rama:** por default Vercel despliega la rama principal.
   Como el trabajo está en `claude/elfaro360-dashboard-phase1-13h1el`, tenés dos
   opciones:
   - **(Recomendado)** Antes de importar, en GitHub hacé un **merge** de esa
     rama a `main` (o Pull Request → Merge). Así Vercel despliega `main`.
   - O bien, luego de importar: **Settings → Git → Production Branch** y poné
     `claude/elfaro360-dashboard-phase1-13h1el`.
5. Tocá **"Deploy"** y esperá ~1–2 minutos.

Cuando termine, Vercel te da una URL tipo **`https://elfaro360.vercel.app`**.
Abrila y ¡vas a ver el login de El Faro 360! 🎉

---

## 3. Cada cambio se publica solo

Cada vez que se suba un commit a la rama de producción, Vercel **redepliega
automáticamente**. No hay que hacer nada más.

---

## 4. ¿Y Firebase?

El deploy anterior funciona con datos mock (se reinician al recargar). Para
pasar a datos reales y persistentes, seguí **`docs/FIREBASE.md`**: creás el
proyecto Firebase, cargás 6 variables de entorno en Vercel, cambiás
`NEXT_PUBLIC_DATA_BACKEND` a `firebase` y corrés el seed. La app ya está
preparada para ese cambio sin tocar código.
