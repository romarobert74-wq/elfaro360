import { NextResponse } from "next/server";
import { listSocios } from "@/lib/server/driveApi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lista las carpetas de socios (subcarpetas de la raíz). Solo devuelve nombres.
export async function GET() {
  try {
    return NextResponse.json({ socios: await listSocios() });
  } catch (e) {
    console.error("[pictures/socios]", e);
    return NextResponse.json({ error: "No se pudieron listar los socios. Revisá la API key y que la carpeta esté compartida." }, { status: 500 });
  }
}
