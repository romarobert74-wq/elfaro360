import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Token para los links de socios SIN base de datos: el token lleva el folderId
 * y una firma HMAC-SHA256. No se puede falsificar sin conocer el secreto.
 * Formato (base64url):  base64url(folderId) + "." + base64url(hmac)
 */

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function getSecret(): string {
  const secret = process.env.SELECTION_LINK_SECRET;
  if (!secret) throw new Error("Falta SELECTION_LINK_SECRET en las variables de entorno.");
  return secret;
}

function sign(folderId: string): string {
  return b64url(createHmac("sha256", getSecret()).update(folderId).digest());
}

/** Genera el token firmado para una carpeta (socio). */
export function makeToken(folderId: string): string {
  return `${b64url(Buffer.from(folderId, "utf8"))}.${sign(folderId)}`;
}

/** Valida el token y devuelve el folderId, o null si la firma no coincide. */
export function verifyToken(token: string): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  let folderId: string;
  try {
    folderId = fromB64url(parts[0]!).toString("utf8");
  } catch {
    return null;
  }
  if (!folderId) return null;
  const expected = sign(folderId);
  const a = Buffer.from(expected);
  const b = Buffer.from(parts[1]!);
  if (a.length !== b.length) return null;
  try {
    if (!timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  return folderId;
}
