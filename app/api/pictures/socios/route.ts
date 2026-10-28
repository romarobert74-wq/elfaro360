import { NextResponse } from "next/server";
import { requirePicturesAdmin } from "@/lib/server/apiAuth";
import { listSocios } from "@/lib/server/drive";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requirePicturesAdmin(req);
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  try {
    const socios = await listSocios();
    return NextResponse.json({ socios });
  } catch (e) {
    console.error("[pictures/socios]", e);
    return NextResponse.json({ error: "No se pudieron listar los socios." }, { status: 500 });
  }
}
