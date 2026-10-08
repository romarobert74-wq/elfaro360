"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Modal } from "@/components/ui/Modal";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { useStore } from "@/components/providers/StoreProvider";
import { toneHex, type Tone } from "@/lib/labels";
import { uid } from "@/lib/format";
import type { AgendaNota } from "@/lib/types";

type Tipo = "orden" | "nota";

interface Evento {
  date: string;
  tipo: Tipo;
  label: string;
  color: string;
  ordenId?: string;
  notaId?: string;
  empleadoIds?: string[];
  cliente?: string;
  destino?: string;
}

const empTones: Tone[] = ["brand", "violet", "orange", "green", "robin", "red"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const emptyNota = (fecha: string): AgendaNota => ({ id: "", fecha, titulo: "", nota: "", empleadoId: null, items: [] });

export default function AgendaPage() {
  const router = useRouter();
  const store = useStore();
  const { ordenes, clientes, destinos, empleados, presupuestos, notasAgenda, currentUser, addNota, updateNota, removeNota, can } = store;
  const isEmpleado = currentUser?.role === "empleado";
  const editable = can("agenda", "edit") || currentUser?.role !== "empleado";
  const [selDay, setSelDay] = useState<string | null>(null);
  const [selEvent, setSelEvent] = useState<Evento | null>(null);
  const [notaForm, setNotaForm] = useState<AgendaNota | null>(null);
  const [notaView, setNotaView] = useState<AgendaNota | null>(null);
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
    // Órdenes de trabajo: aparecen el día del relevamiento como Cliente / Destino / Empleado
    ordenes.forEach((o) => {
      if (!o.fechaRelevamiento) return;
      const resp = o.responsableIds ?? [];
      if (isEmpleado && !(currentUser?.empleadoId && resp.includes(currentUser.empleadoId))) return;
      rows.push({
        date: o.fechaRelevamiento,
        tipo: "orden",
        label: `${clienteName(o.clienteId)} / ${destinoName(o.destinoId)} / ${empNames(resp)}`,
        color: toneHex[empTone(resp[0] ?? null)],
        ordenId: o.id,
        empleadoIds: resp,
        cliente: clienteName(o.clienteId),
        destino: destinoName(o.destinoId),
      });
    });
    // Notas / tareas manuales
    notasAgenda.forEach((n) => {
      if (isEmpleado && n.empleadoId && n.empleadoId !== currentUser?.empleadoId) return;
      rows.push({ date: n.fecha, tipo: "nota", label: n.titulo || "Nota", color: "#EACA1C", notaId: n.id });
    });
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenes, notasAgenda, isEmpleado, currentUser]);

  // Arranca en el mes en curso
  const [ym, setYm] = useState(() => { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth() }; });

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

  const todayStr = new Date().toISOString().slice(0, 10);
  const selEvents = selDay ? eventosPorDia[selDay] ?? [] : [];
  const ordenSel = selEvent?.ordenId ? ordenes.find((o) => o.id === selEvent.ordenId) : undefined;

  const abrirNuevaNota = (fecha: string) => editable && setNotaForm(emptyNota(fecha));
  const verNota = (id: string) => { const n = notasAgenda.find((x) => x.id === id); if (n) setNotaView({ ...n }); };
  const toggleItem = (nota: AgendaNota, itemId: string) => {
    const items = (nota.items ?? []).map((it) => (it.id === itemId ? { ...it, hecho: !it.hecho } : it));
    const next = { ...nota, items };
    updateNota(next);
    setNotaView(next);
  };
  const guardarNota = () => {
    if (!notaForm || !notaForm.titulo.trim()) return;
    const limpio: AgendaNota = { ...notaForm, items: (notaForm.items ?? []).filter((it) => it.texto.trim()) };
    if (limpio.id) updateNota(limpio);
    else addNota({ ...limpio, id: uid("nota") });
    setNotaForm(null);
  };

  return (
    <Guard module="agenda">
      <PageHeader
        title="Agenda"
        subtitle={isEmpleado ? "Tus trabajos: qué día y a dónde ir" : "Órdenes por día de relevamiento. Doble click en un día para agregar una nota."}
      />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">{MESES[ym.m]} {ym.y}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => move(-1)} className="btn-ghost px-2 py-2"><Icon name="arrowLeft" size={16} /></button>
          <button onClick={() => setYm({ y: Number(todayStr.slice(0, 4)), m: Number(todayStr.slice(5, 7)) - 1 })} className="btn-ghost text-xs">Hoy</button>
          <button onClick={() => move(1)} className="btn-ghost px-2 py-2"><Icon name="arrowRight" size={16} /></button>
        </div>
      </div>

      {/* Leyenda: colores por empleado */}
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-content-muted">
        {empleados.map((e) => (
          <span key={e.id} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: toneHex[empTone(e.id)] }} />{e.nombre}</span>
        ))}
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-spectrum-yellow" />Notas / tareas</span>
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
                    <span key={j} className="truncate rounded px-1 py-0.5 text-[9px] font-medium sm:text-[10px]" style={{ background: `${ev.color}22`, color: ev.color }} title={ev.label}>
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
            {selEvents.map((ev, i) => {
              const notaEv = ev.tipo === "nota" ? notasAgenda.find((n) => n.id === ev.notaId) : undefined;
              const items = notaEv?.items ?? [];
              const sub = ev.tipo === "orden"
                ? "Orden de trabajo — tocá para ver los datos"
                : items.length
                  ? `Checklist · ${items.filter((it) => it.hecho).length}/${items.length} hechas`
                  : "Nota / tarea";
              return (
                <button
                  key={i}
                  onClick={() => (ev.tipo === "nota" ? ev.notaId && verNota(ev.notaId) : setSelEvent(ev))}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface-base px-3 py-2.5 text-left transition hover:border-brand/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ev.tipo === "nota" ? "📝 " : ""}{ev.label}</p>
                    <p className="text-xs text-content-subtle">{sub}</p>
                  </div>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: ev.color }} />
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Detalle de la orden del día: datos para ir a hacer el relevamiento */}
      {selEvent && selEvent.tipo === "orden" && ordenSel && (
        <Modal
          open
          onClose={() => setSelEvent(null)}
          title={`${clienteName(ordenSel.clienteId)} · ${destinoName(ordenSel.destinoId)}`}
          subtitle={ordenSel.numero}
          footer={<><button className="btn-ghost" onClick={() => setSelEvent(null)}>Cerrar</button><button className="btn-primary" onClick={() => router.push("/ordenes")}><Icon name="external" size={16} /> Abrir orden</button></>}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-content-muted"><Icon name="empleados" size={14} className="mr-1 inline" />{empNames(ordenSel.responsableIds ?? [])}</span>
              {ordenSel.horaRelevamiento && <span className="text-content-muted"><Icon name="clock" size={14} className="mr-1 inline" />{ordenSel.horaRelevamiento}</span>}
            </div>

            <div className="grid gap-2 text-sm">
              {ordenSel.direccion && <p><span className="text-content-subtle">Dirección: </span>{ordenSel.direccion}</p>}
              {ordenSel.contacto && <p><span className="text-content-subtle">Contacto: </span>{ordenSel.contacto}</p>}
              {ordenSel.servicio && <p><span className="text-content-subtle">Servicio: </span>{ordenSel.servicio}</p>}
            </div>

            <div>
              <p className="label">Servicios del presupuesto</p>
              {(() => {
                const pres = presupuestos.find((p) => p.id === ordenSel.presupuestoId);
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
            <div className="sm:col-span-2">
              <p className="label mb-2">Checklist de tareas (opcional)</p>
              <div className="space-y-2">
                {(notaForm.items ?? []).map((it, i) => (
                  <div key={it.id} className="flex items-center gap-2">
                    <TextInput value={it.texto} onChange={(e) => setNotaForm({ ...notaForm, items: (notaForm.items ?? []).map((x, j) => (j === i ? { ...x, texto: e.target.value } : x)) })} placeholder={`Tarea ${i + 1}`} />
                    <button type="button" onClick={() => setNotaForm({ ...notaForm, items: (notaForm.items ?? []).filter((_, j) => j !== i) })} className="rounded-md p-2 text-content-muted transition hover:text-spectrum-red" title="Quitar"><Icon name="trash" size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setNotaForm({ ...notaForm, items: [...(notaForm.items ?? []), { id: uid("it"), texto: "", hecho: false }] })} className="btn-ghost text-xs"><Icon name="plus" size={14} /> Agregar tarea</button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Vista de nota: checklist tildable (los empleados marcan lo que van haciendo) */}
      {notaView && (
        <Modal
          open
          onClose={() => setNotaView(null)}
          title={notaView.titulo || "Nota / tarea"}
          subtitle={`${notaView.fecha.slice(8, 10)}/${notaView.fecha.slice(5, 7)}${notaView.empleadoId ? " · " + empName(notaView.empleadoId) : ""}`}
          footer={<><button className="btn-ghost" onClick={() => setNotaView(null)}>Cerrar</button>{editable && <button className="btn-primary" onClick={() => { setNotaForm({ ...notaView }); setNotaView(null); }}><Icon name="edit" size={16} /> Editar</button>}</>}
        >
          <div className="space-y-4">
            {notaView.nota && <p className="whitespace-pre-line text-sm text-content-muted">{notaView.nota}</p>}
            {(notaView.items ?? []).length > 0 ? (
              <div className="space-y-2">
                {(notaView.items ?? []).map((it) => (
                  <button key={it.id} type="button" onClick={() => toggleItem(notaView, it.id)} className="flex w-full items-center gap-3 rounded-lg border border-line bg-surface-base px-3 py-2.5 text-left transition hover:border-brand/40">
                    <span className={cn("grid h-5 w-5 flex-none place-items-center rounded-md border", it.hecho ? "border-brand bg-brand text-white" : "border-line")}>{it.hecho && <Icon name="check" size={13} />}</span>
                    <span className={cn("text-sm", it.hecho && "text-content-subtle line-through")}>{it.texto}</span>
                  </button>
                ))}
              </div>
            ) : (
              !notaView.nota && <p className="text-sm text-content-muted">Sin detalle ni tareas.</p>
            )}
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
