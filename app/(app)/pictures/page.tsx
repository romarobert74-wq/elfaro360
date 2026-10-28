"use client";

import { useCallback, useEffect, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchSocios, linkDeSocio, type SocioDrive } from "@/lib/pictures-client";

export default function PicturesPage() {
  const [socios, setSocios] = useState<SocioDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

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

  const copiar = useCallback(async (folderId: string) => {
    try {
      await navigator.clipboard.writeText(linkDeSocio(folderId));
      setCopiado(folderId);
      setTimeout(() => setCopiado((c) => (c === folderId ? null : c)), 1800);
    } catch {
      alert("No se pudo copiar. Copialo a mano: " + linkDeSocio(folderId));
    }
  }, []);

  const whatsapp = useCallback((socio: SocioDrive) => {
    const url = linkDeSocio(socio.id);
    const texto = `Hola ${socio.nombre}! Entrá a este link para elegir las fotos 360 de tu tour y ordenarlas. Cuando termines, nos mandás la selección por WhatsApp: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <Guard module="pictures">
      <PageHeader
        title="Selección Pictures"
        subtitle="Compartí a cada socio el link para que elija y ordene sus panoramas 360"
      />

      {loading ? (
        <p className="text-sm text-content-muted">Cargando socios desde Drive…</p>
      ) : error ? (
        <div className="rounded-lg border border-spectrum-red/40 bg-spectrum-red/10 px-4 py-3 text-sm text-spectrum-red">
          <p className="font-medium">No se pudieron cargar los socios.</p>
          <p className="mt-1 text-xs">{error}</p>
          <p className="mt-2 text-xs text-content-muted">Revisá que la carpeta de Drive esté compartida como “cualquiera con el enlace” y que la API key esté cargada en Vercel.</p>
        </div>
      ) : socios.length === 0 ? (
        <EmptyState icon="image" title="Sin socios" description="No hay subcarpetas dentro de la carpeta raíz de Drive." />
      ) : (
        <>
          <p className="mb-3 text-sm text-content-muted">
            Cada carpeta de Drive es un socio. Compartile su link: va a ver sus fotos, elegir las que quiere, ordenarlas y mandarte la selección por WhatsApp.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {socios.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-base px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon name="image" size={16} className="shrink-0 text-content-muted" />
                  <span className="truncate text-sm font-medium">{s.nombre}</span>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button onClick={() => copiar(s.id)} className="btn-ghost text-xs">
                    <Icon name={copiado === s.id ? "check" : "external"} size={14} /> {copiado === s.id ? "Copiado" : "Copiar link"}
                  </button>
                  <button onClick={() => whatsapp(s)} className="btn-ghost text-xs">
                    <Icon name="whatsapp" size={14} /> WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Guard>
  );
}
