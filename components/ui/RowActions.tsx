"use client";

import { Icon } from "@/components/Icon";

export function RowActions({
  onEdit,
  onDelete,
  disabled,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}) {
  if (disabled) return <span className="text-xs text-content-subtle">Solo lectura</span>;
  return (
    <div className="flex items-center justify-end gap-1">
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="rounded-lg p-1.5 text-content-muted transition hover:bg-brand/15 hover:text-brand"
          aria-label="Editar"
        >
          <Icon name="edit" size={16} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded-lg p-1.5 text-content-muted transition hover:bg-spectrum-red/15 hover:text-spectrum-red"
          aria-label="Eliminar"
        >
          <Icon name="trash" size={16} />
        </button>
      )}
    </div>
  );
}
