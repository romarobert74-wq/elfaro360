"use client";

import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, Select, TextInput } from "@/components/ui/Field";
import { RowActions } from "@/components/ui/RowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { estadoCobroLabels, estadoCobroTone, metodoPagoLabels } from "@/lib/labels";
import { formatCurrency, formatDate, uid } from "@/lib/format";
import type { Cobro, MetodoPago } from "@/lib/types";

export default function CobrosPage() {
  const store = useStore();
  const { cobros, clientes, presupuestos, addCobro, updateCobro, removeCobro, can } = store;
  const editable = can("cobros", "edit");

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";
  const presNum = (id: string) => presupuestos.find((p) => p.id === id)?.numero ?? "—";

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Cobro | null>(null);
  const [form, setForm] = useState<Omit<Cobro, "id">>({
    presupuestoId: presupuestos[0]?.id ?? "",
    clienteId: clientes[0]?.id ?? "",
    metodo: "transferencia",
    importe: 0,
    estado: "pendiente",
    fecha: null,
  });
  const [toDelete, setToDelete] = useState<Cobro | null>(null);

  const totalPendiente = useMemo(() => cobros.filter((c) => c.estado === "pendiente").reduce((a, c) => a + c.importe, 0), [cobros]);
  const totalCobrado = useMemo(() => cobros.filter((c) => c.estado === "cobrado").reduce((a, c) => a + c.importe, 0), [cobros]);

  const toggle = (c: Cobro) =>
    updateCobro({ ...c, estado: c.estado === "cobrado" ? "pendiente" : "cobrado", fecha: c.estado === "cobrado" ? null : new Date().toISOString().slice(0, 10) });

  const openNew = () => {
    setEditing(null);
    setForm({ presupuestoId: presupuestos[0]?.id ?? "", clienteId: clientes[0]?.id ?? "", metodo: "transferencia", importe: 0, estado: "pendiente", fecha: null });
    setModal(true);
  };
  const openEdit = (c: Cobro) => { setEditing(c); const { id, ...rest } = c; setForm(rest); setModal(true); };
  const save = () => {
    if (editing) updateCobro({ ...form, id: editing.id });
    else addCobro({ ...form, id: uid("cob") });
    setModal(false);
  };

  // Al elegir presupuesto, autocompletar cliente
  const onPresupuesto = (id: string) => {
    const p = presupuestos.find((x) => x.id === id);
    setForm((f) => ({ ...f, presupuestoId: id, clienteId: p?.clienteId ?? f.clienteId, metodo: p?.metodoPago ?? f.metodo }));
  };

  const columns: Column<Cobro>[] = [
    {
      key: "cliente",
      header: "Cliente",
      render: (c) => (
        <div>
          <p className="font-medium">{clienteName(c.clienteId)}</p>
          <p className="text-xs text-content-subtle">{presNum(c.presupuestoId)}</p>
        </div>
      ),
    },
    { key: "metodo", header: "Método", hideOnMobile: true, render: (c) => <span className="text-content-muted">{metodoPagoLabels[c.metodo]}</span> },
    { key: "importe", header: "Importe", className: "text-right", render: (c) => <span className="font-medium tabular-nums">{formatCurrency(c.importe)}</span> },
    {
      key: "estado",
      header: "Estado",
      render: (c) => (
        <button disabled={!editable} onClick={() => editable && toggle(c)} className={editable ? "cursor-pointer" : "cursor-default"}>
          <Badge tone={estadoCobroTone[c.estado]} dot>{estadoCobroLabels[c.estado]}</Badge>
        </button>
      ),
    },
    { key: "fecha", header: "Cobrado", hideOnMobile: true, render: (c) => <span className="text-content-muted">{formatDate(c.fecha)}</span> },
    ...(editable
      ? [{ key: "actions", header: "", className: "text-right w-24", render: (c: Cobro) => <RowActions onEdit={() => openEdit(c)} onDelete={() => setToDelete(c)} /> } as Column<Cobro>]
      : []),
  ];

  return (
    <Guard module="cobros">
      <PageHeader
        title="Cobros"
        subtitle="Cobros por presupuesto y cliente"
        actions={editable && <button className="btn-primary" onClick={openNew}><Icon name="plus" size={16} /> Nuevo cobro</button>}
      />

      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard label="Por cobrar" value={formatCurrency(totalPendiente)} icon="cobros" tone="orange" />
        <StatCard label="Cobrado" value={formatCurrency(totalCobrado)} icon="cobros" tone="green" />
      </div>

      <DataTable
        columns={columns}
        rows={cobros}
        empty={<EmptyState icon="cobros" title="Sin cobros" description="Se registran automáticamente al aprobar un presupuesto, o cargalos manualmente." />}
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Editar cobro" : "Nuevo cobro"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Presupuesto" className="sm:col-span-2">
            <Select value={form.presupuestoId} onChange={(e) => onPresupuesto(e.target.value)}>
              {presupuestos.map((p) => (<option key={p.id} value={p.id}>{p.numero} · {clienteName(p.clienteId)}</option>))}
            </Select>
          </Field>
          <Field label="Cliente">
            <Select value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
              {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
            </Select>
          </Field>
          <Field label="Método">
            <Select value={form.metodo} onChange={(e) => setForm({ ...form, metodo: e.target.value as MetodoPago })}>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="cheque_30_60">Cheque 30/60 días</option>
              <option value="cuotas_2">Pago en 2 cuotas</option>
            </Select>
          </Field>
          <Field label="Importe">
            <TextInput type="number" min={0} value={form.importe} onChange={(e) => setForm({ ...form, importe: Number(e.target.value) })} />
          </Field>
          <Field label="Estado">
            <Select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as "pendiente" | "cobrado", fecha: e.target.value === "cobrado" ? (form.fecha ?? new Date().toISOString().slice(0, 10)) : null })}>
              <option value="pendiente">Pendiente</option>
              <option value="cobrado">Cobrado</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && removeCobro(toDelete.id)}
        message="¿Eliminar este cobro?"
      />
    </Guard>
  );
}
