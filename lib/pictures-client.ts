"use client";

export interface SocioDrive {
  id: string;
  nombre: string;
}

/** Lista las carpetas de socios desde Drive (vía API key del servidor). */
export async function fetchSocios(): Promise<SocioDrive[]> {
  const res = await fetch("/api/pictures/socios");
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Error al listar socios.");
  return (await res.json()).socios ?? [];
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
