"use client";

import Link from "next/link";
import { useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { RowActions } from "@/components/ui/RowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { roleLabels } from "@/lib/labels";
import { uid } from "@/lib/format";
import type { Role, User } from "@/lib/types";

const roleTone: Record<Role, "violet" | "brand" | "green" | "gray"> = {
  super_admin: "violet",
  admin: "brand",
  empleado: "green",
  cliente: "gray",
};

const empty: Omit<User, "id"> = { nombre: "", email: "", role: "empleado", empleadoId: undefined, activo: true };

export default function UsuariosPage() {
  const { users, empleados, currentUser, addUser, updateUser, removeUser, can } = useStore();
  const editable = can("usuarios", "edit");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState<Omit<User, "id">>(empty);
  const [toDelete, setToDelete] = useState<User | null>(null);

  const openNew = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (u: User) => { setEditing(u); const { id, ...rest } = u; setForm(rest); setModal(true); };
  const save = () => {
    if (!form.nombre.trim() || !form.email.trim()) return;
    const clean = { ...form, empleadoId: form.role === "empleado" ? form.empleadoId : undefined };
    if (editing) updateUser({ ...clean, id: editing.id });
    else addUser({ ...clean, id: uid("usr") });
    setModal(false);
  };

  const columns: Column<User>[] = [
    {
      key: "nombre",
      header: "Usuario",
      render: (u) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
            {u.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
          </span>
          <div>
            <p className="font-medium">{u.nombre} {currentUser?.id === u.id && <span className="text-xs text-content-subtle">(vos)</span>}</p>
            <p className="text-xs text-content-subtle">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Rol", render: (u) => <Badge tone={roleTone[u.role]}>{roleLabels[u.role]}</Badge> },
    {
      key: "empleado",
      header: "Ficha empleado",
      hideOnMobile: true,
      render: (u) => <span className="text-content-muted">{u.empleadoId ? empleados.find((e) => e.id === u.empleadoId)?.nombre ?? "—" : "—"}</span>,
    },
    { key: "activo", header: "Estado", render: (u) => <Badge tone={u.activo ? "green" : "gray"} dot>{u.activo ? "Activo" : "Inactivo"}</Badge> },
    { key: "actions", header: "", className: "text-right w-24", render: (u) => <RowActions disabled={!editable} onEdit={() => openEdit(u)} onDelete={currentUser?.id === u.id ? undefined : () => setToDelete(u)} /> },
  ];

  return (
    <Guard module="usuarios">
      <PageHeader
        title="Usuarios y Roles"
        subtitle="Gestión de accesos al sistema"
        actions={
          <>
            <Link href="/configuracion/permisos" className="btn-ghost"><Icon name="permisos" size={16} /> Permisos</Link>
            {editable && <button className="btn-primary" onClick={openNew}><Icon name="plus" size={16} /> Nuevo usuario</button>}
          </>
        }
      />

      {!editable && (
        <div className="mb-4 rounded-lg border border-line bg-surface-raised px-4 py-2.5 text-xs text-content-muted">
          <Icon name="permisos" size={14} className="mr-1 inline" /> Solo un <b>Super Admin</b> puede crear o modificar usuarios.
        </div>
      )}

      <DataTable columns={columns} rows={users} empty={<EmptyState icon="usuarios" title="Sin usuarios" />} />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Editar usuario" : "Nuevo usuario"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *">
            <TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </Field>
          <Field label="Email *">
            <TextInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Rol">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Administrador</option>
              <option value="empleado">Empleado</option>
            </Select>
          </Field>
          {form.role === "empleado" && (
            <Field label="Vincular con empleado" hint="Para que vea solo sus trabajos y pagos">
              <Select value={form.empleadoId ?? ""} onChange={(e) => setForm({ ...form, empleadoId: e.target.value || undefined })}>
                <option value="">Sin vincular</option>
                {empleados.map((e) => (<option key={e.id} value={e.id}>{e.nombre}</option>))}
              </Select>
            </Field>
          )}
          <Field label="Estado">
            <Select value={form.activo ? "1" : "0"} onChange={(e) => setForm({ ...form, activo: e.target.value === "1" })}>
              <option value="1">Activo</option>
              <option value="0">Inactivo</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && removeUser(toDelete.id)}
        message={`¿Eliminar al usuario "${toDelete?.nombre}"?`}
      />
    </Guard>
  );
}
