# El Faro 360 — Sistema de Gestión

Sistema de administración para **El Faro 360**, empresa de virtualización de espacios en 360° (real estate y turismo: bodegas, hoteles, restaurantes).

> **Fase 1 (actual):** UI completa con **datos mock en memoria**. No hay backend todavía — el objetivo es validar la UX de punta a punta. Firebase se conecta en la **Fase 2**.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (modo oscuro por default + toggle claro)
- Tipografías: **Space Grotesk** (títulos) · **Inter** (cuerpo)
- Sin dependencias de UI externas (iconos y componentes propios)

## Cómo correr

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

En el login, elegí cualquier usuario para entrar. Podés cambiar de rol en
caliente desde el **switcher del header** para ver cómo cambia el sidebar y
los permisos.

## Identidad visual

- **Azul** `#007FFF` · **Negro** `#050505`
- Acentos "espectro del faro": Rojo `#B81611`, Naranja `#C85311`, Amarillo
  `#EACA1C`, Verde `#267D25`, Navy `#1A2B62`, Violeta `#642A72`
- Complementarios: Robin Egg Blue `#03C2D1`, Ghost White `#F8F8FF`
- Los colores de acento diferencian estados (etapas de producción, tipos de
  servicio, métodos de pago, etc.), no solo azul/gris.

## Estructura

```
app/
  login/                  Pantalla de login (mock)
  (app)/                  Layout con sidebar + auth guard
    page.tsx              Dashboard
    clientes/ destinos/ servicios/ presupuestos/ costos/
    ordenes/ agenda/ empleados/ pagos/ cobros/ reportes/ usuarios/
    configuracion/permisos/
components/
  providers/              StoreProvider (estado + CRUD) · ThemeProvider
  layout/                 Sidebar · Topbar · BottomNav · MobileDrawer · Guard
  ui/                     Componentes base (Modal, DataTable, Badge, etc.)
  presupuestos/           Wizard, ResumenCalculo, VistaCliente
lib/
  mock-data.ts            ⬅ TODOS los datos mock (arrays hardcodeados)
  types.ts                Modelo de dominio
  calc.ts                 Motor de cálculo de presupuestos
  labels.ts               Labels y colores por estado
  nav.ts                  Definición del menú
```

## Módulos

Dashboard · Clientes · Destinos · Servicios · Presupuestos (wizard) · Costos ·
Órdenes de Trabajo (pipeline) · Agenda (calendario) · Empleados · Pagos a
Empleados · Cobros · Reportes · Usuarios y Roles · Permisos.

## Roles y permisos

`super_admin`, `admin`, `empleado` (y `cliente` reservado para Fase 2).
La matriz de permisos se edita en **Configuración › Permisos** y controla en
tiempo real qué módulos ve y edita cada rol.

- **admin:** ve todo.
- **empleado:** ve solo Agenda, Órdenes (las suyas) y Mis Pagos (lo suyo).

## Lógica de negocio destacada (Presupuestos)

- **Traslado automático:** `distancia_km × tarifa/km` (con override manual).
- Cálculo: Mano de Obra + Estructura + Traslado + Garantía % → Mínimo sin
  Margen → Margen % → Materiales Fact. → Subtotal → IVA % → Total.
- **Método de pago** (se filtra según tipo de cliente):
  - *Efectivo / Transferencia:* precio normal, para todos.
  - *Cheque 30/60:* para todos; agrega automáticamente el **Pack x3 panoramas**
    (con aviso visual).
  - *Pago en 2 cuotas:* **solo** para `destino_turistico`; recargo 5% sobre el
    plan base.
- Panel lateral con el **resumen de cálculo en vivo** + **Vista Cliente**
  imprimible (PDF vía diálogo del navegador).

## Desplegar online (Vercel)

Para verla sin instalar nada, desplegala en Vercel. Guía paso a paso en
**[`docs/DESPLIEGUE.md`](docs/DESPLIEGUE.md)**. Funciona directo con datos mock.

## Backend de datos (mock ↔ Firebase)

El sistema soporta dos backends intercambiables vía la variable
`NEXT_PUBLIC_DATA_BACKEND`:

- `mock` (default): arrays en memoria. No requiere configurar nada.
- `firebase`: Firestore. Ver **[`docs/FIREBASE.md`](docs/FIREBASE.md)**.

Ambos implementan la **misma** interfaz `useStore()`, así que migrar a Firebase
**no requiere tocar ninguna página**. Cómo está armado:

```
lib/backend.ts               Lee NEXT_PUBLIC_DATA_BACKEND
AppStoreProvider             Elige StoreProvider (mock) o FirebaseStoreProvider
components/providers/
  store-context.tsx          Interfaz + hook useStore() compartidos
  StoreProvider.tsx          Mock en memoria (Fase 1)
  FirebaseStoreProvider.tsx  Firestore, write-through (Fase 2)
lib/firebase.ts              Init de Firebase por env vars
lib/firestore.ts             CRUD genérico + seed
/configuracion/seed          Botón para migrar los datos mock a Firestore
```

## Próximo (Fase 2)

1. Crear proyecto Firebase + cargar las 6 variables `NEXT_PUBLIC_FIREBASE_*`.
2. Poner `NEXT_PUBLIC_DATA_BACKEND=firebase` y redeploy.
3. Correr el seed desde `/configuracion/seed`.
4. (Opcional) Login real con Firebase Auth — detallado en `docs/FIREBASE.md`.
