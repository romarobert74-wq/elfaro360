"use client";

import { useState } from "react";
import { Select, TextInput } from "./Field";
import { Icon } from "@/components/Icon";
import type { CatalogoItem } from "@/lib/types";

/**
 * Select de un catálogo dinámico con opción de crear un valor nuevo en el momento.
 * `onCreate(label)` debe persistir el nuevo item y devolver su `value`.
 */
export function CatalogSelect({
  items,
  value,
  onChange,
  onCreate,
  allowCreate = true,
}: {
  items: CatalogoItem[];
  value: string;
  onChange: (value: string) => void;
  onCreate?: (label: string) => string;
  allowCreate?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  if (adding) {
    const confirm = () => {
      const trimmed = name.trim();
      if (!trimmed || !onCreate) {
        setAdding(false);
        setName("");
        return;
      }
      const v = onCreate(trimmed);
      onChange(v);
      setName("");
      setAdding(false);
    };
    return (
      <div className="flex items-center gap-2">
        <TextInput
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && confirm()}
          placeholder="Nombre del nuevo tipo…"
        />
        <button type="button" className="btn-primary px-2 py-2" onClick={confirm} title="Crear">
          <Icon name="check" size={14} />
        </button>
        <button type="button" className="btn-ghost px-2 py-2" onClick={() => { setAdding(false); setName(""); }} title="Cancelar">
          <Icon name="x" size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1">
        {items.map((it) => (
          <option key={it.value} value={it.value}>{it.label}</option>
        ))}
      </Select>
      {allowCreate && onCreate && (
        <button type="button" className="btn-ghost shrink-0 px-2 py-2" onClick={() => setAdding(true)} title="Crear tipo nuevo">
          <Icon name="plus" size={16} />
        </button>
      )}
    </div>
  );
}
