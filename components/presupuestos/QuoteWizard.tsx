"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { Badge } from "@/components/ui/Badge";
import { Field, Select, TextArea, TextInput } from "@/components/ui/Field";
import { ResumenCalculo } from "./ResumenCalculo";
import { useStore } from "@/components/providers/StoreProvider";
import { computeQuote, zonaParaKm } from "@/lib/calc";
import { formatCurrency, uid } from "@/lib/format";
import { catalogLabel, metodoPagoLabels } from "@/lib/labels";
import { cn } from "@/lib/cn";
import type {
  MetodoPago,
  Presupuesto,
  PresupuestoConfig,
  PresupuestoItem,
} from "@/lib/types";

const steps = ["Cliente y destino", "Servicios y pago", "Cálculo final"];

export function QuoteWizard({ initial }: { initial?: Presupuesto }) {
  const store = useStore();
  const { clientes, destinos, servicios, costos, settings, addPresupuesto, updatePresupuesto, presupuestos } = store;
  const router = useRouter();

  const PACK_CHEQUE = settings.recargoChequePackId;

  // Estructura por defecto = costos fijos mensuales / días laborales
  const estructuraDefault = useMemo(() => {
    const totalFijoMensual = costos
      .filter((c) => c.tipo === "fijo")
      .reduce((a, c) => a + c.precio * c.cantidad * (c.frecuencia === "anual" ? 1 / 12 : 1), 0);
    return Math.round(totalFijoMensual / (settings.diasLaborales || 1));
  }, [costos, settings.diasLaborales]);

  const defaultConfig = (): PresupuestoConfig => ({
    manoObra: 0,
    manoObraOverride: null,
    estructura: estructuraDefault,
    estructuraOverride: null,
    trasladoAuto: 0,
    trasladoOverride: null,
    garantiaPct: settings.garantiaPctDefault,
    margenPct: settings.margenPctDefault,
    ivaPct: settings.ivaPctDefault,
    conIva: settings.conIvaDefault,
    materialesFacturables: 0,
    descuentoValor: 0,
    descuentoEsPorcentaje: true,
  });

  const [step, setStep] = useState(0);
  const [clienteId, setClienteId] = useState(initial?.clienteId ?? clientes[0]?.id ?? "");
  const [destinoId, setDestinoId] = useState(initial?.destinoId ?? "");
  const [items, setItems] = useState<PresupuestoItem[]>(initial?.items ?? []);
  const [metodoPago, setMetodoPago] = useState<MetodoPago>(initial?.metodoPago ?? "efectivo");
  const [config, setConfig] = useState<PresupuestoConfig>(initial?.config ?? defaultConfig());
  const [notas, setNotas] = useState(initial?.notas ?? "");
  const [showResumenMobile, setShowResumenMobile] = useState(false);

  const cliente = clientes.find((c) => c.id === clienteId);
  const destinosCliente = destinos.filter((d) => d.clienteId === clienteId);
  const destino = destinos.find((d) => d.id === destinoId);

  const zona = destino ? zonaParaKm(destino.distanciaKm, settings.zonas) : null;
  const trasladoEmpleado = destino ? destino.distanciaKm * settings.tarifaKmEmpleado : 0;
  const costoServicios = items.reduce((a, it) => a + it.cantidad * it.costoUnitario, 0);

  useEffect(() => {
    if (destinosCliente.length && !destinosCliente.find((d) => d.id === destinoId)) {
      setDestinoId(destinosCliente[0].id);
    }
    if (!destinosCliente.length) setDestinoId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  // Traslado automático = costo de la zona según km del destino
  useEffect(() => {
    const z = destino ? zonaParaKm(destino.distanciaKm, settings.zonas) : null;
    setConfig((c) => ({ ...c, trasladoAuto: z?.costo ?? 0 }));
  }, [destino, settings.zonas]);

  // Mano de obra automática = costo de los servicios (se guarda para el registro)
  useEffect(() => {
    setConfig((c) => ({ ...c, manoObra: costoServicios }));
  }, [costoServicios]);

  // Estructura automática = costos fijos mensuales / días laborales (se recalcula)
  useEffect(() => {
    setConfig((c) => ({ ...c, estructura: estructuraDefault }));
  }, [estructuraDefault]);

  const cuotasDisponible = !!settings.catalogos.tiposCliente.find((t) => t.value === cliente?.tipoCliente)?.permiteCuotas;
  useEffect(() => {
    if (!cuotasDisponible && metodoPago === "cuotas_2") setMetodoPago("efectivo");
  }, [cuotasDisponible, metodoPago]);

  // Cheque 30/60 → agrega el Pack x3 panoramas automáticamente
  useEffect(() => {
    setItems((prev) => {
      const hasAuto = prev.some((it) => it.servicioId === PACK_CHEQUE && it.autoAgregado);
      if (metodoPago === "cheque_30_60") {
        if (prev.some((it) => it.servicioId === PACK_CHEQUE)) return prev;
        const srv = servicios.find((s) => s.id === PACK_CHEQUE);
        if (!srv) return prev;
        return [...prev, { servicioId: srv.id, nombre: srv.nombre, cantidad: 1, precioUnitario: srv.precioBase, costoUnitario: srv.costo, autoAgregado: true }];
      }
      if (hasAuto) return prev.filter((it) => !(it.servicioId === PACK_CHEQUE && it.autoAgregado));
      return prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metodoPago]);

  const calc = useMemo(() => computeQuote(items, config, metodoPago, settings), [items, config, metodoPago, settings]);

  const addServicio = (servicioId: string) => {
    const srv = servicios.find((s) => s.id === servicioId);
    if (!srv) return;
    setItems((prev) => {
      const ex = prev.find((it) => it.servicioId === servicioId && !it.autoAgregado);
      if (ex) return prev.map((it) => (it === ex ? { ...it, cantidad: it.cantidad + 1 } : it));
      return [...prev, { servicioId: srv.id, nombre: srv.nombre, cantidad: 1, precioUnitario: srv.precioBase, costoUnitario: srv.costo }];
    });
  };
  const setQty = (idx: number, qty: number) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, cantidad: Math.max(1, qty) } : it)));
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const canNext = step === 0 ? !!clienteId && !!destinoId : step === 1 ? items.length > 0 : true;

  const save = () => {
    const base: Omit<Presupuesto, "id" | "numero"> = {
      clienteId,
      destinoId,
      fecha: initial?.fecha ?? new Date().toISOString().slice(0, 10),
      items,
      metodoPago,
      config,
      estado: initial?.estado ?? "borrador",
      notas,
    };
    if (initial) {
      updatePresupuesto({ ...base, id: initial.id, numero: initial.numero });
    } else {
      const numero = `P-2026-${String(settings.numeroInicialPresupuesto + presupuestos.length).padStart(3, "0")}`;
      addPresupuesto({ ...base, id: uid("pre"), numero });
    }
    router.push("/presupuestos");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        {/* Stepper */}
        <div className="mb-6 flex items-center gap-2">
          {steps.map((label, i) => (
            <div key={i} className="flex flex-1 items-center gap-2">
              <div className="flex items-center gap-2">
                <span className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition", i < step ? "bg-brand text-white" : i === step ? "bg-brand/20 text-brand ring-2 ring-brand" : "bg-surface-overlay text-content-subtle")}>
                  {i < step ? <Icon name="check" size={14} /> : i + 1}
                </span>
                <span className={cn("hidden text-sm font-medium sm:block", i === step ? "text-content" : "text-content-subtle")}>{label}</span>
              </div>
              {i < steps.length - 1 && <div className={cn("h-px flex-1", i < step ? "bg-brand" : "bg-line")} />}
            </div>
          ))}
        </div>

        <div className="card p-5">
          {/* PASO 1 */}
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cliente *">
                <Select value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {clientes.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                </Select>
              </Field>
              <Field label="Destino *" hint={destinosCliente.length === 0 ? "Este cliente no tiene destinos cargados" : undefined}>
                <Select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} disabled={destinosCliente.length === 0}>
                  <option value="">Seleccionar…</option>
                  {destinosCliente.map((d) => (<option key={d.id} value={d.id}>{d.nombre}</option>))}
                </Select>
              </Field>
              {cliente && (
                <div className="rounded-lg border border-line bg-surface-base p-4 text-sm sm:col-span-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge tone="brand">{catalogLabel(settings.catalogos.tiposCliente, cliente.tipoCliente)}</Badge>
                    {destino && (
                      <>
                        <span className="text-content-muted"><Icon name="destinos" size={14} className="mr-1 inline" />{destino.distanciaKm} km</span>
                        {zona && (
                          <span className="text-content-muted">
                            {zona.nombre} · Traslado: {zona.costo != null ? formatCurrency(zona.costo) : "a consultar"}
                          </span>
                        )}
                        <span className="text-content-subtle">Pago a relevador: {formatCurrency(trasladoEmpleado)} ({destino.distanciaKm} km × {formatCurrency(settings.tarifaKmEmpleado)})</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASO 2 */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <p className="label">Agregar servicios</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {servicios.map((s) => (
                    <button key={s.id} onClick={() => addServicio(s.id)} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-base px-3 py-2 text-left text-sm transition hover:border-brand/50 hover:bg-brand/5">
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{s.nombre}</span>
                        <span className="text-xs text-content-subtle">{formatCurrency(s.precioBase)} · costo {formatCurrency(s.costo)}</span>
                      </span>
                      <span className="shrink-0 text-brand"><Icon name="plus" size={16} /></span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="label">Servicios en el presupuesto</p>
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-sm text-content-muted">Agregá al menos un servicio.</p>
                ) : (
                  <div className="space-y-2">
                    {items.map((it, idx) => (
                      <div key={idx} className="flex items-center gap-3 rounded-lg border border-line bg-surface-base px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {it.nombre}
                            {it.autoAgregado && <Badge tone="yellow" className="ml-2">auto</Badge>}
                          </p>
                          <p className="text-xs text-content-subtle">{formatCurrency(it.precioUnitario)} c/u · costo {formatCurrency(it.costoUnitario)}</p>
                        </div>
                        <input type="number" min={1} value={it.cantidad} disabled={it.autoAgregado} onChange={(e) => setQty(idx, Number(e.target.value))} className="input-base w-16 py-1 text-center disabled:opacity-60" />
                        <span className="w-24 text-right text-sm font-medium tabular-nums">{formatCurrency(it.precioUnitario * it.cantidad)}</span>
                        {!it.autoAgregado && (
                          <button onClick={() => removeItem(idx)} className="rounded p-1 text-content-subtle hover:text-spectrum-red"><Icon name="x" size={16} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="label">Método de pago</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(["efectivo", "transferencia", "cheque_30_60", "cuotas_2"] as MetodoPago[]).map((m) => {
                    if (m === "cuotas_2" && !cuotasDisponible) return null;
                    return (
                      <button key={m} onClick={() => setMetodoPago(m)} className={cn("rounded-lg border px-3 py-2.5 text-left text-sm transition", metodoPago === m ? "border-brand bg-brand/10 text-content" : "border-line bg-surface-base text-content-muted hover:border-brand/40")}>
                        <span className="flex items-center justify-between">
                          <span className="font-medium">{metodoPagoLabels[m]}</span>
                          {metodoPago === m && <Icon name="check" size={16} className="text-brand" />}
                        </span>
                        {m === "cheque_30_60" && <span className="mt-0.5 block text-xs text-content-subtle">Agrega Pack x3 panoramas</span>}
                        {m === "cuotas_2" && <span className="mt-0.5 block text-xs text-content-subtle">Recargo {settings.recargoCuotasPct}% (solo destino turístico)</span>}
                      </button>
                    );
                  })}
                </div>

                {metodoPago === "cheque_30_60" && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-spectrum-yellow/40 bg-spectrum-yellow/10 px-3 py-2 text-xs text-spectrum-yellow">
                    <Icon name="wand" size={16} className="mt-0.5 shrink-0" />
                    <span>Al pagar con cheque 30/60 se agregó automáticamente el <b>Pack x3 panoramas adicional</b> sobre el mínimo de 5.</span>
                  </div>
                )}
                {metodoPago === "cuotas_2" && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs text-brand">
                    <Icon name="wand" size={16} className="mt-0.5 shrink-0" />
                    <span>Se aplica un recargo del {settings.recargoCuotasPct}% sobre el plan base (5 panoramas) por el pago en 2 cuotas.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 3 */}
          {step === 2 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mano de obra (costo)" hint={`Auto: ${formatCurrency(costoServicios)} — suma del costo de los servicios`}>
                <div className="flex items-center gap-2">
                  <TextInput type="number" placeholder={String(costoServicios)} value={config.manoObraOverride ?? ""} onChange={(e) => setConfig({ ...config, manoObraOverride: e.target.value === "" ? null : Number(e.target.value) })} />
                  {config.manoObraOverride != null && (
                    <button className="btn-ghost px-2 py-2" onClick={() => setConfig({ ...config, manoObraOverride: null })} title="Volver a automático"><Icon name="x" size={14} /></button>
                  )}
                </div>
              </Field>
              <Field label="Estructura" hint={`Auto: ${formatCurrency(estructuraDefault)} — costos fijos ÷ ${settings.diasLaborales} días laborales`}>
                <div className="flex items-center gap-2">
                  <TextInput
                    type="number"
                    placeholder={String(estructuraDefault)}
                    value={config.estructuraOverride ?? ""}
                    onChange={(e) => setConfig({ ...config, estructuraOverride: e.target.value === "" ? null : Number(e.target.value) })}
                  />
                  {config.estructuraOverride != null && (
                    <button className="btn-ghost px-2 py-2" onClick={() => setConfig({ ...config, estructuraOverride: null })} title="Volver a automático"><Icon name="x" size={14} /></button>
                  )}
                </div>
              </Field>
              <Field label="Traslado (zona)" hint={zona ? `${zona.nombre}${zona.costo != null ? ` · ${formatCurrency(zona.costo)}` : " · a consultar (cargá manual)"}` : undefined}>
                <div className="flex items-center gap-2">
                  <TextInput type="number" placeholder={String(config.trasladoAuto)} value={config.trasladoOverride ?? ""} onChange={(e) => setConfig({ ...config, trasladoOverride: e.target.value === "" ? null : Number(e.target.value) })} />
                  {config.trasladoOverride != null && (
                    <button className="btn-ghost px-2 py-2" onClick={() => setConfig({ ...config, trasladoOverride: null })} title="Volver a automático"><Icon name="x" size={14} /></button>
                  )}
                </div>
              </Field>
              <Field label="Garantía (%)">
                <TextInput type="number" value={config.garantiaPct} onChange={(e) => setConfig({ ...config, garantiaPct: Number(e.target.value) })} />
              </Field>
              <Field label="Materiales facturables extra">
                <TextInput type="number" value={config.materialesFacturables} onChange={(e) => setConfig({ ...config, materialesFacturables: Number(e.target.value) })} />
              </Field>
              <Field label="IVA (%)">
                <TextInput type="number" value={config.ivaPct} onChange={(e) => setConfig({ ...config, ivaPct: Number(e.target.value) })} disabled={!config.conIva} />
              </Field>

              {/* Switch IVA sí/no */}
              <div className="sm:col-span-2">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, conIva: !config.conIva })}
                  className="flex w-full items-center justify-between rounded-lg border border-line bg-surface-base px-4 py-3 text-sm transition hover:border-brand/40"
                >
                  <span>
                    <span className="font-medium">Presupuesto {config.conIva ? "con IVA" : "sin IVA"}</span>
                    <span className="ml-2 text-xs text-content-subtle">{config.conIva ? `Se suma ${config.ivaPct}% de IVA al total` : "El total no incluye IVA"}</span>
                  </span>
                  <span className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition", config.conIva ? "bg-brand" : "bg-line")}>
                    <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition", config.conIva ? "translate-x-6" : "translate-x-1")} />
                  </span>
                </button>
              </div>

              {/* Descuento */}
              <Field label="Descuento" hint="Se resta del subtotal (antes de IVA)" className="sm:col-span-2">
                <div className="flex items-center gap-2">
                  <TextInput
                    type="number"
                    min={0}
                    value={config.descuentoValor}
                    onChange={(e) => setConfig({ ...config, descuentoValor: Number(e.target.value) })}
                    className="flex-1"
                  />
                  <div className="flex overflow-hidden rounded-lg border border-line">
                    <button type="button" onClick={() => setConfig({ ...config, descuentoEsPorcentaje: true })} className={cn("px-4 py-2 text-sm font-medium transition", config.descuentoEsPorcentaje ? "bg-brand text-white" : "text-content-muted hover:bg-surface-overlay")}>%</button>
                    <button type="button" onClick={() => setConfig({ ...config, descuentoEsPorcentaje: false })} className={cn("px-4 py-2 text-sm font-medium transition", !config.descuentoEsPorcentaje ? "bg-brand text-white" : "text-content-muted hover:bg-surface-overlay")}>$</button>
                  </div>
                </div>
              </Field>

              <Field label="Descripción (la ve el cliente)" className="sm:col-span-2">
                <TextArea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej. Incluye: Video Dron de 30 a 45 seg aprox, más 10 fotos aéreas 9:16 para redes…" />
              </Field>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-line pt-5">
            <button className="btn-ghost" onClick={() => (step === 0 ? router.push("/presupuestos") : setStep(step - 1))}>
              <Icon name="arrowLeft" size={16} /> {step === 0 ? "Cancelar" : "Atrás"}
            </button>
            {step < steps.length - 1 ? (
              <button className="btn-primary" disabled={!canNext} onClick={() => setStep(step + 1)}>Siguiente <Icon name="arrowRight" size={16} /></button>
            ) : (
              <button className="btn-primary" onClick={save}><Icon name="check" size={16} /> {initial ? "Guardar cambios" : "Crear presupuesto"}</button>
            )}
          </div>
        </div>
      </div>

      {/* Panel lateral en vivo (desktop) */}
      <div className="hidden lg:block">
        <div className="sticky top-20 space-y-3">
          <ResumenCalculo calc={calc} />
          <p className="px-1 text-xs text-content-subtle">{items.length} servicio(s) · {metodoPagoLabels[metodoPago]}</p>
        </div>
      </div>

      {/* Resumen flotante (mobile) */}
      <div className="fixed bottom-16 left-0 right-0 z-20 border-t border-line bg-surface-raised px-4 py-2 lg:hidden">
        <button onClick={() => setShowResumenMobile((v) => !v)} className="flex w-full items-center justify-between">
          <span className="text-sm text-content-muted">Total General</span>
          <span className="flex items-center gap-2 font-display text-lg font-bold text-brand">
            {formatCurrency(calc.total)}
            <Icon name={showResumenMobile ? "chevronDown" : "chevronRight"} size={16} />
          </span>
        </button>
        {showResumenMobile && <div className="mt-2"><ResumenCalculo calc={calc} /></div>}
      </div>
    </div>
  );
}
