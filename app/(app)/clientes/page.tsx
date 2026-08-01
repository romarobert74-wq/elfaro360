"use client";

import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput, TextArea, Select } from "@/components/ui/Field";
import { RowActions } from "@/components/ui/RowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { tipoClienteLabels, tipoClienteTone } from "@/lib/labels";
import { uid } from "@/lib/format";
import type { Cliente, TipoCliente } from "@/lib/types";

const empty: Omit<Cliente, "id"> = {
  nombre: "",
  razonSocial: "",
  tipoCliente: "inmobiliaria",
  telefono: "",
  whatsapp: "",
  redes: { instagram: "" },
  web: "",
  notas: "",
};

export default function ClientesPage() {
  const { clientes, destinos, addCliente, updateCliente, removeCliente, can } = useStore();
  const editable = can("clientes", "edit");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [form, setForm] = useState<Omit<Cliente, "id">>(empty);
  const [toDelete, setToDelete] = useState<Cliente | null>(null);

  const filtered = useMemo(
    () =>
      clientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q.toLowerCase()) ||
          c.razonSocial.toLowerCase().includes(q.toLowerCase())
      ),
    [clientes, q]
  );

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setModal(true);
  };
  const openEdit = (c: Cliente) => {
    setEditing(c);
    const { id, ...rest } = c;
    setForm(rest);
    setModal(true);
  };
  const save = () => {
    if (!form.nombre.trim()) return;
    if (editing) updateCliente({ ...form, id: editing.id });
    else addCliente({ ...form, id: uid("cli") });
    setModal(false);
  };

  const destinosCount = (id: string) => destinos.filter((d) => d.clienteId === id).length;

  const columns: Column<Cliente>[] = [
    {
      key: "nombre",
      header: "Cliente",
      render: (c) => (
        <div>
          <p className="font-medium">{c.nombre}</p>
          <p className="text-xs text-content-subtle">{c.razonSocial || "—"}</p>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      render: (c) => <Badge tone={tipoClienteTone[c.tipoCliente]}>{tipoClienteLabels[c.tipoCliente]}</Badge>,
    },
    {
      key: "contacto",
      header: "Contacto",
      hideOnMobile: true,
      render: (c) => (
        <div className="flex items-center gap-2 text-xs text-content-muted">
          {c.whatsapp && <Icon name="whatsapp" size={14} className="text-spectrum-green" />}
          <span>{c.telefono || c.whatsapp || "—"}</span>
        </div>
      ),
    },
    {
      key: "destinos",
      header: "Destinos",
      hideOnMobile: true,
      render: (c) => <span className="text-content-muted">{destinosCount(c.id)}</span>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right w-24",
      render: (c) => (
        <RowActions
          disabled={!editable}
          onEdit={() => openEdit(c)}
          onDelete={() => setToDelete(c)}
        />
      ),
    },
  ];

  return (
    <Guard module="clientes">
      <PageHeader
        title="Clientes"
        subtitle="Inmobiliarias, destinos turísticos y otros"
        actions={
          editable && (
            <button className="btn-primary" onClick={openNew}>
              <Icon name="plus" size={16} /> Nuevo cliente
            </button>
          )
        }
      />

      <div className="mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por nombre o razón social…" />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        empty={
          <EmptyState
            icon="clientes"
            title="Sin clientes"
            description={q ? "No hay resultados para tu búsqueda." : "Todavía no cargaste clientes."}
            action={editable && !q && (
              <button className="btn-primary" onClick={openNew}>
                <Icon name="plus" size={16} /> Nuevo cliente
              </button>
            )}
          />
        }
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Editar cliente" : "Nuevo cliente"}
        size="lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *">
            <TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre comercial" />
          </Field>
          <Field label="Razón social">
            <TextInput value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} />
          </Field>
          <Field label="Tipo de cliente">
            <Select value={form.tipoCliente} onChange={(e) => setForm({ ...form, tipoCliente: e.target.value as TipoCliente })}>
              <option value="inmobiliaria">Inmobiliaria</option>
              <option value="destino_turistico">Destino turístico</option>
              <option value="otros">Otros</option>
            </Select>
          </Field>
          <Field label="Web">
            <TextInput value={form.web} onChange={(e) => setForm({ ...form, web: e.target.value })} placeholder="https://" />
          </Field>
          <Field label="Teléfono">
            <TextInput value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </Field>
          <Field label="WhatsApp">
            <TextInput value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </Field>
          <Field label="Instagram">
            <TextInput value={form.redes.instagram ?? ""} onChange={(e) => setForm({ ...form, redes: { ...form.redes, instagram: e.target.value } })} placeholder="@usuario" />
          </Field>
          <Field label="Facebook">
            <TextInput value={form.redes.facebook ?? ""} onChange={(e) => setForm({ ...form, redes: { ...form.redes, facebook: e.target.value } })} />
          </Field>
          <Field label="Notas" className="sm:col-span-2">
            <TextArea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones, preferencias, historial…" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && removeCliente(toDelete.id)}
        message={`¿Eliminar el cliente "${toDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </Guard>
  );
}
