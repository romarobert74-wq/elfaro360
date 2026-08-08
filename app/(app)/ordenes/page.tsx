"use client";

import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { MonthYearFilter, matchPeriod, type PeriodValue } from "@/components/ui/MonthYearFilter";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { useStore } from "@/components/providers/StoreProvider";
import { buildOrdenBlank, buildOrdenFromPresupuesto } from "@/lib/orders";
import { formatDate } from "@/lib/format";
import {
  estadoEtapaLabels,
  estadoEtapaTone,
  etapaLabels,
  etapaOrder,
  etapaTone,
  toneHex,
} from "@/lib/labels";
import type { Etapa, EstadoEtapa, OrdenTrabajo } from "@/lib/types";

export default function OrdenesPage() {
  const store = useStore();
  const { ordenes, clientes, destinos, empleados, presupuestos, currentUser, updateOrden, addOrden, can } = store;
  const editable = can("ordenes", "edit");
  const isEmpleado = currentUser?.role === "empleado";
  const [open, setOpen] = useState<OrdenTrabajo | null>(null);
  const [period, setPeriod] = useState<PeriodValue>({ year: null, month: null });
  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [nvCliente, setNvCliente] = useState("");
  const [nvDestino, setNvDestino] = useState("");

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";
  const destinoName = (id: string) => destinos.find((d) => d.id === id)?.nombre ?? "—";
  const empName = (id: string | null) => empleados.find((e) => e.id === id)?.nombre ?? null;

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

  const crearDesdePresupuesto = (presupuestoId: string) => {
    const p = presupuestos.find((x) => x.id === presupuestoId);
    if (!p) return;
    addOrden(buildOrdenFromPresupuesto(p, nextNumero()));
    setNuevaOpen(false);
  };

  const abrirNueva = () => {
    setNvCliente(clientes[0]?.id ?? "");
    setNvDestino("");
    setNuevaOpen(true);
  };
  const crearEnBlanco = () => {
    if (!nvCliente || !nvDestino) return;
    addOrden(buildOrdenBlank(nvCliente, nvDestino, nextNumero()));
    setNuevaOpen(false);
  };

  // Empleado ve solo las órdenes donde tiene alguna etapa asignada
  const visibles = useMemo(() => {
    let rows = ordenes;
    if (isEmpleado && currentUser?.empleadoId) {
      rows = rows.filter((o) => o.etapas.some((e) => e.empleadoId === currentUser.empleadoId));
    }
    return rows.filter((o) => matchPeriod(o.fechaCreacion, period));
  }, [ordenes, isEmpleado, currentUser, period]);

  const progreso = (o: OrdenTrabajo) => {
    const done = o.etapas.filter((e) => e.estado === "completado").length;
    return Math.round((done / o.etapas.length) * 100);
  };

  return (
    <Guard module="ordenes">
      <PageHeader
        title="Órdenes de Trabajo"
        subtitle="Pipeline: Aprobado → Relevamiento → Edición → Publicación → Entregable"
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
        <div className="grid gap-4">
          {visibles.map((o) => (
            <button
              key={o.id}
              onClick={() => setOpen(o)}
              className="card group p-5 text-left transition hover:border-brand/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-base font-bold">{o.numero}</span>
                    <Badge tone="gray">{progreso(o)}%</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-content-muted">{clienteName(o.clienteId)} · {destinoName(o.destinoId)}</p>
                </div>
                <span className="text-content-subtle transition group-hover:translate-x-0.5 group-hover:text-brand">
                  <Icon name="chevronRight" size={18} />
                </span>
              </div>

              {/* Pipeline visual */}
              <div className="mt-4 flex items-center gap-1">
                {etapaOrder.map((key, i) => {
                  const etapa = o.etapas.find((e) => e.key === key)!;
                  const color = toneHex[etapaTone[key]];
                  const done = etapa.estado === "completado";
                  const active = etapa.estado === "en_curso";
                  const mine = isEmpleado && etapa.empleadoId === currentUser?.empleadoId;
                  return (
                    <div key={key} className="flex flex-1 items-center gap-1">
                      <div className="flex-1">
                        <div
                          className="h-1.5 w-full rounded-full transition"
                          style={{ background: done || active ? color : "rgb(var(--line))", opacity: done ? 1 : active ? 0.7 : 1 }}
                        />
                        <div className="mt-1.5 flex items-center gap-1">
                          <span
                            className={cn("h-2 w-2 rounded-full", (done || active) ? "" : "opacity-40")}
                            style={{ background: color }}
                          />
                          <span className={cn("truncate text-[10px]", mine ? "font-bold text-content" : "text-content-subtle")}>
                            {etapaLabels[key]}
                          </span>
                        </div>
                      </div>
                      {i < etapaOrder.length - 1 && <span className="text-content-subtle/40">›</span>}
                    </div>
                  );
                })}
              </div>
            </button>
          ))}
        </div>
      )}

      {open && (
        <OrdenDetalle
          orden={open}
          onClose={() => setOpen(null)}
          editable={editable}
          empleadosOptions={empleados.map((e) => ({ id: e.id, nombre: e.nombre }))}
          empName={empName}
          clienteName={clienteName(open.clienteId)}
          destinoName={destinoName(open.destinoId)}
          onSave={(next) => { updateOrden(next); setOpen(next); }}
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
              <Select value={nvDestino} onChange={(e) => setNvDestino(e.target.value)} disabled={!nvCliente}>
                <option value="">Seleccionar…</option>
                {destinos.filter((d) => d.clienteId === nvCliente).map((d) => (<option key={d.id} value={d.id}>{d.nombre}</option>))}
              </Select>
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
  empName,
  clienteName,
  destinoName,
  onSave,
}: {
  orden: OrdenTrabajo;
  onClose: () => void;
  editable: boolean;
  empleadosOptions: { id: string; nombre: string }[];
  empName: (id: string | null) => string | null;
  clienteName: string;
  destinoName: string;
  onSave: (o: OrdenTrabajo) => void;
}) {
  const [etapas, setEtapas] = useState<Etapa[]>(orden.etapas);

  const update = (idx: number, patch: Partial<Etapa>) =>
    setEtapas((prev) => prev.map((e, i) => (i === idx ? { ...e, ...patch } : e)));

  const save = () => {
    onSave({ ...orden, etapas });
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
            <button className="btn-ghost" onClick={onClose}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar cambios</button>
          </>
        ) : (
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
        )
      }
    >
      <div className="space-y-3">
        {etapas.map((etapa, idx) => (
          <div key={etapa.key} className="rounded-xl border border-line bg-surface-base p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: toneHex[etapaTone[etapa.key]] }} />
                <span className="font-display font-semibold">{etapaLabels[etapa.key]}</span>
              </div>
              <Badge tone={estadoEtapaTone[etapa.estado]} dot>{estadoEtapaLabels[etapa.estado]}</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Responsable">
                <Select
                  value={etapa.empleadoId ?? ""}
                  disabled={!editable}
                  onChange={(e) => update(idx, { empleadoId: e.target.value || null })}
                >
                  <option value="">Sin asignar</option>
                  {empleadosOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.nombre}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Estado">
                <Select
                  value={etapa.estado}
                  disabled={!editable}
                  onChange={(e) => update(idx, { estado: e.target.value as EstadoEtapa })}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_curso">En curso</option>
                  <option value="completado">Completado</option>
                </Select>
              </Field>
              <Field label="Fecha estimada">
                <TextInput type="date" disabled={!editable} value={etapa.fechaEstimada ?? ""} onChange={(e) => update(idx, { fechaEstimada: e.target.value || null })} />
              </Field>
              <Field label="Fecha real">
                <TextInput type="date" disabled={!editable} value={etapa.fechaReal ?? ""} onChange={(e) => update(idx, { fechaReal: e.target.value || null })} />
              </Field>
              <Field label="Notas" className="sm:col-span-2">
                <TextArea disabled={!editable} value={etapa.notas} onChange={(e) => update(idx, { notas: e.target.value })} className="min-h-[56px]" />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
