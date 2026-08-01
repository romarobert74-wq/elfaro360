"use client";

import { Select } from "./Field";

export interface PeriodValue {
  year: number | null;
  month: number | null; // 0-11
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

/** Devuelve true si la fecha ISO (YYYY-MM-DD) cae dentro del período. */
export function matchPeriod(iso: string | null | undefined, p: PeriodValue): boolean {
  if (!iso) return p.year === null && p.month === null;
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7)) - 1;
  if (p.year !== null && y !== p.year) return false;
  if (p.month !== null && m !== p.month) return false;
  return true;
}

export function MonthYearFilter({
  value,
  onChange,
  years,
}: {
  value: PeriodValue;
  onChange: (v: PeriodValue) => void;
  years: number[];
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        className="w-36"
        value={value.month ?? ""}
        onChange={(e) => onChange({ ...value, month: e.target.value === "" ? null : Number(e.target.value) })}
      >
        <option value="">Todos los meses</option>
        {MESES.map((m, i) => (<option key={i} value={i}>{m}</option>))}
      </Select>
      <Select
        className="w-28"
        value={value.year ?? ""}
        onChange={(e) => onChange({ ...value, year: e.target.value === "" ? null : Number(e.target.value) })}
      >
        <option value="">Todos</option>
        {years.map((y) => (<option key={y} value={y}>{y}</option>))}
      </Select>
    </div>
  );
}
