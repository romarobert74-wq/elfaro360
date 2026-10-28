import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/server/selectionToken";
import { rateLimit } from "@/lib/server/rateLimit";
import { adminDb } from "@/lib/server/firebaseAdmin";
import { crearCarpetaSeleccion, listFotos, listSocios } from "@/lib/server/drive";
import type { SeleccionFoto } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Body {
  token?: string;
  fotos?: { fileId?: string; orden?: number }[];
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const token = body.token || "";
  const folderId = verifyToken(token);
  if (!folderId) return NextResponse.json({ error: "Link inválido." }, { status: 404 });

  // Rate limit por token.
  if (!rateLimit(`sel:${token}`, 5, 60_000)) {
    return NextResponse.json({ error: "Demasiados envíos. Esperá un momento." }, { status: 429 });
  }

  const entradas = Array.isArray(body.fotos) ? body.fotos : [];
  if (entradas.length === 0) {
    return NextResponse.json({ error: "No hay fotos en la selección." }, { status: 400 });
  }

  try {
    // Validar que cada fileId pertenezca a la carpeta del socio y resolver su nombre.
    const [socios, fotosCarpeta] = await Promise.all([listSocios(), listFotos(folderId)]);
    const socio = socios.find((s) => s.id === folderId);
    if (!socio) return NextResponse.json({ error: "Socio no encontrado." }, { status: 404 });

    const porId = new Map(fotosCarpeta.map((f) => [f.id, f.nombre]));
    const fotos: SeleccionFoto[] = [];
    entradas.forEach((e, i) => {
      const fileId = e.fileId || "";
      const nombre = porId.get(fileId);
      if (!nombre) return; // ignora ids que no pertenecen a la carpeta
      fotos.push({ fileId, nombre, orden: typeof e.orden === "number" ? e.orden : i });
    });
    if (fotos.length === 0) {
      return NextResponse.json({ error: "Las fotos no son válidas para este socio." }, { status: 400 });
    }
    fotos.sort((a, b) => a.orden - b.orden);
    fotos.forEach((f, i) => (f.orden = i)); // normaliza 0..n

    // Carpeta con accesos directos ordenados (no copia los archivos).
    let carpetaSeleccionUrl: string | undefined;
    try {
      const r = await crearCarpetaSeleccion(folderId, fotos);
      carpetaSeleccionUrl = r.carpetaUrl;
    } catch (e) {
      console.error("[pictures/seleccion] crear carpeta", e);
      // No bloquea el guardado; el equipo puede armar la carpeta a mano.
    }

    const doc = {
      socioFolderId: folderId,
      socioNombre: socio.nombre,
      fotos,
      estado: "nueva" as const,
      leida: false,
      ...(carpetaSeleccionUrl ? { carpetaSeleccionUrl } : {}),
      creadoEn: new Date().toISOString(),
    };
    const ref = await adminDb().collection("selecciones_pictures").add(doc);

    return NextResponse.json({ ok: true, id: ref.id, total: fotos.length });
  } catch (e) {
    console.error("[pictures/seleccion]", e);
    return NextResponse.json({ error: "No se pudo guardar la selección." }, { status: 500 });
  }
}
