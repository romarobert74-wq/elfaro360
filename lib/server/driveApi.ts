import "server-only";

/**
 * Acceso a Google Drive con una simple API KEY (sin cuenta de servicio).
 * Requiere que la carpeta raíz y sus subcarpetas estén compartidas como
 * "cualquiera con el enlace puede ver". Lee solo archivos públicos.
 */

const BASE = "https://www.googleapis.com/drive/v3";
const SHARED = "supportsAllDrives=true&includeItemsFromAllDrives=true";

export interface Socio {
  id: string;
  nombre: string;
}
export interface FotoDrive {
  id: string;
  nombre: string;
  width?: number;
  height?: number;
}

function apiKey(): string {
  const k = process.env.GOOGLE_API_KEY;
  if (!k) throw new Error("Falta GOOGLE_API_KEY en las variables de entorno.");
  return k;
}
export function rootFolderId(): string {
  const id = process.env.DRIVE_ROOT_FOLDER_ID;
  if (!id) throw new Error("Falta DRIVE_ROOT_FOLDER_ID en las variables de entorno.");
  return id;
}

async function driveGet(path: string, params: string): Promise<Response> {
  const url = `${BASE}${path}?${params}&${SHARED}&key=${apiKey()}`;
  return fetch(url);
}

/** Subcarpetas de la carpeta raíz = socios. */
export async function listSocios(): Promise<Socio[]> {
  const out: Socio[] = [];
  let pageToken: string | undefined;
  do {
    const q = encodeURIComponent(
      `'${rootFolderId()}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
    );
    const params = `q=${q}&fields=${encodeURIComponent("nextPageToken,files(id,name)")}&orderBy=name&pageSize=200${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await driveGet("/files", params);
    if (!res.ok) throw new Error(`Drive ${res.status}`);
    const data = await res.json();
    for (const f of data.files ?? []) if (f.id && f.name) out.push({ id: f.id, nombre: f.name });
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}

/** Fotos (imágenes) dentro de la carpeta de un socio, sin papelera. */
export async function listFotos(folderId: string): Promise<FotoDrive[]> {
  const out: FotoDrive[] = [];
  let pageToken: string | undefined;
  do {
    const q = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed = false`);
    const fields = encodeURIComponent("nextPageToken,files(id,name,imageMediaMetadata(width,height))");
    const params = `q=${q}&fields=${fields}&orderBy=name&pageSize=200${pageToken ? `&pageToken=${pageToken}` : ""}`;
    const res = await driveGet("/files", params);
    if (!res.ok) throw new Error(`Drive ${res.status}`);
    const data = await res.json();
    for (const f of data.files ?? []) {
      if (!f.id || !f.name) continue;
      out.push({ id: f.id, nombre: f.name, width: f.imageMediaMetadata?.width, height: f.imageMediaMetadata?.height });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return out;
}

/** Nombre de una carpeta (o null). */
export async function getFolderName(folderId: string): Promise<string | null> {
  const res = await driveGet(`/files/${encodeURIComponent(folderId)}`, "fields=name");
  if (!res.ok) return null;
  const data = await res.json();
  return data.name ?? null;
}

/** True si folderId es una subcarpeta de la raíz (socio válido). */
export async function esSocioValido(folderId: string): Promise<boolean> {
  const socios = await listSocios();
  return socios.some((s) => s.id === folderId);
}

/** Padres de un archivo. */
async function getParents(fileId: string): Promise<string[]> {
  const res = await driveGet(`/files/${encodeURIComponent(fileId)}`, "fields=parents");
  if (!res.ok) return [];
  const data = await res.json();
  return data.parents ?? [];
}

/** True si el archivo está dentro de la carpeta indicada. */
export async function fileInFolder(fileId: string, folderId: string): Promise<boolean> {
  try {
    return (await getParents(fileId)).includes(folderId);
  } catch {
    return false;
  }
}

/** Descarga el binario de un archivo público (alt=media). */
export async function downloadFile(fileId: string): Promise<Buffer> {
  const res = await driveGet(`/files/${encodeURIComponent(fileId)}`, "alt=media");
  if (!res.ok) throw new Error(`Drive media ${res.status}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

// ---- Token de link por socio: base64url(folderId). Sin secreto: las carpetas
// ya son públicas (como un link de Drive). Solo sirve para armar/leer la URL. ----
export function decodeToken(token: string): string | null {
  try {
    const pad = token.length % 4 === 0 ? "" : "=".repeat(4 - (token.length % 4));
    const id = Buffer.from(token.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64").toString("utf8");
    return id || null;
  } catch {
    return null;
  }
}
