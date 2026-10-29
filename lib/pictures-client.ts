"use client";

export interface SocioDrive {
  id: string;
  nombre: string;
}

export interface ExplorarData {
  folderId: string;
  nombre: string;
  folders: SocioDrive[];
  fotosCount: number;
  esRaiz: boolean;
}

/** Explora una carpeta de Drive (sin folderId = raíz). */
export async function fetchExplorar(folderId?: string): Promise<ExplorarData> {
  const url = folderId ? `/api/pictures/explorar?folderId=${encodeURIComponent(folderId)}` : "/api/pictures/explorar";
  const res = await fetch(url);
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Error al leer la carpeta.");
  return await res.json();
}

/** Token del link = base64url(folderId). Las carpetas ya son públicas. */
export function tokenDeFolder(folderId: string): string {
  const b64 = btoa(unescape(encodeURIComponent(folderId)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** URL pública del socio para compartir. */
export function linkDeSocio(folderId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/seleccion/${tokenDeFolder(folderId)}`;
}
