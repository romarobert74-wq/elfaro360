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
import {
  estadoPresupuestoLabels,
  estadoPresupuestoTone,
  etapaLabels,
  etapaTone,
} from "@/lib/labels";
import type { EtapaKey } from "@/lib/types";

export default function DashboardPage() {
  const store = useStore();
  const { currentUser, presupuestos, ordenes, clientes, destinos, cobros, empleados } = store;
  const isEmpleado = currentUser?.role === "empleado";
  const myEmpId = currentUser?.empleadoId;

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";
  const destinoName = (id: string) => destinos.find((d) => d.id === id)?.nombre ?? "—";
  const empName = (id: string | null) => empleados.find((e) => e.id === id)?.nombre ?? "Sin asignar";

  const facturacionMes = useMemo(
    () => cobros.filter((c) => c.estado === "cobrado").reduce((a, c) => a + c.importe, 0),
    [cobros]
  );

  const pendientes = useMemo(
    () => presupuestos.filter((p) => p.estado === "enviado" || p.estado === "borrador"),
    [presupuestos]
  );
  const pendientesValor = useMemo(
    () => pendientes.reduce((a, p) => a + computeQuote(p.items, p.config, p.metodoPago).total, 0),
    [pendientes]
  );

  const ordenesEnCurso = useMemo(
    () => ordenes.filter((o) => o.etapas.some((e) => e.estado !== "completado")),
    [ordenes]
  );

  // Próximas etapas agendadas (todas, o solo las del empleado logueado)
  const proximas = useMemo(() => {
    const rows: { ordenId: string; numero: string; etapa: EtapaKey; fecha: string; empleadoId: string | null; cliente: string }[] = [];
    ordenes.forEach((o) => {
      o.etapas.forEach((e) => {
        if (e.estado !== "completado" && e.fechaEstimada) {
          if (isEmpleado && e.empleadoId !== myEmpId) return;
          rows.push({
            ordenId: o.id,
            numero: o.numero,
            etapa: e.key,
            fecha: e.fechaEstimada,
            empleadoId: e.empleadoId,
            cliente: clienteName(o.clienteId),
          });
        }
      });
    });
    return rows.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenes, isEmpleado, myEmpId]);

  return (
    <Guard module="dashboard">
      <PageHeader
        title={`Hola, ${currentUser?.nombre.split(" ")[0]} 👋`}
        subtitle="Resumen general de El Faro 360"
      />

      {/* Stats */}
      {!isEmpleado && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Facturación del mes" value={formatCurrency(facturacionMes)} icon="cobros" tone="green" hint="Cobros registrados" />
          <StatCard label="Presup. pendientes" value={String(pendientes.length)} icon="presupuestos" tone="brand" hint={formatCurrency(pendientesValor)} />
          <StatCard label="Órdenes en curso" value={String(ordenesEnCurso.length)} icon="ordenes" tone="orange" hint="En producción" />
          <StatCard label="Próximos trabajos" value={String(proximas.length)} icon="agenda" tone="violet" hint="Etapas agendadas" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Próximos trabajos */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-base font-bold">
              {isEmpleado ? "Mis próximas etapas" : "Próximos trabajos agendados"}
            </h2>
            <Link href="/agenda" className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
              Ver agenda <Icon name="arrowRight" size={14} />
            </Link>
          </div>
          <div className="divide-y divide-line">
            {proximas.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-content-muted">No hay etapas próximas.</p>
            )}
            {proximas.map((p, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-overlay text-center">
                  <span className="text-xs font-bold leading-none">{formatDate(p.fecha).split(" ")[0]}</span>
                  <span className="text-[9px] uppercase text-content-subtle">{formatDate(p.fecha).split(" ")[1]}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.cliente}</p>
                  <p className="truncate text-xs text-content-subtle">
                    {p.numero} · {empName(p.empleadoId)}
                  </p>
                </div>
                <Badge tone={etapaTone[p.etapa]} dot>
                  {etapaLabels[p.etapa]}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Presupuestos pendientes */}
        <div className="card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-base font-bold">Presupuestos</h2>
            {!isEmpleado && (
              <Link href="/presupuestos" className="flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                Ver todos <Icon name="arrowRight" size={14} />
              </Link>
            )}
          </div>
          <div className="divide-y divide-line">
            {presupuestos.slice(0, 5).map((p) => {
              const total = computeQuote(p.items, p.config, p.metodoPago).total;
              return (
                <div key={p.id} className="flex items-center justify-between gap-2 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{clienteName(p.clienteId)}</p>
                    <p className="truncate text-xs text-content-subtle">{p.numero} · {formatCurrency(total)}</p>
                  </div>
                  <Badge tone={estadoPresupuestoTone[p.estado]}>{estadoPresupuestoLabels[p.estado]}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Guard>
  );
}
