"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/Badge";
import { Field, TextInput } from "@/components/ui/Field";
import { EnvBadge } from "@/components/layout/EnvBadge";
import { Icon } from "@/components/Icon";
import { useStore } from "@/components/providers/StoreProvider";
import { roleLabels } from "@/lib/labels";
import type { Role } from "@/lib/types";

const roleTone: Record<Role, "violet" | "brand" | "green" | "gray"> = {
  super_admin: "violet",
  admin: "brand",
  empleado: "green",
  cliente: "gray",
};

export default function LoginPage() {
  const store = useStore();
  const { users, currentUser, login, loginWithEmail, loginWithGoogle, backend, loading, authError } = store;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (currentUser) router.replace("/");
  }, [currentUser, router]);

  const handlePick = (id: string) => {
    login(id);
    router.replace("/");
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await loginWithEmail(email.trim(), password);
    } catch (e2) {
      setErr(traducirError((e2 as Error).message));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setErr(null);
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch (e2) {
      setErr(traducirError((e2 as Error).message));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-ink p-4">
      <div className="pointer-events-none absolute inset-0 bg-brand-glow" />
      <div className="pointer-events-none absolute -left-1/4 top-1/4 h-[520px] w-[820px] -rotate-12 rounded-full bg-faro-beam opacity-[0.07] blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo variant="stacked" size="lg" />
          <p className="mt-4 text-sm text-content-muted">Virtualización de espacios en 360° · Panel de gestión</p>
          <div className="faro-line mt-5 w-40" />
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-4">
            <h1 className="font-display text-lg font-bold">Ingresar</h1>
            <p className="text-xs text-content-muted">
              {backend === "firebase" ? "Accedé con tu cuenta." : "Elegí un usuario para probar la experiencia según su rol (demo)."}
            </p>
          </div>

          {/* ===== Modo Firebase: email + Google ===== */}
          {backend === "firebase" ? (
            <div className="px-5 py-5">
              {(authError || err) && (
                <div className="mb-4 rounded-lg border border-spectrum-red/40 bg-spectrum-red/10 px-3 py-2 text-xs text-spectrum-red">
                  {err || authError}
                </div>
              )}
              <form onSubmit={handleEmail} className="space-y-4">
                <Field label="Email">
                  <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
                </Field>
                <Field label="Contraseña">
                  <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </Field>
                <button type="submit" className="btn-primary w-full" disabled={busy}>
                  {busy ? "Ingresando…" : "Ingresar"}
                </button>
              </form>

              <div className="my-4 flex items-center gap-2">
                <div className="h-px flex-1 bg-line" />
                <span className="text-xs text-content-subtle">o</span>
                <div className="h-px flex-1 bg-line" />
              </div>

              <button onClick={handleGoogle} className="btn-ghost w-full" disabled={busy}>
                <Icon name="globe" size={16} /> Entrar con Google
              </button>
            </div>
          ) : (
            /* ===== Modo demo (mock): selector de usuario ===== */
            <div className="divide-y divide-line">
              {loading && (
                <div className="flex items-center justify-center py-10">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-brand" />
                </div>
              )}
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handlePick(u.id)}
                  className="group flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-surface-overlay"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient font-display text-sm font-bold text-white">
                    {u.nombre.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{u.nombre}</span>
                    <span className="block truncate text-xs text-content-subtle">{u.email}</span>
                  </span>
                  <Badge tone={roleTone[u.role]}>{roleLabels[u.role]}</Badge>
                  <span className="text-content-subtle transition group-hover:translate-x-0.5 group-hover:text-brand">
                    <Icon name="arrowRight" size={16} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <EnvBadge />
          <p className="text-center text-xs text-content-subtle">
            {backend === "firebase" ? "El Faro 360 · datos en Firebase" : "Fase 1 · Datos mock en memoria"}
          </p>
        </div>
      </div>
    </div>
  );
}

function traducirError(msg: string): string {
  if (msg.includes("auth/invalid-credential") || msg.includes("auth/wrong-password") || msg.includes("auth/user-not-found"))
    return "Email o contraseña incorrectos.";
  if (msg.includes("auth/too-many-requests")) return "Demasiados intentos. Esperá unos minutos.";
  if (msg.includes("auth/popup-closed-by-user")) return "Cerraste la ventana de Google antes de terminar.";
  if (msg.includes("auth/invalid-email")) return "El email no es válido.";
  return msg;
}
