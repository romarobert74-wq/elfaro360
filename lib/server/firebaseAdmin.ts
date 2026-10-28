import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getCredentials, getProjectId } from "./google";

/**
 * Inicializa el Admin SDK de Firebase usando la MISMA cuenta de servicio que
 * usamos para Drive. Debe tener acceso a Firestore en la consola de Google
 * Cloud (rol "Editor" o "Cloud Datastore User" sobre el proyecto).
 */
let app: App | null = null;

function getApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length) {
    app = existing[0]!;
    return app;
  }
  const { clientEmail, privateKey } = getCredentials();
  app = initializeApp({
    credential: cert({ projectId: getProjectId(), clientEmail, privateKey }),
  });
  return app;
}

export function adminDb(): Firestore {
  return getFirestore(getApp());
}

export function adminAuth(): Auth {
  return getAuth(getApp());
}
