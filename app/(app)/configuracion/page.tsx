"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { Field, TextInput } from "@/components/ui/Field";
import { Icon } from "@/components/Icon";
import { cn } from "@/lib/cn";
import { useStore } from "@/components/providers/StoreProvider";
import { slug, uid } from "@/lib/format";
import type { AppSettings, ZonaTraslado } from "@/lib/types";

function Section({ icon, title, subtitle, tone = "#007FFF", children }: { icon: string; title: string; subtitle?: string; tone?: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${tone}22`, color: tone }}>
          <Icon name={icon} size={18} />
        </span>
        <div>
          <h2 className="font-display text-base font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-content-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

export default function ConfiguracionPage() {
  const { settings, updateSettings, can } = useStore();
  const editable = can("configuracion", "edit");
  const [draft, setDraft] = useState<AppSettings>(() => JSON.parse(JSON.stringify(settings)));

  useEffect(() => {
    setDraft(JSON.parse(JSON.stringify(settings)));
  }, [settings]);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(settings), [draft, settings]);

  const set = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setEmpresa = (k: keyof AppSettings["empresa"], v: string) => setDraft((d) => ({ ...d, empresa: { ...d.empresa, [k]: v } }));

  const setZona = (id: string, patch: Partial<ZonaTraslado>) =>
    setDraft((d) => ({ ...d, zonas: d.zonas.map((z) => (z.id === id ? { ...z, ...patch } : z)) }));
  const addZona = () =>
    setDraft((d) => ({ ...d, zonas: [...d.zonas, { id: uid("z"), nombre: "Nueva zona", kmHasta: 0, costo: 0 }] }));
  const removeZona = (id: string) => setDraft((d) => ({ ...d, zonas: d.zonas.filter((z) => z.id !== id) }));

  type CatKey = "verticales" | "tiposServicio" | "puestos";
  const setCatItem = (key: CatKey, i: number, label: string) =>
    setDraft((d) => ({ ...d, catalogos: { ...d.catalogos, [key]: d.catalogos[key].map((it, idx) => (idx === i ? { ...it, label } : it)) } }));
  const addCatItem = (key: CatKey) =>
    setDraft((d) => ({ ...d, catalogos: { ...d.catalogos, [key]: [...d.catalogos[key], { value: slug("nuevo " + Date.now()), label: "Nuevo" }] } }));
  const removeCatItem = (key: CatKey, i: number) =>
    setDraft((d) => ({ ...d, catalogos: { ...d.catalogos, [key]: d.catalogos[key].filter((_, idx) => idx !== i) } }));

  const setTipoCli = (i: number, patch: Partial<{ label: string; permiteCuotas: boolean }>) =>
    setDraft((d) => ({ ...d, catalogos: { ...d.catalogos, tiposCliente: d.catalogos.tiposCliente.map((it, idx) => (idx === i ? { ...it, ...patch } : it)) } }));
  const addTipoCli = () =>
    setDraft((d) => ({ ...d, catalogos: { ...d.catalogos, tiposCliente: [...d.catalogos.tiposCliente, { value: slug("tipo " + Date.now()), label: "Nuevo tipo", permiteCuotas: false }] } }));
  const removeTipoCli = (i: number) =>
    setDraft((d) => ({ ...d, catalogos: { ...d.catalogos, tiposCliente: d.catalogos.tiposCliente.filter((_, idx) => idx !== i) } }));

  const save = () => updateSettings(draft);

  return (
    <Guard module="configuracion">
      <PageHeader
        title="Configuración"
        subtitle="Parámetros financieros y operativos de El Faro 360"
        actions={
          <>
            <Link href="/configuracion/permisos" className="btn-ghost"><Icon name="permisos" size={16} /> Permisos</Link>
            <Link href="/configuracion/backup" className="btn-ghost"><Icon name="config" size={16} /> Backup</Link>
            <Link href="/configuracion/seed" className="btn-ghost"><Icon name="config" size={16} /> Firebase</Link>
            {editable && (
              <button className="btn-primary" onClick={save} disabled={!dirty}>
                <Icon name="check" size={16} /> Guardar cambios
              </button>
            )}
          </>
        }
      />

      {!editable && (
        <div className="mb-4 rounded-lg border border-line bg-surface-raised px-4 py-2.5 text-xs text-content-muted">
          <Icon name="permisos" size={14} className="mr-1 inline" /> Estás viendo la configuración en modo lectura.
        </div>
      )}

      <fieldset disabled={!editable} className="grid gap-6 lg:grid-cols-2">
        <Section icon="dollar" title="Valores del día" subtitle="Referencias que cambian seguido" tone="#267D25">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Dólar hoy ($)" hint="Cotización de referencia">
              <TextInput type="number" value={draft.dolarHoy} onChange={(e) => set("dolarHoy", Number(e.target.value))} />
            </Field>
            <Field label="Días laborales al mes" hint="Para prorratear la estructura">
              <TextInput type="number" value={draft.diasLaborales} onChange={(e) => set("diasLaborales", Number(e.target.value))} />
            </Field>
          </div>
        </Section>

        <Section icon="pagos" title="Traslado a empleados" subtitle="Lo que pagás a los chicos por ir a relevar" tone="#C85311">
          <Field label="Tarifa por km ($/km)" hint="Se multiplica por la distancia del destino">
            <TextInput type="number" value={draft.tarifaKmEmpleado} onChange={(e) => set("tarifaKmEmpleado", Number(e.target.value))} />
          </Field>
        </Section>

        <Section icon="presupuestos" title="Defaults del presupuesto" subtitle="Valores base del cálculo" tone="#007FFF">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Garantía (%)">
              <TextInput type="number" value={draft.garantiaPctDefault} onChange={(e) => set("garantiaPctDefault", Number(e.target.value))} />
            </Field>
            <Field label="Margen objetivo (%)">
              <TextInput type="number" value={draft.margenPctDefault} onChange={(e) => set("margenPctDefault", Number(e.target.value))} />
            </Field>
            <Field label="IVA (%)">
              <TextInput type="number" value={draft.ivaPctDefault} onChange={(e) => set("ivaPctDefault", Number(e.target.value))} />
            </Field>
            <Field label="N° inicial de presupuesto">
              <TextInput type="number" value={draft.numeroInicialPresupuesto} onChange={(e) => set("numeroInicialPresupuesto", Number(e.target.value))} />
            </Field>
          </div>
          <button
            type="button"
            onClick={() => set("conIvaDefault", !draft.conIvaDefault)}
            className="mt-4 flex w-full items-center justify-between rounded-lg border border-line bg-surface-base px-4 py-3 text-sm transition hover:border-brand/40"
          >
            <span className="font-medium">Nuevos presupuestos {draft.conIvaDefault ? "con IVA" : "sin IVA"} por defecto</span>
            <span className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition", draft.conIvaDefault ? "bg-brand" : "bg-line")}>
              <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition", draft.conIvaDefault ? "translate-x-6" : "translate-x-1")} />
            </span>
          </button>
        </Section>

        <Section icon="cobros" title="Intereses por forma de pago" subtitle="Recargos según método" tone="#642A72">
          <Field label="Recargo pago en 2 cuotas (%)" hint="Solo destino turístico, sobre el plan base">
            <TextInput type="number" value={draft.recargoCuotasPct} onChange={(e) => set("recargoCuotasPct", Number(e.target.value))} />
          </Field>
          <p className="mt-3 text-xs text-content-subtle">
            <Icon name="wand" size={13} className="mr-1 inline" />
            El pago con <b>cheque 30/60</b> agrega automáticamente el Pack x3 panoramas (se configura en el catálogo de Servicios).
          </p>
        </Section>

        <Section icon="destinos" title="Zonas de traslado" subtitle="Lo que se le cobra al cliente por desplazamiento" tone="#1A2B62">
          <div className="space-y-3">
            {draft.zonas.map((z) => (
              <div key={z.id} className="rounded-lg border border-line bg-surface-base p-3">
                <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
                  <Field label="Nombre">
                    <TextInput value={z.nombre} onChange={(e) => setZona(z.id, { nombre: e.target.value })} />
                  </Field>
                  <Field label="Hasta (km)" hint="vacío = sin límite">
                    <TextInput type="number" className="sm:w-28" value={z.kmHasta ?? ""} onChange={(e) => setZona(z.id, { kmHasta: e.target.value === "" ? null : Number(e.target.value) })} />
                  </Field>
                  <Field label="Costo ($)" hint="vacío = a consultar">
                    <TextInput type="number" className="sm:w-32" value={z.costo ?? ""} onChange={(e) => setZona(z.id, { costo: e.target.value === "" ? null : Number(e.target.value) })} />
                  </Field>
                  <button type="button" onClick={() => removeZona(z.id)} className="mb-1 rounded-lg p-2 text-content-muted transition hover:bg-spectrum-red/15 hover:text-spectrum-red">
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addZona} className="btn-ghost mt-3 w-full">
            <Icon name="plus" size={16} /> Añadir zona
          </button>
        </Section>

        <Section icon="clientes" title="Tipos de cliente" subtitle="El flag habilita el pago en 2 cuotas" tone="#1A2B62">
          <div className="space-y-2">
            {draft.catalogos.tiposCliente.map((t, i) => (
              <div key={t.value} className="flex items-center gap-2">
                <TextInput className="flex-1" value={t.label} onChange={(e) => setTipoCli(i, { label: e.target.value })} />
                <button type="button" onClick={() => setTipoCli(i, { permiteCuotas: !t.permiteCuotas })} className={cn("rounded-lg border px-2 py-2 text-xs font-medium transition", t.permiteCuotas ? "border-brand/40 bg-brand/15 text-brand" : "border-line text-content-subtle")} title="Permite pago en 2 cuotas">
                  Cuotas {t.permiteCuotas ? "sí" : "no"}
                </button>
                <button type="button" onClick={() => removeTipoCli(i)} className="rounded-lg p-2 text-content-muted hover:text-spectrum-red"><Icon name="trash" size={16} /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addTipoCli} className="btn-ghost mt-2 w-full"><Icon name="plus" size={16} /> Añadir tipo</button>
        </Section>

        {([
          { key: "verticales" as const, title: "Verticales de destino", icon: "destinos", tone: "#642A72" },
          { key: "tiposServicio" as const, title: "Tipos de servicio", icon: "servicios", tone: "#007FFF" },
          { key: "puestos" as const, title: "Puestos de empleado", icon: "empleados", tone: "#C85311" },
        ]).map((cat) => (
          <Section key={cat.key} icon={cat.icon} title={cat.title} tone={cat.tone}>
            <div className="space-y-2">
              {draft.catalogos[cat.key].map((it, i) => (
                <div key={it.value} className="flex items-center gap-2">
                  <TextInput className="flex-1" value={it.label} onChange={(e) => setCatItem(cat.key, i, e.target.value)} />
                  <button type="button" onClick={() => removeCatItem(cat.key, i)} className="rounded-lg p-2 text-content-muted hover:text-spectrum-red"><Icon name="trash" size={16} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => addCatItem(cat.key)} className="btn-ghost mt-2 w-full"><Icon name="plus" size={16} /> Añadir</button>
          </Section>
        ))}

        <Section icon="clientes" title="Datos de la empresa" subtitle="Aparecen en el PDF del presupuesto" tone="#03C2D1">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre">
              <TextInput value={draft.empresa.nombre} onChange={(e) => setEmpresa("nombre", e.target.value)} />
            </Field>
            <Field label="CUIT">
              <TextInput value={draft.empresa.cuit} onChange={(e) => setEmpresa("cuit", e.target.value)} />
            </Field>
            <Field label="Email">
              <TextInput value={draft.empresa.email} onChange={(e) => setEmpresa("email", e.target.value)} />
            </Field>
            <Field label="Teléfono">
              <TextInput value={draft.empresa.telefono} onChange={(e) => setEmpresa("telefono", e.target.value)} />
            </Field>
          </div>
        </Section>
      </fieldset>

      {editable && dirty && (
        <div className="fixed bottom-20 left-1/2 z-20 -translate-x-1/2 lg:bottom-6">
          <button className="btn-primary shadow-glow" onClick={save}>
            <Icon name="check" size={16} /> Guardar cambios
          </button>
        </div>
      )}
    </Guard>
  );
}
