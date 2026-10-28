import { NextResponse } from "next/server";
import sharp from "sharp";
import { requirePicturesAdmin } from "@/lib/server/apiAuth";
import { verifyToken } from "@/lib/server/selectionToken";
import { downloadFile, fileInAnySocio, fileInFolder } from "@/lib/server/drive";

export const runtime = "nodejs";
// La respuesta define su propio Cache-Control para que la CDN de Vercel la sirva.
export const dynamic = "force-dynamic";

/**
 * Proxy de imágenes de Drive.
 *   GET /api/pictures/img/<fileId>?size=thumb|preview&token=<token>
 * Nunca devuelve el original (Vercel corta >4,5 MB). Redimensiona con sharp.
 * Valida que el fileId pertenezca a una carpeta autorizada antes de servir.
 */
export async function GET(req: Request, { params }: { params: { fileId: string } }) {
  const fileId = params.fileId;
  const { searchParams } = new URL(req.url);
  const size = searchParams.get("size") === "thumb" ? "thumb" : "preview";
  const token = searchParams.get("token");

  // ---- Autorización: el archivo debe estar en una carpeta permitida ----
  let autorizado = false;
  if (token) {
    const folderId = verifyToken(token);
    if (folderId) autorizado = await fileInFolder(fileId, folderId);
  } else {
    const auth = await requirePicturesAdmin(req);
    if (auth.ok) autorizado = await fileInAnySocio(fileId);
  }
  if (!autorizado) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const { data } = await downloadFile(fileId);
    const pipeline = sharp(data, { failOn: "none" }).rotate();
    const out =
      size === "thumb"
        ? await pipeline.resize({ width: 600, withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer()
        : await pipeline
            .resize({ width: 4096, height: 2048, fit: "inside", withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toBuffer();

    return new NextResponse(new Uint8Array(out), {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        // La CDN de Vercel cachea un año; las próximas veces no pega a Drive.
        "Cache-Control": "public, s-maxage=31536000, max-age=86400, immutable",
      },
    });
  } catch (e) {
    console.error("[pictures/img]", fileId, e);
    return NextResponse.json({ error: "No se pudo procesar la imagen." }, { status: 500 });
  }
}
