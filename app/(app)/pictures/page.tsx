"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Field";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/components/providers/StoreProvider";
import { getFirebase } from "@/lib/firebase";
import { fetchSocios, fetchLink, fetchToken, type SocioDrive } from "@/lib/pictures-client";
import type { EstadoSeleccion, SeleccionPicture } from "@/lib/types";
import type { Tone } from "@/lib/labels";

const estadoLabel: Record<EstadoSeleccion, string> = {
  nueva: "Nueva",
  en_proceso: "En proceso",
  tour_armado: "Tour armado",
};
const estadoTone: Record<EstadoSeleccion, Tone> = {
  nueva: "brand",
  en_proceso: "orange",
  tour_armado: "green",
};

function fmtFecha(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

export default function PicturesPage() {
  const { backend } = useStore();
  const [tab, setTab] = useState<"socios" | "recibidas">("recibidas");
  const [selecciones, setSelecciones] = useState<SeleccionPicture[]>([]);

  // Listener en tiempo real de las selecciones (backend Firebase).
  useEffect(() => {
    if (backend !== "firebase") return;
    const { db } = getFirebase();
    if (!db) return;
    const q = query(collection(db, "selecciones_pictures"), orderBy("creadoEn", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => setSelecciones(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SeleccionPicture, "id">) }))),
      (e) => console.error("[pictures] listener", e)
    );
    return () => unsub();
  }, [backend]);

  const noLeidas = useMemo(() => selecciones.filter((s) => !s.leida).length, [selecciones]);

  return (
    <Guard module="pictures">
      <PageHeader
        title="Selección Pictures"
        subtitle="Panoramas 360 que cada socio elige desde Google Drive para armar su tour"
      />

      {backend !== "firebase" && (
        <div className="mb-4 rounded-lg border border-spectrum-orange/40 bg-spectrum-orange/10 px-4 py-2.5 text-xs text-spectrum-orange">
          Este módulo funciona con el backend Firebase y las variables de Drive configuradas en el servidor.
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex gap-1 border-b border-line">
        <TabBtn active={tab === "recibidas"} onClick={() => setTab("recibidas")}>
          Selecciones recibidas
          {noLeidas > 0 && <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-bold text-white">{noLeidas}</span>}
        </TabBtn>
        <TabBtn active={tab === "socios"} onClick={() => setTab("socios")}>Socios</TabBtn>
      </div>

      {tab === "socios" ? <SociosTab /> : <RecibidasTab selecciones={selecciones} />}
    </Guard>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`relative -mb-px flex items-center border-b-2 px-4 py-2.5 text-sm font-medium transition ${
        active ? "border-brand text-brand" : "border-transparent text-content-muted hover:text-content"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------- Pestaña Socios ----------------
function SociosTab() {
  const [socios, setSocios] = useState<SocioDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [copiado, setCopiado] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await fetchSocios();
        if (alive) setSocios(s);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Error al cargar socios.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const ensureLink = useCallback(async (folderId: string): Promise<string> => {
    if (links[folderId]) return links[folderId];
    setBusy(folderId);
    try {
      const url = await fetchLink(folderId);
      setLinks((p) => ({ ...p, [folderId]: url }));
      return url;
    } finally {
      setBusy(null);
    }
  }, [links]);

  const copiar = async (folderId: string) => {
    try {
      const url = await ensureLink(folderId);
      await navigator.clipboard.writeText(url);
      setCopiado(folderId);
      setTimeout(() => setCopiado((c) => (c === folderId ? null : c)), 1800);
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo copiar el link.");
    }
  };

  const whatsapp = async (socio: SocioDrive) => {
    try {
      const url = await ensureLink(socio.id);
      const texto = `Hola ${socio.nombre}! Entrá a este link para elegir las fotos 360 de tu tour y ordenarlas: ${url}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo generar el link.");
    }
  };

  if (loading) return <p className="text-sm text-content-muted">Cargando socios desde Drive…</p>;
  if (error) return <p className="rounded-lg border border-spectrum-red/40 bg-spectrum-red/10 px-4 py-3 text-sm text-spectrum-red">{error}</p>;
  if (socios.length === 0) return <EmptyState icon="image" title="Sin socios" description="No hay subcarpetas en la carpeta raíz de Drive." />;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {socios.map((s) => (
        <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-base px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <Icon name="image" size={16} className="shrink-0 text-content-muted" />
            <span className="truncate text-sm font-medium">{s.nombre}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={() => copiar(s.id)} disabled={busy === s.id} className="btn-ghost text-xs">
              <Icon name={copiado === s.id ? "check" : "external"} size={14} /> {copiado === s.id ? "Copiado" : "Copiar link"}
            </button>
            <button onClick={() => whatsapp(s)} disabled={busy === s.id} className="btn-ghost text-xs">
              <Icon name="whatsapp" size={14} /> WhatsApp
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------- Pestaña Selecciones recibidas ----------------
function RecibidasTab({ selecciones }: { selecciones: SeleccionPicture[] }) {
  const [abierta, setAbierta] = useState<SeleccionPicture | null>(null);

  if (selecciones.length === 0) {
    return <EmptyState icon="image" title="Sin selecciones" description="Cuando un socio envíe su selección, va a aparecer acá." />;
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-line">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-content-subtle">
            <tr>
              <th className="px-4 py-2.5">Socio</th>
              <th className="px-4 py-2.5 hidden sm:table-cell">Fecha</th>
              <th className="px-4 py-2.5">Fotos</th>
              <th className="px-4 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody>
            {selecciones.map((s) => (
              <tr
                key={s.id}
                onClick={() => setAbierta(s)}
                className={`cursor-pointer border-t border-line transition hover:bg-surface-overlay ${!s.leida ? "bg-brand/5" : ""}`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {!s.leida && <span className="h-2 w-2 shrink-0 rounded-full bg-brand" title="Nueva (no leída)" />}
                    <span className="font-medium">{s.socioNombre}</span>
                  </div>
                  <span className="text-xs text-content-subtle sm:hidden">{fmtFecha(s.creadoEn)}</span>
                </td>
                <td className="px-4 py-3 hidden text-content-muted sm:table-cell">{fmtFecha(s.creadoEn)}</td>
                <td className="px-4 py-3 tabular-nums">{s.fotos?.length ?? 0}</td>
                <td className="px-4 py-3"><Badge tone={estadoTone[s.estado] ?? "gray"}>{estadoLabel[s.estado] ?? s.estado}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {abierta && <SeleccionDetalle seleccion={abierta} onClose={() => setAbierta(null)} />}
    </>
  );
}

function SeleccionDetalle({ seleccion, onClose }: { seleccion: SeleccionPicture; onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const fotos = useMemo(() => [...(seleccion.fotos ?? [])].sort((a, b) => a.orden - b.orden), [seleccion.fotos]);

  // Marcar como leída al abrir + traer token para ver miniaturas.
  useEffect(() => {
    const { db } = getFirebase();
    if (db && !seleccion.leida) {
      updateDoc(doc(db, "selecciones_pictures", seleccion.id), { leida: true }).catch((e) => console.error("[pictures] leida", e));
    }
    fetchToken(seleccion.socioFolderId).then(setToken).catch(() => setToken(null));
  }, [seleccion.id, seleccion.leida, seleccion.socioFolderId]);

  const cambiarEstado = (estado: EstadoSeleccion) => {
    const { db } = getFirebase();
    if (db) updateDoc(doc(db, "selecciones_pictures", seleccion.id), { estado }).catch((e) => console.error("[pictures] estado", e));
  };

  return (
    <Modal open onClose={onClose} title={`Selección de ${seleccion.socioNombre}`} size="lg"
      footer={<button className="btn-primary" onClick={onClose}>Cerrar</button>}>
      <div className="grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-[160px]">
            <label className="label">Estado</label>
            <Select value={seleccion.estado} onChange={(e) => cambiarEstado(e.target.value as EstadoSeleccion)}>
              <option value="nueva">Nueva</option>
              <option value="en_proceso">En proceso</option>
              <option value="tour_armado">Tour armado</option>
            </Select>
          </div>
          <div className="text-sm text-content-muted">
            <p>{fotos.length} fotos · {fmtFecha(seleccion.creadoEn)}</p>
            {seleccion.carpetaSeleccionUrl && (
              <a href={seleccion.carpetaSeleccionUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 font-medium text-brand hover:underline">
                <Icon name="external" size={14} /> Abrir carpeta {"“"}Seleccionadas{"”"} en Drive
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {fotos.map((f) => (
            <div key={f.fileId} className="overflow-hidden rounded-lg border border-line bg-surface-raised">
              <div className="relative aspect-[4/3] w-full bg-surface-overlay">
                {token ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/pictures/img/${encodeURIComponent(f.fileId)}?size=thumb&token=${encodeURIComponent(token)}`}
                    alt={f.nombre}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-content-subtle"><Icon name="image" size={24} /></div>
                )}
                <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-xs font-bold text-white tabular-nums">{f.orden + 1}</span>
              </div>
              <p className="truncate px-2 py-1.5 text-[11px] text-content-subtle">{f.nombre}</p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
