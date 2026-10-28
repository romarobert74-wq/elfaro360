"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getFirebase } from "@/lib/firebase";
import { useStore } from "@/components/providers/StoreProvider";

/**
 * Cantidad de selecciones NO leídas, en tiempo real (listener de Firestore).
 * Solo activo con backend Firebase y permiso para ver "pictures".
 */
export function useSeleccionesNoLeidas(): number {
  const { backend, can, currentUser } = useStore();
  const [count, setCount] = useState(0);
  const puede = backend === "firebase" && can("pictures", "view");

  useEffect(() => {
    if (!puede) {
      setCount(0);
      return;
    }
    const { db } = getFirebase();
    if (!db) return;
    const q = query(collection(db, "selecciones_pictures"), where("leida", "==", false));
    const unsub = onSnapshot(
      q,
      (snap) => setCount(snap.size),
      () => setCount(0)
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puede, currentUser?.id]);

  return count;
}
