import { cn } from "@/lib/cn";
import { Icon } from "@/components/Icon";
import { toneHex, type Tone } from "@/lib/labels";

export function StatCard({
  label,
  value,
  icon,
  tone = "brand",
  hint,
}: {
  label: string;
  value: string;
  icon: string;
  tone?: Tone;
  hint?: string;
}) {
  const color = toneHex[tone];
  return (
    <div className="card relative overflow-hidden p-5">
      {/* Glow de acento en la esquina */}
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ background: color }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-content-muted">
          {label}
        </span>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg"
          style={{ background: `${color}22`, color }}
        >
          <Icon name={icon} size={18} />
        </span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold tracking-tight">{value}</div>
      {hint && <div className={cn("mt-1 text-xs text-content-subtle")}>{hint}</div>}
    </div>
  );
}
