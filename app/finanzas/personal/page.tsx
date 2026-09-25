import { FinanzasVista } from "@/components/finanzas-vista";

export const dynamic = "force-dynamic";

export default function FinanzasPersonal() {
  return <FinanzasVista ambito="personal" titulo="Finanzas Personales" />;
}
