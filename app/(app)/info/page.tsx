"use client";

import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { uid } from "@/lib/format";
import { getFirebase } from "@/lib/firebase";
import type { InfoEnlace, InfoManual, InfoServicioUsd } from "@/lib/types";

// Servicios adicionales por defecto (en USD). Se usan si aún no se cargaron en Configuración.
// Referencia de conversión usada al crearlos: dólar ≈ $1.540.
const SERVICIOS_USD_DEFAULT: InfoServicioUsd[] = [
  { id: "svc-pack3", nombre: "Pack x 3 Panoramas", valorUsd: 224 },
  { id: "svc-pack5", nombre: "Pack x 5 Panoramas", valorUsd: 500 },
  { id: "svc-pack10", nombre: "Pack x 10 Panoramas", valorUsd: 596 },
  { id: "svc-relev-tour", nombre: "Relevamiento + tour", valorUsd: 497 },
  { id: "svc-dron", nombre: "Servicio de Dron", valorUsd: 156 },
  { id: "svc-aereos", nombre: "Panorámicas aéreas / plazas", valorUsd: 65 },
];

const fmtUsd = (n: number) => `USD ${n.toLocaleString("es-AR")}`;

type InfoData = { enlaces: InfoEnlace[]; manuales: InfoManual[]; serviciosUsd: InfoServicioUsd[] };

