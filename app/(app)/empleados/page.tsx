"use client";

import { useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput } from "@/components/ui/Field";
import { CatalogSelect } from "@/components/ui/CatalogSelect";
import { RowActions } from "@/components/ui/RowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { catalogLabel, toneForValue } from "@/lib/labels";
import { slug, uid } from "@/lib/format";
import type { Empleado } from "@/lib/types";

const empty: Omit<Empleado, "id"> = { nombre: "", puesto: "relevador", telefono: "", email: "" };

export default function EmpleadosPage() {
  const { empleados, settings, updateSettings, addEmpleado, updateEmpleado, removeEmpleado, can } = useStore();
  const editable = can("empleados", "edit");
  const puestos = settings.catalogos.puestos;
  const crearPuesto = (label: string) => {
    const value = slug(label);
    if (!puestos.some((p) => p.value === value)) {
      updateSettings({ ...settings, catalogos: { ...settings.catalogos, puestos: [...puestos, { value, label }] } });
    }
    return value;
  };
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Empleado | null>(null);
  const [form, setForm] = useState<Omit<Empleado, "id">>(empty);
  const [toDelete, setToDelete] = useState<Empleado | null>(null);

  const openNew = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (e: Empleado) => { setEditing(e); const { id, ...rest } = e; setForm(rest); setModal(true); };
  const save = () => {
    if (!form.nombre.trim()) return;
    if (editing) updateEmpleado({ ...form, id: editing.id });
    else addEmpleado({ ...form, id: uid("emp") });
    setModal(false);
  };

  const columns: Column<Empleado>[] = [
    {
      key: "nombre",
      header: "Empleado",
      render: (e) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
            {e.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </span>
          <div>
            <p className="font-medium">{e.nombre}</p>
            <p className="text-xs text-content-subtle">{e.email || "—"}</p>
          </div>
        </div>
      ),
    },
    { key: "puesto", header: "Puesto", sortValue: (e) => catalogLabel(puestos, e.puesto), render: (e) => <Badge tone={toneForValue(e.puesto)}>{catalogLabel(puestos, e.puesto)}</Badge> },
    { key: "tel", header: "WhatsApp / Tel.", hideOnMobile: true, render: (e) => <span className="text-content-muted">{e.telefono || "—"}</span> },
    { key: "email", header: "Email", hideOnMobile: true, render: (e) => <span className="text-content-muted">{e.email || "—"}</span> },
    { key: "actions", header: "", className: "text-right w-24", render: (e) => <RowActions disabled={!editable} onEdit={() => openEdit(e)} onDelete={() => setToDelete(e)} /> },
  ];

  return (
    <Guard module="empleados">
      <PageHeader
        title="Empleados"
        subtitle="Equipo de producción"
        actions={editable && <button className="btn-primary" onClick={openNew}><Icon name="plus" size={16} /> Nuevo empleado</button>}
      />

      <DataTable
        columns={columns}
        rows={empleados}
        empty={<EmptyState icon="empleados" title="Sin empleados" description="Cargá tu equipo." />}
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Editar empleado" : "Nuevo empleado"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *" className="sm:col-span-2">
            <TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Puesto" hint="Podés crear puestos nuevos con el +">
            <CatalogSelect items={puestos} value={form.puesto} onChange={(v) => setForm({ ...form, puesto: v })} onCreate={crearPuesto} />
          </Field>
          <Field label="WhatsApp / Teléfono">
            <TextInput value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+54 9 261 …" />
          </Field>
          <Field label="Email">
            <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && removeEmpleado(toDelete.id)}
        message={`¿Eliminar a "${toDelete?.nombre}"?`}
      />
    </Guard>
  );
}
