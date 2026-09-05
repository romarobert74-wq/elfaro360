"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { computeQuote } from "@/lib/calc";
import { formatCurrency, formatDate } from "@/lib/format";
import { etapaLabels, etapaTone } from "@/lib/labels";
import type { EtapaKey } from "@/lib/types";

export default function DashboardPage() {
  const store = useStore();
  const { currentUser, presupuestos, ordenes, clientes, cobros, costos, pagosEmpleados, empleados, settings } = store;
  const isEmpleado = currentUser?.role === "empleado";
  const myEmpId = currentUser?.empleadoId;

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";
  const empName = (id: string | null) => empleados.find((e) => e.id === id)?.nombre ?? "Sin asignar";

  // ---- Métricas del negocio ----
  const m = useMemo(() => {
    const aprobados = presupuestos.filter((p) => p.estado === "aprobado");
    const calcTotal = (p: (typeof presupuestos)[number]) => computeQuote(p.items, p.config, p.metodoPago, settings);

    const ingresoReal = cobros.filter((c) => c.estado === "cobrado").reduce((a, c) => a + c.importe, 0);
    const porCobrar = cobros.filter((c) => c.estado === "pendiente").reduce((a, c) => a + c.importe, 0);
    const facturadoProyectado = aprobados.reduce((a, p) => a + calcTotal(p).total, 0);

    const costosMensuales = costos.reduce(
      (a, c) => a + c.precio * c.cantidad * (c.frecuencia === "anual" ? 1 / 12 : 1),
      0
    );
    const gastosPagados = pagosEmpleados.filter((p) => p.estado === "pagado").reduce((a, p) => a + p.monto, 0);
    const gastosPendientes = pagosEmpleados.filter((p) => p.estado === "pendiente").reduce((a, p) => a + p.monto, 0);
    const gananciaReal = ingresoReal - gastosPagados;

    const presupEnviados = presupuestos.filter((p) => p.estado === "enviado").length;
    const presupAprobados = aprobados.length;
    const presupBorradores = presupuestos.filter((p) => p.estado === "borrador").length;

    const ordenesEjecucion = ordenes.filter((o) => o.etapas.some((e) => e.estado !== "completado")).length;
    const ordenesFinalizadas = ordenes.filter((o) => o.etapas.every((e) => e.estado === "completado")).length;

    return {
      ingresoReal, porCobrar, facturadoProyectado, costosMensuales, gastosPagados, gastosPendientes,
      gananciaReal, presupEnviados, presupAprobados, presupBorradores, ordenesEjecucion, ordenesFinalizadas,
    };
  }, [presupuestos, ordenes, cobros, costos, pagosEmpleados, settings]);

  // Próximas etapas (empleado: solo las suyas)
  const proximas = useMemo(() => {
    const rows: { numero: string; etapa: EtapaKey; fecha: string; responsables: string; cliente: string }[] = [];
    ordenes.forEach((o) => {
      o.etapas.forEach((e) => {
        if (e.estado !== "completado" && e.fechaEstimada) {
          if (isEmpleado && !(myEmpId && e.empleadoIds.includes(myEmpId))) return;
          const responsables = e.empleadoIds.map((id) => empName(id)).filter(Boolean).join(", ") || "Sin asignar";
          rows.push({ numero: o.numero, etapa: e.key, fecha: e.fechaEstimada, responsables, cliente: clienteName(o.clienteId) });
        }
      });
    });
    return rows.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenes, isEmpleado, myEmpId]);

  // ---- Vista empleado (reducida) ----
  if (isEmpleado) {
    const misPendientes = pagosEmpleados.filter((p) => p.empleadoId === myEmpId && p.estado === "pendiente").reduce((a, p) => a + p.monto, 0);
    return (
      <Guard module="dashboard">
        <PageHeader title={`Hola, ${currentUser?.nombre.split(" ")[0]} 👋`} subtitle="Tu resumen" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Mis pagos pendientes" value={formatCurrency(misPendientes)} icon="pagos" tone="orange" />
          <StatCard label="Mis próximas etapas" value={String(proximas.length)} icon="agenda" tone="violet" />
        </div>
        <ProximasCard proximas={proximas} />
      </Guard>
    );
  }

  // ---- Vista negocio ----
  return (
    <Guard module="dashboard">
      <PageHeader title={`Hola, ${currentUser?.nombre.split(" ")[0]} 👋`} subtitle="Indicadores del negocio · El Faro 360" />

      {/* Finanzas */}
      <h2 className="mb-3 font-display text-sm font-bold uppercase tracking-wide text-content-subtle">Finanzas</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total facturado" value={formatCurrency(m.ingresoReal)} icon="cobros" tone="green" hint="Cobros realizados" />
        <StatCard label="Por cobrar" value={formatCurrency(m.porCobrar)} icon="cobros" tone="orange" hint="Pendiente de cobro" />
        <StatCard label="Costos (mensual)" value={formatCurrency(m.costosMensuales)} icon="costos" tone="navy" hint="Fijos + variables" />
        <StatCard label="Gastos (empleados)" value={formatCurrency(m.gastosPagados)} icon="pagos" tone="orange" hint={`Pendiente ${formatCurrency(m.gastosPendientes)}`} />
        <StatCard label="Ganancia real" value={formatCurrency(m.gananciaReal)} icon="trending" tone={m.gananciaReal >= 0 ? "green" : "red"} hint="Cobrado − pagos" />
        <StatCard label="Facturado proyectado" value={formatCurrency(m.facturadoProyectado)} icon="reportes" tone="brand" hint="Presupuestos aprobados" />
      </div>

      {/* Comercial */}
      <h2 className="mb-3 mt-6 font-display text-sm font-bold uppercase tracking-wide text-content-subtle">Comercial y producción</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Presup. enviados" value={String(m.presupEnviados)} icon="presupuestos" tone="brand" />
        <StatCard label="Presup. aprobados" value={String(m.presupAprobados)} icon="presupuestos" tone="green" />
        <StatCard label="En ejecución" value={String(m.ordenesEjecucion)} icon="ordenes" tone="orange" hint="Órdenes en curso" />
        <StatCard label="Finalizadas" value={String(m.ordenesFinalizadas)} icon="ordenes" tone="green" hint="Órdenes entregadas" />
      </div>

      <div className="mt-6">
        <ProximasCard proximas={proximas} />
      </div>
    </Guard>
  );
}

function ProximasCard({
  proximas,
}: {
  proximas: { numero: string; etapa: EtapaKey; fecha: string; responsables: string; cliente: string }[];
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h2 className="font-display text-base font-bold">Próximos trabajos agendados</h2>
        <Link href="/agenda" className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
          Ver agenda <Icon name="arrowRight" size={14} />
        </Link>
      </div>
      <div className="divide-y divide-line">
        {proximas.length === 0 && <p className="px-5 py-8 text-center text-sm text-content-muted">No hay etapas próximas.</p>}
        {proximas.map((p, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-overlay text-center">
              <span className="text-xs font-bold leading-none">{formatDate(p.fecha).split(" ")[0]}</span>
              <span className="text-[9px] uppercase text-content-subtle">{formatDate(p.fecha).split(" ")[1]}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{p.cliente}</p>
              <p className="truncate text-xs text-content-subtle">{p.numero} · {p.responsables}</p>
            </div>
            <Badge tone={etapaTone[p.etapa]} dot>{etapaLabels[p.etapa]}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
