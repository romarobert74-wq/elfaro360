import { notFound } from "next/navigation";
import { decodeToken } from "@/lib/server/driveApi";
import { SeleccionClient } from "./SeleccionClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Elegí tus fotos 360 — El Faro 360",
};

export default function SeleccionPage({ params }: { params: { token: string } }) {
  // El token es base64url del folderId. La validez real (que sea un socio) se
  // chequea al cargar las fotos.
  const folderId = decodeToken(params.token);
  if (!folderId) notFound();
  return <SeleccionClient token={params.token} />;
}
