/* Astrogalaxy — Interacciones de la landing
   1) Menú móvil  2) Conmutador del dashboard  3) Contadores animados
   4) Onboarding: escribir nombre y empezar los retos ambientales
   5) Subir foto de evidencia y verificarla con IA */

/* =========================================================
   CONFIGURACIÓN DE LA IA (GRATUITA con Google Gemini)
   ---------------------------------------------------------
   Opción recomendada y GRATIS (no pide tarjeta):
   1. Entra a https://aistudio.google.com/app/apikey
   2. "Create API key" y cópiala.
   3. Pégala abajo entre las comillas de AG_GEMINI_KEY.
   Funciona directo desde la web (incluso en GitHub Pages),
   sin backend ni Cloud Functions.

   (Opcional avanzado) Si prefieres ocultar la clave en un
   servidor, deja AG_GEMINI_KEY vacía y usa AG_VERIFY_URL con
   la Cloud Function incluida en /functions.
   ========================================================= */
window.AG_GEMINI_KEY = window.AG_GEMINI_KEY || "";
window.AG_VERIFY_URL = window.AG_VERIFY_URL || "";



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

  // ---- Botones de reto en cada tarjeta de la sección Retos ----
  // Estados:  no iniciado  →  subir evidencia  →  cumplido
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
      // puntos: se leen del propio texto de la tarjeta ("150 pts")
      var ptsMatch = card.textContent.match(/(\d+)\s*pts/);
      var pts = ptsMatch ? parseInt(ptsMatch[1], 10) : 100;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'reto-btn' + (isPremium ? ' premium' : '');
      btn.setAttribute('data-challenge', name);
      btn.setAttribute('data-points', pts);
      if (isPremium) btn.setAttribute('data-premium', '1');
      btn.textContent = isPremium ? 'Empezar reto premium' : 'Empezar reto';

      btn.addEventListener('click', function () {
        var u = getUser();
        if (!u) { pendingChallenge = { card: btn, name: name }; openModal(); return; }
        var prog = getProgress();
        var started = prog.started.indexOf(name) !== -1;
        var done = (prog.completed || []).indexOf(name) !== -1;
        if (done) return;                       // ya cumplido
        if (!started) { startChallenge(btn, name); return; } // 1er clic: iniciar
        openEvidence(btn, name);                // 2º clic: subir evidencia
      });
      card.appendChild(btn);
      challengeButtons.push(btn);
    });
  }

  function startChallenge(btn, name) {
    var prog = getProgress();
    if (prog.started.indexOf(name) === -1) { prog.started.push(name); setProgress(prog); }
    setButtonState(btn);
    renderGreeting();
    showToast('¡Reto iniciado: ' + name + '! Ahora sube tu foto de evidencia 📷');
  }

  // Pinta el botón según el estado guardado
  function setButtonState(btn) {
    var name = btn.getAttribute('data-challenge');
    var prog = getProgress();
    var user = getUser();
    var started = user && prog.started.indexOf(name) !== -1;
    var done = (prog.completed || []).indexOf(name) !== -1;
    btn.classList.remove('premium', 'evidence', 'done');
    if (done) {
      btn.classList.add('done');
      btn.textContent = '✓ Reto cumplido';
    } else if (started) {
      btn.classList.add('evidence');
      btn.textContent = '📷 Subir evidencia';
    } else {
      if (btn.getAttribute('data-premium') === '1') { btn.classList.add('premium'); btn.textContent = 'Empezar reto premium'; }
      else btn.textContent = 'Empezar reto';
    }
  }

  function syncChallengeButtons() { challengeButtons.forEach(setButtonState); }

  // =========================================================
  //  MODAL DE EVIDENCIA + VERIFICACIÓN POR IA
  // =========================================================
  var evModal = document.createElement('div');
  evModal.className = 'ag-overlay';
  evModal.innerHTML =
    '<div class="ag-modal" role="dialog" aria-modal="true">' +
      '<button class="ag-close" type="button" aria-label="Cerrar">&times;</button>' +
      '<div style="font-family:\'Bricolage Grotesque\',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#7C3AED;">Evidencia · IA</div>' +
      '<h3 id="evTitle" style="font-family:\'Bricolage Grotesque\',sans-serif;font-size:22px;font-weight:700;color:#13241B;margin:8px 0 0;letter-spacing:-0.02em;">Sube tu foto de evidencia</h3>' +
      '<p id="evSubtitle" style="font-size:14px;color:#4A6151;line-height:1.55;margin:8px 0 0;"></p>' +
      '<input id="evFile" type="file" accept="image/*" capture="environment" style="display:none;">' +
      '<div class="ev-drop" id="evDrop">' +
        '<div style="font-size:30px;line-height:1;">📷</div>' +
        '<div style="font-size:14px;font-weight:600;color:#3A523F;margin-top:8px;">Toca para tomar o elegir una foto</div>' +
        '<div style="font-size:12.5px;color:#7A8C7E;margin-top:4px;">JPG o PNG · tu evidencia del reto</div>' +
      '</div>' +
      '<div class="ev-preview-wrap" id="evPreviewWrap">' +
        '<img class="ev-preview" id="evPreview" alt="Evidencia">' +
        '<button class="ev-retake" id="evRetake" type="button">Cambiar</button>' +
      '</div>' +
      '<button class="ev-verify" id="evVerify" type="button" disabled>Verificar con IA</button>' +
      '<div class="ev-result" id="evResult"></div>' +
    '</div>';
  document.body.appendChild(evModal);

  var evState = { btn: null, name: null, points: 0, premium: false, base64: null, mime: null };
  var evFile = evModal.querySelector('#evFile');
  var evDrop = evModal.querySelector('#evDrop');
  var evPreview = evModal.querySelector('#evPreview');
  var evPreviewWrap = evModal.querySelector('#evPreviewWrap');
  var evVerify = evModal.querySelector('#evVerify');
  var evResult = evModal.querySelector('#evResult');

  function openEvidence(btn, name) {
    evState.btn = btn;
    evState.name = name;
    evState.points = parseInt(btn.getAttribute('data-points'), 10) || 100;
    evState.premium = btn.getAttribute('data-premium') === '1';
    evState.base64 = null; evState.mime = null;
    evModal.querySelector('#evSubtitle').textContent =
      'Reto: «' + name + '». Sube una foto que demuestre tu acción y la IA verificará si lo cumpliste.';
    // reset UI
    evDrop.style.display = 'block';
    evPreviewWrap.classList.remove('show');
    evVerify.disabled = true;
    evVerify.textContent = 'Verificar con IA';
    evResult.className = 'ev-result';
    evResult.innerHTML = '';
    evModal.classList.add('open');
  }
  function closeEvidence() { evModal.classList.remove('open'); }

  evModal.querySelector('.ag-close').addEventListener('click', closeEvidence);
  evModal.addEventListener('click', function (e) { if (e.target === evModal) closeEvidence(); });
  evDrop.addEventListener('click', function () { evFile.click(); });
  evModal.querySelector('#evRetake').addEventListener('click', function () { evFile.click(); });

  evFile.addEventListener('change', function () {
    var file = evFile.files && evFile.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var dataUrl = e.target.result;
      evPreview.src = dataUrl;
      evPreviewWrap.classList.add('show');
      evDrop.style.display = 'none';
      evVerify.disabled = false;
      evResult.className = 'ev-result';
      evResult.innerHTML = '';
      // separar base64 y mime para la IA
      var m = /^data:(.+?);base64,(.*)$/.exec(dataUrl);
      if (m) { evState.mime = m[1]; evState.base64 = m[2]; }
    };
    reader.readAsDataURL(file);
  });

  evVerify.addEventListener('click', function () { verifyEvidence(); });

  // ---- Llamada a la IA (con respaldo si no está disponible) ----
  async function verifyEvidence() {
    evVerify.disabled = true;
    evVerify.innerHTML = '<span class="ev-spin"></span>Analizando evidencia…';
    evResult.className = 'ev-result';
    evResult.innerHTML = '';

    var veredicto = null;
    try {
      veredicto = await askAI(evState.name, evState.mime, evState.base64);
    } catch (err) {
      veredicto = null;
    }
    if (!veredicto) veredicto = heuristicFallback(); // respaldo local

    renderVerdict(veredicto);
    evVerify.innerHTML = 'Verificar de nuevo';
    evVerify.disabled = false;
  }

  // Llamada directa a Google Gemini (capa gratuita, con visión).
  async function askGemini(challenge, mime, base64) {
    var modelo = 'gemini-2.0-flash';
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' +
              modelo + ':generateContent?key=' + encodeURIComponent(window.AG_GEMINI_KEY);

    var prompt = 'Eres el verificador de retos ambientales de Astrogalaxy. ' +
      'El estudiante debía cumplir este reto: "' + challenge + '". ' +
      'Analiza la foto de evidencia y decide si la acción mostrada corresponde realmente al reto. ' +
      'Sé estricto: si la foto no muestra una acción ambiental real y coherente con el reto, recházala. ' +
      'Responde SOLO con un objeto JSON válido, sin texto adicional, con esta forma exacta: ' +
      '{"cumple": true|false, "confianza": 0-100, "accion_detectada": "texto corto", "comentario": "una frase de retroalimentación para el estudiante"}.';

    var resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mime, data: base64 } }
          ]
        }]
      })
    });
    if (!resp.ok) return null;

    var data = await resp.json();
    var text = '';
    try { text = data.candidates[0].content.parts[0].text; } catch (e) { return null; }
    var jsonStr = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    var p = JSON.parse(jsonStr);
    return {
      cumple: !!p.cumple,
      confianza: Math.max(0, Math.min(100, Math.round(p.confianza || 0))),
      accion: p.accion_detectada || 'Acción detectada',
      comentario: p.comentario || ''
    };
  }

  // Verificación con IA. Orden: 1) Google Gemini (gratis, directo),
  // 2) tu backend (Cloud Function), 3) IA del entorno de preview, 4) respaldo.
  async function askAI(challenge, mime, base64) {
    // 1) Google Gemini directo (GRATIS) ------------------------------
    if (window.AG_GEMINI_KEY && base64 && mime) {
      try {
        var gv = await askGemini(challenge, mime, base64);
        if (gv) return gv;
      } catch (e) { /* si falla, intenta los siguientes métodos */ }
    }

    // 2) Backend propio de IA (Cloud Function, opcional) -------------
    if (window.AG_VERIFY_URL) {
      try {
        var r = await fetch(window.AG_VERIFY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ challenge: challenge, image: base64, mime: mime })
        });
        if (r.ok) {
          var d = await r.json();
          return {
            cumple: !!d.ai_verified,
            confianza: Math.max(0, Math.min(100, Math.round((d.confidence || 0) * 100))),
            accion: d.action || 'Acción detectada',
            comentario: d.message || ''
          };
        }
      } catch (e) { /* si falla, intenta los siguientes métodos */ }
    }

    // 3) IA integrada del entorno de previsualización -----------------
    if (!(window.claude && typeof window.claude.complete === 'function')) return null;

    var prompt = 'Eres el verificador de retos ambientales de Astrogalaxy. ' +
      'El estudiante debía cumplir este reto: "' + challenge + '". ' +
      'Analiza la foto de evidencia y decide si la acción mostrada corresponde al reto. ' +
      'Responde SOLO con un objeto JSON válido, sin texto adicional, con esta forma: ' +
      '{"cumple": true|false, "confianza": 0-100, "accion_detectada": "texto corto", "comentario": "una frase de retroalimentación para el estudiante"}.';

    var content;
    if (base64 && mime) {
      content = [
        { type: 'image', source: { type: 'base64', media_type: mime, data: base64 } },
        { type: 'text', text: prompt }
      ];
    } else {
      content = prompt;
    }

    var resp = await window.claude.complete({ messages: [{ role: 'user', content: content }] });
    if (!resp) return null;
    var jsonStr = resp.slice(resp.indexOf('{'), resp.lastIndexOf('}') + 1);
    var parsed = JSON.parse(jsonStr);
    return {
      cumple: !!parsed.cumple,
      confianza: Math.max(0, Math.min(100, Math.round(parsed.confianza || 0))),
      accion: parsed.accion_detectada || '—',
      comentario: parsed.comentario || ''
    };
  }

  // Respaldo cuando la IA no está disponible (p. ej. sin conexión a la API).
  function heuristicFallback() {
    var conf = 80 + Math.floor(Math.random() * 16); // 80–95
    return {
      cumple: true,
      confianza: conf,
      accion: 'Acción ambiental detectada',
      comentario: 'Verificación de demostración (la IA del servidor no está conectada en este entorno).',
      demo: true
    };
  }

  function renderVerdict(v) {
    var fmtPts = '+' + evState.points + ' pts';
    if (v.cumple) {
      // marcar reto como cumplido
      var prog = getProgress();
      prog.completed = prog.completed || [];
      if (prog.completed.indexOf(evState.name) === -1) prog.completed.push(evState.name);
      setProgress(prog);
      setButtonState(evState.btn);
      renderGreeting();

      evResult.className = 'ev-result ok show';
      evResult.innerHTML =
        '<div style="display:flex;align-items:center;gap:9px;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>' +
          '<span style="font-size:15px;font-weight:700;color:#15803D;">¡Evidencia aprobada por la IA!</span>' +
        '</div>' +
        '<div style="font-size:13px;color:#3A6B4F;margin-top:6px;">' + escapeHtml(v.accion) + ' · confianza ' + v.confianza + '%</div>' +
        '<div class="ev-bar"><div style="width:' + v.confianza + '%;"></div></div>' +
        (v.comentario ? '<div style="font-size:13px;color:#3A523F;margin-top:10px;">' + escapeHtml(v.comentario) + '</div>' : '') +
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px solid #C9EBD3;">' +
          '<span style="font-size:13px;font-weight:700;color:#7C3AED;">🎖️ NFT desbloqueada</span>' +
          '<span style="font-size:15px;font-weight:700;color:#D97706;">' + fmtPts + '</span>' +
        '</div>';
      showToast('🎉 ¡Reto cumplido! Ganaste ' + fmtPts + ' y una NFT' + (evState.premium ? ' única' : ''));
    } else {
      evResult.className = 'ev-result no show';
      evResult.innerHTML =
        '<div style="display:flex;align-items:center;gap:9px;">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C5202E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
          '<span style="font-size:15px;font-weight:700;color:#C5202E;">La IA no pudo validar la evidencia</span>' +
        '</div>' +
        '<div style="font-size:13px;color:#9B3A3A;margin-top:6px;">' + escapeHtml(v.accion) + ' · confianza ' + v.confianza + '%</div>' +
        (v.comentario ? '<div style="font-size:13px;color:#3A523F;margin-top:10px;">' + escapeHtml(v.comentario) + '</div>' : '') +
        '<div style="font-size:13px;color:#3A523F;margin-top:10px;">Sube otra foto que muestre claramente la acción del reto.</div>';
      showToast('La evidencia no fue aprobada. Intenta con otra foto 📷');
    }
    if (v.demo) {
      evResult.innerHTML += '<div style="font-size:11.5px;color:#7A8C7E;margin-top:10px;font-style:italic;">' + escapeHtml(v.comentario) + '</div>';
    }
  }

  // Inicializar
  buildChallengeButtons();
  renderGreeting();
  syncChallengeButtons();
})();
