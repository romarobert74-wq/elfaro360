"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { MonthYearFilter, matchPeriod, type PeriodValue } from "@/components/ui/MonthYearFilter";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { VistaCliente } from "@/components/presupuestos/VistaCliente";
import { useStore } from "@/components/providers/StoreProvider";
import { computeQuote } from "@/lib/calc";
import { buildOrdenFromPresupuesto } from "@/lib/orders";
import { formatCurrency, formatDate, uid } from "@/lib/format";
import {
  estadoPresupuestoLabels,
  estadoPresupuestoTone,
  metodoPagoLabels,
} from "@/lib/labels";
import type { Presupuesto } from "@/lib/types";

export default function PresupuestosPage() {
  const store = useStore();
  const { presupuestos, clientes, destinos, ordenes, can, updatePresupuesto, removePresupuesto, addOrden, addCobro } = store;
  const editable = can("presupuestos", "edit");
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState<PeriodValue>({ year: null, month: null });
  const [vista, setVista] = useState<Presupuesto | null>(null);
  const [toDelete, setToDelete] = useState<Presupuesto | null>(null);

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";

  const years = useMemo(
    () => Array.from(new Set(presupuestos.map((p) => Number(p.fecha.slice(0, 4))))).sort((a, b) => b - a),
    [presupuestos]
  );

  const filtered = useMemo(
    () =>
      presupuestos.filter(
        (p) =>
          (p.numero.toLowerCase().includes(q.toLowerCase()) ||
            clienteName(p.clienteId).toLowerCase().includes(q.toLowerCase())) &&
          matchPeriod(p.fecha, period)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presupuestos, q, clientes, period]
  );

  const tieneOrden = (presupuestoId: string) => ordenes.some((o) => o.presupuestoId === presupuestoId);

  const aprobar = (p: Presupuesto) => {
    updatePresupuesto({ ...p, estado: "aprobado" });
    if (!tieneOrden(p.id)) {
      const numero = `OT-2026-${String(ordenes.length + 1).padStart(3, "0")}`;
      addOrden(buildOrdenFromPresupuesto(p, numero));
      // Registrar cobro pendiente por el total
      const total = computeQuote(p.items, p.config, p.metodoPago).total;
      addCobro({
        id: uid("cob"),
        presupuestoId: p.id,
        clienteId: p.clienteId,
        metodo: p.metodoPago,
        importe: total,
        estado: "pendiente",
        fecha: null,
      });
    }
  };

  const columns: Column<Presupuesto>[] = [
    {
      key: "numero",
      header: "Presupuesto",
      sortValue: (p) => p.numero,
      render: (p) => (
        <div>
          <p className="font-medium">{p.numero}</p>
          <p className="text-xs text-content-subtle">{clienteName(p.clienteId)}</p>
        </div>
      ),
    },
    { key: "fecha", header: "Fecha", hideOnMobile: true, sortValue: (p) => p.fecha, render: (p) => <span className="text-content-muted">{formatDate(p.fecha)}</span> },
    { key: "metodo", header: "Pago", hideOnMobile: true, sortValue: (p) => metodoPagoLabels[p.metodoPago], render: (p) => <span className="text-xs text-content-muted">{metodoPagoLabels[p.metodoPago]}</span> },
    { key: "total", header: "Total", className: "text-right", sortValue: (p) => computeQuote(p.items, p.config, p.metodoPago).total, render: (p) => <span className="font-medium tabular-nums">{formatCurrency(computeQuote(p.items, p.config, p.metodoPago).total)}</span> },
    { key: "estado", header: "Estado", sortValue: (p) => p.estado, render: (p) => <Badge tone={estadoPresupuestoTone[p.estado]}>{estadoPresupuestoLabels[p.estado]}</Badge> },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => setVista(p)} className="rounded-lg p-1.5 text-content-muted transition hover:bg-brand/15 hover:text-brand" title="Vista cliente">
            <Icon name="external" size={16} />
          </button>
          {editable && (
            <>
              {p.estado !== "aprobado" ? (
                <button onClick={() => aprobar(p)} className="rounded-lg p-1.5 text-content-muted transition hover:bg-spectrum-green/15 hover:text-spectrum-green" title="Aprobar y generar orden">
                  <Icon name="check" size={16} />
                </button>
              ) : (
                <button onClick={() => updatePresupuesto({ ...p, estado: "enviado" })} className="rounded-lg p-1.5 text-spectrum-green transition hover:bg-spectrum-orange/15 hover:text-spectrum-orange" title="Desaprobar (volver a Enviado)">
                  <Icon name="x" size={16} />
                </button>
              )}
              <Link href={`/presupuestos/${p.id}/editar`} className="rounded-lg p-1.5 text-content-muted transition hover:bg-brand/15 hover:text-brand" title="Editar">
                <Icon name="edit" size={16} />
              </Link>
              <button onClick={() => setToDelete(p)} className="rounded-lg p-1.5 text-content-muted transition hover:bg-spectrum-red/15 hover:text-spectrum-red" title="Eliminar">
                <Icon name="trash" size={16} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Guard module="presupuestos">
      <PageHeader
        title="Presupuestos"
        subtitle="Cotizaciones y aprobaciones"
        actions={editable && (
          <Link href="/presupuestos/nuevo" className="btn-primary">
            <Icon name="plus" size={16} /> Nuevo presupuesto
          </Link>
        )}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={q} onChange={setQ} placeholder="Buscar por número o cliente…" />
        <MonthYearFilter value={period} onChange={setPeriod} years={years} />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        empty={
          <EmptyState
            icon="presupuestos"
            title="Sin presupuestos"
            description="Creá tu primer presupuesto con el wizard."
            action={editable && <Link href="/presupuestos/nuevo" className="btn-primary"><Icon name="plus" size={16} /> Nuevo presupuesto</Link>}
          />
        }
      />

      {vista && (
        <VistaCliente
          open={!!vista}
          onClose={() => setVista(null)}
          presupuesto={vista}
          cliente={clientes.find((c) => c.id === vista.clienteId)}
          destino={destinos.find((d) => d.id === vista.destinoId)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && removePresupuesto(toDelete.id)}
        message={`¿Eliminar el presupuesto "${toDelete?.numero}"?`}
      />
    </Guard>
  );
}
