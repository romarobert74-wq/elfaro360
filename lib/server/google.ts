import "server-only";
import { google } from "googleapis";
import type { drive_v3 } from "googleapis";

/**
 * Credenciales de la cuenta de servicio de Google.
 * La clave privada suele venir con "\n" escapados (en Vercel se pega en una
 * sola línea), así que los normalizamos a saltos de línea reales.
 */
function getCredentials() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;
  if (!clientEmail || !rawKey) {
    throw new Error(
      "Faltan GOOGLE_SERVICE_ACCOUNT_EMAIL o GOOGLE_PRIVATE_KEY en las variables de entorno."
    );
  }
  const privateKey = rawKey.replace(/\\n/g, "\n");
  return { clientEmail, privateKey };
}

export function getProjectId(): string {
  const id = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!id) throw new Error("Falta FIREBASE_PROJECT_ID / NEXT_PUBLIC_FIREBASE_PROJECT_ID.");
  return id;
}

let driveClient: drive_v3.Drive | null = null;

/** Cliente de Google Drive autenticado con la cuenta de servicio (solo lectura + crear accesos directos). */
export function getDrive(): drive_v3.Drive {
  if (driveClient) return driveClient;
  const { clientEmail, privateKey } = getCredentials();
  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  driveClient = google.drive({ version: "v3", auth });
  return driveClient;
}

export { getCredentials };
