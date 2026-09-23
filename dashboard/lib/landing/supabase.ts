import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service role: bypassea RLS. El acceso lo autoriza Clerk en el
 * servidor antes de llegar acá. Importar esto desde el cliente rompe el build,
 * que es exactamente lo que queremos: la key nunca puede viajar al browser.
 */
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
