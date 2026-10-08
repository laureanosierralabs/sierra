import Image from "next/image";
import {
  Buildings11,
  CheckCircle1,
  DashboardSquare1,
  FileText,
  Folder1,
  Home,
  IdCard,
  Rocket1,
  TrendUp2,
  UserCircle1,
  UserMultiple1,
  UserMultiple4,
  Wallet2,
} from "@tailgrids/icons";

/**
 * Clave de ícono -> componente. Las claves `LayoutGrid`, `FolderKanban`, ...
 * son las que ya trae `lib/unidades.ts` en `secciones[].icono`.
 */
const ICONOS = {
  inicio: Home,
  finanzas: Wallet2,
  equipo: UserMultiple1,
  "landing-pages": Rocket1,
  "marca-personal": UserCircle1,
  "wonder-digital": Buildings11,
  LayoutGrid: DashboardSquare1,
  FolderKanban: Folder1,
  ListChecks: CheckCircle1,
  Users: UserMultiple4,
  FileText,
  UserCog: IdCard,
  Wallet: Wallet2,
  ChartLine: TrendUp2,
} as const;

/** Unidades con logo propio en vez de ícono. */
const LOGOS: Record<string, string> = {
  "synous-ai": "/logo-synous.png",
};

export function NavIcon({ name }: { name: string }) {
  const logo = LOGOS[name];
  if (logo) {
    return <Image src={logo} alt="" width={18} height={18} className="size-4.5 shrink-0 rounded-sm" />;
  }

  const Icon = ICONOS[name as keyof typeof ICONOS] ?? DashboardSquare1;
  return <Icon className="size-4.5 shrink-0" aria-hidden />;
}
