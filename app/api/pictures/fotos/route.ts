import { NextResponse } from "next/server";
import { decodeToken, esDescendienteDeRaiz, getFolderName, listFotos } from "@/lib/server/driveApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Fotos de un socio a partir del token público (?token=). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const folderId = decodeToken(token);
  if (!folderId) return NextResponse.json({ error: "Link inválido." }, { status: 404 });

  try {
    if (!(await esDescendienteDeRaiz(folderId))) {
      return NextResponse.json({ error: "Link inválido." }, { status: 404 });
    }
    const [fotos, socioNombre] = await Promise.all([listFotos(folderId), getFolderName(folderId)]);
    return NextResponse.json({ fotos, socioNombre });
  } catch (e) {
    console.error("[pictures/fotos]", e);
    return NextResponse.json({ error: "No se pudieron cargar las fotos." }, { status: 500 });
  }
}
