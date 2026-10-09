"use client";

import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Field, TextArea, TextInput } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { formatCurrency, uid } from "@/lib/format";
import type { InfoEnlace, InfoManual } from "@/lib/types";

export default function InfoUtilPage() {
  const { settings, servicios, updateSettings, can } = useStore();
  const editable = can("info", "edit");
  const info = settings.infoUtil ?? { enlaces: [], manuales: [] };

  const [enlaceForm, setEnlaceForm] = useState<InfoEnlace | null>(null);
  const [manualForm, setManualForm] = useState<InfoManual | null>(null);
  const [manualAbierto, setManualAbierto] = useState<string | null>(null);
  const [delEnlace, setDelEnlace] = useState<string | null>(null);
  const [delManual, setDelManual] = useState<string | null>(null);

  const saveInfo = (next: { enlaces: InfoEnlace[]; manuales: InfoManual[] }) =>
    updateSettings({ ...settings, infoUtil: next });

  const guardarEnlace = () => {
    if (!enlaceForm || !enlaceForm.titulo.trim() || !enlaceForm.url.trim()) return;
    const existe = info.enlaces.some((e) => e.id === enlaceForm.id);
    const enlaces = existe ? info.enlaces.map((e) => (e.id === enlaceForm.id ? enlaceForm : e)) : [...info.enlaces, enlaceForm];
    saveInfo({ enlaces, manuales: info.manuales });
    setEnlaceForm(null);
  };
  const guardarManual = () => {
    if (!manualForm || !manualForm.titulo.trim()) return;
    const existe = info.manuales.some((m) => m.id === manualForm.id);
    const manuales = existe ? info.manuales.map((m) => (m.id === manualForm.id ? manualForm : m)) : [...info.manuales, manualForm];
    saveInfo({ enlaces: info.enlaces, manuales });
    setManualForm(null);
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
                    <div key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-base px-3 py-2.5">
                      <a href={e.url} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-2 text-sm font-medium text-brand hover:underline">
                        <Icon name="external" size={15} className="shrink-0" />
                        <span className="truncate">{e.titulo}</span>
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
          {editable && <button className="btn-ghost text-sm" onClick={() => setManualForm({ id: uid("man"), titulo: "", contenido: "" })}><Icon name="plus" size={15} /> Agregar manual</button>}
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
                    </button>
                    {editable && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button onClick={() => setManualForm(m)} className="rounded-md p-1 text-content-muted transition hover:text-brand"><Icon name="edit" size={14} /></button>
                        <button onClick={() => setDelManual(m.id)} className="rounded-md p-1 text-content-muted transition hover:text-spectrum-red"><Icon name="trash" size={14} /></button>
                      </div>
                    )}
                  </div>
                  {abierto && <div className="whitespace-pre-line border-t border-line px-3 py-3 text-sm text-content-muted">{m.contenido || "Sin contenido."}</div>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SERVICIOS */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Servicios adicionales y valores</h2>
        {servicios.length === 0 ? (
          <p className="text-sm text-content-muted">No hay servicios cargados.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {servicios.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-base px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{s.nombre}</p>
                  {s.tipo && <p className="text-xs text-content-subtle">{s.tipo}</p>}
                </div>
                <span className="shrink-0 font-medium tabular-nums">{formatCurrency(s.precioBase)}{s.unidad ? ` / ${s.unidad}` : ""}</span>
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
            <Field label="Contenido"><TextArea value={manualForm.contenido} onChange={(e) => setManualForm({ ...manualForm, contenido: e.target.value })} className="min-h-[200px]" placeholder="Escribí el procedimiento paso a paso…" /></Field>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={!!delEnlace} onClose={() => setDelEnlace(null)} onConfirm={() => { if (delEnlace) saveInfo({ enlaces: info.enlaces.filter((e) => e.id !== delEnlace), manuales: info.manuales }); }} message="¿Eliminar este enlace?" />
      <ConfirmDialog open={!!delManual} onClose={() => setDelManual(null)} onConfirm={() => { if (delManual) saveInfo({ enlaces: info.enlaces, manuales: info.manuales.filter((m) => m.id !== delManual) }); }} message="¿Eliminar este manual?" />
    </Guard>
  );
}
