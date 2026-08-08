"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  sortValue?: (row: T) => string | number; // si está, la columna es ordenable
}

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  empty?: React.ReactNode;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const arr = [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (typeof av === "number" && typeof bv === "number") return av - bv;
      return String(av).localeCompare(String(bv), "es", { numeric: true });
    });
    return sort.dir === "desc" ? arr.reverse() : arr;
  }, [rows, sort, columns]);

  const toggleSort = (key: string) =>
    setSort((prev) => (prev?.key === key ? (prev.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));

  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left">
              {columns.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th
                    key={c.key}
                    onClick={c.sortValue ? () => toggleSort(c.key) : undefined}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-content-muted",
                      c.hideOnMobile && "hidden md:table-cell",
                      c.sortValue && "cursor-pointer select-none hover:text-content",
                      c.className
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      {c.sortValue && (
                        <Icon
                          name={active ? (sort!.dir === "asc" ? "chevronDown" : "chevronRight") : "chevronDown"}
                          size={12}
                          className={active ? "text-brand" : "opacity-30"}
                        />
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-b border-line/60 transition last:border-0",
                  onRowClick && "cursor-pointer hover:bg-surface-overlay/60"
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-3 align-middle",
                      c.hideOnMobile && "hidden md:table-cell",
                      c.className
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
