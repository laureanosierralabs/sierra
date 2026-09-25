import { AtSign, Phone } from "lucide-react";
import { urlInstagram, urlWhatsapp, type Cliente } from "@/lib/landing/tipos";

const BOTON =
  "inline-flex items-center gap-1 rounded-md border border-line px-1.5 py-0.5 text-[0.6875rem] text-text-2 transition-colors hover:border-line-strong hover:text-text";

/**
 * Contacto del cliente vinculado. Se hereda, no se duplica: el dato vive en
 * la ficha del cliente y se edita en un solo lugar.
 */
export function ContactoCliente({ cliente }: { cliente?: Cliente }) {
  if (!cliente) return <span className="text-xs text-text-3">—</span>;

  const wa = urlWhatsapp(cliente.phone);
  const ig = urlInstagram(cliente.instagram);

  if (!wa && !ig) return <span className="text-xs text-text-3">—</span>;

  return (
    <span className="flex items-center gap-1.5">
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          title={cliente.phone ?? "WhatsApp"}
          className={BOTON}
        >
          <Phone className="size-3" />
          WA
        </a>
      )}
      {ig && (
        <a
          href={ig}
          target="_blank"
          rel="noopener noreferrer"
          title={cliente.instagram ?? "Instagram"}
          className={BOTON}
        >
          <AtSign className="size-3" />
          IG
        </a>
      )}
    </span>
  );
}
