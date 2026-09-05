"use client";

import { useMemo, useState } from "react";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { useStore } from "@/components/providers/StoreProvider";
import { etapaLabels, etapaOrder, etapaTone, toneHex, type Tone } from "@/lib/labels";
import { uid } from "@/lib/format";
import type { AgendaNota, EtapaKey } from "@/lib/types";

type Tipo = "etapa" | "presupuesto" | "orden" | "nota";

interface Evento {
  date: string;
  tipo: Tipo;
  label: string;
  color: string;
  ordenId?: string;
  presupuestoId?: string;
  notaId?: string;
  etapa?: EtapaKey;
  empleadoIds?: string[];
  cliente?: string;
  destino?: string;
}

const empTones: Tone[] = ["brand", "violet", "orange", "green", "robin", "red"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const emptyNota = (fecha: string): AgendaNota => ({ id: "", fecha, titulo: "", nota: "", empleadoId: null });

export default function AgendaPage() {
  const store = useStore();
  const { ordenes, clientes, destinos, empleados, presupuestos, notasAgenda, currentUser, addNota, updateNota, removeNota, can } = store;
  const isEmpleado = currentUser?.role === "empleado";
  const editable = can("agenda", "edit") || currentUser?.role !== "empleado";
  const [colorBy, setColorBy] = useState<"etapa" | "empleado">("etapa");
  const [selDay, setSelDay] = useState<string | null>(null);
  const [selEvent, setSelEvent] = useState<Evento | null>(null);
  const [notaForm, setNotaForm] = useState<AgendaNota | null>(null);
  const [confirmNota, setConfirmNota] = useState<string | null>(null);

  const clienteName = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "—";
  const destinoName = (id: string) => destinos.find((d) => d.id === id)?.nombre ?? "—";
  const empName = (id: string | null) => empleados.find((e) => e.id === id)?.nombre ?? "Sin asignar";
  const empNames = (ids: string[]) => (ids.length ? ids.map((id) => empName(id)).join(", ") : "Sin asignar");
  const empTone = (id: string | null): Tone => {
    if (!id) return "gray";
    const idx = empleados.findIndex((e) => e.id === id);
    return empTones[idx % empTones.length] ?? "gray";
  };

  const eventos = useMemo(() => {
    const rows: Evento[] = [];
    // Etapas de producción
    ordenes.forEach((o) => {
      o.etapas.forEach((e) => {
        if (!e.fechaEstimada) return;
        if (isEmpleado && !(currentUser?.empleadoId && e.empleadoIds.includes(currentUser.empleadoId))) return;
        rows.push({
          date: e.fechaEstimada, tipo: "etapa", label: clienteName(o.clienteId), color: toneHex[etapaTone[e.key]],
          ordenId: o.id, etapa: e.key, empleadoIds: e.empleadoIds, cliente: clienteName(o.clienteId), destino: destinoName(o.destinoId),
        });
      });
    });
    if (!isEmpleado) {
      // Órdenes (por fecha de creación)
      ordenes.forEach((o) => {
        rows.push({ date: o.fechaCreacion, tipo: "orden", label: `OT ${clienteName(o.clienteId)}`, color: "#03C2D1", ordenId: o.id, cliente: clienteName(o.clienteId), destino: destinoName(o.destinoId) });
      });
      // Presupuestos (por fecha)
      presupuestos.forEach((p) => {
        rows.push({ date: p.fecha, tipo: "presupuesto", label: `Presup. ${clienteName(p.clienteId)}`, color: "#6E7682", presupuestoId: p.id, cliente: clienteName(p.clienteId) });
      });
    }
    // Notas / tareas manuales
    notasAgenda.forEach((n) => {
      if (isEmpleado && n.empleadoId && n.empleadoId !== currentUser?.empleadoId) return;
      rows.push({ date: n.fecha, tipo: "nota", label: n.titulo || "Nota", color: "#EACA1C", notaId: n.id });
    });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenes, presupuestos, notasAgenda, isEmpleado, currentUser]);

  const first = eventos.map((e) => e.date).sort()[0] ?? "2026-08-01";
  const [ym, setYm] = useState(() => ({ y: Number(first.slice(0, 4)), m: Number(first.slice(5, 7)) - 1 }));

  const eventosPorDia = useMemo(() => {
    const map: Record<string, Evento[]> = {};
    eventos.forEach((e) => { (map[e.date] ??= []).push(e); });
    return map;
  }, [eventos]);

  const grid = useMemo(() => {
    const firstOfMonth = new Date(ym.y, ym.m, 1);
    const startWeekday = (firstOfMonth.getDay() + 6) % 7;
    const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(`${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [ym]);

  const move = (delta: number) => {
    setSelDay(null);
    setYm((p) => { const nm = p.m + delta; return { y: p.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 }; });
  };

  const tone = (ev: Evento): string => {
    if (ev.tipo !== "etapa") return ev.color;
    if (colorBy === "empleado") return toneHex[empTone(ev.empleadoIds?.[0] ?? null)];
    return ev.color;
  };
  const todayStr = new Date().toISOString().slice(0, 10);
  const selEvents = selDay ? eventosPorDia[selDay] ?? [] : [];

  const abrirNuevaNota = (fecha: string) => editable && setNotaForm(emptyNota(fecha));
  const abrirNota = (id: string) => {
    const n = notasAgenda.find((x) => x.id === id);
    if (n) setNotaForm({ ...n });
  };
  const guardarNota = () => {
    if (!notaForm || !notaForm.titulo.trim()) return;
    if (notaForm.id) updateNota(notaForm);
    else addNota({ ...notaForm, id: uid("nota") });
    setNotaForm(null);
  };

  return (
    <Guard module="agenda">
      <PageHeader
        title="Agenda"
        subtitle={isEmpleado ? "Tus etapas asignadas" : "Doble click en un día para agregar una nota o tarea"}
        actions={
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-raised p-1">
            {(["etapa", "empleado"] as const).map((c) => (
              <button key={c} onClick={() => setColorBy(c)} className={cn("rounded-md px-3 py-1 text-xs font-medium capitalize transition", colorBy === c ? "bg-brand/15 text-brand" : "text-content-muted")}>
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
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-content-muted">
        {colorBy === "etapa"
          ? etapaOrder.map((k) => (<span key={k} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: toneHex[etapaTone[k]] }} />{etapaLabels[k]}</span>))
          : empleados.map((e) => (<span key={e.id} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: toneHex[empTone(e.id)] }} />{e.nombre}</span>))}
        {!isEmpleado && (
          <>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-robin" />Órdenes</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#6E7682" }} />Presupuestos</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-spectrum-yellow" />Notas/tareas</span>
          </>
        )}
      </div>

      <div className="card overflow-hidden p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {DIAS.map((d) => (<div key={d} className="px-1 py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-content-subtle sm:text-xs">{d}</div>))}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {grid.map((date, i) => {
            if (!date) return <div key={i} className="min-h-[64px] rounded-lg sm:min-h-[92px]" />;
            const evs = eventosPorDia[date] ?? [];
            const isToday = date === todayStr;
            const day = Number(date.slice(8, 10));
            return (
              <button
                key={i}
                onClick={() => setSelDay(date)}
                onDoubleClick={() => abrirNuevaNota(date)}
                className={cn(
                  "flex min-h-[64px] flex-col gap-1 rounded-lg border p-1.5 text-left transition sm:min-h-[92px]",
                  isToday ? "border-brand/50 bg-brand/5" : "border-line bg-surface-base",
                  "hover:border-brand/40"
                )}
              >
                <span className={cn("text-xs font-medium", isToday ? "text-brand" : "text-content-muted")}>{day}</span>
                <div className="flex flex-col gap-0.5">
                  {evs.slice(0, 3).map((ev, j) => (
                    <span key={j} className="truncate rounded px-1 py-0.5 text-[9px] font-medium sm:text-[10px]" style={{ background: `${tone(ev)}22`, color: tone(ev) }} title={ev.label}>
                      {ev.tipo === "nota" ? "📝 " : ""}{ev.label}
                    </span>
                  ))}
                  {evs.length > 3 && <span className="px-1 text-[9px] text-content-subtle">+{evs.length - 3} más</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalle del día */}
      {selDay && (
        <Modal
          open
          onClose={() => setSelDay(null)}
          title={`Día ${selDay.slice(8, 10)}/${selDay.slice(5, 7)}`}
          subtitle={`${selEvents.length} ítem(s)`}
          footer={editable ? (<><button className="btn-ghost" onClick={() => setSelDay(null)}>Cerrar</button><button className="btn-primary" onClick={() => abrirNuevaNota(selDay)}><Icon name="plus" size={16} /> Nota / tarea</button></>) : undefined}
        >
          <div className="space-y-2">
            {selEvents.length === 0 && <p className="text-sm text-content-muted">No hay nada este día. {editable && "Agregá una nota con el botón de abajo."}</p>}
            {selEvents.map((ev, i) => (
              <button
                key={i}
                onClick={() => (ev.tipo === "nota" ? ev.notaId && abrirNota(ev.notaId) : setSelEvent(ev))}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-base px-3 py-2.5 text-left transition hover:border-brand/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{ev.tipo === "nota" ? "📝 " : ""}{ev.label}</p>
                  <p className="text-xs text-content-subtle">
                    {ev.tipo === "etapa" && `${etapaLabels[ev.etapa!]} · ${empNames(ev.empleadoIds ?? [])}`}
                    {ev.tipo === "orden" && "Orden de trabajo"}
                    {ev.tipo === "presupuesto" && "Presupuesto"}
                    {ev.tipo === "nota" && "Nota / tarea"}
                  </p>
                </div>
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: tone(ev) }} />
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* Detalle de una etapa/orden: cliente, servicios, empleados */}
      {selEvent && (selEvent.tipo === "etapa" || selEvent.tipo === "orden") && (
        <Modal open onClose={() => setSelEvent(null)} title={selEvent.cliente ?? "Orden"} subtitle={selEvent.destino}>
          <div className="space-y-4">
            {selEvent.tipo === "etapa" && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={etapaTone[selEvent.etapa!]} dot>{etapaLabels[selEvent.etapa!]}</Badge>
                <span className="text-sm text-content-muted"><Icon name="empleados" size={14} className="mr-1 inline" />{empNames(selEvent.empleadoIds ?? [])}</span>
              </div>
            )}
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
                        <span>{it.nombre}</span><span className="text-content-muted">x{it.cantidad}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </Modal>
      )}

      {/* Alta / edición de nota */}
      {notaForm && (
        <Modal
          open
          onClose={() => setNotaForm(null)}
          title={notaForm.id ? "Editar nota / tarea" : "Nueva nota / tarea"}
          footer={
            <>
              {notaForm.id && <button className="btn-danger mr-auto" onClick={() => setConfirmNota(notaForm.id)}><Icon name="trash" size={16} /> Eliminar</button>}
              <button className="btn-ghost" onClick={() => setNotaForm(null)}>Cancelar</button>
              <button className="btn-primary" onClick={guardarNota}>Guardar</button>
            </>
          }
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Título *"><TextInput value={notaForm.titulo} onChange={(e) => setNotaForm({ ...notaForm, titulo: e.target.value })} placeholder="Ej. Llamar al cliente" /></Field>
            <Field label="Fecha"><TextInput type="date" value={notaForm.fecha} onChange={(e) => setNotaForm({ ...notaForm, fecha: e.target.value })} /></Field>
            <Field label="Asignar a (opcional)" className="sm:col-span-2">
              <Select value={notaForm.empleadoId ?? ""} onChange={(e) => setNotaForm({ ...notaForm, empleadoId: e.target.value || null })}>
                <option value="">Sin asignar</option>
                {empleados.map((e) => (<option key={e.id} value={e.id}>{e.nombre}</option>))}
              </Select>
            </Field>
            <Field label="Detalle" className="sm:col-span-2"><TextArea value={notaForm.nota} onChange={(e) => setNotaForm({ ...notaForm, nota: e.target.value })} /></Field>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirmNota}
        onClose={() => setConfirmNota(null)}
        onConfirm={() => { if (confirmNota) removeNota(confirmNota); setNotaForm(null); }}
        message="¿Eliminar esta nota / tarea?"
      />
    </Guard>
  );
}
