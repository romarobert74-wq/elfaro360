import { NextResponse } from "next/server";
import sharp from "sharp";
import { decodeToken, downloadFile } from "@/lib/server/driveApi";

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
    const data = await downloadFile(fileId);
    // IMPORTANTE: no aplicamos .rotate() (orientación EXIF). Una foto 360
    // equirectangular debe mantenerse tal cual; reorientarla rompe el mapeo
    // esférico y ensucia los polos (arriba/abajo). Solo redimensionamos
    // preservando el aspecto exacto 2:1. limitInputPixels:false por si la foto
    // es muy grande (360 de alta resolución).
    const pipeline = sharp(data, { failOn: "none", limitInputPixels: false });
    const out =
      size === "thumb"
        ? await pipeline.resize({ width: 600, withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer()
        : await pipeline.resize({ width: 4096, withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();

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
