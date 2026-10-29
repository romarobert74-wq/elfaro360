"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Icon } from "@/components/Icon";

const PanoViewer = dynamic(
  () => import("@/components/pictures/PanoViewer").then((m) => m.PanoViewer),
  { ssr: false }
);

interface Foto {
  id: string;
  nombre: string;
  width?: number;
  height?: number;
}

// La versión (v) sirve para invalidar la caché de la CDN cuando cambia el
// procesamiento de las imágenes (subila si cambiás el proxy de sharp).
const IMG_V = 2;
const imgUrl = (token: string, id: string, size: "thumb" | "preview") =>
  `/api/pictures/img/${encodeURIComponent(id)}?size=${size}&v=${IMG_V}&token=${encodeURIComponent(token)}`;

export function SeleccionClient({ token }: { token: string }) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [socio, setSocio] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [seleccion, setSeleccion] = useState<string[]>([]); // fileIds ordenados
  const [panelOpen, setPanelOpen] = useState(false);
  const [visorId, setVisorId] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [enviado, setEnviado] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`/api/pictures/fotos?token=${encodeURIComponent(token)}`);
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!alive) return;
        setFotos(data.fotos ?? []);
        setSocio(data.socioNombre ?? "");
      } catch {
        if (alive) setErrorCarga("No pudimos cargar tus fotos. Probá de nuevo o avisanos.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token]);

  const seleccionSet = useMemo(() => new Set(seleccion), [seleccion]);
  const fotosPorId = useMemo(() => new Map(fotos.map((f) => [f.id, f])), [fotos]);

  const toggle = useCallback((id: string) => {
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const quitar = useCallback((id: string) => setSeleccion((prev) => prev.filter((x) => x !== id)), []);
  const mover = useCallback((id: string, dir: -1 | 1) => {
    setSeleccion((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      return arrayMove(prev, i, j);
    });
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } })
  );
  const onDragEnd = useCallback((e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setSeleccion((prev) => {
      const from = prev.indexOf(String(active.id));
      const to = prev.indexOf(String(over.id));
      if (from < 0 || to < 0) return prev;
      return arrayMove(prev, from, to);
    });
  }, []);

  // Arma el link de WhatsApp a El Faro con la lista ordenada.
  const waUrl = useCallback(() => {
    const numero = (process.env.NEXT_PUBLIC_PICTURES_WHATSAPP || "").replace(/\D/g, "");
    const lineas = seleccion.map((id, i) => `${i + 1}. ${fotosPorId.get(id)?.nombre ?? id}`).join("\n");
    const texto =
      `*Selección de fotos 360* — ${socio || "Socio"}\n` +
      `Estas son las ${seleccion.length} fotos que elegí, en orden para el tour:\n\n${lineas}`;
    const base = numero ? `https://wa.me/${numero}` : "https://wa.me/";
    return `${base}?text=${encodeURIComponent(texto)}`;
  }, [seleccion, fotosPorId, socio]);

  const enviar = useCallback(() => {
    window.open(waUrl(), "_blank", "noopener,noreferrer");
    setEnviado(seleccion.length);
    setConfirmar(false);
  }, [waUrl, seleccion.length]);

  // ---- Pantalla de éxito ----
  if (enviado !== null) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand/15 text-brand">
          <Icon name="check" size={40} />
        </div>
        <h1 className="font-display text-2xl font-bold">¡Listo!</h1>
        <p className="text-content-muted">
          Se abrió WhatsApp con tus <b>{enviado}</b> fotos en orden. <b>Tocá enviar</b> en WhatsApp para que nos llegue. Con eso armamos tu tour 360. ¡Gracias{socio ? `, ${socio}` : ""}!
        </p>
        <a href={waUrl()} target="_blank" rel="noopener noreferrer" className="btn-primary">
          <Icon name="whatsapp" size={18} /> Abrir WhatsApp de nuevo
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 pb-28 pt-6">
      {/* Encabezado */}
      <header className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand">El Faro 360</p>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">
          {socio ? `Hola, ${socio}` : "Elegí tus fotos 360"}
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Tocá una foto para verla en 360°. Marcá las que quieras en tu tour y ordenalas: ese será el orden de los botones. Cuando termines, enviá tu selección.
        </p>
      </header>

      {loading ? (
        <GridSkeleton />
      ) : errorCarga ? (
        <p className="rounded-lg border border-spectrum-red/40 bg-spectrum-red/10 px-4 py-3 text-sm text-spectrum-red">{errorCarga}</p>
      ) : fotos.length === 0 ? (
        <p className="text-sm text-content-muted">Todavía no hay fotos cargadas en tu carpeta. Avisanos cuando estén listas.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {fotos.map((f) => {
            const sel = seleccionSet.has(f.id);
            const orden = sel ? seleccion.indexOf(f.id) + 1 : 0;
            return (
              <div key={f.id} className="group relative overflow-hidden rounded-xl border border-line bg-surface-raised">
                <button
                  type="button"
                  onClick={() => setVisorId(f.id)}
                  className="relative block aspect-[4/3] w-full"
                  aria-label={`Ver ${f.nombre} en 360°`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl(token, f.id, "thumb")}
                    alt={f.nombre}
                    loading="lazy"
                    className="h-full w-full object-cover transition group-hover:scale-[1.03]"
                  />
                  <span className="absolute bottom-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    <Icon name="globe" size={11} /> 360°
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-2 text-white shadow transition ${
                    sel ? "border-brand bg-brand" : "border-white/80 bg-black/35 hover:bg-black/55"
                  }`}
                  aria-pressed={sel}
                  aria-label={sel ? "Quitar de la selección" : "Agregar a la selección"}
                >
                  {sel ? <span className="text-xs font-bold tabular-nums">{orden}</span> : <Icon name="plus" size={16} />}
                </button>
                <p className="truncate px-2 py-1.5 text-[11px] text-content-subtle">{f.nombre}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Barra inferior fija */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface-base/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => setPanelOpen(true)}
            disabled={seleccion.length === 0}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm font-medium disabled:opacity-40"
          >
            <Icon name="check" size={16} /> Tu selección
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-white">{seleccion.length}</span>
          </button>
          <button
            onClick={() => setConfirmar(true)}
            disabled={seleccion.length === 0}
            className="btn-primary ml-auto"
          >
            Enviar selección
          </button>
        </div>
      </div>

      {/* Panel de selección (ordenable) */}
      {panelOpen && (
        <div className="fixed inset-0 z-40 flex flex-col bg-black/60" onClick={() => setPanelOpen(false)}>
          <div
            className="mt-auto max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-line bg-surface-base p-4 sm:mx-auto sm:mb-6 sm:max-w-lg sm:rounded-2xl sm:border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Tu selección ({seleccion.length})</h2>
              <button onClick={() => setPanelOpen(false)} className="rounded-md p-1 text-content-muted hover:text-content"><Icon name="x" size={20} /></button>
            </div>
            <p className="mb-3 text-xs text-content-subtle">Arrastrá para ordenar (o usá las flechas). Este es el orden de los botones del tour.</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={seleccion} strategy={verticalListSortingStrategy}>
                <ul className="space-y-2">
                  {seleccion.map((id, i) => {
                    const f = fotosPorId.get(id);
                    if (!f) return null;
                    return (
                      <SortableRow
                        key={id}
                        id={id}
                        index={i}
                        total={seleccion.length}
                        nombre={f.nombre}
                        thumb={imgUrl(token, id, "thumb")}
                        onUp={() => mover(id, -1)}
                        onDown={() => mover(id, 1)}
                        onRemove={() => quitar(id)}
                      />
                    );
                  })}
                </ul>
              </SortableContext>
            </DndContext>
            <button onClick={() => { setPanelOpen(false); setConfirmar(true); }} className="btn-primary mt-4 w-full">
              Enviar selección
            </button>
          </div>
        </div>
      )}

      {/* Visor 360 */}
      {visorId && (
        <div className="fixed inset-0 z-50 bg-black">
          <PanoViewer src={imgUrl(token, visorId, "preview")} />
          <button
            onClick={() => setVisorId(null)}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur hover:bg-black/80"
            aria-label="Cerrar visor"
          >
            <Icon name="x" size={22} />
          </button>
          <button
            onClick={() => { if (visorId) toggle(visorId); }}
            className={`absolute bottom-5 left-1/2 z-10 -translate-x-1/2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg transition ${
              visorId && seleccionSet.has(visorId) ? "bg-brand text-white" : "bg-white text-black"
            }`}
          >
            {visorId && seleccionSet.has(visorId) ? "✓ En tu selección — quitar" : "Agregar a mi selección"}
          </button>
        </div>
      )}

      {/* Confirmación de envío */}
      {confirmar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setConfirmar(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-line bg-surface-base p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold">Enviar por WhatsApp</h3>
            <p className="mt-1 text-sm text-content-muted">
              Vamos a abrir WhatsApp con tus <b>{seleccion.length}</b> {seleccion.length === 1 ? "foto" : "fotos"} en el orden elegido. Después tocá <b>enviar</b> en WhatsApp.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setConfirmar(false)}>Cancelar</button>
              <button className="btn-primary" onClick={enviar}><Icon name="whatsapp" size={16} /> Abrir WhatsApp</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function SortableRow({
  id, index, total, nombre, thumb, onUp, onDown, onRemove,
}: {
  id: string; index: number; total: number; nombre: string; thumb: string;
  onUp: () => void; onDown: () => void; onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 };
  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-2 rounded-lg border border-line bg-surface-raised p-2">
      <button {...attributes} {...listeners} className="cursor-grab touch-none px-1 text-content-subtle active:cursor-grabbing" aria-label="Arrastrar">
        <Icon name="moveVertical" size={18} />
      </button>
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white tabular-nums">{index + 1}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumb} alt={nombre} loading="lazy" className="h-12 w-16 shrink-0 rounded object-cover" />
      <span className="min-w-0 flex-1 truncate text-sm">{nombre}</span>
      <div className="flex shrink-0 items-center">
        <button onClick={onUp} disabled={index === 0} className="rounded p-1 text-content-muted disabled:opacity-30 hover:text-content" aria-label="Subir"><Icon name="arrowUp" size={16} /></button>
        <button onClick={onDown} disabled={index === total - 1} className="rounded p-1 text-content-muted disabled:opacity-30 hover:text-content" aria-label="Bajar"><Icon name="arrowDown" size={16} /></button>
        <button onClick={onRemove} className="rounded p-1 text-content-muted hover:text-spectrum-red" aria-label="Quitar"><Icon name="trash" size={16} /></button>
      </div>
    </li>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-surface-raised" />
      ))}
    </div>
  );
}
