import "server-only";
import { adminAuth, adminDb } from "./firebaseAdmin";

export interface AdminOk {
  ok: true;
  uid: string;
  email: string;
  role: string;
}
export interface AdminFail {
  ok: false;
  status: number;
  message: string;
}

const ROLES_PICTURES_DEFAULT = new Set(["super_admin", "admin"]);

/**
 * Verifica que el request venga de un usuario del admin autenticado y con
 * permiso para "pictures". El cliente manda el ID token de Firebase en el
 * header Authorization: Bearer <token>.
 */
export async function requirePicturesAdmin(req: Request): Promise<AdminOk | AdminFail> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, message: "Falta el token de autenticación." };

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch {
    return { ok: false, status: 401, message: "Token inválido o vencido." };
  }
  const email = (decoded.email || "").toLowerCase();
  if (!email) return { ok: false, status: 401, message: "El token no tiene email." };

  const db = adminDb();
  // Buscar la ficha de usuario por email (igual que el front).
  const snap = await db.collection("users").where("email", "==", email).limit(1).get();
  let user: Record<string, unknown> | undefined = snap.docs[0]?.data();
  if (!user) {
    // Reintento tolerante a mayúsculas/espacios.
    const all = await db.collection("users").get();
    user = all.docs
      .map((d) => d.data())
      .find((u) => String(u.email || "").trim().toLowerCase() === email);
  }
  if (!user || user.activo === false) {
    return { ok: false, status: 403, message: "Usuario no autorizado o inactivo." };
  }
  const role = String(user.role || "");

  // Permiso: matriz guardada (meta/permissions) o, si no existe, roles por defecto.
  let permitido = ROLES_PICTURES_DEFAULT.has(role);
  try {
    const perms = await db.collection("meta").doc("permissions").get();
    const matrix = perms.exists ? (perms.data() as Record<string, Record<string, { view?: boolean }>>) : null;
    const flag = matrix?.[role]?.pictures?.view;
    if (typeof flag === "boolean") permitido = flag;
  } catch {
    /* usa el default */
  }
  if (!permitido) return { ok: false, status: 403, message: "Sin permiso para Selección Pictures." };

  return { ok: true, uid: decoded.uid, email, role };
}
