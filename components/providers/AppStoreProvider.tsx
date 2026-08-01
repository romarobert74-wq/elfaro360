"use client";

import dynamic from "next/dynamic";
import { StoreProvider } from "./StoreProvider";
import { isFirebaseBackend } from "@/lib/backend";

// El provider de Firebase se carga de forma perezosa: en modo mock (default)
// su código nunca entra al bundle inicial.
const FirebaseStoreProvider = dynamic(
  () => import("./FirebaseStoreProvider").then((m) => m.FirebaseStoreProvider),
  { ssr: false }
);

/** Elige el backend de datos según NEXT_PUBLIC_DATA_BACKEND (mock | firebase). */
export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  if (isFirebaseBackend) {
    return <FirebaseStoreProvider>{children}</FirebaseStoreProvider>;
  }
  return <StoreProvider>{children}</StoreProvider>;
}
