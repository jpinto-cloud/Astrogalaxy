/* Astrogalaxy — Interacciones de la landing
   1) Menú móvil  2) Conmutador del dashboard  3) Contadores animados
   4) Onboarding: escribir nombre y empezar los retos ambientales */

// 1) Menú móvil
(function () {
  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobileMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
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

// 4) ONBOARDING — escribir nombre y empezar los retos ambientales
(function () {
  // ---- Estado persistente (se guarda en el navegador) ----
  var USER_KEY = 'ag_user';
  var PROGRESS_KEY = 'ag_progress';

  function getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch (e) { return null; }
  }
  function setUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
  function getProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { started: [] }; }
    catch (e) { return { started: [] }; }
  }
  function setProgress(p) { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }

  var pendingChallenge = null; // reto que el usuario quiso empezar antes de registrarse

  // ---- Crear el modal, el aviso y el saludo (inyectados por JS) ----
  var modal = document.createElement('div');
  modal.className = 'ag-overlay';
  modal.innerHTML =
    '<div class="ag-modal" role="dialog" aria-modal="true" aria-labelledby="agModalTitle">' +
      '<button class="ag-close" type="button" aria-label="Cerrar">&times;</button>' +
      '<div style="font-family:\'Bricolage Grotesque\',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0D9488;">Astrogalaxy</div>' +
      '<h3 id="agModalTitle" style="font-family:\'Bricolage Grotesque\',sans-serif;font-size:24px;font-weight:700;color:#13241B;margin:8px 0 0;letter-spacing:-0.02em;">Empieza tus retos ambientales</h3>' +
      '<p style="font-size:14.5px;color:#4A6151;line-height:1.55;margin:8px 0 0;">Escribe tu nombre para crear tu perfil y comenzar a sumar puntos y NFTs.</p>' +
      '<label class="ag-label" for="agName">Tu nombre</label>' +
      '<input class="ag-input" id="agName" type="text" placeholder="Ej. Valentina Ríos" autocomplete="name" maxlength="40">' +
      '<label class="ag-label">¿Cómo quieres participar?</label>' +
      '<div class="ag-mode">' +
        '<button type="button" data-mode="individual" class="sel">Individual</button>' +
        '<button type="button" data-mode="grado">Por grado</button>' +
      '</div>' +
      '<input class="ag-input" id="agGrade" type="text" placeholder="Tu grado y colegio (ej. 5°B · Colegio San Martín)" maxlength="60" style="display:none;">' +
      '<div class="ag-error" id="agError">Por favor escribe tu nombre para continuar.</div>' +
      '<button class="ag-primary" id="agSubmit" type="button">Crear perfil y empezar</button>' +
    '</div>';
  document.body.appendChild(modal);

  var toast = document.createElement('div');
  toast.className = 'ag-toast';
  document.body.appendChild(toast);

  var toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('show'); }, 2800);
  }

  // Saludo personalizado al inicio de la sección de retos
  var greeting = document.createElement('div');
  greeting.className = 'ag-greeting';
  greeting.id = 'agGreeting';
  var retos = document.getElementById('retos');
  if (retos) {
    // se inserta justo después del encabezado (primer hijo) de la sección
    var header = retos.firstElementChild;
    if (header && header.nextSibling) retos.insertBefore(greeting, header.nextSibling);
    else retos.appendChild(greeting);
  }

  function renderGreeting() {
    var u = getUser();
    if (!u) { greeting.classList.remove('show'); return; }
    var prog = getProgress();
    var modoTxt = u.mode === 'grado' ? ('Grado: ' + (u.grade || '—')) : 'Modo individual';
    greeting.innerHTML =
      '<span style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#16A34A,#0D9488);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:17px;flex-shrink:0;">' +
        (u.name.trim().charAt(0).toUpperCase() || '🌱') + '</span>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-family:\'Bricolage Grotesque\',sans-serif;font-size:16px;font-weight:700;color:#13241B;">¡Hola, ' + escapeHtml(u.name) + '! 🌱</div>' +
        '<div style="font-size:13px;color:#4A6151;">' + modoTxt + ' · ' + prog.started.length + ' reto(s) iniciado(s)</div>' +
      '</div>' +
      '<button type="button" id="agReset" style="border:1px solid #CBDAC4;background:#fff;color:#5B7A66;font-size:12.5px;font-weight:600;padding:8px 12px;border-radius:10px;cursor:pointer;font-family:\'DM Sans\',sans-serif;flex-shrink:0;">Salir</button>';
    greeting.classList.add('show');
    var resetBtn = document.getElementById('agReset');
    if (resetBtn) resetBtn.addEventListener('click', function () {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PROGRESS_KEY);
      renderGreeting();
      syncChallengeButtons();
      showToast('Sesión cerrada. ¡Vuelve pronto!');
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---- Abrir / cerrar el modal ----
  var selectedMode = 'individual';
  function openModal() {
    modal.classList.add('open');
    var u = getUser();
    var nameInput = document.getElementById('agName');
    if (u) nameInput.value = u.name;
    setTimeout(function () { nameInput.focus(); }, 50);
  }
  function closeModal() {
    modal.classList.remove('open');
    document.getElementById('agError').classList.remove('show');
  }

  modal.querySelector('.ag-close').addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  // Selector de modo (individual / por grado)
  modal.querySelectorAll('.ag-mode button').forEach(function (b) {
    b.addEventListener('click', function () {
      selectedMode = b.getAttribute('data-mode');
      modal.querySelectorAll('.ag-mode button').forEach(function (x) {
        x.classList.toggle('sel', x === b);
      });
      document.getElementById('agGrade').style.display = selectedMode === 'grado' ? 'block' : 'none';
    });
  });

  // Enviar el formulario
  function submitForm() {
    var name = document.getElementById('agName').value.trim();
    var grade = document.getElementById('agGrade').value.trim();
    if (!name) {
      document.getElementById('agError').classList.add('show');
      document.getElementById('agName').focus();
      return;
    }
    setUser({ name: name, mode: selectedMode, grade: grade });
    closeModal();
    renderGreeting();
    syncChallengeButtons();

    if (pendingChallenge) {
      startChallenge(pendingChallenge.card, pendingChallenge.name);
      pendingChallenge = null;
    } else {
      showToast('¡Bienvenido/a, ' + name + '! Tu perfil está listo 🌱');
      if (retos) retos.scrollIntoView({ behavior: 'smooth' });
    }
  }
  document.getElementById('agSubmit').addEventListener('click', submitForm);
  document.getElementById('agName').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitForm();
  });

  // ---- Hook de los botones "Empezar" de la página ----
  [].slice.call(document.querySelectorAll('a')).forEach(function (a) {
    var txt = (a.textContent || '').trim().toLowerCase();
    if (txt.indexOf('empezar') === 0 || txt.indexOf('hazte premium') === 0) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    }
  });

  // ---- Botones "Empezar reto" en cada tarjeta de la sección Retos ----
  var challengeButtons = [];
  function buildChallengeButtons() {
    if (!retos) return;
    var grid = retos.lastElementChild; // el grid de tarjetas
    if (!grid) return;
    [].slice.call(grid.children).forEach(function (card) {
      var h3 = card.querySelector('h3');
      if (!h3) return;
      var name = h3.textContent.trim();
      var isPremium = /NFT única/i.test(card.textContent);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'reto-btn' + (isPremium ? ' premium' : '');
      btn.setAttribute('data-challenge', name);
      btn.textContent = isPremium ? 'Empezar reto premium' : 'Empezar reto';
      btn.addEventListener('click', function () {
        var u = getUser();
        if (!u) {
          pendingChallenge = { card: btn, name: name };
          openModal();
          return;
        }
        startChallenge(btn, name);
      });
      card.appendChild(btn);
      challengeButtons.push(btn);
    });
  }

  function startChallenge(btn, name) {
    var prog = getProgress();
    if (prog.started.indexOf(name) === -1) {
      prog.started.push(name);
      setProgress(prog);
    }
    markStarted(btn);
    renderGreeting();
    showToast('¡Reto iniciado: ' + name + '! Sube tu foto de evidencia para ganar puntos 📷');
  }

  function markStarted(btn) {
    btn.classList.add('started');
    btn.classList.remove('premium');
    btn.textContent = '✓ Reto iniciado';
  }

  function syncChallengeButtons() {
    var prog = getProgress();
    var user = getUser();
    challengeButtons.forEach(function (btn) {
      var name = btn.getAttribute('data-challenge');
      var isPremium = /premium/i.test(btn.textContent) || btn.classList.contains('premium');
      if (user && prog.started.indexOf(name) !== -1) {
        markStarted(btn);
      } else {
        btn.classList.remove('started');
        var premiumCard = btn.getAttribute('data-premium') === '1';
        btn.textContent = premiumCard ? 'Empezar reto premium' : 'Empezar reto';
      }
    });
  }

  // Inicializar
  buildChallengeButtons();
  // marcar las tarjetas premium para restaurar bien su texto
  challengeButtons.forEach(function (btn) {
    if (btn.classList.contains('premium')) btn.setAttribute('data-premium', '1');
  });
  renderGreeting();
  syncChallengeButtons();
})();
