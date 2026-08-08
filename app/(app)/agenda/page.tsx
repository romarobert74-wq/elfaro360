"use client";

import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { useStore } from "@/components/providers/StoreProvider";
import { etapaLabels, etapaOrder, etapaTone, toneHex, type Tone } from "@/lib/labels";
import type { EtapaKey } from "@/lib/types";

interface Evento {
  date: string; // YYYY-MM-DD
  ordenId: string;
  ordenNumero: string;
  etapa: EtapaKey;
  empleadoId: string | null;
  cliente: string;
  destino: string;
}

const empTones: Tone[] = ["brand", "violet", "orange", "green", "robin", "red"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function AgendaPage() {
  const store = useStore();
  const { ordenes, clientes, destinos, empleados, presupuestos, currentUser } = store;
  const isEmpleado = currentUser?.role === "empleado";
  const [colorBy, setColorBy] = useState<"etapa" | "empleado">("etapa");
  const [selDay, setSelDay] = useState<string | null>(null);
  const [selEvent, setSelEvent] = useState<Evento | null>(null);

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";
  const destinoName = (id: string) => destinos.find((d) => d.id === id)?.nombre ?? "—";
  const empName = (id: string | null) => empleados.find((e) => e.id === id)?.nombre ?? "Sin asignar";
  const empTone = (id: string | null): Tone => {
    if (!id) return "gray";
    const idx = empleados.findIndex((e) => e.id === id);
    return empTones[idx % empTones.length] ?? "gray";
  };

  const eventos = useMemo(() => {
    const rows: Evento[] = [];
    ordenes.forEach((o) => {
      o.etapas.forEach((e) => {
        if (!e.fechaEstimada) return;
        if (isEmpleado && e.empleadoId !== currentUser?.empleadoId) return;
        rows.push({ date: e.fechaEstimada, ordenId: o.id, ordenNumero: o.numero, etapa: e.key, empleadoId: e.empleadoId, cliente: clienteName(o.clienteId), destino: destinoName(o.destinoId) });
      });
    });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenes, isEmpleado, currentUser]);

  // Mes inicial: el del primer evento o agosto 2026
  const first = eventos.map((e) => e.date).sort()[0] ?? "2026-08-01";
  const [ym, setYm] = useState(() => ({ y: Number(first.slice(0, 4)), m: Number(first.slice(5, 7)) - 1 }));

  const eventosPorDia = useMemo(() => {
    const map: Record<string, Evento[]> = {};
    eventos.forEach((e) => {
      (map[e.date] ??= []).push(e);
    });
    return map;
  }, [eventos]);

  // Construcción de la grilla (semana empieza lunes)
  const grid = useMemo(() => {
    const firstOfMonth = new Date(ym.y, ym.m, 1);
    const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=Lun
    const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(`${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [ym]);

  const move = (delta: number) => {
    setSelDay(null);
    setYm((p) => {
      const nm = p.m + delta;
      return { y: p.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
    });
  };

  const tone = (ev: Evento): Tone => (colorBy === "etapa" ? etapaTone[ev.etapa] : empTone(ev.empleadoId));
  const todayStr = new Date().toISOString().slice(0, 10);
  const selEvents = selDay ? eventosPorDia[selDay] ?? [] : [];

  return (
    <Guard module="agenda">
      <PageHeader
        title="Agenda"
        subtitle={isEmpleado ? "Tus etapas asignadas" : "Etapas de producción por fecha"}
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-raised p-1">
            {(["etapa", "empleado"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setColorBy(c)}
                className={cn("rounded-md px-3 py-1 text-xs font-medium capitalize transition", colorBy === c ? "bg-brand/15 text-brand" : "text-content-muted")}
              >
                Por {c}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{MESES[ym.m]} {ym.y}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => move(-1)} className="btn-ghost px-2 py-2"><Icon name="arrowLeft" size={16} /></button>
          <button onClick={() => setYm({ y: Number(todayStr.slice(0, 4)), m: Number(todayStr.slice(5, 7)) - 1 })} className="btn-ghost text-xs">Hoy</button>
          <button onClick={() => move(1)} className="btn-ghost px-2 py-2"><Icon name="arrowRight" size={16} /></button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mb-4 flex flex-wrap gap-2">
        {colorBy === "etapa"
          ? etapaOrder.map((k) => (
              <span key={k} className="flex items-center gap-1.5 text-xs text-content-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: toneHex[etapaTone[k]] }} />
                {etapaLabels[k]}
              </span>
            ))
          : empleados.map((e) => (
              <span key={e.id} className="flex items-center gap-1.5 text-xs text-content-muted">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: toneHex[empTone(e.id)] }} />
                {e.nombre}
              </span>
            ))}
      </div>

      <div className="card overflow-hidden p-2 sm:p-3">
        {/* Encabezado días */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DIAS.map((d) => (
            <div key={d} className="px-1 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-content-subtle sm:text-xs">
              {d}
            </div>
          ))}
        </div>
        {/* Celdas */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {grid.map((date, i) => {
            if (!date) return <div key={i} className="min-h-[64px] rounded-lg sm:min-h-[92px]" />;
            const evs = eventosPorDia[date] ?? [];
            const isToday = date === todayStr;
            const day = Number(date.slice(8, 10));
            return (
              <button
                key={i}
                onClick={() => evs.length && setSelDay(date)}
                className={cn(
                  "flex min-h-[64px] flex-col gap-1 rounded-lg border p-1.5 text-left transition sm:min-h-[92px]",
                  isToday ? "border-brand/50 bg-brand/5" : "border-line bg-surface-base",
                  evs.length ? "hover:border-brand/40" : "cursor-default"
                )}
              >
                <span className={cn("text-xs font-medium", isToday ? "text-brand" : "text-content-muted")}>{day}</span>
                <div className="flex flex-col gap-0.5">
                  {evs.slice(0, 3).map((ev, j) => (
                    <span
                      key={j}
                      className="truncate rounded px-1 py-0.5 text-[9px] font-medium sm:text-[10px]"
                      style={{ background: `${toneHex[tone(ev)]}22`, color: toneHex[tone(ev)] }}
                      title={`${ev.cliente} · ${etapaLabels[ev.etapa]}`}
                    >
                      {ev.cliente}
                    </span>
                  ))}
                  {evs.length > 3 && <span className="px-1 text-[9px] text-content-subtle">+{evs.length - 3} más</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle del día seleccionado (modal directo) */}
      {selDay && (
        <Modal
          open
          onClose={() => setSelDay(null)}
          title={`Trabajos del ${selDay.slice(8, 10)}/${selDay.slice(5, 7)}`}
          subtitle={`${selEvents.length} etapa(s) · tocá una para ver la orden`}
        >
          <div className="space-y-2">
            {selEvents.length === 0 && <p className="text-sm text-content-muted">No hay trabajos este día.</p>}
            {selEvents.map((ev, i) => (
              <button
                key={i}
                onClick={() => setSelEvent(ev)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-base px-3 py-2.5 text-left transition hover:border-brand/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{ev.cliente}</p>
                  <p className="text-xs text-content-subtle">{ev.ordenNumero} · {ev.destino} · {empName(ev.empleadoId)}</p>
                </div>
                <Badge tone={etapaTone[ev.etapa]} dot>{etapaLabels[ev.etapa]}</Badge>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Detalle del evento: cliente, servicios y empleado */}
      {selEvent && (
        <Modal
          open
          onClose={() => setSelEvent(null)}
          title={selEvent.cliente}
          subtitle={`${selEvent.ordenNumero} · ${selEvent.destino}`}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={etapaTone[selEvent.etapa]} dot>{etapaLabels[selEvent.etapa]}</Badge>
              <span className="text-sm text-content-muted">
                <Icon name="empleados" size={14} className="mr-1 inline" />
                {empName(selEvent.empleadoId)}
              </span>
            </div>

            <div>
              <p className="label">Servicios de esta orden</p>
              {(() => {
                const orden = ordenes.find((o) => o.id === selEvent.ordenId);
                const pres = presupuestos.find((p) => p.id === orden?.presupuestoId);
                if (!pres || pres.items.length === 0) return <p className="text-sm text-content-muted">Sin servicios cargados.</p>;
                return (
                  <div className="space-y-1.5">
                    {pres.items.map((it, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg border border-line bg-surface-base px-3 py-2 text-sm">
                        <span>{it.nombre}</span>
                        <span className="text-content-muted">x{it.cantidad}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}
    </Guard>
  );
}
