/* Astrogalaxy — Interacciones de la landing
   1) Menú móvil  2) Conmutador del dashboard  3) Contadores animados */

// 1) Menú móvil
(function () {
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Cerrar el menú al pulsar un enlace
    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
})();

// 2) Conmutador del dashboard (Por grado / Individual)
(function () {
  var tabs = document.querySelectorAll('.dash-tab');
  var views = document.querySelectorAll('.ag-dashview');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var target = tab.getAttribute('data-view');
      tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
      views.forEach(function (v) {
        v.classList.toggle('show', v.getAttribute('data-view') === target);
      });
    });
  });
})();

// 3) Contadores animados (sección de estadísticas)
(function () {
  var nums = document.querySelectorAll('#stats [data-target]');
  var fmt = function (n) { return Math.round(n).toLocaleString('es-ES'); };
  var run = function (el) {
    var target = parseFloat(el.getAttribute('data-target'));
    if (!isFinite(target)) return;
    var dur = 1400, start = performance.now();
    var step = function (now) {
      var t = Math.min(1, (now - start) / dur);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(target * eased);
      if (t < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target);
    };
    requestAnimationFrame(step);
  };
  if ('IntersectionObserver' in window) {
    var seen = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !seen) {
          seen = true;
          nums.forEach(run);
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    var stats = document.getElementById('stats');
    if (stats) io.observe(stats);
  } else {
    nums.forEach(run);
  }
})();
