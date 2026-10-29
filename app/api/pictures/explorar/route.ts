import { NextResponse } from "next/server";
import { getFolderName, listFotos, listSocios, listSubfolders, rootFolderId } from "@/lib/server/driveApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Explorador de carpetas (admin). Devuelve las subcarpetas, la cantidad de
 * fotos y el nombre de la carpeta actual. Sin folderId = carpeta raíz.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const folderId = searchParams.get("folderId") || rootFolderId();
  const esRaiz = folderId === rootFolderId();

  try {
    const [folders, fotos, nombre] = await Promise.all([
      esRaiz ? listSocios() : listSubfolders(folderId),
      listFotos(folderId),
      getFolderName(folderId),
    ]);
    return NextResponse.json({ folderId, nombre: nombre ?? "Carpeta", folders, fotosCount: fotos.length, esRaiz });
  } catch (e) {
    console.error("[pictures/explorar]", e);
    return NextResponse.json({ error: "No se pudo leer la carpeta." }, { status: 500 });
  }
}
