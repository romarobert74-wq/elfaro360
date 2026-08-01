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
import { verticalLabels, verticalTone } from "@/lib/labels";
import { zonaParaKm } from "@/lib/calc";
import { formatCurrency, uid } from "@/lib/format";
import type { Destino, Vertical } from "@/lib/types";

const empty: Omit<Destino, "id"> = {
  clienteId: "",
  nombre: "",
  direccion: "",
  distanciaKm: 0,
  telefono: "",
  whatsapp: "",
  redes: {},
  web: "",
  vertical: "real_estate",
  datos: {},
};

// Campo específico según vertical
const datoConfig: Record<Vertical, { key: keyof Destino["datos"]; label: string; unidad: string } | null> = {
  real_estate: { key: "m2", label: "Metros cuadrados", unidad: "m²" },
  hotel: { key: "habitaciones", label: "Habitaciones", unidad: "hab." },
  bodega: { key: "hectareas", label: "Hectáreas", unidad: "ha" },
  restaurante: { key: "mesas", label: "Mesas", unidad: "mesas" },
  otro: null,
};

export default function DestinosPage() {
  const { destinos, clientes, settings, addDestino, updateDestino, removeDestino, can } = useStore();
  const editable = can("destinos", "edit");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Destino | null>(null);
  const [form, setForm] = useState<Omit<Destino, "id">>({ ...empty, clienteId: clientes[0]?.id ?? "" });
  const [toDelete, setToDelete] = useState<Destino | null>(null);

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";

  const filtered = useMemo(
    () =>
      destinos.filter(
        (d) =>
          d.nombre.toLowerCase().includes(q.toLowerCase()) ||
          d.direccion.toLowerCase().includes(q.toLowerCase()) ||
          clienteName(d.clienteId).toLowerCase().includes(q.toLowerCase())
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [destinos, q, clientes]
  );

  const openNew = () => {
    setEditing(null);
    setForm({ ...empty, clienteId: clientes[0]?.id ?? "" });
    setModal(true);
  };
  const openEdit = (d: Destino) => {
    setEditing(d);
    const { id, ...rest } = d;
    setForm(rest);
    setModal(true);
  };
  const save = () => {
    if (!form.nombre.trim() || !form.clienteId) return;
    if (editing) updateDestino({ ...form, id: editing.id });
    else addDestino({ ...form, id: uid("des") });
    setModal(false);
  };

  const datoActual = datoConfig[form.vertical];

  const zonaHint = (() => {
    const z = zonaParaKm(form.distanciaKm, settings.zonas);
    if (!z) return "Se usa para calcular el traslado";
    const costo = z.costo != null ? formatCurrency(z.costo) : "a consultar";
    return `${z.nombre} · traslado al cliente ${costo} · pago al relevador ${formatCurrency(form.distanciaKm * settings.tarifaKmEmpleado)}`;
  })();

  const datoResumen = (d: Destino) => {
    const cfg = datoConfig[d.vertical];
    if (!cfg) return d.datos.extra || "—";
    const val = d.datos[cfg.key];
    return val ? `${val} ${cfg.unidad}` : "—";
  };

  const columns: Column<Destino>[] = [
    {
      key: "nombre",
      header: "Destino",
      render: (d) => (
        <div>
          <p className="font-medium">{d.nombre}</p>
          <p className="text-xs text-content-subtle">{d.direccion || "—"}</p>
        </div>
      ),
    },
    { key: "cliente", header: "Cliente", hideOnMobile: true, render: (d) => <span className="text-content-muted">{clienteName(d.clienteId)}</span> },
    { key: "vertical", header: "Vertical", render: (d) => <Badge tone={verticalTone[d.vertical]}>{verticalLabels[d.vertical]}</Badge> },
    { key: "dato", header: "Datos", hideOnMobile: true, render: (d) => <span className="text-content-muted">{datoResumen(d)}</span> },
    { key: "km", header: "Distancia", hideOnMobile: true, render: (d) => <span className="text-content-muted">{d.distanciaKm} km</span> },
    {
      key: "actions",
      header: "",
      className: "text-right w-24",
      render: (d) => <RowActions disabled={!editable} onEdit={() => openEdit(d)} onDelete={() => setToDelete(d)} />,
    },
  ];

  return (
    <Guard module="destinos">
      <PageHeader
        title="Destinos"
        subtitle="Lugares a virtualizar, asociados a cada cliente"
        actions={
          editable && (
            <button className="btn-primary" onClick={openNew} disabled={clientes.length === 0}>
              <Icon name="plus" size={16} /> Nuevo destino
            </button>
          )
        }
      />

      <div className="mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por destino, dirección o cliente…" />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        empty={
          <EmptyState
            icon="destinos"
            title="Sin destinos"
            description={clientes.length === 0 ? "Primero cargá un cliente para poder asociar destinos." : "Todavía no cargaste destinos."}
          />
        }
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Editar destino" : "Nuevo destino"}
        size="lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente *">
            <Select value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </Select>
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                const c = clientes.find((x) => x.id === form.clienteId);
                if (!c) return;
                setForm({
                  ...form,
                  nombre: c.nombre,
                  telefono: c.telefono,
                  whatsapp: c.whatsapp,
                  redes: { ...c.redes },
                  web: c.web,
                });
              }}
              className="btn-ghost w-full"
              title="Copiar los datos del cliente al destino"
            >
              <Icon name="clientes" size={16} /> Ídem al cliente
            </button>
          </div>
          <Field label="Nombre del lugar *" className="sm:col-span-2">
            <TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Bodega Salentein (o tocá 'Ídem al cliente')" />
          </Field>
          <Field label="Dirección" className="sm:col-span-2">
            <TextInput value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </Field>
          <Field label="Vertical">
            <Select
              value={form.vertical}
              onChange={(e) => setForm({ ...form, vertical: e.target.value as Vertical, datos: {} })}
            >
              <option value="real_estate">Real Estate</option>
              <option value="bodega">Bodega</option>
              <option value="hotel">Hotel</option>
              <option value="restaurante">Restaurante</option>
              <option value="otro">Otro</option>
            </Select>
          </Field>
          {/* Campo flexible según vertical */}
          {datoActual ? (
            <Field label={datoActual.label} hint={`Dato específico para ${verticalLabels[form.vertical].toLowerCase()}`}>
              <TextInput
                type="number"
                min={0}
                value={(form.datos[datoActual.key] as number | undefined) ?? ""}
                onChange={(e) => setForm({ ...form, datos: { ...form.datos, [datoActual.key]: Number(e.target.value) } })}
              />
            </Field>
          ) : (
            <Field label="Dato específico">
              <TextInput value={form.datos.extra ?? ""} onChange={(e) => setForm({ ...form, datos: { extra: e.target.value } })} />
            </Field>
          )}
          <Field label="Distancia (km)" hint={zonaHint}>
            <TextInput type="number" min={0} value={form.distanciaKm} onChange={(e) => setForm({ ...form, distanciaKm: Number(e.target.value) })} />
          </Field>
          <Field label="Teléfono">
            <TextInput value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </Field>
          <Field label="WhatsApp">
            <TextInput value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </Field>
          <Field label="Instagram">
            <TextInput value={form.redes.instagram ?? ""} onChange={(e) => setForm({ ...form, redes: { ...form.redes, instagram: e.target.value } })} />
          </Field>
          <Field label="Web">
            <TextInput value={form.web} onChange={(e) => setForm({ ...form, web: e.target.value })} placeholder="https://" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && removeDestino(toDelete.id)}
        message={`¿Eliminar el destino "${toDelete?.nombre}"?`}
      />
    </Guard>
  );
}
