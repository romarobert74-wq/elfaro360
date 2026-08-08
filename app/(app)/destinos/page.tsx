"use client";

import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, TextInput, Select } from "@/components/ui/Field";
import { CatalogSelect } from "@/components/ui/CatalogSelect";
import { RowActions } from "@/components/ui/RowActions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { catalogLabel, toneForValue } from "@/lib/labels";
import { zonaParaKm } from "@/lib/calc";
import { formatCurrency, slug, uid } from "@/lib/format";
import type { Destino } from "@/lib/types";

const empty: Omit<Destino, "id"> = {
  clienteId: "",
  nombre: "",
  direccion: "",
  distanciaKm: 0,
  telefono: "",
  redes: {},
  web: "",
  vertical: "real_estate",
  campos: [],
};

export default function DestinosPage() {
  const { destinos, clientes, settings, updateSettings, addDestino, updateDestino, removeDestino, can } = useStore();
  const editable = can("destinos", "edit");
  const verticales = settings.catalogos.verticales;
  const crearVertical = (label: string) => {
    const value = slug(label);
    if (!verticales.some((v) => v.value === value)) {
      updateSettings({ ...settings, catalogos: { ...settings.catalogos, verticales: [...verticales, { value, label }] } });
    }
    return value;
  };

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

  const openNew = () => { setEditing(null); setForm({ ...empty, clienteId: clientes[0]?.id ?? "" }); setModal(true); };
  const openEdit = (d: Destino) => { setEditing(d); const { id, ...rest } = d; setForm(rest); setModal(true); };
  const save = () => {
    if (!form.nombre.trim() || !form.clienteId) return;
    const clean = { ...form, campos: form.campos.filter((c) => c.label.trim() || c.value.trim()) };
    if (editing) updateDestino({ ...clean, id: editing.id });
    else addDestino({ ...clean, id: uid("des") });
    setModal(false);
  };

  // Campos flexibles
  const addCampo = () => setForm((f) => ({ ...f, campos: [...f.campos, { id: uid("c"), label: "", value: "" }] }));
  const setCampo = (id: string, patch: Partial<{ label: string; value: string }>) =>
    setForm((f) => ({ ...f, campos: f.campos.map((c) => (c.id === id ? { ...c, ...patch } : c)) }));
  const removeCampo = (id: string) => setForm((f) => ({ ...f, campos: f.campos.filter((c) => c.id !== id) }));

  const zonaHint = (() => {
    const z = zonaParaKm(form.distanciaKm, settings.zonas);
    if (!z) return "Se usa para calcular el traslado";
    const costo = z.costo != null ? formatCurrency(z.costo) : "a consultar";
    return `${z.nombre} · traslado al cliente ${costo} · pago al relevador ${formatCurrency(form.distanciaKm * settings.tarifaKmEmpleado)}`;
  })();

  const camposResumen = (d: Destino) => (d.campos.length ? d.campos.map((c) => `${c.value} ${c.label}`).join(" · ") : "—");

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
    { key: "vertical", header: "Vertical", render: (d) => <Badge tone={toneForValue(d.vertical)}>{catalogLabel(verticales, d.vertical)}</Badge> },
    { key: "dato", header: "Datos", hideOnMobile: true, render: (d) => <span className="text-content-muted">{camposResumen(d)}</span> },
    { key: "km", header: "Distancia", hideOnMobile: true, render: (d) => <span className="text-content-muted">{d.distanciaKm} km</span> },
    { key: "actions", header: "", className: "text-right w-24", render: (d) => <RowActions disabled={!editable} onEdit={() => openEdit(d)} onDelete={() => setToDelete(d)} /> },
  ];

  return (
    <Guard module="destinos">
      <PageHeader
        title="Destinos"
        subtitle="Lugares a virtualizar, asociados a cada cliente"
        actions={editable && (
          <button className="btn-primary" onClick={openNew} disabled={clientes.length === 0}>
            <Icon name="plus" size={16} /> Nuevo destino
          </button>
        )}
      />

      <div className="mb-4">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por destino, dirección o cliente…" />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        empty={<EmptyState icon="destinos" title="Sin destinos" description={clientes.length === 0 ? "Primero cargá un cliente." : "Todavía no cargaste destinos."} />}
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
              {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
            </Select>
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                const c = clientes.find((x) => x.id === form.clienteId);
                if (!c) return;
                setForm({ ...form, nombre: c.nombre, telefono: c.telefono, redes: { ...c.redes }, web: c.web });
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
          <Field label="Vertical" hint="Podés crear verticales nuevas con el +">
            <CatalogSelect items={verticales} value={form.vertical} onChange={(v) => setForm({ ...form, vertical: v })} onCreate={crearVertical} />
          </Field>
          <Field label="Distancia (km)" hint={zonaHint}>
            <TextInput type="number" min={0} value={form.distanciaKm} onChange={(e) => setForm({ ...form, distanciaKm: Number(e.target.value) })} />
          </Field>

          {/* Campos flexibles */}
          <div className="sm:col-span-2">
            <p className="label">Datos del lugar</p>
            <div className="space-y-2">
              {form.campos.map((c) => (
                <div key={c.id} className="flex items-center gap-2">
                  <TextInput className="flex-1" placeholder="Dato (ej. M² cubiertos)" value={c.label} onChange={(e) => setCampo(c.id, { label: e.target.value })} />
                  <TextInput className="w-32" placeholder="Valor" value={c.value} onChange={(e) => setCampo(c.id, { value: e.target.value })} />
                  <button type="button" onClick={() => removeCampo(c.id)} className="rounded-lg p-2 text-content-muted hover:text-spectrum-red"><Icon name="x" size={16} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addCampo} className="btn-ghost mt-2 w-full">
              <Icon name="plus" size={16} /> Añadir dato (m² cubiertos, terreno, habitaciones…)
            </button>
          </div>

          <Field label="WhatsApp / Teléfono">
            <TextInput value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="+54 9 261 …" />
          </Field>
          <Field label="Instagram">
            <TextInput value={form.redes.instagram ?? ""} onChange={(e) => setForm({ ...form, redes: { ...form.redes, instagram: e.target.value } })} />
          </Field>
          <Field label="Web" className="sm:col-span-2">
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
