"use client";

import { getFirebase } from "@/lib/firebase";

/** Header Authorization con el ID token del usuario logueado (para las APIs admin). */
export async function authHeader(): Promise<Record<string, string>> {
  const { auth } = getFirebase();
  const user = auth?.currentUser;
  if (!user) throw new Error("No hay sesión activa.");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

export interface SocioDrive {
  id: string;
  nombre: string;
}

/** Lista las carpetas de socios en Drive. */
export async function fetchSocios(): Promise<SocioDrive[]> {
  const res = await fetch("/api/pictures/socios", { headers: await authHeader() });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Error al listar socios.");
  return (await res.json()).socios ?? [];
}

/** Genera (y devuelve) el link público firmado de un socio. */
export async function fetchLink(folderId: string): Promise<string> {
  const res = await fetch(`/api/pictures/link?folderId=${encodeURIComponent(folderId)}`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Error al generar el link.");
  return (await res.json()).url as string;
}

/** Token firmado de un socio (para ver miniaturas en el admin vía el proxy). */
export async function fetchToken(folderId: string): Promise<string> {
  const res = await fetch(`/api/pictures/link?folderId=${encodeURIComponent(folderId)}`, {
    headers: await authHeader(),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Error.");
  return (await res.json()).token as string;
}
