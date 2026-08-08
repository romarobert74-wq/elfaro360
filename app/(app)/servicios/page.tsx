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
import { formatCurrency, slug, uid } from "@/lib/format";
import type { Servicio } from "@/lib/types";

const empty: Omit<Servicio, "id"> = {
  tipo: "tour_virtual",
  nombre: "",
  unidad: "servicio",
  costo: 0,
  precioBase: 0,
};

export default function ServiciosPage() {
  const { servicios, settings, updateSettings, addServicio, updateServicio, removeServicio, can } = useStore();
  const editable = can("servicios", "edit");
  const tiposServicio = settings.catalogos.tiposServicio;
  const crearTipoServicio = (label: string) => {
    const value = slug(label);
    if (!tiposServicio.some((t) => t.value === value)) {
      updateSettings({ ...settings, catalogos: { ...settings.catalogos, tiposServicio: [...tiposServicio, { value, label }] } });
    }
    return value;
  };
  const [q, setQ] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Servicio | null>(null);
  const [form, setForm] = useState<Omit<Servicio, "id">>(empty);
  const [toDelete, setToDelete] = useState<Servicio | null>(null);

  const filtered = useMemo(
    () =>
      servicios.filter(
        (s) =>
          s.nombre.toLowerCase().includes(q.toLowerCase()) &&
          (tipoFilter === "todos" || s.tipo === tipoFilter)
      ),
    [servicios, q, tipoFilter]
  );

  const openNew = () => { setEditing(null); setForm(empty); setModal(true); };
  const openEdit = (s: Servicio) => { setEditing(s); const { id, ...rest } = s; setForm(rest); setModal(true); };
  const save = () => {
    if (!form.nombre.trim()) return;
    if (editing) updateServicio({ ...form, id: editing.id });
    else addServicio({ ...form, id: uid("srv") });
    setModal(false);
  };

  const columns: Column<Servicio>[] = [
    { key: "nombre", header: "Servicio", sortValue: (s) => s.nombre, render: (s) => <span className="font-medium">{s.nombre}</span> },
    { key: "tipo", header: "Tipo", sortValue: (s) => catalogLabel(tiposServicio, s.tipo), render: (s) => <Badge tone={toneForValue(s.tipo)}>{catalogLabel(tiposServicio, s.tipo)}</Badge> },
    { key: "unidad", header: "Unidad", hideOnMobile: true, sortValue: (s) => s.unidad, render: (s) => <span className="text-content-muted">{s.unidad}</span> },
    { key: "costo", header: "Costo", hideOnMobile: true, className: "text-right", sortValue: (s) => s.costo, render: (s) => <span className="tabular-nums text-content-muted">{formatCurrency(s.costo)}</span> },
    { key: "precio", header: "Precio final", className: "text-right", sortValue: (s) => s.precioBase, render: (s) => <span className="font-medium tabular-nums">{formatCurrency(s.precioBase)}</span> },
    {
      key: "margen",
      header: "Margen",
      hideOnMobile: true,
      className: "text-right",
      sortValue: (s) => (s.precioBase > 0 ? (s.precioBase - s.costo) / s.precioBase : 0),
      render: (s) => {
        const m = s.precioBase - s.costo;
        const pct = s.precioBase > 0 ? Math.round((m / s.precioBase) * 100) : 0;
        return <span className="tabular-nums text-spectrum-green">{pct}%</span>;
      },
    },
    { key: "actions", header: "", className: "text-right w-24", render: (s) => <RowActions disabled={!editable} onEdit={() => openEdit(s)} onDelete={() => setToDelete(s)} /> },
  ];

  return (
    <Guard module="servicios">
      <PageHeader
        title="Servicios"
        subtitle="Catálogo de servicios y precios base"
        actions={editable && (
          <button className="btn-primary" onClick={openNew}><Icon name="plus" size={16} /> Nuevo servicio</button>
        )}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar servicio…" />
        <Select value={tipoFilter} onChange={(e) => setTipoFilter(e.target.value)} className="sm:w-52">
          <option value="todos">Todos los tipos</option>
          {tiposServicio.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
        </Select>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        empty={<EmptyState icon="servicios" title="Sin servicios" description="No hay servicios que coincidan." />}
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Editar servicio" : "Nuevo servicio"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre *" className="sm:col-span-2">
            <TextInput value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej. Tour virtual (mínimo 5 panoramas)" />
          </Field>
          <Field label="Tipo" hint="Podés crear tipos nuevos con el +">
            <CatalogSelect items={tiposServicio} value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} onCreate={crearTipoServicio} />
          </Field>
          <Field label="Unidad de medida">
            <TextInput value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} placeholder="tour, pack, video…" />
          </Field>
          <Field label="Costo (lo que me cuesta)" hint="Lo que le pago a los chicos por hacerlo">
            <TextInput type="number" min={0} value={form.costo} onChange={(e) => setForm({ ...form, costo: Number(e.target.value) })} />
          </Field>
          <Field label="Precio final (cliente)" hint="Lo que ve y paga el cliente">
            <TextInput type="number" min={0} value={form.precioBase} onChange={(e) => setForm({ ...form, precioBase: Number(e.target.value) })} />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && removeServicio(toDelete.id)}
        message={`¿Eliminar el servicio "${toDelete?.nombre}"?`}
      />
    </Guard>
  );
}
