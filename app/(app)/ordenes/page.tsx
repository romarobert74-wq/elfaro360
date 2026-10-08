"use client";

import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MonthYearFilter, matchPeriod, type PeriodValue } from "@/components/ui/MonthYearFilter";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { useStore } from "@/components/providers/StoreProvider";
import { buildOrdenBlank, buildOrdenFromPresupuesto } from "@/lib/orders";
import {
  etapaLabels,
  etapaOrder,
  etapaTone,
  toneHex,
} from "@/lib/labels";
import type { EstadoEtapa, OrdenTrabajo } from "@/lib/types";

export default function OrdenesPage() {
  const store = useStore();
  const { ordenes, clientes, destinos, empleados, presupuestos, currentUser, updateOrden, addOrden, removeOrden, can } = store;
  const editable = can("ordenes", "edit");
  const isEmpleado = currentUser?.role === "empleado";
  const [open, setOpen] = useState<OrdenTrabajo | null>(null);
  const [period, setPeriod] = useState<PeriodValue>({ year: null, month: null });
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [nvCliente, setNvCliente] = useState("");
  const [nvDestino, setNvDestino] = useState("");
  const [nvResponsables, setNvResponsables] = useState<string[]>([]);
  const [nvContacto, setNvContacto] = useState("");
  const [nvServicio, setNvServicio] = useState("");
  const [nvDireccion, setNvDireccion] = useState("");
  const [nvFechaRel, setNvFechaRel] = useState("");
  const [nvHoraRel, setNvHoraRel] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";
  const destinoName = (id: string) => destinos.find((d) => d.id === id)?.nombre ?? "—";
  const empName = (id: string | null) => empleados.find((e) => e.id === id)?.nombre ?? null;
  const responsablesNombres = (ids: string[]) =>
    ids.map((id) => empName(id)).filter(Boolean) as string[];

  const years = useMemo(
    () => Array.from(new Set(ordenes.map((o) => Number(o.fechaCreacion.slice(0, 4))))).sort((a, b) => b - a),
    [ordenes]
  );

  // Presupuestos aprobados que todavía no tienen orden (para crear manual)
  const presupuestosSinOrden = useMemo(
    () => presupuestos.filter((p) => p.estado === "aprobado" && !ordenes.some((o) => o.presupuestoId === p.id)),
    [presupuestos, ordenes]
  );

  const nextNumero = () => `OT-2026-${String(ordenes.length + 1).padStart(3, "0")}`;
  const hoy = () => new Date().toISOString().slice(0, 10);

  // Al elegir el destino, traemos sus datos (dirección y contacto).
  const onElegirDestino = (destinoId: string) => {
    setNvDestino(destinoId);
    const d = destinos.find((x) => x.id === destinoId);
    if (d) {
      setNvDireccion(d.direccion || "");
      setNvContacto(d.telefono || "");
    }
  };

  const crearDesdePresupuesto = (presupuestoId: string) => {
    const p = presupuestos.find((x) => x.id === presupuestoId);
    if (!p) return;
    const base = buildOrdenFromPresupuesto(p, nextNumero());
    const d = destinos.find((x) => x.id === p.destinoId);
    addOrden({
      ...base,
      direccion: d?.direccion ?? "",
      contacto: d?.telefono ?? "",
      servicio: p.items.map((it) => it.nombre).join(", "),
      fechaRelevamiento: hoy(),
    });
    setNuevaOpen(false);
  };

  const abrirNueva = () => {
    setNvCliente(clientes[0]?.id ?? "");
    setNvDestino("");
    setNvResponsables([]);
    setNvContacto("");
    setNvServicio("");
    setNvDireccion("");
    setNvFechaRel(hoy());
    setNvHoraRel("");
    setNuevaOpen(true);
  };
  const crearEnBlanco = () => {
    if (!nvCliente || !nvDestino) return;
    const base = buildOrdenBlank(nvCliente, nvDestino, nextNumero(), nvResponsables);
    addOrden({
      ...base,
      contacto: nvContacto,
      servicio: nvServicio,
      direccion: nvDireccion,
      fechaRelevamiento: nvFechaRel || null,
      horaRelevamiento: nvHoraRel,
    });
    setNuevaOpen(false);
  };

  // Empleado ve solo las órdenes de las que es responsable (o tiene alguna etapa asignada)
  const visibles = useMemo(() => {
    let rows = ordenes;
    if (isEmpleado && currentUser?.empleadoId) {
      const me = currentUser.empleadoId;
      rows = rows.filter((o) => o.responsableIds.includes(me) || o.etapas.some((e) => e.empleadoIds.includes(me)));
    }
    return rows.filter((o) => matchPeriod(o.fechaCreacion, period));
  }, [ordenes, isEmpleado, currentUser, period]);

  const progreso = (o: OrdenTrabajo) => {
    const done = o.etapas.filter((e) => e.estado === "completado").length;
    return Math.round((done / o.etapas.length) * 100);
  };

  // Etapa "actual" de una orden = primera etapa no completada (o la última si está todo listo).
  const indiceActual = (o: OrdenTrabajo) => {
    const idx = o.etapas.findIndex((e) => e.estado !== "completado");
    return idx === -1 ? etapaOrder.length - 1 : idx;
  };
  const etapaActualKey = (o: OrdenTrabajo) => etapaOrder[indiceActual(o)];

  // Mueve una orden a una etapa: completa las anteriores, pone en curso la actual.
  // Mover a la última etapa (Entregable) la marca como completada (100%).
  const moverA = (o: OrdenTrabajo, targetKey: string) => {
    const targetIdx = etapaOrder.indexOf(targetKey as (typeof etapaOrder)[number]);
    if (targetIdx < 0) return;
    const last = etapaOrder.length - 1;
    const etapas = o.etapas.map((e) => {
      const i = etapaOrder.indexOf(e.key);
      let estado: EstadoEtapa;
      if (i < targetIdx) estado = "completado";
      else if (i === targetIdx) estado = targetIdx === last ? "completado" : "en_curso";
      else estado = "pendiente";
      return { ...e, estado };
    });
    updateOrden({ ...o, etapas });
  };

  // Agrupa las órdenes visibles por su etapa actual (columnas del tablero).
  const porColumna = useMemo(() => {
    const map: Record<string, OrdenTrabajo[]> = {};
    etapaOrder.forEach((k) => (map[k] = []));
    visibles.forEach((o) => { map[etapaActualKey(o)].push(o); });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibles]);

  return (
    <Guard module="ordenes">
      <PageHeader
        title="Órdenes de Trabajo"
        subtitle="Arrastrá las tarjetas entre fases: Aprobado → Relevamiento → Armado de tour → Entregable"
        actions={
          editable && (
            <button className="btn-primary" onClick={abrirNueva} disabled={clientes.length === 0}>
              <Icon name="plus" size={16} /> Nueva orden
            </button>
          )
        }
      />

      {!isEmpleado && (
        <div className="mb-4 flex items-center justify-end">
          <MonthYearFilter value={period} onChange={setPeriod} years={years} />
        </div>
      )}

      {visibles.length === 0 ? (
        <EmptyState icon="ordenes" title="Sin órdenes" description="Las órdenes se generan al aprobar un presupuesto, o creá una manual desde 'Nueva orden'." />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {etapaOrder.map((key) => {
            const color = toneHex[etapaTone[key]];
            const cards = porColumna[key] ?? [];
            const colActiva = !!dragId && editable;
            return (
              <div
                key={key}
                onDragOver={(e) => { if (colActiva) e.preventDefault(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!editable || !dragId) return;
                  const o = ordenes.find((x) => x.id === dragId);
                  if (o) moverA(o, key);
                  setDragId(null);
                }}
                className={cn(
                  "flex w-72 flex-none flex-col rounded-xl border bg-surface-base/40 transition",
                  colActiva ? "border-dashed border-brand/50" : "border-line"
                )}
              >
                <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                    <span className="font-display text-sm font-bold">{etapaLabels[key]}</span>
                  </div>
                  <Badge tone="gray">{cards.length}</Badge>
                </div>
                <div className="flex min-h-[90px] flex-col gap-2 p-2">
                  {cards.map((o) => {
                    const idx = indiceActual(o);
                    const nombres = responsablesNombres(o.responsableIds);
                    return (
                      <div
                        key={o.id}
                        draggable={editable}
                        onDragStart={() => setDragId(o.id)}
                        onDragEnd={() => setDragId(null)}
                        className={cn(
                          "rounded-lg border border-line bg-surface-raised p-3 transition hover:border-brand/40",
                          editable && "cursor-grab active:cursor-grabbing"
                        )}
                      >
                        <button onClick={() => setOpen(o)} className="w-full text-left">
                          <p className="font-display text-sm font-bold leading-tight">{destinoName(o.destinoId)}</p>
                          <p className="text-xs text-content-muted">{clienteName(o.clienteId)}</p>
                          {(o.fechaRelevamiento || o.horaRelevamiento) && (
                            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-content-muted">
                              <Icon name="clock" size={11} />
                              {o.fechaRelevamiento ? `${o.fechaRelevamiento.slice(8, 10)}/${o.fechaRelevamiento.slice(5, 7)}` : ""} {o.horaRelevamiento}
                            </p>
                          )}
                          <p className="mt-0.5 text-[10px] text-content-subtle">{o.numero} · {progreso(o)}%</p>
                          {nombres.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {nombres.map((n) => (
                                <span key={n} className="rounded-full bg-brand/12 px-2 py-0.5 text-[10px] font-medium text-brand">{n}</span>
                              ))}
                            </div>
                          )}
                        </button>
                        {editable && (
                          <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
                            <button
                              onClick={() => idx > 0 && moverA(o, etapaOrder[idx - 1])}
                              disabled={idx === 0}
                              className="rounded-md p-1 text-content-muted transition enabled:hover:bg-surface-overlay enabled:hover:text-brand disabled:opacity-30"
                              title="Fase anterior"
                            >
                              <Icon name="arrowLeft" size={14} />
                            </button>
                            <span className="text-[10px] text-content-subtle">mover</span>
                            <button
                              onClick={() => idx < etapaOrder.length - 1 && moverA(o, etapaOrder[idx + 1])}
                              disabled={idx === etapaOrder.length - 1}
                              className="rounded-md p-1 text-content-muted transition enabled:hover:bg-surface-overlay enabled:hover:text-brand disabled:opacity-30"
                              title="Fase siguiente"
                            >
                              <Icon name="arrowRight" size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {cards.length === 0 && <p className="px-2 py-5 text-center text-xs text-content-subtle">Sin órdenes</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <OrdenDetalle
          orden={open}
          onClose={() => setOpen(null)}
          editable={editable}
          empleadosOptions={empleados.map((e) => ({ id: e.id, nombre: e.nombre }))}
          clienteName={clienteName(open.clienteId)}
          destinoName={destinoName(open.destinoId)}
          onSave={(next) => { updateOrden(next); setOpen(next); }}
          onDelete={() => { removeOrden(open.id); setOpen(null); }}
        />
      )}

      <Modal
        open={nuevaOpen}
        onClose={() => setNuevaOpen(false)}
        title="Nueva orden de trabajo"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setNuevaOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={crearEnBlanco} disabled={!nvCliente || !nvDestino}>
              <Icon name="check" size={16} /> Crear orden
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Opción A: en blanco */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cliente *">
              <Select value={nvCliente} onChange={(e) => { setNvCliente(e.target.value); setNvDestino(""); }}>
                <option value="">Seleccionar…</option>
                {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </Select>
            </Field>
            <Field label="Destino *">
              <Select value={nvDestino} onChange={(e) => onElegirDestino(e.target.value)} disabled={!nvCliente}>
                <option value="">Seleccionar…</option>
                {destinos.filter((d) => d.clienteId === nvCliente).map((d) => (<option key={d.id} value={d.id}>{d.nombre}</option>))}
              </Select>
            </Field>
          </div>

          {/* Responsable(s) del trabajo */}
          <div>
            <p className="label">Responsable(s) del trabajo</p>
            <p className="mb-2 text-xs text-content-subtle">Quién se hace cargo de toda la orden (podés elegir uno o dos).</p>
            <div className="flex flex-wrap gap-1.5">
              {empleados.map((emp) => {
                const sel = nvResponsables.includes(emp.id);
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setNvResponsables((prev) => (sel ? prev.filter((x) => x !== emp.id) : [...prev, emp.id]))}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition",
                      sel ? "border-brand bg-brand/15 text-brand" : "border-line text-content-muted hover:border-brand/40"
                    )}
                  >
                    {sel && <Icon name="check" size={11} className="mr-1 inline" />}
                    {emp.nombre}
                  </button>
                );
              })}
              {empleados.length === 0 && <span className="text-xs text-content-subtle">No hay empleados cargados.</span>}
            </div>
          </div>

          {/* Datos del destino / visita (se traen al elegir el destino, editables) */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Dirección">
              <TextInput value={nvDireccion} onChange={(e) => setNvDireccion(e.target.value)} placeholder="Dónde ir" />
            </Field>
            <Field label="Contacto en el destino">
              <TextInput value={nvContacto} onChange={(e) => setNvContacto(e.target.value)} placeholder="Con quién hablar / teléfono" />
            </Field>
            <Field label="Servicio a realizar" className="sm:col-span-2">
              <TextInput value={nvServicio} onChange={(e) => setNvServicio(e.target.value)} placeholder="Ej. Tour 360 base" />
            </Field>
            <Field label="Fecha de relevamiento" hint="Aparece en la agenda ese día">
              <TextInput type="date" value={nvFechaRel} onChange={(e) => setNvFechaRel(e.target.value)} />
            </Field>
            <Field label="Hora">
              <TextInput type="time" value={nvHoraRel} onChange={(e) => setNvHoraRel(e.target.value)} />
            </Field>
          </div>

          {/* Opción B: desde presupuesto aprobado */}
          {presupuestosSinOrden.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="h-px flex-1 bg-line" />
                <span className="text-xs text-content-subtle">o desde un presupuesto aprobado</span>
                <div className="h-px flex-1 bg-line" />
              </div>
              <div className="space-y-2">
                {presupuestosSinOrden.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => crearDesdePresupuesto(p.id)}
                    className="flex w-full items-center justify-between rounded-lg border border-line bg-surface-base px-4 py-3 text-left transition hover:border-brand/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.numero}</p>
                      <p className="text-xs text-content-subtle">{clienteName(p.clienteId)} · {destinoName(p.destinoId)}</p>
                    </div>
                    <span className="text-brand"><Icon name="plus" size={16} /></span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Guard>
  );
}

function OrdenDetalle({
  orden,
  onClose,
  editable,
  empleadosOptions,
  clienteName,
  destinoName,
  onSave,
  onDelete,
}: {
  orden: OrdenTrabajo;
  onClose: () => void;
  editable: boolean;
  empleadosOptions: { id: string; nombre: string }[];
  clienteName: string;
  destinoName: string;
  onSave: (o: OrdenTrabajo) => void;
  onDelete: () => void;
}) {
  const [responsables, setResponsables] = useState<string[]>(orden.responsableIds ?? []);
  const [visita, setVisita] = useState({
    contacto: orden.contacto ?? "",
    servicio: orden.servicio ?? "",
    direccion: orden.direccion ?? "",
    fechaRelevamiento: orden.fechaRelevamiento ?? "",
    horaRelevamiento: orden.horaRelevamiento ?? "",
  });
  const [confirmDel, setConfirmDel] = useState(false);

  const toggleResponsableOrden = (empId: string) =>
    setResponsables((prev) => (prev.includes(empId) ? prev.filter((x) => x !== empId) : [...prev, empId]));

  const save = () => {
    onSave({
      ...orden,
      responsableIds: responsables,
      contacto: visita.contacto,
      servicio: visita.servicio,
      direccion: visita.direccion,
      fechaRelevamiento: visita.fechaRelevamiento || null,
      horaRelevamiento: visita.horaRelevamiento,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${orden.numero}`}
      subtitle={`${clienteName} · ${destinoName}`}
      size="lg"
      footer={
        editable ? (
          <>
            <button className="btn-danger mr-auto" onClick={() => setConfirmDel(true)}>
              <Icon name="trash" size={16} /> Eliminar
            </button>
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar cambios</button>
          </>
        ) : (
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        )
      }
    >
      <div className="space-y-3">
        {/* Responsable(s) de la orden */}
        <div className="rounded-xl border border-line bg-surface-base p-4">
          <p className="label">Responsable(s) de la orden</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {empleadosOptions.map((o) => {
              const sel = responsables.includes(o.id);
              return (
                <button
                  key={o.id}
                  type="button"
                  disabled={!editable}
                  onClick={() => toggleResponsableOrden(o.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition",
                    sel ? "border-brand bg-brand/15 text-brand" : "border-line text-content-muted hover:border-brand/40",
                    !editable && "cursor-not-allowed opacity-70"
                  )}
                >
                  {sel && <Icon name="check" size={11} className="mr-1 inline" />}
                  {o.nombre}
                </button>
              );
            })}
            {empleadosOptions.length === 0 && <span className="text-xs text-content-subtle">No hay empleados cargados.</span>}
          </div>
        </div>

        {/* Datos de la visita / relevamiento */}
        <div className="rounded-xl border border-line bg-surface-base p-4">
          <p className="label mb-2">Datos de la visita</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Dirección">
              <TextInput disabled={!editable} value={visita.direccion} onChange={(e) => setVisita((v) => ({ ...v, direccion: e.target.value }))} />
            </Field>
            <Field label="Contacto en el destino">
              <TextInput disabled={!editable} value={visita.contacto} onChange={(e) => setVisita((v) => ({ ...v, contacto: e.target.value }))} />
            </Field>
            <Field label="Servicio a realizar" className="sm:col-span-2">
              <TextInput disabled={!editable} value={visita.servicio} onChange={(e) => setVisita((v) => ({ ...v, servicio: e.target.value }))} />
            </Field>
            <Field label="Fecha de relevamiento" hint="Aparece en la agenda ese día">
              <TextInput type="date" disabled={!editable} value={visita.fechaRelevamiento} onChange={(e) => setVisita((v) => ({ ...v, fechaRelevamiento: e.target.value }))} />
            </Field>
            <Field label="Hora">
              <TextInput type="time" disabled={!editable} value={visita.horaRelevamiento} onChange={(e) => setVisita((v) => ({ ...v, horaRelevamiento: e.target.value }))} />
            </Field>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        onConfirm={onDelete}
        message={`¿Eliminar la orden ${orden.numero}? Esta acción no se puede deshacer.`}
      />
    </Modal>
  );
}
