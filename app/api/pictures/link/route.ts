import { NextResponse } from "next/server";
import { requirePicturesAdmin } from "@/lib/server/apiAuth";
import { makeToken } from "@/lib/server/selectionToken";
import { listSocios } from "@/lib/server/drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Devuelve el token firmado y la URL pública para un socio (carpeta). */
export async function GET(req: Request) {
  const auth = await requirePicturesAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId") || "";
  if (!folderId) return NextResponse.json({ error: "Falta folderId." }, { status: 400 });

  // Validar que folderId sea realmente una carpeta de socio (bajo la raíz).
  try {
    const socios = await listSocios();
    const socio = socios.find((s) => s.id === folderId);
    if (!socio) return NextResponse.json({ error: "Carpeta de socio no encontrada." }, { status: 404 });
    const token = makeToken(folderId);
    const origin = req.headers.get("origin") || new URL(req.url).origin;
    return NextResponse.json({ token, url: `${origin}/seleccion/${token}`, socio });
  } catch (e) {
    console.error("[pictures/link]", e);
    return NextResponse.json({ error: "No se pudo generar el link." }, { status: 500 });
  }
}
