/*
 * Script de visitas de sierra labs para landings de un lanzamiento.
 *
 *   <script async src="https://<panel>/t.js" data-k="<clave de la landing>"></script>
 *
 * - Avisa una visita por carga de página (el servidor cuenta un visitante por
 *   día). Sin cookies y sin identificar a la persona.
 * - Recuerda los UTM durante la sesión y los completa en los campos del
 *   formulario cuyo nombre contenga utm_source / utm_medium / utm_campaign /
 *   utm_content, para que el registro llegue con su fuente.
 * - Nunca rompe la landing: cualquier error se descarta en silencio.
 */
(function () {
  try {
    var script = document.currentScript;
    if (!script) return;
    var clave = script.getAttribute("data-k");
    if (!clave) return;

    var NOMBRES = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
    var consulta = new URLSearchParams(window.location.search);
    var utm = {};

    NOMBRES.forEach(function (nombre) {
      var valor = consulta.get(nombre);
      try {
        if (valor) window.sessionStorage.setItem("sl_" + nombre, valor);
        else valor = window.sessionStorage.getItem("sl_" + nombre);
      } catch {
        /* sessionStorage bloqueado: se sigue con lo que haya en la URL */
      }
      if (valor) utm[nombre] = String(valor).slice(0, 120);
    });

    function completarFormularios() {
      NOMBRES.forEach(function (nombre) {
        if (!utm[nombre]) return;
        var campos = document.querySelectorAll('input[name*="' + nombre + '"]');
        for (var i = 0; i < campos.length; i++) {
          if (!campos[i].value) campos[i].value = utm[nombre];
        }
      });
    }

    // Los formularios embebidos (MailerLite, GHL) se insertan después de cargar.
    completarFormularios();
    document.addEventListener("DOMContentLoaded", completarFormularios);
    window.setTimeout(completarFormularios, 1500);
    window.setTimeout(completarFormularios, 4000);

    var destino = new URL(script.src).origin + "/api/t";
    var cuerpo = JSON.stringify({ k: clave, r: document.referrer || "", u: utm });

    // sendBeacon con texto plano: no dispara preflight CORS ni frena la carga.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(destino, cuerpo);
    } else {
      fetch(destino, { method: "POST", body: cuerpo, keepalive: true, mode: "no-cors" });
    }
  } catch {
    /* la landing sigue funcionando aunque el conteo falle */
  }
})();
