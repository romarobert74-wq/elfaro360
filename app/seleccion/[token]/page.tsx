import { notFound } from "next/navigation";
import { verifyToken } from "@/lib/server/selectionToken";
import { SeleccionClient } from "./SeleccionClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Elegí tus fotos 360 — El Faro 360",
};

export default function SeleccionPage({ params }: { params: { token: string } }) {
  // Si la firma no valida → 404 (no revelamos nada).
  const folderId = verifyToken(params.token);
  if (!folderId) notFound();
  return <SeleccionClient token={params.token} />;
}
