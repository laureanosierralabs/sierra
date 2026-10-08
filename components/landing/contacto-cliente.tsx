import { Instagram, Phone } from "@tailgrids/icons";
import { urlInstagram, urlWhatsapp, type Cliente } from "@/lib/landing/tipos";

const SIN_DATO = <span className="text-xs text-text-tertiary">—</span>;

const BOTON =
  "inline-flex items-center gap-1 rounded-md border border-card-border px-1.5 py-0.5 text-xs text-text-secondary transition-colors outline-none hover:bg-background-gray-secondary hover:text-text-primary focus-visible:ring-2 focus-visible:ring-primary-500 [&>svg]:size-3.5";

/**
 * Contacto del cliente vinculado. Se hereda, no se duplica: el dato vive en
 * la ficha del cliente y se edita en un solo lugar.
 */
export function ContactoCliente({ cliente }: { cliente?: Cliente }) {
  if (!cliente) return SIN_DATO;

  const wa = urlWhatsapp(cliente.phone);
  const ig = urlInstagram(cliente.instagram);

  if (!wa && !ig) return SIN_DATO;

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
          <Phone />
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
          <Instagram />
          IG
        </a>
      )}
    </span>
  );
}
