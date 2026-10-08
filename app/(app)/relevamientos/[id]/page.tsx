"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, TextInput, TextArea } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { useStore } from "@/components/providers/StoreProvider";
import { EQUIPO_ITEMS, CIERRE_ITEMS } from "@/lib/relevamiento";
import type { Relevamiento } from "@/lib/types";

const PASOS = [
  { n: 1, label: "Equipamiento" },
  { n: 2, label: "Datos del destino" },
  { n: 3, label: "Cierre" },
];

export default function RelevamientoWizardPage() {
  const params = useParams();
  const router = useRouter();
  const { relevamientos, destinos, clientes, empleados, updateRelevamiento, can } = useStore();
  const editable = can("relevamientos", "edit");

  const rel = relevamientos.find((r) => r.id === params.id);
  const [form, setForm] = useState<Relevamiento | null>(rel ?? null);
  const [paso, setPaso] = useState(1);

  if (!rel || !form) {
    return (
      <Guard module="relevamientos">
        <PageHeader title="Relevamiento" />
        <EmptyState icon="check" title="Relevamiento no encontrado" description="Puede que se haya eliminado o que el link sea incorrecto." />
        <button className="btn-ghost mt-4" onClick={() => router.push("/relevamientos")}><Icon name="arrowLeft" size={16} /> Volver</button>
      </Guard>
    );
  }

  const destino = destinos.find((d) => d.id === form.destinoId);
  const cliente = destino ? clientes.find((c) => c.id === destino.clienteId) : undefined;
  const empleado = empleados.find((e) => e.id === form.empleadoId);

  const set = (patch: Partial<Relevamiento>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const toggle = (campo: "equipo" | "cierre", item: string) =>
    set({ [campo]: form[campo].includes(item) ? form[campo].filter((x) => x !== item) : [...form[campo], item] } as Partial<Relevamiento>);

  const guardar = (extra?: Partial<Relevamiento>) => {
    const next = { ...form, ...extra };
    updateRelevamiento(next);
    setForm(next);
  };

  const completar = () => guardar({ estado: "completado", fechaCierre: new Date().toISOString().slice(0, 10) });
  const reabrir = () => guardar({ estado: "borrador", fechaCierre: null });

  const compartir = () => {
    const url = `${window.location.origin}/relevamientos/${form.id}`;
    const texto = `Relevamiento 360 — ${destino?.nombre ?? ""}\n${url}`;
    try { window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank", "noopener"); } catch {}
  };

  const irA = (n: number) => { guardar(); setPaso(n); };

  return (
    <Guard module="relevamientos">
      <PageHeader
        title={destino?.nombre ?? "Relevamiento"}
        subtitle={[cliente?.nombre, empleado?.nombre].filter(Boolean).join(" · ") || undefined}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={form.estado === "completado" ? "green" : "orange"} dot>{form.estado === "completado" ? "Completado" : "Borrador"}</Badge>
            <button className="btn-ghost" onClick={compartir} title="Compartir por WhatsApp"><Icon name="whatsapp" size={16} /> Compartir</button>
          </div>
        }
      />

      {/* Stepper */}
      <div className="mb-5 flex items-center gap-1">
        {PASOS.map((p, i) => (
          <div key={p.n} className="flex flex-1 items-center gap-1">
            <button
              onClick={() => irA(p.n)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-center transition",
                paso === p.n ? "bg-brand/12 text-brand" : "text-content-muted hover:bg-surface-overlay"
              )}
            >
              <span className={cn("grid h-6 w-6 place-items-center rounded-full text-xs font-bold", paso === p.n ? "bg-brand text-white" : "bg-surface-overlay text-content-muted")}>{p.n}</span>
              <span className="truncate text-[11px] font-medium">{p.label}</span>
            </button>
            {i < PASOS.length - 1 && <span className="text-content-subtle/40">›</span>}
          </div>
        ))}
      </div>

      <div className="card p-5">
        {/* PASO 1 — Checklist de equipamiento */}
        {paso === 1 && (
          <div>
            <h2 className="mb-1 font-display text-lg font-bold">Checklist de equipamiento</h2>
            <p className="mb-4 text-sm text-content-muted">Tildá lo que llevás antes de salir. ({form.equipo.length}/{EQUIPO_ITEMS.length})</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {EQUIPO_ITEMS.map((item) => {
                const sel = form.equipo.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={!editable}
                    onClick={() => toggle("equipo", item)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                      sel ? "border-brand bg-brand/10 text-content" : "border-line text-content-muted hover:border-brand/40",
                      !editable && "cursor-not-allowed opacity-70"
                    )}
                  >
                    <span className={cn("grid h-5 w-5 flex-none place-items-center rounded-md border", sel ? "border-brand bg-brand text-white" : "border-line")}>
                      {sel && <Icon name="check" size={13} />}
                    </span>
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* PASO 2 — Datos del destino */}
        {paso === 2 && (
          <div>
            <h2 className="mb-1 font-display text-lg font-bold">Datos del destino</h2>
            <p className="mb-4 text-sm text-content-muted">Traídos del destino + lo que completes para la visita.</p>

            <div className="mb-4 rounded-xl border border-line bg-surface-base p-4">
              <p className="text-sm"><span className="text-content-subtle">Destino: </span><span className="font-medium">{destino?.nombre ?? "—"}</span></p>
              <p className="mt-1 text-sm"><span className="text-content-subtle">Dirección: </span>{destino?.direccion || "—"}</p>
              {cliente && <p className="mt-1 text-sm"><span className="text-content-subtle">Cliente: </span>{cliente.nombre}</p>}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Horario al que hay que ir">
                <TextInput disabled={!editable} value={form.horario} onChange={(e) => set({ horario: e.target.value })} placeholder="Ej. 9:00 a 11:00" />
              </Field>
              <Field label="Responsable en el destino">
                <TextInput disabled={!editable} value={form.contactoNombre} onChange={(e) => set({ contactoNombre: e.target.value })} placeholder="Con quién hablar" />
              </Field>
              <Field label="Celular de contacto">
                <TextInput disabled={!editable} value={form.contactoCel} onChange={(e) => set({ contactoCel: e.target.value })} placeholder="Ej. 2616657058" />
              </Field>
              <Field label="Servicio a realizar">
                <TextInput disabled={!editable} value={form.servicio} onChange={(e) => set({ servicio: e.target.value })} placeholder="Ej. Tour 360 base" />
              </Field>
              <Field label="Servicio adicional" className="sm:col-span-2">
                <TextInput disabled={!editable} value={form.servicioAdicional} onChange={(e) => set({ servicioAdicional: e.target.value })} placeholder="Si se suma algo extra en el lugar" />
              </Field>
            </div>
          </div>
        )}

        {/* PASO 3 — Cierre del relevamiento */}
        {paso === 3 && (
          <div>
            <h2 className="mb-1 font-display text-lg font-bold">¿Qué se hizo?</h2>
            <p className="mb-4 text-sm text-content-muted">Tildá lo realizado. El tour base es lo estándar; el resto son adicionales.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CIERRE_ITEMS.map((item) => {
                const sel = form.cierre.includes(item);
                return (
                  <button
                    key={item}
                    type="button"
                    disabled={!editable}
                    onClick={() => toggle("cierre", item)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                      sel ? "border-brand bg-brand/10 text-content" : "border-line text-content-muted hover:border-brand/40",
                      !editable && "cursor-not-allowed opacity-70"
                    )}
                  >
                    <span className={cn("grid h-5 w-5 flex-none place-items-center rounded-md border", sel ? "border-brand bg-brand text-white" : "border-line")}>
                      {sel && <Icon name="check" size={13} />}
                    </span>
                    {item}
                  </button>
                );
              })}
            </div>
            <Field label="Nota" className="mt-4">
              <TextArea disabled={!editable} value={form.nota} onChange={(e) => set({ nota: e.target.value })} className="min-h-[90px]" placeholder="Algo a agregar, imprevistos, pendientes…" />
            </Field>

            {editable && (
              <div className="mt-4">
                {form.estado === "completado" ? (
                  <button className="btn-ghost" onClick={reabrir}><Icon name="edit" size={16} /> Reabrir relevamiento</button>
                ) : (
                  <button className="btn-primary" onClick={completar}><Icon name="check" size={16} /> Marcar como completado</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navegación entre pasos */}
      <div className="mt-5 flex items-center justify-between gap-2">
        <button className="btn-ghost" onClick={() => (paso > 1 ? irA(paso - 1) : router.push("/relevamientos"))}>
          <Icon name="arrowLeft" size={16} /> {paso > 1 ? "Anterior" : "Volver"}
        </button>
        <div className="flex items-center gap-2">
          {editable && <button className="btn-ghost" onClick={() => guardar()}>Guardar</button>}
          {paso < 3 && <button className="btn-primary" onClick={() => irA(paso + 1)}>Siguiente <Icon name="arrowRight" size={16} /></button>}
        </div>
      </div>
    </Guard>
  );
}
