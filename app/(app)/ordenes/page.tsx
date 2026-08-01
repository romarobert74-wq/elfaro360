"use client";

import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { useStore } from "@/components/providers/StoreProvider";
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
  const { ordenes, clientes, destinos, empleados, currentUser, updateOrden, can } = store;
  const editable = can("ordenes", "edit");
  const isEmpleado = currentUser?.role === "empleado";
  const [open, setOpen] = useState<OrdenTrabajo | null>(null);

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";
  const destinoName = (id: string) => destinos.find((d) => d.id === id)?.nombre ?? "—";
  const empName = (id: string | null) => empleados.find((e) => e.id === id)?.nombre ?? null;

  // Empleado ve solo las órdenes donde tiene alguna etapa asignada
  const visibles = useMemo(() => {
    if (isEmpleado && currentUser?.empleadoId) {
      return ordenes.filter((o) => o.etapas.some((e) => e.empleadoId === currentUser.empleadoId));
    }
    return ordenes;
  }, [ordenes, isEmpleado, currentUser]);

  const progreso = (o: OrdenTrabajo) => {
    const done = o.etapas.filter((e) => e.estado === "completado").length;
    return Math.round((done / o.etapas.length) * 100);
  };

  return (
    <Guard module="ordenes">
      <PageHeader title="Órdenes de Trabajo" subtitle="Pipeline de producción: Agendado → Filmación → Edición → Publicación → Entregado" />

      {visibles.length === 0 ? (
        <EmptyState icon="ordenes" title="Sin órdenes" description="Las órdenes se generan al aprobar un presupuesto." />
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