export default function InfoUtilPage() {
  const { settings, updateSettings, can } = useStore();
  const editable = can("info", "edit");

  const info: InfoData = useMemo(() => {
    const raw = settings.infoUtil ?? { enlaces: [], manuales: [] };
    return {
      enlaces: raw.enlaces ?? [],
      manuales: raw.manuales ?? [],
      serviciosUsd: raw.serviciosUsd && raw.serviciosUsd.length ? raw.serviciosUsd : SERVICIOS_USD_DEFAULT,
    };
  }, [settings.infoUtil]);

  const [enlaceForm, setEnlaceForm] = useState<InfoEnlace | null>(null);
  const [manualForm, setManualForm] = useState<InfoManual | null>(null);
  const [servicioForm, setServicioForm] = useState<InfoServicioUsd | null>(null);
  const [manualAbierto, setManualAbierto] = useState<string | null>(null);
  const [delEnlace, setDelEnlace] = useState<string | null>(null);
  const [delManual, setDelManual] = useState<string | null>(null);
  const [delServicio, setDelServicio] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);

  const saveInfo = (next: Partial<InfoData>) =>
    updateSettings({ ...settings, infoUtil: { ...info, ...next } });

  const guardarEnlace = () => {
    if (!enlaceForm || !enlaceForm.titulo.trim() || !enlaceForm.url.trim()) return;
    const existe = info.enlaces.some((e) => e.id === enlaceForm.id);
    const enlaces = existe ? info.enlaces.map((e) => (e.id === enlaceForm.id ? enlaceForm : e)) : [...info.enlaces, enlaceForm];
    saveInfo({ enlaces });
    setEnlaceForm(null);
  };
  const guardarManual = () => {
    if (!manualForm || !manualForm.titulo.trim()) return;
    const existe = info.manuales.some((m) => m.id === manualForm.id);
    const manuales = existe ? info.manuales.map((m) => (m.id === manualForm.id ? manualForm : m)) : [...info.manuales, manualForm];
    saveInfo({ manuales });
    setManualForm(null);
  };
  const guardarServicio = () => {
    if (!servicioForm || !servicioForm.nombre.trim()) return;
    const existe = info.serviciosUsd.some((s) => s.id === servicioForm.id);
    const serviciosUsd = existe ? info.serviciosUsd.map((s) => (s.id === servicioForm.id ? servicioForm : s)) : [...info.serviciosUsd, servicioForm];
    saveInfo({ serviciosUsd });
    setServicioForm(null);
  };

  // Subida de archivo (PDF / Word) a Firebase Storage
  const subirArchivo = async (file: File) => {
    if (!manualForm) return;
    setErrorArchivo(null);
    const { storage } = getFirebase();
    if (!storage) {
      setErrorArchivo("La subida de archivos requiere Firebase Storage configurado.");
      return;
    }
    setSubiendo(true);
    try {
      const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
      const nombre = `${Date.now()}-${file.name}`;
      const storageRef = ref(storage, `manuales/${nombre}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setManualForm({ ...manualForm, archivoUrl: url, archivoNombre: file.name });
    } catch {
      setErrorArchivo("No se pudo subir el archivo. Revisá la conexión o los permisos de Storage.");
    } finally {
      setSubiendo(false);
    }
  };

  // Enlaces agrupados por categoría
  const enlacesPorCat = useMemo(() => {
    const map: Record<string, InfoEnlace[]> = {};
    info.enlaces.forEach((e) => { (map[e.categoria || "General"] ??= []).push(e); });
    return map;
  }, [info.enlaces]);

  return (
    <Guard module="info">
      <PageHeader title="Info útil" subtitle="Recursos del equipo: enlaces, manuales y valores de servicios" />

      {/* ENLACES */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Enlaces</h2>
          {editable && <button className="btn-ghost text-sm" onClick={() => setEnlaceForm({ id: uid("enl"), categoria: "", titulo: "", url: "" })}><Icon name="plus" size={15} /> Agregar enlace</button>}
        </div>
        {info.enlaces.length === 0 ? (
          <p className="text-sm text-content-muted">Sin enlaces cargados.</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(enlacesPorCat).map(([cat, items]) => (
              <div key={cat}>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-content-subtle">{cat}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {items.map((e) => (
                    <div key={e.id} className="flex items-start justify-between gap-2 rounded-lg border border-line bg-surface-base px-3 py-2.5">
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="group flex min-w-0 flex-1 items-start gap-2">
                        <Icon name="external" size={15} className="mt-0.5 shrink-0 text-brand" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-brand group-hover:underline">{e.titulo}</span>
                          <span className="block truncate text-xs text-content-subtle">{e.url}</span>
                        </span>
                      </a>
                      {editable && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button onClick={() => setEnlaceForm(e)} className="rounded-md p-1 text-content-muted transition hover:text-brand"><Icon name="edit" size={14} /></button>
                          <button onClick={() => setDelEnlace(e.id)} className="rounded-md p-1 text-content-muted transition hover:text-spectrum-red"><Icon name="trash" size={14} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MANUALES */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Manuales y procedimientos</h2>
          {editable && <button className="btn-ghost text-sm" onClick={() => { setErrorArchivo(null); setManualForm({ id: uid("man"), titulo: "", contenido: "" }); }}><Icon name="plus" size={15} /> Agregar manual</button>}
        </div>
        {info.manuales.length === 0 ? (
          <p className="text-sm text-content-muted">Sin manuales cargados.</p>
        ) : (
          <div className="space-y-2">
            {info.manuales.map((m) => {
              const abierto = manualAbierto === m.id;
              return (
                <div key={m.id} className="rounded-lg border border-line bg-surface-base">
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                    <button onClick={() => setManualAbierto(abierto ? null : m.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium">
                      <Icon name={abierto ? "chevronDown" : "chevronRight"} size={15} className="shrink-0 text-content-muted" />
                      <span className="truncate">{m.titulo}</span>
                      {m.archivoUrl && <Icon name="external" size={13} className="shrink-0 text-content-subtle" />}
                    </button>
                    {editable && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button onClick={() => { setErrorArchivo(null); setManualForm(m); }} className="rounded-md p-1 text-content-muted transition hover:text-brand"><Icon name="edit" size={14} /></button>
                        <button onClick={() => setDelManual(m.id)} className="rounded-md p-1 text-content-muted transition hover:text-spectrum-red"><Icon name="trash" size={14} /></button>
                      </div>
                    )}
                  </div>
                  {abierto && (
                    <div className="border-t border-line px-3 py-3 text-sm text-content-muted">
                      {m.contenido ? <div className="whitespace-pre-line">{m.contenido}</div> : null}
                      {m.archivoUrl && (
                        <a href={m.archivoUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-sm font-medium text-brand hover:underline">
                          <Icon name="external" size={14} /> {m.archivoNombre || "Descargar archivo"}
                        </a>
                      )}
                      {!m.contenido && !m.archivoUrl && "Sin contenido."}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SERVICIOS ADICIONALES (USD) */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Servicios adicionales y valores</h2>
          {editable && <button className="btn-ghost text-sm" onClick={() => setServicioForm({ id: uid("svc"), nombre: "", valorUsd: 0 })}><Icon name="plus" size={15} /> Agregar servicio</button>}
        </div>
        <p className="mb-3 text-xs text-content-subtle">Valores expresados en dólares (USD).</p>
        {info.serviciosUsd.length === 0 ? (
          <p className="text-sm text-content-muted">No hay servicios cargados.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {info.serviciosUsd.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-base px-3 py-2.5 text-sm">
                <p className="min-w-0 truncate font-medium">{s.nombre}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold tabular-nums text-brand">{fmtUsd(s.valorUsd)}</span>
                  {editable && (
                    <>
                      <button onClick={() => setServicioForm(s)} className="rounded-md p-1 text-content-muted transition hover:text-brand"><Icon name="edit" size={14} /></button>
                      <button onClick={() => setDelServicio(s.id)} className="rounded-md p-1 text-content-muted transition hover:text-spectrum-red"><Icon name="trash" size={14} /></button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal enlace */}
      {enlaceForm && (
        <Modal
          open
          onClose={() => setEnlaceForm(null)}
          title={info.enlaces.some((e) => e.id === enlaceForm.id) ? "Editar enlace" : "Nuevo enlace"}
          footer={<><button className="btn-ghost" onClick={() => setEnlaceForm(null)}>Cancelar</button><button className="btn-primary" onClick={guardarEnlace}>Guardar</button></>}
        >
          <div className="grid gap-4">
            <Field label="Categoría" hint="Ej. Mendoza Bureau, Interno, Ejemplos de tours"><TextInput value={enlaceForm.categoria} onChange={(e) => setEnlaceForm({ ...enlaceForm, categoria: e.target.value })} placeholder="Interno" /></Field>
            <Field label="Título *"><TextInput value={enlaceForm.titulo} onChange={(e) => setEnlaceForm({ ...enlaceForm, titulo: e.target.value })} placeholder="Nombre del enlace" /></Field>
            <Field label="URL *"><TextInput value={enlaceForm.url} onChange={(e) => setEnlaceForm({ ...enlaceForm, url: e.target.value })} placeholder="https://…" /></Field>
          </div>
        </Modal>
      )}

      {/* Modal manual */}
      {manualForm && (
        <Modal
          open
          onClose={() => setManualForm(null)}
          title={info.manuales.some((m) => m.id === manualForm.id) ? "Editar manual" : "Nuevo manual"}
          size="lg"
          footer={<><button className="btn-ghost" onClick={() => setManualForm(null)}>Cancelar</button><button className="btn-primary" onClick={guardarManual}>Guardar</button></>}
        >
          <div className="grid gap-4">
            <Field label="Título *"><TextInput value={manualForm.titulo} onChange={(e) => setManualForm({ ...manualForm, titulo: e.target.value })} placeholder="Ej. Configuración de la cámara" /></Field>
            <Field label="Contenido" hint="Opcional si adjuntás un archivo"><TextArea value={manualForm.contenido} onChange={(e) => setManualForm({ ...manualForm, contenido: e.target.value })} className="min-h-[180px]" placeholder="Escribí el procedimiento paso a paso…" /></Field>
            <Field label="Archivo adjunto (PDF o Word)" hint="Opcional">
              <div className="space-y-2">
                {manualForm.archivoUrl ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-muted px-3 py-2 text-sm">
                    <a href={manualForm.archivoUrl} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 font-medium text-brand hover:underline">
                      <Icon name="external" size={14} className="shrink-0" />
                      <span className="truncate">{manualForm.archivoNombre || "Archivo adjunto"}</span>
                    </a>
                    <button onClick={() => setManualForm({ id: manualForm.id, titulo: manualForm.titulo, contenido: manualForm.contenido })} className="rounded-md p-1 text-content-muted transition hover:text-spectrum-red"><Icon name="trash" size={14} /></button>
                  </div>
                ) : (
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-line px-3 py-2 text-sm text-content-muted transition hover:border-brand hover:text-brand">
                    <Icon name="plus" size={14} />
                    {subiendo ? "Subiendo…" : "Seleccionar PDF o Word"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      disabled={subiendo}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) subirArchivo(f); e.target.value = ""; }}
                    />
                  </label>
                )}
                {errorArchivo && <p className="text-xs text-spectrum-red">{errorArchivo}</p>}
              </div>
            </Field>
          </div>
        </Modal>
      )}

      {/* Modal servicio USD */}
      {servicioForm && (
        <Modal
          open
          onClose={() => setServicioForm(null)}
          title={info.serviciosUsd.some((s) => s.id === servicioForm.id) ? "Editar servicio" : "Nuevo servicio"}
          footer={<><button className="btn-ghost" onClick={() => setServicioForm(null)}>Cancelar</button><button className="btn-primary" onClick={guardarServicio}>Guardar</button></>}
        >
          <div className="grid gap-4">
            <Field label="Nombre *"><TextInput value={servicioForm.nombre} onChange={(e) => setServicioForm({ ...servicioForm, nombre: e.target.value })} placeholder="Ej. Pack x 5 Panoramas" /></Field>
            <Field label="Valor (USD) *"><TextInput type="number" value={servicioForm.valorUsd || ""} onChange={(e) => setServicioForm({ ...servicioForm, valorUsd: Number(e.target.value) || 0 })} placeholder="500" /></Field>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={!!delEnlace} onClose={() => setDelEnlace(null)} onConfirm={() => { if (delEnlace) saveInfo({ enlaces: info.enlaces.filter((e) => e.id !== delEnlace) }); }} message="¿Eliminar este enlace?" />
      <ConfirmDialog open={!!delManual} onClose={() => setDelManual(null)} onConfirm={() => { if (delManual) saveInfo({ manuales: info.manuales.filter((m) => m.id !== delManual) }); }} message="¿Eliminar este manual?" />
      <ConfirmDialog open={!!delServicio} onClose={() => setDelServicio(null)} onConfirm={() => { if (delServicio) saveInfo({ serviciosUsd: info.serviciosUsd.filter((s) => s.id !== delServicio) }); }} message="¿Eliminar este servicio?" />
    </Guard>
  );
}
