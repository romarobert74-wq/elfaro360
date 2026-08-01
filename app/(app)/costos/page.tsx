"use client";

import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { RowActions } from "@/components/ui/RowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { tipoCostoLabels } from "@/lib/labels";
import { formatCurrency, uid } from "@/lib/format";
import type { Costo, FrecuenciaCosto, TipoCosto } from "@/lib/types";

const frecuenciaLabels: Record<FrecuenciaCosto, string> = {
  mensual: "Mensual",
  anual: "Anual",
  por_trabajo: "Por trabajo",
  unico: "Único",
};

const empty: Omit<Costo, "id"> = { nombre: "", tipo: "fijo", precio: 0, cantidad: 1, frecuencia: "mensual" };

export default function CostosPage() {
  const { costos, addCosto, updateCosto, removeCosto, can } = useStore();
  const editable = can("costos", "edit");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Costo | null>(null);
  const [form, setForm] = useState<Omit<Costo, "id">>(empty);
  const [toDelete, setToDelete] = useState<Costo | null>(null);

  const totalFijoMensual = useMemo(
    () =>
      costos
        .filter((c) => c.tipo === "fijo")
        .reduce((a, c) => a + c.precio * c.cantidad * (c.frecuencia === "anual" ? 1 / 12 : 1), 0),
    [costos]
  );
  const totalVariable = useMemo(
    () => costos.filter((c) => c.tipo === "variable").reduce((a, c) => a + c.precio * c.cantidad, 0),
    [costos]
  );

  const openNew = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (c: Costo) => { setEditing(c); const { id, ...rest } = c; setForm(rest); setModal(true); };
  const save = () => {
    if (!form.nombre.trim()) return;
    if (editing) updateCosto({ ...form, id: editing.id });
    else addCosto({ ...form, id: uid("cos") });
    setModal(false);
  };

  const columns: Column<Costo>[] = [
    { key: "nombre", header: "Concepto", render: (c) => <span className="font-medium">{c.nombre}</span> },
    { key: "tipo", header: "Tipo", render: (c) => <Badge tone={c.tipo === "fijo" ? "navy" : "orange"}>{tipoCostoLabels[c.tipo]}</Badge> },
    { key: "frecuencia", header: "Frecuencia", hideOnMobile: true, render: (c) => <span className="text-content-muted">{frecuenciaLabels[c.frecuencia]}</span> },
    { key: "cantidad", header: "Cant.", hideOnMobile: true, className: "text-right", render: (c) => <span className="tabular-nums text-content-muted">{c.cantidad}</span> },
    { key: "precio", header: "Precio", className: "text-right", render: (c) => <span className="tabular-nums">{formatCurrency(c.precio)}</span> },
    { key: "subtotal", header: "Subtotal", className: "text-right", render: (c) => <span className="font-medium tabular-nums">{formatCurrency(c.precio * c.cantidad)}</span> },
    { key: "actions", header: "", className: "text-right w-24", render: (c) => <RowActions disabled={!editable} onEdit={() => openEdit(c)} onDelete={() => setToDelete(c)} /> },
  ];

  return (
    <Guard module="costos">
      <PageHeader
        title="Costos"
        subtitle="Costos fijos y variables de la empresa"
        actions={editable && <button className="btn-primary" onClick={openNew}><Icon name="plus" size={16} /> Nuevo costo</button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard label="Costos fijos (mensual)" value={formatCurrency(totalFijoMensual)} icon="costos" tone="navy" />
        <StatCard label="Costos variables" value={formatCurrency(totalVariable)} icon="costos" tone="orange" />
      </div>

      <DataTable
        columns={columns}
        rows={costos}
        empty={<EmptyState icon="costos" title="Sin costos" description="Cargá los costos fijos y variables de la empresa." />}
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Editar costo" : "Nuevo costo"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Concepto *" className="sm:col-span-2">
            <TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Tipo">
            <Select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoCosto })}>
              <option value="fijo">Fijo</option>
              <option value="variable">Variable</option>
            </Select>
          </Field>
          <Field label="Frecuencia">
            <Select value={form.frecuencia} onChange={(e) => setForm({ ...form, frecuencia: e.target.value as FrecuenciaCosto })}>
              <option value="mensual">Mensual</option>
              <option value="anual">Anual</option>
              <option value="por_trabajo">Por trabajo</option>
              <option value="unico">Único</option>
            </Select>
          </Field>
          <Field label="Precio">
            <TextInput type="number" min={0} value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} />
          </Field>
          <Field label="Cantidad">
            <TextInput type="number" min={0} value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: Number(e.target.value) })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && removeCosto(toDelete.id)}
        message={`¿Eliminar el costo "${toDelete?.nombre}"?`}
      />
    </Guard>
  );
}
