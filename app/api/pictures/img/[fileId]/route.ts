import { NextResponse } from "next/server";
import sharp from "sharp";
import { decodeToken, downloadFile, esSocioValido, fileInFolder } from "@/lib/server/driveApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Proxy de imágenes de Drive.
 *   GET /api/pictures/img/<fileId>?size=thumb|preview&token=<token>
 * Nunca devuelve el original (Vercel corta >4,5 MB). Redimensiona con sharp.
 * Valida que el archivo pertenezca a la carpeta del token y que esa carpeta
 * sea un socio válido (no un proxy abierto de imágenes).
 */
export async function GET(req: Request, { params }: { params: { fileId: string } }) {
  const fileId = params.fileId;
  const { searchParams } = new URL(req.url);
  const size = searchParams.get("size") === "thumb" ? "thumb" : "preview";
  const token = searchParams.get("token") || "";

  const folderId = decodeToken(token);
  if (!folderId) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  try {
    const [ok1, ok2] = await Promise.all([fileInFolder(fileId, folderId), esSocioValido(folderId)]);
    if (!ok1 || !ok2) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

    const data = await downloadFile(fileId);
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
        "Cache-Control": "public, s-maxage=31536000, max-age=86400, immutable",
      },
    });
  } catch (e) {
    console.error("[pictures/img]", fileId, e);
    return NextResponse.json({ error: "No se pudo procesar la imagen." }, { status: 500 });
  }
}
