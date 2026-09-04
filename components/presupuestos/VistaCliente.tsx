"use client";

import { Modal } from "@/components/ui/Modal";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { computeQuote } from "@/lib/calc";
import { formatCurrency, formatDate } from "@/lib/format";
import { metodoPagoLabels } from "@/lib/labels";
import { appSettings } from "@/lib/mock-data";
import type { Cliente, Destino, Presupuesto } from "@/lib/types";

/**
 * Vista Cliente imprimible (window.print + CSS @media print).
 * Muestra solo lo que ve el cliente: servicios y total, sin el desglose interno.
 */
export function VistaCliente({
  open,
  onClose,
  presupuesto,
  cliente,
  destino,
}: {
  open: boolean;
  onClose: () => void;
  presupuesto: Presupuesto;
  cliente?: Cliente;
  destino?: Destino;
}) {
  const calc = computeQuote(presupuesto.items, presupuesto.config, presupuesto.metodoPago);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Vista Cliente"
      subtitle="Así se ve el presupuesto para el cliente"
      size="lg"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
          <button className="btn-primary" onClick={() => window.print()}>
            <Icon name="printer" size={16} /> Imprimir / PDF
          </button>
        </>
      }
    >
      <div className="print-area rounded-xl bg-white p-8 text-[#050505]">
        {/* Encabezado */}
        <div className="mb-6 flex items-start justify-between border-b border-neutral-200 pb-5">
          <div className="text-[#050505]">
            <Logo variant="horizontal" size="md" />
            <p className="mt-1.5 text-xs text-neutral-500">Virtualización de espacios en 360°</p>
          </div>
          <div className="text-right text-xs text-neutral-500">
            <p className="font-display text-base font-bold text-[#050505]">Presupuesto</p>
            <p className="mt-1">N° {presupuesto.numero}</p>
            <p>{formatDate(presupuesto.fecha)}</p>
          </div>
        </div>

        {/* Cliente / Destino */}
        <div className="mb-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Cliente</p>
            <p className="font-semibold">{cliente?.nombre ?? "—"}</p>
            <p className="text-neutral-600">{cliente?.razonSocial}</p>
            <p className="text-neutral-600">{cliente?.telefono}</p>
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Destino</p>
            <p className="font-semibold">{destino?.nombre ?? "—"}</p>
            <p className="text-neutral-600">{destino?.direccion}</p>
          </div>
        </div>

        {/* Detalle de servicios */}
        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-[11px] uppercase text-neutral-400">
              <th className="py-2">Servicio</th>
              <th className="py-2 text-center">Cant.</th>
              <th className="py-2 text-right">Precio</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {presupuesto.items.map((it, i) => (
              <tr key={i} className="border-b border-neutral-100">
                <td className="py-2">
                  {it.nombre}
                  {it.autoAgregado && <span className="ml-2 text-[10px] text-[#007FFF]">(incluido)</span>}
                </td>
                <td className="py-2 text-center tabular-nums">{it.cantidad}</td>
                <td className="py-2 text-right tabular-nums">{formatCurrency(it.precioUnitario)}</td>
                <td className="py-2 text-right tabular-nums">{formatCurrency(it.precioUnitario * it.cantidad)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales (vista cliente) */}
        <div className="ml-auto w-64 text-sm">
          <div className="flex justify-between py-1 text-neutral-600">
            <span>Servicios</span>
            <span className="tabular-nums">{formatCurrency(calc.materialesFact)}</span>
          </div>
          {calc.traslado > 0 && (
            <div className="flex justify-between py-1 text-neutral-600">
              <span>Traslado</span>
              <span className="tabular-nums">{formatCurrency(calc.traslado)}</span>
            </div>
          )}
          {calc.recargoCuotas > 0 && (
            <div className="flex justify-between py-1 text-neutral-600">
              <span>Recargo 2 cuotas</span>
              <span className="tabular-nums">{formatCurrency(calc.recargoCuotas)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-neutral-200 py-1 text-neutral-600">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(calc.subtotal)}</span>
          </div>
          {presupuesto.config.conIva && (
            <div className="flex justify-between py-1 text-neutral-600">
              <span>IVA ({presupuesto.config.ivaPct}%)</span>
              <span className="tabular-nums">{formatCurrency(calc.iva)}</span>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-neutral-300 py-2 font-display text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums text-[#007FFF]">{formatCurrency(calc.total)}</span>
          </div>
        </div>

        {/* Método de pago + datos de pago y contacto */}
        <div className="mt-6 border-t border-neutral-200 pt-4 text-xs text-neutral-600">
          <p><span className="font-semibold text-neutral-800">Método de pago:</span> {metodoPagoLabels[presupuesto.metodoPago]}</p>
          {presupuesto.notas && <p className="mt-1 text-neutral-500">{presupuesto.notas}</p>}

          <div className="mt-3 grid grid-cols-1 gap-3 rounded-lg bg-neutral-50 p-3 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Datos de pago</p>
              <p><span className="font-semibold text-neutral-800">Alias Mercado Pago:</span> {appSettings.empresa.aliasMercadoPago}</p>
              <p className="text-neutral-500">{appSettings.empresa.nombre}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Contacto</p>
              <p className="font-semibold text-neutral-800">{appSettings.empresa.contactoNombre}</p>
              <p>Cel: {appSettings.empresa.contactoCel}</p>
              <p>{appSettings.empresa.email}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
