"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { seedFirestore } from "@/lib/firestore";
import { firebaseConfigured } from "@/lib/firebase";

export default function SeedPage() {
  const { currentUser, backend } = useStore();
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  if (currentUser?.role !== "super_admin") {
    return (
      <EmptyState icon="permisos" title="Solo Super Admin" description="Esta herramienta de migración es exclusiva del Super Admin." />
    );
  }

  const run = async () => {
    setRunning(true);
    setLogs([]);
    setDone(false);
    try {
      await seedFirestore((msg) => setLogs((l) => [...l, msg]));
      setLogs((l) => [...l, "— Migración completada —"]);
      setDone(true);
    } catch (e) {
      setLogs((l) => [...l, `✗ Error: ${(e as Error).message}`]);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Migración a Firebase"
        subtitle="Cargar los datos mock iniciales en Firestore (una sola vez)"
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-content-muted">Backend actual:</span>
        <Badge tone={backend === "firebase" ? "green" : "gray"} dot>
          {backend === "firebase" ? "Firebase (Firestore)" : "Mock (memoria)"}
        </Badge>
        <Badge tone={firebaseConfigured ? "green" : "red"} dot>
          {firebaseConfigured ? "Credenciales cargadas" : "Sin credenciales"}
        </Badge>
      </div>

      {!firebaseConfigured ? (
        <div className="card p-5 text-sm text-content-muted">
          <p className="mb-2 font-medium text-content">Firebase no está configurado.</p>
          <p>
            Cargá las variables <code className="rounded bg-surface-base px-1">NEXT_PUBLIC_FIREBASE_*</code> en{" "}
            <code className="rounded bg-surface-base px-1">.env.local</code> (o en Vercel) y volvé a esta página.
            Ver la guía <code className="rounded bg-surface-base px-1">docs/FIREBASE.md</code>.
          </p>
        </div>
      ) : (
        <div className="card p-5">
          <p className="mb-4 text-sm text-content-muted">
            Esto copia clientes, destinos, servicios, presupuestos, órdenes, empleados, pagos, cobros,
            usuarios y la matriz de permisos a tu Firestore. Es idempotente: podés correrlo de nuevo sin duplicar
            (sobrescribe por id).
          </p>
          <button className="btn-primary" onClick={run} disabled={running}>
            <Icon name={running ? "clock" : "wand"} size={16} />
            {running ? "Migrando…" : done ? "Volver a migrar" : "Migrar datos mock a Firebase"}
          </button>

          {logs.length > 0 && (
            <pre className="mt-4 max-h-72 overflow-auto rounded-lg border border-line bg-surface-base p-4 text-xs leading-relaxed text-content-muted">
              {logs.join("\n")}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
