"use client";

import { useParams } from "next/navigation";
import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuoteWizard } from "@/components/presupuestos/QuoteWizard";
import { useStore } from "@/components/providers/StoreProvider";

export default function EditarPresupuestoPage() {
  const params = useParams();
  const { presupuestos } = useStore();
  const presupuesto = presupuestos.find((p) => p.id === params.id);

  return (
    <Guard module="presupuestos">
      <PageHeader title="Editar presupuesto" subtitle={presupuesto?.numero} />
      {presupuesto ? (
        <QuoteWizard initial={presupuesto} />
      ) : (
        <EmptyState icon="presupuestos" title="Presupuesto no encontrado" />
      )}
    </Guard>
  );
}
