import { NextResponse } from "next/server";
import { requirePicturesAdmin } from "@/lib/server/apiAuth";
import { verifyToken } from "@/lib/server/selectionToken";
import { listFotos } from "@/lib/server/drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lista las fotos de un socio.
 * - Público: ?token=<token firmado>  → resuelve el folderId del token.
 * - Admin:   ?folderId=<id>          → requiere Authorization Bearer.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  let folderId: string | null = null;

  if (token) {
    folderId = verifyToken(token);
    if (!folderId) return NextResponse.json({ error: "Link inválido." }, { status: 404 });
  } else {
    const auth = await requirePicturesAdmin(req);
    if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
    folderId = searchParams.get("folderId");
    if (!folderId) return NextResponse.json({ error: "Falta folderId." }, { status: 400 });
  }

  try {
    const fotos = await listFotos(folderId);
    return NextResponse.json({ fotos });
  } catch (e) {
    console.error("[pictures/fotos]", e);
    return NextResponse.json({ error: "No se pudieron listar las fotos." }, { status: 500 });
  }
}
