import { NextResponse } from "next/server";
import { esDescendienteDeRaiz, getFolderName, listFotos, listSocios, listSubfolders, rootFolderId } from "@/lib/server/driveApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Explorador de carpetas (admin). Devuelve las subcarpetas, la cantidad de
 * fotos y el nombre de la carpeta actual. Sin folderId = carpeta raíz.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId") || "";

  try {
    if (!folderId) {
      // Raíz
      const [folders, fotos] = await Promise.all([listSocios(), listFotos(rootFolderId())]);
      return NextResponse.json({ folderId: rootFolderId(), nombre: (await getFolderName(rootFolderId())) ?? "Raíz", folders, fotosCount: fotos.length, esRaiz: true });
    }
    if (!(await esDescendienteDeRaiz(folderId))) {
      return NextResponse.json({ error: "Carpeta fuera de la raíz." }, { status: 403 });
    }
    const [folders, fotos, nombre] = await Promise.all([
      listSubfolders(folderId),
      listFotos(folderId),
      getFolderName(folderId),
    ]);
    return NextResponse.json({ folderId, nombre: nombre ?? "Carpeta", folders, fotosCount: fotos.length, esRaiz: folderId === rootFolderId() });
  } catch (e) {
    console.error("[pictures/explorar]", e);
    return NextResponse.json({ error: "No se pudo leer la carpeta." }, { status: 500 });
  }
}
