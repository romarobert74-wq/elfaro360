"use client";

import { useMemo } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/components/providers/StoreProvider";
import { computeQuote } from "@/lib/calc";
import { formatCurrency } from "@/lib/format";
import { toneHex, type Tone } from "@/lib/labels";
import { cn } from "@/lib/cn";

const MESES_ABR = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function BarList({ items, tone = "brand" }: { items: { label: string; value: number; sub?: string }[]; tone?: Tone }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const color = toneHex[tone];
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate font-medium">{it.label}</span>
            <span className="tabular-nums text-content-muted">{it.sub ?? formatCurrency(it.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-base">
            <div className="h-full rounded-full transition-all" style={{ width: `${(it.value / max) * 100}%`, background: color }} />
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-content-muted">Sin datos.</p>}
    </div>
  );
}

export default function ReportesPage() {
  const { presupuestos, cobros, clientes, servicios, pagosEmpleados } = useStore();

  const aprobados = useMemo(() => presupuestos.filter((p) => p.estado === "aprobado"), [presupuestos]);

  const ingresoProyectado = useMemo(
    () => aprobados.reduce((a, p) => a + computeQuote(p.items, p.config, p.metodoPago).total, 0),
    [aprobados]
  );
  const margenProyectado = useMemo(
    () => aprobados.reduce((a, p) => a + computeQuote(p.items, p.config, p.metodoPago).margen, 0),
    [aprobados]
  );
  const ingresoReal = useMemo(() => cobros.filter((c) => c.estado === "cobrado").reduce((a, c) => a + c.importe, 0), [cobros]);
  const pagosReales = useMemo(() => pagosEmpleados.filter((p) => p.estado === "pagado").reduce((a, p) => a + p.monto, 0), [pagosEmpleados]);
  const margenReal = ingresoReal - pagosReales;
  const ticketPromedio = aprobados.length ? ingresoProyectado / aprobados.length : 0;

  // Facturación mensual (cobros cobrados)
  const facturacionMensual = useMemo(() => {
    const map: Record<string, number> = {};
    cobros.filter((c) => c.estado === "cobrado" && c.fecha).forEach((c) => {
      const mes = Number(c.fecha!.slice(5, 7)) - 1;
      map[mes] = (map[mes] ?? 0) + c.importe;
    });
    return Object.entries(map)
      .map(([m, v]) => ({ label: MESES_ABR[Number(m)], value: v }))
      .sort((a, b) => MESES_ABR.indexOf(a.label) - MESES_ABR.indexOf(b.label));
  }, [cobros]);

  // Ranking servicios más vendidos (por cantidad y facturación)
  const rankingServicios = useMemo(() => {
    const map: Record<string, { cant: number; monto: number }> = {};
    presupuestos.forEach((p) => {
      p.items.forEach((it) => {
        const cur = map[it.servicioId] ?? { cant: 0, monto: 0 };
        cur.cant += it.cantidad;
        cur.monto += it.cantidad * it.precioUnitario;
        map[it.servicioId] = cur;
      });
    });
    return Object.entries(map)
      .map(([id, v]) => ({ label: servicios.find((s) => s.id === id)?.nombre ?? id, value: v.monto, sub: `${v.cant} u · ${formatCurrency(v.monto)}` }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [presupuestos, servicios]);

  // Ranking clientes (por facturación presupuestada)
  const rankingClientes = useMemo(() => {
    const map: Record<string, number> = {};
    presupuestos.forEach((p) => {
      map[p.clienteId] = (map[p.clienteId] ?? 0) + computeQuote(p.items, p.config, p.metodoPago).total;
    });
    return Object.entries(map)
      .map(([id, v]) => ({ label: clientes.find((c) => c.id === id)?.nombre ?? id, value: v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [presupuestos, clientes]);

  const maxComp = Math.max(1, ingresoProyectado, ingresoReal);

  return (
    <Guard module="reportes">
      <PageHeader title="Reportes" subtitle="Facturación, márgenes y rankings" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Ingreso real (cobrado)" value={formatCurrency(ingresoReal)} icon="cobros" tone="green" />
        <StatCard label="Ingreso proyectado" value={formatCurrency(ingresoProyectado)} icon="trending" tone="brand" hint={`${aprobados.length} aprobados`} />
        <StatCard label="Margen proyectado" value={formatCurrency(margenProyectado)} icon="reportes" tone="violet" />
        <StatCard label="Ticket promedio" value={formatCurrency(ticketPromedio)} icon="presupuestos" tone="navy" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Margen real vs proyectado */}
        <div className="card p-5">
          <h2 className="mb-4 font-display text-base font-bold">Margen real vs proyectado</h2>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-content-muted">Proyectado</span>
                <span className="font-medium tabular-nums">{formatCurrency(margenProyectado)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-base">
                <div className="h-full rounded-full bg-brand" style={{ width: `${(margenProyectado / Math.max(1, margenProyectado, margenReal)) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-content-muted">Real (cobrado − pagos)</span>
                <span className={cn("font-medium tabular-nums", margenReal >= 0 ? "text-spectrum-green" : "text-spectrum-red")}>{formatCurrency(margenReal)}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface-base">
                <div className="h-full rounded-full bg-spectrum-green" style={{ width: `${(Math.max(0, margenReal) / Math.max(1, margenProyectado, margenReal)) * 100}%` }} />
              </div>
            </div>
            <p className="text-xs text-content-subtle">
              Real = cobros efectivos ({formatCurrency(ingresoReal)}) menos pagos a empleados ({formatCurrency(pagosReales)}).
            </p>
          </div>
        </div>

        {/* Facturación mensual */}
        <div className="card p-5">
          <h2 className="mb-4 font-display text-base font-bold">Facturación mensual</h2>
          {facturacionMensual.length === 0 ? (
            <p className="text-sm text-content-muted">Sin cobros registrados.</p>
          ) : (
            <div className="flex items-end gap-3" style={{ height: 160 }}>
              {facturacionMensual.map((m, i) => {
                const maxM = Math.max(...facturacionMensual.map((x) => x.value));
                return (
                  <div key={i} className="flex flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[10px] tabular-nums text-content-muted">{formatCurrency(m.value)}</span>
                    <div className="w-full rounded-t-lg bg-brand-gradient" style={{ height: `${(m.value / maxM) * 120}px` }} />
                    <span className="text-xs text-content-subtle">{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ranking servicios */}
        <div className="card p-5">
          <h2 className="mb-4 font-display text-base font-bold">Servicios más vendidos</h2>
          <BarList items={rankingServicios} tone="violet" />
        </div>

        {/* Ranking clientes */}
        <div className="card p-5">
          <h2 className="mb-4 font-display text-base font-bold">Ranking de clientes</h2>
          <BarList items={rankingClientes} tone="robin" />
        </div>
      </div>

      {presupuestos.length === 0 && (
        <div className="mt-6">
          <EmptyState icon="reportes" title="Sin datos para reportar" description="Cargá presupuestos y cobros para ver los reportes." />
        </div>
      )}
    </Guard>
  );
}
