"use client";

import { useCallback, useEffect, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { fetchExplorar, linkDeSocio, type ExplorarData, type SocioDrive } from "@/lib/pictures-client";

interface Crumb { id: string; nombre: string }

export default function PicturesPage() {
  const [data, setData] = useState<ExplorarData | null>(null);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<string | null>(null);

  const cargar = useCallback(async (folderId: string | undefined, nuevosCrumbs: Crumb[]) => {
    setLoading(true);
    setError(null);
    try {
      const d = await fetchExplorar(folderId);
      setData(d);
      // Si venimos de la raíz, inicializamos el breadcrumb con su nombre.
      setCrumbs(nuevosCrumbs.length ? nuevosCrumbs : [{ id: d.folderId, nombre: d.nombre }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void cargar(undefined, []); }, [cargar]);

  const entrar = (f: SocioDrive) => cargar(f.id, [...crumbs, { id: f.id, nombre: f.nombre }]);
  const irA = (i: number) => {
    const nuevos = crumbs.slice(0, i + 1);
    cargar(nuevos[nuevos.length - 1]!.id, nuevos);
  };

  const copiar = useCallback(async (folderId: string) => {
    try {
      await navigator.clipboard.writeText(linkDeSocio(folderId));
      setCopiado(folderId);
      setTimeout(() => setCopiado((c) => (c === folderId ? null : c)), 1800);
    } catch {
      alert("Copialo a mano: " + linkDeSocio(folderId));
    }
  }, []);

  const whatsapp = useCallback((f: SocioDrive) => {
    const url = linkDeSocio(f.id);
    const texto = `Hola ${f.nombre}! Entrá a este link para elegir las fotos 360 de tu tour y ordenarlas. Cuando termines, nos mandás la selección por WhatsApp: ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");
  }, []);

  return (
    <Guard module="pictures">
      <PageHeader
        title="Selección Pictures"
        subtitle="Navegá hasta la carpeta del socio y compartile el link para que elija sus panoramas 360"
      />

      {/* Breadcrumb */}
      {crumbs.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1 text-sm">
          {crumbs.map((c, i) => (
            <span key={c.id} className="flex items-center gap-1">
              {i > 0 && <Icon name="chevronRight" size={14} className="text-content-subtle" />}
              <button
                onClick={() => irA(i)}
                className={i === crumbs.length - 1 ? "font-semibold text-content" : "text-brand hover:underline"}
              >
                {i === 0 ? "Inicio" : c.nombre}
              </button>
            </span>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-content-muted">Cargando…</p>
      ) : error ? (
        <div className="rounded-lg border border-spectrum-red/40 bg-spectrum-red/10 px-4 py-3 text-sm text-spectrum-red">
          <p className="font-medium">No se pudo leer la carpeta.</p>
          <p className="mt-1 text-xs">{error}</p>
        </div>
      ) : data ? (
        <>
          {/* Acción para la carpeta actual (si tiene fotos, es candidata a link de socio) */}
          {!data.esRaiz && (
            <div className="mb-4 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{data.nombre}</p>
                  <p className="text-xs text-content-muted">
                    {data.fotosCount > 0
                      ? `${data.fotosCount} foto${data.fotosCount === 1 ? "" : "s"} 360 en esta carpeta`
                      : "Sin fotos directas acá — entrá a una subcarpeta"}
                  </p>
                </div>
                {data.fotosCount > 0 && (
                  <div className="flex shrink-0 items-center gap-1">
                    <button onClick={() => copiar(data.folderId)} className="btn-primary text-xs">
                      <Icon name={copiado === data.folderId ? "check" : "external"} size={14} /> {copiado === data.folderId ? "Copiado" : "Copiar link"}
                    </button>
                    <button onClick={() => whatsapp({ id: data.folderId, nombre: data.nombre })} className="btn-ghost text-xs">
                      <Icon name="whatsapp" size={14} /> WhatsApp
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subcarpetas */}
          {data.folders.length === 0 ? (
            data.fotosCount > 0 ? (
              <p className="text-sm text-content-muted">Esta carpeta tiene las fotos. Usá “Copiar link” de arriba para compartirla con el socio.</p>
            ) : (
              <EmptyState icon="image" title="Carpeta vacía" description="No hay subcarpetas ni fotos acá." />
            )
          ) : (
            <>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-content-subtle">Carpetas</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.folders.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-base px-3 py-2.5">
                    <button onClick={() => entrar(f)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                      <Icon name="image" size={16} className="shrink-0 text-content-muted" />
                      <span className="truncate text-sm font-medium">{f.nombre}</span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <button onClick={() => entrar(f)} className="btn-ghost text-xs"><Icon name="chevronRight" size={14} /> Abrir</button>
                      <button onClick={() => copiar(f.id)} className="rounded-md p-1.5 text-content-muted transition hover:text-brand" title="Copiar link de esta carpeta">
                        <Icon name={copiado === f.id ? "check" : "external"} size={15} />
                      </button>
                      <button onClick={() => whatsapp(f)} className="rounded-md p-1.5 text-content-muted transition hover:text-brand" title="Compartir por WhatsApp">
                        <Icon name="whatsapp" size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : null}
    </Guard>
  );
}
