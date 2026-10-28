import "server-only";
import { getDrive } from "./google";

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

// Opciones comunes para soportar unidades compartidas (Shared Drives).
const SHARED = { supportsAllDrives: true, includeItemsFromAllDrives: true } as const;

function rootFolderId(): string {
  const id = process.env.DRIVE_ROOT_FOLDER_ID;
  if (!id) throw new Error("Falta DRIVE_ROOT_FOLDER_ID en las variables de entorno.");
  return id;
}

/** Subcarpetas de la carpeta raíz = socios. */
export async function listSocios(): Promise<Socio[]> {
  const drive = getDrive();
  const root = rootFolderId();
  const out: Socio[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${root}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: "nextPageToken, files(id, name)",
      orderBy: "name",
      pageSize: 200,
      pageToken,
      ...SHARED,
    });
    for (const f of res.data.files ?? []) {
      if (f.id && f.name) out.push({ id: f.id, nombre: f.name });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return out;
}

/** Fotos (imágenes) dentro de la carpeta de un socio, sin papelera. */
export async function listFotos(folderId: string): Promise<FotoDrive[]> {
  const drive = getDrive();
  const out: FotoDrive[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
      fields: "nextPageToken, files(id, name, imageMediaMetadata(width, height))",
      orderBy: "name",
      pageSize: 200,
      pageToken,
      ...SHARED,
    });
    for (const f of res.data.files ?? []) {
      if (!f.id || !f.name) continue;
      out.push({
        id: f.id,
        nombre: f.name,
        width: f.imageMediaMetadata?.width ?? undefined,
        height: f.imageMediaMetadata?.height ?? undefined,
      });
    }
    pageToken = res.data.nextPageToken ?? undefined;
  } while (pageToken);
  return out;
}

/** Devuelve los padres (carpetas) de un archivo. */
async function getParents(fileId: string): Promise<string[]> {
  const drive = getDrive();
  const res = await drive.files.get({ fileId, fields: "parents", ...SHARED });
  return res.data.parents ?? [];
}

/** True si el archivo está directamente dentro de la carpeta indicada. */
export async function fileInFolder(fileId: string, folderId: string): Promise<boolean> {
  try {
    const parents = await getParents(fileId);
    return parents.includes(folderId);
  } catch {
    return false;
  }
}

/** True si el archivo pertenece a la carpeta de algún socio (bajo la raíz). */
export async function fileInAnySocio(fileId: string): Promise<boolean> {
  try {
    const parents = await getParents(fileId);
    if (parents.length === 0) return false;
    const socios = await listSocios();
    const ids = new Set(socios.map((s) => s.id));
    return parents.some((p) => ids.has(p));
  } catch {
    return false;
  }
}

export interface DescargaArchivo {
  data: Buffer;
  mimeType: string;
  nombre: string;
}

/** Baja el contenido binario de un archivo (alt=media). */
export async function downloadFile(fileId: string): Promise<DescargaArchivo> {
  const drive = getDrive();
  const meta = await drive.files.get({ fileId, fields: "name, mimeType", ...SHARED });
  const res = await drive.files.get(
    { fileId, alt: "media", ...SHARED },
    { responseType: "arraybuffer" }
  );
  return {
    data: Buffer.from(res.data as ArrayBuffer),
    mimeType: meta.data.mimeType ?? "image/jpeg",
    nombre: meta.data.name ?? fileId,
  };
}

function hoyISO(): string {
  // AAAA-MM-DD en horario local del servidor (America/Argentina).
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Crea (dentro de la carpeta del socio) una subcarpeta "Seleccionadas AAAA-MM-DD"
 * con ACCESOS DIRECTOS (shortcuts) a las fotos elegidas, numerados por orden:
 * "01 - nombre.jpg", "02 - ...". No copia los archivos.
 */
export async function crearCarpetaSeleccion(
  folderId: string,
  fotos: { fileId: string; nombre: string; orden: number }[]
): Promise<{ carpetaId: string; carpetaUrl: string }> {
  const drive = getDrive();
  const nombreCarpeta = `Seleccionadas ${hoyISO()}`;
  const carpeta = await drive.files.create({
    requestBody: {
      name: nombreCarpeta,
      mimeType: "application/vnd.google-apps.folder",
      parents: [folderId],
    },
    fields: "id",
    ...SHARED,
  });
  const carpetaId = carpeta.data.id!;
  const ordenadas = [...fotos].sort((a, b) => a.orden - b.orden);
  let i = 1;
  for (const f of ordenadas) {
    const prefijo = String(i).padStart(2, "0");
    await drive.files.create({
      requestBody: {
        name: `${prefijo} - ${f.nombre}`,
        mimeType: "application/vnd.google-apps.shortcut",
        parents: [carpetaId],
        shortcutDetails: { targetId: f.fileId },
      },
      fields: "id",
      ...SHARED,
    });
    i++;
  }
  return { carpetaId, carpetaUrl: `https://drive.google.com/drive/folders/${carpetaId}` };
}
