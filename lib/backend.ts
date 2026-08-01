// Selector de backend de datos.
// - "mock"     (default): arrays en memoria — Fase 1, funciona sin configurar nada.
// - "firebase" : Firestore — Fase 2, se activa con NEXT_PUBLIC_DATA_BACKEND=firebase
//   y las credenciales NEXT_PUBLIC_FIREBASE_* cargadas.
export const DATA_BACKEND =
  (process.env.NEXT_PUBLIC_DATA_BACKEND as "mock" | "firebase" | undefined) ?? "mock";

export const isFirebaseBackend = DATA_BACKEND === "firebase";
