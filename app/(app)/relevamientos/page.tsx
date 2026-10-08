"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { buildRelevamiento } from "@/lib/relevamiento";
import { formatDate } from "@/lib/format";
import type { Relevamiento } from "@/lib/types";

export default function RelevamientosPage() {
  const router = useRouter();
  const { relevamientos, destinos, clientes, empleados, currentUser, addRelevamiento, removeRelevamiento, can } = useStore();
  const editable = can("relevamientos", "edit");
  const isEmpleado = currentUser?.role === "empleado";

  const [nuevaOpen, setNuevaOpen] = useState(false);
  const [nvDestino, setNvDestino] = useState("");
  const [nvEmpleado, setNvEmpleado] = useState(isEmpleado ? (currentUser?.empleadoId ?? "") : "");
  const [toDelete, setToDelete] = useState<Relevamiento | null>(null);

  const destinoName = (id: string) => destinos.find((d) => d.id === id)?.nombre ?? "—";
  const clienteDeDestino = (destinoId: string) => {
    const d = destinos.find((x) => x.id === destinoId);
    return d ? (clientes.find((c) => c.id === d.clienteId)?.nombre ?? "") : "";
  };
  const empName = (id: string | null) => empleados.find((e) => e.id === id)?.nombre ?? null;

  // El empleado ve solo los relevamientos asignados a él
  const visibles = isEmpleado && currentUser?.empleadoId
    ? relevamientos.filter((r) => r.empleadoId === currentUser.empleadoId)
    : relevamientos;

  const crear = () => {
    if (!nvDestino) return;
    const destino = destinos.find((d) => d.id === nvDestino);
    const rel = buildRelevamiento(destino, nvEmpleado || null);
    addRelevamiento(rel);
    setNuevaOpen(false);
    router.push(`/relevamientos/${rel.id}`);
  };

  return (
    <Guard module="relevamientos">
      <PageHeader
        title="Relevamientos"
        subtitle="Checklist de preparación, datos del destino y cierre del relevamiento"
        actions={
          editable && (
            <button className="btn-primary" onClick={() => { setNvDestino(""); setNuevaOpen(true); }} disabled={destinos.length === 0}>
              <Icon name="plus" size={16} /> Nuevo relevamiento
            </button>
          )
        }
      />

      {visibles.length === 0 ? (
        <EmptyState
          icon="check"
          title="Sin relevamientos"
          description="Creá uno nuevo eligiendo el destino. Después podés compartir el link por WhatsApp al equipo."
        />
      ) : (
        <div className="grid gap-3">
          {visibles.map((r) => (
            <div key={r.id} className="card group flex items-center justify-between gap-3 p-4">
              <button onClick={() => router.push(`/relevamientos/${r.id}`)} className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-bold">{destinoName(r.destinoId)}</span>
                  <Badge tone={r.estado === "completado" ? "green" : "orange"} dot>
                    {r.estado === "completado" ? "Completado" : "Borrador"}
                  </Badge>
                </div>
                <p className="mt-0.5 text-sm text-content-muted">
                  {clienteDeDestino(r.destinoId)}
                  {empName(r.empleadoId) ? ` · ${empName(r.empleadoId)}` : ""} · {formatDate(r.fechaCreacion)}
                </p>
              </button>
              <div className="flex items-center gap-1">
                <button onClick={() => router.push(`/relevamientos/${r.id}`)} className="rounded-lg p-1.5 text-content-muted transition hover:bg-brand/15 hover:text-brand" title="Abrir">
                  <Icon name="chevronRight" size={18} />
                </button>
                {editable && (
                  <button onClick={() => setToDelete(r)} className="rounded-lg p-1.5 text-content-muted transition hover:bg-spectrum-red/15 hover:text-spectrum-red" title="Eliminar">
                    <Icon name="trash" size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={nuevaOpen}
        onClose={() => setNuevaOpen(false)}
        title="Nuevo relevamiento"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setNuevaOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={crear} disabled={!nvDestino}><Icon name="check" size={16} /> Crear</button>
          </>
        }
      >
        <div className="grid gap-4">
          <Field label="Destino *" hint="Se traen sus datos al Paso 2">
            <Select value={nvDestino} onChange={(e) => setNvDestino(e.target.value)}>
              <option value="">Seleccionar…</option>
              {destinos.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}{clienteDeDestino(d.id) ? ` — ${clienteDeDestino(d.id)}` : ""}</option>
              ))}
            </Select>
          </Field>
          {!isEmpleado && (
            <Field label="Asignar a (opcional)">
              <Select value={nvEmpleado} onChange={(e) => setNvEmpleado(e.target.value)}>
                <option value="">Sin asignar</option>
                {empleados.map((e) => (<option key={e.id} value={e.id}>{e.nombre}</option>))}
              </Select>
            </Field>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && removeRelevamiento(toDelete.id)}
        message="¿Eliminar este relevamiento?"
      />
    </Guard>
  );
}
