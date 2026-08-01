"use client";

import { Guard } from "@/components/layout/Guard";
import { PageHeader } from "@/components/ui/PageHeader";
import { QuoteWizard } from "@/components/presupuestos/QuoteWizard";

export default function NuevoPresupuestoPage() {
  return (
    <Guard module="presupuestos">
      <PageHeader title="Nuevo presupuesto" subtitle="Wizard de cotización" />
      <QuoteWizard />
    </Guard>
  );
}
