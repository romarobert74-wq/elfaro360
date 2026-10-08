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
import { estadoPagoLabels, estadoPagoTone, etapaOrder, etapaPagoLabel } from "@/lib/labels";
import { formatCurrency, formatDate, uid } from "@/lib/format";
import type { EtapaPago, PagoEmpleado } from "@/lib/types";

export default function PagosPage() {
  const store = useStore();
  const { pagosEmpleados, empleados, ordenes, presupuestos, clientes, destinos, currentUser, addPago, updatePago, removePago, can } = store;
  const editable = can("pagos", "edit");
  const isEmpleado = currentUser?.role === "empleado";

  const empName = (id: string) => empleados.find((e) => e.id === id)?.nombre ?? "—";
  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";
  const ordenDe = (ordenId: string) => ordenes.find((x) => x.id === ordenId);
  // Nombre del presupuesto asociado a una orden (con cliente) — usado en el selector del modal
  const presupuestoDeOrden = (ordenId: string) => {
    const o = ordenDe(ordenId);
    if (!o) return "—";
    const pres = presupuestos.find((p) => p.id === o.presupuestoId);
    const dest = destinos.find((d) => d.id === o.destinoId)?.nombre;
    return `${pres?.numero ?? o.numero} · ${clienteName(o.clienteId)}${dest ? " · " + dest : ""}`;
  };
  // Solo el número de presupuesto (para la columna de la grilla)
  const presNumDeOrden = (ordenId: string) => {
    const o = ordenDe(ordenId);
    if (!o) return "—";
    return presupuestos.find((p) => p.id === o.presupuestoId)?.numero ?? o.numero;
  };
  // Cliente y destino a partir de la orden del pago
  const clienteDePago = (p: PagoEmpleado) => { const o = ordenDe(p.ordenId); return o ? clienteName(o.clienteId) : "—"; };
  const destinoDePago = (p: PagoEmpleado) => { const o = ordenDe(p.ordenId); return o ? (destinos.find((d) => d.id === o.destinoId)?.nombre ?? "—") : "—"; };

  const [filtroEmp, setFiltroEmp] = useState<string>("todos");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<PagoEmpleado | null>(null);
  const [form, setForm] = useState<Omit<PagoEmpleado, "id">>({
    empleadoId: empleados[0]?.id ?? "",
    ordenId: ordenes[0]?.id ?? "",
    etapas: ["relevamiento"],
    concepto: "",
    monto: 0,
    estado: "pendiente",
    fecha: null,
  });
  const [toDelete, setToDelete] = useState<PagoEmpleado | null>(null);
  const [resumenOpen, setResumenOpen] = useState(false);
  const [resumenEmp, setResumenEmp] = useState<string>("");

  const visibles = useMemo(() => {
    let rows = pagosEmpleados;
    if (isEmpleado && currentUser?.empleadoId) rows = rows.filter((p) => p.empleadoId === currentUser.empleadoId);
    else if (filtroEmp !== "todos") rows = rows.filter((p) => p.empleadoId === filtroEmp);
    return rows;
  }, [pagosEmpleados, isEmpleado, currentUser, filtroEmp]);

  const totalPendiente = visibles.filter((p) => p.estado === "pendiente").reduce((a, p) => a + p.monto, 0);
  const totalPagado = visibles.filter((p) => p.estado === "pagado").reduce((a, p) => a + p.monto, 0);

  const togglePago = (p: PagoEmpleado) =>
    updatePago({ ...p, estado: p.estado === "pagado" ? "pendiente" : "pagado", fecha: p.estado === "pagado" ? null : new Date().toISOString().slice(0, 10) });

  const openNew = () => {
    setEditing(null);
    setForm({ empleadoId: empleados[0]?.id ?? "", ordenId: ordenes[0]?.id ?? "", etapas: ["relevamiento"], concepto: "", monto: 0, estado: "pendiente", fecha: null });
    setModal(true);
  };
  const openEdit = (p: PagoEmpleado) => { setEditing(p); const { id, ...rest } = p; setForm(rest); setModal(true); };
  const save = () => {
    if (!form.empleadoId) return;
    if (editing) updatePago({ ...form, id: editing.id });
    else addPago({ ...form, id: uid("pag") });
    setModal(false);
  };

  // ----- Resumen por empleado + compartir por WhatsApp -----
  const descPago = (p: PagoEmpleado) => {
    const base = p.ordenId ? `${presNumDeOrden(p.ordenId)} · ${clienteDePago(p)}` : (p.concepto || "Gasto general");
    const et = p.etapas.length ? ` (${p.etapas.map(etapaPagoLabel).join(", ")})` : "";
    return base + et;
  };
  const resumenData = (empId: string) => {
    const rows = pagosEmpleados.filter((p) => p.empleadoId === empId);
    const pagados = rows.filter((p) => p.estado === "pagado");
    const pendientes = rows.filter((p) => p.estado === "pendiente");
    return { pagados, pendientes, totalPag: pagados.reduce((a, p) => a + p.monto, 0), totalPen: pendientes.reduce((a, p) => a + p.monto, 0) };
  };
  const abrirResumen = () => {
    setResumenEmp(filtroEmp !== "todos" ? filtroEmp : (empleados[0]?.id ?? ""));
    setResumenOpen(true);
  };
  const textoWhatsapp = (empId: string) => {
    const { pagados, pendientes, totalPag, totalPen } = resumenData(empId);
    const L: string[] = [];
    L.push(`*Resumen de pagos — ${empName(empId)}*`);
    L.push(formatDate(new Date().toISOString().slice(0, 10)));
    L.push("");
    L.push("✅ *PAGADO*");
    pagados.length ? pagados.forEach((p) => L.push(`• ${descPago(p)} — ${formatCurrency(p.monto)}${p.fecha ? " (" + formatDate(p.fecha) + ")" : ""}`)) : L.push("• (nada)");
    L.push(`Subtotal: ${formatCurrency(totalPag)}`);
    L.push("");
    L.push("⏳ *PENDIENTE*");
    pendientes.length ? pendientes.forEach((p) => L.push(`• ${descPago(p)} — ${formatCurrency(p.monto)}`)) : L.push("• (nada)");
    L.push(`Subtotal: ${formatCurrency(totalPen)}`);
    L.push("");
    L.push(`*Total pagado:* ${formatCurrency(totalPag)}`);
    L.push(`*Falta pagar:* ${formatCurrency(totalPen)}`);
    return L.join("\n");
  };
  const compartirWhatsapp = (empId: string) => {
    const emp = empleados.find((e) => e.id === empId);
    const num = (emp?.telefono || "").replace(/[^\d]/g, "");
    const texto = encodeURIComponent(textoWhatsapp(empId));
    const url = num ? `https://wa.me/${num}?text=${texto}` : `https://wa.me/?text=${texto}`;
    try { window.open(url, "_blank", "noopener"); } catch {}
  };

  const columns: Column<PagoEmpleado>[] = [
    { key: "emp", header: "Empleado", render: (p) => <span className="font-medium">{empName(p.empleadoId)}</span> },
    { key: "presupuesto", header: "Presupuesto", hideOnMobile: true, render: (p) => <span className="text-content-muted">{p.ordenId ? presNumDeOrden(p.ordenId) : (p.concepto || "Gasto general")}</span> },
    { key: "cliente", header: "Cliente", hideOnMobile: true, render: (p) => <span className="text-content-muted">{clienteDePago(p)}</span> },
    { key: "destino", header: "Destino", hideOnMobile: true, render: (p) => <span className="text-content-muted">{destinoDePago(p)}</span> },
    {
      key: "etapa",
      header: "Etapas",
      render: (p) => (
        <div>
          <span className="text-content-muted">{p.etapas.length ? p.etapas.map(etapaPagoLabel).join(", ") : "—"}</span>
          {p.concepto && <p className="text-xs text-content-subtle">{p.concepto}</p>}
        </div>
      ),
    },
    { key: "monto", header: "Monto", className: "text-right", render: (p) => <span className="font-medium tabular-nums">{formatCurrency(p.monto)}</span> },
    {
      key: "estado",
      header: "Estado",
      render: (p) => (
        <button
          disabled={!editable}
          onClick={() => editable && togglePago(p)}
          className={editable ? "cursor-pointer" : "cursor-default"}
          title={editable ? "Cambiar estado" : undefined}
        >
          <Badge tone={estadoPagoTone[p.estado]} dot>{estadoPagoLabels[p.estado]}</Badge>
        </button>
      ),
    },
    { key: "fecha", header: "Pagado", hideOnMobile: true, render: (p) => <span className="text-content-muted">{formatDate(p.fecha)}</span> },
    ...(editable
      ? [{ key: "actions", header: "", className: "text-right w-24", render: (p: PagoEmpleado) => <RowActions onEdit={() => openEdit(p)} onDelete={() => setToDelete(p)} /> } as Column<PagoEmpleado>]
      : []),
  ];

  return (
    <Guard module="pagos">
      <PageHeader
        title={isEmpleado ? "Mis Pagos" : "Pagos a Empleados"}
        subtitle={isEmpleado ? "Lo que se te debe y lo pagado" : "Registro de pagos por etapa de trabajo"}
        actions={!isEmpleado && (
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={abrirResumen} disabled={empleados.length === 0}><Icon name="whatsapp" size={16} /> Resumen</button>
            {editable && <button className="btn-primary" onClick={openNew}><Icon name="plus" size={16} /> Registrar pago</button>}
          </div>
        )}
      />

      <div className="mb-6 grid grid-cols-2 gap-4">
        <StatCard label="Pendiente de pago" value={formatCurrency(totalPendiente)} icon="pagos" tone="orange" />
        <StatCard label="Pagado" value={formatCurrency(totalPagado)} icon="pagos" tone="green" />
      </div>

      {!isEmpleado && (
        <div className="mb-4">
          <Select value={filtroEmp} onChange={(e) => setFiltroEmp(e.target.value)} className="sm:w-64">
            <option value="todos">Todos los empleados</option>
            {empleados.map((e) => (<option key={e.id} value={e.id}>{e.nombre}</option>))}
          </Select>
        </div>
      )}

      <DataTable
        columns={columns}
        rows={visibles}
        empty={<EmptyState icon="pagos" title="Sin pagos" description="No hay pagos registrados." />}
      />

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Editar pago" : "Registrar pago"}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={save}>Guardar</button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Empleado">
            <Select value={form.empleadoId} onChange={(e) => setForm({ ...form, empleadoId: e.target.value })}>
              {empleados.map((e) => (<option key={e.id} value={e.id}>{e.nombre}</option>))}
            </Select>
          </Field>
          <Field label="Presupuesto / orden" hint="Elegí 'Sin orden' para nafta u otros gastos">
            <Select value={form.ordenId} onChange={(e) => setForm({ ...form, ordenId: e.target.value, etapas: e.target.value ? form.etapas : ["otros"] })}>
              <option value="">Sin orden (gasto general)</option>
              {ordenes.map((o) => (<option key={o.id} value={o.id}>{presupuestoDeOrden(o.id)}</option>))}
            </Select>
          </Field>
          <Field label="Etapas" hint="Podés elegir más de una" className="sm:col-span-2">
            <div className="flex flex-wrap gap-2">
              {([...etapaOrder, "otros"] as EtapaPago[]).map((k) => {
                const active = form.etapas.includes(k);
                return (
                  <button
                    type="button"
                    key={k}
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        etapas: active ? f.etapas.filter((x) => x !== k) : [...f.etapas, k],
                      }))
                    }
                    className={
                      "rounded-full border px-3 py-1.5 text-sm font-medium transition " +
                      (active
                        ? "border-brand bg-brand/15 text-brand"
                        : "border-line text-content-muted hover:bg-surface-overlay hover:text-content")
                    }
                  >
                    {etapaPagoLabel(k)}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Concepto" className="sm:col-span-2" hint="Ej. Nafta, peaje, viáticos… (opcional)">
            <TextInput value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} placeholder="Nafta" />
          </Field>
          <Field label="Monto">
            <TextInput type="number" min={0} value={form.monto} onChange={(e) => setForm({ ...form, monto: Number(e.target.value) })} />
          </Field>
          <Field label="Estado">
            <Select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as "pendiente" | "pagado", fecha: e.target.value === "pagado" ? (form.fecha ?? new Date().toISOString().slice(0, 10)) : null })}>
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
            </Select>
          </Field>
        </div>
      </Modal>

      {/* Resumen por empleado + compartir por WhatsApp */}
      {resumenOpen && (
        <Modal
          open
          onClose={() => setResumenOpen(false)}
          title="Resumen por empleado"
          subtitle="Lo pagado y lo que falta — listo para compartir por WhatsApp"
          footer={
            <>
              <button className="btn-ghost" onClick={() => setResumenOpen(false)}>Cerrar</button>
              <button className="btn-primary" onClick={() => compartirWhatsapp(resumenEmp)} disabled={!resumenEmp}><Icon name="whatsapp" size={16} /> Compartir por WhatsApp</button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Empleado">
              <Select value={resumenEmp} onChange={(e) => setResumenEmp(e.target.value)}>
                {empleados.map((e) => (<option key={e.id} value={e.id}>{e.nombre}</option>))}
              </Select>
            </Field>
            {resumenEmp && (() => {
              const { pagados, pendientes, totalPag, totalPen } = resumenData(resumenEmp);
              const fila = (p: PagoEmpleado) => (
                <div key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-base px-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{descPago(p)}</span>
                  <span className="shrink-0 tabular-nums text-content-muted">{formatCurrency(p.monto)}</span>
                </div>
              );
              return (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-line bg-surface-base p-3"><p className="text-xs text-content-subtle">Pagado</p><p className="font-display text-lg font-bold text-spectrum-green">{formatCurrency(totalPag)}</p></div>
                    <div className="rounded-xl border border-line bg-surface-base p-3"><p className="text-xs text-content-subtle">Falta pagar</p><p className="font-display text-lg font-bold text-spectrum-orange">{formatCurrency(totalPen)}</p></div>
                  </div>
                  <div>
                    <p className="label mb-1">Pagado</p>
                    {pagados.length ? <div className="space-y-1">{pagados.map(fila)}</div> : <p className="text-sm text-content-muted">Nada pagado aún.</p>}
                  </div>
                  <div>
                    <p className="label mb-1">Pendiente</p>
                    {pendientes.length ? <div className="space-y-1">{pendientes.map(fila)}</div> : <p className="text-sm text-content-muted">Sin pendientes.</p>}
                  </div>
                </>
              );
            })()}
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && removePago(toDelete.id)}
        message="¿Eliminar este registro de pago?"
      />
    </Guard>
  );
}
